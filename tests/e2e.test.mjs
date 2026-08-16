import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { markdownReport, runParity, writeReports } from "../dist/library.js";

const root = path.resolve(import.meta.dirname, "..");
const configPath = path.join(root, "fixtures", "channels.json");

const expected = {
  good: "PASS",
  "same-version": "PASS",
  "stale-version": "FAIL",
  "launch-hang": "FAIL",
  "path-shadow": "FAIL",
  "helper-missing": "FAIL",
  "uninstall-residue": "FAIL",
  "hard-install-failure": "FAIL",
  "transient-install-failure": "UNKNOWN",
  "no-expected-version": "UNKNOWN"
};

test("ten controlled fixtures produce their gold-standard verdicts", async () => {
  const outputDirectory = await mkdtemp(path.join(os.tmpdir(), "parity-e2e-output-"));
  try {
    const report = await runParity({ configPath, outputDirectory });
    assert.equal(report.channels.length, 10);
    for (const channel of report.channels) {
      assert.equal(
        channel.verdict,
        expected[channel.id],
        `${channel.id}\n${JSON.stringify({
          verdict: channel.verdict,
          executableMatches: channel.executableMatches,
          checks: channel.checks.map(({ id, verdict, classification, evidence }) => ({ id, verdict, classification, evidence }))
        }, null, 2)}`
      );
      for (const check of channel.checks.filter((entry) => entry.verdict === "FAIL")) {
        assert.ok(check.rerunCommand, `${channel.id}/${check.id} has no rerun command`);
      }
    }
    assert.equal(report.channels.find((entry) => entry.id === "launch-hang").checks.find((entry) => entry.id === "launch").evidence.includes("timed out: yes"), true);
    const shadow = report.channels.find((entry) => entry.id === "path-shadow");
    assert.equal(shadow.executableMatches.length, 2);
    assert.match(shadow.executableMatches[0], /old-bin/);
    assert.match(shadow.executableMatches[1], /bin/);
    const residue = report.channels.find((entry) => entry.id === "uninstall-residue").checks.find((entry) => entry.id === "residue");
    assert.match(residue.evidence.join("\n"), /bytes/);
    const transient = report.channels.find((entry) => entry.id === "transient-install-failure").checks.find((entry) => entry.id === "install");
    assert.equal(transient.classification, "TRANSIENT_ENVIRONMENT");

    const files = await writeReports(report, outputDirectory);
    const json = await readFile(files.jsonPath, "utf8");
    const markdown = await readFile(files.markdownPath, "utf8");
    assert.equal(JSON.parse(json).verdict, report.verdict);
    assert.match(markdown, new RegExp(`Overall result: ${report.verdict}`));
    assert.equal(markdown, `${markdownReport(report)}\n`);
    assert.equal(/[ \t]+$/m.test(markdown), false);
    assert.equal(markdown.endsWith("\n\n"), false);
    assert.equal(json.includes("fixture-super-secret"), false);
    assert.equal(markdown.includes("fixture-super-secret"), false);
    assert.equal(json.includes(os.homedir()), false);
    assert.equal(markdown.includes(os.homedir()), false);
    assert.match(markdown, /does not represent every user machine/i);
  } finally {
    await rm(outputDirectory, { recursive: true, force: true });
  }
});
