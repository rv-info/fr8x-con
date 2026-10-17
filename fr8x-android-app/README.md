# FR8X Android Mobile Application (Universal Release)

This package contains the upgraded, secure native Android mobile application for **FR8X Global Freight Workspace**.

---

## 1. Ready-to-Install APK Binaries

The compiled, signed, and aligned universal Android APK is available at:
- **Primary Universal APK:** [`FR8X-Android-Universal-Release.apk`](file:///d:/fr8x-con/fr8x-android-app/dist/FR8X-Android-Universal-Release.apk)
- **Root Release Path:** [`d:\fr8x-con\FR8X-Android-Universal-Release.apk`](file:///d:/fr8x-con/FR8X-Android-Universal-Release.apk)
- **Public Web Endpoint:** [`d:\fr8x-con\public\FR8X-Android-Universal-Release.apk`](file:///d:/fr8x-con/public/FR8X-Android-Universal-Release.apk)
- **Legacy Compatibility Link:** [`fr8x-enterprise-mobile-v2.4.apk`](file:///d:/fr8x-con/fr8x-android-app/dist/fr8x-enterprise-mobile-v2.4.apk)

### Binary Specifications
- **Package ID:** `com.fr8x.app`
- **Application Name:** `FR8X`
- **Version Code:** `204`
- **Version Name:** `2.4.0`
- **Min Android SDK:** Android 5.0 (API 21)
- **Compile Android SDK:** Android 13 (API 33)
- **Target Android SDK:** Android 14 (API 34)
- **File Size:** ~395.5 KB
- **Signing Schemes:** Verified using v1 (JAR signing), v2 (APK Signature Scheme v2), and v3 (APK Signature Scheme v3)
- **Security Profile:** Cleartext traffic disabled (`usesCleartextTraffic="false"`), strict HTTPS domain enforcement, user CA certificates excluded, mixed content blocked (`MIXED_CONTENT_NEVER_ALLOW`), arbitrary local file URLs blocked, strict SSL verification enforced.

---

## 2. Brand Identity & Launcher Resources

Derived directly from authoritative asset **`accessories/FR8X Infinity App Icon.png`**:
- **Adaptive Launcher Icon (API 26+):** `res/mipmap-anydpi-v26/ic_launcher.xml` and `ic_launcher_round.xml` with safe-zone padded infinity mark foreground and `#070d18` enterprise background.
- **Density Mipmaps:** Canonical resolutions generated for `mdpi` (48px/108px), `hdpi` (72px/162px), `xhdpi` (96px/216px), `xxhdpi` (144px/324px), and `xxxhdpi` (192px/432px).
- **Themed Monochrome Icon (Android 13+):** Material You dynamic theming supported via `<monochrome>` drawable.
- **Notification Icon:** High-contrast white silhouette (`ic_stat_fr8x.png`) across all densities.
- **Splash Screen:** Centered high-resolution infinity logo.

---

## 3. Architecture & Real-Time Backend Integration

1. **Live Production System:**
   - Connects directly to the authorized live FR8X enterprise platform (`https://con.fr8x.in`).
   - Deep linking supported for HTTPS domains (`con.fr8x.in`, `fr8x.app`, `fr8x.in`) and custom in-app scheme (`fr8x://`).
   - Seamless Supabase authentication, PostgreSQL RLS persistence, and real-time event synchronization.
2. **Native JavaScript Bridge (`FR8XNativeBridge`):**
   - In-app Android detection (`window.FR8XAndroid.isNativeApp()`).
   - Native OS share sheet trigger (`shareFreightDemand`).
   - Native haptic feedback for bid placement and user actions (`vibrate`).
   - Native toast notifications and network state introspection.
3. **Resilience & Offline Handling:**
   - Zero fabricated mock data or bypass auth.
   - Automatic connectivity monitoring via Android `ConnectivityManager`.
   - Production offline interface with real-time status indicator, reconnect trigger, and emergency corporate communication channels.
4. **Android 13+ Notification Flow:**
   - Runtime prompt for `POST_NOTIFICATIONS` permission to ensure real-time delivery of freight auction bids, trade messages, and rate approvals.
5. **Modern File Chooser & Document Upload:**
   - Integrated `WebChromeClient.onShowFileChooser` supporting SAF documents, KYC certificates, and cargo manifests.

---

## 4. How to Install on Any Physical Android Phone

1. **Send the APK to your phone:**
   - Via WhatsApp, Telegram, Google Drive, Email attachment, or direct USB file transfer.
2. **Tap the file on your phone:**
   - Open your phone's **Files** or **Downloads** app and tap `FR8X-Android-Universal-Release.apk`.
3. **If prompted:**
   - Tap **Settings** &rarr; Turn ON **"Allow from this source"**.
4. **Tap Install &rarr; Open:**
   - The app launches instantly under its official **FR8X** launcher icon and connects securely to the live freight workspace.

---

## 5. How to Rebuild Anytime

Run from terminal or command prompt:
```bash
node tools/build-official-apk.js
```
Or run `build-apk.bat`. The build toolchain compiles resources with `aapt2`, compiles Java with JDK 17, compiles DEX with `d8`, aligns with `zipalign`, and signs with `apksigner`.
