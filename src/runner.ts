import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { CommandResult, CommandRunner, RunOptions } from "./types.js";

// npm's Windows .cmd shim cannot be spawned without a shell. Run the
// installed package's JavaScript entry directly so arguments stay literal.
export function windowsOpenClawEntry(env: NodeJS.ProcessEnv): string | undefined {
  const searchPath = Object.entries(env).find(([key]) => key.toLowerCase() === "path")?.[1] ?? "";
  for (const item of searchPath.split(";")) {
    const directory = item.replace(/^"|"$/g, "");
    if (!directory) continue;
    if (existsSync(path.join(directory, "openclaw.exe"))) return undefined;
    if (!existsSync(path.join(directory, "openclaw.cmd"))) continue;
    const root = path.join(directory, "node_modules", "openclaw");
    try {
      const manifest = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
      const bin = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.openclaw;
      if (manifest.name !== "openclaw" || typeof bin !== "string") return undefined;
      const entry = path.resolve(root, bin);
      const relative = path.relative(root, entry);
      if (relative.startsWith("..") || path.isAbsolute(relative) || !/\.[cm]?js$/i.test(entry)) return undefined;
      return existsSync(entry) ? entry : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

// Non-interactive official commands get a bounded lifetime so a hung CLI
// (unreachable gateway, stuck doctor, ...) can never wedge the companion.
export const DEFAULT_COMMAND_TIMEOUT_MS = 5 * 60 * 1000;
export const TIMED_OUT_EXIT_CODE = 124;
// Keep memory bounded when an official command floods stdout/stderr.
const MAX_OUTPUT_CHARS = 1024 * 1024;

export class NodeCommandRunner implements CommandRunner {
  hadSpawnFailure = false;

  async run(command: string, args: string[], options: RunOptions = {}): Promise<CommandResult> {
    const env = { ...process.env, ...options.env };
    const entry = process.platform === "win32" && command === "openclaw" ? windowsOpenClawEntry(env) : undefined;
    const executable = entry ? process.execPath : command;
    const executableArgs = entry ? [entry, ...args] : args;
    if (options.interactive) {
      return await new Promise((resolve) => {
        const child = spawn(executable, executableArgs, {
          stdio: "inherit",
          env,
          shell: false,
        });
        child.once("error", (error) => {
          this.hadSpawnFailure = true;
          resolve({ command, args, exitCode: 2, stdout: "", stderr: error.message });
        });
        child.once("close", (code) => resolve({ command, args, exitCode: code ?? 2, stdout: "", stderr: "" }));
      });
    }

    const timeoutMs = options.timeoutMs ?? DEFAULT_COMMAND_TIMEOUT_MS;
    return await new Promise((resolve) => {
      const child = spawn(executable, executableArgs, {
        stdio: ["ignore", "pipe", "pipe"],
        env,
        shell: false,
      });
      let stdout = "";
      let stderr = "";
      let stdoutTruncated = false;
      let stderrTruncated = false;
      let settled = false;
      let timedOut = false;
      const append = (current: string, chunk: string) => {
        if (current.length + chunk.length <= MAX_OUTPUT_CHARS) return { text: current + chunk, overflow: false };
        return { text: (current + chunk).slice(0, MAX_OUTPUT_CHARS), overflow: true };
      };
      child.stdout?.setEncoding("utf8").on("data", (chunk: string) => {
        const next = append(stdout, chunk);
        stdout = next.text;
        if (next.overflow) stdoutTruncated = true;
      });
      child.stderr?.setEncoding("utf8").on("data", (chunk: string) => {
        const next = append(stderr, chunk);
        stderr = next.text;
        if (next.overflow) stderrTruncated = true;
      });
      const timer = timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            child.kill();
          }, timeoutMs)
        : undefined;
      const finish = (result: CommandResult) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        resolve(result);
      };
      child.once("error", (error) => {
        this.hadSpawnFailure = true;
        finish({ command, args, exitCode: 2, stdout, stderr: `${stderr}${error.message}` });
      });
      child.once("close", (code) => {
        if (timedOut) {
          finish({ command, args, exitCode: TIMED_OUT_EXIT_CODE, stdout, stderr: `${stderr}\ncommand timed out after ${timeoutMs}ms`.trim() });
          return;
        }
        finish({
          command,
          args,
          exitCode: code ?? 2,
          stdout: stdoutTruncated ? `${stdout}\n[output truncated at ${MAX_OUTPUT_CHARS} chars]` : stdout,
          stderr: stderrTruncated ? `${stderr}\n[output truncated at ${MAX_OUTPUT_CHARS} chars]` : stderr,
        });
      });
    });
  }
}

export function commandText(command: string, args: string[]): string {
  const quote = (part: string) => (/^[A-Za-z0-9_./:@=-]+$/.test(part) ? part : JSON.stringify(part));
  return [command, ...args].map(quote).join(" ");
}
