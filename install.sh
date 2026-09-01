#!/usr/bin/env bash
# OpenClaw Companion v2 compatibility bootstrap for macOS and Linux.
# Existing URL intentionally preserved for v1 users.

set -euo pipefail

OFFICIAL_INSTALLER="https://openclaw.ai/install.sh"
COMPANION_SPEC="${OPENCLAW_COMPANION_SPEC:-openclaw-companion@latest}"
OFFICIAL_REGISTRY="https://registry.npmjs.org"
CHINA_REGISTRY="https://registry.npmmirror.com"

is_zh() { [[ "${LC_ALL:-${LC_MESSAGES:-${LANG:-}}}" == zh* ]]; }
say() { printf '%s\n' "$*"; }
ask_yes_no() {
  local prompt="$1" answer=""
  if [[ -r /dev/tty ]]; then
    printf '%s [y/N] ' "$prompt" >/dev/tty
    IFS= read -r answer </dev/tty || true
  fi
  [[ "$answer" =~ ^[Yy]$ ]]
}

if is_zh; then
  say "OpenClaw Easy Deploy 已升级为 OpenClaw Companion / OpenClaw 中文助手。"
  say "社区项目，非 OpenClaw 官方产品；密钥只由官方 OpenClaw 向导处理。"
else
  say "OpenClaw Easy Deploy is now OpenClaw Companion."
  say "Community project, not an official OpenClaw product. Credentials are handled only by official OpenClaw flows."
fi

if ! command -v openclaw >/dev/null 2>&1; then
  if is_zh; then prompt="未检测到 OpenClaw。是否调用官方安装器？"; else prompt="OpenClaw was not found. Run the official installer?"; fi
  if ! ask_yes_no "$prompt"; then
    say "curl -fsSL --proto '=https' --tlsv1.2 $OFFICIAL_INSTALLER | bash"
    exit 1
  fi
  curl -fsSL --proto '=https' --tlsv1.2 "$OFFICIAL_INSTALLER" | bash -s -- --no-onboard
fi

if ! command -v npm >/dev/null 2>&1; then
  say "npm was not found after the official installation. Open a new terminal and rerun this script."
  exit 1
fi

registry="$OFFICIAL_REGISTRY"
if ! npm ping --registry "$OFFICIAL_REGISTRY" >/dev/null 2>&1; then
  if is_zh; then prompt="官方 npm 源不可用。是否仅为本次安装使用 npmmirror？"; else prompt="The official npm registry is unavailable. Use npmmirror for this install only?"; fi
  if ask_yes_no "$prompt"; then
    registry="$CHINA_REGISTRY"
  else
    say "npm registry unavailable; no persistent npm settings were changed."
    exit 1
  fi
fi

if npm_config_registry="$registry" npm install -g "$COMPANION_SPEC"; then
  exec openclaw-companion setup "$@"
fi

if is_zh; then
  say "全局安装权限不足，改用一次性 npx 启动；不会永久修改 npm 配置。"
else
  say "Global installation failed; using a one-time npx launch without changing npm configuration."
fi
exec env npm_config_registry="$registry" npx -y "$COMPANION_SPEC" setup "$@"
