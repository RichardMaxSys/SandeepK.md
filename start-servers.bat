@echo off
setlocal enabledelayedexpansion

title CareerAI Launcher
cd /d "%~dp0"
set "ROOT_DIR=%CD%"

:: ─── Colors ──────────────────────────────────────────────────────────────
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "CYAN=[96m"
set "RESET=[0m"

echo.
echo %CYAN%╔════════════════════════════════════════════════════╗%RESET%
echo %CYAN%║       CareerAI — Development Server Launcher       ║%RESET%
echo %CYAN%╚════════════════════════════════════════════════════╝%RESET%
echo.

:: ─── Step 1: Read OPENROUTER_API_KEY from .env ──────────────────────────
set "ENV_FILE=%ROOT_DIR%\backend\.env"
set "OPENROUTER_API_KEY="

if not exist "%ENV_FILE%" (
    echo %RED%[FAIL]%RESET% %ENV_FILE% not found.
    echo        Create this file with: OPENROUTER_API_KEY=sk-or-v1-...
    echo.
    pause
    exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
    if /i "%%a"=="OPENROUTER_API_KEY" (
        set "OPENROUTER_API_KEY=%%b"
    )
)

if "%OPENROUTER_API_KEY%"=="" (
    echo %RED%[FAIL]%RESET% OPENROUTER_API_KEY is empty or missing in .env
    echo        Add: OPENROUTER_API_KEY=sk-or-v1-... to backend\.env
    echo.
    pause
    exit /b 1
)

echo %GREEN%[OK]%RESET%  OPENROUTER_API_KEY loaded from .env
echo.

:: ─── Step 2: Check prerequisites ────────────────────────────────────────
echo %YELLOW%[..]%RESET% Checking prerequisites...

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[FAIL]%RESET% Python not installed. Install from python.org
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET%  Python found.

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%[FAIL]%RESET% Node.js not installed. Install from nodejs.org
    pause
    exit /b 1
)
echo %GREEN%[OK]%RESET%  npm found.
echo.

:: ─── Step 3: Kill existing processes on target ports ────────────────────
echo %YELLOW%[..]%RESET% Clearing ports...
for %%p in (8000 3000 3001) do (
    set "FOUND="
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%%p "') do (
        taskkill /F /PID %%a >nul 2>&1
        set "FOUND=1"
    )
    if defined FOUND (
        echo %GREEN%[OK]%RESET%  Cleared port %%p
    ) else (
        echo %CYAN%[..]%RESET% Port %%p was free
    )
)
echo.

:: ─── Step 4: Create helper scripts (avoids cmd.exe quote-escaping hell) ────
set "TEMP_BACKEND=%TEMP%\careerai-backend.bat"
set "TEMP_FRONTEND=%TEMP%\careerai-frontend.bat"

> "%TEMP_BACKEND%" (
    echo @echo off
    echo cd /d "%ROOT_DIR%\backend"
    echo set "OPENROUTER_API_KEY=%OPENROUTER_API_KEY%"
    echo echo Starting backend on port 8000...
    echo python -m uvicorn app.main:app --reload --port 8000
    echo if errorlevel 1 ^(
    echo     echo.
    echo     echo [ERROR] Backend failed to start. Check the output above.
    echo     pause
    echo ^)
    echo pause
)

> "%TEMP_FRONTEND%" (
    echo @echo off
    echo cd /d "%ROOT_DIR%\frontend"
    echo echo Starting frontend on port 3000...
    echo npm run dev
    echo if errorlevel 1 ^(
    echo     echo.
    echo     echo [ERROR] Frontend failed to start. Check the output above.
    echo     pause
    echo ^)
    echo pause
)

:: ─── Step 5: Start backend in a new window ──────────────────────────────
echo %YELLOW%[..]%RESET% Starting backend...
start "CareerAI Backend" "%TEMP_BACKEND%"

:: ─── Step 6: Wait for backend health ────────────────────────────────────
echo %YELLOW%[..]%RESET% Waiting for backend to become healthy...

