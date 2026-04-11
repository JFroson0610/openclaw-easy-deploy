# OpenClaw Easy Deploy - 项目结构设计

**日期**: 2026-03-12  
**阶段**: 第二阶段 - 项目结构设计

---

## 📁 项目文件结构

```
openclaw-easy-deploy/
├── README.md                          # 项目主页（中英双语）
├── LICENSE                            # MIT 许可证
├── .gitignore                         # Git 忽略文件
├── RESEARCH_REPORT.md                 # 调研报告（内部文档）
│
├── install.sh                         # macOS/Linux 主安装脚本 ⭐
├── install.ps1                        # Windows 主安装脚本 ⭐
│
├── scripts/                           # 模块化脚本目录
│   ├── common.sh                      # 通用函数库
│   ├── detect-env.sh                  # 环境检测模块
│   ├── install-node.sh                # Node.js 安装模块
│   ├── install-docker.sh              # Docker 安装模块
│   ├── configure.sh                   # 交互式配置模块
│   ├── start-service.sh               # 服务启动模块
│   ├── verify.sh                      # 安装验证模块
│   └── windows/                       # Windows 专用脚本
│       ├── common.ps1
│       ├── detect-env.ps1
│       ├── install-node.ps1
│       └── install-docker.ps1
│
├── bin/                               # 可执行工具
│   └── openclaw-manager               # 服务管理工具 ⭐
│
├── templates/                         # 配置模板
│   ├── .env.template                  # .env 配置模板
│   ├── systemd.service.template       # Linux systemd 模板
│   └── launchd.plist.template         # macOS LaunchAgent 模板
│
├── docs/                              # 文档目录
│   ├── installation.md                # 安装指南（英文）
│   ├── installation-zh.md             # 安装指南（中文）
│   ├── configuration.md               # 配置指南（英文）
│   ├── configuration-zh.md            # 配置指南（中文）
│   ├── troubleshooting.md             # 故障排查（英文）
│   ├── troubleshooting-zh.md          # 故障排查（中文）
│   ├── api-keys.md                    # API 密钥获取（英文）
│   ├── api-keys-zh.md                 # API 密钥获取（中文）
│   ├── faq.md                         # 常见问题（英文）
│   ├── faq-zh.md                      # 常见问题（中文）
│   └── images/                        # 文档图片
│       ├── install-demo.gif
│       ├── dashboard-screenshot.png
│       └── architecture.png
│
├── .github/                           # GitHub 配置
│   ├── workflows/                     # CI/CD 工作流
│   │   └── test.yml                   # 测试工作流
│   ├── ISSUE_TEMPLATE/                # Issue 模板
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   └── PULL_REQUEST_TEMPLATE.md       # PR 模板
│
└── CONTRIBUTING.md                    # 贡献指南
```

---

## 🎯 核心脚本架构设计

### 1. install.sh（macOS/Linux 主脚本）

**职责**: 统一入口，协调各模块完成安装

**流程**:
```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. 显示欢迎界面
show_welcome()

# 2. 检测操作系统
detect_os()  # macOS / Ubuntu / Debian / CentOS / Arch

# 3. 检测已安装组件
check_node_version()
check_docker_installed()
check_docker_compose()

# 4. 安装缺失依赖
install_node_if_needed()
install_docker_if_needed()

# 5. 交互式配置
configure_openclaw()
  - 生成 OPENCLAW_GATEWAY_TOKEN
  - 询问 API Keys（可选）
  - 询问聊天平台（可选）
  - 生成 .env 文件

# 6. 下载并启动 OpenClaw
download_openclaw()
start_openclaw_service()

# 7. 验证安装
verify_installation()
  - 检查服务状态
  - 健康检查 (http://localhost:18789/healthz)

# 8. 显示成功信息和下一步
show_success_message()
```

**关键特性**:
- ✅ 幂等性：可重复运行，跳过已完成步骤
- ✅ 错误处理：每步失败都有明确提示
- ✅ 日志记录：所有操作记录到 `~/.openclaw/install.log`
- ✅ 回滚机制：失败时清理已创建的文件

**代码结构**（约 400 行，需分块写入）:
```bash
# Part 1: 头部和通用函数 (150 行)
# Part 2: 环境检测和依赖安装 (150 行)
# Part 3: 配置和启动 (100 行)
```

### 2. install.ps1（Windows 主脚本）

**职责**: Windows 平台的安装入口

**流程**:
```powershell
# 1. 检查管理员权限
Require-Administrator

# 2. 检测 PowerShell 版本
Check-PowerShellVersion  # 需要 5.1+

# 3. 设置执行策略
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# 4. 检测包管理器
Detect-PackageManager  # winget / choco / scoop

# 5. 安装依赖
Install-NodeIfNeeded
Install-DockerIfNeeded

# 6. 配置 OpenClaw
Configure-OpenClaw

# 7. 启动服务
Start-OpenClawService

# 8. 验证
Verify-Installation
```

