import { access, mkdir, mkdtemp, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { loadConfig } from "./config.js";
import { execute, isAllowed } from "./process.js";
import { aggregateVerdicts, canonical, findExecutables, isTransientFailure, normalizeVersion, parseVersion, pathEvidence, samePath } from "./probes.js";
import { commandText, Redactor } from "./redact.js";
import { baseTemplateValues, expandTemplate, type TemplateValues } from "./template.js";
import type { ChannelConfig, ChannelReport, CheckResult, CommandSpec, ParityConfig, ProcessResult, RunOptions, RunReport, Verdict } from "./types.js";

const VERSION = "0.1.1";
const SCOPE_NOTICE = "This receipt proves only what happened on the named runner at the recorded time. It does not represent every user machine.";

function expandMap(values: Record<string, string> | undefined, templates: TemplateValues): Record<string, string> {
  return Object.fromEntries(Object.entries(values ?? {}).map(([key, value]) => [key, expandTemplate(value, templates)]));
}

function expandCommand(spec: CommandSpec, templates: TemplateValues): CommandSpec {
  const result: CommandSpec = { argv: spec.argv.map((value) => expandTemplate(value, templates)) };
  if (spec.cwd !== undefined) result.cwd = expandTemplate(spec.cwd, templates);
  if (spec.env !== undefined) result.env = expandMap(spec.env, templates);
  if (spec.timeoutMs !== undefined) result.timeoutMs = spec.timeoutMs;
  if (spec.maxOutputBytes !== undefined) result.maxOutputBytes = spec.maxOutputBytes;
  if (spec.allowedExitCodes !== undefined) result.allowedExitCodes = [...spec.allowedExitCodes];
  return result;
}

function processEvidence(result: ProcessResult, redactor: Redactor): string[] {
  const evidence = [
    `command: ${redactor.text(commandText(result.argv))}`,
    `exit: ${result.exitCode ?? "not started"}${result.signal ? ` (${result.signal})` : ""}; ${result.durationMs} ms`,
  ];
  if (result.timedOut) evidence.push("timed out: yes");
  if (result.spawnError) evidence.push(`spawn error: ${redactor.text(result.spawnError)}`);
  if (result.stdout.trim()) evidence.push(`stdout: ${redactor.text(result.stdout.trim())}`);
  if (result.stderr.trim()) evidence.push(`stderr: ${redactor.text(result.stderr.trim())}`);
  if (result.truncated) evidence.push("output truncated at configured byte limit");
  return evidence;
}

function safeRerun(configPath: string, channelId: string, outputDirectory: string, redactor: Redactor): string {
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

function skipped(id: string, title: string, reason: string, rerunCommand: string): CheckResult {
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

async function runChannel(input: {
  config: ParityConfig;
  channel: ChannelConfig;
  configPath: string;
  runDirectory: string;
  outputDirectory: string;
  redactor: Redactor;
}): Promise<ChannelReport> {
  const { config, channel, configPath, runDirectory, outputDirectory, redactor } = input;
  const workDirectory = path.join(runDirectory, channel.id);
  await mkdir(workDirectory, { recursive: true });
  const configDirectory = path.dirname(configPath);
  const baseValues = baseTemplateValues({ runDirectory, configDirectory, workDirectory, channel: channel.id });
  const channelEnv = { ...process.env, ...expandMap(channel.env, baseValues) };
  const defaults = {
    cwd: workDirectory,
    env: channelEnv,
    defaultTimeoutMs: config.defaults?.timeoutMs ?? 30_000,
    defaultMaxOutputBytes: config.defaults?.maxOutputBytes ?? 64 * 1024
  };
  const rerunCommand = safeRerun(configPath, channel.id, outputDirectory, redactor);
  const checks: CheckResult[] = [];

  const installSpec = expandCommand(channel.install, baseValues);
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
    const combined = `${installResult.stdout}\n${installResult.stderr}\n${installResult.spawnError ?? ""}`;
    const transient = isTransientFailure(combined, channel.transientPatterns);
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
    const verdict = aggregateVerdicts(checks.map((check) => check.verdict));
    return {
      id: channel.id,
      label: channel.label ?? channel.id,
      verdict,
      ...(channel.expectedVersion ?? config.expectedVersion ? { expectedVersion: channel.expectedVersion ?? config.expectedVersion } : {}),
      executableMatches: [],
      checks,
      rerunCommand
    };
  }

  const executableMatches = await findExecutables(channel.executable, channelEnv);
  const expectedPathRaw = channel.expectedExecutablePath ? expandTemplate(channel.expectedExecutablePath, baseValues) : undefined;
  const expectedPath = expectedPathRaw ? await canonical(expectedPathRaw) : undefined;
  const actualExecutablePath = executableMatches[0];
  let pathVerdict: Verdict;
  let pathSummary: string;
  if (!actualExecutablePath) {
    pathVerdict = "FAIL";
    pathSummary = `The executable ${channel.executable} was not found on PATH after installation.`;
  } else if (expectedPath && !samePath(actualExecutablePath, expectedPath)) {
    pathVerdict = "FAIL";
    pathSummary = "A different executable shadows the path expected from this channel.";
  } else if (channel.pathPolicy === "single" && executableMatches.length !== 1) {
    pathVerdict = "FAIL";
    pathSummary = `Expected exactly one executable match, found ${executableMatches.length}.`;
  } else if (executableMatches.length > 1 && !expectedPath && channel.pathPolicy !== "first-must-match") {
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
    ...(pathVerdict !== "PASS" ? { rerunCommand, classification: pathVerdict === "FAIL" ? "PRODUCT" as const : "INSUFFICIENT_EVIDENCE" as const } : {})
  });

  let actualVersion: string | undefined;
  const expectedVersion = channel.expectedVersion ?? config.expectedVersion;
  if (!actualExecutablePath) {
    checks.push(skipped("version", "Installed version", "Not run because no executable was found.", rerunCommand));
    checks.push(skipped("launch", "Minimal launch", "Not run because no executable was found.", rerunCommand));
  } else {
    const commandValues: TemplateValues = {
      ...baseValues,
      EXECUTABLE: actualExecutablePath,
      EXECUTABLE_DIR: path.dirname(actualExecutablePath)
    };
    const versionSpec = expandCommand(channel.version ?? { argv: ["${EXECUTABLE}", "--version"] }, commandValues);
    const versionResult = await execute(versionSpec, defaults);
    actualVersion = parseVersion(`${versionResult.stdout}\n${versionResult.stderr}`);
    let versionVerdict: Verdict;
    let versionSummary: string;
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
      ...(versionVerdict !== "PASS" ? { rerunCommand, classification: versionVerdict === "FAIL" ? "PRODUCT" as const : "INSUFFICIENT_EVIDENCE" as const } : {})
    });

    const launchSpec = expandCommand(channel.launch ?? { argv: ["${EXECUTABLE}", "--help"], timeoutMs: 10_000 }, commandValues);
    const launchResult = await execute(launchSpec, defaults);
    const launchPass = isAllowed(launchResult, launchSpec);
    checks.push({
      id: "launch",
      title: "Minimal launch",
      verdict: launchPass ? "PASS" : "FAIL",
      summary: launchPass ? "The installed executable completed the declared side-effect-free launch probe." : launchResult.timedOut ? "The installed executable hung until timeout." : "The installed executable failed its minimal launch probe.",
      evidence: processEvidence(launchResult, redactor),
      ...(!launchPass ? { rerunCommand, classification: "PRODUCT" as const } : {})
    });
  }

  if (!channel.helpers?.length) {
    checks.push({ id: "helpers", title: "Required helpers", verdict: "PASS", summary: "No required helper files were declared.", evidence: ["No helper contract declared"] });
  } else {
    const helperValues: TemplateValues = {
      ...baseValues,
      EXECUTABLE: actualExecutablePath ?? "",
      EXECUTABLE_DIR: actualExecutablePath ? path.dirname(actualExecutablePath) : ""
    };
    const missing: string[] = [];
    const evidence: string[] = [];
    for (const helper of channel.helpers) {
      const helperPath = expandTemplate(helper.path, helperValues);
      try {
        const info = await stat(helperPath);
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
      ...(missing.length ? { rerunCommand, classification: "PRODUCT" as const } : {})
    });
  }

  if (!channel.uninstall) {
    checks.push(skipped("uninstall", "Uninstall", "No uninstall command was declared.", rerunCommand));
    checks.push(skipped("residue", "Uninstall residue", "Residue cannot be proven without a declared uninstall command.", rerunCommand));
  } else {
    const commandValues: TemplateValues = {
      ...baseValues,
      EXECUTABLE: actualExecutablePath ?? "",
      EXECUTABLE_DIR: actualExecutablePath ? path.dirname(actualExecutablePath) : ""
    };
    const uninstallSpec = expandCommand(channel.uninstall, commandValues);
    const uninstallResult = await execute(uninstallSpec, defaults);
    const uninstallPass = isAllowed(uninstallResult, uninstallSpec);
    checks.push({
      id: "uninstall",
      title: "Uninstall",
      verdict: uninstallPass ? "PASS" : "FAIL",
      summary: uninstallPass ? "The declared uninstall command completed." : "The declared uninstall command failed.",
      evidence: processEvidence(uninstallResult, redactor),
      ...(!uninstallPass ? { rerunCommand, classification: "PRODUCT" as const } : {})
    });
    if (!channel.residuePaths?.length) {
      checks.push(skipped("residue", "Uninstall residue", "No exact residue paths were declared.", rerunCommand));
    } else {
      const existing: string[] = [];
      const checked: string[] = [];
      for (const residueTemplate of channel.residuePaths) {
        const residuePath = expandTemplate(residueTemplate, commandValues);
        try {
          await access(residuePath);
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
        ...(existing.length ? { rerunCommand, classification: "PRODUCT" as const } : {})
      });
    }
  }

  const verdict = aggregateVerdicts(checks.map((check) => check.verdict));
  const report: ChannelReport = {
    id: channel.id,
    label: channel.label ?? channel.id,
    verdict,
    executableMatches: redactor.list(executableMatches),
    checks,
    rerunCommand
  };
  if (expectedVersion !== undefined) report.expectedVersion = expectedVersion;
  if (actualVersion !== undefined) report.actualVersion = actualVersion;
  if (actualExecutablePath !== undefined) report.actualExecutablePath = redactor.text(actualExecutablePath);
  return report;
}

