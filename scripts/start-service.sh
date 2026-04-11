#!/usr/bin/env bash
# scripts/start-service.sh — 服务启动模块（Docker 路线，高级用户可选）
# 依赖: scripts/common.sh, scripts/detect-env.sh（需要 $OS、$INSTALL_DIR）
#
# NPM 主路线不调用此模块。
# Docker 路线：下载官方 docker-compose.yml + docker-setup.sh，使用 GHCR 镜像启动。

start_openclaw_docker() {
    log_step "启动 OpenClaw（Docker 路线）"

    mkdir -p "${INSTALL_DIR:?INSTALL_DIR 未设置}"
    cd "$INSTALL_DIR" || { log_error "无法进入目录: $INSTALL_DIR"; return 1; }

    # ── 下载官方配置文件 ──────────────────────────────────────────────────────

    log_info "下载 docker-compose.yml..."
    if ! curl -fsSL \
        "https://raw.githubusercontent.com/openclaw/openclaw/main/docker-compose.yml" \
        -o "$INSTALL_DIR/docker-compose.yml"; then
        log_error "下载 docker-compose.yml 失败，请检查网络连接"
        return 1
    fi

    log_info "下载 docker-setup.sh..."
    if ! curl -fsSL \
        "https://raw.githubusercontent.com/openclaw/openclaw/main/docker-setup.sh" \
        -o "$INSTALL_DIR/docker-setup.sh"; then
        log_error "下载 docker-setup.sh 失败，请检查网络连接"
        return 1
    fi
    chmod +x "$INSTALL_DIR/docker-setup.sh"
    log_success "官方配置文件下载完成"

    # ── 设置镜像并启动 ────────────────────────────────────────────────────────

    # 使用 GHCR 公开镜像，避免需要本地 docker build
    export OPENCLAW_IMAGE="${OPENCLAW_IMAGE:-ghcr.io/openclaw/openclaw:latest}"
    log_info "使用镜像: $OPENCLAW_IMAGE"
    log_info "正在运行 docker-setup.sh（将拉取镜像并启动配置向导）..."
    echo ""

    if "$INSTALL_DIR/docker-setup.sh"; then
        log_success "OpenClaw Docker 服务启动成功"
        return 0
    else
        log_error "docker-setup.sh 运行失败，请查看日志: ${LOG_FILE:-~/.openclaw/install.log}"
        return 1
    fi
}

