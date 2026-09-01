const secretPatterns: Array<[RegExp, string]> = [
  [/((?:authorization|proxy-authorization)\s*[=:]\s*["']?)(?:Bearer\s+)?[^\s,;"']+/gi, "$1[REDACTED]"],
  [/((?:api[_-]?key|apikey|access[_-]?token|refresh[_-]?token|bot[_-]?token|token|password|passwd|client[_-]?secret|app[_-]?secret|secret|cookie)\s*["']?\s*[=:]\s*["']?)[^\s,;"']+/gi, "$1[REDACTED]"],
  [/([?&](?:api[_-]?key|apikey|access[_-]?token|token|password|secret)=)[^&#\s]+/gi, "$1[REDACTED]"],
  [/\b(?:sk|clh|ghp|github_pat)_[A-Za-z0-9_-]{8,}\b/g, "[REDACTED]"],
  [/\b(?:xox[baprs]-)[A-Za-z0-9-]{8,}\b/g, "[REDACTED]"],
  [/\bBearer\s+[A-Za-z0-9._~+\/-]+=*\b/gi, "Bearer [REDACTED]"],
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g, "[REDACTED PRIVATE KEY]"],
];

export function redact(value: string): string {
  return secretPatterns.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), value);
}
