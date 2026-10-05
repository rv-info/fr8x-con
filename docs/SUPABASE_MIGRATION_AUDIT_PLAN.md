# FR8X — Complete Firebase Removal & Supabase Migration Plan

## 1. Full Repository Audit

### Current Architecture Overview
The FR8X platform is a multimodal freight logistics marketplace built with Next.js 14 App Router, TypeScript, and a hybrid backend composed of Firebase Auth, Firestore, Firebase Admin SDK, and a local fallback in `.data/dbms`.

### Complete Inventory of Firebase Components
1. **Packages**:
   - `firebase` (`^12.18.0`)
   - `firebase-admin` (`^14.5.0`)
2. **Configuration & Rules**:
   - `firebase.json`
   - `firestore.rules` (513 lines, defining security rules for 20+ collections and subcollections)
   - `firestore.indexes.json`
   - `storage.rules` (3 buckets: `adCreatives`, `kyc`, `avatars`)
   - `.firebaserc`
3. **Client-side SDK Implementations**:
   - `lib/firebase/client.ts` (`initializeApp`, `getAuth`, `getFirestore`, `getStorage`, `getAnalytics`, `setPersistence`)
   - `lib/firebase/emulator.ts` (`connectAuthEmulator`, `connectFirestoreEmulator`, `connectStorageEmulator`)
   - `lib/firebase/firestore.ts` (2,285 lines of Firestore helper methods, queries, transactions, and listeners)
   - `lib/context/AuthContext.tsx` (`onAuthStateChanged`, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `signInWithCustomToken`, `updateProfile`, `sendPasswordResetEmail`)
   - `lib/godfather/context/GodfatherAuthContext.tsx` (`signInWithEmailAndPassword`, `signOut`)
   - `lib/godfather/context/GodfatherDataContext.tsx` (`approveUserRegistration`, `rejectUserRegistration`, `appendCompanyAudit`)
   - `lib/presence/presenceService.ts` (`db`, `setDoc`, `deleteDoc`)
   - `lib/intelligence/intent.ts` (`db`, `setDoc`, `getDocs`)
   - `lib/network/NetworkSpeedManager.ts` (`db`)
   - `features/rates/services/rateService.ts` (`getRatesFromDB`, `upsertRateInDB`, `deleteRateInDB`, `batchUpsertRatesInDB`, `batchUpdateRatesInDB`)
   - `features/feed/services/feedService.ts` (`getPostsFromDB`, `upsertPostInDB`, `deletePostInDB`)
   - `features/auctions/services/auctionService.ts` (`getAuctionsFromDB`, `upsertAuctionInDB`, `submitBidInDB`)
4. **Server-side SDK & REST Implementations**:
   - `lib/firebase/admin.ts` (`getAdminApp`, `getAdminDb`, `getAdminAuth`, `getAdminStorage`, `createCustomToken`, `verifyIdToken`)
   - `app/api/auth/login/route.ts` (Direct REST call to `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword` and `https://firestore.googleapis.com/v1/...`)
   - `app/api/auctions/bid/route.ts` (`getAdminDb().runTransaction(...)`)
   - `app/api/user/profile/route.ts` (`adminDb.collection('users').doc(...).set(..., { merge: true })`)
   - `app/api/rates/route.ts`, `app/api/auctions/route.ts`, `app/api/feed/route.ts`, `app/api/jobs/route.ts`, `app/api/nexus/route.ts`, `app/api/events/route.ts`, `app/api/presence/route.ts` (dual writes to server DBMS and Firestore)
   - `app/api/firebase/sync/route.ts`
   - `app/api/admin/health/route.ts`
   - `app/api/webhooks/razorpay/route.ts`

---

## 2. Root Cause Analysis: Profile Persistence Bug

### The Problem Description
When a user updates:
- **Phone Number** (`mobile` / `phone`)
- **Job Designation** (`designation` / `position`)
- **Location** (`city`, `state`, `country`, `location`, `address`)
the updated values appear temporarily in the UI, but upon page refresh, re-login, or navigation, the values revert to old, stale, or unknown values.

### Exact Root Causes Identified
1. **UID Dichotomy & Identity Confusion**:
   - There are two conflicting ID spaces: the Firebase Auth random UID (e.g., `e0spoSdD7JV0lqg0kEsEZxBxGJh1`) and the internal application UID (e.g., `u-rajat` or email).
   - In `app/profile/page.tsx`:
     ```ts
     const canonicalUid = (user as any).canonicalUid || (user.uid.startsWith('u-') ? user.uid : (user.email === 'rajat.rai@cogoport.com' ? 'u-rajat' : user.uid)) || 'u-rajat';
     ```
   - When updating the profile, the client writes to `users/{authUid}`, while the server API `/api/user/profile` writes to `serverSecurityStore` keyed by `resolvedTargetUid` (`u-rajat`).
   - When fetching, if a query uses the Firebase Auth UID against a store expecting `u-rajat` (or vice versa), the lookup fails or falls back to default/empty values.

