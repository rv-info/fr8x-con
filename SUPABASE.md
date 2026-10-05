# FR8X — Supabase Architecture & PostgreSQL Engineering Standard

> **Production Domain:** `https://con.fr8x.in`  
> **Supabase Project:** `fr8x-con` (`https://haarbaqeuuirwkhmefev.supabase.co`)  
> **Target Architecture:** GitHub → Vercel → Next.js App Router → Supabase Auth → Supabase PostgreSQL → Supabase Storage  

---

## 1. Executive Summary & Objective

FR8X has transitioned completely from Google Cloud Firebase (Authentication, Cloud Firestore, Cloud Storage) to **Supabase** as the single authoritative backend.

This document serves as the **mandatory architectural contract** for all backend engineering, database operations, security policies, and AI coding agents working on the FR8X codebase.

---

## 2. Core Architectural Principles

1. **Separation of Concerns:**
   - **Supabase Auth (`auth.users`)**: Sole authority for identity, credentials, email verification, and session tokens.
   - **PostgreSQL (`public.profiles`)**: Sole authority for application profile data, business fields, organization hierarchy, KYC, and settings.
   - **No Competing Authoritative Copies**: Never store authoritative mutable profile data in JWT metadata, `localStorage`, `sessionStorage`, or in-memory caches.

2. **Immutable Identity Reference:**
   - Always link records to the authenticated Supabase user UUID (`auth.uid()`).
   - Never use email addresses or client-generated random IDs as foreign keys or primary keys.

3. **Database-Enforced Security:**
   - Row Level Security (RLS) is enabled on **100% of tables**.
   - Client requests are authenticated by Supabase session tokens, and PostgreSQL evaluates `auth.uid()` directly. Client-provided user IDs in request bodies are never trusted for authorization.

4. **Deterministic CRUD & Domain Flow:**
   - Standard CRUD operations utilize `lib/supabase/crud.ts`.
   - Domain operations follow the pipeline:  
     `Client UI → Domain Mutation → Validation/Normalization → PostgreSQL Write → Audit Log → Confirmed DB Result → UI Update`.
   - The UI updates **only** from the confirmed database response. Optimistic updates without confirmation are forbidden on sensitive profile or financial fields.

---

## 3. Critical Bug Diagnosis & Fix: Profile Persistence Rollback

### The Problem
Users experienced an issue where changes to **Phone Number**, **Designation**, or **Location** appeared to save temporarily, but later reverted to old values upon page reload, navigation, or re-authentication.

### Root Cause Analysis
A deep forensic investigation revealed four compounding defects in the previous architecture:
1. **UID Dichotomy:** The application maintained three competing identity representations: Firebase random UIDs (`4k8...`), local DBMS canonical IDs (`u-rajat`), and email strings. When an update was made, it wrote to one ID key while subsequent reads fetched from another.
2. **Ephemeral Serverless `/tmp` Storage:** Server API routes wrote to `/tmp/fr8x-dbms/` on Vercel lambda instances. In serverless environments, `/tmp` instances are ephemeral and unshared, causing subsequent requests hitting different lambda instances to read stale default data.
3. **Stale `localStorage` Hydration on Mount:** In `app/profile/page.tsx`, component state was initialized from stale browser `localStorage` keys (`fr8x_user_phone_${uid}`, `fr8x_user_designation_${uid}`).
4. **Accidental Write-Back Race Conditions:** `app/profile/page.tsx` had multiple `useEffect` hooks triggering `updateUser()` on mount. If network latency delayed the cloud fetch, the initial mount effect wrote the stale `localStorage` values back to the server, permanently clobbering the user's fresh database edits.

### The Rectification
1. **Single Source of Truth:** `public.profiles` in Supabase PostgreSQL is the sole authoritative record for all profile fields.
2. **Strict Normalized Updates:** `lib/supabase/mutations.ts` (`DomainMutations.updateProfile`) normalizes inputs via `lib/supabase/validation.ts`, updates `public.profiles` using `WHERE id = auth.uid()`, confirms the write, logs the change to `public.audit_logs`, and returns the confirmed row.
3. **Elimination of Destructive Mount Effects:** Removed automatic `updateUser()` write-back effects on page mount.
4. **Fresh Session Hydration:** Profile state on page load is fetched directly from Supabase via `profileService.getProfile(user.id)`, completely bypassing stale browser caches.

---

## 4. PostgreSQL Relational Schema

Migrations are located in `supabase/migrations/`:
- `20261005000000_fr8x_initial_schema.sql` (Tables, Constraints, Indexes, Functions, RLS)
- `20261005000001_seed_production_data.sql` (Authoritative Production Seed Data)