**关键特性**:
- ✅ 支持 WSL2 和原生 Windows
- ✅ 自动检测并使用最佳包管理器
- ✅ 处理路径分隔符差异
- ✅ Windows Service 或计划任务

---

## 🔧 模块化脚本设计

### scripts/common.sh（通用函数库）

**职责**: 提供可复用的工具函数

**核心函数**:
```bash
# 颜色输出
log_info()    # 蓝色信息
log_success() # 绿色成功
log_warning() # 黄色警告
log_error()   # 红色错误

# 命令检测
command_exists()  # 检查命令是否存在

# 用户交互
ask_yes_no()      # 询问是/否
ask_input()       # 询问输入
ask_optional()    # 询问可选输入

# 文件操作
backup_file()     # 备份文件
restore_file()    # 恢复文件

# 网络检测
check_internet()  # 检查网络连接
check_port()      # 检查端口占用

# Token 生成
generate_token()  # 生成 64 字符随机 token
```

### scripts/detect-env.sh（环境检测）

**职责**: 检测系统环境和已安装组件

**检测项**:
```bash
detect_os()           # 操作系统类型和版本
detect_arch()         # CPU 架构 (x86_64/arm64)
detect_node()         # Node.js 版本
detect_docker()       # Docker 版本
detect_docker_compose() # Docker Compose 版本
detect_package_manager() # 包管理器 (apt/yum/brew)
check_disk_space()    # 磁盘空间（至少 2GB）
check_memory()        # 内存（至少 2GB）
```

**输出格式**:
```
✅ 操作系统: macOS 14.2 (arm64)
✅ Node.js: v22.1.0
❌ Docker: 未安装
✅ 磁盘空间: 50GB 可用
✅ 内存: 16GB
```

### scripts/install-node.sh（Node.js 安装）

**职责**: 自动安装 Node.js 22+

**安装策略**:

**macOS**:
1. 优先使用 Homebrew: `brew install node@22`
2. 备选 nvm: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`

**Linux**:
1. 优先使用 NodeSource 仓库
2. 备选 nvm

**特性**:
- ✅ 自动检测已安装的 Node
- ✅ 版本不符时提示升级
- ✅ 安装后验证版本

### scripts/configure.sh（交互式配置）

**职责**: 引导用户完成配置

**配置流程**:
```bash
1. 生成 Gateway Token
   - 使用 openssl rand -hex 32
   - 或 Python secrets.token_hex(32)

2. 询问 AI 模型配置（至少一个）
   - Claude API Key
   - OpenAI API Key
   - Gemini API Key
   - 或跳过（稍后配置）

3. 询问聊天平台（可选）
   - WhatsApp
   - Telegram
   - Discord
   - Slack

4. 高级配置（可选）
   - 端口修改（默认 18789）
   - 绑定模式（loopback/lan）
   - 沙箱模式

5. 生成 .env 文件
   - 使用 templates/.env.template
   - 替换占位符
   - 保存到 ~/.openclaw/.env
