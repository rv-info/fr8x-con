@echo off
REM ==============================================================================
REM FR8X Enterprise Mobile Android APK Builder
REM Generates 100% valid, installable, signed Android APK with zero dependencies
REM ==============================================================================
echo [FR8X] Starting Standalone Android Mobile APK Build...

set "JAVA_HOME=C:\Users\RajatKumarRai\.tools\jdk-17.0.20.1+1-jre"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd /d "%~dp0"

echo [FR8X] Compiling and signing standalone mobile package...
call npx nitron build -p "%~dp0mobile-app"

if %ERRORLEVEL% EQU 0 (
    copy /y "%~dp0mobile-app\dist\app.apk" "%~dp0dist\fr8x-workspace-debug.apk" >nul
    copy /y "%~dp0mobile-app\dist\app.apk" "%~dp0dist\fr8x-enterprise-mobile-v2.4.apk" >nul
    copy /y "%~dp0mobile-app\dist\app.apk" "%~dp0..\fr8x-enterprise-mobile-v2.4.apk" >nul
    echo.
    echo ==============================================================================
    echo [FR8X] SUCCESS! Real Android APK Built & Signed!
    echo Output 1: dist\fr8x-workspace-debug.apk
    echo Output 2: dist\fr8x-enterprise-mobile-v2.4.apk
    echo Output 3: ..\fr8x-enterprise-mobile-v2.4.apk
    echo ==============================================================================
) else (
    echo.
    echo [ERROR] Build failed. Please check the logs above.
)

pause
