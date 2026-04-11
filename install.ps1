# OpenClaw Easy Deploy - Windows 一键安装脚本
# 适用于 Windows 10/11 (PowerShell 5.1+)
#
# 使用方法 (以管理员身份运行 PowerShell):
#   irm https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.ps1 | iex
#
# 或者下载后执行:
#   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
#   .\install.ps1

[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ============================================================================
# 全局变量
# ============================================================================

$VERSION        = "1.0.0"
$OPENCLAW_PORT  = if ($env:OPENCLAW_PORT) { $env:OPENCLAW_PORT } else { "18789" }
$INSTALL_DIR    = "$env:USERPROFILE\.openclaw"
$LOG_FILE       = "$INSTALL_DIR\install.log"

# ============================================================================
# 日志和输出函数
# ============================================================================

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $LOG_FILE -Value "[$timestamp] $Message" -Encoding UTF8
}

function Write-Info {
    param([string]$Message)
    Write-Host "  ℹ $Message" -ForegroundColor Cyan
    Write-Log "INFO: $Message"
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✅ $Message" -ForegroundColor Green
    Write-Log "SUCCESS: $Message"
}

function Write-Warning2 {
    param([string]$Message)
    Write-Host "  ⚠ $Message" -ForegroundColor Yellow
    Write-Log "WARNING: $Message"
}

function Write-Error2 {
    param([string]$Message)
    Write-Host "  ❌ $Message" -ForegroundColor Red
    Write-Log "ERROR: $Message"
}

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Log "STEP: $Message"
}

# ============================================================================
# 工具函数
# ============================================================================

function Test-CommandExists {
    param([string]$Command)
    return [bool](Get-Command $Command -ErrorAction SilentlyContinue)
}

function Ask-YesNo {
    param([string]$Prompt, [string]$Default = "Y")
    $hint = if ($Default -eq "Y") { "(Y/n)" } else { "(y/N)" }
    $answer = Read-Host "$Prompt $hint"
    if ([string]::IsNullOrWhiteSpace($answer)) { $answer = $Default }
    return $answer -match '^[Yy]'
}

function Test-IsAdmin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal   = [Security.Principal.WindowsPrincipal]$currentUser
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Test-PortListening {
    param([string]$Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
        return ($null -ne $connections)
    } catch {
        return $false
    }
}

function Refresh-Path {
    # 从注册表重新加载 PATH，使新安装的程序立即可用
    $machinePath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
    $userPath    = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $env:PATH    = "$machinePath;$userPath"
}

# ============================================================================
# 欢迎界面
# ============================================================================

function Show-Welcome {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║                                                           ║" -ForegroundColor Cyan
    Write-Host "  ║     🦞  OpenClaw Easy Deploy  🦞                          ║" -ForegroundColor Cyan
    Write-Host "  ║                                                           ║" -ForegroundColor Cyan
    Write-Host "  ║     让 OpenClaw 部署变得简单 - 零技术门槛，一键安装        ║" -ForegroundColor Cyan
    Write-Host "  ║                                                           ║" -ForegroundColor Cyan
    Write-Host "  ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  版本: " -NoNewline; Write-Host "v$VERSION" -ForegroundColor Green
    Write-Host "  项目: " -NoNewline; Write-Host "https://github.com/JFroson0610/openclaw-easy-deploy" -ForegroundColor Blue
    Write-Host ""
    Write-Host "  ⚠️  安装前请准备：" -NoNewline -ForegroundColor Yellow; Write-Host "AI 平台的 API Key（如 OpenAI / Claude / Gemini）"
    Write-Host "  📖 获取指南：" -NoNewline -ForegroundColor Blue; Write-Host "https://github.com/JFroson0610/openclaw-easy-deploy/blob/main/docs/api-keys-zh.md"
    Write-Host ""
}

# ============================================================================
# 系统检测
# ============================================================================

