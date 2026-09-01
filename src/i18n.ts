import type { Locale } from "./types.js";

const messages = {
  "zh-CN": {
    title: "OpenClaw 中文助手",
    communityNotice: "社区项目，非 OpenClaw 官方产品。",
    missingOpenClaw: "未找到 OpenClaw。请先运行官方安装器。",
    nodeUnsupported: "当前 Node.js 版本不受支持。",
    installOfficial: "安装官方 OpenClaw",
    runOnboard: "打开官方模型配置向导",
    runFeishu: "配置飞书",
    integrations: "推荐中国区入口：Qwen、Kimi、DeepSeek、MiniMax、飞书。密钥只会交给官方向导。",
    chooseSetup: "选择下一步：1) 模型配置  2) 飞书配置  3) 两者都配置  4) 稍后配置",
    confirmInstall: "是否调用 OpenClaw 官方安装器？",
    confirmUpgrade: "已完成更新预览和备份。是否继续升级？",
    confirmRepair: "已创建配置备份。是否调用官方 Doctor 修复？",
    repairImpact: "即将运行：openclaw doctor --fix。该命令可能修改 OpenClaw 配置；修复后会另行询问是否重启 Gateway。",
    confirmRestart: "是否安全重启 Gateway？",
    confirmSupport: "诊断包已设计为脱敏，但仍包含本机运行信息。是否在本地生成？",
    cancelled: "已取消，没有执行修改。",
    dryRun: "预览模式：不会执行修改。",
    checkVersionOk: "OpenClaw 命令可用。",
    checkVersionMissing: "OpenClaw 命令不可用。",
    checkOk: "检查通过。",
    checkWarning: "命令可用，但返回内容无法完全解析。",
    checkError: "命令执行失败。",
    updateHint: "请先运行官方安装器或升级到当前稳定版。",
    versionTooOld: "OpenClaw 版本低于最低兼容基线 2026.5.29。",
    rawOutput: "官方命令输出",
    backupOk: "备份已创建并通过验证。",
    backupFailed: "备份失败，后续修改已停止。",
    upgradeOk: "升级和升级后检查已完成。",
    upgradeFailed: "升级失败；已验证的备份仍保留。请按官方备份文档手动恢复，不会自动覆盖当前状态。",
    repairOk: "修复流程已完成。",
    supportOk: "诊断包已在本地生成；分享前请自行检查内容。",
    setupOk: "配置向导已完成。",
    mirrorOffer: "官方 npm 源不可用。是否仅为本次安装使用 registry.npmmirror.com？",
    menuPrompt: "选择功能：1) 设置  2) 检查  3) 升级  4) 备份  5) 修复  6) 支持包  7) 退出",
    invalidChoice: "无效选择。",
    help: "用法: openclaw-companion <menu|setup|check|upgrade|backup|repair|support> [选项]",
    privacy: "不会读取、保存或上传 API Key、Token、Cookie 或聊天内容。",
    unavailable: "当前 OpenClaw 版本不支持此能力。",
    completed: "完成",
  },
  en: {
    title: "OpenClaw Companion",
    communityNotice: "Community project; not an official OpenClaw product.",
    missingOpenClaw: "OpenClaw was not found. Install the official OpenClaw distribution first.",
    nodeUnsupported: "This Node.js version is not supported.",
    installOfficial: "Install official OpenClaw",
    runOnboard: "Open the official model onboarding wizard",
    runFeishu: "Configure Feishu",
    integrations: "Featured China-friendly integrations: Qwen, Kimi, DeepSeek, MiniMax, and Feishu. Credentials are handled only by official OpenClaw flows.",
    chooseSetup: "Choose: 1) model onboarding  2) Feishu  3) both  4) later",
    confirmInstall: "Run the official OpenClaw installer?",
    confirmUpgrade: "The update preview and verified backup are complete. Continue upgrading?",
    confirmRepair: "A configuration backup was created. Run the official Doctor repair?",
    repairImpact: "About to run: openclaw doctor --fix. It may modify OpenClaw configuration; a separate confirmation is required before restarting the Gateway.",
    confirmRestart: "Safely restart the Gateway?",
    confirmSupport: "The bundle is designed to be sanitized but still contains local runtime information. Generate it locally?",
    cancelled: "Cancelled; no changes were made.",
    dryRun: "Dry run: no changes will be made.",
    checkVersionOk: "The OpenClaw command is available.",
    checkVersionMissing: "The OpenClaw command is unavailable.",
    checkOk: "Check passed.",
    checkWarning: "The command ran, but its output could not be fully parsed.",
    checkError: "The command failed.",
    updateHint: "Run the official installer or update to the current stable release.",
    versionTooOld: "The OpenClaw version is older than the 2026.5.29 compatibility baseline.",
    rawOutput: "Official command output",
    backupOk: "A verified backup was created.",
    backupFailed: "Backup failed; subsequent changes were stopped.",
    upgradeOk: "Upgrade and post-upgrade checks completed.",
    upgradeFailed: "The upgrade failed; the verified backup remains available. Restore it manually using the official backup documentation; current state is not overwritten automatically.",
    repairOk: "Repair flow completed.",
    supportOk: "The diagnostics bundle was generated locally. Review it before sharing.",
    setupOk: "Setup flow completed.",
    mirrorOffer: "The official npm registry is unavailable. Use registry.npmmirror.com for this install only?",
    menuPrompt: "Choose: 1) setup  2) check  3) upgrade  4) backup  5) repair  6) support bundle  7) exit",
    invalidChoice: "Invalid choice.",
    help: "Usage: openclaw-companion <menu|setup|check|upgrade|backup|repair|support> [options]",
    privacy: "API keys, tokens, cookies, and chat content are never read, stored, or uploaded.",
    unavailable: "This capability is unavailable in the installed OpenClaw version.",
    completed: "Completed",
  },
} as const;

export type MessageKey = keyof (typeof messages)["en"];

export function resolveLocale(requested: "auto" | Locale, env = process.env): Locale {
  if (requested !== "auto") return requested;
  const configured = env.OPENCLAW_COMPANION_LANG;
  if (configured === "zh-CN" || configured === "en") return configured;
  const system = `${env.LC_ALL ?? ""} ${env.LC_MESSAGES ?? ""} ${env.LANG ?? ""}`.toLowerCase();
  return /zh|chinese/.test(system) ? "zh-CN" : "en";
}

export function translator(locale: Locale): (key: MessageKey) => string {
  return (key) => messages[locale][key] ?? messages.en[key];
}
