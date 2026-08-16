import { readFile } from "node:fs/promises";

const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
const allowed = new Set(["Apache-2.0", "MIT"]);
const failures = [];
const licenses = new Set();

for (const [location, metadata] of Object.entries(lock.packages ?? {})) {
  if (!location) continue;
  const license = metadata.license;
  if (typeof license !== "string" || !allowed.has(license)) failures.push(`${location}: ${license ?? "missing license"}`);
  else licenses.add(license);
}

if (failures.length) throw new Error(`Unapproved or missing dependency licenses:\n${failures.join("\n")}`);
console.log(`Dependency license check: PASS (${[...licenses].sort().join(", ")})`);
