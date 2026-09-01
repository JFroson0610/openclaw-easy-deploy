const secretPatterns: Array<[RegExp, string]> = [
  [/((?:authorization)\s*[=:]\s*)(?:Bearer\s+)?[^\s,;"']+/gi, "$1[REDACTED]"],
  [/((?:api[_-]?key|token|password|passwd|secret|cookie)\s*[=:]\s*)[^\s,;"']+/gi, "$1[REDACTED]"],
  [/\b(?:sk|clh|ghp|github_pat)_[A-Za-z0-9_-]{8,}\b/g, "[REDACTED]"],
  [/\bBearer\s+[A-Za-z0-9._~+\/-]+=*\b/gi, "Bearer [REDACTED]"],
];

export function redact(value: string): string {
  return secretPatterns.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), value);
}
