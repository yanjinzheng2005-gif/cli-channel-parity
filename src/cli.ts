import path from "node:path";
import { resolveConfigPath } from "./config.js";
import { runParity } from "./core.js";
import { writeReports } from "./report.js";

interface CliOptions {
  config?: string;
  channels: string[];
  output: string;
  failOn: "fail" | "unknown";
  keepRunDirectory: boolean;
}

const HELP = `cli-channel-parity

Prove what a public CLI install channel actually delivers on this runner.

Usage:
  channel-parity run --config <file.json> [options]

Options:
  --channel <id>          Run only this channel; may be repeated
  --output <directory>    Report directory (default: channel-parity-output)
  --fail-on <value>       fail or unknown (default: unknown)
  --keep-run-directory    Keep temporary installation evidence
  --help                  Show this help
`;

function parse(argv: string[]): CliOptions {
  const args = [...argv];
  if (args[0] === "run") args.shift();
  const result: CliOptions = { channels: [], output: "channel-parity-output", failOn: "unknown", keepRunDirectory: false };
  while (args.length) {
    const flag = args.shift();
    if (flag === "--help" || flag === "-h") {
      console.log(HELP);
      process.exit(0);
    }
    if (flag === "--keep-run-directory") {
      result.keepRunDirectory = true;
      continue;
    }
    const value = args.shift();
    if (!value) throw new Error(`${flag} requires a value`);
    if (flag === "--config") result.config = value;
    else if (flag === "--channel") result.channels.push(value);
    else if (flag === "--output") result.output = value;
    else if (flag === "--fail-on") {
      if (value !== "fail" && value !== "unknown") throw new Error("--fail-on must be fail or unknown");
      result.failOn = value;
    }
    else throw new Error(`Unknown option: ${flag}`);
  }
  if (!result.config) throw new Error("--config is required");
  return result;
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  try {
    if (!argv.length || argv.includes("--help") || argv.includes("-h")) {
      console.log(HELP);
      return 0;
    }
    const options = parse(argv);
    const outputDirectory = path.resolve(options.output);
    const report = await runParity({
      configPath: resolveConfigPath(options.config!),
      outputDirectory,
      ...(options.channels.length ? { channelIds: options.channels } : {}),
      keepRunDirectory: options.keepRunDirectory
    });
    const files = await writeReports(report, outputDirectory);
    console.log(`${report.verdict}: ${report.product}`);
    console.log(`JSON: ${files.jsonPath}`);
    console.log(`Markdown: ${files.markdownPath}`);
    if (report.verdict === "FAIL") return 1;
    if (report.verdict === "UNKNOWN" && options.failOn === "unknown") return 2;
    return 0;
  } catch (error) {
    console.error(`Configuration or execution error: ${error instanceof Error ? error.message : String(error)}`);
    return 3;
  }
}

process.exitCode = await main();
