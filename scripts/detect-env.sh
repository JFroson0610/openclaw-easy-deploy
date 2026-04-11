#!/usr/bin/env bash
# scripts/detect-env.sh — 系统环境检测模块
# 依赖: scripts/common.sh

# ============================================================================
# 检测操作系统和架构
# ============================================================================

detect_os() {
    log_step "检测系统环境"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        MACOS_VERSION=$(sw_vers -productVersion)
        log_info "操作系统: macOS $MACOS_VERSION"

        ARCH=$(uname -m)
        if [[ "$ARCH" == "arm64" ]]; then
            log_info "CPU 架构: Apple Silicon (M1/M2/M3/M4)"
        else
            log_info "CPU 架构: Intel x86_64"
        fi

    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        log_info "操作系统: Linux"

        if [[ -f /etc/os-release ]]; then
            # shellcheck source=/dev/null
            . /etc/os-release
            DISTRO="${ID:-unknown}"
            log_info "发行版: ${NAME:-Linux} ${VERSION:-}"
        else
            DISTRO="unknown"
            log_warning "无法检测 Linux 发行版"
        fi

        ARCH=$(uname -m)
        log_info "CPU 架构: $ARCH"
    else
        log_error "不支持的操作系统: $OSTYPE（仅支持 macOS / Linux）"
        exit 1
    fi

    # 检查磁盘空间
    _check_disk_space

    log_success "系统环境检测完成（OS=$OS, ARCH=$ARCH）"
}

_check_disk_space() {
    local available_space
    if [[ "$OS" == "macos" ]]; then
        available_space=$(df -g "$HOME" | awk 'NR==2 {print $4}')
    else
        available_space=$(df -BG "$HOME" | awk 'NR==2 {print $4}' | sed 's/G//')
    fi

    log_info "可用磁盘空间: ${available_space}GB"

    if [[ "${available_space:-0}" -lt 1 ]]; then
        log_error "磁盘空间不足！至少需要 1GB 可用空间（当前: ${available_space}GB）"
        exit 1
    fi
}

# ============================================================================
# 检测 Node.js
# ============================================================================

check_node() {
    log_step "检测 Node.js"

    if ! command_exists node; then
        log_warning "Node.js 未安装"
        return 1
    fi

    NODE_VERSION=$(node -v | sed 's/v//')
    NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
    log_info "已安装 Node.js: v$NODE_VERSION"

    if [[ "$NODE_MAJOR" -ge 22 ]]; then
        log_success "Node.js 版本满足要求 (≥22)"
        return 0
    else
        log_warning "Node.js 版本过低（当前: v$NODE_VERSION，需要: ≥22）"
        return 1
    fi
}

# ============================================================================
# 检测 Docker（可选，仅 Docker 路线需要）
# ============================================================================

check_docker() {
    log_step "检测 Docker"

    if ! command_exists docker; then
        log_warning "Docker 未安装"
        return 1
    fi

    if ! docker info &>/dev/null; then
        log_warning "Docker 已安装但未运行"
        [[ "$OS" == "macos" ]] && log_info "请启动 Docker Desktop"
        return 1
    fi

    DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    log_info "Docker 版本: $DOCKER_VERSION"

    if docker compose version &>/dev/null; then
        COMPOSE_VERSION=$(docker compose version --short 2>/dev/null || echo "已安装")
        log_info "Docker Compose 版本: $COMPOSE_VERSION"
        log_success "Docker 环境正常"
        return 0
    else
        log_warning "Docker Compose V2 未安装（需要 'docker compose' 命令）"
        return 1
    fi
}

