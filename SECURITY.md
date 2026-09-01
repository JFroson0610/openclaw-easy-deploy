# Security Policy

## Supported versions

Security fixes are provided for the latest v2 release and current v2 prerelease. The v1 tag is preserved for history and receives no fixes.

## Credential policy

OpenClaw Companion must never request, parse, persist, log, or upload API keys, bot tokens, cookies, passwords, authorization headers, or chat content. Authentication is delegated to official OpenClaw commands.

Verbose output is redacted before display. Diagnostics exports remain local and must be reviewed by the user before sharing.

## Reporting

Do not open a public issue containing credentials or diagnostics archives. Use GitHub's private vulnerability reporting for security issues. Revoke any exposed credential before reporting it.

## Supply chain

- Official OpenClaw installers are fetched only from `openclaw.ai` over TLS.
- npm defaults to the official registry.
- The optional China mirror is used only for one explicitly confirmed process and is never persisted.
- Release publishing uses npm provenance and GitHub trusted publishing after the initial package setup.
