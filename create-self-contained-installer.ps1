# WhatsApp Sales Channel Tool - Create Self-Contained Installer
# This script creates a self-contained installer that includes Node.js

param(
    [string]$SourcePath = "release\WhatsApp-Sales-Channel-Tool",
    [string]$OutputPath = "release\WhatsApp-Sales-Channel-Tool-Setup.exe"
)

Write-Host "Creating self-contained installer..." -ForegroundColor Green

# Check if source directory exists
if (-not (Test-Path $SourcePath)) {
    Write-Error "Source directory not found: $SourcePath"
    exit 1
}

# Create temporary directory
$TempDir = Join-Path $env:TEMP "whatsapp_installer_$(Get-Random)"
$ExtractDir = Join-Path $TempDir "extract"
New-Item -ItemType Directory -Path $ExtractDir -Force | Out-Null

Write-Host "Copying application files..." -ForegroundColor Yellow
Copy-Item -Path "$SourcePath\*" -Destination $ExtractDir -Recurse -Force

# Create installation script
$InstallScript = @'
@echo off
setlocal

echo WhatsApp Sales Channel Tool Installer
echo ====================================
echo Installing application...

REM Create installation directory
set "INSTALL_DIR=%PROGRAMFILES%\WhatsApp Sales Channel Tool"
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Copy all files
echo Copying files to %INSTALL_DIR%...
xcopy /E /I /Y "%~dp0*" "%INSTALL_DIR%" >nul

REM Create start menu shortcut
set "START_MENU_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\WhatsApp Sales Channel Tool"
if not exist "%START_MENU_DIR%" mkdir "%START_MENU_DIR%"

echo Creating shortcuts...
powershell -Command "
Add-Type -AssemblyName System.Windows.Forms
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut([System.Environment]::GetFolderPath('ApplicationData') + '\Microsoft\Windows\Start Menu\Programs\WhatsApp Sales Channel Tool\WhatsApp Sales Channel Tool.lnk')
$Shortcut.TargetPath = [System.Environment]::GetFolderPath('ProgramFiles') + '\WhatsApp Sales Channel Tool\start.bat'
$Shortcut.WorkingDirectory = [System.Environment]::GetFolderPath('ProgramFiles') + '\WhatsApp Sales Channel Tool'
$Shortcut.IconLocation = [System.Environment]::GetFolderPath('ProgramFiles') + '\WhatsApp Sales Channel Tool\public\icon.ico'
$Shortcut.Save()
"

REM Create desktop shortcut
powershell -Command "
Add-Type -AssemblyName System.Windows.Forms
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut([System.Environment]::GetFolderPath('Desktop') + '\WhatsApp Sales Channel Tool.lnk')
$Shortcut.TargetPath = [System.Environment]::GetFolderPath('ProgramFiles') + '\WhatsApp Sales Channel Tool\start.bat'
$Shortcut.WorkingDirectory = [System.Environment]::GetFolderPath('ProgramFiles') + '\WhatsApp Sales Channel Tool'
$Shortcut.IconLocation = [System.Environment]::GetFolderPath('ProgramFiles') + '\WhatsApp Sales Channel Tool\public\icon.ico'
$Shortcut.Save()
"

echo Installation complete!
echo.
echo You can now launch the application from:
echo  - Start Menu: WhatsApp Sales Channel Tool
echo  - Desktop shortcut
echo.
echo Press any key to launch the application...
pause >nul
"%INSTALL_DIR%\start.bat"
'@

$InstallScript | Out-File -FilePath "$ExtractDir\install.bat" -Encoding ASCII

# Create SFX archive using makecab
Write-Host "Creating self-extracting archive..." -ForegroundColor Yellow

# Create a directive file for makecab
$DirectiveContent = @"
; Self-extracting directive file
.Set Cabinet=on
.Set Compress=on
.Set CompressionType=MSZIP
.Set UniqueFiles=off
.Set CabinetNameTemplate=WhatsApp-Sales-Channel-Tool-Setup.exe
.Set DiskDirectoryTemplate=.
.Set MaxDiskSize=0
.Set CabinetFileCountThreshold=0
.Set FolderFileCountThreshold=0
.Set FolderSizeThreshold=0
.Set MaxCabinetSize=0
.Set InfFileName=nul
.Set RptFileName=nul
"@

$DirectiveFile = Join-Path $TempDir "setup.ddf"
$DirectiveContent | Out-File -FilePath $DirectiveFile -Encoding ASCII

# Add files to directive
Get-ChildItem -Path $ExtractDir -Recurse | ForEach-Object {
    if (-not $_.PSIsContainer) {
        $RelativePath = $_.FullName.Substring($ExtractDir.Length + 1)
        $RelativePath = $RelativePath -replace "\\", "/"
        Add-Content -Path $DirectiveFile -Value """$($_.FullName)"" ""$RelativePath"""
    }
}

# Run makecab
try {
    Push-Location $TempDir
    makecab /F "$DirectiveFile" | Out-Null
    Pop-Location
    
    # Move the output file
    $CabFile = Join-Path $TempDir "WhatsApp-Sales-Channel-Tool-Setup.exe"
    if (Test-Path $CabFile) {
        Move-Item -Path $CabFile -Destination $OutputPath -Force
        Write-Host "Installer created successfully!" -ForegroundColor Green
        Write-Host "Location: $OutputPath" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "This installer includes:" -ForegroundColor Yellow
        Write-Host " - All application files" -ForegroundColor Yellow
        Write-Host " - Bundled Node.js runtime" -ForegroundColor Yellow
        Write-Host " - No separate installations required" -ForegroundColor Yellow
    } else {
        Write-Error "Failed to create installer"
    }
} catch {
    Write-Error "Error creating installer: $_"
}

# Clean up
Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue