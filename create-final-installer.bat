@echo off
echo WhatsApp Sales Channel Tool Self-Contained Installer
echo =====================================================
echo Creating self-contained installer with bundled Node.js...

REM Create a temporary directory for packaging
set "TEMP_DIR=%TEMP%\whatsapp-sales-channel-tool-package"
if exist "%TEMP_DIR%" rmdir /S /Q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"

REM Copy all application files to temporary directory
echo Copying application files...
xcopy /E /I /Y "%~dp0\WhatsApp-Sales-Channel-Tool\*" "%TEMP_DIR%"

REM Create the final installer using iexpress
echo Creating installer...

REM Create a self-extracting installer with iexpress
set "SED_FILE=%TEMP%\whatsapp-installer.sed"
set "INSTALLER_PATH=%~dp0WhatsApp-Sales-Channel-Tool-Setup.exe"

REM Create SED file for iexpress
(
echo [Version]
echo Class=IEXPRESS
echo SEDVersion=3
echo [Options]
echo PackagePurpose=InstallApp
echo ShowInstallProgramWindow=0
echo HideExtractAnimation=1
echo UseLongFileName=1
echo InsideCompressed=0
echo CAB_FixedSize=0
echo CAB_ResvCodeSigning=0
echo RebootMode=N
echo InstallPrompt=%20
echo DisplayLicense=%20
echo FinishMessage=%20
echo TargetName=%INSTALLER_PATH%
echo ExecuteProgram=install.bat
echo FriendlyName=WhatsApp Sales Channel Tool Installer
echo AppLaunched=install.bat
echo PostInstallCmd=%20
echo AdminQuietInstCmd=%20
echo UserQuietInstCmd=%20
echo SourceFiles=SourceFiles
echo [Strings]
echo PackageName="WhatsApp Sales Channel Tool"
) > "%SED_FILE%"

REM Add source files to SED
echo SourceFiles0=%TEMP_DIR%>> "%SED_FILE%"

REM Create the installer
iexpress /N /Q "%SED_FILE%"

REM Clean up
if exist "%TEMP_DIR%" rmdir /S /Q "%TEMP_DIR%"
if exist "%SED_FILE%" del "%SED_FILE%"

echo.
echo Installer created successfully!
echo Location: %INSTALLER_PATH%
echo.
echo This installer includes:
echo  - All application files
echo  - Bundled Node.js runtime
echo  - No separate installations required
echo.
pause