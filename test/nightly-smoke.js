import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["dist/cli.js", "check", "--json", "--deep"], {
  encoding: "utf8",
  env: process.env,
});

if (result.status === 2 || result.error) {
  console.error(result.stderr || result.error);
  process.exit(1);
}

let payload;
try {
  payload = JSON.parse(result.stdout);
} catch {
  console.error("Companion did not emit JSON", result.stdout, result.stderr);
  process.exit(1);
}

if (payload.schemaVersion !== 1 || !Array.isArray(payload.checks)) {
  console.error("Unexpected check schema", payload);
  process.exit(1);
}

console.log(`OpenClaw Companion smoke completed with status: ${payload.overall}`);
