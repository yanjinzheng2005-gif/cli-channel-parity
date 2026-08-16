#!/usr/bin/env node
import { chmod, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

function parse(argv) {
  const [action, ...rest] = argv;
  const options = { action };
  while (rest.length) {
    const flag = rest.shift();
    const value = rest.shift();
    if (!flag?.startsWith("--") || value === undefined) throw new Error(`Invalid fixture argument: ${flag ?? "missing"}`);
    options[flag.slice(2)] = value;
  }
  return options;
}

async function writeExecutable(directory, name, version, mode) {
  await mkdir(directory, { recursive: true });
  const body = `#!/usr/bin/env node
const version = ${JSON.stringify(version)};
const mode = ${JSON.stringify(mode)};
const arg = process.argv[2] ?? "";
if (arg === "--version") { console.log("parity-fixture v" + version); process.exit(0); }
if (arg === "--help") {
  if (mode === "hang-launch") setInterval(() => {}, 1000);
  else { console.log("parity-fixture help"); process.exit(0); }
} else { console.log("parity-fixture ready"); }
`;
  const script = path.join(directory, `${name}.mjs`);
  await writeFile(script, body, "utf8");
  if (process.platform === "win32") {
    const wrapper = path.join(directory, `${name}.cmd`);
    await writeFile(wrapper, `@echo off\r\nnode "%~dp0${name}.mjs" %*\r\n`, "utf8");
  } else {
    const executable = path.join(directory, name);
    await writeFile(executable, body, "utf8");
    await chmod(executable, 0o755);
  }
}

const options = parse(process.argv.slice(2));
const root = path.resolve(options.root ?? ".");
const name = options.executable ?? "parity-fixture";
const mode = options.mode ?? "good";
const version = options.version ?? "1.2.0";
const executableSuffix = process.platform === "win32" ? ".cmd" : "";
const executable = path.join(root, "bin", `${name}${executableSuffix}`);
const executableScript = path.join(root, "bin", `${name}.mjs`);
const helper = path.join(root, "share", "parity-helper.txt");

if (options.action === "install") {
  if (mode === "hard-fail") {
    console.error("package metadata is invalid; installation cannot continue");
    process.exit(17);
  }
  if (mode === "transient-fail") {
    console.error("ETIMEDOUT while contacting the public package registry");
    process.exit(18);
  }
  await writeExecutable(path.join(root, "bin"), name, version, mode);
  if (mode === "path-shadow") await writeExecutable(path.join(root, "old-bin"), name, "0.9.0", "good");
  if (mode !== "missing-helper") {
    await mkdir(path.dirname(helper), { recursive: true });
    await writeFile(helper, "fixture helper\n", "utf8");
  }
  console.log(`installed ${name} ${version} with fixture-super-secret`);
} else if (options.action === "uninstall") {
  if (mode !== "residue") await rm(helper, { force: true });
  await rm(executable, { force: true });
  await rm(executableScript, { force: true });
  await rm(path.join(root, "old-bin", `${name}${executableSuffix}`), { force: true });
  await rm(path.join(root, "old-bin", `${name}.mjs`), { force: true });
  console.log(`uninstalled ${name}`);
} else {
  throw new Error(`Unknown fixture action: ${options.action}`);
}
