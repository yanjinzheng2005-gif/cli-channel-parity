import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ChannelConfig, CommandSpec, ParityConfig } from "./types.js";

function object(value: unknown, at: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${at} must be an object`);
  return value as Record<string, unknown>;
}

function text(value: unknown, at: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${at} must be a non-empty string`);
  return value;
}

function optionalText(value: unknown, at: string): string | undefined {
  return value === undefined ? undefined : text(value, at);
}

function stringMap(value: unknown, at: string): Record<string, string> | undefined {
  if (value === undefined) return undefined;
  const source = object(value, at);
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(source)) result[key] = text(entry, `${at}.${key}`);
  return result;
}

function stringArray(value: unknown, at: string): string[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error(`${at} must be an array`);
  return value.map((entry, index) => text(entry, `${at}[${index}]`));
}

function positiveInteger(value: unknown, at: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || Number(value) <= 0) throw new Error(`${at} must be a positive integer`);
  return Number(value);
}

function command(value: unknown, at: string): CommandSpec {
  const source = object(value, at);
  const argv = stringArray(source.argv, `${at}.argv`);
  if (!argv?.length) throw new Error(`${at}.argv must contain at least one item`);
  const allowedExitCodes = source.allowedExitCodes === undefined
    ? undefined
    : (() => {
        if (!Array.isArray(source.allowedExitCodes) || !source.allowedExitCodes.every(Number.isInteger)) {
          throw new Error(`${at}.allowedExitCodes must contain integers`);
        }
        return source.allowedExitCodes as number[];
      })();
  const result: CommandSpec = { argv };
  const cwd = optionalText(source.cwd, `${at}.cwd`);
  const env = stringMap(source.env, `${at}.env`);
  const timeoutMs = positiveInteger(source.timeoutMs, `${at}.timeoutMs`);
  const maxOutputBytes = positiveInteger(source.maxOutputBytes, `${at}.maxOutputBytes`);
  if (cwd !== undefined) result.cwd = cwd;
  if (env !== undefined) result.env = env;
  if (timeoutMs !== undefined) result.timeoutMs = timeoutMs;
  if (maxOutputBytes !== undefined) result.maxOutputBytes = maxOutputBytes;
  if (allowedExitCodes !== undefined) result.allowedExitCodes = allowedExitCodes;
  return result;
}

function optionalCommand(value: unknown, at: string): CommandSpec | undefined {
  return value === undefined ? undefined : command(value, at);
}

function channel(value: unknown, index: number): ChannelConfig {
  const at = `channels[${index}]`;
  const source = object(value, at);
  const result: ChannelConfig = {
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
  if (label !== undefined) result.label = label;
  if (expectedVersion !== undefined) result.expectedVersion = expectedVersion;
  if (expectedExecutablePath !== undefined) result.expectedExecutablePath = expectedExecutablePath;
  if (version !== undefined) result.version = version;
  if (launch !== undefined) result.launch = launch;
  if (uninstall !== undefined) result.uninstall = uninstall;
  if (residuePaths !== undefined) result.residuePaths = residuePaths;
  if (env !== undefined) result.env = env;
  if (transientPatterns !== undefined) result.transientPatterns = transientPatterns;
  if (source.pathPolicy !== undefined) {
    if (!['report', 'single', 'first-must-match'].includes(String(source.pathPolicy))) {
      throw new Error(`${at}.pathPolicy must be report, single, or first-must-match`);
    }
    result.pathPolicy = source.pathPolicy as NonNullable<ChannelConfig["pathPolicy"]>;
  }
  if (source.helpers !== undefined) {
    if (!Array.isArray(source.helpers)) throw new Error(`${at}.helpers must be an array`);
    result.helpers = source.helpers.map((entry, helperIndex) => {
      const helper = object(entry, `${at}.helpers[${helperIndex}]`);
      return {
        name: text(helper.name, `${at}.helpers[${helperIndex}].name`),
        path: text(helper.path, `${at}.helpers[${helperIndex}].path`),
        required: helper.required === undefined ? true : Boolean(helper.required)
      };
    });
  }
  return result;
}

export async function loadConfig(configPath: string): Promise<ParityConfig> {
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(configPath, "utf8"));
  } catch (error) {
    throw new Error(`Cannot read JSON config ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const source = object(raw, "config");
  if (source.schemaVersion !== 1) throw new Error("config.schemaVersion must be 1");
  if (!Array.isArray(source.channels) || source.channels.length === 0) throw new Error("config.channels must not be empty");
  const channels = source.channels.map(channel);
  const ids = new Set<string>();
  for (const entry of channels) {
    if (ids.has(entry.id)) throw new Error(`Duplicate channel id: ${entry.id}`);
    ids.add(entry.id);
  }
  const result: ParityConfig = {
    schemaVersion: 1,
    product: text(source.product, "config.product"),
    channels
  };
  const expectedVersion = optionalText(source.expectedVersion, "config.expectedVersion");
  const redactions = stringArray(source.redactions, "config.redactions");
  if (expectedVersion !== undefined) result.expectedVersion = expectedVersion;
  if (redactions !== undefined) result.redactions = redactions;
  if (source.defaults !== undefined) {
    const defaults = object(source.defaults, "config.defaults");
    result.defaults = {};
    const timeoutMs = positiveInteger(defaults.timeoutMs, "config.defaults.timeoutMs");
    const maxOutputBytes = positiveInteger(defaults.maxOutputBytes, "config.defaults.maxOutputBytes");
    if (timeoutMs !== undefined) result.defaults.timeoutMs = timeoutMs;
    if (maxOutputBytes !== undefined) result.defaults.maxOutputBytes = maxOutputBytes;
  }
  return result;
}

export function resolveConfigPath(input: string): string {
  return path.resolve(process.cwd(), input);
}