set "BACKEND_OK="
for /l %%i in (1,1,20) do (
    timeout /t 2 /nobreak >nul
    for /f %%r in ('powershell -NoProfile -Command "try { $r=Invoke-RestMethod -Uri 'http://localhost:8000/api/health' -TimeoutSec 2; if ($r.status -eq 'ok') { '1' } else { '0' } } catch { '0' }" 2^>nul') do (
        if "%%r"=="1" set "BACKEND_OK=1"
    )
    if defined BACKEND_OK goto backend_ready
)

if not defined BACKEND_OK (
    echo %RED%[FAIL]%RESET% Backend failed to start after 40 seconds.
    echo        Check the "CareerAI Backend" window for errors.
    echo        Continuing anyway...
    goto after_backend_wait
)

:backend_ready
echo %GREEN%[OK]%RESET%  Backend ready on http://localhost:8000

:after_backend_wait
echo.

:: ─── Step 7: Start frontend in a new window ─────────────────────────────
echo %YELLOW%[..]%RESET% Starting frontend...
start "CareerAI Frontend" "%TEMP_FRONTEND%"

:: ─── Step 8: Wait for frontend to be ready (try 3000 then 3001) ─────────
echo %YELLOW%[..]%RESET% Waiting for frontend...

set "FRONTEND_PORT="
set "FRONTEND_OK="

:: Try port 3000 first
for /l %%i in (1,1,10) do (
    timeout /t 2 /nobreak >nul
    powershell -NoProfile -Command "
        try {
            $r = Invoke-WebRequest -Uri 'http://localhost:3000' -TimeoutSec 2 -UseBasicParsing
            if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 304) { exit 0 } else { exit 1 }
        } catch { exit 1 }
    " >nul 2>&1
    if not errorlevel 1 (
        set "FRONTEND_PORT=3000"
        set "FRONTEND_OK=1"
        goto frontend_ready
    )
)

:: If 3000 failed, try 3001
echo %YELLOW%[..]%RESET% Port 3000 not responding, trying 3001...
for /l %%i in (1,1,10) do (
    timeout /t 2 /nobreak >nul
    powershell -NoProfile -Command "
        try {
            $r = Invoke-WebRequest -Uri 'http://localhost:3001' -TimeoutSec 2 -UseBasicParsing
            if ($r.StatusCode -eq 200 -or $r.StatusCode -eq 304) { exit 0 } else { exit 1 }
        } catch { exit 1 }
    " >nul 2>&1
    if not errorlevel 1 (
        set "FRONTEND_PORT=3001"
        set "FRONTEND_OK=1"
        goto frontend_ready
    )
)

if not defined FRONTEND_OK (
    echo %RED%[FAIL]%RESET% Frontend failed to start after 40 seconds total.
    echo        Check the "CareerAI Frontend" window for errors.
    goto after_frontend_wait
)

:frontend_ready
echo %GREEN%[OK]%RESET%  Frontend ready on http://localhost:!FRONTEND_PORT!

:after_frontend_wait
echo.

:: ─── Step 9: Open browser ───────────────────────────────────────────────
if defined FRONTEND_PORT (
    echo %YELLOW%[..]%RESET% Opening browser...
    start http://localhost:!FRONTEND_PORT!
)

:: ─── Step 10: Cleanup temp scripts (safe because the new windows already forked) ──
del "%TEMP_BACKEND%" >nul 2>&1
del "%TEMP_FRONTEND%" >nul 2>&1

:: ─── Step 11: Summary ───────────────────────────────────────────────────
echo.
echo %CYAN%╔════════════════════════════════════════════════════╗%RESET%
echo %CYAN%║                   Summary                          ║%RESET%
echo %CYAN%╚════════════════════════════════════════════════════╝%RESET%
echo.
echo   %GREEN%Backend:%RESET%  http://localhost:8000
if defined FRONTEND_PORT (
    echo   %GREEN%Frontend:%RESET% http://localhost:!FRONTEND_PORT!
) else (
    echo   %RED%Frontend:%RESET% Could not detect port. Check the window.
)
echo.
echo %YELLOW%Note:%RESET% Close this window now — servers run in their own
echo        windows. Use stop-servers.bat to shut everything down.
echo.
pause
