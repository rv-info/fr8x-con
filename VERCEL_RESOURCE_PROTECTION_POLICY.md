# VERCEL RESOURCE PROTECTION & QUOTA DEFENSE POLICY
## FR8X Enterprise Production Engineering Standard

> **POLICY STATUS**: MANDATORY & PERMANENTLY ENFORCED  
> **APPLICABILITY**: All Engineers, Architects, Contributors, CI/CD Pipelines, and AI Coding Agents  
> **TARGET INFRASTRUCTURE**: Vercel (Edge & Fluid Serverless Compute), Next.js (App Router), Supabase (PostgreSQL 15+ / PostgREST / GoTrue / Realtime)  
> **INITIAL INCIDENT TRIGGER**: Vercel Production Quota Exhaustion Alert ("Exceeded Free Resources"):
> - **Fluid Active CPU**: 12h 39m consumed against a displayed 4h threshold (316% quota breach)
> - **Fluid Provisioned Compute**: 990.3 GB-Hrs consumed against a displayed 360 GB-Hrs allowance (275% quota breach)
> - **Function Invocations**: 494,000 invocations consumed (~50% of allowance)
> - **CDN Edge Requests**: 410,000 requests consumed
> - **Historical Precedent**: Vercel Bandwidth Fair-Use courtesy unblock (APK binary edge egress) on a 30-day 3x multiplier.

---

## 1. MANDATORY ENGINEERING RULE

```
========================================================================================
   NO FEATURE, CODE CHANGE, API ENDPOINT, DATABASE QUERY, BACKGROUND JOB, OR
   THIRD-PARTY INTEGRATION MAY BE DEPLOYED IF IT INTRODUCES UNBOUNDED RESOURCE
   CONSUMPTION OR BYPASSES ESTABLISHED RESOURCE PROTECTION CONTROLS.
========================================================================================
```

1. **Zero-Unbounded Deployment Principle**: Every network request, computational block, database query, rendering cycle, polling mechanism, and scheduled execution must have an explicit, mathematically provable, and programmatically enforced upper bound.
2. **Safeguard First Requirement**: When an architectural safeguard is missing, the responsible engineer or coding agent must implement it before deployment or document the exact blocker and halt the release of the affected code.
3. **Non-Degradation Mandate**: Under no circumstances may an engineer or AI agent weaken, remove, disable, or bypass existing security, authorization, rate-limiting, resource-control, or observability protections merely to make a build, test, or local demonstration pass.

---

## 2. PROBLEM ANALYSIS: SNAPSHOT VS. PERMANENT REALITY

The observed figures (12h 39m CPU, 990.3 GB-Hrs, 494K invocations) represent a point-in-time snapshot. Actual quotas and thresholds vary by Vercel plan (Hobby vs. Pro vs. Enterprise), billing cycles, account multipliers, and active promotions. 

In Vercel's Fluid Compute architecture:
$$\text{Provisioned GB-Hrs} = \left(\frac{\text{Configured Memory (MB)}}{1024}\right) \times \text{Execution Duration (Hours)}$$

Given 494,000 invocations and 990.3 GB-Hrs consumed with default 1024 MB memory allocation:
$$\text{Average Execution Duration} = \frac{990.3 \times 3600 \text{ seconds}}{494,000 \text{ invocations}} \approx 7.21 \text{ seconds/invocation}$$

An average duration of **7.21 seconds** across half a million serverless invocations indicates severe, systemic resource leaks:
- Long-running, unindexed full-table database scans in Supabase.
- Unbounded in-memory iterations (e.g., global city searches scanning 150,000 records synchronously in Node.js).
- Aggressive client-side polling loops (pinging every 18–45 seconds, presence heartbeats, unconstrained notification queries).
- External network calls lacking tight timeouts.
- Dynamic route flags (`force-dynamic`) applied to completely static datasets without HTTP/CDN caching.

---

## 3. CORE POLICY SECTIONS

### A. Resource Consumption Prevention

Every potentially expensive operation across the application stack must adhere to the following strict boundaries:

