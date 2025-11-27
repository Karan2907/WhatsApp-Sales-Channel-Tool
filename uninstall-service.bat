@echo off
echo Uninstalling WhatsApp Sales Channel Tool service...
echo.

REM Delete the scheduled tasks
schtasks /delete /tn "WhatsApp Sales Channel Tool" /f
schtasks /delete /tn "WhatsApp Sales Channel Tool Monitor" /f

echo.
echo Uninstallation complete!
echo The WhatsApp Sales Channel Tool service has been removed.
echo.
pause