import { spawn } from "node:child_process";
import path from "node:path";
import type { CommandSpec, ProcessResult } from "./types.js";

export interface ExecuteContext {
  cwd: string;
  env: NodeJS.ProcessEnv;
  defaultTimeoutMs: number;
  defaultMaxOutputBytes: number;
}

function windowsCommand(argv: string[]): { file: string; args: string[] } {
  const [file = "", ...args] = argv;
  if (process.platform !== "win32" || !/\.(?:cmd|bat)$/i.test(file)) return { file, args };
  // Node passes each argument to cmd.exe using Windows' native argument quoting.
  // Pre-quoting the command here makes cmd.exe receive literal \" characters.
  return { file: process.env.ComSpec ?? "cmd.exe", args: ["/d", "/c", file, ...args] };
}

function terminateWindowsProcessTree(pid: number): void {
  try {
    const killer = spawn("taskkill.exe", ["/pid", String(pid), "/t", "/f"], {
      shell: false,
      stdio: "ignore",
      windowsHide: true
    });
    killer.on("error", () => {
      // The target may have already exited between the timeout and taskkill.
    });
    killer.unref();
  } catch {
    // The ordinary child.kill fallback below still handles the direct process.
  }
}

export async function execute(spec: CommandSpec, context: ExecuteContext): Promise<ProcessResult> {
  const started = Date.now();
  const timeoutMs = spec.timeoutMs ?? context.defaultTimeoutMs;
  const maxBytes = spec.maxOutputBytes ?? context.defaultMaxOutputBytes;
  const cwd = spec.cwd ?? context.cwd;
  const command = windowsCommand(spec.argv);
  let stdout = "";
  let stderr = "";
  let stdoutBytes = 0;
  let stderrBytes = 0;
  let truncated = false;
  let timedOut = false;

  return await new Promise<ProcessResult>((resolve) => {
    let settled = false;
    let child;
    try {
      child = spawn(command.file, command.args, {
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

    const append = (target: "stdout" | "stderr", chunk: Buffer): void => {
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
    child.stdout.on("data", (chunk: Buffer) => append("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => append("stderr", chunk));

    const timer = setTimeout(() => {
      timedOut = true;
      if (child.pid) {
        try {
          if (process.platform === "win32") terminateWindowsProcessTree(child.pid);
          else process.kill(-child.pid, "SIGTERM");
        } catch {
          child.kill("SIGTERM");
        }
        setTimeout(() => {
          if (!settled) {
            try {
              if (process.platform === "win32") {
                terminateWindowsProcessTree(child.pid!);
                child.kill("SIGKILL");
              } else process.kill(-child.pid!, "SIGKILL");
            } catch {
              // The process may have already exited.
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

export function isAllowed(result: ProcessResult, spec: CommandSpec): boolean {
  return !result.timedOut && !result.spawnError && (spec.allowedExitCodes ?? [0]).includes(result.exitCode ?? -999);
}

export function commandBasename(argv: string[]): string {
  return path.basename(argv[0] ?? "command");
}
