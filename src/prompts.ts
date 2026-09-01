import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

export async function ask(question: string): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    return (await rl.question(`${question} `)).trim();
  } finally {
    rl.close();
  }
}

export async function confirm(question: string, assumeYes: boolean): Promise<boolean> {
  if (assumeYes) return true;
  if (!process.stdin.isTTY) return false;
  const answer = (await ask(`${question} [y/N]`)).toLowerCase();
  return answer === "y" || answer === "yes" || answer === "是";
}
