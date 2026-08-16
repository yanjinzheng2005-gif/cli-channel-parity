export type Verdict = "PASS" | "FAIL" | "UNKNOWN";

export interface CommandSpec {
  argv: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
  allowedExitCodes?: number[];
  maxOutputBytes?: number;
}

export interface HelperSpec {
  name: string;
  path: string;
  required?: boolean;
}

export interface ChannelConfig {
  id: string;
  label?: string;
  executable: string;
  expectedVersion?: string;
  expectedExecutablePath?: string;
  pathPolicy?: "report" | "single" | "first-must-match";
  install: CommandSpec;
  version?: CommandSpec;
  launch?: CommandSpec;
  helpers?: HelperSpec[];
  uninstall?: CommandSpec;
  residuePaths?: string[];
  env?: Record<string, string>;
  transientPatterns?: string[];
}

export interface ParityConfig {
  schemaVersion: 1;
  product: string;
  expectedVersion?: string;
  defaults?: {
    timeoutMs?: number;
    maxOutputBytes?: number;
  };
  redactions?: string[];
  channels: ChannelConfig[];
}

export interface ProcessResult {
  argv: string[];
  cwd: string;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  truncated: boolean;
  durationMs: number;
  spawnError?: string;
}

export interface CheckResult {
  id: string;
  title: string;
  verdict: Verdict;
  summary: string;
  evidence: string[];
  rerunCommand?: string;
  classification?: "PRODUCT" | "TRANSIENT_ENVIRONMENT" | "INSUFFICIENT_EVIDENCE";
}

export interface ChannelReport {
  id: string;
  label: string;
  verdict: Verdict;
  expectedVersion?: string;
  actualVersion?: string;
  actualExecutablePath?: string;
  executableMatches: string[];
  checks: CheckResult[];
  rerunCommand: string;
}

export interface RunReport {
  schemaVersion: 1;
  tool: "cli-channel-parity";
  toolVersion: string;
  product: string;
  verdict: Verdict;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  environment: {
    os: NodeJS.Platform;
    arch: string;
    node: string;
    runner: string;
  };
  scopeNotice: string;
  runDirectory: string;
  channels: ChannelReport[];
}

export interface RunOptions {
  configPath: string;
  channelIds?: string[];
  outputDirectory: string;
  keepRunDirectory?: boolean;
}
