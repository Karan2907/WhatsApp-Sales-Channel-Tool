@echo off
echo Creating self-contained WhatsApp Sales Channel Tool package...
echo ==========================================================

REM Create a directory for the self-contained package
set "PACKAGE_DIR=release\WhatsApp-Sales-Channel-Tool-SelfContained"
if exist "%PACKAGE_DIR%" rmdir /S /Q "%PACKAGE_DIR%"
mkdir "%PACKAGE_DIR%"

echo Copying application files...
xcopy /E /I /Y "release\WhatsApp-Sales-Channel-Tool" "%PACKAGE_DIR%"

echo Copying Node.js files...
xcopy /E /I /Y "nodejs" "%PACKAGE_DIR%\nodejs"

echo Creating installation instructions...
(
echo ================================
echo WhatsApp Sales Channel Tool
echo Self-Contained Package
echo ================================
echo.
echo This package includes everything you need to run the application:
echo  - All application files
echo  - Node.js runtime (no separate installation required)
echo.
echo To run the application:
echo 1. Extract this folder to a location of your choice
echo 2. Double-click start.bat to launch the application
echo.
echo The application will be available at http://localhost:3000
echo.
echo For support, refer to the docs folder or contact the development team.
) > "%PACKAGE_DIR%\README.txt"

echo Creating a single executable package...
powershell -Command "Compress-Archive -Path '%PACKAGE_DIR%\*' -DestinationPath 'release\WhatsApp-Sales-Channel-Tool-SelfContained.exe' -Force"

echo.
echo Self-contained package created successfully!
echo Location: release\WhatsApp-Sales-Channel-Tool-SelfContained.exe
echo.
echo This package includes:
echo  - All application files
echo  - Bundled Node.js runtime
echo  - No separate installations required
echo.
pause