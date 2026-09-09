import { spawnSync } from "node:child_process";
import { redact } from "../dist/redact.js";

const result = spawnSync(process.execPath, ["dist/cli.js", "check", "--json", "--deep"], {
  encoding: "utf8",
  env: process.env,
});

if (result.status === 2 || result.error) {
  console.error(`Companion could not complete checks (exit=${result.status}, signal=${result.signal}).`);
  console.error(redact([result.stdout, result.stderr, result.error?.message].filter(Boolean).join("\n")));
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(result.stdout);
} catch {
  console.error("Companion did not emit JSON", redact(`${result.stdout}\n${result.stderr}`));
  process.exit(1);
}

if (payload.schemaVersion !== 1 || !Array.isArray(payload.checks)) {
  console.error("Unexpected check schema", redact(JSON.stringify(payload)));
  process.exit(1);
}

console.log(`OpenClaw Companion smoke completed with status: ${payload.overall}`);
