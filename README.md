# 🦞 OpenClaw Easy Deploy | OpenClaw 一键部署工具

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-blue)](https://github.com/JFroson0610/openclaw-easy-deploy)
[![OpenClaw](https://img.shields.io/badge/OpenClaw-Compatible-green)](https://openclaw.ai)

**让 OpenClaw 部署变得简单 - 零技术门槛，一键安装**

[English](#english) | [中文](#中文简介)

</div>

---

<a name="english"></a>

## 🌟 English

### 📖 What is OpenClaw Easy Deploy?

OpenClaw Easy Deploy is a community-contributed one-click installer designed to eliminate the pain points of deploying [OpenClaw](https://openclaw.ai). Even users with zero technical knowledge can get OpenClaw up and running.

**OpenClaw** is a powerful personal AI assistant that can:
- 🤖 Connect to multiple AI models (Claude, GPT, Gemini, etc.)
- 💬 Support multiple chat platforms (WhatsApp, Telegram, Discord, Slack, etc.)
- 🌐 Browser control, file operations, and skill extensions
- 🔒 Fully private deployment — your data stays yours

### ✨ Why This Tool?

Official OpenClaw deployment requires:
- ❌ Manually installing Node.js 22+
- ❌ Reading the official docs to figure out the right install path
- ❌ Understanding npm global installs and PATH configuration
- ❌ Dealing with platform-specific permission issues

**With this tool:**
- ✅ One command installs everything
- ✅ Auto-detects and installs Node.js 22+ if missing
- ✅ Installs `openclaw` globally via npm
- ✅ Hands off to the official `openclaw onboard` wizard (so config is always up-to-date)
- ✅ Full Chinese & English support

### 🚀 Quick Start

#### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.sh | bash
```

Or download and run:

```bash
wget https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.sh
chmod +x install.sh
./install.sh
```

#### Windows

```powershell
# Run PowerShell as Administrator
irm https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.ps1 | iex
```

### ⚙️ What the Script Does

1. **Detects your OS and architecture**
2. **Installs Node.js 22+** (via Homebrew on macOS, nvm on Linux) — skipped if already installed
3. **Installs OpenClaw** via `npm install -g openclaw@latest`
4. **Runs `openclaw onboard --install-daemon`** — the official interactive wizard that:
   - Configures your AI model (Claude, OpenAI, Gemini, etc.)
   - Generates a secure Gateway token
   - Installs the background daemon (auto-start on login)
   - Starts the Gateway
5. **Verifies** the installation and prints useful commands

### 📋 System Requirements

- **OS**: macOS 10.15+, Ubuntu 20.04+, Debian 10+, CentOS 8+, Windows 10+
- **Architecture**: x86_64 or arm64 (Apple Silicon)
- **Disk Space**: At least 500 MB free
- **RAM**: 1 GB or more recommended
- **Node.js**: 22+ (auto-installed if missing)

### 📚 Documentation

- [Installation Guide](docs/installation.md)
- [Configuration Guide](docs/configuration.md)
- [Troubleshooting](docs/troubleshooting.md)
- [API Key Setup](docs/api-keys.md)
- [FAQ](docs/faq.md)

### 🤝 Contributing

Contributions are welcome! Please open an [Issue](https://github.com/JFroson0610/openclaw-easy-deploy/issues) or submit a [Pull Request](https://github.com/JFroson0610/openclaw-easy-deploy/pulls).

### 📄 License

MIT License — see [LICENSE](LICENSE)

### 🙏 Credits

Built on top of [OpenClaw](https://github.com/openclaw/openclaw). Thanks to the OpenClaw team for their amazing work!

> **Note**: This is a community-contributed installer, not an official OpenClaw project.

---

<a name="中文简介"></a>

## 中文

### 📖 项目简介

OpenClaw Easy Deploy 是一个社区贡献的一键部署工具，旨在解决 [OpenClaw](https://openclaw.ai) 部署过程中的各种痛点，让完全不懂技术的用户也能轻松安装和使用 OpenClaw。

**OpenClaw** 是一个强大的个人 AI 助手，可以：
- 🤖 连接多种 AI 模型（Claude、GPT、Gemini 等）
- 💬 支持多个聊天平台（WhatsApp、Telegram、Discord、Slack 等）
- 🌐 浏览器控制、文件操作、技能扩展
- 🔒 完全私有部署，数据安全

### ✨ 为什么需要这个工具？

官方 OpenClaw 部署需要：
- ❌ 手动安装 Node.js 22+
- ❌ 查阅官方文档弄清楚正确的安装路线
- ❌ 处理 npm 全局安装和 PATH 配置问题
- ❌ 应对各平台特有的权限问题

**使用本工具后：**
- ✅ 一条命令完成所有安装
- ✅ 自动检测并安装 Node.js 22+
- ✅ 自动通过 npm 全局安装 openclaw
- ✅ 直接调用官方 `openclaw onboard` 向导（确保配置始终与官方一致）
- ✅ 中英双语支持

### 🚀 快速开始

#### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.sh | bash
```

或者下载后执行：

```bash
wget https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.sh
chmod +x install.sh
./install.sh
```

#### Windows

```powershell
# 以管理员身份运行 PowerShell
irm https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.ps1 | iex
```

### ⚙️ 脚本做了什么

1. **检测操作系统和 CPU 架构**
2. **安装 Node.js 22+**（macOS 用 Homebrew，Linux 用 nvm）—— 已安装则跳过
3. **安装 OpenClaw**：`npm install -g openclaw@latest`
4. **运行 `openclaw onboard --install-daemon`**（官方交互式向导）：
   - 配置 AI 模型（Claude、OpenAI、Gemini 等）
   - 生成安全的 Gateway Token
   - 安装后台守护进程（登录自启）
   - 启动 Gateway
5. **验证安装** 并打印常用命令

### 📋 系统要求

- **操作系统**: macOS 10.15+, Ubuntu 20.04+, Debian 10+, CentOS 8+, Windows 10+
- **CPU 架构**: x86_64 或 arm64 (Apple Silicon)
- **磁盘空间**: 至少 500MB 可用空间
- **内存**: 建议 1GB 以上
- **Node.js**: 22+（缺失会自动安装）

### 🎯 功能特性

#### 🔍 智能环境检测
- 自动检测操作系统和架构
- 检测已安装的 Node.js 版本
- 检查磁盘空间和端口占用

#### 📦 自动依赖安装
- **Node.js 22+**: 通过 Homebrew（macOS）或 nvm（Linux）自动安装
- **npm 全局路径**: 自动修复 PATH 配置，确保 `openclaw` 命令可用

#### ⚙️ 官方配置向导
- 直接调用 `openclaw onboard --install-daemon` 官方向导
- 向导会引导配置 AI 模型（Claude、OpenAI、Gemini 等）
- 自动安装后台守护进程（开机自启）
- 启动 Gateway 服务

#### 🛡️ 错误处理和诊断
- 友好的错误提示和解决方案
- 详细的安装日志（`~/.openclaw/install.log`）
- 内置诊断工具（openclaw-manager）

#### ♻️ 幂等性设计
- 可以安全地重复运行脚本
- 自动跳过已完成的步骤

#### 🌍 多语言支持
- 完整的中英双语文档
- 中文友好的错误提示

### 📸 安装演示

```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║       🦞  OpenClaw Easy Deploy  🦞                            ║
║                                                               ║
║       让 OpenClaw 部署变得简单 - 零技术门槛，一键安装           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

⚠️  安装前请准备：AI 平台的 API Key（如 OpenAI / Claude / Gemini）
📖 获取指南: https://github.com/JFroson0610/openclaw-easy-deploy/blob/main/docs/api-keys-zh.md

ℹ 操作系统: macOS 14.2
ℹ CPU 架构: Apple Silicon (M1/M2/M3)
✅ Node.js 版本满足要求 (≥22)
✅ 可用磁盘空间: 50GB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
安装 OpenClaw（npm install -g）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ 正在通过 npm 全局安装最新版 OpenClaw...
✅ OpenClaw 1.2.3 安装成功

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
运行 OpenClaw 配置向导（onboard）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  接下来将运行 OpenClaw 官方交互式配置向导

  向导会引导你完成：
  • 配置 AI 模型（Claude / OpenAI / Gemini 等）
  • 生成 Gateway Token
  • 安装守护进程（开机自启）
  • 启动 Gateway 服务

准备好了，开始向导? (Y/n): y

[OpenClaw 官方向导运行中...]

✅ onboard 配置向导完成！

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
验证安装
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ openclaw 命令就绪（1.2.3）
✅ Gateway 端口 18789 已监听
✅ Gateway 健康检查通过！

╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║                   🎉  安装成功！ 🎉                           ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

📍 访问 Gateway 控制台: http://localhost:18789
```

### 📚 详细文档

- [安装指南](docs/installation-zh.md) - 详细的安装步骤和说明
- [配置指南](docs/configuration-zh.md) - 配置文件详解
- [故障排查](docs/troubleshooting-zh.md) - 常见问题和解决方案
- [API 密钥获取](docs/api-keys-zh.md) - 如何获取各种 API Key
- [常见问题 FAQ](docs/faq-zh.md) - 常见问题解答

### 📁 项目结构

```
openclaw-easy-deploy/
├── install.sh              # macOS/Linux 一键安装脚本
├── install.ps1             # Windows PowerShell 安装脚本
├── bin/
│   └── openclaw-manager    # 交互式管理工具（8大功能）
├── scripts/                # Bash 模块化子脚本
│   ├── common.sh           # 公共函数库
│   ├── detect-env.sh       # 环境检测
│   ├── install-node.sh     # Node.js 安装
│   ├── configure.sh        # OpenClaw 安装与配置
│   └── verify.sh           # 验证与成功提示
├── docs/                   # 完整文档（中英双语）
│   ├── installation*.md    # 安装指南
│   ├── configuration*.md   # 配置指南
│   ├── troubleshooting*.md # 故障排查
│   ├── api-keys*.md        # API Key 获取
│   └── faq*.md             # 常见问题
└── .github/
    └── workflows/          # CI/CD 自动化
```

### 🔧 安装后管理

安装完成后，使用 `openclaw` CLI 管理 OpenClaw：

```bash
# 查看 Gateway 状态
openclaw gateway status

# 查看 Gateway 日志
openclaw gateway logs

# 停止守护进程
openclaw daemon stop

# 启动守护进程
openclaw daemon start

# 更新到最新版
npm update -g openclaw

# 重新运行配置向导
openclaw onboard
```

### 🔑 配置聊天平台

#### WhatsApp（扫码登录）

```bash
openclaw channels login --channel whatsapp
```

#### Telegram（Bot Token）

```bash
openclaw channels add --channel telegram --token YOUR_BOT_TOKEN
```

#### Discord（Bot Token）

```bash
openclaw channels add --channel discord --token YOUR_BOT_TOKEN
```

更多详情请查看 [官方文档](https://docs.openclaw.ai/channels)。

### 🤝 贡献

欢迎贡献！如果您发现问题或有改进建议，请：
- 提交 Issue: [GitHub Issues](https://github.com/JFroson0610/openclaw-easy-deploy/issues)
- 提交 Pull Request: [GitHub PRs](https://github.com/JFroson0610/openclaw-easy-deploy/pulls)

### 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

### 🙏 致谢

本项目基于 [OpenClaw](https://github.com/openclaw/openclaw) 构建，感谢 OpenClaw 团队的出色工作！

---

**注意**: 本项目是社区贡献的简化安装工具，不是 OpenClaw 官方项目。

