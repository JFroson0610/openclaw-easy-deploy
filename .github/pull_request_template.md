# Pull request

## Summary

<!-- Explain the user-visible outcome and why it is needed. -->

## Safety and compatibility

- [ ] No credentials, private OpenClaw state, diagnostics archives, or chat content are included.
- [ ] New mutating behavior previews impact and asks for confirmation.
- [ ] Configuration-changing behavior creates a verified backup first.
- [ ] Chinese and English behavior remain equivalent.
- [ ] Unsupported upstream output degrades safely instead of crashing.

## Verification

- [ ] `pnpm check`
- [ ] `pnpm audit --audit-level high`
- [ ] Bootstrap scripts checked when changed
- [ ] Tested platforms and Node.js versions are listed below

<!-- Add commands, platform details, and sanitized results. -->