export async function runParity(options: RunOptions): Promise<RunReport> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const configPath = path.resolve(options.configPath);
  const config = await loadConfig(configPath);
  const selected = options.channelIds?.length
    ? config.channels.filter((channel) => options.channelIds!.includes(channel.id))
    : config.channels;
  if (!selected.length) throw new Error("No configured channels matched --channel");
  if (options.channelIds?.length) {
    const found = new Set(selected.map((channel) => channel.id));
    const missing = options.channelIds.filter((id) => !found.has(id));
    if (missing.length) throw new Error(`Unknown channel id(s): ${missing.join(", ")}`);
  }
  const sensitiveEnvironments: Array<Record<string, string> | undefined> = [
    Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === "string")),
    ...selected.flatMap((channel) => [channel.env, channel.install.env, channel.version?.env, channel.launch?.env, channel.uninstall?.env])
  ];
  const redactor = new Redactor(config.redactions, sensitiveEnvironments);
  const runDirectory = await mkdtemp(path.join(os.tmpdir(), "cli-channel-parity-"));
  const channels: ChannelReport[] = [];
  try {
    for (const channel of selected) {
      channels.push(await runChannel({
        config,
        channel,
        configPath,
        runDirectory,
        outputDirectory: path.resolve(options.outputDirectory),
        redactor
      }));
    }
  } finally {
    if (!options.keepRunDirectory) await rm(runDirectory, { recursive: true, force: true });
  }
  const finished = Date.now();
  return {
    schemaVersion: 1,
    tool: "cli-channel-parity",
    toolVersion: VERSION,
    product: config.product,
    verdict: aggregateVerdicts(channels.map((channel) => channel.verdict)),
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
