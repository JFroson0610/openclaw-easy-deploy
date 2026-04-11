#!/usr/bin/env bash
# scripts/configure.sh — OpenClaw 安装与配置模块
# 依赖: scripts/common.sh

# ============================================================================
# 通过 npm 全局安装 OpenClaw
# ============================================================================

install_openclaw_npm() {
    log_step "安装 OpenClaw（npm install -g）"

    log_info "正在通过 npm 全局安装最新版 OpenClaw..."
    echo ""

    # 尝试直接安装
    if npm install -g openclaw@latest 2>&1; then
        _verify_openclaw_cmd && return 0
    fi

    # 权限不足时尝试 sudo
    log_warning "npm 全局安装失败，尝试使用 sudo（需要输入系统密码）..."
    log_info "提示：输入密码时不会显示字符，这是正常的"
    if sudo npm install -g openclaw@latest; then
        _verify_openclaw_cmd && return 0
    fi

    log_error "OpenClaw 安装失败"
    log_info "请手动运行: npm install -g openclaw@latest"
    return 1
}

_verify_openclaw_cmd() {
    # npm global bin 可能不在 PATH，尝试补全
    if ! command_exists openclaw; then
        local npm_bin
        npm_bin=$(npm bin -g 2>/dev/null || true)
        if [[ -n "$npm_bin" && -f "$npm_bin/openclaw" ]]; then
            export PATH="$npm_bin:$PATH"
        fi
    fi

    if command_exists openclaw; then
        local oc_ver
        oc_ver=$(openclaw --version 2>/dev/null || echo "已安装")
        log_success "OpenClaw $oc_ver 安装成功"
        return 0
    else
        log_error "openclaw 命令未找到，请检查 npm 全局路径是否在 PATH 中"
        log_info "运行 'npm bin -g' 查看全局 bin 目录，并将其添加到 PATH"
        return 1
    fi
}

# ============================================================================
# 运行官方 openclaw onboard 交互式向导
# ============================================================================

run_onboard() {
    log_step "运行 OpenClaw 配置向导（onboard）"

    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}  接下来将运行 OpenClaw 官方交互式配置向导${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "  向导会引导你完成："
    echo -e "  ${BLUE}•${NC} 配置 AI 模型（Claude / OpenAI / Gemini 等）"
    echo -e "  ${BLUE}•${NC} 生成安全的 Gateway Token"
    echo -e "  ${BLUE}•${NC} 安装后台守护进程（开机自启）"
    echo -e "  ${BLUE}•${NC} 启动 Gateway 服务"
    echo ""
    echo -e "  ${YELLOW}提示：${NC}按照向导提示操作即可，所有配置均由官方向导处理。"
    echo ""

    if ! ask_yes_no "准备好了，开始向导?" "y"; then
        log_warning "已跳过配置向导"
        log_info "随时可手动运行: openclaw onboard --install-daemon"
        return 0
    fi

    echo ""
    log_info "正在启动 openclaw onboard --install-daemon ..."
    echo ""

    if openclaw onboard --install-daemon; then
        echo ""
        log_success "onboard 配置向导完成！"
        return 0
    else
        local exit_code=$?
        echo ""
        log_warning "onboard 向导退出（退出码: $exit_code）"
        log_info "如果只是手动跳过了部分步骤，这是正常的"
        log_info "随时可重新运行: openclaw onboard --install-daemon"
        # 不视为失败——用户可能故意跳过
        return 0
    fi
}

