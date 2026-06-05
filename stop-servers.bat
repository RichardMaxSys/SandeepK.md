@echo off
setlocal enabledelayedexpansion

title CareerAI Stopper
cd /d "%~dp0"

:: ─── Colors ──────────────────────────────────────────────────────────────
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "CYAN=[96m"
set "RESET=[0m"

echo.
echo %CYAN%╔════════════════════════════════════════════════════╗%RESET%
echo %CYAN%║         CareerAI — Server Stopper                  ║%RESET%
echo %CYAN%╚════════════════════════════════════════════════════╝%RESET%
echo.

set "STOPPED_ANY="

:: ─── Kill by window title (catches orphan processes) ─────────────────────
echo %YELLOW%[..]%RESET% Checking for orphan windows...

taskkill /FI "WindowTitle eq CareerAI Backend*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%[OK]%RESET%  Closed window: CareerAI Backend
    set "STOPPED_ANY=1"
)

taskkill /FI "WindowTitle eq CareerAI Frontend*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%[OK]%RESET%  Closed window: CareerAI Frontend
    set "STOPPED_ANY=1"
)

taskkill /FI "WindowTitle eq CareerAI Launcher*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%[OK]%RESET%  Closed window: CareerAI Launcher
    set "STOPPED_ANY=1"
)

taskkill /FI "WindowTitle eq CareerAI Stopper*" /F >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%[OK]%RESET%  Closed window: CareerAI Stopper
    set "STOPPED_ANY=1"
)

echo.

:: ─── Kill by port ────────────────────────────────────────────────────────
echo %YELLOW%[..]%RESET% Killing processes by port...

for %%p in (8000 3000 3001) do (
    set "PORT_NAME="
    if "%%p"=="8000" set "PORT_NAME=CareerAI Backend"
    if "%%p"=="3000" set "PORT_NAME=CareerAI Frontend"
    if "%%p"=="3001" set "PORT_NAME=CareerAI Frontend"

    set "FOUND="
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%p "') do (
        taskkill /F /PID %%a >nul 2>&1
        set "FOUND=1"
        set "STOPPED_ANY=1"
    )
    if defined FOUND (
        echo %GREEN%[OK]%RESET%  Stopped: !PORT_NAME! (port %%p)
    ) else (
        echo %CYAN%[..]%RESET%  Port %%p was free
    )
)

echo.

:: ─── Summary ─────────────────────────────────────────────────────────────
if defined STOPPED_ANY (
    echo %GREEN%All servers stopped.%RESET%
) else (
    echo %YELLOW%No servers running.%RESET%
)

echo.
pause