1. **CPU-Intensive Synchronous Operations**:
   - Synchronous processing within a Next.js Serverless or Edge function must complete in **< 150 ms**.
   - Heavy dataset filtering, string searching, or combinatorial calculations across > 1,000 elements must not execute on raw arrays in Node.js memory. Such operations must be pushed to PostgreSQL indexed queries (`pg_trgm`, `GIN`, full-text search) or pre-indexed lookup maps.
   - Global city/location searches (such as `lib/geo/city-service.ts`) must never iterate through all 250 countries and 150,000 cities in memory per request. Lookups must use pre-computed trie structures, indexed database queries, or client-side lazy loading.

2. **Serverless Function Duration Caps**:
   - All API routes and Server Actions must specify a deterministic maximum duration:
     ```ts
     export const maxDuration = 10; // Maximum 10 seconds for standard APIs
     ```
   - Heavy background jobs or batch exports must never run inside synchronous HTTP request-response cycles. They must be split into paginated chunks or delegated to asynchronous workers.

3. **Loops, Recursion, and Retries**:
   - Infinite loops, uncontrolled recursion, and unbounded `while(true)` loops are strictly prohibited.
   - Any retry loop must define:
     - `MAX_RETRIES` (strictly $\le 3$).
     - Exponential backoff with jitter: $T_{\text{wait}} = \min(T_{\max}, T_{\text{base}} \times 2^{\text{attempt}}) \pm \text{jitter}$.
     - Explicit abort signals tied to request timeouts.

4. **Unbounded Database Queries & Full-Table Scans**:
   - `SELECT *` without an explicit `LIMIT` clause is strictly prohibited on all tables.
   - Every read query against `posts`, `jobs`, `rates`, `auctions`, `cases`, `profiles`, `transactions`, and `presence` must specify a bounded `LIMIT` ($\le 50$ default, $\le 100$ absolute maximum).
   - Functions like `getAllPresence()` or `getJobs()` that read entire tables into memory are strictly forbidden.

5. **Supabase Round-Trip Minimization**:
   - Avoid N+1 query patterns. When fetching relational data (e.g., profiles for connection lists), utilize PostgreSQL foreign-key joins in PostgREST (e.g., `.select('*, profiles:connected_to(...)')`) or database views.
   - Batch database operations into single multi-row `upsert` or `insert` transactions instead of executing sequential `await` calls in loops.

6. **React Server Component (RSC) & SSR Optimization**:
   - Do not perform dynamic server-side data fetching for data that can be cached statically or loaded on the client via SWR/React Query.
   - Use `generateStaticParams` for predictable dynamic routes.
   - Isolate personalized user data to authenticated client boundaries or edge-cached route handlers.

7. **Client-Side Polling & Refetching Guardrails**:
   - **No aggressive polling**: No client component may poll an API endpoint at an interval under **60 seconds**.
   - Network latency checks (such as `NetworkSpeedManager.ts`) must **never** ping dynamic serverless routes (`/api/ping`) on 18-second timers. Use browser-native `navigator.onLine`, connection change listeners (`navigator.connection.addEventListener('change')`), or static 204 Edge assets with CDN caching.
   - Presence heartbeats must be throttled to $\ge 120$ seconds and must pause immediately when `document.visibilityState === 'hidden'`.
   - Multi-tab synchronization must use `BroadcastChannel` to elect a single leader tab so that only **one tab** sends network requests per user.

8. **Middleware & Proxy Overhead**:
   - Middleware runs on every matched route. The `matcher` in `middleware.ts` must exclude all static assets, images, public favicons, manifests, and immutable bundles.
   - Edge middleware must **never** perform blocking external network round-trips to Supabase Auth on public requests where no session cookies exist.

9. **Heavy Binary & File Processing**:
   - Zero binary files > 1 MB (`.apk`, `.zip`, `.dmg`, `.mp4`) may be placed in the web origin (`public/`).
   - Image uploads must be transformed on the client or offloaded directly to Supabase Storage buckets via signed upload URLs, bypassing Vercel serverless compute.

