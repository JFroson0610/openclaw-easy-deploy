export interface VersionCheck {
  ok: boolean;
  reason?: string;
}

export function validateNodeVersion(version = process.versions.node): VersionCheck {
  const [major = 0, minor = 0, patch = 0] = version.split(".").map(Number);
  if (major === 23) return { ok: false, reason: "Node.js 23 is unsupported by OpenClaw." };
  if (major < 22) return { ok: false, reason: "Node.js 22.22.3 or newer is required." };
  if (major > 26) return { ok: false, reason: "This OpenClaw Companion release supports Node.js through the Node 26 line." };
  if (major === 22 && (minor < 22 || (minor === 22 && patch < 3))) {
    return { ok: false, reason: "Node.js 22.22.3 or newer is required." };
  }
  if (major === 24 && (minor < 15 || (minor === 15 && patch < 0))) {
    return { ok: false, reason: "Node.js 24.15.0 or newer is required." };
  }
  if (major === 25 && (minor < 9 || (minor === 9 && patch < 0))) {
    return { ok: false, reason: "Node.js 25.9.0 or newer is required." };
  }
  return { ok: true };
}

export function isOpenClawAtLeast(version: string, minimum = "2026.5.29"): boolean {
  const parts = (value: string) => value.match(/\d+/g)?.slice(0, 3).map(Number) ?? [];
  const current = parts(version);
  const required = parts(minimum);
  if (current.length < 3) return true;
  for (let index = 0; index < 3; index += 1) {
    const left = current[index] ?? 0;
    const right = required[index] ?? 0;
    if (left !== right) return left > right;
  }
  return true;
}