function Detect-System {
    Write-Step "检测系统环境"

    $osInfo = Get-WmiObject -Class Win32_OperatingSystem
    Write-Info "操作系统: $($osInfo.Caption)"
    Write-Info "版本: $($osInfo.Version)"

    $arch = $env:PROCESSOR_ARCHITECTURE
    Write-Info "CPU 架构: $arch"

    # 检查可用磁盘空间（C盘，单位 GB）
    $disk = Get-PSDrive -Name C
    $freeGB = [math]::Round($disk.Free / 1GB, 1)
    Write-Info "C盘可用空间: ${freeGB}GB"
    if ($freeGB -lt 1) {
        Write-Error2 "磁盘空间不足！至少需要 1GB 可用空间"
        exit 1
    }

    # 检查执行策略
    $policy = Get-ExecutionPolicy -Scope CurrentUser
    if ($policy -eq 'Restricted') {
        Write-Warning2 "PowerShell 执行策略为 Restricted，正在调整..."
        Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
        Write-Success "执行策略已设置为 RemoteSigned"
    }

    Write-Success "系统环境检测完成"
}

# ============================================================================
# Node.js 检测与安装
# ============================================================================

function Test-NodeVersion {
    Write-Step "检测 Node.js"

    if (-not (Test-CommandExists 'node')) {
        Write-Warning2 "Node.js 未安装"
        return $false
    }

    $nodeVer = (node -v) -replace 'v', ''
    $nodeMajor = [int]($nodeVer -split '\.')[0]
    Write-Info "已安装 Node.js: v$nodeVer"

    if ($nodeMajor -ge 22) {
        Write-Success "Node.js 版本满足要求 (≥22)"
        return $true
    } else {
        Write-Warning2 "Node.js 版本过低 (当前: $nodeMajor, 需要: ≥22)"
        return $false
    }
}

function Install-NodeWindows {
    Write-Step "安装 Node.js 22"

    # 方案1: winget（Windows 10 1709+ / Windows 11 内置）
    if (Test-CommandExists 'winget') {
        Write-Info "使用 winget 安装 Node.js 22 LTS..."
        try {
            winget install OpenJS.NodeJS.LTS --version "22*" --accept-source-agreements --accept-package-agreements --silent
            Refresh-Path
            if (Test-NodeVersion) {
                Write-Success "Node.js 22 安装成功 (winget)"
                return $true
            }
        } catch {
            Write-Warning2 "winget 安装失败，尝试 Chocolatey..."
        }
    }

    # 方案2: Chocolatey
    if (Test-CommandExists 'choco') {
        Write-Info "使用 Chocolatey 安装 Node.js 22..."
        try {
            choco install nodejs-lts --version="22*" -y
            Refresh-Path
            if (Test-NodeVersion) {
                Write-Success "Node.js 22 安装成功 (Chocolatey)"
                return $true
            }
        } catch {
            Write-Warning2 "Chocolatey 安装失败"
        }
    }

    # 方案3: 引导手动安装
    Write-Warning2 "无法自动安装 Node.js，请手动安装："
    Write-Host ""
    Write-Host "  1. 访问: https://nodejs.org/en/download" -ForegroundColor Yellow
    Write-Host "  2. 下载 Node.js 22 LTS Windows 安装包 (.msi)" -ForegroundColor Yellow
    Write-Host "  3. 运行安装包，完成后重新打开 PowerShell 执行此脚本" -ForegroundColor Yellow
    Write-Host ""
    $open = Ask-YesNo "是否现在打开 Node.js 下载页面?"
    if ($open) {
        Start-Process "https://nodejs.org/en/download"
    }
    return $false
}

# ============================================================================
# 安装 OpenClaw（NPM 路线）
# ============================================================================

function Install-OpenclawNpm {
    Write-Step "安装 OpenClaw（NPM 方式）"
    Write-Info "正在通过 npm 全局安装最新版 OpenClaw..."
    Write-Host ""

    try {
        npm install -g openclaw@latest
    } catch {
        Write-Error2 "npm 安装失败: $_"
        Write-Info "请手动运行: npm install -g openclaw@latest"
        return $false
    }

    # 刷新 PATH 后重新检测
    Refresh-Path

    if (-not (Test-CommandExists 'openclaw')) {
        # 尝试从 npm global bin 加载
        $npmBin = (npm bin -g 2>$null)
        if ($npmBin -and (Test-Path "$npmBin\openclaw.cmd")) {
            $env:PATH = "$npmBin;$env:PATH"
        }
    }

    if (Test-CommandExists 'openclaw') {
        $ocVer = (openclaw --version 2>$null) ?? "已安装"
        Write-Success "OpenClaw $ocVer 安装成功"
        return $true
    } else {
        Write-Error2 "openclaw 命令未找到，请检查 npm 全局路径是否在 PATH 中"
        Write-Info "可运行: npm bin -g  查看全局 bin 目录"
        return $false
    }
}