```

---

## 🛠️ openclaw-manager 管理工具设计

**职责**: 提供简单的服务管理命令

**命令列表**:
```bash
openclaw-manager start      # 启动服务
openclaw-manager stop       # 停止服务
openclaw-manager restart    # 重启服务
openclaw-manager status     # 查看状态
openclaw-manager logs       # 查看日志
openclaw-manager update     # 更新到最新版
openclaw-manager config     # 重新配置
openclaw-manager uninstall  # 卸载
openclaw-manager doctor     # 诊断问题
```

**实现方式**:
- macOS: 调用 `launchctl` 或 `docker compose`
- Linux: 调用 `systemctl` 或 `docker compose`
- Windows: 调用 `sc.exe` 或 `docker compose`

---

## 📋 用户安装流程图

```
┌─────────────────────────────────────────┐
│  用户执行一键安装命令                      │
│  curl ... | bash                        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  显示欢迎界面                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  🦞 OpenClaw Easy Deploy                │
│  让 OpenClaw 部署变得简单                 │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  系统环境检测                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ✅ 操作系统: macOS 14.2                 │
│  ✅ CPU 架构: arm64                      │
│  ❌ Node.js: 未安装                      │
│  ❌ Docker: 未安装                       │
│  ✅ 磁盘空间: 50GB                       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  安装缺失依赖                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [1/2] 正在安装 Node.js 22...           │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%             │
│  ✅ Node.js 22.1.0 安装成功              │
│                                         │
│  [2/2] 正在安装 Docker...               │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%             │
│  ✅ Docker 24.0.7 安装成功               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  交互式配置向导                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [1/4] Gateway Token                    │
│  ✅ 已自动生成安全的随机 Token            │
│                                         │
│  [2/4] AI 模型配置（至少选一个）          │
│  ? 是否配置 Claude API Key? (y/N)       │
│  > y                                    │
│  请输入 Claude API Key:                  │
│  > sk-ant-xxxxx                         │
│  ✅ Claude API Key 已保存                │
│                                         │
│  ? 是否配置 OpenAI API Key? (y/N)       │
│  > n                                    │
│  ⏭️  已跳过                              │
│                                         │
│  [3/4] 聊天平台配置（可选）               │
│  ? 是否配置聊天平台? (y/N)               │
│  > n                                    │
│  ⏭️  已跳过，稍后可通过命令配置            │
│                                         │
│  [4/4] 高级配置                          │
│  使用默认配置（端口 18789，LAN 模式）     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  下载并启动 OpenClaw                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  正在拉取 Docker 镜像...                 │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%             │
│  正在启动服务...                         │
│  ✅ OpenClaw Gateway 已启动              │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  安装验证                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  正在检查服务健康状态...                  │
│  ✅ Gateway 响应正常                     │
│  ✅ 端口 18789 可访问                    │
│  ✅ 配置文件完整                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  🎉 安装成功！                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  OpenClaw 已成功安装并运行！              │
│                                         │
│  📍 访问地址:                            │
│     http://localhost:18789              │
│                                         │
│  🔑 Gateway Token:                      │
│     abc123...xyz (已保存到配置文件)       │
│                                         │
│  📚 下一步操作:                          │
│     1. 配置聊天平台（WhatsApp/Telegram） │
│        openclaw-manager config          │
│                                         │
│     2. 查看服务状态                      │
│        openclaw-manager status          │
│                                         │
│     3. 查看日志                          │
│        openclaw-manager logs            │
│                                         │
│  📖 完整文档:                            │
│     https://github.com/JFroson0610/   │
│     openclaw-easy-deploy                │
└─────────────────────────────────────────┘
```

---

## 🔄 错误处理机制设计

### 1. 分级错误处理

**致命错误（Fatal Error）**:
- 操作系统不支持
- 磁盘空间不足
- 无法获取管理员权限
- **处理**: 立即退出，显示错误和解决方案

**可恢复错误（Recoverable Error）**:
- 网络下载失败
- 依赖安装失败
- 端口被占用
- **处理**: 重试 3 次，失败后提示手动解决

**警告（Warning）**:
- 可选配置跳过
- 非关键功能不可用
- **处理**: 显示警告，继续执行

### 2. 错误提示模板

```bash
❌ 错误: Docker 安装失败

原因: 无法连接到 Docker 仓库

可能的解决方案:
  1. 检查网络连接
  2. 配置 Docker 镜像源（中国用户）
  3. 手动安装 Docker Desktop

详细日志: ~/.openclaw/install.log

需要帮助?
  - 查看故障排查文档: docs/troubleshooting-zh.md
  - 提交 Issue: https://github.com/.../issues
```

### 3. 自动诊断功能

**openclaw-manager doctor** 命令会检查:
- ✅ Node.js 版本
- ✅ Docker 运行状态
- ✅ 端口占用情况
- ✅ 配置文件完整性
- ✅ 磁盘空间
- ✅ 网络连接
- ✅ 服务健康状态

---

## ♻️ 幂等性设计

**原则**: 脚本可以安全地重复运行，不会造成问题

**实现策略**:

1. **检测已安装组件**
   ```bash
   if command -v node &> /dev/null; then
     log_info "Node.js 已安装，跳过安装步骤"
     return 0
   fi
   ```

2. **备份现有配置**
   ```bash
   if [ -f ~/.openclaw/.env ]; then
     backup_file ~/.openclaw/.env
     log_warning "已备份现有配置到 .env.backup"
   fi
   ```

3. **增量更新**
   ```bash
   # 只更新缺失的配置项，不覆盖已有配置
   if ! grep -q "OPENCLAW_GATEWAY_TOKEN" ~/.openclaw/.env; then
     echo "OPENCLAW_GATEWAY_TOKEN=$TOKEN" >> ~/.openclaw/.env
   fi
   ```

4. **清理失败状态**
   ```bash
   trap cleanup EXIT
   cleanup() {
     if [ $? -ne 0 ]; then
       log_error "安装失败，正在清理..."
       # 回滚操作
     fi
   }
   ```

---

## 📊 第二阶段设计总结

### ✅ 已完成设计

1. **文件结构**: 清晰的目录组织，模块化设计
2. **脚本架构**: 主脚本 + 模块化子脚本
3. **用户流程**: 从安装到成功的完整流程图
4. **错误处理**: 三级错误处理机制
5. **幂等性**: 可重复运行的安全设计

### 🎯 设计亮点

1. **模块化**: 每个脚本职责单一，易测试
2. **用户友好**: 清晰的进度提示和错误信息
3. **跨平台**: 统一的用户体验
4. **可维护**: 代码结构清晰，易扩展
5. **安全性**: Token 自动生成，配置备份

### 📝 下一步

现在设计已经完成，可以开始第三阶段：**核心脚本开发**

---

**设计完成时间**: 2026-03-12 02:15
**下一步**: 开始开发 install.sh 主脚本

