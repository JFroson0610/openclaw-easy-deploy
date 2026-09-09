import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { NodeCommandRunner, windowsOpenClawEntry } from "../dist/runner.js";

function fixture(t) {
  const directory = mkdtempSync(path.join(tmpdir(), "companion path & spaces-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const root = path.join(directory, "node_modules", "openclaw");
  mkdirSync(root, { recursive: true });
  writeFileSync(path.join(directory, "openclaw.cmd"), "@echo off\r\nexit /b 99\r\n");
  writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "openclaw", bin: { openclaw: "openclaw.mjs" } }));
  writeFileSync(path.join(root, "openclaw.mjs"), "console.log(JSON.stringify(process.argv.slice(2))); process.exit(Number(process.env.TEST_EXIT || 0));");
  return { directory, root, entry: path.join(root, "openclaw.mjs") };
}

test("resolves npm Windows entry without interpreting the command shim", (t) => {
  const f = fixture(t);
  assert.equal(windowsOpenClawEntry({ Path: `"${f.directory}"` }), f.entry);
  writeFileSync(path.join(f.root, "package.json"), JSON.stringify({ name: "openclaw", bin: "../../outside.mjs" }));
  assert.equal(windowsOpenClawEntry({ PATH: f.directory }), undefined);
});

test("Windows runner preserves arguments, paths with spaces, and exit codes", { skip: process.platform !== "win32" }, async (t) => {
  const f = fixture(t);
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== "path"));
  env.Path = f.directory;
  // Remove the original PATH spelling before running the actual child process.
  const oldPathEntries = Object.entries(process.env).filter(([key]) => key.toLowerCase() === "path");
  for (const [key] of oldPathEntries) delete process.env[key];
  t.after(() => { for (const [key, value] of oldPathEntries) process.env[key] = value; });
  const args = ["space value", "& echo INJECTED", "%COMSPEC%", "$(whoami)", 'quote"value'];
  const runner = new NodeCommandRunner();
  const result = await runner.run("openclaw", args, { env: { ...env, TEST_EXIT: "7" } });
  assert.equal(result.exitCode, 7);
  assert.deepEqual(JSON.parse(result.stdout), args);
  assert.equal(runner.hadSpawnFailure, false);
  const interactive = await runner.run("openclaw", [], { interactive: true, env: { ...env, TEST_EXIT: "9" } });
  assert.equal(interactive.exitCode, 9);
});

test("runner reports an unavailable executable", async () => {
  const runner = new NodeCommandRunner();
  const result = await runner.run("companion-nonexistent-executable-238491", []);
  assert.equal(result.exitCode, 2);
  assert.equal(runner.hadSpawnFailure, true);
  assert.ok(result.stderr.length > 0);
});
