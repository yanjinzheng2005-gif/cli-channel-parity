import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ChannelReport, RunReport } from "./types.js";

function mark(verdict: string): string {
  return verdict === "PASS" ? "✅" : verdict === "FAIL" ? "❌" : "⚠️";
}

function code(value: string): string {
  const clean = value.replace(/[ \t]+$/gm, "").trimEnd();
  return `\`${clean.replace(/`/g, "\\`")}\``;
}

function channelMarkdown(channel: ChannelReport): string {
  const lines = [
    `## ${mark(channel.verdict)} ${channel.label}: ${channel.verdict}`,
    "",
    `- Channel ID: ${code(channel.id)}`,
    `- Expected version: ${channel.expectedVersion ? code(channel.expectedVersion) : "not declared"}`,
    `- Actual version: ${channel.actualVersion ? code(channel.actualVersion) : "not proven"}`,
    `- Executable used: ${channel.actualExecutablePath ? code(channel.actualExecutablePath) : "not found"}`,
    `- Re-run: ${code(channel.rerunCommand)}`,
    "",
    "| Check | Result | What happened |",
    "|---|---:|---|"
  ];
  for (const check of channel.checks) {
    lines.push(`| ${check.title.replace(/\|/g, "\\|")} | ${mark(check.verdict)} ${check.verdict} | ${check.summary.replace(/\|/g, "\\|").replace(/\n/g, " ")} |`);
  }
  lines.push("", "<details><summary>Evidence</summary>", "");
  for (const check of channel.checks) {
    lines.push(`### ${check.title}`, "", ...check.evidence.map((entry) => `- ${code(entry)}`), "");
  }
  lines.push("</details>", "");
  return lines.join("\n");
}

export function markdownReport(report: RunReport): string {
  return [
    `# ${report.product} — channel parity receipt`,
    "",
    `**${mark(report.verdict)} Overall result: ${report.verdict}**`,
    "",
    `Tested ${report.startedAt} → ${report.finishedAt} on ${report.environment.os}/${report.environment.arch} with ${report.environment.node}.`,
    "",
    `> ${report.scopeNotice}`,
    "",
    ...report.channels.map(channelMarkdown)
  ].join("\n").trimEnd();
}

export async function writeReports(report: RunReport, outputDirectory: string): Promise<{ jsonPath: string; markdownPath: string }> {
  await mkdir(outputDirectory, { recursive: true });
  const jsonPath = path.join(outputDirectory, "channel-parity-report.json");
  const markdownPath = path.join(outputDirectory, "channel-parity-report.md");
  await writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await writeFile(markdownPath, `${markdownReport(report)}\n`, "utf8");
  return { jsonPath, markdownPath };
}