# ============================================================================
# 运行 openclaw onboard 向导
# ============================================================================

function Run-Onboard {
    Write-Step "运行 OpenClaw 配置向导（onboard）"

    Write-Host ""
    Write-Host "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "    接下来将运行 OpenClaw 官方交互式配置向导" -ForegroundColor Yellow
    Write-Host "  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  向导会引导你完成：" -ForegroundColor White
    Write-Host "    • 配置 AI 模型（Claude / OpenAI / Gemini 等）" -ForegroundColor White
    Write-Host "    • 生成 Gateway Token" -ForegroundColor White
    Write-Host "    • 安装守护进程（Windows 服务，开机自启）" -ForegroundColor White
    Write-Host "    • 启动 Gateway 服务" -ForegroundColor White
    Write-Host ""
    Write-Host "  提示：按照提示操作即可，完成后回到这里。" -ForegroundColor Yellow
    Write-Host ""

    if (-not (Ask-YesNo "准备好了，开始向导?")) {
        Write-Warning2 "已跳过配置向导"
        Write-Info "你可以随时手动运行: openclaw onboard --install-daemon"
        return
    }

    Write-Host ""
    Write-Info "正在启动 openclaw onboard --install-daemon ..."
    Write-Host ""

    try {
        openclaw onboard --install-daemon
        Write-Host ""
        Write-Success "onboard 配置向导完成！"
    } catch {
        Write-Host ""
        Write-Warning2 "onboard 向导退出（可能是用户跳过了部分步骤，这是正常的）"
        Write-Info "可随时重新运行: openclaw onboard --install-daemon"
    }
}

# ============================================================================
# 验证安装
# ============================================================================

function Verify-Installation {
    Write-Step "验证安装"

    if (-not (Test-CommandExists 'openclaw')) {
        Write-Warning2 "openclaw 命令未找到，请重新打开 PowerShell 后再试"
        Write-Info "尝试运行: openclaw --version"
        return
    }

    $ocVer = (openclaw --version 2>$null) ?? "未知版本"
    Write-Success "openclaw 命令已就绪（$ocVer）"

    # 等待 Gateway 端口就绪（最多 30 秒）
    Write-Info "等待 Gateway 启动（最多 30 秒）..."
    $waited = 0
    while ($waited -lt 30) {
        if (Test-PortListening $OPENCLAW_PORT) {
            Write-Success "Gateway 端口 $OPENCLAW_PORT 已监听"
            break
        }
        Start-Sleep -Seconds 2
        $waited += 2
    }

    if (-not (Test-PortListening $OPENCLAW_PORT)) {
        Write-Warning2 "Gateway 端口 $OPENCLAW_PORT 暂未监听（onboard 向导可能尚未完成）"
        Write-Info "向导完成后可运行: openclaw gateway status"
        return
    }

    # HTTP 健康检查
    Write-Info "进行 HTTP 健康检查..."
    for ($i = 0; $i -lt 5; $i++) {
        try {
            $resp = Invoke-WebRequest -Uri "http://localhost:$OPENCLAW_PORT/healthz" -UseBasicParsing -TimeoutSec 5
            if ($resp.StatusCode -eq 200) {
                Write-Success "Gateway 健康检查通过！"
                return
            }
        } catch { }
        Start-Sleep -Seconds 3
    }
    Write-Warning2 "健康检查未通过，服务可能仍在初始化"
    Write-Info "稍后手动检查: Invoke-WebRequest http://localhost:$OPENCLAW_PORT/healthz"
}

# ============================================================================
# 成功提示
# ============================================================================

