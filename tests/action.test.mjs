import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");

function run(file, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("close", (exitCode) => resolve({ exitCode, stdout, stderr }));
  });
}

test("bundled GitHub Action writes outputs and a readable step summary", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "parity-action-"));
  try {
    const outputFile = path.join(temporary, "github-output.txt");
    const summaryFile = path.join(temporary, "summary.md");
    await writeFile(outputFile, "", "utf8");
    await writeFile(summaryFile, "", "utf8");
    const result = await run(process.execPath, [path.join(root, "dist", "action.cjs")], {
      cwd: root,
      env: {
        ...process.env,
        GITHUB_ACTIONS: "true",
        GITHUB_OUTPUT: outputFile,
        GITHUB_STEP_SUMMARY: summaryFile,
        INPUT_CONFIG: path.join(root, "fixtures", "channels.json"),
        "INPUT_OUTPUT-DIRECTORY": path.join(temporary, "reports"),
        INPUT_CHANNEL: "good",
        "INPUT_FAIL-ON": "unknown"
      }
    });
    assert.equal(result.exitCode, 0, result.stderr);
    const outputs = await readFile(outputFile, "utf8");
    const summary = await readFile(summaryFile, "utf8");
    assert.match(outputs, /result<<[\s\S]*PASS/);
    assert.match(outputs, /report-json<</);
    assert.match(outputs, /report-markdown<</);
    assert.match(summary, /Overall result: PASS/);
    assert.match(summary, /Known good channel/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("CLI help works without configuration", async () => {
  const result = await run(process.execPath, [path.join(root, "dist", "cli.js"), "--help"], { cwd: root, env: process.env });
  assert.equal(result.exitCode, 0);
  assert.match(result.stdout, /--config/);
});
