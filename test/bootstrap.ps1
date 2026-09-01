$ErrorActionPreference = "Stop"
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("openclaw-companion-test-" + [Guid]::NewGuid().ToString("N"))
$mockBin = Join-Path $testRoot "bin"
$mockLog = Join-Path $testRoot "commands.log"
New-Item -ItemType Directory -Path $mockBin -Force | Out-Null
New-Item -ItemType File -Path $mockLog -Force | Out-Null

try {
    Set-Content -Path (Join-Path $mockBin "openclaw.cmd") -Value "@echo off`r`nexit /b 0`r`n" -Encoding Ascii
    Set-Content -Path (Join-Path $mockBin "npm.cmd") -Value "@echo off`r`necho npm %*>>`"%MOCK_LOG%`"`r`nexit /b 0`r`n" -Encoding Ascii
    Set-Content -Path (Join-Path $mockBin "openclaw-companion.cmd") -Value "@echo off`r`necho openclaw-companion %*>>`"%MOCK_LOG%`"`r`nexit /b 0`r`n" -Encoding Ascii
    Set-Content -Path (Join-Path $mockBin "npx.cmd") -Value "@echo off`r`necho npx %*>>`"%MOCK_LOG%`"`r`nexit /b 0`r`n" -Encoding Ascii

    $previousPath = $env:PATH
    $env:PATH = "$mockBin;$previousPath"
    $env:MOCK_LOG = $mockLog
    $env:OPENCLAW_COMPANION_SPEC = "openclaw-companion@next"

    & (Join-Path $PSScriptRoot "..\install.ps1") -Lang en | Out-Null
    $commands = Get-Content $mockLog -Raw
    if ($commands -notmatch [regex]::Escape("npm ping --registry https://registry.npmjs.org")) { throw "npm ping was not called" }
    if ($commands -notmatch [regex]::Escape("npm install -g openclaw-companion@next")) { throw "npm install was not called" }
    if ($commands -notmatch [regex]::Escape("openclaw-companion setup --lang en")) { throw "Companion setup was not launched" }
    if ($commands -match "npm config set") { throw "bootstrap persisted npm configuration" }

    Write-Host "PowerShell bootstrap compatibility checks passed"
} finally {
    if ($previousPath) { $env:PATH = $previousPath }
    Remove-Item -LiteralPath $testRoot -Recurse -Force
}
