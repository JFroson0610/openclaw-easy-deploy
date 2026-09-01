# Changelog

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
