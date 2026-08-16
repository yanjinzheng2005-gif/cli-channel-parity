import path from "node:path";

export type TemplateValues = Record<string, string>;

const TEMPLATE = /\$\{([A-Z][A-Z0-9_]*)\}/g;

export function expandTemplate(value: string, values: TemplateValues): string {
  return value.replace(TEMPLATE, (_match, name: string) => {
    const replacement = values[name];
    if (replacement === undefined) throw new Error(`Unknown template variable: \${${name}}`);
    return replacement;
  });
}

export function baseTemplateValues(input: {
  runDirectory: string;
  configDirectory: string;
  workDirectory: string;
  channel: string;
}): TemplateValues {
  return {
    RUN_DIR: input.runDirectory,
    CONFIG_DIR: input.configDirectory,
    WORK_DIR: input.workDirectory,
    CHANNEL: input.channel,
    PATH: process.env.PATH ?? "",
    PATH_DELIMITER: path.delimiter,
    EXECUTABLE_SUFFIX: process.platform === "win32" ? ".cmd" : ""
  };
}
