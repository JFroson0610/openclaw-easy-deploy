export type Locale = "zh-CN" | "en";
export type CheckStatus = "ok" | "warning" | "error" | "skipped";
export type OverallStatus = "ok" | "warning" | "error";

export interface GlobalOptions {
  command: string;
  lang: "auto" | Locale;
  json: boolean;
  verbose: boolean;
  yes: boolean;
  dryRun: boolean;
  strict: boolean;
  deep: boolean;
  output?: string;
  channel?: "stable" | "beta";
}

export interface CommandResult {
  command: string;
  args: string[];
  exitCode: number;
  stdout: string;
  stderr: string;
  parsed?: unknown;
}

export interface RunOptions {
  interactive?: boolean;
  env?: NodeJS.ProcessEnv;
}

export interface CommandRunner {
  run(command: string, args: string[], options?: RunOptions): Promise<CommandResult>;
}

export interface CheckItem {
  id: string;
  status: CheckStatus;
  summary: string;
  sourceCommand: string | null;
  fixHint: string | null;
}

export interface CheckReport {
  schemaVersion: 1;
  generatedAt: string;
  locale: Locale;
  openclawVersion: string | null;
  overall: OverallStatus;
  checks: CheckItem[];
}

export interface ActionStep {
  id: string;
  status: CheckStatus;
  summary: string;
  sourceCommand: string | null;
}

export interface ActionReport {
  schemaVersion: 1;
  generatedAt: string;
  locale: Locale;
  action: string;
  overall: OverallStatus;
  steps: ActionStep[];
}
