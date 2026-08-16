import { access, readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import type { Verdict } from "./types.js";

async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

function executableNames(name: string, env: NodeJS.ProcessEnv): string[] {
  if (process.platform !== "win32" || path.extname(name)) return [name];
  const extensions = (env.PATHEXT ?? ".COM;.EXE;.BAT;.CMD").split(";").filter(Boolean);
  return [name, ...extensions.map((extension) => `${name}${extension.toLowerCase()}`), ...extensions.map((extension) => `${name}${extension.toUpperCase()}`)];
}

export async function findExecutables(name: string, env: NodeJS.ProcessEnv): Promise<string[]> {
  if (name.includes(path.sep) || (path.posix.sep !== path.sep && name.includes(path.posix.sep))) {
    return await exists(name) ? [await canonical(name)] : [];
  }
  const matches: string[] = [];
  const seen = new Set<string>();
  for (const directory of (env.PATH ?? "").split(path.delimiter).filter(Boolean)) {
    for (const candidateName of executableNames(name, env)) {
      const candidate = path.resolve(directory, candidateName);
      if (!(await exists(candidate))) continue;
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

export async function canonical(file: string): Promise<string> {
  try {
    return await realpath(file);
  } catch {
    return path.resolve(file);
  }
}

export function samePath(left: string, right: string): boolean {
  const a = path.resolve(left);
  const b = path.resolve(right);
  return process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
}

export function parseVersion(output: string): string | undefined {
  const match = output.match(/(?:^|\s)v?(\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)(?:\s|$)/m);
  return match?.[1];
}

export function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, "");
}

export function isTransientFailure(output: string, extraPatterns: string[] = []): boolean {
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
      return new RegExp(pattern, "i").test(output);
    } catch {
      return output.toLowerCase().includes(pattern.toLowerCase());
    }
  });
}

export function aggregateVerdicts(verdicts: Verdict[]): Verdict {
  if (verdicts.includes("FAIL")) return "FAIL";
  if (verdicts.includes("UNKNOWN")) return "UNKNOWN";
  return "PASS";
}

export async function pathEvidence(file: string): Promise<string> {
  try {
    const info = await stat(file);
    return `${file} (${info.size} bytes)`;
  } catch {
    return file;
  }
}

export async function directoryEntries(directory: string): Promise<string[]> {
  try {
    return await readdir(directory);
  } catch {
    return [];
  }
}
