#!/usr/bin/env bash
# scripts/common.sh — 通用函数库
# 由 install.sh 和其他子脚本 source 引入
# 不可直接执行

# ============================================================================
# 颜色定义
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# ============================================================================
# 日志函数
# ============================================================================

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" >> "${LOG_FILE:-/tmp/openclaw-install.log}"
}

log_info() {
    echo -e "${BLUE}ℹ${NC} $*"
    log "INFO: $*"
}

log_success() {
    echo -e "${GREEN}✅${NC} $*"
    log "SUCCESS: $*"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $*"
    log "WARNING: $*"
}

log_error() {
    echo -e "${RED}❌${NC} $*" >&2
    log "ERROR: $*"
}

log_step() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$*${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "STEP: $*"
}

# ============================================================================
# 工具函数
# ============================================================================

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 交互式 Y/N 确认（默认值由第二参数指定，"y" 或 "n"）
ask_yes_no() {
    local prompt="$1"
    local default="${2:-n}"
    local answer

    if [[ "$default" == "y" ]]; then
        prompt="$prompt (Y/n)"
    else
        prompt="$prompt (y/N)"
    fi

    read -r -p "$prompt: " answer
    answer="${answer:-$default}"

    case "$answer" in
        [Yy]|[Yy][Ee][Ss]) return 0 ;;
        *) return 1 ;;
    esac
}

# 带默认值的文本输入
ask_input() {
    local prompt="$1"
    local default="${2:-}"
    local value

    if [[ -n "$default" ]]; then
        read -r -p "$prompt [$default]: " value
        echo "${value:-$default}"
    else
        read -r -p "$prompt: " value
        echo "$value"
    fi
}

# 生成随机 hex token
generate_token() {
    if command_exists openssl; then
        openssl rand -hex 32
    elif command_exists python3; then
        python3 -c "import secrets; print(secrets.token_hex(32))"
    else
        LC_ALL=C tr -dc 'a-f0-9' < /dev/urandom | fold -w 64 | head -n 1
    fi
}

# 检查端口是否有进程在监听（返回 0 = 有进程监听）
check_port() {
    local port="$1"
    if command_exists lsof; then
        lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -an | grep -q ":$port .*LISTEN"
    else
        return 1
    fi
}

# 检查网络连通性（访问 GitHub）
check_network() {
    curl -fs --max-time 5 https://github.com >/dev/null 2>&1
}

