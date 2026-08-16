"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/action.ts
var import_promises5 = require("node:fs/promises");
var import_node_path5 = __toESM(require("node:path"), 1);

// src/core.ts
var import_promises3 = require("node:fs/promises");
var import_node_os2 = __toESM(require("node:os"), 1);
var import_node_path3 = __toESM(require("node:path"), 1);

// src/config.ts
var import_promises = require("node:fs/promises");
function object(value, at) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${at} must be an object`);
  return value;
}
function text(value, at) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${at} must be a non-empty string`);
  return value;
}
function optionalText(value, at) {
  return value === void 0 ? void 0 : text(value, at);
}
function stringMap(value, at) {
  if (value === void 0) return void 0;
  const source = object(value, at);
  const result = {};
  for (const [key, entry] of Object.entries(source)) result[key] = text(entry, `${at}.${key}`);
  return result;
}
function stringArray(value, at) {
  if (value === void 0) return void 0;
  if (!Array.isArray(value)) throw new Error(`${at} must be an array`);
  return value.map((entry, index) => text(entry, `${at}[${index}]`));
}
function positiveInteger(value, at) {
  if (value === void 0) return void 0;
  if (!Number.isInteger(value) || Number(value) <= 0) throw new Error(`${at} must be a positive integer`);
  return Number(value);
}
function command(value, at) {
  const source = object(value, at);
  const argv = stringArray(source.argv, `${at}.argv`);
  if (!argv?.length) throw new Error(`${at}.argv must contain at least one item`);
  const allowedExitCodes = source.allowedExitCodes === void 0 ? void 0 : (() => {
    if (!Array.isArray(source.allowedExitCodes) || !source.allowedExitCodes.every(Number.isInteger)) {
      throw new Error(`${at}.allowedExitCodes must contain integers`);
    }
    return source.allowedExitCodes;
  })();
  const result = { argv };
  const cwd = optionalText(source.cwd, `${at}.cwd`);
  const env = stringMap(source.env, `${at}.env`);
  const timeoutMs = positiveInteger(source.timeoutMs, `${at}.timeoutMs`);
  const maxOutputBytes = positiveInteger(source.maxOutputBytes, `${at}.maxOutputBytes`);
  if (cwd !== void 0) result.cwd = cwd;
  if (env !== void 0) result.env = env;
  if (timeoutMs !== void 0) result.timeoutMs = timeoutMs;
  if (maxOutputBytes !== void 0) result.maxOutputBytes = maxOutputBytes;
  if (allowedExitCodes !== void 0) result.allowedExitCodes = allowedExitCodes;
  return result;
}
function optionalCommand(value, at) {
  return value === void 0 ? void 0 : command(value, at);
}
function channel(value, index) {
  const at = `channels[${index}]`;
  const source = object(value, at);
  const result = {
    id: text(source.id, `${at}.id`),
    executable: text(source.executable, `${at}.executable`),
    install: command(source.install, `${at}.install`)
  };
  const label = optionalText(source.label, `${at}.label`);
  const expectedVersion = optionalText(source.expectedVersion, `${at}.expectedVersion`);
  const expectedExecutablePath = optionalText(source.expectedExecutablePath, `${at}.expectedExecutablePath`);
  const version = optionalCommand(source.version, `${at}.version`);
  const launch = optionalCommand(source.launch, `${at}.launch`);
  const uninstall = optionalCommand(source.uninstall, `${at}.uninstall`);
  const residuePaths = stringArray(source.residuePaths, `${at}.residuePaths`);
  const env = stringMap(source.env, `${at}.env`);
  const transientPatterns = stringArray(source.transientPatterns, `${at}.transientPatterns`);
  if (label !== void 0) result.label = label;
  if (expectedVersion !== void 0) result.expectedVersion = expectedVersion;
  if (expectedExecutablePath !== void 0) result.expectedExecutablePath = expectedExecutablePath;
  if (version !== void 0) result.version = version;
  if (launch !== void 0) result.launch = launch;
  if (uninstall !== void 0) result.uninstall = uninstall;
  if (residuePaths !== void 0) result.residuePaths = residuePaths;
  if (env !== void 0) result.env = env;
  if (transientPatterns !== void 0) result.transientPatterns = transientPatterns;
  if (source.pathPolicy !== void 0) {
    if (!["report", "single", "first-must-match"].includes(String(source.pathPolicy))) {
      throw new Error(`${at}.pathPolicy must be report, single, or first-must-match`);
    }
    result.pathPolicy = source.pathPolicy;
  }
  if (source.helpers !== void 0) {
    if (!Array.isArray(source.helpers)) throw new Error(`${at}.helpers must be an array`);
    result.helpers = source.helpers.map((entry, helperIndex) => {
      const helper = object(entry, `${at}.helpers[${helperIndex}]`);
      return {
        name: text(helper.name, `${at}.helpers[${helperIndex}].name`),
        path: text(helper.path, `${at}.helpers[${helperIndex}].path`),
        required: helper.required === void 0 ? true : Boolean(helper.required)
      };
    });
  }
  return result;
}
async function loadConfig(configPath) {
  let raw;
  try {
    raw = JSON.parse(await (0, import_promises.readFile)(configPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read JSON config ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const source = object(raw, "config");
  if (source.schemaVersion !== 1) throw new Error("config.schemaVersion must be 1");
  if (!Array.isArray(source.channels) || source.channels.length === 0) throw new Error("config.channels must not be empty");
  const channels = source.channels.map(channel);
  const ids = /* @__PURE__ */ new Set();
  for (const entry of channels) {
    if (ids.has(entry.id)) throw new Error(`Duplicate channel id: ${entry.id}`);
    ids.add(entry.id);
  }
  const result = {
    schemaVersion: 1,
    product: text(source.product, "config.product"),
    channels
  };
  const expectedVersion = optionalText(source.expectedVersion, "config.expectedVersion");
  const redactions = stringArray(source.redactions, "config.redactions");
  if (expectedVersion !== void 0) result.expectedVersion = expectedVersion;
  if (redactions !== void 0) result.redactions = redactions;
  if (source.defaults !== void 0) {
    const defaults = object(source.defaults, "config.defaults");
    result.defaults = {};
    const timeoutMs = positiveInteger(defaults.timeoutMs, "config.defaults.timeoutMs");
    const maxOutputBytes = positiveInteger(defaults.maxOutputBytes, "config.defaults.maxOutputBytes");
    if (timeoutMs !== void 0) result.defaults.timeoutMs = timeoutMs;
    if (maxOutputBytes !== void 0) result.defaults.maxOutputBytes = maxOutputBytes;
  }
  return result;
}

// src/process.ts
var import_node_child_process = require("node:child_process");
function windowsCommand(argv) {
  const [file = "", ...args] = argv;
  if (process.platform !== "win32" || !/\.(?:cmd|bat)$/i.test(file)) return { file, args };
  const quote = (value) => `"${value.replace(/"/g, '\\"')}"`;
  return { file: process.env.ComSpec ?? "cmd.exe", args: ["/d", "/s", "/c", [quote(file), ...args.map(quote)].join(" ")] };
}
async function execute(spec, context) {
  const started = Date.now();
  const timeoutMs = spec.timeoutMs ?? context.defaultTimeoutMs;
  const maxBytes = spec.maxOutputBytes ?? context.defaultMaxOutputBytes;
  const cwd = spec.cwd ?? context.cwd;
  const command2 = windowsCommand(spec.argv);
  let stdout = "";
  let stderr = "";
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let truncated = false;
  let timedOut = false;
  return await new Promise((resolve) => {
    let settled = false;
    let child;
    try {
      child = (0, import_node_child_process.spawn)(command2.file, command2.args, {
        cwd,
        env: { ...context.env, ...spec.env },
        shell: false,
        detached: process.platform !== "win32",
        stdio: ["ignore", "pipe", "pipe"]
      });
    } catch (error) {
      resolve({
        argv: spec.argv,
        cwd,
        exitCode: null,
        signal: null,
        stdout,
        stderr,
        timedOut,
        truncated,
        durationMs: Date.now() - started,
        spawnError: error instanceof Error ? error.message : String(error)
      });
      return;
    }
    const append = (target, chunk) => {
      const used = target === "stdout" ? stdoutBytes : stderrBytes;
      const remaining = Math.max(0, maxBytes - used);
      if (remaining === 0) {
        truncated = true;
        return;
      }
      const kept = chunk.subarray(0, remaining);
      if (target === "stdout") {
        stdout += kept.toString("utf8");
        stdoutBytes += kept.length;
      } else {
        stderr += kept.toString("utf8");
        stderrBytes += kept.length;
      }
      if (kept.length < chunk.length) truncated = true;
    };
    child.stdout.on("data", (chunk) => append("stdout", chunk));
    child.stderr.on("data", (chunk) => append("stderr", chunk));
    const timer = setTimeout(() => {
      timedOut = true;
      if (child.pid) {
        try {
          if (process.platform === "win32") child.kill("SIGTERM");
          else process.kill(-child.pid, "SIGTERM");
        } catch {
          child.kill("SIGTERM");
        }
        setTimeout(() => {
          if (!settled) {
            try {
              if (process.platform !== "win32") process.kill(-child.pid, "SIGKILL");
              else child.kill("SIGKILL");
            } catch {
            }
          }
        }, 500).unref();
      }
    }, timeoutMs);
    timer.unref();
    child.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        argv: spec.argv,
        cwd,
        exitCode: null,
        signal: null,
        stdout,
        stderr,
        timedOut,
        truncated,
        durationMs: Date.now() - started,
        spawnError: error.message
      });
    });
    child.on("close", (exitCode, signal) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ argv: spec.argv, cwd, exitCode, signal, stdout, stderr, timedOut, truncated, durationMs: Date.now() - started });
    });
  });
}
function isAllowed(result, spec) {
  return !result.timedOut && !result.spawnError && (spec.allowedExitCodes ?? [0]).includes(result.exitCode ?? -999);
}

