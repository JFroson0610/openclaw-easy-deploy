import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { resolveLocale, translator } from "../dist/i18n.js";
import { extractOpenClawVersion, OpenClawAdapter, parseJsonLoose } from "../dist/openclaw.js";
import { redact } from "../dist/redact.js";
import { isOpenClawAtLeast, validateNodeVersion } from "../dist/version.js";
import { backup, repair, upgrade } from "../dist/workflows.js";

class FakeRunner {
  constructor(results) {
    this.results = results;
    this.calls = [];
  }

  async run(command, args, options = {}) {
    this.calls.push({ command, args, options });
    const key = [command, ...args].join(" ");
    return this.results[key] ?? { command, args, exitCode: 2, stdout: "", stderr: "unknown command" };
  }
}

function context(runner, overrides = {}) {
  const options = {
    command: "backup",
    lang: "en",
    json: true,
    verbose: false,
    yes: true,
    dryRun: false,
    strict: false,
    deep: false,
    ...overrides,
  };
  return { options, locale: "en", t: translator("en"), runner, note() {}, showResult() {} };
}

function result(args, exitCode = 0, stdout = "{}", stderr = "") {
  return { command: "openclaw", args, exitCode, stdout, stderr };
}

test("accepts supported Node releases and rejects Node 23", () => {
  assert.equal(validateNodeVersion("22.22.3").ok, true);
  assert.equal(validateNodeVersion("24.15.0").ok, true);
  assert.equal(validateNodeVersion("25.9.0").ok, true);
  assert.equal(validateNodeVersion("26.0.0").ok, true);
  assert.equal(validateNodeVersion("22.22.2").ok, false);
  assert.equal(validateNodeVersion("23.9.0").ok, false);
  assert.equal(validateNodeVersion("24.14.9").ok, false);
  assert.equal(validateNodeVersion("27.0.0").ok, false);
});

test("checks the OpenClaw compatibility baseline without rejecting unknown formats", () => {
  assert.equal(isOpenClawAtLeast("2026.5.29"), true);
  assert.equal(isOpenClawAtLeast("openclaw 2026.8.1"), true);
  assert.equal(isOpenClawAtLeast("2026.4.99"), false);
  assert.equal(isOpenClawAtLeast("dev"), true);
});

test("extracts the official date version instead of the trailing commit id", () => {
  assert.equal(extractOpenClawVersion("OpenClaw 2026.8.1 (ea80657)\n"), "2026.8.1");
  assert.equal(extractOpenClawVersion("openclaw v2.3.4-beta.1"), "2.3.4-beta.1");
  assert.equal(extractOpenClawVersion("development build"), null);
});

test("selects Chinese from the system locale and falls back to English", () => {
  assert.equal(resolveLocale("auto", { LANG: "zh_CN.UTF-8" }), "zh-CN");
  assert.equal(resolveLocale("auto", { LANG: "fr_FR.UTF-8" }), "en");
  assert.equal(resolveLocale("en", { LANG: "zh_CN.UTF-8" }), "en");
});

test("redacts common credentials", () => {
  const text = "api_key=sk-secretvalue token: abcdefghijkl password=hunter2 Authorization: Bearer abc.def.ghi \"apiKey\":\"json-secret\" https://example.test/?access_token=url-secret xoxb-123456789-secret";
  const clean = redact(text);
  assert.doesNotMatch(clean, /secretvalue|abcdefghijkl|hunter2|abc\.def\.ghi|json-secret|url-secret|123456789-secret/);
  assert.match(clean, /REDACTED/);
});

test("parses JSON embedded in command output", () => {
  assert.deepEqual(parseJsonLoose("notice\n{\"ok\":true}\n"), { ok: true });
  assert.equal(parseJsonLoose("not json"), undefined);
});

test("builds the stable check schema and tolerates unknown fields", async () => {
  const commands = [
    ["status", "--all", "--json"],
    ["update", "status", "--json"],
    ["gateway", "status", "--deep", "--json"],
    ["doctor", "--json"],
  ];
  const results = {
    "openclaw --version": result(["--version"], 0, "openclaw 2026.8.1\n"),
  };
  for (const args of commands) results[["openclaw", ...args].join(" ")] = result(args, 0, "{\"ok\":true,\"future\":{\"field\":1}}");
  const adapter = new OpenClawAdapter(new FakeRunner(results));
  const { report } = await adapter.check("en", translator("en"), false);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.openclawVersion, "2026.8.1");
  assert.equal(report.overall, "ok");
  assert.equal(report.checks.length, 5);
});

