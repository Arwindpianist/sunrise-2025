@echo off
setlocal enabledelayedexpansion

REM Maintenance Mode Control Script for Windows
REM Usage: maintenance.bat [enable|disable|status]

set "ENV_FILE=.env.local"
set "BACKUP_FILE=.env.local.backup"

if "%1"=="" goto :help

if "%1"=="enable" goto :enable
if "%1"=="disable" goto :disable
if "%1"=="status" goto :status
if "%1"=="help" goto :help
goto :error

:enable
echo [INFO] Enabling maintenance mode...

REM Check if .env.local exists
if not exist "%ENV_FILE%" (
    echo [WARNING] .env.local file not found. Creating it...
    type nul > "%ENV_FILE%"
)

REM Backup current .env.local
if exist "%ENV_FILE%" (
    copy "%ENV_FILE%" "%BACKUP_FILE%" >nul
    echo [INFO] Backed up current .env.local to .env.local.backup
)

REM Generate a random bypass secret (simple implementation)
set "BYPASS_SECRET="
for /L %%i in (1,1,32) do (
    set /a "rand=!random! %% 16"
    if !rand! lss 10 (
        set "BYPASS_SECRET=!BYPASS_SECRET!!rand!"
    ) else (
        set /a "hex=!rand! + 87"
        for %%j in (!hex!) do set "BYPASS_SECRET=!BYPASS_SECRET!%%j"
    )
)

REM Add or update maintenance mode settings
findstr /C:"MAINTENANCE_MODE=" "%ENV_FILE%" >nul 2>&1
if !errorlevel! equ 0 (
    REM Update existing setting
    powershell -Command "(Get-Content '%ENV_FILE%') -replace 'MAINTENANCE_MODE=.*', 'MAINTENANCE_MODE=true' | Set-Content '%ENV_FILE%'"
) else (
    REM Add new setting
    echo MAINTENANCE_MODE=true>> "%ENV_FILE%"
)

REM Add bypass secret
findstr /C:"MAINTENANCE_BYPASS_SECRET=" "%ENV_FILE%" >nul 2>&1
if !errorlevel! equ 0 (
    powershell -Command "(Get-Content '%ENV_FILE%') -replace 'MAINTENANCE_BYPASS_SECRET=.*', 'MAINTENANCE_BYPASS_SECRET=!BYPASS_SECRET!' | Set-Content '%ENV_FILE%'"
) else (
    echo MAINTENANCE_BYPASS_SECRET=!BYPASS_SECRET!>> "%ENV_FILE%"
)

echo [SUCCESS] Maintenance mode enabled!
echo [INFO] Bypass URL: https://yourdomain.com?bypass=!BYPASS_SECRET!
echo [WARNING] Keep this bypass URL secure - it allows access during maintenance
goto :end

:disable
echo [INFO] Disabling maintenance mode...

if not exist "%ENV_FILE%" (
    echo [WARNING] .env.local file not found. Maintenance mode is already disabled.
    goto :end
)

REM Backup current .env.local
copy "%ENV_FILE%" "%BACKUP_FILE%" >nul
echo [INFO] Backed up current .env.local to .env.local.backup

REM Remove maintenance mode settings
powershell -Command "(Get-Content '%ENV_FILE%') | Where-Object { $_ -notmatch 'MAINTENANCE_MODE=' -and $_ -notmatch 'MAINTENANCE_BYPASS_SECRET=' -and $_ -notmatch 'MAINTENANCE_ALLOWED_IPS=' } | Set-Content '%ENV_FILE%'"

echo [SUCCESS] Maintenance mode disabled!
goto :end

:status
echo [INFO] Checking maintenance mode status...

if not exist "%ENV_FILE%" (
    echo [WARNING] .env.local file not found
    echo Maintenance Mode: DISABLED
    goto :end
)

findstr /C:"MAINTENANCE_MODE=true" "%ENV_FILE%" >nul 2>&1
if !errorlevel! equ 0 (
    echo [ERROR] Maintenance Mode: ENABLED
    
    REM Show bypass secret if available
    for /f "tokens=2 delims==" %%a in ('findstr /C:"MAINTENANCE_BYPASS_SECRET=" "%ENV_FILE%"') do (
        echo [INFO] Bypass URL: https://yourdomain.com?bypass=%%a
    )
    
    REM Show allowed IPs if available
    for /f "tokens=2 delims==" %%a in ('findstr /C:"MAINTENANCE_ALLOWED_IPS=" "%ENV_FILE%"') do (
        echo [INFO] Allowed IPs: %%a
    )
) else (
    echo [SUCCESS] Maintenance Mode: DISABLED
)
goto :end

:help
echo Maintenance Mode Control Script
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   enable   - Enable maintenance mode
echo   disable  - Disable maintenance mode
echo   status   - Show current maintenance mode status
echo   help     - Show this help message
echo.
echo Environment Variables:
echo   MAINTENANCE_MODE=true/false          - Enable/disable maintenance mode
echo   MAINTENANCE_BYPASS_SECRET=secret     - Secret key for bypass access
echo   MAINTENANCE_ALLOWED_IPS=ip1,ip2      - Comma-separated list of allowed IPs
echo.
echo Examples:
echo   %0 enable   # Enable maintenance mode
echo   %0 disable  # Disable maintenance mode
echo   %0 status   # Check current status
goto :end

:error
echo [ERROR] Unknown command: %1
echo.
goto :help

:end
endlocal 