2. **Ephemeral Serverless Storage on Vercel**:
   - `lib/dbms/server-dbms.ts` stores user records in `path.join(process.env.TMPDIR || '/tmp', 'fr8x-dbms', 'dbms', 'users.json')`.
   - On Vercel, serverless function instances are stateless and ephemeral. A write to `/tmp` on one instance is **never shared** with another instance and disappears upon container recycle/cold start.
   - Subsequent `GET /api/user/profile` calls hit different serverless instances that only see initial build-time seed data, immediately clobbering the freshly saved profile.

3. **Competing State Hydration & Race Conditions**:
   - In `lib/context/AuthContext.tsx`:
     - Initial render synchronously loads stale users from `localStorage.getItem('fr8x_all_users_v2')`.
     - In parallel, `useEffect` fires a `fetch('/api/user/profile')`.
     - In parallel, `onAuthStateChanged` fires and fetches `getCanonicalUserProfile(firebaseUser.uid)`.
     - In `app/profile/page.tsx`, **three separate `useEffect` hooks** race against each other on mount:
       - Hook 1 (line 409) fetches `/api/user/profile` and calls `setMobile`, `setDesignation`, etc.
       - Hook 2 (line 749) fetches `/api/user/profile` and calls `updateUser` with cached local storage fallbacks.
       - Hook 3 (line 824) observes `user` from `AuthContext` and overwrites local form state with `user.mobile`, `user.designation`.
     - Whichever asynchronous network call or local storage read resolves last overwrites the component state. If any of the responses contains old data, the freshly saved values are wiped out.

4. **Multi-Source Fragmented Writes**:
   - Writing a profile update touches:
     1. Client Firestore `users/{uid}`
     2. Client Firestore `users/{uid}/profile/main`
     3. Client Firestore `users/{uid}/kyc/main`
     4. Client LocalStorage (`fr8x_user_designation_${uid}`, `fr8x_user_mobile_${uid}`, `fr8x_all_users_v2`)
     5. Server API `/api/user/profile` -> `serverSecurityStore` -> `/tmp/.../users.json`
     6. Server Admin Firestore `users/{uid}`
   - Any failure, latency difference, or partial write among these 6 paths causes desynchronization.

---

## 3. The Supabase Architecture & Permanent Fix

### Core Architectural Decisions
1. **Single Source of Truth**:
   - `auth.users.id` (UUID generated by Supabase Auth) is the **single, immutable identity reference**.
   - `public.profiles` table with foreign key `id REFERENCES auth.users(id) ON DELETE CASCADE` is the **authoritative store** for all application profile data (phone, designation, city, state, country, company, address, visual assets).
   - No duplicate storage in ephemeral `/tmp` files.
   - No scattered subcollections.
   - No conflicting local storage mirrors.

2. **Standard Supabase Next.js App Router Architecture**:
   - `@supabase/ssr` with Cookie-based session storage.
   - `lib/supabase/client.ts` for browser-side interactions (`createBrowserClient`).
   - `lib/supabase/server.ts` for Server Components, Server Actions, and Route Handlers (`createServerClient`).
   - `middleware.ts` for Edge session refresh and route protection.

3. **Deterministic Profile Update Flow**:
   1. User edits field (Phone, Designation, Location) in form.
   2. Input validated client-side.
   3. Update sent directly to Supabase (`supabase.from('profiles').update(...).eq('id', user.id).select().single()`).
   4. Database confirms write with returned row.
   5. UI state updated **exclusively** from the confirmed database response.
   6. On page reload / re-login, Supabase SSR loads the row directly from PostgreSQL.

---

## 4. PostgreSQL Relational Database Schema

### Tables & Relationships
1. **`public.profiles`**:
   - `id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE`
   - `email TEXT NOT NULL UNIQUE`
   - `first_name TEXT`
   - `last_name TEXT`
   - `display_name TEXT`
   - `phone TEXT`
   - `mobile TEXT`
   - `designation TEXT`
   - `company_name TEXT`
   - `company_id TEXT`
   - `department TEXT`
   - `city TEXT`
   - `state TEXT`
   - `country TEXT DEFAULT 'India'`
   - `formatted_address TEXT`
   - `postal_code TEXT`
   - `location TEXT`
   - `timezone TEXT DEFAULT 'Asia/Kolkata'`
   - `avatar_url TEXT`
   - `company_logo_url TEXT`
   - `role TEXT DEFAULT 'user'`
   - `plan TEXT DEFAULT 'trial'`
   - `has_golden_tick BOOLEAN DEFAULT FALSE`
   - `is_verified BOOLEAN DEFAULT FALSE`
   - `status TEXT DEFAULT 'active'`
   - `experiences JSONB DEFAULT '[]'::jsonb`
   - `educations JSONB DEFAULT '[]'::jsonb`
   - `certifications JSONB DEFAULT '[]'::jsonb`
   - `privacy_settings JSONB DEFAULT '{}'::jsonb`
   - `gstn TEXT`
   - `pan TEXT`
   - `iec TEXT`
   - `mto TEXT`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`

2. **`public.companies`**:
   - `id TEXT PRIMARY KEY` (e.g. `CMP-COGOPORT-001`, `CMP-RAIVEGA-01`)
   - `legal_name TEXT NOT NULL`
   - `trade_name TEXT`
   - `country TEXT DEFAULT 'India'`
   - `state TEXT`
   - `city TEXT`
   - `postal_code TEXT`
   - `registered_address TEXT`
   - `gstn TEXT`
   - `pan TEXT`
   - `iec TEXT`
   - `mto TEXT`
   - `status TEXT DEFAULT 'verified'`
   - `verified BOOLEAN DEFAULT TRUE`
   - `member_count INT DEFAULT 1`
   - `primary_contact_name TEXT`
   - `primary_contact_email TEXT`
   - `primary_contact_phone TEXT`
   - `admin_notes JSONB DEFAULT '[]'::jsonb`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`

