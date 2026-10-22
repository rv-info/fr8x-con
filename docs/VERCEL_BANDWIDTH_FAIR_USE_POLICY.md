# VERCEL BANDWIDTH & FAIR-USE INCIDENT POST-MORTEM & PERMANENT POLICY

> **CRITICAL PRODUCTION NOTICE — DO NOT IGNORE**  
> This policy was established following an emergency account pause on Vercel Hobby tier.  
> **A one-time courtesy unblock has been granted by Vercel.** A second violation will result in permanent suspension unless upgraded to Pro.

---

## 1. Official Vercel Support Resolution Notice

> *"Thank you for reaching out and providing the details regarding the remediation steps you have taken.*
> 
> *Your deployments are currently paused because your account exceeded fair-use usage limits on the Hobby plan. You can use a one-time courtesy unblock to resume your deployments and temporarily increase your usage limits by 3x for 30 days.*
> 
> *Please note that this is a **one-time courtesy unblock**. If your account exceeds the usage limits again after the 30-day period, upgrading to the Pro plan will be necessary to obtain higher limits and restore service."*

---

## 2. Root Cause Analysis (Incident Date: October 2026)

### What Happened:
* Multiple Android native APK binaries (~14.3 MB each) were placed directly in the `public/` directory:
  - `public/FR8X-Android-Universal-Release.apk`
  - `public/fr8x-enterprise-mobile-v2.4.apk`
  - `public/fr8x-mobile.apk`
  - `public/fr8x-workspace-debug.apk`
* Floating download buttons on `/login` and `/download` exposed these direct file paths.
* Automated search engine spiders (Googlebot, Bingbot, crawlers) and users repeatedly fetched the 14.3 MB files directly from Vercel's edge origin.
* **Impact:** In less than 48 hours, Fast Origin Transfer / Edge Bandwidth spiked exponentially, exceeding the 100% fair-use limit and triggering an automatic account-wide deployment pause.

---

## 3. Strict Rules: How to NEVER Cause This Error Again

All future contributors, agents, and automated tools **MUST** strictly adhere to the following 5 golden rules:

### RULE 1: ZERO Heavy Binary Assets in `public/`
* **NEVER** place `.apk`, `.aab`, `.zip`, `.tar.gz`, `.dmg`, `.exe`, `.iso`, `.mp4`, or any binary file greater than **1 MB** inside the `public/` directory.
* The `public/` folder is reserved **exclusively** for lightweight web UI assets:
  - Favicons (`favicon.ico`, `favicon.png`)
  - Web manifests (`manifest.json`)
  - Lightweight UI icons and SVG logos (< 500 KB)

### RULE 2: External Offloading for All Downloadable Artifacts
* All mobile app releases, APKs, install packages, and heavy downloads **MUST** be hosted on external zero-cost / high-bandwidth storage:
  1. **Google Drive** (Configured via `NEXT_PUBLIC_GDRIVE_APK_URL`)
  2. **GitHub Releases** (Free, fast, unlimited bandwidth)
  3. **Cloudflare R2** (Zero egress fees)
  4. **Supabase Storage** (Dedicated media buckets)
* In the frontend code, download buttons must point to the external URL with `target="_blank" rel="noopener noreferrer"`. Never serve binary downloads directly from the Next.js server origin.

### RULE 3: Git Tracking Prohibition
* Binary package formats (`*.apk`, `*.aab`, `*.ipa`, `*.exe`) are permanently locked in [`.gitignore`](../.gitignore).
* Any attempt to stage or commit an APK must be blocked immediately.

### RULE 4: Crawler & Bot Guardrails
* Never place direct binary download links on high-traffic, unauthenticated landing/login pages without `rel="nofollow"`.
* Keep `robots.txt` and route metadata headers properly configured so crawlers focus on indexing public content, not media blobs.

### RULE 5: 30-Day Window Vigilance
* The current 3x limit multiplier is active for **30 days only**.
* Following this 30-day period, Vercel will revert to standard Hobby quotas.
* The repository's edge footprint must remain strictly near-zero (standard HTML, JS chunks, and minified CSS).

---

## 4. Remediation Audit Trail (Commit `3ad0aa4`)

| Item | Action Taken | Status |
| :--- | :--- | :--- |
| `public/*.apk` | Deleted all 14.3 MB APK files from web server origin | ✅ Clean |
| Root `.apk` files | Untracked and removed from Git repository | ✅ Clean |
| `app/download/page.tsx` | Switched to external Google Drive URL (`NEXT_PUBLIC_GDRIVE_APK_URL`) | ✅ Clean |
| `app/login/page.tsx` | Removed floating APK download pill and direct APK triggers | ✅ Clean |
| `components/layout/Sidebar.tsx` | Changed direct APK download to standard navigation link | ✅ Clean |
| `.gitignore` | Added permanent block for `*.apk` binaries | ✅ Enforced |
| Cloudflare Adapter | Added `@cloudflare/next-on-pages` and `pages:build` as failover option | ✅ Ready |
