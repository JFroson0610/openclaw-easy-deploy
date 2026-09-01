# Compatibility

## Supported platforms

- Windows 10/11 with Windows PowerShell 5.1 or PowerShell 7.
- macOS 13 or newer on Intel and Apple Silicon.
- Ubuntu 22.04/24.04 and Debian 12 on x64 or arm64.

Pull requests run the full simulated CLI suite on Ubuntu 22.04/24.04 x64, Ubuntu 24.04 arm64, macOS Intel/Apple Silicon, and Windows. Debian 12 x64 runs in a Bookworm container. The command adapter remains architecture-independent; Debian arm64 is supported but is not a blocking hosted-runner job.

## Node.js

Supported runtime lines match OpenClaw:

- Node 22.22.3 or newer in the Node 22 line.
- Node 24.15 or newer.
- Node 25.9 or newer.
- Node 26.
- Node 23 is explicitly unsupported.

## OpenClaw

The compatibility baseline is OpenClaw 2026.5.29. The companion detects command capabilities at runtime and degrades unsupported checks to warnings instead of assuming a fixed response shape. Users below the current stable OpenClaw release are prompted to update.

NAS-specific workflows for Synology, CasaOS, and Unraid are deferred to v2.1.
