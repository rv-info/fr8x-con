@echo off
REM ==============================================================================
REM FR8X Enterprise Mobile APK Rebuild Script
REM ==============================================================================
echo [FR8X] Packaging standalone enterprise Android APK...

cd /d "%~dp0"
node tools\package-apk.js

echo.
echo ==============================================================================
echo [FR8X] APK Generation Complete!
echo Location: dist\fr8x-workspace-debug.apk
echo ==============================================================================
pause
