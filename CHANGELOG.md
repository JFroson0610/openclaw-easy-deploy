# Changelog

## Unreleased

- Bound every non-interactive official command with a 5-minute timeout so a hung OpenClaw CLI can no longer wedge the companion silently.
- Capped captured stdout/stderr at 1 MiB per stream and marked truncated output.
- Made `setup` refuse to guess in a non-interactive terminal without `--yes` instead of launching the interactive official wizard on closed stdin.
- Named the candidate version in the `upgrade` preview when the official `update --dry-run` JSON provides one.
- Run the `check` probes concurrently instead of serializing the report behind the slowest probe.
- Narrowed the "unsupported capability" classifier so runtime errors containing "not found" stay errors instead of degrading to skipped.
- Extracted the first version-like token from `openclaw --version` output so a trailing build date no longer overrides the real semver.

## 2.0.0

- Promote the verified beta.2 functionality to the stable channel at the owner's request, without a mandatory observation period.
- Switch both legacy installers and bilingual installation instructions to npm `latest`.
- Retain Windows, macOS, Linux, Node compatibility, backup safeguards, redaction, and automated upstream checks.
- Publish through GitHub Trusted Publishing with provenance.

## 2.0.0-beta.2

- Fixed Windows npm-installed OpenClaw startup by invoking the installed JavaScript entry without a shell.
- Added real Windows process tests, including paths with spaces and literal shell metacharacters.
- Made failed nightly checks show redacted diagnostic output instead of `undefined`.
- Run official stable-version compatibility checks on relevant pull requests before merging.
- Include the current bilingual installation and release guidance in the npm package.

## 2.0.0-beta.1

- Repositioned the project as OpenClaw Companion / OpenClaw 中文助手.
- Added a dependency-light TypeScript CLI with bilingual setup, checks, upgrade, backup, repair, and support workflows.
- Added stable JSON check output and documented exit codes.
- Correctly classifies real OpenClaw update, Gateway, Doctor, and security-audit JSON shapes.
- Fixed official date-version parsing when `openclaw --version` includes a commit id.
- Expanded bilingual CLI errors and credential redaction.
- Delegated credentials and state changes to official OpenClaw commands.
- Replaced custom installers and manager with backward-compatible thin launchers.
- Added three-platform CI, security policy, compatibility documentation, and release automation.
- Added simulated legacy bootstrap tests for Bash, Windows PowerShell 5.1, and PowerShell 7.
- Rebuilt the README as a complete, status-aware bilingual product and operations guide.

## 1.0.0

- Historical custom installation and management scripts. Preserved at the `v1.0.0` tag and no longer supported.
