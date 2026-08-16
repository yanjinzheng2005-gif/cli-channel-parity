import os from "node:os";

const BUILTIN_SECRET_PATTERNS = [
  /\bghp_[A-Za-z0-9]{20,}\b/g,
  /\bgithub_pat_[A-Za-z0-9_]{20,}\b/g,
  /\bnpm_[A-Za-z0-9]{20,}\b/g,
  /\bsk-[A-Za-z0-9_-]{16,}\b/g,
  /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}=*/gi
];
const QUERY_SECRET_PATTERN = /([?&](?:token|key|secret|password|auth)=)[^&\s]+/gi;
const SECRET_ENVIRONMENT_NAME = /(?:^|_)(?:TOKEN|SECRET|PASSWORD|PASSWD|KEY|AUTH|CREDENTIALS?|JWT)(?:$|_)/i;

type RedactionEnvironment = Record<string, string | undefined>;

function escaped(value: string): RegExp {
  return new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
}

export class Redactor {
  readonly #values: string[];

  constructor(values: string[] = [], environments: Array<RedactionEnvironment | undefined> = []) {
    const secretValues = values.filter((value) => value.length >= 4);
    for (const environment of environments) {
      for (const [key, value] of Object.entries(environment ?? {})) {
        if (SECRET_ENVIRONMENT_NAME.test(key) && typeof value === "string" && value.length >= 12) {
          secretValues.push(value);
        }
      }
    }
    this.#values = [...new Set(secretValues)].sort((a, b) => b.length - a.length);
  }

  text(input: string): string {
    let output = input;
    const home = os.homedir();
    if (home && home !== "/") output = output.replace(escaped(home), "$HOME");
    for (const value of this.#values) output = output.replace(escaped(value), "[REDACTED]");
    for (const pattern of BUILTIN_SECRET_PATTERNS) output = output.replace(pattern, "[REDACTED]");
    output = output.replace(QUERY_SECRET_PATTERN, "$1[REDACTED]");
    return output;
  }

  list(values: string[]): string[] {
    return values.map((value) => this.text(value));
  }
}

export function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(value)) return value;
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function commandText(argv: string[]): string {
  return argv.map(shellQuote).join(" ");
}
