#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolveLocale, translator } from "./i18n.js";
import { OpenClawAdapter } from "./openclaw.js";
import { ask } from "./prompts.js";
import { NodeCommandRunner } from "./runner.js";
import type { ActionReport, CheckReport, GlobalOptions } from "./types.js";
import { validateNodeVersion } from "./version.js";
import { backup, repair, setup, support, upgrade, verboseResult, type WorkflowContext } from "./workflows.js";

const commands = new Set(["menu", "setup", "check", "upgrade", "backup", "repair", "support", "help", "version"]);

function packageVersion(): string {
  const value = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version?: string };
  return value.version ?? "unknown";
}

function parseArgs(argv: string[]): GlobalOptions {
  const first = argv[0] && !argv[0].startsWith("-") ? argv[0] : "menu";
  const options: GlobalOptions = {
    command: first,
    lang: "auto",
    json: false,
    verbose: false,
    yes: false,
    dryRun: false,
    strict: false,
    deep: false,
  };
  const args = first === "menu" && argv[0]?.startsWith("-") ? argv : argv.slice(1);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") options.json = true;
    else if (arg === "--verbose") options.verbose = true;
    else if (arg === "--yes") options.yes = true;
    else if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--strict") options.strict = true;
    else if (arg === "--deep") options.deep = true;
    else if (arg === "--lang") {
      const value = args[++index];
      if (value !== "auto" && value !== "zh-CN" && value !== "en") throw new Error("--lang must be auto, zh-CN, or en");
      options.lang = value;
    } else if (arg === "--output") {
      const value = args[++index];
      if (!value) throw new Error("--output requires a path");
      options.output = value;
    } else if (arg === "--channel") {
      const value = args[++index];
      if (value !== "stable" && value !== "beta") throw new Error("--channel must be stable or beta");
      options.channel = value;
    } else if (arg === "--help" || arg === "-h") options.command = "help";
    else if (arg === "--version" || arg === "-V") options.command = "version";
    else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

function printHuman(report: CheckReport | ActionReport): void {
  const rows = "checks" in report ? report.checks : report.steps;
  for (const row of rows) {
    const icon = row.status === "ok" ? "✓" : row.status === "error" ? "✗" : row.status === "warning" ? "!" : "-";
    console.log(`${icon} ${row.summary}`);
    if (row.sourceCommand) console.log(`  ${row.sourceCommand}`);
    if ("fixHint" in row && row.fixHint) console.log(`  → ${row.fixHint}`);
  }
  console.log(`\n${report.overall.toUpperCase()}`);
}

function exitFor(report: CheckReport | ActionReport, strict: boolean): number {
  if (report.overall === "error") return 1;
  if (strict && report.overall === "warning") return 1;
  return 0;
}

async function runCommand(options: GlobalOptions): Promise<number> {
  const node = validateNodeVersion();
  const locale = resolveLocale(options.lang);
  const t = translator(locale);
  if (!node.ok) {
    const payload = { error: t("nodeUnsupported"), reason: node.reason, node: process.versions.node };
    if (options.json) console.log(JSON.stringify(payload, null, 2)); else console.error(`${t("nodeUnsupported")} ${node.reason ?? ""}`);
    return 2;
  }
  if (!commands.has(options.command)) throw new Error(`Unknown command: ${options.command}`);
  if (options.command === "version") {
    console.log(packageVersion());
    return 0;
  }
  if (options.command === "help") {
    console.log(t("help"));
    console.log("Options: --lang auto|zh-CN|en --json --verbose --yes --dry-run --strict --deep --output <path> --channel stable|beta");
    return 0;
  }
  if (options.command === "menu") {
    if (options.json || !process.stdin.isTTY) throw new Error("menu requires an interactive terminal");
    console.log(`\n${t("title")}\n${t("communityNotice")}\n${t("privacy")}\n`);
    const choice = await ask(t("menuPrompt"));
    const selected = ({ "1": "setup", "2": "check", "3": "upgrade", "4": "backup", "5": "repair", "6": "support", "7": "exit" } as Record<string, string>)[choice];
    if (!selected) { console.error(t("invalidChoice")); return 2; }
    if (selected === "exit") return 0;
    return await runCommand({ ...options, command: selected });
  }
  if (options.command === "setup" && options.json && !options.dryRun) {
    throw new Error("setup is interactive and does not support --json; use --dry-run for a non-mutating preview");
  }

  const runner = new NodeCommandRunner();
  const context: WorkflowContext = {
    options,
    locale,
    t,
    runner,
    note(message) { if (!options.json) console.log(message); },
    showResult(result) {
      if (!options.json && options.verbose) {
        const content = verboseResult(result);
        if (content) console.log(`\n${t("rawOutput")}:\n${content}`);
      }
    },
  };

  let result: CheckReport | ActionReport;
  if (options.command === "check") {
    const adapter = new OpenClawAdapter(runner);
    result = (await adapter.check(locale, t, options.deep)).report;
  } else if (options.command === "setup") result = await setup(context);
  else if (options.command === "upgrade") result = await upgrade(context);
  else if (options.command === "backup") result = await backup(context);
  else if (options.command === "repair") result = await repair(context);
  else result = await support(context);

  if (options.json) console.log(JSON.stringify(result, null, 2)); else printHuman(result);
  return exitFor(result, options.strict);
}

try {
  const options = parseArgs(process.argv.slice(2));
  process.exitCode = await runCommand(options);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 2;
}
