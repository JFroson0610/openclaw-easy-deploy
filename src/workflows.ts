import os from "node:os";
import type { MessageKey } from "./i18n.js";
import { OpenClawAdapter, parseJsonLoose } from "./openclaw.js";
import { confirm, ask } from "./prompts.js";
import { commandText } from "./runner.js";
import { redact } from "./redact.js";
import type { ActionReport, ActionStep, CommandResult, CommandRunner, GlobalOptions, Locale, OverallStatus } from "./types.js";

type T = (key: MessageKey) => string;

export interface WorkflowContext {
  options: GlobalOptions;
  locale: Locale;
  t: T;
  runner: CommandRunner;
  note(message: string): void;
  showResult(result: CommandResult): void;
}

function overall(steps: ActionStep[]): OverallStatus {
  if (steps.some((step) => step.status === "error")) return "error";
  if (steps.some((step) => step.status === "warning" || step.status === "skipped")) return "warning";
  return "ok";
}

function report(ctx: WorkflowContext, action: string, steps: ActionStep[]): ActionReport {
  return { schemaVersion: 1, generatedAt: new Date().toISOString(), locale: ctx.locale, action, overall: overall(steps), steps };
}

function step(id: string, status: ActionStep["status"], summary: string, result?: CommandResult): ActionStep {
  return { id, status, summary, sourceCommand: result ? commandText(result.command, result.args) : null };
}

function artifactDetails(result: CommandResult): string {
  const parsed = parseJsonLoose(result.stdout);
  if (!parsed || typeof parsed !== "object") return "";
  const record = parsed as Record<string, unknown>;
  const path = [record.path, record.file, record.output, record.archivePath].find((value) => typeof value === "string");
  const size = [record.size, record.bytes, record.sizeBytes].find((value) => typeof value === "number" || typeof value === "string");
  const details = [path ? `path=${redact(String(path))}` : "", size !== undefined ? `size=${String(size)}` : ""].filter(Boolean);
  return details.length > 0 ? ` (${details.join(", ")})` : "";
}

async function run(ctx: WorkflowContext, command: string, args: string[], interactive = false, env?: NodeJS.ProcessEnv): Promise<CommandResult> {
  const result = await ctx.runner.run(command, args, { interactive, ...(env ? { env } : {}) });
  ctx.showResult(result);
  return result;
}

async function installOfficial(ctx: WorkflowContext): Promise<CommandResult> {
  if (ctx.options.dryRun) {
    const command = os.platform() === "win32" ? "iwr -useb https://openclaw.ai/install.ps1 | iex" : "curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash";
    ctx.note(`${ctx.t("dryRun")} ${command}`);
    return { command: "openclaw-official-installer", args: [], exitCode: 0, stdout: "", stderr: "" };
  }
  if (!(await confirm(ctx.t("confirmInstall"), ctx.options.yes))) {
    return { command: "openclaw-official-installer", args: [], exitCode: 1, stdout: "", stderr: ctx.t("cancelled") };
  }
  if (os.platform() === "win32") {
    return await run(ctx, "powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard"], true);
  }
  return await run(ctx, "bash", ["-c", "curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --no-onboard"], true);
}

export async function setup(ctx: WorkflowContext): Promise<ActionReport> {
  const adapter = new OpenClawAdapter(ctx.runner);
  const steps: ActionStep[] = [];
  ctx.note(ctx.t("integrations"));
  ctx.note(ctx.t("privacy"));

  if (!(await adapter.available())) {
    const install = await installOfficial(ctx);
    const installStatus = ctx.options.dryRun ? "skipped" : install.exitCode === 0 ? "ok" : "error";
    const installSummary = ctx.options.dryRun ? ctx.t("dryRun") : install.exitCode === 0 ? ctx.t("completed") : ctx.t("missingOpenClaw");
    steps.push(step("setup/install", installStatus, installSummary, install));
    if (install.exitCode !== 0 || ctx.options.dryRun) return report(ctx, "setup", steps);
  }

  let choice = "3";
  if (!ctx.options.yes && process.stdin.isTTY) choice = await ask(ctx.t("chooseSetup"));
  if (!["1", "2", "3", "4"].includes(choice)) {
    steps.push(step("setup/choice", "warning", ctx.t("invalidChoice")));
    return report(ctx, "setup", steps);
  }
  if (ctx.options.dryRun) {
    steps.push(step("setup/onboard", "skipped", `${ctx.t("dryRun")} openclaw onboard`));
    steps.push(step("setup/feishu", "skipped", `${ctx.t("dryRun")} openclaw channels login --channel feishu`));
    return report(ctx, "setup", steps);
  }
  if (choice === "1" || choice === "3") {
    const onboard = await run(ctx, "openclaw", ["onboard"], true);
    steps.push(step("setup/onboard", onboard.exitCode === 0 ? "ok" : "error", onboard.exitCode === 0 ? ctx.t("setupOk") : ctx.t("checkError"), onboard));
    if (onboard.exitCode !== 0) return report(ctx, "setup", steps);
  }
  if (choice === "2" || choice === "3") {
    const feishu = await run(ctx, "openclaw", ["channels", "login", "--channel", "feishu"], true);
    steps.push(step("setup/feishu", feishu.exitCode === 0 ? "ok" : "error", feishu.exitCode === 0 ? ctx.t("setupOk") : ctx.t("checkError"), feishu));
  }
  if (choice === "4") steps.push(step("setup/deferred", "skipped", ctx.t("cancelled")));
  return report(ctx, "setup", steps);
}

