@echo off
echo Installing WhatsApp Sales Channel Tool as a Windows Service...
echo.

REM This script creates a scheduled task that runs the tool at system startup
REM and keeps it running

REM Create the task to start at system startup
schtasks /create /tn "WhatsApp Sales Channel Tool" /tr "node \"d:\WhatsApp Sales Channel\webhooks\server.js\"" /sc onstart /ru System /f

REM Create a task to restart the service if it stops (every 5 minutes)
schtasks /create /tn "WhatsApp Sales Channel Tool Monitor" /tr "powershell -Command \"if (!(Get-Process -Name node -ErrorAction SilentlyContinue)) { Start-Process node -ArgumentList '\"d:\WhatsApp Sales Channel\webhooks\server.js\"' }\"" /sc minute /mo 5 /f

echo.
echo Installation complete!
echo The WhatsApp Sales Channel Tool will now run automatically at system startup
echo and will be monitored to ensure it stays running.
echo.
echo To uninstall, run the uninstall-service.bat file.
echo.
pause