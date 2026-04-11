#!/usr/bin/env bash
#
# OpenClaw Easy Deploy - 一键安装脚本（主控入口）
# 适用于 macOS 和 Linux
#
# 使用方法:
#   curl -fsSL https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/install.sh | bash
#
# 或者下载后执行:
#   chmod +x install.sh && ./install.sh
#
# 模块结构:
#   install.sh              ← 本文件（主控入口，约 160 行）
#   scripts/common.sh           颜色、日志、工具函数
#   scripts/detect-env.sh       OS/架构/Node/Docker 检测
#   scripts/install-node.sh     Node.js 安装（Homebrew / nvm）
#   scripts/install-docker.sh   Docker 安装（可选，Docker 路线）
#   scripts/configure.sh        npm 安装 openclaw + onboard 向导
#   scripts/start-service.sh    Docker 路线服务启动（高级用户）
#   scripts/verify.sh           验证安装 + 成功提示
#

set -euo pipefail

# ============================================================================
# 全局变量（子模块可读取）
# ============================================================================

VERSION="1.0.0"
INSTALL_DIR="$HOME/.openclaw"
LOG_FILE="$INSTALL_DIR/install.log"
OPENCLAW_PORT="${OPENCLAW_PORT:-18789}"
OPENCLAW_BRIDGE_PORT="${OPENCLAW_BRIDGE_PORT:-18790}"

# OS / ARCH 由 detect-env.sh 中的 detect_os() 赋值
OS=""
ARCH=""

# ============================================================================
# 加载子模块
# ============================================================================

# 计算脚本所在目录（兼容 curl | bash 直接运行的情况）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo ".")"
SCRIPTS_DIR="$SCRIPT_DIR/scripts"

_source_module() {
    local module="$1"
    local path="$SCRIPTS_DIR/$module"

    if [[ -f "$path" ]]; then
        # shellcheck source=/dev/null
        . "$path"
    else
        # curl | bash 场景：子脚本不在本地，从 GitHub 实时下载并 eval
        local url="https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/scripts/$module"
        local content
        content=$(curl -fsSL "$url" 2>/dev/null) || {
            echo "❌ 无法加载模块: $module（$url）" >&2
            exit 1
        }
        eval "$content"
    fi
}

_source_module "common.sh"
_source_module "detect-env.sh"
_source_module "install-node.sh"
_source_module "install-docker.sh"
_source_module "configure.sh"
_source_module "start-service.sh"
_source_module "verify.sh"

# ============================================================================
# 欢迎界面
# ============================================================================

show_welcome() {
    clear
    cat << "EOF"

    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║       🦞  OpenClaw Easy Deploy  🦞                            ║
    ║                                                               ║
    ║       让 OpenClaw 部署变得简单 - 零技术门槛，一键安装           ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝

EOF
    echo -e "  版本: ${GREEN}v${VERSION}${NC}"
    echo -e "  项目: ${BLUE}https://github.com/JFroson0610/openclaw-easy-deploy${NC}"
    echo ""
    echo -e "  ${YELLOW}⚠️  安装前请准备：${NC}AI 平台的 API Key（如 OpenAI / Claude / Gemini）"
    echo -e "  ${BLUE}📖 获取指南：${NC}https://github.com/JFroson0610/openclaw-easy-deploy/blob/main/docs/api-keys-zh.md"
    echo ""
}

# ============================================================================
# 错误处理
# ============================================================================

cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "安装中止，退出码: $exit_code"
        log_info  "详细日志: $LOG_FILE"
        echo ""
        log_info  "遇到问题？提交 Issue: https://github.com/JFroson0610/openclaw-easy-deploy/issues"
    fi
}

trap cleanup EXIT

# ============================================================================
# 主流程（5 步）
# ============================================================================

main() {
    mkdir -p "$(dirname "$LOG_FILE")"

    show_welcome
    detect_os   # → 设置 $OS / $ARCH，检查磁盘空间

    # ── 步骤 1：Node.js 22+ ───────────────────────────────────────────────────
    if ! check_node; then
        log_warning "未检测到 Node.js 22+"
        if ask_yes_no "是否自动安装 Node.js 22?" "y"; then
            install_node || {
                log_error "Node.js 安装失败，请手动安装后重试"
                log_info  "参考: https://nodejs.org/en/download/package-manager"
                exit 1
            }
        else
            log_error "Node.js 22+ 是必须的，安装中止"
            exit 1
        fi
    fi

    # ── 步骤 2：npm install -g openclaw ───────────────────────────────────────
    install_openclaw_npm || {
        log_error "OpenClaw 安装失败，请查看日志: $LOG_FILE"
        exit 1
    }

    # ── 步骤 3：openclaw onboard 官方向导 ─────────────────────────────────────
    run_onboard

    # ── 步骤 4：验证安装 ──────────────────────────────────────────────────────
    verify_installation

    # ── 步骤 5：成功提示 ──────────────────────────────────────────────────────
    show_success

    log_success "全部完成！"
}

# ============================================================================
# 入口
# ============================================================================

main "$@"