// src/probes.ts
var import_promises2 = require("node:fs/promises");
var import_node_path = __toESM(require("node:path"), 1);
async function exists(file) {
  try {
    await (0, import_promises2.access)(file);
    return true;
  } catch {
    return false;
  }
}
function executableNames(name, env) {
  if (process.platform !== "win32" || import_node_path.default.extname(name)) return [name];
  const extensions = (env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean);
  return [name, ...extensions.map((extension) => `${name}${extension.toLowerCase()}`), ...extensions.map((extension) => `${name}${extension.toUpperCase()}`)];
}
async function findExecutables(name, env) {
  if (name.includes(import_node_path.default.sep) || import_node_path.default.posix.sep !== import_node_path.default.sep && name.includes(import_node_path.default.posix.sep)) {
    return await exists(name) ? [await canonical(name)] : [];
  }
  const matches = [];
  const seen = /* @__PURE__ */ new Set();
  for (const directory of (env.PATH ?? "").split(import_node_path.default.delimiter).filter(Boolean)) {
    for (const candidateName of executableNames(name, env)) {
      const candidate = import_node_path.default.resolve(directory, candidateName);
      if (!await exists(candidate)) continue;
      const resolved = await canonical(candidate);
      const key = process.platform === "win32" ? resolved.toLowerCase() : resolved;
      if (!seen.has(key)) {
        seen.add(key);
        matches.push(resolved);
      }
    }
  }
  return matches;
}
async function canonical(file) {
  try {
    return await (0, import_promises2.realpath)(file);
  } catch {
    return import_node_path.default.resolve(file);
  }
}
function samePath(left, right) {
  const a = import_node_path.default.resolve(left);
  const b = import_node_path.default.resolve(right);
  return process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
}
function parseVersion(output2) {
  const match = output2.match(/(?:^|\s)v?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)(?:\s|$)/m);
  return match?.[1];
}
function normalizeVersion(version) {
  return version.trim().replace(/^v/i, "");
}
function isTransientFailure(output2, extraPatterns = []) {
  const patterns = [
    "ETIMEDOUT",
    "ECONNRESET",
    "ENOTFOUND",
    "EAI_AGAIN",
    "socket hang up",
    "network timeout",
    "HTTP 429",
    "HTTP 502",
    "HTTP 503",
    "HTTP 504",
    ...extraPatterns
  ];
  return patterns.some((pattern) => {
    try {
      return new RegExp(pattern, "i").test(output2);
    } catch {
      return output2.toLowerCase().includes(pattern.toLowerCase());
    }
  });
}
function aggregateVerdicts(verdicts) {
  if (verdicts.includes("FAIL")) return "FAIL";
  if (verdicts.includes("UNKNOWN")) return "UNKNOWN";
  return "PASS";
}
async function pathEvidence(file) {
  try {
    const info = await (0, import_promises2.stat)(file);
    return `${file} (${info.size} bytes)`;
  } catch {
    return file;
  }
}

