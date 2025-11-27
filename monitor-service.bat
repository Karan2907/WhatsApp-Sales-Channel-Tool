@echo off
echo Checking WhatsApp Sales Channel Tool service status...
echo.

REM Check if the node process is running
tasklist /fi "imagename eq node.exe" /fo csv 2>nul | find /i "node.exe" >nul

if "%ERRORLEVEL%"=="0" (
    echo [RUNNING] WhatsApp Sales Channel Tool is currently running
) else (
    echo [STOPPED] WhatsApp Sales Channel Tool is not running
    echo.
    echo To start the service, run:
    echo   install-as-service.bat
)

echo.
echo Current listening ports:
netstat -an | findstr :3000

echo.
echo To view detailed logs, check the console output or log files.
echo.
pause