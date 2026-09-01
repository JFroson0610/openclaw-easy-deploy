# v2 release checklist

This checklist separates completed engineering work from owner-only publication gates. Never mark a publication step complete until the corresponding external state is verified.

## Engineering readiness

- [x] Preserve the historical `v1.0.0` tag and release at `dd4d239`.
- [x] Implement the bilingual TypeScript CLI and thin v1 compatibility launchers.
- [x] Add stable `check --json` output, tolerant upstream parsing, and secret redaction.
- [x] Add Windows, macOS, Ubuntu, Debian, Node-line, ShellCheck, PowerShell, audit, and nightly workflows.
- [x] Add bilingual README, installation, compatibility, migration, security, contribution, issue, and PR guidance.
- [x] Confirm the proposed npm name is unregistered as of 2026-09-01.

## `2.0.0-beta.1`

- [ ] Owner enables npm 2FA.
- [ ] Owner rechecks that `openclaw-companion` is still available.
- [ ] Run `pnpm check`, `pnpm audit --audit-level high`, and `pnpm pack --dry-run` on the exact release commit.
- [ ] Manually publish `2.0.0-beta.1` with npm tag `next` and 2FA. Local first publication does not claim provenance; later Trusted Publishing releases do.
- [ ] Verify `npm view openclaw-companion@next version` returns `2.0.0-beta.1`.
- [ ] Push tag `v2.0.0-beta.1` and create a bilingual GitHub prerelease.
- [ ] Only after npm verification, merge the v2 README/launchers so public one-command URLs cannot point to an unavailable package.

## Beta observation

- [ ] Run Beta for at least 14 days.
- [ ] Keep all required three-platform checks green.
- [ ] Resolve every P0/P1 security or installation issue.
- [ ] Review npm downloads, Stars/Forks, platform issues, external contributors, CI pass rate, and severe-issue repair time without adding telemetry.

## `v2.0.0`

- [ ] Confirm the package name, release commit, version, changelog, and bilingual release notes.
- [ ] Publish npm `latest` and verify installation on Windows, macOS, and Ubuntu.
- [ ] Create and verify the GitHub `v2.0.0` release.
- [ ] Configure npm Trusted Publishing, then set `NPM_TRUSTED_PUBLISHING_READY=true` for later releases.
