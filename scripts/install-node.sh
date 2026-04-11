#!/usr/bin/env bash
# scripts/install-node.sh — Node.js 安装模块
# 依赖: scripts/common.sh, scripts/detect-env.sh（需要 $OS 变量）

install_node() {
    log_step "安装 Node.js 22"

    # macOS：优先 Homebrew
    if [[ "${OS:-}" == "macos" ]] && command_exists brew; then
        log_info "使用 Homebrew 安装 Node.js 22..."
        if brew install node@22 2>&1; then
            _setup_brew_node_path
            if check_node; then
                log_success "Node.js 22 安装成功（Homebrew）"
                return 0
            fi
        fi
        log_warning "Homebrew 安装失败，回退到 nvm..."
    fi

    # macOS / Linux：使用 nvm
    _install_via_nvm && return 0

    # 彻底失败
    log_error "Node.js 自动安装失败"
    log_info "请手动安装 Node.js 22："
    echo ""
    echo "  macOS:  brew install node@22"
    echo "  Linux:  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash"
    echo "          source ~/.nvm/nvm.sh && nvm install 22"
    echo "  通用:   https://nodejs.org/en/download/package-manager"
    echo ""
    return 1
}

# ── 内部函数 ──────────────────────────────────────────────────────────────────

_setup_brew_node_path() {
    # node@22 是 keg-only，需手动加入 PATH
    if [[ -d "/opt/homebrew/opt/node@22/bin" ]]; then
        export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
    elif [[ -d "/usr/local/opt/node@22/bin" ]]; then
        export PATH="/usr/local/opt/node@22/bin:$PATH"
    fi
}

_install_via_nvm() {
    log_info "使用 nvm 安装 Node.js 22..."

    # 加载已有 nvm
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    if [[ -s "$NVM_DIR/nvm.sh" ]]; then
        # shellcheck source=/dev/null
        \. "$NVM_DIR/nvm.sh"
    fi

    # 如果 nvm 还不存在，先安装
    if ! type nvm &>/dev/null; then
        log_info "正在安装 nvm..."
        if ! curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash; then
            log_error "nvm 安装失败，请检查网络连接"
            return 1
        fi
        # 安装后立即加载
        [[ -s "$NVM_DIR/nvm.sh" ]] && \. "$NVM_DIR/nvm.sh"
    fi

    if ! type nvm &>/dev/null; then
        log_error "nvm 加载失败"
        return 1
    fi

    log_info "正在安装 Node.js 22..."
    nvm install 22
    nvm use 22
    nvm alias default 22

    if check_node; then
        log_success "Node.js 22 安装成功（nvm）"
        return 0
    else
        log_error "nvm 安装后仍无法检测到 Node.js 22"
        return 1
    fi
}