10. **Third-Party External Integrations**:
    - Calls to ZeptoMail, Razorpay, or external REST services must be wrapped in `AbortController` with timeouts $\le 5,000 \text{ ms}$.
    - Webhooks from Razorpay must be verified, acknowledged immediately with 200 OK, and processed idempotently.

---

### B. Mandatory API Protection

Every API endpoint (`app/api/**/route.ts`) and Server Action must implement:

| Requirement | Specification | Enforcement Mechanism |
| :--- | :--- | :--- |
| **1. Authentication & Scope** | Verified cryptographic HMAC token (`fr8x_session`) or Supabase Auth session. | `authenticateUserSession(req)` or `authenticateGodfatherOperator(req)`. |
| **2. Input Validation** | Strict Zod schema parsing on query params, URL slugs, and request bodies. | `schema.safeParse(body)` with immediate 400 rejection on failure. |
| **3. Request Size Bounds** | Maximum JSON payload $\le 1 \text{ MB}$; maximum query string length $\le 1,024 \text{ chars}$. | Enforced via Next.js route segment config and middleware. |
| **4. Strict Pagination** | Mandatory `limit` and `cursor` parameters. Maximum page size $\le 50$. | Clamped with `Math.min(limit, 50)`. Zero unpaginated reads. |
| **5. Rate Limiting** | Sliding-window or token-bucket rate limiting on every endpoint. | In-memory Edge rate limiter + distributed Redis / Upstash limiter. |
| **6. Scoped Quotas** | Per-user, per-IP, and per-tenant invocation caps. | `ratelimit:{route}:{uid\|ip}` keys with standard 429 Retry-After headers. |
| **7. Execution Timeouts** | Database queries $\le 3,000 \text{ ms}$; external HTTP calls $\le 5,000 \text{ ms}$. | `AbortController` and `queryWithTimeout()`. |
| **8. Bounded Retries** | Maximum 3 attempts with exponential backoff and randomized jitter. | Centralized retry utility. Zero infinite retry loops. |
| **9. Idempotency** | Mutating actions (bids, payments, invites) require an idempotency key. | `x-idempotency-key` checked against Redis / PostgreSQL unique constraints. |
| **10. Concurrency Control** | Expensive operations locked per resource ID. | Distributed locks via Upstash Redis (`NX EX`) or PostgreSQL row locks. |
| **11. Error Isolation** | Sanitized error responses. No internal stack trace leakage. | Global API try/catch wrapper returning structured RFC 7807 problem details. |
| **12. Cache Headers** | Appropriate `Cache-Control` on all GET responses. | Explicit public/private cache directives. |

**Public Route Discipline**: Do not lock public routes behind authentication, but protect them with stricter rate limits (e.g., 30 req/min per IP) and Edge CDN caching. Never trust client-supplied user IDs, roles, or claims without cryptographic server verification.

---

### C. Supabase and PostgreSQL Safeguards

1. **Mandatory Indexing**:
   - Every column used in a `WHERE`, `JOIN`, `ORDER BY`, or foreign key clause must have an appropriate B-tree or GIN index.
   - Composite indexes must be created for combined query patterns (e.g., `(user_id, status, created_at)`).
2. **Statement Timeouts**:
   - Configure global statement timeout in Supabase:
     ```sql
     ALTER ROLE authenticator SET statement_timeout = '3000ms';
     ALTER ROLE anon SET statement_timeout = '2000ms';
     ```
3. **Bounded Result Sets**:
   - PostgREST queries must never omit `.limit()`. The database module must reject any query attempting to read > 100 rows in a single round-trip.
4. **Row Level Security (RLS)**:
   - Every table in the public schema must have `ENABLE ROW LEVEL SECURITY`.
   - Never disable RLS or loosen security policies as a workaround for development hurdles.
   - Tables exposed to the anon role must only allow reading non-sensitive public columns.
5. **Connection Management**:
   - Use Supabase Transaction Pooler (port 6543) for stateless serverless functions.
   - Avoid creating persistent raw `pg` Client connections in serverless routes. Prefer the Supabase PostgREST client which handles HTTP connection multiplexing.
