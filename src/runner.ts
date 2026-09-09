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

    return await new Promise((resolve) => {
      const child = spawn(executable, executableArgs, {
        stdio: ["ignore", "pipe", "pipe"],
        env,
        shell: false,
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
      child.stderr?.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
      child.once("error", (error) => {
        this.hadSpawnFailure = true;
        resolve({ command, args, exitCode: 2, stdout, stderr: `${stderr}${error.message}` });
      });
      child.once("close", (code) => {
        resolve({ command, args, exitCode: code ?? 2, stdout, stderr });
      });
    });
  }
}

export function commandText(command: string, args: string[]): string {
  const quote = (part: string) => (/^[A-Za-z0-9_./:@=-]+$/.test(part) ? part : JSON.stringify(part));
  return [command, ...args].map(quote).join(" ");
}
