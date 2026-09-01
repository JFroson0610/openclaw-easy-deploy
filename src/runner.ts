import { spawn } from "node:child_process";
import type { CommandResult, CommandRunner, RunOptions } from "./types.js";

export class NodeCommandRunner implements CommandRunner {
  async run(command: string, args: string[], options: RunOptions = {}): Promise<CommandResult> {
    if (options.interactive) {
      return await new Promise((resolve, reject) => {
        const child = spawn(command, args, {
          stdio: "inherit",
          env: { ...process.env, ...options.env },
          shell: false,
        });
        child.once("error", reject);
        child.once("close", (code) => resolve({ command, args, exitCode: code ?? 2, stdout: "", stderr: "" }));
      });
    }

    return await new Promise((resolve) => {
      const child = spawn(command, args, {
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, ...options.env },
        shell: false,
      });
      let stdout = "";
      let stderr = "";
      child.stdout?.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
      child.stderr?.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
      child.once("error", (error) => {
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