// src/redact.ts
var import_node_os = __toESM(require("node:os"), 1);
var BUILTIN_SECRET_PATTERNS = [
  /\bghp_[A-Za-z0-9]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\bnpm_[A-Za-z0-9]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{16,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}=*/gi
];
var QUERY_SECRET_PATTERN = /([?&](?:token|key|secret|password|auth)=)[^&\s]+/gi;
function escaped(value) {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
}
var Redactor = class {
  #values;
  constructor(values = [], environments = []) {
    const secretValues = values.filter((value) => value.length >= 4);
    for (const environment of environments) {
      for (const [key, value] of Object.entries(environment ?? {})) {
        if (/(TOKEN|SECRET|PASSWORD|PASSWD|API_KEY|AUTH)/i.test(key) && value?.length >= 12 && !/\s/.test(value)) secretValues.push(value);
      }
    }
    this.#values = [...new Set(secretValues)].sort((a, b) => b.length - a.length);
  }
  text(input2) {
    let output2 = input2;
    const home = import_node_os.default.homedir();
    if (home && home !== "/") output2 = output2.replace(escaped(home), "$HOME");
    for (const value of this.#values) output2 = output2.replace(escaped(value), "[REDACTED]");
    for (const pattern of BUILTIN_SECRET_PATTERNS) output2 = output2.replace(pattern, "[REDACTED]");
    output2 = output2.replace(QUERY_SECRET_PATTERN, "$1[REDACTED]");
    return output2;
  }
  list(values) {
    return values.map((value) => this.text(value));
  }
};
function shellQuote(value) {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
function commandText(argv) {
  return argv.map(shellQuote).join(" ");
}

// src/template.ts
var import_node_path2 = __toESM(require("node:path"), 1);
var TEMPLATE = /\$\{([A-Z][A-Z0-9_]*)\}/g;
function expandTemplate(value, values) {
  return value.replace(TEMPLATE, (_match, name) => {
    const replacement = values[name];
    if (replacement === void 0) throw new Error(`Unknown template variable: \${${name}}`);
    return replacement;
  });
}
function baseTemplateValues(input2) {
  return {
    RUN_DIR: input2.runDirectory,
    CONFIG_DIR: input2.configDirectory,
    WORK_DIR: input2.workDirectory,
    CHANNEL: input2.channel,
    PATH: process.env.PATH ?? "",
    PATH_DELIMITER: import_node_path2.default.delimiter,
    EXECUTABLE_SUFFIX: process.platform === "win32" ? ".cmd" : ""
  };
}

// src/core.ts
var VERSION = "0.1.0";
var SCOPE_NOTICE = "This receipt proves only what happened on the named runner at the recorded time. It does not represent every user machine.";
function expandMap(values, templates) {
  return Object.fromEntries(Object.entries(values ?? {}).map(([key, value]) => [key, expandTemplate(value, templates)]));
}
function expandCommand(spec, templates) {
  const result = { argv: spec.argv.map((value) => expandTemplate(value, templates)) };
  if (spec.cwd !== void 0) result.cwd = expandTemplate(spec.cwd, templates);
  if (spec.env !== void 0) result.env = expandMap(spec.env, templates);
  if (spec.timeoutMs !== void 0) result.timeoutMs = spec.timeoutMs;
  if (spec.maxOutputBytes !== void 0) result.maxOutputBytes = spec.maxOutputBytes;
  if (spec.allowedExitCodes !== void 0) result.allowedExitCodes = [...spec.allowedExitCodes];
  return result;
}
function processEvidence(result, redactor) {
  const evidence = [
    `command: ${redactor.text(commandText(result.argv))}`,
    `exit: ${result.exitCode ?? "not started"}${result.signal ? ` (${result.signal})` : ""}; ${result.durationMs} ms`
  ];
  if (result.timedOut) evidence.push("timed out: yes");
  if (result.spawnError) evidence.push(`spawn error: ${redactor.text(result.spawnError)}`);
  if (result.stdout.trim()) evidence.push(`stdout: ${redactor.text(result.stdout.trim())}`);
  if (result.stderr.trim()) evidence.push(`stderr: ${redactor.text(result.stderr.trim())}`);
  if (result.truncated) evidence.push("output truncated at configured byte limit");
  return evidence;
}
function safeRerun(configPath, channelId, outputDirectory, redactor) {
  return redactor.text(commandText([
    "channel-parity",
    "run",
    "--config",
    configPath,
    "--channel",
    channelId,
    "--output",
    outputDirectory
  ]));
}
function skipped(id, title, reason, rerunCommand) {
  return {
    id,
    title,
    verdict: "UNKNOWN",
    summary: reason,
    evidence: [reason],
    rerunCommand,
    classification: "INSUFFICIENT_EVIDENCE"
  };
}
async function runChannel(input2) {
  const { config, channel: channel2, configPath, runDirectory, outputDirectory, redactor } = input2;
  const workDirectory = import_node_path3.default.join(runDirectory, channel2.id);
  await (0, import_promises3.mkdir)(workDirectory, { recursive: true });
  const configDirectory = import_node_path3.default.dirname(configPath);
  const baseValues = baseTemplateValues({ runDirectory, configDirectory, workDirectory, channel: channel2.id });
  const channelEnv = { ...process.env, ...expandMap(channel2.env, baseValues) };
  const defaults = {
    cwd: workDirectory,
    env: channelEnv,
    defaultTimeoutMs: config.defaults?.timeoutMs ?? 3e4,
    defaultMaxOutputBytes: config.defaults?.maxOutputBytes ?? 64 * 1024
  };
  const rerunCommand = safeRerun(configPath, channel2.id, outputDirectory, redactor);
  const checks = [];
  const installSpec = expandCommand(channel2.install, baseValues);
  const installResult = await execute(installSpec, defaults);
  if (isAllowed(installResult, installSpec)) {
    checks.push({
      id: "install",
      title: "Public-channel install",
      verdict: "PASS",
      summary: "The declared public install command completed.",
      evidence: processEvidence(installResult, redactor)
    });
  } else {
    const combined = `${installResult.stdout}
${installResult.stderr}
${installResult.spawnError ?? ""}`;
    const transient = isTransientFailure(combined, channel2.transientPatterns);
    checks.push({
      id: "install",
      title: "Public-channel install",
      verdict: transient ? "UNKNOWN" : "FAIL",
      summary: transient ? "The install was interrupted by a likely transient environment or network failure." : "The public install command failed.",
      evidence: processEvidence(installResult, redactor),
      rerunCommand,
      classification: transient ? "TRANSIENT_ENVIRONMENT" : "PRODUCT"
    });
    const reason = "Not run because the install result did not prove a usable installation.";
    checks.push(skipped("path", "Executable and PATH", reason, rerunCommand));
    checks.push(skipped("version", "Installed version", reason, rerunCommand));
    checks.push(skipped("launch", "Minimal launch", reason, rerunCommand));
    checks.push(skipped("helpers", "Required helpers", reason, rerunCommand));
    checks.push(skipped("uninstall", "Uninstall", reason, rerunCommand));
    checks.push(skipped("residue", "Uninstall residue", reason, rerunCommand));
    const verdict2 = aggregateVerdicts(checks.map((check) => check.verdict));
    return {
      id: channel2.id,
      label: channel2.label ?? channel2.id,
      verdict: verdict2,
      ...channel2.expectedVersion ?? config.expectedVersion ? { expectedVersion: channel2.expectedVersion ?? config.expectedVersion } : {},
      executableMatches: [],
      checks,
      rerunCommand
    };
  }
  const executableMatches = await findExecutables(channel2.executable, channelEnv);
  const expectedPathRaw = channel2.expectedExecutablePath ? expandTemplate(channel2.expectedExecutablePath, baseValues) : void 0;
  const expectedPath = expectedPathRaw ? await canonical(expectedPathRaw) : void 0;
  const actualExecutablePath = executableMatches[0];
  let pathVerdict;
  let pathSummary;
  if (!actualExecutablePath) {
    pathVerdict = "FAIL";
    pathSummary = `The executable ${channel2.executable} was not found on PATH after installation.`;
  } else if (expectedPath && !samePath(actualExecutablePath, expectedPath)) {
    pathVerdict = "FAIL";
    pathSummary = "A different executable shadows the path expected from this channel.";
  } else if (channel2.pathPolicy === "single" && executableMatches.length !== 1) {
    pathVerdict = "FAIL";
    pathSummary = `Expected exactly one executable match, found ${executableMatches.length}.`;
  } else if (executableMatches.length > 1 && !expectedPath && channel2.pathPolicy !== "first-must-match") {
    pathVerdict = "UNKNOWN";
    pathSummary = "Multiple executable paths exist and no expected winning path was declared.";
  } else {
    pathVerdict = "PASS";
    pathSummary = "The executable resolved to the expected first PATH entry.";
  }
  checks.push({
    id: "path",
    title: "Executable and PATH",
    verdict: pathVerdict,
    summary: pathSummary,
    evidence: executableMatches.length ? redactor.list(executableMatches.map((entry, index) => `${index + 1}. ${entry}`)) : ["No executable matches"],
    ...pathVerdict !== "PASS" ? { rerunCommand, classification: pathVerdict === "FAIL" ? "PRODUCT" : "INSUFFICIENT_EVIDENCE" } : {}
  });
  let actualVersion;
  const expectedVersion = channel2.expectedVersion ?? config.expectedVersion;
  if (!actualExecutablePath) {
    checks.push(skipped("version", "Installed version", "Not run because no executable was found.", rerunCommand));
    checks.push(skipped("launch", "Minimal launch", "Not run because no executable was found.", rerunCommand));
  } else {
    const commandValues = {
      ...baseValues,
      EXECUTABLE: actualExecutablePath,
      EXECUTABLE_DIR: import_node_path3.default.dirname(actualExecutablePath)
    };
    const versionSpec = expandCommand(channel2.version ?? { argv: ["${EXECUTABLE}", "--version"] }, commandValues);
    const versionResult = await execute(versionSpec, defaults);
    actualVersion = parseVersion(`${versionResult.stdout}
${versionResult.stderr}`);
    let versionVerdict;
    let versionSummary;
    if (!isAllowed(versionResult, versionSpec)) {
      versionVerdict = "FAIL";
      versionSummary = versionResult.timedOut ? "The version command hung until timeout." : "The version command did not complete successfully.";
    } else if (!actualVersion) {
      versionVerdict = "UNKNOWN";
      versionSummary = "The command ran, but no semantic version could be proven from its output.";
    } else if (!expectedVersion) {
      versionVerdict = "UNKNOWN";
      versionSummary = `Installed version ${actualVersion} was observed, but no expected version was declared.`;
    } else if (normalizeVersion(actualVersion) !== normalizeVersion(expectedVersion)) {
      versionVerdict = "FAIL";
      versionSummary = `Expected ${normalizeVersion(expectedVersion)}, but this channel delivered ${normalizeVersion(actualVersion)}.`;
    } else {
      versionVerdict = "PASS";
      versionSummary = `This channel delivered the expected version ${normalizeVersion(actualVersion)}.`;
    }
    checks.push({
      id: "version",
      title: "Installed version",
      verdict: versionVerdict,
      summary: versionSummary,
      evidence: processEvidence(versionResult, redactor),
      ...versionVerdict !== "PASS" ? { rerunCommand, classification: versionVerdict === "FAIL" ? "PRODUCT" : "INSUFFICIENT_EVIDENCE" } : {}
    });
    const launchSpec = expandCommand(channel2.launch ?? { argv: ["${EXECUTABLE}", "--help"], timeoutMs: 1e4 }, commandValues);
    const launchResult = await execute(launchSpec, defaults);
    const launchPass = isAllowed(launchResult, launchSpec);
    checks.push({
      id: "launch",
      title: "Minimal launch",
      verdict: launchPass ? "PASS" : "FAIL",
      summary: launchPass ? "The installed executable completed the declared side-effect-free launch probe." : launchResult.timedOut ? "The installed executable hung until timeout." : "The installed executable failed its minimal launch probe.",
      evidence: processEvidence(launchResult, redactor),
      ...!launchPass ? { rerunCommand, classification: "PRODUCT" } : {}
    });
  }
  if (!channel2.helpers?.length) {
    checks.push({ id: "helpers", title: "Required helpers", verdict: "PASS", summary: "No required helper files were declared.", evidence: ["No helper contract declared"] });
  } else {
    const helperValues = {
      ...baseValues,
      EXECUTABLE: actualExecutablePath ?? "",
      EXECUTABLE_DIR: actualExecutablePath ? import_node_path3.default.dirname(actualExecutablePath) : ""
    };
    const missing = [];
    const evidence = [];
    for (const helper of channel2.helpers) {
      const helperPath = expandTemplate(helper.path, helperValues);
      try {
        const info = await (0, import_promises3.stat)(helperPath);
        evidence.push(redactor.text(`${helper.name}: ${helperPath} (${info.size} bytes)`));
      } catch {
        evidence.push(redactor.text(`${helper.name}: missing at ${helperPath}`));
        if (helper.required !== false) missing.push(helper.name);
      }
    }
    checks.push({
      id: "helpers",
      title: "Required helpers",
      verdict: missing.length ? "FAIL" : "PASS",
      summary: missing.length ? `Missing required helper files: ${missing.join(", ")}.` : "All declared required helper files exist.",
      evidence,
      ...missing.length ? { rerunCommand, classification: "PRODUCT" } : {}
    });
  }
  if (!channel2.uninstall) {
    checks.push(skipped("uninstall", "Uninstall", "No uninstall command was declared.", rerunCommand));
    checks.push(skipped("residue", "Uninstall residue", "Residue cannot be proven without a declared uninstall command.", rerunCommand));
  } else {
    const commandValues = {
      ...baseValues,
      EXECUTABLE: actualExecutablePath ?? "",
      EXECUTABLE_DIR: actualExecutablePath ? import_node_path3.default.dirname(actualExecutablePath) : ""
    };
    const uninstallSpec = expandCommand(channel2.uninstall, commandValues);
    const uninstallResult = await execute(uninstallSpec, defaults);
    const uninstallPass = isAllowed(uninstallResult, uninstallSpec);
    checks.push({
      id: "uninstall",
      title: "Uninstall",
      verdict: uninstallPass ? "PASS" : "FAIL",
      summary: uninstallPass ? "The declared uninstall command completed." : "The declared uninstall command failed.",
      evidence: processEvidence(uninstallResult, redactor),
      ...!uninstallPass ? { rerunCommand, classification: "PRODUCT" } : {}
    });
    if (!channel2.residuePaths?.length) {
      checks.push(skipped("residue", "Uninstall residue", "No exact residue paths were declared.", rerunCommand));
    } else {
      const existing = [];
      const checked = [];
      for (const residueTemplate of channel2.residuePaths) {
        const residuePath = expandTemplate(residueTemplate, commandValues);
        try {
          await (0, import_promises3.access)(residuePath);
          const item = await pathEvidence(residuePath);
          existing.push(item);
          checked.push(`present: ${item}`);
        } catch {
          checked.push(`absent: ${residuePath}`);
        }
      }
      checks.push({
        id: "residue",
        title: "Uninstall residue",
        verdict: existing.length ? "FAIL" : "PASS",
        summary: existing.length ? `${existing.length} declared path(s) remained after uninstall.` : "All declared executable and helper paths were absent after uninstall.",
        evidence: redactor.list(checked),
        ...existing.length ? { rerunCommand, classification: "PRODUCT" } : {}
      });
    }
  }
  const verdict = aggregateVerdicts(checks.map((check) => check.verdict));
  const report = {
    id: channel2.id,
    label: channel2.label ?? channel2.id,
    verdict,
    executableMatches: redactor.list(executableMatches),
    checks,
    rerunCommand
  };
  if (expectedVersion !== void 0) report.expectedVersion = expectedVersion;
  if (actualVersion !== void 0) report.actualVersion = actualVersion;
  if (actualExecutablePath !== void 0) report.actualExecutablePath = redactor.text(actualExecutablePath);
  return report;
}
async function runParity(options) {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const configPath = import_node_path3.default.resolve(options.configPath);
  const config = await loadConfig(configPath);
  const selected = options.channelIds?.length ? config.channels.filter((channel2) => options.channelIds.includes(channel2.id)) : config.channels;
  if (!selected.length) throw new Error("No configured channels matched --channel");
  if (options.channelIds?.length) {
    const found = new Set(selected.map((channel2) => channel2.id));
    const missing = options.channelIds.filter((id) => !found.has(id));
    if (missing.length) throw new Error(`Unknown channel id(s): ${missing.join(", ")}`);
  }
  const sensitiveEnvironments = [
    ...selected.flatMap((channel2) => [channel2.env, channel2.install.env, channel2.version?.env, channel2.launch?.env, channel2.uninstall?.env])
  ];
  const redactor = new Redactor(config.redactions, sensitiveEnvironments);
  const runDirectory = await (0, import_promises3.mkdtemp)(import_node_path3.default.join(import_node_os2.default.tmpdir(), "cli-channel-parity-"));
  const channels = [];
  try {
    for (const channel2 of selected) {
      channels.push(await runChannel({
        config,
        channel: channel2,
        configPath,
        runDirectory,
        outputDirectory: import_node_path3.default.resolve(options.outputDirectory),
        redactor
      }));
    }
  } finally {
    if (!options.keepRunDirectory) await (0, import_promises3.rm)(runDirectory, { recursive: true, force: true });
  }
  const finished = Date.now();
  return {
    schemaVersion: 1,
    tool: "cli-channel-parity",
    toolVersion: VERSION,
    product: config.product,
    verdict: aggregateVerdicts(channels.map((channel2) => channel2.verdict)),
    startedAt,
    finishedAt: new Date(finished).toISOString(),
    durationMs: finished - started,
    environment: {
      os: process.platform,
      arch: process.arch,
      node: process.version,
      runner: process.env.GITHUB_ACTIONS === "true" ? "GitHub Actions" : "local"
    },
    scopeNotice: SCOPE_NOTICE,
    runDirectory: redactor.text(options.keepRunDirectory ? runDirectory : "deleted after run"),
    channels
  };
}

// src/report.ts
var import_promises4 = require("node:fs/promises");
var import_node_path4 = __toESM(require("node:path"), 1);
function mark(verdict) {
  return verdict === "PASS" ? "\u2705" : verdict === "FAIL" ? "\u274C" : "\u26A0\uFE0F";
}
function code(value) {
  const clean = value.replace(/[ \t]+$/gm, "").trimEnd();
  return `\`${clean.replace(/`/g, "\\`")}\``;
}
function channelMarkdown(channel2) {
  const lines = [
    `## ${mark(channel2.verdict)} ${channel2.label}: ${channel2.verdict}`,
    "",
    `- Channel ID: ${code(channel2.id)}`,
    `- Expected version: ${channel2.expectedVersion ? code(channel2.expectedVersion) : "not declared"}`,
    `- Actual version: ${channel2.actualVersion ? code(channel2.actualVersion) : "not proven"}`,
    `- Executable used: ${channel2.actualExecutablePath ? code(channel2.actualExecutablePath) : "not found"}`,
    `- Re-run: ${code(channel2.rerunCommand)}`,
    "",
    "| Check | Result | What happened |",
    "|---|---:|---|"
  ];
  for (const check of channel2.checks) {
    lines.push(`| ${check.title.replace(/\|/g, "\\|")} | ${mark(check.verdict)} ${check.verdict} | ${check.summary.replace(/\|/g, "\\|").replace(/\n/g, " ")} |`);
  }
  lines.push("", "<details><summary>Evidence</summary>", "");
  for (const check of channel2.checks) {
    lines.push(`### ${check.title}`, "", ...check.evidence.map((entry) => `- ${code(entry)}`), "");
  }
  lines.push("</details>", "");
  return lines.join("\n");
}
function markdownReport(report) {
  return [
    `# ${report.product} \u2014 channel parity receipt`,
    "",
    `**${mark(report.verdict)} Overall result: ${report.verdict}**`,
    "",
    `Tested ${report.startedAt} \u2192 ${report.finishedAt} on ${report.environment.os}/${report.environment.arch} with ${report.environment.node}.`,
    "",
    `> ${report.scopeNotice}`,
    "",
    ...report.channels.map(channelMarkdown)
  ].join("\n").trimEnd();
}
async function writeReports(report, outputDirectory) {
  await (0, import_promises4.mkdir)(outputDirectory, { recursive: true });
  const jsonPath = import_node_path4.default.join(outputDirectory, "channel-parity-report.json");
  const markdownPath = import_node_path4.default.join(outputDirectory, "channel-parity-report.md");
  await (0, import_promises4.writeFile)(jsonPath, `${JSON.stringify(report, null, 2)}
`, "utf8");
  await (0, import_promises4.writeFile)(markdownPath, `${markdownReport(report)}
`, "utf8");
  return { jsonPath, markdownPath };
}

