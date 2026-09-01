import assert from "node:assert/strict";
import test from "node:test";
import { resolveLocale, translator } from "../dist/i18n.js";
import { OpenClawAdapter, parseJsonLoose } from "../dist/openclaw.js";
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

test("selects Chinese from the system locale and falls back to English", () => {
  assert.equal(resolveLocale("auto", { LANG: "zh_CN.UTF-8" }), "zh-CN");
  assert.equal(resolveLocale("auto", { LANG: "fr_FR.UTF-8" }), "en");
  assert.equal(resolveLocale("en", { LANG: "zh_CN.UTF-8" }), "en");
});

test("redacts common credentials", () => {
  const text = "api_key=sk-secretvalue token: abcdefghijkl password=hunter2 Authorization: Bearer abc.def.ghi";
  const clean = redact(text);
  assert.doesNotMatch(clean, /secretvalue|abcdefghijkl|hunter2|abc\.def\.ghi/);
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

test("repair can act on valid Doctor findings only after a verified config backup", async () => {
  const doctorArgs = ["doctor", "--json"];
  const backupArgs = ["backup", "create", "--only-config", "--verify", "--json"];
  const fixArgs = ["doctor", "--fix", "--non-interactive"];
  const restartArgs = ["gateway", "restart"];
  const runner = new FakeRunner({
    [["openclaw", ...doctorArgs].join(" ")]: result(doctorArgs, 1, '{"ok":false,"findings":[{"severity":"error"}]}'),
    [["openclaw", ...backupArgs].join(" ")]: result(backupArgs, 0, '{"path":"./backup.tar.gz"}'),
    [["openclaw", ...fixArgs].join(" ")]: result(fixArgs),
    [["openclaw", ...restartArgs].join(" ")]: result(restartArgs),
  });
  const report = await repair(context(runner, { command: "repair" }));
  assert.equal(report.overall, "warning");
  assert.deepEqual(runner.calls.map((call) => call.args), [doctorArgs, backupArgs, fixArgs, restartArgs]);
});
