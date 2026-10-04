@echo off
setlocal enabledelayedexpansion
title DeployX Agent - Clean Uninstall Tool
color 0F

echo ======================================================================
echo                 DeployX Agent Cleanup & Uninstall Tool
echo ======================================================================
echo.
echo This tool will safely stop and completely remove DeployX Agent from
echo your computer so you can perform a clean installation.
echo.

:: 1. Terminate any running Agent processes
echo [1/5] Stopping all active DeployX Agent processes...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-Process | Where-Object { $_.Path -like '*DeployX Agent*' } | Stop-Process -Force -ErrorAction SilentlyContinue" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq *DeployX Agent*" >nul 2>&1
timeout /t 1 /nobreak >nul
echo       Active processes stopped.

:: 2. Run built-in uninstaller if present
echo [2/5] Running official uninstaller...
set "APP_DIR=%LOCALAPPDATA%\Programs\DeployX Agent"
if exist "%APP_DIR%\unins000.exe" (
    echo       Invoking %APP_DIR%\unins000.exe...
    start "" /wait "%APP_DIR%\unins000.exe" /VERYSILENT /SUPPRESSMSGBOXES /NORESTART
    timeout /t 2 /nobreak >nul
) else (
    echo       No previous official uninstaller registered. Proceeding to direct cleanup.
)

:: 3. Clean remaining files from installation directory
echo [3/5] Cleaning remaining application files...
if exist "%APP_DIR%" (
    rmdir /s /q "%APP_DIR%" >nul 2>&1
    if exist "%APP_DIR%" (
        echo       Retrying with administrative / forced cleanup...
        del /f /s /q "%APP_DIR%\*.*" >nul 2>&1
        rmdir /s /q "%APP_DIR%" >nul 2>&1
    )
)
echo       Application directory cleaned.

:: 4. Clean desktop and start menu shortcuts
echo [4/5] Removing shortcuts...
if exist "%USERPROFILE%\Desktop\DeployX Agent.lnk" del /f /q "%USERPROFILE%\Desktop\DeployX Agent.lnk" >nul 2>&1
if exist "%PUBLIC%\Desktop\DeployX Agent.lnk" del /f /q "%PUBLIC%\Desktop\DeployX Agent.lnk" >nul 2>&1
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\DeployX Agent" rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\DeployX Agent" >nul 2>&1
echo       Shortcuts removed.

:: 5. Clean local cached runtime logs and identity state
echo [5/5] Resetting DeployX pairing and local state...
if exist "%LOCALAPPDATA%\DeployX" rmdir /s /q "%LOCALAPPDATA%\DeployX" >nul 2>&1
if exist "%APPDATA%\DeployX" rmdir /s /q "%APPDATA%\DeployX" >nul 2>&1
reg delete "HKCU\Software\DeployX" /f >nul 2>&1
echo       Local state reset.

echo.
echo ======================================================================
echo   [SUCCESS] DeployX Agent has been completely removed from this PC.
echo   You can now launch the new installer:
echo   DeployX-Agent-Setup-0.1.2.exe
echo ======================================================================
echo.
pause
