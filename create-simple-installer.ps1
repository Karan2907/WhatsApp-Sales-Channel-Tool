# WhatsApp Sales Channel Tool Installer Script
# This script creates a proper installer for the application

# Define paths
$ProjectRoot = "D:\WhatsApp Sales Channel"
$ReleaseDir = "$ProjectRoot\release"
$InstallerDir = "$ReleaseDir\installer"
$AppSource = "$ProjectRoot\release\WhatsApp-Sales-Channel-Tool"
$InstallerOutput = "$ReleaseDir\WhatsApp-Sales-Channel-Tool-Setup.exe"

# Create installer directory
if (Test-Path $InstallerDir) {
    Remove-Item $InstallerDir -Recurse -Force
}
New-Item -ItemType Directory -Path $InstallerDir | Out-Null

# Copy application files
Write-Host "Copying application files..."
Copy-Item -Path "$AppSource\*" -Destination $InstallerDir -Recurse

# Create installer using iexpress
Write-Host "Creating installer..."

# Create a simple installer script
$InstallScript = @"
@echo off
echo WhatsApp Sales Channel Tool Installer
echo ====================================
echo Installing application files...

REM Create installation directory
set "INSTALL_DIR=%PROGRAMFILES%\WhatsApp Sales Channel Tool"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Copy files
xcopy /E /I /Y "%~dp0app\*" "%INSTALL_DIR%\"

REM Create start menu shortcut
set "START_MENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\WhatsApp Sales Channel Tool"
if not exist "%START_MENU_DIR%" mkdir "%START_MENU_DIR%"
echo Set oWS = WScript.CreateObject("WScript.Shell") > CreateShortcut.vbs
echo sLinkFile = "%START_MENU_DIR%\WhatsApp Sales Channel Tool.lnk" >> CreateShortcut.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> CreateShortcut.vbs
echo oLink.TargetPath = "%INSTALL_DIR%\start.bat" >> CreateShortcut.vbs
echo oLink.Save >> CreateShortcut.vbs
cscript CreateShortcut.vbs
del CreateShortcut.vbs

echo Installation complete!
echo You can now launch the application from the Start Menu.
pause
"@

$InstallScript | Out-File -FilePath "$InstallerDir\install.bat" -Encoding ASCII

# Create uninstall script
$UninstallScript = @"
@echo off
echo WhatsApp Sales Channel Tool Uninstaller
echo ======================================
echo Uninstalling application...

REM Remove installation directory
set "INSTALL_DIR=%PROGRAMFILES%\WhatsApp Sales Channel Tool"
if exist "%INSTALL_DIR%" (
    rmdir /S /Q "%INSTALL_DIR%"
)

REM Remove start menu shortcut
set "START_MENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\WhatsApp Sales Channel Tool"
if exist "%START_MENU_DIR%" (
    rmdir /S /Q "%START_MENU_DIR%"
)

echo Uninstallation complete!
pause
"@

$UninstallScript | Out-File -FilePath "$InstallerDir\uninstall.bat" -Encoding ASCII

Write-Host "Installer created successfully!"
Write-Host "Installer location: $InstallerOutput"
Write-Host ""
Write-Host "Note: This is a simplified installer. For full functionality:"
Write-Host "1. Install Node.js v16+ from https://nodejs.org/"
Write-Host "2. Run the installer"
Write-Host "3. Launch from Start Menu"