// src/action.ts
function input(name, fallback = "") {
  return process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`]?.trim() || fallback;
}
function output(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return Promise.resolve();
  const marker = `PARITY_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return (0, import_promises5.appendFile)(file, `${name}<<${marker}
${value}
${marker}
`, "utf8");
}
async function main() {
  const configInput = input("config");
  if (!configInput) throw new Error("The config input is required");
  const configPath = import_node_path5.default.resolve(configInput);
  const outputDirectory = import_node_path5.default.resolve(input("output-directory", "channel-parity-output"));
  const channel2 = input("channel");
  const failOn = input("fail-on", "unknown");
  if (failOn !== "fail" && failOn !== "unknown") throw new Error("fail-on must be fail or unknown");
  await (0, import_promises5.mkdir)(outputDirectory, { recursive: true });
  const report = await runParity({
    configPath,
    outputDirectory,
    ...channel2 ? { channelIds: channel2.split(",").map((item) => item.trim()).filter(Boolean) } : {},
    keepRunDirectory: input("keep-run-directory", "false").toLowerCase() === "true"
  });
  const files = await writeReports(report, outputDirectory);
  await Promise.all([
    output("result", report.verdict),
    output("report-json", files.jsonPath),
    output("report-markdown", files.markdownPath)
  ]);
  if (process.env.GITHUB_STEP_SUMMARY) await (0, import_promises5.appendFile)(process.env.GITHUB_STEP_SUMMARY, `${markdownReport(report)}
`, "utf8");
  console.log(`${report.verdict}: ${report.product}`);
  if (report.verdict === "FAIL") process.exitCode = 1;
  else if (report.verdict === "UNKNOWN" && failOn === "unknown") process.exitCode = 2;
}
main().catch((error) => {
  console.error(`::error::${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 3;
});
//# sourceMappingURL=action.cjs.map
