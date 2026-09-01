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

function record(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function child(value: unknown, key: string): Record<string, unknown> | undefined {
  return record(record(value)?.[key]);
}

function severityOf(value: unknown): "ok" | "warning" | "error" {
  const findings = Array.isArray(record(value)?.findings) ? record(value)?.findings as unknown[] : [];
  let status: "ok" | "warning" | "error" = "ok";
  for (const finding of findings) {
    const entry = record(finding);
    const severity = String(entry?.severity ?? entry?.level ?? "").toLowerCase();
    if (severity === "error" || severity === "critical" || severity === "fatal") return "error";
    if (severity === "warning" || severity === "warn") status = "warning";
  }
  return status;
}

function classifyParsed(id: string, parsed: unknown, t: T): Pick<CheckItem, "status" | "summary" | "fixHint"> {
  const root = record(parsed);
  if (!root) return { status: "warning", summary: t("checkWarning"), fixHint: null };

  if (id === "openclaw/update") {
    const availability = child(root, "availability");
    const registry = child(child(root, "update"), "registry");
    const updateAvailable = availability?.available === true
      || availability?.hasGitUpdate === true
      || availability?.hasRegistryUpdate === true;
    if (updateAvailable) return { status: "warning", summary: t("updateAvailable"), fixHint: t("updateHint") };
    if (availability || typeof registry?.latestVersion === "string") {
      return { status: "ok", summary: t("checkOk"), fixHint: null };
    }
  }

  if (id === "openclaw/doctor") {
    const severity = severityOf(root);
    if (severity === "error") return { status: "error", summary: t("checkIssuesFound"), fixHint: t("doctorHint") };
    if (severity === "warning" || root.ok === false) {
      return { status: "warning", summary: t("checkIssuesFound"), fixHint: null };
    }
    return { status: "ok", summary: t("checkOk"), fixHint: null };
  }

  if (id === "openclaw/gateway") {
    const rpc = child(root, "rpc");
    const gateway = child(root, "gateway");
    if (rpc?.ok === false || gateway?.reachable === false) {
      return { status: "error", summary: t("gatewayUnavailable"), fixHint: t("gatewayHint") };
    }
  }

  if (id === "openclaw/status") {
    const gateway = child(root, "gateway");
    const securitySummary = child(child(root, "securityAudit"), "summary");
    const taskAudit = child(root, "taskAudit");
    if (gateway?.reachable === false || Number(securitySummary?.critical ?? 0) > 0 || Number(taskAudit?.errors ?? 0) > 0) {
      return { status: "error", summary: gateway?.reachable === false ? t("gatewayUnavailable") : t("checkIssuesFound"), fixHint: gateway?.reachable === false ? t("gatewayHint") : null };
    }
    if (Number(securitySummary?.warn ?? 0) > 0 || Number(taskAudit?.warnings ?? 0) > 0
      || (Array.isArray(root.degradedSecretOwners) && root.degradedSecretOwners.length > 0)
      || (Array.isArray(root.degradedPlugins) && root.degradedPlugins.length > 0)) {
      return { status: "warning", summary: t("checkIssuesFound"), fixHint: null };
    }
  }

  if (root.ok === false || root.healthy === false) {
    return { status: "error", summary: t("checkIssuesFound"), fixHint: null };
  }
  return { status: "ok", summary: t("checkOk"), fixHint: null };
}

function unsupported(result: CommandResult): boolean {
  return /unknown (?:command|option)|unrecognized|not supported|not found/i.test(`${result.stderr}\n${result.stdout}`);
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
  const classification = classifyParsed(id, parsed, t);
  return {
    id,
    status: classification.status,
    summary: classification.summary,
    sourceCommand: source(result),
    fixHint: classification.fixHint,
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
    const version = result.exitCode === 0 ? extractOpenClawVersion(result.stdout) : null;
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

export function extractOpenClawVersion(output: string): string | null {
  const dateVersion = output.match(/\b\d{4}\.\d{1,2}\.\d{1,2}(?:[-+][0-9A-Za-z.-]+)?\b/);
  if (dateVersion) return dateVersion[0];
  const semver = output.match(/\bv?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?\b/);
  return semver?.[0]?.replace(/^v/, "") ?? null;
}
