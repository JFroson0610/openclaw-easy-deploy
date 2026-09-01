# Contributing

Thank you for improving OpenClaw Companion.

1. Create a focused branch from `main`.
2. Run `pnpm install` and `pnpm check`.
3. Add tests for command-output changes and both locales for user-facing text.
4. Never include real OpenClaw state, credentials, diagnostics archives, screenshots, or account data.
5. Open a pull request using the provided template and describe the tested operating systems.

Command execution must remain injectable. New mutating workflows require an impact preview, explicit confirmation, and a verified backup where state may change.

## Release process

The first npm release must be performed manually by an owner with npm 2FA enabled. Publish the package before pushing its matching Git tag. A local first publication does not claim provenance. After Trusted Publishing is configured, set the repository variable `NPM_TRUSTED_PUBLISHING_READY=true`; later version tags publish automatically with npm provenance.
