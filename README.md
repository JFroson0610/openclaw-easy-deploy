# OpenClaw Companion | OpenClaw 中文助手

> 面向普通用户的中英双语 OpenClaw 运维助手：安全编排官方安装、配置、检查、升级、备份、修复与诊断流程。
>
> A bilingual operations companion that safely orchestrates official OpenClaw setup, checks, upgrades, backups, repairs, and diagnostics.

[![CI](https://github.com/JFroson0610/openclaw-easy-deploy/actions/workflows/ci.yml/badge.svg?branch=feat%2Fv2-companion)](https://github.com/JFroson0610/openclaw-easy-deploy/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: v2 beta](https://img.shields.io/badge/status-v2%20beta-blue.svg)](https://github.com/JFroson0610/openclaw-easy-deploy/pull/1)
[![Telemetry: none](https://img.shields.io/badge/telemetry-none-success.svg)](SECURITY.md)

[中文](#中文) · [English](#english)

> [!IMPORTANT]
> **v2 发布状态：** 代码和跨平台模拟测试已经就绪，但 `openclaw-companion` 尚未首次发布到 npm。首次发布必须由仓库所有者开启 npm 2FA 后手动完成。在此之前，请勿把下方 npm 命令当作已可用的正式安装方式。
>
> **v2 release status:** The code and cross-platform simulated tests are ready, but `openclaw-companion` has not received its first npm publication. The owner must perform that first publish manually with npm 2FA enabled. Until then, the npm commands below are release instructions, not a currently available installation path.

> [!WARNING]
> 这是社区项目，并非 OpenClaw 官方产品。OpenClaw 名称、商标和上游代码归其各自权利人所有。
>
> This is a community project, not an official OpenClaw product. The OpenClaw name, trademarks, and upstream code belong to their respective owners.

## 中文

### 它解决什么问题

OpenClaw 已经提供安装器、配置向导、Doctor、更新、备份和诊断工具。OpenClaw Companion 不重复实现这些能力，而是把官方命令组合成更容易理解、更不容易误操作的流程。

```text
你
└─ OpenClaw Companion：中文说明、影响预览、确认、结果归一化
   └─ OpenClaw 官方 CLI：安装、认证、配置、更新、备份、修复、诊断
      └─ 你的本地 OpenClaw 数据
```

适合 Windows、macOS、Ubuntu 和 Debian 上的零基础或轻度技术用户。它不是 Web 面板、桌面 GUI、OpenClaw Fork，也不会运行自己的后台服务。

### 核心能力

| 能力 | Companion 做什么 | 安全边界 |
|---|---|---|
| 设置 | 检查环境，突出 Qwen、Kimi、DeepSeek、MiniMax 和飞书，启动官方向导 | 不接收或保存密钥 |
| 检查 | 汇总 OpenClaw 版本、更新、Gateway、Doctor 和可选渠道探测 | 只读 |
| 升级 | 更新预览 → 验证备份 → 用户确认 → 官方更新 → 升级后检查 | 备份失败立即停止 |
| 备份 | 调用官方 `backup create --verify` | 不自行复制运行中的 SQLite |
| 修复 | 先运行只读 Doctor，展示影响并备份，再确认修复和重启 | 不静默修改配置 |
| 支持 | 调用官方脱敏诊断导出并显示本地路径 | 不自动上传 |

所有自有提示均提供简体中文和英文。语言优先级为：`--lang` → `OPENCLAW_COMPANION_LANG` → 系统语言 → English。

### 安装

前置条件：

- Windows 10/11、macOS 13+、Ubuntu 22.04/24.04 或 Debian 12。
- Node.js 22.22.3+、24.15+、25.9+ 或 26；明确不支持 Node 23。
- OpenClaw 2026.5.29 或更高版本；若缺失，兼容启动器会在确认后调用官方安装器。

Beta 首次发布完成后：

```bash
npm install -g openclaw-companion@next
openclaw-companion setup --lang zh-CN
```

正式版发布后：

```bash
npm install -g openclaw-companion
openclaw-companion setup --lang zh-CN
```

旧版一键链接会在 v2 合并并完成 npm 发布后继续有效：

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.sh | bash
```

```powershell
# Windows PowerShell
irm https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.ps1 | iex
```

远程脚本会先请求确认；建议先下载并检查内容再执行。它默认使用 npm 官方源，只有官方源失败且用户明确同意时，才为当前安装进程临时使用 `registry.npmmirror.com`，不会运行 `npm config set`。

当前 Beta 源码预览：

```bash
git clone --branch feat/v2-companion https://github.com/JFroson0610/openclaw-easy-deploy.git
cd openclaw-easy-deploy
pnpm install --frozen-lockfile
pnpm build
node dist/cli.js check --json
```

完整步骤见[中文安装指南](docs/installation-zh.md)。

### 命令

不带参数运行 `openclaw-companion` 与运行 `openclaw-companion menu` 相同。

| 命令 | 行为 | 是否修改状态 |
|---|---|---|
| `menu` | 打开双语交互菜单 | 取决于所选操作 |
| `setup` | 检查环境并启动官方模型/飞书向导 | 是，官方向导负责 |
| `check` | 汇总版本、更新、Gateway、模型/渠道状态和 Doctor | 否 |
| `upgrade` | 预览、备份、更新并执行升级后检查 | 是，确认后 |
| `backup` | 创建并验证官方备份 | 是，仅写备份文件 |
| `repair` | 检查、展示影响、备份并逐项确认修复 | 是，确认后 |
| `support` | 在本地生成官方脱敏诊断包 | 是，仅写本地文件 |

常用示例：

```bash
openclaw-companion check
openclaw-companion check --deep
openclaw-companion check --json
openclaw-companion check --json --strict
openclaw-companion upgrade --dry-run
openclaw-companion upgrade --channel beta
openclaw-companion backup --output ./backups
openclaw-companion repair --dry-run
openclaw-companion support --output ./support
```

全局参数：

| 参数 | 说明 |
|---|---|
| `--lang auto\|zh-CN\|en` | 选择界面语言 |
| `--json` | 输出机器可读结果；交互式 `setup` 仅支持 `--dry-run --json` 预览 |
| `--verbose` | 显示经过脱敏的官方命令原始输出 |
| `--yes` | 仅跳过明确的交互确认，不能跳过升级前备份 |
| `--dry-run` | 预览安装、升级、修复或备份动作 |
| `--strict` | `check` 出现 warning 时也返回非零退出码 |
| `--deep` | `check` 额外执行渠道网络探测 |
| `--output <路径>` | 指定备份或诊断包位置 |
| `--channel stable\|beta` | 指定官方 OpenClaw 更新通道 |

### `check --json`

稳定输出结构：

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-09-01T00:00:00.000Z",
  "locale": "zh-CN",
  "openclawVersion": "2026.8.1",
  "overall": "warning",
  "checks": [
    {
      "id": "openclaw/update",
      "status": "warning",
      "summary": "检测到 OpenClaw 有可用更新。",
      "sourceCommand": "openclaw update status --json",
      "fixHint": "请先运行官方安装器或升级到当前稳定版。"
    }
  ]
}
```

退出码：

- `0`：命令完成，检查没有 error；`--strict` 下也没有 warning。
- `1`：检查完成，但发现 error；`--strict` 下 warning 也返回 `1`。
- `2`：参数、运行环境或官方命令无法启动，CLI 无法正常执行。

解析采用向前兼容策略：忽略官方 JSON 新增字段；遇到缺失字段或非 JSON 输出时降级为 warning，而不是崩溃。Gateway 不可达、Doctor error、严重安全发现和更新可用状态会被单独识别。

### 中国区模型与飞书

`setup` 首页突出当前有官方接入路径的 Qwen、Moonshot/Kimi、DeepSeek、MiniMax 和飞书，认证仍由 `openclaw onboard`、`openclaw configure` 或 `openclaw channels login` 完成。

- [Qwen 官方接入](https://docs.openclaw.ai/providers/qwen)
- [Moonshot/Kimi 官方接入](https://docs.openclaw.ai/concepts/model-providers)
- [DeepSeek 官方接入](https://docs.openclaw.ai/providers/deepseek)
- [MiniMax 官方接入](https://docs.openclaw.ai/providers/minimax)
- [飞书官方接入](https://docs.openclaw.ai/channels/feishu)

项目不会承诺尚无官方稳定插件的微信、企业微信或钉钉入口；其他模型和渠道使用 OpenClaw 完整官方向导。

### 安全与隐私

- Companion 不读取、接收、保存或记录 API Key、Bot Token、Cookie、密码或聊天内容。
- 认证输入直接发生在 OpenClaw 官方交互流程中。
- 默认不保存运行日志；`--verbose` 输出会脱敏常见密钥、授权头、Cookie、URL 查询令牌和私钥内容。
- 诊断包只保存在本地。官方已执行脱敏，但分享前仍应自行检查。
- 更新失败不会自动恢复；CLI 会保留备份位置并提示使用官方恢复流程。
- 不包含应用内遥测。项目数据只来自 npm、GitHub Stars/Forks、Issues、Releases 和 CI。

详见 [Security Policy](SECURITY.md)。

### 开发与验证

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm audit --audit-level high
pnpm pack --dry-run
```

PR 会在 Windows、macOS、Ubuntu、Debian 和受支持的 Node.js 版本上运行模拟测试；每晚无密钥安装 OpenClaw 稳定版并执行隔离 smoke test。测试不连接真实模型，也不会产生 API 费用。

历史 v1 源码和恢复点保留在 [`v1.0.0`](https://github.com/JFroson0610/openclaw-easy-deploy/releases/tag/v1.0.0)。迁移说明见 [v1 → v2](docs/migration-v1-v2.md)。

## English

### What it solves

OpenClaw already ships installers, onboarding, Doctor, update, backup, and diagnostics tooling. OpenClaw Companion does not reimplement those capabilities. It combines official commands into workflows that are easier to understand and harder to misuse.

```text
You
└─ OpenClaw Companion: localized guidance, impact previews, confirmation, normalized results
   └─ Official OpenClaw CLI: install, authenticate, configure, update, back up, repair, diagnose
      └─ Your local OpenClaw data
```

It is designed for new and lightly technical users on Windows, macOS, Ubuntu, and Debian. It is not a web panel, desktop GUI, OpenClaw fork, or separately maintained background service.

### Core capabilities

| Capability | What Companion does | Safety boundary |
|---|---|---|
| Setup | Checks the environment, highlights Qwen, Kimi, DeepSeek, MiniMax, and Feishu, then opens official flows | Never accepts or stores credentials |
| Check | Combines version, update, Gateway, Doctor, and optional channel probes | Read-only |
| Upgrade | Preview → verified backup → confirmation → official update → post-upgrade checks | Stops when backup fails |
| Backup | Calls official `backup create --verify` | Never copies live SQLite files itself |
| Repair | Runs read-only Doctor, explains impact, backs up, then confirms repair and restart separately | No silent configuration changes |
| Support | Calls the official sanitized diagnostics exporter and reports the local path | Never uploads automatically |

All Companion-owned prompts are available in English and Simplified Chinese. Locale priority is `--lang` → `OPENCLAW_COMPANION_LANG` → system locale → English.

### Installation

Requirements:

- Windows 10/11, macOS 13+, Ubuntu 22.04/24.04, or Debian 12.
- Node.js 22.22.3+, 24.15+, 25.9+, or 26; Node 23 is explicitly unsupported.
- OpenClaw 2026.5.29 or newer. When it is missing, the compatibility launcher asks before invoking the official installer.

After the first beta publication:

```bash
npm install -g openclaw-companion@next
openclaw-companion setup
```

After the stable release:

```bash
npm install -g openclaw-companion
openclaw-companion setup
```

The legacy one-command URLs remain valid after v2 is merged and the npm package is published:

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.sh | bash
```

```powershell
# Windows PowerShell
irm https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.ps1 | iex
```

Inspect remote scripts before executing them. The launcher uses the official npm registry by default. If that registry fails, it can use `registry.npmmirror.com` for the current process only after explicit consent; it never runs `npm config set`.

Preview the current beta source:

```bash
git clone --branch feat/v2-companion https://github.com/JFroson0610/openclaw-easy-deploy.git
cd openclaw-easy-deploy
pnpm install --frozen-lockfile
pnpm build
node dist/cli.js check --json
```

### Commands

Running `openclaw-companion` without a command is equivalent to `openclaw-companion menu`.

| Command | Behavior | Mutates state? |
|---|---|---|
| `menu` | Opens the bilingual interactive menu | Depends on the selected action |
| `setup` | Checks the environment and opens official model/Feishu flows | Yes, through official flows |
| `check` | Combines version, update, Gateway, model/channel status, and Doctor checks | No |
| `upgrade` | Previews, backs up, updates, and runs post-upgrade checks | Yes, after confirmation |
| `backup` | Creates and verifies an official backup | Writes only the backup artifact |
| `repair` | Inspects, explains impact, backs up, and confirms repairs step by step | Yes, after confirmation |
| `support` | Creates an official sanitized diagnostics bundle locally | Writes only the local bundle |

Common examples:

```bash
openclaw-companion check
openclaw-companion check --deep
openclaw-companion check --json
openclaw-companion check --json --strict
openclaw-companion upgrade --dry-run
openclaw-companion upgrade --channel beta
openclaw-companion backup --output ./backups
openclaw-companion repair --dry-run
openclaw-companion support --output ./support
```

Global options:

| Option | Description |
|---|---|
| `--lang auto\|zh-CN\|en` | Select the interface language |
| `--json` | Emit machine-readable output; interactive `setup` supports it only with `--dry-run` |
| `--verbose` | Show redacted raw output from official commands |
| `--yes` | Skip explicit confirmations only; never skips the pre-upgrade backup |
| `--dry-run` | Preview install, upgrade, repair, or backup actions |
| `--strict` | Make `check` return nonzero for warnings as well as errors |
| `--deep` | Add channel network probes to `check` |
| `--output <path>` | Choose a backup or diagnostics destination |
| `--channel stable\|beta` | Select the official OpenClaw update channel |

### `check --json`

The command emits a stable schema-versioned envelope. Unknown additive upstream fields are ignored. Missing fields or non-JSON output degrade to a warning instead of crashing. Gateway reachability failures, Doctor errors, critical security findings, and available updates are classified separately.

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-09-01T00:00:00.000Z",
  "locale": "en",
  "openclawVersion": "2026.8.1",
  "overall": "warning",
  "checks": [
    {
      "id": "openclaw/update",
      "status": "warning",
      "summary": "An OpenClaw update is available.",
      "sourceCommand": "openclaw update status --json",
      "fixHint": "Run the official installer or update to the current stable release."
    }
  ]
}
```

Exit codes:

- `0`: the command completed with no errors; with `--strict`, it also has no warnings.
- `1`: checks completed and found an error; with `--strict`, warnings also return `1`.
- `2`: arguments, runtime prerequisites, or an official command could not be started correctly.

### China-focused providers and Feishu

The `setup` landing screen highlights Qwen, Moonshot/Kimi, DeepSeek, MiniMax, and Feishu when official integration paths exist. Authentication still happens inside `openclaw onboard`, `openclaw configure`, or `openclaw channels login`.

- [Official Qwen integration](https://docs.openclaw.ai/providers/qwen)
- [Official Moonshot/Kimi integration](https://docs.openclaw.ai/concepts/model-providers)
- [Official DeepSeek integration](https://docs.openclaw.ai/providers/deepseek)
- [Official MiniMax integration](https://docs.openclaw.ai/providers/minimax)
- [Official Feishu integration](https://docs.openclaw.ai/channels/feishu)

WeChat, WeCom, and DingTalk are not promoted until an official stable plugin exists. Other providers and channels remain available through OpenClaw's complete official wizards.

### Security and privacy

- Companion never reads, accepts, stores, or logs API keys, bot tokens, cookies, passwords, or chat content.
- Credential input happens directly inside official OpenClaw interactive flows.
- Runtime logs are not persisted by default. `--verbose` redacts common credentials, authorization headers, cookies, URL query tokens, and private-key blocks.
- Diagnostics bundles stay local. OpenClaw sanitizes them, but users should still review them before sharing.
- Failed upgrades are not rolled back automatically. The verified backup is retained for the documented manual recovery flow.
- There is no in-app telemetry. Project metrics come only from npm and public GitHub activity.

See the [Security Policy](SECURITY.md).

### Development and verification

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm audit --audit-level high
pnpm pack --dry-run
```

Pull requests run simulated tests on Windows, macOS, Ubuntu, Debian, and every supported Node.js line. A nightly no-key smoke test installs the latest stable OpenClaw release in isolated state. It never calls a real model or incurs API usage.

The historical v1 source and recovery point remain available in the [`v1.0.0` release](https://github.com/JFroson0610/openclaw-easy-deploy/releases/tag/v1.0.0). See the [v1 → v2 migration guide](docs/migration-v1-v2.md).

## License

[MIT](LICENSE)
