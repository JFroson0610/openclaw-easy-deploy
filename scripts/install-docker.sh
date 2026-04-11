#!/usr/bin/env bash
# scripts/install-docker.sh — Docker 安装模块（可选，仅 Docker 路线需要）
# 依赖: scripts/common.sh, scripts/detect-env.sh（需要 $OS 变量）
#
# 注意：NPM 主路线不调用此模块。
#       仅在用户明确选择 Docker 路线时使用。

install_docker() {
    log_step "安装 Docker（可选）"

    if [[ "${OS:-}" == "macos" ]]; then
        _install_docker_macos
    elif [[ "${OS:-}" == "linux" ]]; then
        _install_docker_linux
    else
        log_error "不支持的操作系统: $OS"
        return 1
    fi
}

# ── macOS ─────────────────────────────────────────────────────────────────────

_install_docker_macos() {
    echo ""
    log_info "macOS 需要手动安装 Docker Desktop："
    echo ""
    echo -e "  ${BLUE}1.${NC} 访问: https://www.docker.com/products/docker-desktop"
    echo -e "  ${BLUE}2.${NC} 点击 \"Download for Mac\""
    echo -e "     - Apple Silicon（M 系列芯片）选 Apple Silicon 版"
    echo -e "     - Intel 芯片选 Intel Chip 版"
    echo -e "  ${BLUE}3.${NC} 打开下载的 .dmg，拖拽 Docker 到 Applications"
    echo -e "  ${BLUE}4.${NC} 启动 Docker Desktop，等待菜单栏图标变为 ▶（约 30 秒）"
    echo ""

    if ask_yes_no "是否现在打开 Docker Desktop 下载页面?" "y"; then
        if command_exists open; then
            open "https://www.docker.com/products/docker-desktop"
        fi
    fi

    log_warning "安装 Docker Desktop 后请重新运行本脚本"
    return 1
}

# ── Linux ─────────────────────────────────────────────────────────────────────

_install_docker_linux() {
    log_info "正在通过官方脚本安装 Docker Engine..."

    if ! command_exists curl; then
        log_error "curl 未安装，无法下载 Docker 安装脚本"
        return 1
    fi

    if ! curl -fsSL https://get.docker.com | sudo sh; then
        log_error "Docker 安装失败，请查看上方错误信息"
        return 1
    fi

    # 将当前用户加入 docker 组（避免每次 sudo）
    sudo usermod -aG docker "$USER" 2>/dev/null || true

    # 启动并设置开机自启
    sudo systemctl enable docker 2>/dev/null || true
    sudo systemctl start  docker 2>/dev/null || true

    log_success "Docker 安装完成"
    log_warning "⚠ 需要重新登录才能免 sudo 使用 Docker"
    log_info "临时激活方式（当前会话）: newgrp docker"

    return 0
}

