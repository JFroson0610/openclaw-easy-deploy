#!/usr/bin/env bash
# scripts/verify.sh — 安装验证与成功提示模块
# 依赖: scripts/common.sh（需要 $OPENCLAW_PORT、$LOG_FILE）

# ============================================================================
# 验证安装结果
# ============================================================================

verify_installation() {
    log_step "验证安装"

    # 1. 检查 openclaw 命令
    if ! command_exists openclaw; then
        log_warning "openclaw 命令未找到（PATH 可能尚未生效）"
        log_info "请重新打开终端后运行: openclaw --version"
        return 0
    fi

    local oc_ver
    oc_ver=$(openclaw --version 2>/dev/null || echo "已安装")
    log_success "openclaw 命令就绪（$oc_ver）"

    # 2. 等待 Gateway 端口就绪（最多 30 秒）
    log_info "等待 Gateway 启动（最多 30 秒）..."
    local waited=0
    while [[ $waited -lt 30 ]]; do
        if check_port "${OPENCLAW_PORT:-18789}"; then
            log_success "Gateway 端口 ${OPENCLAW_PORT:-18789} 已监听"
            break
        fi
        sleep 2
        waited=$((waited + 2))
    done

    if ! check_port "${OPENCLAW_PORT:-18789}"; then
        log_warning "Gateway 端口 ${OPENCLAW_PORT:-18789} 暂未监听"
        log_info "这是正常的——onboard 向导可能尚未完成守护进程启动"
        log_info "向导完成后运行: openclaw gateway status"
        return 0
    fi

    # 3. HTTP 健康检查
    log_info "进行 HTTP 健康检查..."
    local retry=0
    while [[ $retry -lt 5 ]]; do
        if curl -fs "http://localhost:${OPENCLAW_PORT:-18789}/healthz" >/dev/null 2>&1; then
            log_success "Gateway 健康检查通过！"
            return 0
        fi
        retry=$((retry + 1))
        sleep 3
    done

    log_warning "健康检查未通过，服务可能仍在初始化"
    log_info "稍后手动检查: curl http://localhost:${OPENCLAW_PORT:-18789}/healthz"
    return 0
}

# ============================================================================
# 成功提示与常用命令清单
# ============================================================================

show_success() {
    local port="${OPENCLAW_PORT:-18789}"
    local log_file="${LOG_FILE:-~/.openclaw/install.log}"

    echo ""
    echo ""
    cat <<EOF
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║                   🎉  安装成功！ 🎉                           ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝

EOF

    echo -e "${GREEN}✅ OpenClaw 已成功安装！${NC}"
    echo ""
    echo -e "${CYAN}📍 访问 Gateway 控制台:${NC}"
    echo -e "   http://localhost:$port"
    echo -e "   ${YELLOW}（向导完成并启动守护进程后可访问）${NC}"
    echo ""
    echo -e "${CYAN}📚 常用命令:${NC}"
    echo ""
    echo -e "   ${BLUE}• 查看版本${NC}              openclaw --version"
    echo -e "   ${BLUE}• Gateway 状态${NC}          openclaw gateway status"
    echo -e "   ${BLUE}• Gateway 日志${NC}          openclaw gateway logs"
    echo -e "   ${BLUE}• 重新运行配置向导${NC}      openclaw onboard"
    echo -e "   ${BLUE}• 停止守护进程${NC}          openclaw daemon stop"
    echo -e "   ${BLUE}• 启动守护进程${NC}          openclaw daemon start"
    echo -e "   ${BLUE}• 更新到最新版${NC}          npm update -g openclaw"
    echo ""
    echo -e "${CYAN}🔑 连接聊天平台:${NC}"
    echo -e "   openclaw channels add --channel telegram --token <BOT_TOKEN>"
    echo -e "   openclaw channels add --channel discord  --token <BOT_TOKEN>"
    echo -e "   openclaw channels login --channel whatsapp"
    echo ""
    echo -e "${CYAN}🛠️  管理工具（openclaw-manager）:${NC}"
    echo -e "   交互式菜单管理 OpenClaw，包含状态查看、日志、渠道管理、诊断、卸载等"
    echo -e "   ${BLUE}bash <(curl -fsSL https://raw.githubusercontent.com/JFroson0610/openclaw-easy-deploy/main/bin/openclaw-manager)${NC}"
    echo ""
    echo -e "${CYAN}📖 文档与帮助:${NC}"
    echo -e "   项目主页: https://github.com/JFroson0610/openclaw-easy-deploy"
    echo -e "   官方文档: https://docs.openclaw.ai"
    echo -e "   安装日志: $log_file"
    echo -e "   提交 Issue: https://github.com/JFroson0610/openclaw-easy-deploy/issues"
    echo ""
}