test("marks unhealthy doctor findings as errors", async () => {
  const results = {
    "openclaw --version": result(["--version"], 0, "2026.8.1"),
    "openclaw status --all --json": result(["status", "--all", "--json"]),
    "openclaw update status --json": result(["update", "status", "--json"]),
    "openclaw gateway status --deep --json": result(["gateway", "status", "--deep", "--json"]),
    "openclaw doctor --json": result(["doctor", "--json"], 0, "{\"ok\":false,\"findings\":[{\"severity\":\"error\"}]}"),
  };
  const adapter = new OpenClawAdapter(new FakeRunner(results));
  const { report } = await adapter.check("en", translator("en"), false);
  assert.equal(report.overall, "error");
});

test("keeps warning-only Doctor findings as warnings", async () => {
  const results = {
    "openclaw --version": result(["--version"], 0, "OpenClaw 2026.8.1 (abc123)"),
    "openclaw status --all --json": result(["status", "--all", "--json"]),
    "openclaw update status --json": result(["update", "status", "--json"]),
    "openclaw gateway status --deep --json": result(["gateway", "status", "--deep", "--json"]),
    "openclaw doctor --json": result(["doctor", "--json"], 0, '{"ok":false,"findings":[{"severity":"warning"}]}'),
  };
  const adapter = new OpenClawAdapter(new FakeRunner(results));
  const { report } = await adapter.check("en", translator("en"), false);
  assert.equal(report.openclawVersion, "2026.8.1");
  assert.equal(report.checks.find((item) => item.id === "openclaw/doctor").status, "warning");
});

test("detects a stopped Gateway and an available update from official JSON shapes", async () => {
  const results = {
    "openclaw --version": result(["--version"], 0, "OpenClaw 2026.8.1 (abc123)"),
    "openclaw status --all --json": result(["status", "--all", "--json"], 0, '{"gateway":{"reachable":false}}'),
    "openclaw update status --json": result(["update", "status", "--json"], 0, '{"availability":{"available":true,"hasRegistryUpdate":true}}'),
    "openclaw gateway status --deep --json": result(["gateway", "status", "--deep", "--json"], 0, '{"rpc":{"ok":false,"connectFailure":{"kind":"unreachable"}}}'),
    "openclaw doctor --json": result(["doctor", "--json"], 0, '{"ok":true,"findings":[]}'),
  };
  const adapter = new OpenClawAdapter(new FakeRunner(results));
  const { report } = await adapter.check("en", translator("en"), false);
  assert.equal(report.overall, "error");
  assert.equal(report.checks.find((item) => item.id === "openclaw/update").status, "warning");
  assert.equal(report.checks.find((item) => item.id === "openclaw/gateway").status, "error");
});

test("degrades unsupported and non-JSON official output without crashing", async () => {
  const results = {
    "openclaw --version": result(["--version"], 0, "2026.8.1"),
    "openclaw status --all --json": result(["status", "--all", "--json"], 0, "human output"),
    "openclaw update status --json": result(["update", "status", "--json"]),
    "openclaw gateway status --deep --json": result(["gateway", "status", "--deep", "--json"]),
    "openclaw doctor --json": result(["doctor", "--json"], 2, "", "unknown option --json"),
  };
  const adapter = new OpenClawAdapter(new FakeRunner(results));
  const { report } = await adapter.check("en", translator("en"), false);
  assert.equal(report.overall, "warning");
  assert.equal(report.checks.find((item) => item.id === "openclaw/status").status, "warning");
  assert.equal(report.checks.find((item) => item.id === "openclaw/doctor").status, "skipped");
});

test("backup always requests verification and reports the local artifact", async () => {
  const args = ["backup", "create", "--verify", "--output", "./safe", "--json"];
  const runner = new FakeRunner({
    [["openclaw", ...args].join(" ")]: result(args, 0, '{"path":"./safe/backup.tar.gz","sizeBytes":1234}'),
  });
  const report = await backup(context(runner, { output: "./safe" }));
  assert.equal(report.overall, "ok");
  assert.match(report.steps[0].summary, /backup\.tar\.gz/);
  assert.deepEqual(runner.calls[0].args, args);
});

test("upgrade stops before mutation when verified backup fails", async () => {
  const previewArgs = ["update", "--dry-run", "--json"];
  const backupArgs = ["backup", "create", "--verify", "--json"];
  const runner = new FakeRunner({
    [["openclaw", ...previewArgs].join(" ")]: result(previewArgs),
    [["openclaw", ...backupArgs].join(" ")]: result(backupArgs, 1, "", "backup failed"),
  });
  const report = await upgrade(context(runner, { command: "upgrade" }));
  assert.equal(report.overall, "error");
  assert.deepEqual(runner.calls.map((call) => call.args), [previewArgs, backupArgs]);
});

