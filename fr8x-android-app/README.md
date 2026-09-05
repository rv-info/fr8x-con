# FR8X Enterprise Mobile Android Application (v2.4.0 Standalone)

This package contains the complete, self-contained native Android mobile application for **FR8X Global Freight Workspace**.

> **100% Native Mobile Feel & Offline Standalone:**
> Everything (UI, screens, reverse auctions, trade chat, freight calculator, and KYC profile) is bundled directly inside the APK file (`assets/www/`). It does **not** load `localhost:3000` or an external website in a browser frame. When installed on an Android device, it behaves like an authentic native mobile application.

---

## 1. Ready-to-Install APK Binaries

The compiled, signed, and aligned Android APK is available at:
- **Primary Root Location:** [`fr8x-enterprise-mobile-v2.4.apk`](file:///c:/Users/RajatKumarRai/OneDrive%20-%20Cogoport/Documents/fr8x-con/fr8x-enterprise-mobile-v2.4.apk)
- **Dist Location:** [`fr8x-android-app/dist/fr8x-enterprise-mobile-v2.4.apk`](file:///c:/Users/RajatKumarRai/OneDrive%20-%20Cogoport/Documents/fr8x-con/fr8x-android-app/dist/fr8x-enterprise-mobile-v2.4.apk)
- **Debug Package:** [`fr8x-android-app/dist/fr8x-workspace-debug.apk`](file:///c:/Users/RajatKumarRai/OneDrive%20-%20Cogoport/Documents/fr8x-con/fr8x-android-app/dist/fr8x-workspace-debug.apk)

### Binary Specifications
- **File Size:** ~181.7 KB
- **Package ID:** `com.fr8x.app`
- **Application Name:** FR8X Mobile
- **Version:** 2.4.0 (Build 240)
- **Min Android SDK:** Android 5.0+ (API 21+)
- **Target Android SDK:** Android 14+ (API 34)
- **Signing:** Aligned, Signed (Android Signature Schemes v1 & v2)

---

## 2. Key Native Mobile Features Included

1. **Native Android App Shell:**
   - Deep ocean enterprise theme with hardware acceleration.
   - Fixed Android App Bar with live status pill, notifications counter, and route search.
   - 5-tab Bottom Navigation Bar with touch ripples, active indicators, and haptic feedback.
   - Floating Action Button (FAB) for "+ Post Demand".

2. **5 Fully Functional Mobile Modules:**
   - **Market / Freight Demands:** Live international shipping corridors (INNSA → NLRTM, CNSHA → AEJEA, INMUN → GBFXT), category filters (Ocean FCL, Reefer, Air, Hazmat), and instant quotation drawer.
   - **Reverse Auctions Arena:** Real-time ticking countdown clocks (`01:42:15`), lowest bid vs ceiling rate, and interactive "Place Lower Bid" bottom sheet.
   - **Trade Desk Chat:** Mobile WhatsApp-style in-app messenger with 4 active carrier desks (Maersk, Hapag-Lloyd, Port CFS, Customs Broker), live messages, and quick freight reply pills.
   - **FX & Landed Cost Calculator:** Live currency switcher (USD, INR, EUR, AED, SGD, CNY), Ocean Freight + THC + BAF + Customs breakdown with 18% statutory duty computation.
   - **Enterprise Profile & Compliance KYC:** Tier-1 Verified Forwarder badge, active GSTIN, IEC, MTO License, and FMC bond details.

---

## 3. How to Install on Any Physical Android Phone

1. **Send the APK to your phone:**
   - Via WhatsApp, Telegram, Google Drive, Email attachment, or USB file transfer.
2. **Tap the file on your phone:**
   - Open your phone's **Files** or **Downloads** app and tap `fr8x-enterprise-mobile-v2.4.apk`.
3. **If prompted:**
   - Tap **Settings** → Turn ON **"Allow from this source"**.
4. **Tap Install → Open:**
   - The app launches instantly with native bottom tabs, smooth transitions, and offline capability.

---

## 4. How to Rebuild Anytime

To rebuild the APK after making any changes to the mobile app files in `mobile-app/`:
Double-click [`build-apk.bat`](file:///c:/Users/RajatKumarRai/OneDrive%20-%20Cogoport/Documents/fr8x-con/fr8x-android-app/build-apk.bat). It compiles and signs the new APK in 3 seconds.
