# OpenClaw Companion | OpenClaw 中文助手

> 面向中国用户优化的双语 OpenClaw 安装、检查、升级、备份与故障处理助手。
>
> A bilingual, China-friendly operations companion for [OpenClaw](https://github.com/openclaw/openclaw).

[![CI](https://github.com/JFroson0610/openclaw-easy-deploy/actions/workflows/ci.yml/badge.svg)](https://github.com/JFroson0610/openclaw-easy-deploy/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/openclaw-companion.svg)](https://www.npmjs.com/package/openclaw-companion)

> [!IMPORTANT]
> 这是社区项目，并非 OpenClaw 官方产品。它不会读取、保存或上传 API Key、Bot Token、Cookie 或聊天内容；认证完全交给 OpenClaw 官方流程。
>
> This is a community project, not an official OpenClaw product. It never reads, stores, or uploads API keys, bot tokens, cookies, or chat content. Authentication is delegated to official OpenClaw flows.

## 中文

OpenClaw Companion 不再重复实现 OpenClaw 官方安装器。它将官方命令组织成适合普通用户的安全流程，并为中国区常见模型与飞书提供清晰入口。

### 功能

- 中英双语交互式 CLI，自动跟随系统语言。
- 官方安装和首次配置引导。
- Qwen、Kimi、DeepSeek、MiniMax 与飞书快捷入口。
- 只读健康检查与稳定 JSON 输出。
- “预览 → 验证备份 → 更新 → 升级后检查”的安全升级流程。
- 配置备份后逐项确认修复。
- 仅在本地生成官方脱敏诊断包。
- 官方 npm 源失败时，可经确认仅为当前安装使用中国镜像；绝不永久修改 npm 配置。

### 安装

OpenClaw 已安装：

```bash
npm install -g openclaw-companion
openclaw-companion setup
```

兼容原有一键链接（macOS / Linux）：

```bash
curl -fsSL https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.sh | bash
```

Windows PowerShell：

```powershell
irm https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.ps1 | iex
```

建议先下载并检查脚本内容，再执行远程脚本。完整说明见 [中文安装指南](docs/installation-zh.md)。

### 命令

```text
openclaw-companion menu
openclaw-companion setup
openclaw-companion check --deep
openclaw-companion check --json
openclaw-companion upgrade --dry-run
openclaw-companion backup --output ./backups
openclaw-companion repair
openclaw-companion support --output ./support
```

语言优先级：`--lang` → `OPENCLAW_COMPANION_LANG` → 系统语言 → English。

## English

OpenClaw Companion does not reimplement the official installer. It organizes official OpenClaw commands into safe, understandable setup and operations workflows.

### Highlights

- Full English and Simplified Chinese CLI, selected from the system locale.
- Official setup and onboarding delegation.
- Featured Qwen, Kimi, DeepSeek, MiniMax, and Feishu paths.
- Read-only health checks with a stable JSON envelope.
- Safe upgrades: preview, verified backup, update, and post-upgrade checks.
- Confirmed repairs only after a configuration backup.
- Local-only official diagnostics bundles.
- Optional one-command npm mirror fallback without persistent npm configuration changes.

### Development

```bash
pnpm install
pnpm check
pnpm build
node dist/cli.js check --json
```

Node.js support follows OpenClaw: 22.22.3+, 24.15+, 25.9+, and 26. Node 23 is rejected. See [compatibility](docs/compatibility.md), [security](SECURITY.md), and the [v1 migration guide](docs/migration-v1-v2.md).

## License

MIT. OpenClaw trademarks and upstream code belong to their respective owners.
