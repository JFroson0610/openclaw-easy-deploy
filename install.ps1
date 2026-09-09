# OpenClaw Companion v2 compatibility bootstrap for Windows.
# Existing URL intentionally preserved for v1 users.

[CmdletBinding()]
param(
    [string]$Lang = "auto"
)

$ErrorActionPreference = "Stop"
$OfficialInstaller = "https://openclaw.ai/install.ps1"
$CompanionSpec = if ($env:OPENCLAW_COMPANION_SPEC) { $env:OPENCLAW_COMPANION_SPEC } else { "openclaw-companion@latest" }
$OfficialRegistry = "https://registry.npmjs.org"
$ChinaRegistry = "https://registry.npmmirror.com"

function Test-Command([string]$Name) {
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

function Confirm-Action([string]$Prompt) {
    $answer = Read-Host "$Prompt [y/N]"
    return $answer -match '^(y|yes|是)$'
}

$isChinese = $Lang -eq "zh-CN" -or ($Lang -eq "auto" -and [System.Globalization.CultureInfo]::CurrentUICulture.Name -like "zh*")
if ($isChinese) {
    Write-Host "OpenClaw Easy Deploy 已升级为 OpenClaw Companion / OpenClaw 中文助手。" -ForegroundColor Cyan
    Write-Host "社区项目，非 OpenClaw 官方产品；密钥只由官方 OpenClaw 向导处理。"
} else {
    Write-Host "OpenClaw Easy Deploy is now OpenClaw Companion." -ForegroundColor Cyan
    Write-Host "Community project, not an official OpenClaw product. Credentials are handled only by official OpenClaw flows."
}

if (-not (Test-Command "openclaw")) {
    $prompt = if ($isChinese) { "未检测到 OpenClaw。是否调用官方安装器？" } else { "OpenClaw was not found. Run the official installer?" }
    if (-not (Confirm-Action $prompt)) {
        Write-Host "iwr -useb $OfficialInstaller | iex"
        exit 1
    }
    & ([scriptblock]::Create((Invoke-WebRequest -UseBasicParsing $OfficialInstaller).Content)) -NoOnboard
}

if (-not (Test-Command "npm")) {
    throw "npm was not found after the official installation. Open a new PowerShell window and rerun this script."
}

$registry = $OfficialRegistry
npm ping --registry $OfficialRegistry *> $null
if ($LASTEXITCODE -ne 0) {
    $prompt = if ($isChinese) { "官方 npm 源不可用。是否仅为本次安装使用 npmmirror？" } else { "The official npm registry is unavailable. Use npmmirror for this install only?" }
    if (Confirm-Action $prompt) {
        $registry = $ChinaRegistry
    } else {
        throw "npm registry unavailable; no persistent npm settings were changed."
    }
}

$previousRegistry = $env:npm_config_registry
try {
    $env:npm_config_registry = $registry
    npm install -g $CompanionSpec
    if ($LASTEXITCODE -eq 0 -and (Test-Command "openclaw-companion")) {
        openclaw-companion setup --lang $Lang
        exit $LASTEXITCODE
    }
    Write-Warning "Global installation failed; using a one-time npx launch."
    npx -y $CompanionSpec setup --lang $Lang
    exit $LASTEXITCODE
} finally {
    $env:npm_config_registry = $previousRegistry
}
