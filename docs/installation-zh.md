# OpenClaw 安装指南

## 快速安装

### macOS / Linux

```bash
curl -fsSL https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.sh | bash
```

### 安装过程

脚本会自动完成以下步骤：

1. **检测系统环境**
   - 操作系统类型和版本（macOS / Linux）
   - CPU 架构（x86_64 / arm64）

2. **安装 Node.js 22+**（如果未安装）
   - macOS：优先通过 Homebrew 安装，回退到 nvm
   - Linux：通过 nvm 安装

3. **安装 OpenClaw**
   - 执行 `npm install -g openclaw@latest`
   - 安装最新版本到系统全局

4. **运行官方配置向导**
   - 执行 `openclaw onboard --install-daemon`
   - **向导会引导你**：选择 AI 模型、输入 API Key、生成 Token
   - 自动安装守护进程（macOS：LaunchAgent，Linux：systemd）
   - 启动 Gateway 服务

5. **验证安装**
   - 确认 `openclaw` 命令可用
   - 检查 Gateway 端口是否在监听
   - HTTP 健康检查

## 配置 API 密钥

### Claude API Key

1. 访问 https://console.anthropic.com/
2. 注册账号并登录
3. 创建 API Key
4. 在安装过程中输入

### OpenAI API Key

1. 访问 https://platform.openai.com/api-keys
2. 登录账号
3. 创建新的 API Key
4. 在安装过程中输入

### Gemini API Key

1. 访问 https://makersuite.google.com/app/apikey
2. 登录 Google 账号
3. 创建 API Key
4. 在安装过程中输入

## 安装后配置

### 配置聊天平台

#### WhatsApp

```bash
openclaw channels login --channel whatsapp
```

扫描二维码登录 WhatsApp。

#### Telegram

```bash
openclaw channels add --channel telegram --token YOUR_BOT_TOKEN
```

#### Discord

```bash
openclaw channels add --channel discord --token YOUR_BOT_TOKEN
```

## 管理服务

### 查看状态

```bash
openclaw gateway status
```

### 查看日志

```bash
openclaw gateway logs
```

### 停止守护进程

```bash
openclaw daemon stop
```

### 启动守护进程

```bash
openclaw daemon start
```

### 更新到最新版

```bash
npm update -g openclaw
```

### 重新运行配置向导

```bash
openclaw onboard
```

## 故障排查

### 端口被占用

如果端口 18789 被其他程序占用，安装前先查看是哪个进程：

```bash
# macOS / Linux
lsof -iTCP:18789 -sTCP:LISTEN

# 然后使用其他端口运行安装脚本
OPENCLAW_PORT=18800 ./install.sh
```

### Docker 未启动

**macOS**: 打开 Launchpad 找到 Docker Desktop，或运行：

```bash
open -a Docker
# 等待约 30 秒后重试
```

**Linux**: 启动 Docker 服务：

```bash
sudo systemctl start docker
sudo systemctl enable docker  # 设置开机自启
```

### Node.js 版本过低

脚本会自动安装 Node.js 22+，如果自动安装失败，请手动安装：

```bash
# macOS (Homebrew)
brew install node@22
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

# macOS / Linux (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 22
nvm use 22
nvm alias default 22
```

### Docker 权限问题（Linux）

Linux 下首次安装 Docker 后，需要把用户加入 docker 组：

```bash
sudo usermod -aG docker $USER
# 必须重新登录或开新终端才能生效
newgrp docker
```

### 服务启动后健康检查失败

服务可能仍在初始化中，等待约 30 秒后手动检查：

```bash
# 检查 Gateway 状态
openclaw gateway status

# 查看详细日志（找 ERROR 行）
openclaw gateway logs

# 手动健康检查
curl -v http://localhost:18789/healthz
```

### 重新配置

```bash
# 重新运行官方配置向导
openclaw onboard --install-daemon
```

---

## 卸载

```bash
# 1. 停止守护进程
openclaw daemon stop

# 2. 卸载 OpenClaw npm 包
npm uninstall -g openclaw

# 3. 删除 OpenClaw 数据目录（⚠️ 不可恢复，包含配置和日志）
rm -rf ~/.openclaw
```

---

## 获取帮助

| 途径 | 链接 |
|------|------|
| 📋 安装日志 | `~/.openclaw/install.log` |
| 🐛 提交 Issue | https://github.com/JFroson0610/openclaw-easy-deploy/issues |
| 📖 官方文档 | https://docs.openclaw.ai |
| 💬 OpenClaw 社区 | https://github.com/openclaw/openclaw/discussions |