### Entity Architecture
```
auth.users (Supabase Auth)
  │
  ├── 1:1 ── public.profiles (User details, KYC, contacts)
  │            │
  │            └── N:1 ── public.companies (Enterprise KYC, PAN, GSTIN)
  │
  ├── 1:N ── public.rates (Freight rates, 20DV, 40HC, shipping lines)
  │
  ├── 1:N ── public.auctions (Spot auctions, RFQs, container volume)
  │            │
  │            └── 1:N ── public.auction_bids (Bids, carrier routing, charges)
  │
  ├── 1:N ── public.posts (Feed posts, market updates)
  │            │
  │            └── 1:N ── public.comments (Discussions, replies)
  │
  └── 1:N ── public.audit_logs (Immutable audit trail, before/after snapshots)
```

---

## 5. Row Level Security (RLS) Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `public.profiles` | Public (authenticated & directory lookups) | Owner (`auth.uid() = id`) or Trigger | Owner (`auth.uid() = id`) | Admin only |
| `public.companies` | All authenticated users | Authenticated users | Company members / Admin | Admin only |
| `public.rates` | All active (`is_active = true`) | Rate owner (`auth.uid() = created_by`) | Rate owner (`auth.uid() = created_by`) | Rate owner (`auth.uid() = created_by`) |
| `public.auctions` | All active auctions | Verified members | Auction creator (`auth.uid() = creator_id`) | Auction creator |
| `public.auction_bids` | Auction participants & creator | Verified bidders (`auth.uid() = bidder_id`) | Bidder (prior to close) | Admin only |
| `public.posts` | Public published posts | Authenticated author (`auth.uid() = author_id`) | Author | Author or Admin |
| `public.comments` | Public on published posts | Authenticated author | Author | Author or Admin |
| `public.audit_logs` | User's own logs & Admins | System / Authenticated | Read-only (FORBIDDEN) | Read-only (FORBIDDEN) |

---

## 6. Supabase Storage Architecture

Storage buckets are configured with strict RLS policies in `lib/supabase/storage.ts`:

1. **`avatars` (Public Read, Owner Write):**
   - Max file size: 5MB
   - MIME types: `image/jpeg`, `image/png`, `image/webp`
   - Path convention: `${userId}/avatar.${ext}`
2. **`company-logos` (Public Read, Verified Member Write):**
   - Max file size: 5MB
   - MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`
   - Path convention: `${companyId}/logo.${ext}`
3. **`documents` (Private, Strict Participant Access):**
   - Max file size: 25MB
   - MIME types: `application/pdf`, `image/jpeg`, `image/png`
   - Access via signed URLs with 15-minute expiration.

---

## 7. Client & Service Module Map

All Supabase integration files reside in `lib/supabase/`:

- **`client.ts`**: Browser client singleton (`createBrowserClient` from `@supabase/ssr`).
- **`server.ts`**: Server-side client (`createServerClient`) and Service Role admin client (`getSupabaseAdminClient`).
- **`crud.ts`**: Type-safe generic repository (`CrudRepository<T>`) for standard CRUD operations.
- **`types.ts`**: Authoritative TypeScript types matching PostgreSQL tables (`ProfileRow`, `RateRow`, `AuctionRow`, etc.).
- **`errors.ts`**: Centralized error hierarchy (`ValidationError`, `AuthenticationError`, `AuthorizationError`, `DatabaseError`).
- **`validation.ts`**: Normalization and validation for phone, designation, and location.
- **`authorization.ts`**: Identity verification and role assertion helpers (`requireUser`, `requireOwnership`, `requireRole`).
- **`queries.ts`**: Centralized read domain queries (`DomainQueries`).
- **`mutations.ts`**: Centralized write domain mutations (`DomainMutations`).
- **`pagination.ts`**: Offset and cursor pagination helpers (`getPaginationRange`, `buildPaginatedResult`).
- **`retry.ts`**: Exponential backoff retry handler (`withRetry`) for transient network errors.
- **`cache.ts`**: In-memory cache (`referenceCache`) strictly reserved for static lookup tables (never used for mutable profiles).
- **`audit.ts`**: Structured audit trail logger (`AuditLogger.log`, `AuditLogger.logProfileChange`).
- **`transactions.ts`**: Multi-step transaction and stored procedure invoker (`TransactionManager.executeRpc`).
- **`db.ts`**: Domain services (`profileService`, `rateDbService`, `auctionDbService`, `postDbService`).
- **`storage.ts`**: Cloud storage upload/download service (`storageService`).

---

## 8. Development & AI Agent Guidelines

1. **No Raw Queries in React Components:** Never instantiate `createClient()` directly inside JSX components to run ad-hoc queries. Always route through domain services (`profileService`, `rateDbService`, etc.) or `lib/supabase/crud.ts`.
2. **Never Expose Secrets:** Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are allowed in browser code. `SUPABASE_SERVICE_ROLE_KEY` must only exist in server-side API routes or background functions.
3. **Check confirmed results:** Every database write must inspect the returned record or error. Never display a "Saved" toast notification without confirming the PostgreSQL response.
4. **No Firebase Imports:** Any attempt to re-introduce `firebase`, `firebase-admin`, `getFirestore`, or `onSnapshot` violates the architecture.
