@echo off
REM ==============================================================================
REM FR8X Enterprise Mobile Android APK Builder (Official Google Android SDK Toolchain)
REM Generates 100% genuine, installable, signed Android APK with valid certificates
REM ==============================================================================
echo [FR8X] Starting Official Android Mobile APK Build...

cd /d "%~dp0\..\fr8x-android-app"

node tools\build-official-apk.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==============================================================================
    echo [FR8X] SUCCESS! 100%% Genuine Android APK Built and Verified!
    echo Output: public\fr8x-enterprise-mobile-v2.4.apk
    echo ==============================================================================
) else (
    echo.
    echo [ERROR] Build failed. Please check the logs above.
)

pause
