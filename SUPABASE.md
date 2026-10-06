# FR8X CON — Supabase Database Architecture
**Last Updated:** 2026-10-05
**Project:** `fr8x-con` (https://haarbaqeuuirwkhmefev.supabase.co)
**Architecture:** Next.js → Supabase Auth + PostgreSQL + Supabase Storage → Vercel

---

## How to Apply the Schema (First-Time Setup)

> **IMPORTANT:** The schema is applied by pasting the master migration into the Supabase SQL Editor.

### Steps
1. Open the [Supabase Dashboard](https://app.supabase.com) → Select project `haarbaqeuuirwkhmefev`
2. Go to **SQL Editor** → Click **New Query**
3. Open and copy the entire contents of `supabase/migrations/20261005000010_fr8x_master_schema.sql`
4. Paste into the SQL Editor → Click **Run**
5. Verify: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`

**Expected:** 16 tables listed (audit_logs, auction_bids, auctions, cases, comments, companies, events, intents, jobs, posts, presence, profiles, rates, reviews, transactions, verifications).

---

## Table Summary

| # | Table | Purpose |
|---|---|---|
| 1 | `profiles` | User identity, KYC, preferences — linked 1:1 to auth.users |
| 2 | `companies` | Freight companies, forwarders, carriers |
| 3 | `rates` | Spot ocean freight rate cards |
| 4 | `auctions` | Reverse freight bidding (RFQ marketplace) |
| 5 | `auction_bids` | Bids on reverse auctions |
| 6 | `posts` | Social feed posts |
| 7 | `comments` | Comments on posts |
| 8 | `jobs` | Logistics job postings |
| 9 | `cases` | Support & dispute tickets |
| 10 | `transactions` | Razorpay payments & subscription invoices |
| 11 | `reviews` | Company & partner feedback ratings |
| 12 | `events` | Telemetry & platform activity log |
| 13 | `intents` | User logistics search preferences |
| 14 | `presence` | Real-time online/offline state |
| 15 | `verifications` | Email OTP challenge tokens |
| 16 | `audit_logs` | Immutable compliance audit trail |

---

## Authentication Architecture

`
User → Supabase Auth (auth.users)
         ↓ INSERT trigger
    public.profiles (auto-provisioned via handle_new_auth_user())
         ↓
    @supabase/ssr session cookie
         ↓
    middleware.ts → updateSession() → validates session on every request
         ↓
    API routes / Server Components use auth.uid() from session
`

- No Firebase. No passwords in PostgreSQL application tables.
- Auth credentials live exclusively in `auth.users` (Supabase-managed).
- Profile is auto-created by the `on_auth_user_created` trigger when a user signs up.
- Profile updates use `lib/supabase/db.ts → profileService.updateProfile()`.

---

## RLS Policy Summary

| Table | anon | authenticated | service_role |
|---|---|---|---|
| `profiles` | none | SELECT all; INSERT/UPDATE own | full |
| `companies` | none | SELECT only | full |
| `rates` | none | SELECT active+own; write own | full |
| `auctions` | none | SELECT all; write own | full |
| `auction_bids` | none | SELECT if bidder or creator; INSERT | full |
| `posts` | none | SELECT all; write own | full |
| `comments` | none | SELECT all; INSERT/DELETE own | full |
| `jobs` | none | SELECT only | full |
| `cases` | none | SELECT own; INSERT | full |
| `transactions` | none | SELECT own | full |
| `reviews` | none | SELECT all; INSERT | full |
| `events` | INSERT (telemetry) | INSERT | full |
| `intents` | none | ALL own | full |
| `presence` | none | SELECT all; write own | full |
| `verifications` | none | none (server-only) | full |
| `audit_logs` | none | INSERT; SELECT for admins | full |

---

## Key Column Conventions

| Concept | Column | Type |
|---|---|---|
| Auth user ID (FK) | `id` (profiles), `creator_uid`, `owner_uid`, `author_uid`, `bidder_uid`, `actor_uid` | UUID |
| Legacy short ID | `uid` | TEXT nullable |
| Freight ports | `por`, `pol`, `pod`, `fpod` | TEXT (LOCODE) |
| Company tax ID | `gstn` (canonical) | TEXT |
| Auto-timestamp | `created_at`, `updated_at` | TIMESTAMPTZ |

**BREAKING CHANGE (fixed):** Do NOT use `origin_port`, `destination_port`, `author_id` (as FK),
`bidder_id`, or `creator_id` — these were old mismatches that have been corrected in
`lib/supabase/types.ts` and all `lib/db/*.ts` modules.

---

## Data Access Layer

`
lib/
├── supabase/
│   ├── client.ts       — Browser-safe client (NEXT_PUBLIC_ keys only)
│   ├── server.ts       — Server client (cookies + service role)
│   ├── middleware.ts   — Session refresh for Edge middleware
│   ├── db.ts           — profileService (getProfile, updateProfile)
│   ├── types.ts        — TypeScript interfaces matching SQL exactly
│   └── audit.ts        — AuditLogger.log() / logProfileChange()
└── db/
    ├── users.ts        — getUserById, getUserByEmail, createUser, updateUser
    ├── companies.ts    — getCompanies, searchCompanies, saveCompany
    ├── rates.ts        — getRates, saveRate, bulkSaveRates, deleteRate
    ├── auctions.ts     — getAuctions, saveAuction, saveBid, cancelAuction
    ├── posts.ts        — getPosts, savePost, deletePost
    ├── jobs.ts         — getJobs, saveJob, deleteJob
    ├── cases.ts        — getCases, saveCase
    ├── transactions.ts — getTransactions, saveTransaction
    ├── reviews.ts      — getReviews, saveReview
    ├── verifications.ts — saveVerification, markVerificationUsed
    └── index.ts        — barrel export (usersDb, companiesDb, ratesDb …)
`

---

## Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client + Server | Anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Bypasses RLS — NEVER use NEXT_PUBLIC_ prefix |

---

## Storage Buckets

| Bucket | Public | Max Size |
|---|---|---|
| `avatars` | Yes | 5 MB |
| `company-logos` | Yes | 5 MB |
| `documents` | No | 10 MB |
| `ad-creatives` | Yes | 2 MB |

---

## Local Development

`ash
npm install
cp .env.example .env.local   # fill NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
`

No local emulator required — dev connects to hosted Supabase project directly.

---

## Deployment (Vercel)

1. Push to `main` → Vercel auto-deploys
2. Ensure Vercel Environment Variables include all three Supabase keys
3. `SUPABASE_SERVICE_ROLE_KEY` must be set as a **Server** (not preview/client) env var

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| "No tables in schema" | Migration not applied | Paste `20261005000010_fr8x_master_schema.sql` into SQL Editor and run |
| 401 on API calls | Expired/missing session | Check `middleware.ts` and `@supabase/ssr` updateSession setup |
| Profile not loading after login | profiles row missing | Verify `on_auth_user_created` trigger exists in Supabase Dashboard → Database → Functions |
| `new row violates RLS` | Wrong owner uid | Confirm `auth.uid()` matches the record's owner column |
| `column X does not exist` | Old column name in code | Reference `lib/supabase/types.ts` for exact column names |
| `SUPABASE_SERVICE_ROLE_KEY missing` | Not in Vercel env | Add in Vercel → Settings → Environment Variables (Server) |
