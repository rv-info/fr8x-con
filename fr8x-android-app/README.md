# FR8X Enterprise Mobile Android Application (Standalone Package)

This folder contains the complete, isolated Android native wrapper application and compiled APK file for **FR8X Global Freight Workspace**.

> **Isolation Guarantee:** This folder is completely self-contained and does not affect or modify any existing Next.js web application code.

---

## 1. Ready-to-Test APK Binary

The testable Android APK file has been compiled and is located at:
```
fr8x-android-app/dist/fr8x-workspace-debug.apk
```

- **File Name:** `fr8x-workspace-debug.apk`
- **Package ID:** `com.fr8x.app`
- **Target OS:** Android 7.0+ (API Level 24 to 34)
- **Architecture:** Universal (ARM64, ARMv7, x86_64)

---

## 2. How the Live Auto-Updating Works

The native Android app uses a **Hardware-Accelerated Live Webview Architecture**:
- The APK loads the live workspace application from the server (`http://10.0.2.2:3000` for emulator, or your production/LAN server URL).
- **Zero Reinstalls Needed:** Whenever you modify or deploy updates to your web application, **the Android app automatically loads the newest version on launch**!
- You do **not** need to build or install a new APK when tweaking the web application.

---

## 3. How to Install & Test on Android Devices

### Method A: Transfer to Physical Android Phone (Fastest)
1. Send `fr8x-workspace-debug.apk` to your phone via:
   - USB cable (Copy to phone's `Downloads` folder)
   - WhatsApp / Telegram / Google Drive / Email attachment
2. On your phone, tap on `fr8x-workspace-debug.apk` in your Files / Downloads app.
3. If prompted with *"Install unknown apps"*, tap **Settings** and enable **"Allow from this source"**.
4. Tap **Install** → **Open**.

### Method B: Via Android Debug Bridge (ADB)
If you have an Android device connected via USB with USB Debugging enabled:
```bash
adb install -r fr8x-android-app/dist/fr8x-workspace-debug.apk
```

### Method C: Android Studio
You can open this folder (`fr8x-android-app`) directly in Android Studio as a standard Gradle project:
- File → Open → Select `fr8x-android-app`
- Click **Run** (`Shift + F10`) to launch on any connected device or Android emulator.

---

## 4. Key Native Capabilities Included

- **Hardware Acceleration:** Native 60 FPS GPU rendering for fast scrolling.
- **Pull to Refresh:** Swipe down from the top to reload the workspace live.
- **Camera & File Uploads:** Supports capturing KYC filings and profile photos directly through Android camera or gallery chooser.
- **Offline Resilience:** Loads a built-in offline screen with a 1-tap "Retry Connection" button if network is unavailable.
- **Hardware Back Navigation:** Android back button navigates back within the workspace.

---

## 5. Rebuilding the APK

To re-package the APK at any time:
1. Double-click `build-apk.bat` inside this folder, or run:
```cmd
node tools\package-apk.js
```
The output APK will be refreshed in `dist/fr8x-workspace-debug.apk`.
