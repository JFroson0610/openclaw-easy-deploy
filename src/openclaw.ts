import { commandText } from "./runner.js";
import type { CheckItem, CheckReport, CommandResult, CommandRunner, Locale, OverallStatus } from "./types.js";
import type { MessageKey } from "./i18n.js";
import { isOpenClawAtLeast } from "./version.js";

type T = (key: MessageKey) => string;

export function parseJsonLoose(text: string): unknown | undefined {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    const objectStart = trimmed.indexOf("{");
    const objectEnd = trimmed.lastIndexOf("}");
    if (objectStart >= 0 && objectEnd > objectStart) {
      try { return JSON.parse(trimmed.slice(objectStart, objectEnd + 1)); } catch { /* continue */ }
    }
    const arrayStart = trimmed.indexOf("[");
    const arrayEnd = trimmed.lastIndexOf("]");
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      try { return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1)); } catch { /* no JSON */ }
    }
    return undefined;
  }
}

function source(result: CommandResult): string {
  return commandText(result.command, result.args);
}

function unsupported(result: CommandResult): boolean {
  return /unknown (?:command|option)|unrecognized|not supported|not found/i.test(`${result.stderr}\n${result.stdout}`);
}

function parsedIsUnhealthy(parsed: unknown): boolean {
  if (!parsed || typeof parsed !== "object") return false;
  const value = parsed as Record<string, unknown>;
  if (value.ok === false || value.healthy === false) return true;
  if (typeof value.overall === "string" && /error|failed|unhealthy/i.test(value.overall)) return true;
  if (Array.isArray(value.findings)) {
    return value.findings.some((finding) => {
      if (!finding || typeof finding !== "object") return false;
      const level = (finding as Record<string, unknown>).severity ?? (finding as Record<string, unknown>).level;
      return level === "error";
    });
  }
  return false;
}

function itemFromResult(id: string, result: CommandResult, t: T): CheckItem {
  if (result.exitCode !== 0) {
    return {
      id,
      status: unsupported(result) ? "skipped" : "error",
      summary: unsupported(result) ? t("unavailable") : t("checkError"),
      sourceCommand: source(result),
      fixHint: t("updateHint"),
    };
  }
  const parsed = parseJsonLoose(result.stdout);
  if (parsed === undefined) {
    return {
      id,
      status: "warning",
      summary: t("checkWarning"),
      sourceCommand: source(result),
      fixHint: null,
    };
  }
  return {
    id,
    status: parsedIsUnhealthy(parsed) ? "error" : "ok",
    summary: parsedIsUnhealthy(parsed) ? t("checkError") : t("checkOk"),
    sourceCommand: source(result),
    fixHint: parsedIsUnhealthy(parsed) ? t("updateHint") : null,
  };
}

function overallOf(items: CheckItem[]): OverallStatus {
  if (items.some((item) => item.status === "error")) return "error";
  if (items.some((item) => item.status === "warning" || item.status === "skipped")) return "warning";
  return "ok";
}

export class OpenClawAdapter {
  constructor(private readonly runner: CommandRunner) {}

  async version(): Promise<{ version: string | null; result: CommandResult }> {
    const result = await this.runner.run("openclaw", ["--version"]);
    const version = result.exitCode === 0 ? result.stdout.trim().split(/\s+/).at(-1) ?? result.stdout.trim() : null;
    return { version: version || null, result };
  }

  async available(): Promise<boolean> {
    return (await this.version()).version !== null;
  }

  async check(locale: Locale, t: T, deep: boolean): Promise<{ report: CheckReport; results: CommandResult[] }> {
    const versionResult = await this.version();
    const checks: CheckItem[] = [];
    const results: CommandResult[] = [versionResult.result];

    checks.push({
      id: "openclaw/version",
      status: versionResult.version ? "ok" : "error",
      summary: versionResult.version ? t("checkVersionOk") : t("checkVersionMissing"),
      sourceCommand: "openclaw --version",
      fixHint: versionResult.version ? null : t("updateHint"),
    });

    if (versionResult.version && !isOpenClawAtLeast(versionResult.version)) {
      checks.push({
        id: "openclaw/compatibility",
        status: "warning",
        summary: t("versionTooOld"),
        sourceCommand: "openclaw --version",
        fixHint: t("updateHint"),
      });
    }

    if (versionResult.version) {
      const commands: Array<[string, string[]]> = [
        ["openclaw/status", ["status", "--all", "--json"]],
        ["openclaw/update", ["update", "status", "--json"]],
        ["openclaw/gateway", ["gateway", "status", "--deep", "--json"]],
        ["openclaw/doctor", ["doctor", "--json"]],
      ];
      if (deep) commands.push(["openclaw/channels", ["channels", "status", "--probe", "--json"]]);

      for (const [id, args] of commands) {
        const result = await this.runner.run("openclaw", args);
        results.push(result);
        checks.push(itemFromResult(id, result, t));
      }
    }

    return {
      report: {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        locale,
        openclawVersion: versionResult.version,
        overall: overallOf(checks),
        checks,
      },
      results,
    };
  }
}
