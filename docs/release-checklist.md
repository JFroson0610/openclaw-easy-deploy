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

- [x] Owner enables npm 2FA.
- [x] Owner rechecks that `openclaw-companion` is still available.
- [x] Run `pnpm check`, `pnpm audit --audit-level high`, and `pnpm pack --dry-run` on the exact release commit.
- [x] Manually publish `2.0.0-beta.1` with npm tag `next` and 2FA. Local first publication does not claim provenance; later Trusted Publishing releases do.
- [x] Verify `npm view openclaw-companion@next version` returns `2.0.0-beta.1` and perform a clean-registry install/CLI smoke test.
- [x] Record that npm automatically created `latest` for the first release of this new package; docs explicitly direct Beta testers to `@next` until stable promotion.
- [x] Push tag `v2.0.0-beta.1` and create a bilingual GitHub prerelease.
- [x] Only after npm verification, merge the v2 README/launchers so public one-command URLs cannot point to an unavailable package.

## Beta observation

### `2.0.0-beta.2` maintenance

- [x] Fix npm-installed Windows OpenClaw startup without enabling a shell.
- [x] Add Windows process regression tests and redacted nightly failure output.
- [x] Include current bilingual README in the package.
- [x] Verify PR CI and official stable OpenClaw smoke checks on all three platforms.
- [x] Publish beta.2 to npm `next` and verify the registry package.
- [x] Create the matching GitHub prerelease.

Released 2026-09-09: [PR #8](https://github.com/JFroson0610/openclaw-easy-deploy/pull/8), [CI](https://github.com/JFroson0610/openclaw-easy-deploy/actions/runs/34358625531), [three-platform upstream checks](https://github.com/JFroson0610/openclaw-easy-deploy/actions/runs/34357819471), [OIDC publication](https://github.com/JFroson0610/openclaw-easy-deploy/actions/runs/34358965287), and [beta.2 release](https://github.com/JFroson0610/openclaw-easy-deploy/releases/tag/v2.0.0-beta.2).

At the beta.2 release, `next` pointed to beta.2 and `latest` still pointed to beta.1. Stable v2.0.0 moves the recommended installation and both legacy launchers to `latest`.

### Stable-release gates

The owner explicitly waived the 14-day observation period and requested stable release. This is a release-policy decision, not a claim that 14 days of observation occurred. Release checks and the existing safety rules remain in place. Growth metrics are optional maintenance information, not a release gate.

## `v2.0.0`

- [ ] Confirm the package name, release commit, version, changelog, and bilingual release notes.
- [ ] Publish npm `latest` and verify installation on Windows, macOS, and Ubuntu.
- [ ] Create and verify the GitHub `v2.0.0` release.
- [x] Configure npm Trusted Publishing for `release.yml` and environment `npm`; beta.2 was published with provenance through this connection. The workflow publishes directly and no longer needs the old readiness variable.
