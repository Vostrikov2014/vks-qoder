# This script is executed by Gradle to start the React packager for Debug
# targets on Windows — the PowerShell twin of run-packager.sh (there is no
# bash in a stock Windows environment). It performs the same steps:
#   1. exports RCT_METRO_PORT for the React Native CLI;
#   2. runs `adb reverse` so the device can reach Metro on the host port;
#   3. leaves an already running Metro alone (validating it via /status);
#   4. otherwise starts Metro in a separate window and returns immediately,
#      so the Gradle build does not block on the long-running server.

$ErrorActionPreference = 'Continue'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# android/scripts -> android -> the React Native project root.
$projectRoot = Split-Path -Parent (Split-Path -Parent $scriptDir)

$metroPort = if ($env:RCT_METRO_PORT) { $env:RCT_METRO_PORT } else { '8081' }
$env:RCT_METRO_PORT = $metroPort

# The React Native CLI reads the port from this file for every npm invocation.
$packagerEnvFile = Join-Path $projectRoot 'node_modules\react-native\scripts\.packager.env'
Set-Content -Path $packagerEnvFile -Value "export RCT_METRO_PORT=$metroPort" -Encoding ASCII

# adb from PATH, falling back to the default Android SDK location.
$adbExe = $null
$adbCommand = Get-Command 'adb' -ErrorAction SilentlyContinue

if ($adbCommand) {
    $adbExe = $adbCommand.Source
} else {
    $adbCandidate = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'

    if (Test-Path $adbCandidate) {
        $adbExe = $adbCandidate
    }
}

if ($adbExe) {
    & $adbExe reverse "tcp:$metroPort" "tcp:$metroPort" | Out-Null
} else {
    Write-Host 'adb was not found: skipping the port reverse (install platform-tools or add adb to PATH).'
}

# Is something listening on the Metro port already?
$packagerRunning = $false
$listening = Get-NetTCPConnection -LocalPort $metroPort -State Listen -ErrorAction SilentlyContinue

if ($listening) {
    try {
        $content = (Invoke-WebRequest -Uri "http://localhost:$metroPort/status" -UseBasicParsing -TimeoutSec 5).Content

        # Windows PowerShell 5.1 hands out raw bytes for some content types
        # instead of a string, so both shapes are normalized here.
        $status = if ($content -is [byte[]]) { [System.Text.Encoding]::UTF8.GetString($content) } else { [string]$content }

        if ($status -match 'packager-status:running') {
            $packagerRunning = $true
        }
    } catch {
        # The port is taken by something that is not Metro: fall through to the error below.
    }

    if (-not $packagerRunning) {
        Write-Host "Port $metroPort is already in use, packager is either not running or not running correctly"
        exit 2
    }
}

if ($packagerRunning) {
    Write-Host "The React packager is already running on port $metroPort."
    exit 0
}

# Start Metro in its own window; the build continues as soon as the server is up.
Start-Process -FilePath 'powershell.exe' -ArgumentList @(
    '-NoExit', '-NoProfile', '-Command', "Set-Location '$projectRoot'; npx react-native start"
)

Write-Host "The React packager is starting in a new window on port $metroPort."