test("upgrade forwards an explicit stable channel after the verified backup", async () => {
  const previewArgs = ["update", "--dry-run", "--json"];
  const backupArgs = ["backup", "create", "--verify", "--json"];
  const updateArgs = ["update", "--json", "--channel", "stable"];
  const postArgs = ["doctor", "--post-upgrade", "--json"];
  const gatewayArgs = ["gateway", "status", "--deep", "--json"];
  const runner = new FakeRunner({
    [["openclaw", ...previewArgs].join(" ")]: result(previewArgs),
    [["openclaw", ...backupArgs].join(" ")]: result(backupArgs, 0, '{"path":"./backup.tar.gz"}'),
    [["openclaw", ...updateArgs].join(" ")]: result(updateArgs),
    [["openclaw", ...postArgs].join(" ")]: result(postArgs),
    [["openclaw", ...gatewayArgs].join(" ")]: result(gatewayArgs),
  });
  const report = await upgrade(context(runner, { command: "upgrade", channel: "stable" }));
  assert.equal(report.overall, "ok");
  assert.deepEqual(runner.calls.map((call) => call.args), [previewArgs, backupArgs, updateArgs, postArgs, gatewayArgs]);
});

test("repair dry-run shows every planned mutation without creating a backup", async () => {
  const doctorArgs = ["doctor", "--json"];
  const helpArgs = ["gateway", "restart", "--help"];
  const runner = new FakeRunner({
    [["openclaw", ...doctorArgs].join(" ")]: result(doctorArgs, 0, '{"ok":false,"findings":[{"severity":"warning"}]}'),
    [["openclaw", ...helpArgs].join(" ")]: result(helpArgs, 0, "Options: --safe"),
  });
  const report = await repair(context(runner, { command: "repair", dryRun: true }));
  assert.deepEqual(runner.calls.map((call) => call.args), [doctorArgs, helpArgs]);
  assert.deepEqual(report.steps.map((entry) => entry.id), ["repair/inspect", "repair/backup-preview", "repair/fix-preview", "repair/restart-preview"]);
});

test("repair can act on valid Doctor findings only after a verified config backup", async () => {
  const doctorArgs = ["doctor", "--json"];
  const backupArgs = ["backup", "create", "--only-config", "--verify", "--json"];
  const fixArgs = ["doctor", "--fix", "--non-interactive"];
  const helpArgs = ["gateway", "restart", "--help"];
  const restartArgs = ["gateway", "restart", "--safe"];
  const runner = new FakeRunner({
    [["openclaw", ...doctorArgs].join(" ")]: result(doctorArgs, 1, '{"ok":false,"findings":[{"severity":"error"}]}'),
    [["openclaw", ...backupArgs].join(" ")]: result(backupArgs, 0, '{"path":"./backup.tar.gz"}'),
    [["openclaw", ...fixArgs].join(" ")]: result(fixArgs),
    [["openclaw", ...helpArgs].join(" ")]: result(helpArgs, 0, "Options: --safe"),
    [["openclaw", ...restartArgs].join(" ")]: result(restartArgs),
  });
  const report = await repair(context(runner, { command: "repair" }));
  assert.equal(report.overall, "warning");
  assert.deepEqual(runner.calls.map((call) => call.args), [doctorArgs, backupArgs, fixArgs, helpArgs, restartArgs]);
});

test("CLI keeps the check schema and returns 2 when OpenClaw cannot be spawned", () => {
  const invocation = spawnSync(process.execPath, ["dist/cli.js", "check", "--json", "--lang", "zh-CN"], {
    encoding: "utf8",
    env: { ...process.env, PATH: "/definitely-no-openclaw" },
  });
  const payload = JSON.parse(invocation.stdout);
  assert.equal(invocation.status, 2);
  assert.equal(payload.schemaVersion, 1);
  assert.equal(payload.locale, "zh-CN");
  assert.equal(payload.openclawVersion, null);
  assert.equal(payload.overall, "error");
});

test("CLI emits a localized JSON error envelope for invalid arguments", () => {
  const invocation = spawnSync(process.execPath, ["dist/cli.js", "check", "--json", "--lang", "zh-CN", "--bad-option"], {
    encoding: "utf8",
  });
  const payload = JSON.parse(invocation.stdout);
  assert.equal(invocation.status, 2);
  assert.equal(payload.locale, "zh-CN");
  assert.equal(payload.error.code, "unknown-option");
  assert.match(payload.error.message, /未知选项/);
});