3. **`public.rates`**:
   - `id TEXT PRIMARY KEY` (e.g. `COG-1710-0001`)
   - `sp TEXT NOT NULL`
   - `line TEXT NOT NULL`
   - `por TEXT NOT NULL`
   - `pol TEXT NOT NULL`
   - `pod TEXT NOT NULL`
   - `fpod TEXT NOT NULL`
   - `rate20 NUMERIC NOT NULL`
   - `rate40 NUMERIC NOT NULL`
   - `rate40hc NUMERIC NOT NULL`
   - `currency TEXT DEFAULT 'USD'`
   - `type TEXT DEFAULT 'Direct Spot'`
   - `ft INT DEFAULT 14`
   - `validity DATE NOT NULL`
   - `transit_time TEXT`
   - `owner_uid UUID REFERENCES auth.users(id)`
   - `created_by UUID REFERENCES auth.users(id)`
   - `status TEXT DEFAULT 'active'`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`

4. **`public.auctions`**:
   - `id TEXT PRIMARY KEY` (e.g. `RA-2026-9083`)
   - `title TEXT NOT NULL`
   - `rfq_id TEXT`
   - `creator_uid UUID REFERENCES auth.users(id)`
   - `creator_name TEXT`
   - `creator_company TEXT`
   - `auction_type TEXT DEFAULT 'Specific bidder'`
   - `start_date DATE`
   - `start_time TEXT`
   - `duration_minutes INT DEFAULT 120`
   - `end_date_time TIMESTAMPTZ`
   - `timezone TEXT DEFAULT 'Asia/Kolkata'`
   - `status TEXT DEFAULT 'Draft'`
   - `competition_ceiling NUMERIC`
   - `shipment JSONB NOT NULL DEFAULT '{}'::jsonb`
   - `containers JSONB NOT NULL DEFAULT '[]'::jsonb`
   - `origin_charges JSONB DEFAULT '{}'::jsonb`
   - `destination_charges JSONB DEFAULT '{}'::jsonb`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`
   - `updated_at TIMESTAMPTZ DEFAULT NOW()`

5. **`public.auction_bids`**:
   - `id TEXT PRIMARY KEY`
   - `auction_id TEXT REFERENCES public.auctions(id) ON DELETE CASCADE`
   - `bidder_uid UUID REFERENCES auth.users(id)`
   - `bidder_name TEXT`
   - `bidder_company TEXT`
   - `amount NUMERIC NOT NULL`
   - `currency TEXT DEFAULT 'USD'`
   - `details JSONB DEFAULT '{}'::jsonb`
   - `created_at TIMESTAMPTZ DEFAULT NOW()`

6. **`public.posts`** & **`public.comments`**:
   - Feed posts and comments with author UUID, content, attachments, and timestamps.

7. **`public.audit_logs`**:
   - Immutable audit logging for security, KYC, and corporate actions.

### Row Level Security (RLS)
- **`profiles`**:
  - `SELECT`: Authenticated users can view profiles (`auth.role() = 'authenticated'`).
  - `UPDATE`: Users can ONLY update their own profile (`auth.uid() = id`).
  - `INSERT`: Users can ONLY insert their own profile (`auth.uid() = id`).
- **`rates`**:
  - `SELECT`: All authenticated users can view active rates.
  - `INSERT` / `UPDATE` / `DELETE`: Only the owner (`auth.uid() = owner_uid` or platform admins) can mutate rates.
- **`auctions`**:
  - `SELECT`: Authenticated participants can view auctions.
  - `INSERT` / `UPDATE`: Creator (`auth.uid() = creator_uid`) or admin.
- **`auction_bids`**:
  - `SELECT`: Auction creator can view bids; bidders can view their own bids.
  - `INSERT`: Verified authenticated bidders.

---

## 5. Storage Buckets & Policies
1. **`avatars`** (Public read, authenticated owner upload up to 5MB, image types only)
2. **`company-logos`** (Public read, company admin upload up to 5MB, image types only)
3. **`documents`** (Private read/write for KYC & compliance files, restricted to document owner & admin)
4. **`ad-creatives`** (Public read, verified advertiser upload up to 2MB)