export async function backup(ctx: WorkflowContext, onlyConfig = false): Promise<ActionReport> {
  const args = ["backup", "create", "--verify", "--json"];
  if (onlyConfig) args.splice(2, 0, "--only-config");
  if (ctx.options.output) args.splice(args.length - 1, 0, "--output", ctx.options.output);
  if (ctx.options.dryRun) args.splice(args.length - 1, 0, "--dry-run");
  const result = await run(ctx, "openclaw", args);
  const ok = result.exitCode === 0 && parseJsonLoose(result.stdout) !== undefined;
  const summary = ok ? `${ctx.t("backupOk")}${artifactDetails(result)}` : ctx.t("backupFailed");
  return report(ctx, "backup", [step("backup/create", ok ? "ok" : "error", summary, result)]);
}

export async function upgrade(ctx: WorkflowContext): Promise<ActionReport> {
  const steps: ActionStep[] = [];
  const preview = await run(ctx, "openclaw", ["update", "--dry-run", "--json"]);
  steps.push(step("upgrade/preview", preview.exitCode === 0 ? "ok" : "error", preview.exitCode === 0 ? ctx.t("checkOk") : ctx.t("checkError"), preview));
  if (preview.exitCode !== 0 || ctx.options.dryRun) return report(ctx, "upgrade", steps);

  const backupReport = await backup(ctx);
  steps.push(...backupReport.steps);
  if (backupReport.overall === "error") return report(ctx, "upgrade", steps);
  if (!(await confirm(ctx.t("confirmUpgrade"), ctx.options.yes))) {
    steps.push(step("upgrade/apply", "skipped", ctx.t("cancelled")));
    return report(ctx, "upgrade", steps);
  }
  const updateArgs = ["update", "--json"];
  if (ctx.options.channel === "beta") updateArgs.push("--channel", "beta");
  const update = await run(ctx, "openclaw", updateArgs);
  steps.push(step("upgrade/apply", update.exitCode === 0 ? "ok" : "error", update.exitCode === 0 ? ctx.t("upgradeOk") : ctx.t("upgradeFailed"), update));
  if (update.exitCode !== 0) return report(ctx, "upgrade", steps);

  const post = await run(ctx, "openclaw", ["doctor", "--post-upgrade", "--json"]);
  steps.push(step("upgrade/post-doctor", post.exitCode === 0 ? "ok" : "error", post.exitCode === 0 ? ctx.t("checkOk") : ctx.t("checkError"), post));
  const gateway = await run(ctx, "openclaw", ["gateway", "status", "--deep", "--json"]);
  steps.push(step("upgrade/gateway", gateway.exitCode === 0 ? "ok" : "error", gateway.exitCode === 0 ? ctx.t("checkOk") : ctx.t("checkError"), gateway));
  return report(ctx, "upgrade", steps);
}

export async function repair(ctx: WorkflowContext): Promise<ActionReport> {
  const steps: ActionStep[] = [];
  const doctor = await run(ctx, "openclaw", ["doctor", "--json"]);
  const doctorParsed = parseJsonLoose(doctor.stdout);
  const inspectStatus = doctor.exitCode === 0 ? "ok" : doctorParsed !== undefined ? "warning" : "error";
  steps.push(step("repair/inspect", inspectStatus, inspectStatus === "ok" ? ctx.t("checkOk") : inspectStatus === "warning" ? ctx.t("checkWarning") : ctx.t("checkError"), doctor));
  if (inspectStatus === "error" || ctx.options.dryRun) return report(ctx, "repair", steps);

  const backupReport = await backup(ctx, true);
  steps.push(...backupReport.steps);
  if (backupReport.overall === "error") return report(ctx, "repair", steps);
  ctx.note(ctx.t("repairImpact"));
  if (!(await confirm(ctx.t("confirmRepair"), ctx.options.yes))) {
    steps.push(step("repair/fix", "skipped", ctx.t("cancelled")));
    return report(ctx, "repair", steps);
  }
  const fixArgs = ["doctor", "--fix"];
  if (ctx.options.yes || ctx.options.json) fixArgs.push("--non-interactive");
  const fix = await run(ctx, "openclaw", fixArgs, !ctx.options.yes && !ctx.options.json);
  steps.push(step("repair/fix", fix.exitCode === 0 ? "ok" : "error", fix.exitCode === 0 ? ctx.t("repairOk") : ctx.t("checkError"), fix));
  if (fix.exitCode === 0 && await confirm(ctx.t("confirmRestart"), ctx.options.yes)) {
    const restart = await run(ctx, "openclaw", ["gateway", "restart"]);
    steps.push(step("repair/restart", restart.exitCode === 0 ? "ok" : "error", restart.exitCode === 0 ? ctx.t("repairOk") : ctx.t("checkError"), restart));
  }
  return report(ctx, "repair", steps);
}

export async function support(ctx: WorkflowContext): Promise<ActionReport> {
  const steps: ActionStep[] = [];
  if (!(await confirm(ctx.t("confirmSupport"), ctx.options.yes))) {
    steps.push(step("support/export", "skipped", ctx.t("cancelled")));
    return report(ctx, "support", steps);
  }
  const args = ["gateway", "diagnostics", "export", "--json"];
  if (ctx.options.output) args.splice(args.length - 1, 0, "--output", ctx.options.output);
  const result = await run(ctx, "openclaw", args);
  const ok = result.exitCode === 0 && parseJsonLoose(result.stdout) !== undefined;
  const summary = ok ? `${ctx.t("supportOk")}${artifactDetails(result)}` : ctx.t("checkError");
  steps.push(step("support/export", ok ? "ok" : "error", summary, result));
  return report(ctx, "support", steps);
}

export function verboseResult(result: CommandResult): string {
  const content = [result.stdout, result.stderr].filter(Boolean).join("\n");
  return redact(content);
}
