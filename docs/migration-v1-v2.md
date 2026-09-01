# Migrating from v1

The existing repository URLs remain valid. Version 2 replaces the custom installer and manager implementations with thin compatibility entry points backed by official OpenClaw and the `openclaw-companion` npm package.

## What changes

- `install.sh` and `install.ps1` call the official installer when OpenClaw is missing.
- `bin/openclaw-manager` forwards to `openclaw-companion menu`.
- Node, Docker, daemon, update, backup, and uninstall behavior is no longer reimplemented.
- Credentials are never collected by this project.

## Rollback

The historical v1 source is preserved at the `v1.0.0` tag. Rollback is intended only for inspecting or reproducing the old implementation; using the current official OpenClaw installer is recommended.