function Show-Success {
    Write-Host ""
    Write-Host ""
    Write-Host "  ╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "  ║                                                           ║" -ForegroundColor Green
    Write-Host "  ║                  🎉  安装成功！ 🎉                        ║" -ForegroundColor Green
    Write-Host "  ║                                                           ║" -ForegroundColor Green
    Write-Host "  ╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Success "OpenClaw 已成功安装！"
    Write-Host ""
    Write-Host "  📍 访问 Gateway 控制台:" -ForegroundColor Cyan
    Write-Host "     http://localhost:$OPENCLAW_PORT" -ForegroundColor White
    Write-Host "     （如果向导已完成并启动了守护进程）" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  📚 常用命令:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "    • 查看版本"                                       -ForegroundColor Blue
    Write-Host "      openclaw --version"
    Write-Host ""
    Write-Host "    • 查看 Gateway 状态"                              -ForegroundColor Blue
    Write-Host "      openclaw gateway status"
    Write-Host ""
    Write-Host "    • 重新运行配置向导"                                -ForegroundColor Blue
    Write-Host "      openclaw onboard"
    Write-Host ""
    Write-Host "    • 连接聊天平台（以 Telegram 为例）"               -ForegroundColor Blue
    Write-Host "      openclaw channels add --channel telegram --token <BOT_TOKEN>"
    Write-Host ""
    Write-Host "    • 查看 Gateway 日志"                              -ForegroundColor Blue
    Write-Host "      openclaw gateway logs"
    Write-Host ""
    Write-Host "    • 停止/启动守护进程"                               -ForegroundColor Blue
    Write-Host "      openclaw daemon stop"
    Write-Host "      openclaw daemon start"
    Write-Host ""
    Write-Host "  🛠️  管理工具（Linux/macOS）:" -ForegroundColor Cyan
    Write-Host "     bash <(curl -fsSL https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/bin/openclaw-manager)"
    Write-Host "     （交互式菜单：状态、日志、渠道管理、诊断、卸载）"
    Write-Host ""
    Write-Host "  📖 完整文档:" -ForegroundColor Cyan
    Write-Host "     https://github.com/JFroson0610/openclaw-easy-deploy"
    Write-Host "     https://docs.openclaw.ai"
    Write-Host ""
    Write-Host "  ❓ 遇到问题?" -ForegroundColor Cyan
    Write-Host "     - 查看日志: $LOG_FILE"
    Write-Host "     - 提交 Issue: https://github.com/JFroson0610/openclaw-easy-deploy/issues"
    Write-Host ""
}

# ============================================================================
# 主函数
# ============================================================================

function Main {
    # 创建日志目录
    if (-not (Test-Path $INSTALL_DIR)) {
        New-Item -ItemType Directory -Path $INSTALL_DIR -Force | Out-Null
    }

    Show-Welcome

    # 检查管理员权限（推荐，npm 全局安装在某些环境需要）
    if (-not (Test-IsAdmin)) {
        Write-Warning2 "当前非管理员模式运行。如果安装失败，请右键 PowerShell 选择「以管理员身份运行」"
        Write-Host ""
    }

    Detect-System

    # ── 步骤 1：检查 / 安装 Node.js ─────────────────────────────────────────
    if (-not (Test-NodeVersion)) {
        if (Ask-YesNo "是否自动安装 Node.js 22?") {
            if (-not (Install-NodeWindows)) {
                Write-Error2 "Node.js 安装失败，请手动安装后重试"
                Write-Info "下载: https://nodejs.org/en/download"
                exit 1
            }
        } else {
            Write-Error2 "Node.js 22+ 是必须的，安装中止"
            exit 1
        }
    }

    # ── 步骤 2：安装 OpenClaw ────────────────────────────────────────────────
    if (-not (Install-OpenclawNpm)) {
        Write-Error2 "OpenClaw 安装失败，请查看日志: $LOG_FILE"
        exit 1
    }

    # ── 步骤 3：运行官方 onboard 向导 ────────────────────────────────────────
    Run-Onboard

    # ── 步骤 4：验证安装 ─────────────────────────────────────────────────────
    Verify-Installation

    # ── 步骤 5：显示成功信息 ─────────────────────────────────────────────────
    Show-Success

    Write-Log "安装完成"
}

# ============================================================================
# 脚本入口
# ============================================================================

Main

