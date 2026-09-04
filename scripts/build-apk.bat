@echo off
REM ==============================================================================
REM FR8X Enterprise Mobile APK Generation Script (Auto-Updating Webview Architecture)
REM ==============================================================================
echo [FR8X] Initializing Enterprise Mobile APK Builder...

REM Step 1: Install Capacitor CLI & Core dependencies if not present
echo [FR8X] Checking Capacitor Core & Android CLI dependencies...
call npm install --save-dev @capacitor/core @capacitor/cli @capacitor/android

REM Step 2: Initialize Android platform container
if not exist "android" (
    echo [FR8X] Creating native Android workspace container...
    call npx cap add android
) else (
    echo [FR8X] Android container already exists. Syncing configuration...
    call npx cap sync android
)

REM Step 3: Copy assets & configuration
echo [FR8X] Synchronizing Capacitor configuration (Live Server pointing to Next.js)...
call npx cap copy android

REM Step 4: Build APK using Gradle Wrapper
if exist "android\gradlew.bat" (
    echo [FR8X] Compiling native debug APK with Gradle...
    cd android
    call gradlew.bat assembleDebug
    cd ..
    echo.
    echo ==============================================================================
    echo [FR8X] APK Compilation Complete!
    echo Binary Location: android\app\build\outputs\apk\debug\app-debug.apk
    echo ==============================================================================
) else (
    echo [FR8X] Android project configured. You can now open in Android Studio:
    echo        npx cap open android
)

echo [FR8X] Note: Because capacitor.config.json is configured with server.url,
echo        ANY changes pushed to the web app will automatically update inside the APK
echo        instantly without rebuilding or reinstalling the APK!
pause
