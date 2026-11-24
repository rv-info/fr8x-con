# FR8X — MASTER FEATURE EVIDENCE REGISTER & AUDIT MATRIX

> **PURPOSE**: Comprehensive verification ledger linking every documented marketing, functional, and commercial claim directly to verified repository source files, API routes, database models, and test execution scripts.

---

## 1. COMPREHENSIVE ARCHITECTURAL AUDIT MATRIX

| # | Feature / Capability | Frontend Interface | Backend API / Controller | Database Schema / Store | Architectural Proof | Status |
|---|----------------------|--------------------|--------------------------|-------------------------|---------------------|--------|
| **1** | **Availability Status Popover** | `components/layout/NetworkStatusPill.tsx` | Client State Engine | `localStorage` | UI/UX Popover Test Suite | **VERIFIED LIVE** |
| **2** | **Multi-Currency Converter** | `components/layout/TopBar.tsx` (Lines 1770–1950) | `lib/context/CurrencyContext.tsx` | Cross-Tab Broadcast Channel | `scripts/verify-all-gates.ts` | **VERIFIED LIVE** |
| **3** | **Global Currency Detection** | `components/ui/PaymentCheckoutModal.tsx` | `lib/billing/currency-detector.ts` | Edge Headers (`cf-ipcountry`) | `verify-global-billing-engine.ts` | **VERIFIED LIVE** |
| **4** | **15-Min Quote Locking** | `components/ui/PaymentCheckoutModal.tsx` | `lib/billing/billing-engine.ts` | Cryptographic HMAC Store | `verify-global-billing-engine.ts` | **VERIFIED LIVE** |
| **5** | **Godfather Free Access Engine** | `app/godfather/commerce/fees/page.tsx` | `lib/billing/free-access-manager.ts` | Server Config (`billing-config.json`) | `verify-global-billing-engine.ts` | **VERIFIED LIVE** |
| **6** | **Unified Checkout Endpoint** | `components/ui/PaymentCheckoutModal.tsx` | `app/api/billing/checkout/route.ts` | Supabase `transactions` Table | API Route Test Suite | **VERIFIED LIVE** |
| **7** | **B2B Intelligence Feed** | `app/feeds/page.tsx` | `app/api/posts/route.ts` | Supabase `posts` Table | `verify-all-gates.ts` | **VERIFIED LIVE** |
| **8** | **Structured Table Editor** | `components/ui/RichTextEditor.tsx` | Client DOM Parser | Supabase `posts` (HTML Payload) | Table Insertion Verification | **VERIFIED LIVE** |
| **9** | **Sponsored Feed Ads & Lightbox** | `app/feeds/page.tsx` (Sidebar) | `app/api/ads/route.ts` | Supabase `ads` Table | Feed Layout Verification | **VERIFIED LIVE** |
| **10** | **Rate Intelligence Matrix** | `app/rates/page.tsx` | `app/api/rates/route.ts` | Supabase `rates` Table | `verify-all-gates.ts` | **VERIFIED LIVE** |
| **11** | **Rates Editor Modal** | `components/rates/RatesEditorModal.tsx` | `app/api/rates/route.ts` | Supabase `rates` Table | Modal Event Handler Check | **VERIFIED LIVE** |
| **12** | **Reverse Container Auctions** | `app/auctions/page.tsx` | `app/api/auctions/route.ts` | Supabase `auctions` Table | `verify-all-gates.ts` | **VERIFIED LIVE** |
| **13** | **Spot Bidding Room (Timer)** | `app/auctions/[id]/page.tsx` | `app/api/auctions/[id]/route.ts` | Supabase `bids` Table | Tender Lifecycle Test | **VERIFIED LIVE** |
| **14** | **Trade Careers Recruitment Board** | `app/jobs/page.tsx` | `app/api/jobs/route.ts` | Supabase `jobs` Table | Recruitment Flow Check | **VERIFIED LIVE** |
| **15** | **Recruiter Candidate Manager** | `app/jobs/page.tsx` (Applications Modal) | `app/api/jobs/applications/route.ts` | Supabase `job_applications` Table | Application Test Suite | **VERIFIED LIVE** |
| **16** | **Enterprise Logistics Directory** | `app/network/page.tsx` | `app/api/users/route.ts` | Supabase `profiles` Table | `verify-all-gates.ts` | **VERIFIED LIVE** |
| **17** | **Freight Passport & Statutory KYC** | `components/ui/ProfilePreviewModal.tsx` | `app/api/profile/route.ts` | Supabase `companies` Table | Profile Preview Suite | **VERIFIED LIVE** |
| **18** | **Compliance & Blacklist Nexus** | `app/nexus/page.tsx` | `app/api/nexus/route.ts` | Supabase `nexus` Table | Compliance Query Check | **VERIFIED LIVE** |

---

## 2. INTEGRATION BOUNDARIES & COMMERCIAL HONESTY DISCLOSURE

To maintain strict truth-in-advertising and investor credibility, the following technical boundaries are explicitly recorded:

1. **ERP Replacement Boundary**: FR8X is **NOT** a monolithic internal accounting/ERP system. It does not generate warehouse pick-lists or replace SAP/CargoWise customs declaration modules. It is an **inter-company commercial network, spot freight exchange, tender platform, and talent discovery hub**.
2. **Rate Feed Sourcing**: Rate intelligence is populated through forwarder community contributions, publisher tariff submissions, and verified carrier listings. FR8X does not claim non-consensual automated screen-scraping of private shipping line portals.
3. **Carrier Slot Guarantees**: Slot validity on reverse tender awards is governed by standard forwarder commercial terms (48-hour container slot lock); it does not bypass statutory maritime roll-over occurrences caused by force majeure or vessel blank sailings.
4. **Third-Party Telematics**: Availability status reflects real-time platform presence and active operator responsiveness, rather than GPS vessel AIS tracking.
