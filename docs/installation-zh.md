# OpenClaw Companion 中文安装指南

> `openclaw-companion@2.0.0-beta.1` 已发布到 npm 的 `next` 渠道。正式版仍需完成至少 14 天 Beta 观察，并解决所有 P0/P1 安全或安装问题。

## 前置条件

- Windows 10/11、macOS 13+，或 Ubuntu 22.04/24.04、Debian 12。
- 已安装官方 OpenClaw；若未安装，兼容启动器会在确认后调用官方安装器。
- Node.js 版本需符合 OpenClaw 官方要求。

## 当前 Beta 推荐安装

```bash
npm install -g openclaw-companion@next
openclaw-companion setup --lang zh-CN
```

npm 会为全新包的首次发布自动建立 `latest` 标签，因此不带标签目前也会安装这个 Beta。测试用户仍应明确使用 `@next`；正式版完成观察期后才推广无标签安装。

如需从源码验证，请克隆仓库，运行 `pnpm install --frozen-lockfile && pnpm build`，再使用 `node dist/cli.js`。

安装程序不会要求你把 API Key 输入给 OpenClaw Companion。模型和渠道认证均由官方 `openclaw onboard`、`openclaw configure` 和 `openclaw channels login` 完成。

## 中国区入口

设置向导重点提示 Qwen、Kimi、DeepSeek、MiniMax 和飞书。模型目录与参数变化很快，CLI 不写死密钥或直接修改配置，而是将控制权交给当前安装的 OpenClaw 官方向导。

Qwen、Moonshot/Kimi 和 DeepSeek 在当前 OpenClaw 中由官方外部 provider 插件提供；是否需要安装插件及可用认证选项，以对应的官方 provider 文档和当前 `openclaw onboard` 向导为准。MiniMax 与飞书同样由官方流程完成配置。

飞书要求当前 OpenClaw 支持官方 Feishu 插件：

```bash
openclaw channels login --channel feishu
```

## 网络失败与镜像

默认始终使用 `https://registry.npmjs.org`。只有官方 npm 源检测失败且用户明确确认时，启动器才为当前 `npm install` / `npx` 进程设置 `https://registry.npmmirror.com`。它不会运行 `npm config set`，也不会更改用户的永久 npm 配置。

代码和官方安装器不使用第三方 GitHub 镜像。若 `openclaw.ai` 或 GitHub 无法访问，脚本会停止并显示手动步骤。

## 安全升级

```bash
openclaw-companion upgrade --dry-run
openclaw-companion upgrade
```

正式升级会先调用官方更新预览，再创建并验证备份。备份失败时不会继续升级；升级失败时不会自动恢复或覆盖现有数据。

## 诊断支持

```bash
openclaw-companion check --deep
openclaw-companion support --output ./support
```

支持包使用官方脱敏导出能力，只写入本地。即使官方已经执行脱敏，分享前仍应自行检查压缩包内容。

## 常见退出码

- `0`：流程完成，检查中没有 error。
- `1`：检查完成但发现 error；使用 `--strict` 时 warning 也返回 `1`。
- `2`：参数、Node.js 环境或官方命令无法启动。
