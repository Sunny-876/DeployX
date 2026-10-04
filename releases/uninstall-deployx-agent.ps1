<#
.SYNOPSIS
    DeployX Agent Complete Cleanup and Uninstall Script for Windows
.DESCRIPTION
    Stops running DeployX Agent processes, executes uninstaller, deletes files, shortcuts, and resets state.
#>

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "                DeployX Agent Cleanup & Uninstall Tool" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Stop running Agent processes
Write-Host "[1/5] Stopping all active DeployX Agent processes..." -ForegroundColor Yellow
Get-Process -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -like "*DeployX Agent*" -or $_.ProcessName -eq "cloudflared"
} | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Write-Host "      Terminated process: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray
    } catch {}
}
Start-Sleep -Seconds 1

# 2. Run built-in uninstaller
$appDir = Join-Path $env:LOCALAPPDATA "Programs\DeployX Agent"
$uninstaller = Join-Path $appDir "unins000.exe"

Write-Host "[2/5] Running official uninstaller..." -ForegroundColor Yellow
if (Test-Path $uninstaller) {
    Write-Host "      Running uninstaller silently..." -ForegroundColor Gray
    Start-Process -FilePath $uninstaller -ArgumentList "/VERYSILENT /SUPPRESSMSGBOXES /NORESTART" -Wait -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
} else {
    Write-Host "      No registered unins000.exe found, proceeding to directory cleanup." -ForegroundColor Gray
}

# 3. Clean files
Write-Host "[3/5] Cleaning remaining application files..." -ForegroundColor Yellow
if (Test-Path $appDir) {
    Remove-Item -Path $appDir -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "      Application directory cleaned." -ForegroundColor Gray

# 4. Remove shortcuts
Write-Host "[4/5] Removing shortcuts..." -ForegroundColor Yellow
$shortcuts = @(
    Join-Path ([Environment]::GetFolderPath("Desktop")) "DeployX Agent.lnk",
    Join-Path ([Environment]::GetFolderPath("CommonDesktopDirectory")) "DeployX Agent.lnk",
    Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\DeployX Agent"
)
foreach ($sc in $shortcuts) {
    if (Test-Path $sc) {
        Remove-Item -Path $sc -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "      Shortcuts removed." -ForegroundColor Gray

# 5. Reset local state
Write-Host "[5/5] Resetting DeployX pairing and local state..." -ForegroundColor Yellow
$dataDirs = @(
    Join-Path $env:LOCALAPPDATA "DeployX",
    Join-Path $env:APPDATA "DeployX"
)
foreach ($dir in $dataDirs) {
    if (Test-Path $dir) {
        Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Remove-Item -Path "HKCU:\Software\DeployX" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "      Local state reset." -ForegroundColor Gray

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  [SUCCESS] DeployX Agent has been completely removed from this PC." -ForegroundColor Green
Write-Host "  You can now install the fresh version:" -ForegroundColor Green
Write-Host "  DeployX-Agent-Setup-0.1.2.exe" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Green
Write-Host ""
pause
