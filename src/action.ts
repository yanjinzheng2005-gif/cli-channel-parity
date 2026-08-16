import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { runParity } from "./core.js";
import { markdownReport, writeReports } from "./report.js";

function input(name: string, fallback = ""): string {
  return process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`]?.trim() || fallback;
}

function output(name: string, value: string): Promise<void> {
  const file = process.env.GITHUB_OUTPUT;
  if (!file) return Promise.resolve();
  const marker = `PARITY_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  return appendFile(file, `${name}<<${marker}\n${value}\n${marker}\n`, "utf8");
}

async function main(): Promise<void> {
  const configInput = input("config");
  if (!configInput) throw new Error("The config input is required");
  const configPath = path.resolve(configInput);
  const outputDirectory = path.resolve(input("output-directory", "channel-parity-output"));
  const channel = input("channel");
  const failOn = input("fail-on", "unknown");
  if (failOn !== "fail" && failOn !== "unknown") throw new Error("fail-on must be fail or unknown");
  await mkdir(outputDirectory, { recursive: true });
  const report = await runParity({
    configPath,
    outputDirectory,
    ...(channel ? { channelIds: channel.split(",").map((item) => item.trim()).filter(Boolean) } : {}),
    keepRunDirectory: input("keep-run-directory", "false").toLowerCase() === "true"
  });
  const files = await writeReports(report, outputDirectory);
  await Promise.all([
    output("result", report.verdict),
    output("report-json", files.jsonPath),
    output("report-markdown", files.markdownPath)
  ]);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${markdownReport(report)}\n`, "utf8");
  console.log(`${report.verdict}: ${report.product}`);
  if (report.verdict === "FAIL") process.exitCode = 1;
  else if (report.verdict === "UNKNOWN" && failOn === "unknown") process.exitCode = 2;
}

main().catch((error) => {
  console.error(`::error::${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 3;
});