6. **Privileged Access Control**:
   - `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the client or bundled into browser JS.
   - Service-role clients (`createAdminClient()`) must be reserved exclusively for verified system operations (e.g., Godfather operator audits, system webhooks) and audited.
7. **Database Triggers & Cascading Workloads**:
   - Audit all PostgreSQL triggers to ensure they cannot enter recursive loops or amplify write operations. Triggers must avoid invoking external webhooks synchronously.

---

### D. Caching and Request Deduplication

1. **CDN & HTTP Edge Caching**:
   - Static datasets (e.g., `/api/geo/countries`, `/api/geo/cities`) must declare long-lived CDN cache headers:
     ```ts
     headers: {
       'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
     }
     ```
   - Personalized responses (e.g., `/api/user/profile`, `/api/notifications`) must declare:
     ```ts
     headers: {
       'Cache-Control': 'private, no-cache, no-store, must-revalidate'
     }
     ```
2. **Next.js Server Caching & Request Memoization**:
   - Use `React.cache()` for per-request function memoization across Server Components.
   - Use `unstable_cache` with deterministic cache tags for database reads that update infrequently.
3. **Stampede Prevention & Request Deduplication**:
   - Implement stale-while-revalidate patterns to ensure that cache expirations do not trigger synchronous, concurrent database queries from hundreds of incoming requests.
4. **Data Isolation**:
   - Under no circumstances may personalized or tenant-specific data be cached under a shared public CDN key. All private cache keys must incorporate the authenticated user's `uid`.

---

### E. Vercel-Specific Resource Controls

1. **Function Execution Boundaries (`maxDuration`)**:
   - Standard APIs: `maxDuration = 10`
   - Edge Functions: `maxDuration = 5`
   - Offload or batch background tasks if duration exceeds 10s.
2. **Function Runtime & Memory Selection**:
   - Default all lightweight, high-frequency APIs (rate limiters, geo lookups, public redirects) to `runtime = 'edge'` where Node.js libraries are not strictly required.
   - Sizing: Default serverless function memory to **1024 MB** or lower. High memory allocations directly multiply Provisioned GB-Hrs.
3. **Region Alignment**:
   - Configure Vercel serverless function regions to match the Supabase database region (e.g., `bom1` for Mumbai, India or `sin1` for Singapore) to eliminate cross-continent network latency (200ms+ round-trips).
4. **Fast Origin Transfer & Bandwidth Prevention**:
   - Strictly prohibit serving large binary files (`.apk`, `.zip`, `.mp4`) from the Vercel web origin.
   - All mobile app downloads must point to external Cloudflare R2, Google Drive, or GitHub Releases URLs.
5. **Preview Deployment Controls**:
   - Preview deployments must have strict authentication or Vercel password protection enabled to prevent search engine bots and automated scanners from executing compute workloads on non-production branches.

---

### F. Hard Resource Budgets and Automatic Safeguards

| Layer | Control Type | Warning Threshold | Critical Threshold | Automated Action |
| :--- | :--- | :--- | :--- | :--- |
| **Fluid Active CPU** | Platform / Account | 50% (2.0 hrs) | 85% (3.4 hrs) | Alert DevSecOps via Webhook; activate aggressive Edge caching. |
| **Provisioned GB-Hrs** | Platform / Account | 50% (180 GB-h) | 85% (306 GB-h) | Enforce 10s `maxDuration` globally; throttle polling frequency. |
| **Function Invocations**| Platform / Account | 50% (500k) | 85% (850k) | Degrade non-essential polling; increase SWR cache TTL. |
| **CDN Edge Requests** | Platform / Account | 50% (500k) | 85% (850k) | Cache static UI routes at edge for 24 hours. |
| **API Endpoint Rate** | Application (Edge) | 60 req / min | 120 req / min | Return HTTP 429 with `Retry-After: 60`. |
| **Database Execution** | Database (Supabase)| 1,500 ms | 3,000 ms | Statement timeout kills long query; returns graceful fallback. |

> [!IMPORTANT]
> **Platform Limitation Notice**: An application cannot enforce a hard billing cap if the hosting platform (Vercel) does not provide a hard spending limit. In Vercel Hobby accounts, resource overages trigger an automatic deployment pause. On Vercel Pro accounts, overages accrue on-demand billing charges unless **Spend Management** is configured in the Vercel Dashboard to **"Pause Project"** or **"Send Notification"** upon reaching the monthly budget.

---

### G. Automated Enforcement in CI/CD

The following checks must be executed on every pull request and build before deployment:

1. **Static Analysis & Code Linting**:
   - Detect and block any `SELECT *` without an adjacent `.limit()` in database query files.
   - Detect and block any `setInterval` in client-side code with a delay `< 60,000 ms` that triggers a `fetch()`.
   - Detect and block any `.apk`, `.zip`, `.dmg`, or binary file $> 1 \text{ MB}$ committed to Git or placed in `public/`.
   - Detect and block any route handler missing `export const maxDuration` or `export const dynamic`.
2. **Quality Gate Suite**:
   - Execute `npx tsx scripts/verify-vercel-resource-protection.ts` as a mandatory blocking step in `scripts/verify-all-gates.ts` and `.github/workflows/ci.yml`.
3. **Manual Review Mandate**:
   - Any modification to database schemas, full-text search, external integrations, or high-frequency polling requires explicit peer review sign-off against this policy.

---

### H. Observability and Incident Response

1. **Continuous Telemetry Tracking**:
   - Monitor Vercel Analytics: Function Execution Time (p50, p95, p99), Invocations by Route, Fast Origin Transfer.
   - Monitor Supabase Performance: Most Time-Consuming Queries, Cache Hit Rate, Active Connections.
   - Track HTTP 429, 500, and 504 error rates per route.

2. **Standard Incident Response Procedure (8 Steps)**:
   1. **Detect**: Alert fires when resource usage crosses 70% or 85% of billing period allowance.
   2. **Isolate Metric**: Identify whether the spike is Active CPU, Provisioned GB-Hrs, Bandwidth, or Invocations.
   3. **Identify Offender**: Inspect Vercel Function logs to identify the top consumed route, query, or bot IP.
   4. **Correlate Traffic**: Determine if the spike is organic traffic, a crawler/bot attack, a client polling loop, or a slow database query.
   5. **Apply Targeted Mitigation**:
      - If crawler/bot: Block IP or user-agent in `middleware.ts`.
      - If slow query: Apply missing index or reduce query `limit`.
      - If polling loop: Push client hotfix or enforce Edge HTTP 429 on the route.
      - If static data: Add `s-maxage=86400` Edge caching headers.
   6. **Run Verification**: Execute the full architectural quality gate suite locally.
   7. **Deploy Fix**: Deploy fix to production; observe Vercel real-time runtime metrics for 15 minutes.
   8. **Post-Mortem**: Document root cause, financial impact, code remediation, and added tests in `docs/`.

---

### I. Strict Deployment Gate

A deployment to production **MUST BE IMMEDIATELY BLOCKED** if any of the following conditions are true:

1. A critical resource-control regression is detected (e.g., unpaginated database read, missing limit).
2. A privileged or administrative endpoint lacks verified cryptographic authorization.
3. An expensive endpoint lacks rate limiting, execution timeouts, or input bounds.
4. A client-side polling or retry mechanism is introduced without an exponential backoff or termination condition.
5. `scripts/verify-vercel-resource-protection.ts` fails or reports an unresolved violation.
6. A database migration removes an index or loosens an RLS security policy without compensating controls.
7. A heavy binary file ($> 1 \text{ MB}$) or installer package is detected in `public/`.
8. An active production resource exhaustion incident remains unresolved and would be amplified by the release.
9. Required end-to-end verification cannot be completed or verified against runtime evidence.

**Auditable Emergency Exception Process**:
An exception to this gate may be granted **ONLY** by the Lead Architect / DevSecOps Engineer in writing. The exception record must document:
- Exception Owner and Ticket ID.
- Specific business justification and expiration timestamp (maximum 72 hours).
- Compensating platform-level controls (e.g., manual rate limiting at Cloudflare / Edge).
- Permanent remediation plan and assigned engineer.
- *Strict Prohibition*: Never permit an exception that bypasses legal compliance, core access control, or database RLS.

---

### J. Mandatory Verification Requirements

Before declaring compliance with this policy, the engineering team or coding agent must complete the following 15 verification steps:

1. **Repository Architecture Inspection**: Verify current Next.js App Router structure, serverless entrypoints, and middleware.
2. **Workload Inventory**: Catalog all API routes, server actions, database queries, and client polling hooks.
3. **Configuration Audit**: Verify `vercel.json`, `next.config.js`, and `.env.example` settings.
4. **Root Cause Analysis**: Correlate observed dashboard spikes with verified repository code patterns.
5. **Safeguard Implementation**: Implement protections at the exact architectural layer (Edge, Node.js, Database).
6. **Automated Test Coverage**: Write and execute automated tests validating every safeguard.
7. **Build & Type Check Validation**: Pass `npm run type-check`, `npm run lint`, and `npm run build` cleanly.
8. **End-to-End Workflow Verification**: Verify critical user journeys (login, search, connections, auctions).
9. **Network Traffic Inspection**: Audit browser network tab to ensure zero duplicate pings, zero polling $< 60$s, and zero un-cached static calls.
10. **Database Query Plan & RLS Audit**: Verify all major tables have RLS enabled and queries execute against indexed paths.
11. **Staging / Verification Deployment**: Verify behavior in a production-equivalent environment.
12. **Runtime Log Verification**: Inspect actual function execution logs for duration and memory consumption.
13. **Environment Parity**: Verify environment variables match between local, preview, and production.
14. **Metric Trend Audit**: Validate that projected resource consumption remains well within monthly quotas.
15. **Transparent Gap Disclosure**: Explicitly document any verification step that could not be executed due to unavailable production credentials or platform permissions.

---

## 4. RESOURCE-RISK INVENTORY (FR8X CODEBASE AUDIT)

The following high-risk workloads have been discovered and documented in the FR8X codebase:

| Priority | Component / Route | File Location | Observed Vulnerability / Root Cause | Resource Impact |
| :---: | :--- | :--- | :--- | :--- |
| **P0** | Global City Search | [`lib/geo/city-service.ts`](lib/geo/city-service.ts#L274) | Linear iteration over 250 countries and 150,000 cities in memory per request via `searchCitiesGlobal()`. | Massive Active CPU consumption (100–300ms pure CPU per invocation). |
| **P0** | High-Frequency Ping | [`lib/network/NetworkSpeedManager.ts`](lib/network/NetworkSpeedManager.ts#L110) & [`app/api/ping/route.ts`](app/api/ping/route.ts) | Client pings dynamic `/api/ping` every 18s (saver mode) or 45s with `force-dynamic` and `no-store`. | Generates 200k–500k serverless function invocations; provisions GB-Hrs continuously. |
| **P0** | Unbounded Presence Table Scan | [`lib/db/presence.ts`](lib/db/presence.ts#L51) & [`lib/db/contacts.ts`](lib/db/contacts.ts#L117) | `getAllPresence()` runs `SELECT * FROM presence` with no filters or limits on every contact fetch. | Unbounded database reads; high latency; high serverless duration. |
| **P1** | Static Geo APIs Forced Dynamic | [`app/api/geo/countries/route.ts`](app/api/geo/countries/route.ts) | Completely static country list marked `force-dynamic` with no CDN cache headers. | Unnecessary serverless function invocation on every country dropdown render. |
| **P1** | Unbounded Jobs & Rates Queries | [`lib/db/jobs.ts`](lib/db/jobs.ts#L11) & [`lib/db/rates.ts`](lib/db/rates.ts#L66) | `getJobs()` and `getRates()` query `SELECT *` without `.limit()` or pagination. | Full-table scans; high memory usage; high network egress from Supabase. |
| **P1** | Unbounded Nexus & Posts Queries | [`app/api/nexus/route.ts`](app/api/nexus/route.ts#L48) & [`lib/db/posts.ts`](lib/db/posts.ts#L12) | `/api/nexus` calls `getPosts()` and `getReviews('')` with no pagination or limits. | Large JSON payloads transferred and filtered in Node.js memory. |
| **P1** | High-Frequency Notification Polling | [`lib/context/DataContext.tsx`](lib/context/DataContext.tsx#L792) | Background polling of `/api/notifications` every 45s across all active tabs. | Multiplies function invocations across multi-tab users. |
| **P2** | Missing Serverless Duration Limits | 37+ route handlers in `app/api/**` | Only 3 routes declare `export const maxDuration = 10;`. Others default to unbounded platform timeout. | If Supabase or external APIs hang, functions run to platform timeout, draining GB-Hrs. |
| **P2** | Godfather Operator Session Polling | [`lib/godfather/context/GodfatherAuthContext.tsx`](lib/godfather/context/GodfatherAuthContext.tsx#L237) | Polling `/api/godfather/session` every 20 seconds. | Repeated serverless executions for administrative tabs. |
| **P3** | Large Binary Egress History | [`docs/VERCEL_BANDWIDTH_FAIR_USE_POLICY.md`](docs/VERCEL_BANDWIDTH_FAIR_USE_POLICY.md) | Historical 14.3 MB APK binary files in `public/` triggered 100% bandwidth exhaustion. | Vulnerable to crawler bandwidth depletion if new binaries are committed. |

---

## 5. PRIORITIZED REMEDIATION CHECKLIST

### Phase 1: Immediate Protection (P0 — Within 24 Hours)
- [ ] **Remediate `/api/ping`**: Remove 18-second periodic ping from `NetworkSpeedManager.ts`. Replace latency check with native `navigator.onLine` and a static 204 Edge route with CDN caching (`max-age=300`).
- [ ] **Cap `lib/geo/city-service.ts`**: Replace synchronous worldwide scan in `searchCitiesGlobal()` with top-500 logistics hubs index or require `countryCode` parameter to restrict search scope.
- [ ] **Eliminate `getAllPresence()` Full-Table Scan**: Refactor `lib/db/presence.ts` to query presence exclusively for requested user IDs (`.in('user_id', userIds)`) with a maximum limit of 50.
- [ ] **Enforce Global Duration Limit in `vercel.json`**:
  ```json
  {
    "functions": {
      "app/api/**/*": {
        "maxDuration": 10
      }
    }
  }
  ```

### Phase 2: Critical Architecture Hardening (P1 — Within 72 Hours)
- [ ] **Add CDN Cache Headers to Static Geo APIs**: Add `Cache-Control: public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400` to `/api/geo/countries` and `/api/geo/postal`.
- [ ] **Enforce Hard Pagination on All Database Reads**:
  - `lib/db/jobs.ts`: Add mandatory `.limit(Math.min(limit || 20, 50))` and cursor pagination.
  - `lib/db/rates.ts`: Add mandatory `.limit(Math.min(limit || 20, 50))`.
  - `lib/db/posts.ts`: Ensure `limit` is never undefined; default to 20.
  - `app/api/nexus/route.ts`: Pass bounded limits to `getPosts({ limit: 20 })` and `getCases({ limit: 20 })`.
- [ ] **De-amplify Client Polling in `DataContext.tsx`**:
  - Increase notification polling from 45s to **180s**.
  - Suppress polling completely when Supabase Realtime channel is connected and healthy.
  - Rely on push events via Realtime rather than continuous pull polling.

### Phase 3: Platform & Operational Controls (P2 — Within 1 Week)
- [ ] **Configure Vercel Spend Management**: Set alert thresholds at 50%, 75%, and 100% of budget. Enable automatic project pause on Hobby plan or budget cap notification on Pro.
- [ ] **Supabase Statement Timeout**: Verify PostgreSQL `statement_timeout = '3000ms'` is active across all application roles.
- [ ] **Edge Rate Limiting Coverage**: Audit `middleware.ts` to ensure all mutating and search routes have active rate limit rules.

### Phase 4: CI/CD & Permanent Governance (P3 — Ongoing)
- [ ] **Integrate Policy Verification in CI**: Ensure `verify-vercel-resource-protection.ts` executes in `.github/workflows/ci.yml`.
- [ ] **Binary Size Guard**: CI gate verifies `find public/ -type f -size +1M` returns zero files.

---

## 6. PLATFORM-LEVEL PROTECTIONS REQUIRING EXTERNAL CONFIGURATION

The following safeguards must be configured directly within the respective cloud management consoles:

### 1. Vercel Dashboard Configurations
- **Spend Management**: Navigate to **Settings > Billing > Spend Management**.
  - Set Monthly Budget alert.
  - On Hobby: Ensure email alerts are subscribed to `tech@fr8x.in`.
  - On Pro: Select action: **Pause Project** or **Send Notification** upon reaching 100% of budget.
- **Function Region Selection**: Navigate to **Settings > Functions**.
  - Set default serverless function region to **Mumbai, India (`bom1`)** or **Singapore (`sin1`)** to match the Supabase PostgreSQL deployment region.
- **Deployment Protection**: Navigate to **Settings > Deployment Protection**.
  - Enable Vercel Authentication or Password Protection on all **Preview Deployments** to prevent web crawlers from triggering serverless compute on staging URLs.
- **Attack Challenge Mode**: Navigate to **Settings > Security**.
  - Enable DDoS and bot protection to challenge malicious automated scrapers at the Cloudflare / Vercel Edge layer before they invoke serverless functions.

### 2. Supabase Dashboard Configurations
- **Connection Pooling**: Navigate to **Settings > Database > Connection Pooling**.
  - Ensure Supavisor (Transaction Mode) is active on port 6543.
  - Verify client application connects using transaction pooling for serverless functions.
- **Statement Timeout**:
  - Verify statement timeout via SQL Editor:
    ```sql
    SHOW statement_timeout;
    ```
- **Compute Add-on & Disk Autoscaling**:
  - Enable disk auto-scaling to prevent database read-only locks on transaction log expansion.

---

## 7. AUTOMATED ENFORCEMENT SPECIFICATION

This policy is backed by an automated verification suite:

```bash
npx -y tsx scripts/verify-vercel-resource-protection.ts
```

This suite executes 6 deterministic automated checks:
1. **GATE 1: Zero Heavy Binary Assets in Web Origin (`public/`)** — Asserts zero files $> 1 \text{ MB}$ and zero `.apk` files.
2. **GATE 2: Database Query Boundedness** — Scans `lib/db/*.ts` for unpaginated queries or unbounded `select('*')`.
3. **GATE 3: Client Polling Interval Hygiene** — Scans all `.tsx` and `.ts` files for `setInterval` with intervals $< 60,000 \text{ ms}$ that invoke network requests.
4. **GATE 4: Static API Route Caching** — Verifies that static data routes have caching directives and do not abuse `force-dynamic`.
5. **GATE 5: Function Duration Safeguards** — Verifies that expensive routes declare `maxDuration` or global configuration exists.
6. **GATE 6: Policy Governance & Agent Documentation** — Verifies presence of `VERCEL_RESOURCE_PROTECTION_POLICY.md` and references in `AGENTS.md` and `PROJECT_RULES.md`.

---

## 8. SUMMARY GOVERNANCE MATRIX

| Category | Forbidden Anti-Pattern | Mandatory Pattern |
| :--- | :--- | :--- |
| **Database** | `supabase.from('table').select('*')` | `supabase.from('table').select('id, name').limit(50)` |
| **API Routes** | Undefined `maxDuration`, unbounded runtime | `export const maxDuration = 10;` |
| **Client Polling** | `setInterval(fetch, 15000)` | `BroadcastChannel` leader election + intervals $\ge 120$s or push Realtime |
| **Heavy Assets** | Committing `.apk` or `.zip` to `public/` | Hosting on Google Drive, GitHub Releases, or Cloudflare R2 |
| **Static Data** | `export const dynamic = 'force-dynamic'` on static lists | CDN cache headers (`s-maxage=86400, stale-while-revalidate`) |
| **External Calls** | Unbounded `fetch()` or SMTP connect | `AbortController` with maximum 5,000 ms timeout |
| **Security** | Disabling RLS or using service-role on client | Strict RLS + least-privilege tokens only |
