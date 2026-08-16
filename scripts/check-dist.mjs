import { access, readFile, stat } from "node:fs/promises";

const required = ["dist/cli.js", "dist/action.cjs", "dist/library.js"];
for (const file of required) {
  await access(file);
  const info = await stat(file);
  if (info.size < 1_000) throw new Error(`${file} is unexpectedly small`);
}

const action = await readFile("action.yml", "utf8");
if (!action.includes("using: node24")) throw new Error("action.yml must use node24");
if (!action.includes("main: dist/action.cjs")) throw new Error("action.yml points at the wrong bundle");

const cli = await readFile("dist/cli.js", "utf8");
if (!cli.startsWith("#!/usr/bin/env node")) throw new Error("CLI bundle has no shebang");

for (const workflow of [".github/workflows/ci.yml", ".github/workflows/example-matrix.yml"]) {
  const source = await readFile(workflow, "utf8");
  for (const line of source.split("\n").map((entry) => entry.trim().replace(/^-\s+/, "")).filter((entry) => entry.startsWith("uses:"))) {
    const target = line.slice("uses:".length).trim().split(/\s+/)[0];
    if (target === "./") continue;
    if (!/@[a-f0-9]{40}$/.test(target)) throw new Error(`${workflow} contains an unpinned action: ${target}`);
  }
}

for (const jsonFile of ["fixtures/channels.json", "examples/channel-parity.example.json", "schema/channel-parity.schema.json"]) {
  JSON.parse(await readFile(jsonFile, "utf8"));
}

console.log("Distribution bundle check: PASS");
