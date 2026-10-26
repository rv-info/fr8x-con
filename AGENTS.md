# AGENTS.md — Mandatory AI Coding Agent Instructions
## FR8X Connect Engineering Standards & Operating Directives

> **APPLICABILITY**: All AI Coding Agents (Antigravity, Claude, Copilot, Cursor, Gemini, OpenAI, etc.)  
> **CANONICAL RULESET**: [`PROJECT_RULES.md`](PROJECT_RULES.md)  
> **RESOURCE DEFENSE POLICY**: [`VERCEL_RESOURCE_PROTECTION_POLICY.md`](VERCEL_RESOURCE_PROTECTION_POLICY.md)  
> **BANDWIDTH POLICY**: [`docs/VERCEL_BANDWIDTH_FAIR_USE_POLICY.md`](docs/VERCEL_BANDWIDTH_FAIR_USE_POLICY.md)  

---

## 1. MANDATORY VERCEL RESOURCE PROTECTION DIRECTIVE

Before implementing, refactoring, or deploying any feature, API endpoint, database query, background job, or third-party integration, **every coding agent MUST read and strictly adhere to:**

👉 **[`/VERCEL_RESOURCE_PROTECTION_POLICY.md`](VERCEL_RESOURCE_PROTECTION_POLICY.md)**

### Non-Negotiable Core Rule:
**NO FEATURE, CODE CHANGE, API ENDPOINT, DATABASE QUERY, BACKGROUND JOB, OR THIRD-PARTY INTEGRATION MAY BE DEPLOYED IF IT INTRODUCES UNBOUNDED RESOURCE CONSUMPTION OR BYPASSES ESTABLISHED RESOURCE PROTECTION CONTROLS.**

### Essential Agent Rules:
1. **Never perform unbounded database queries**: Every Supabase / PostgreSQL query must have an explicit `.limit()` (maximum 50 default). Never call `SELECT *` across entire tables (`jobs`, `rates`, `presence`, `auctions`, `posts`, `profiles`).
2. **Never add client polling under 60 seconds**: Never use `setInterval` with delays $< 60,000 \text{ ms}$ to fetch API endpoints. For connectivity checks, use `navigator.onLine`. For real-time updates, use Supabase Realtime push subscriptions.
3. **Never commit heavy binaries**: Never place `.apk`, `.zip`, `.dmg`, `.exe`, or files $> 1 \text{ MB}$ in `public/`.
4. **Always declare `maxDuration`**: Every API route must declare `export const maxDuration = 10;`.
5. **Always cache static API responses**: Never add `export const dynamic = 'force-dynamic'` to routes returning static datasets without CDN `Cache-Control` headers.
6. **Never disable security controls**: Never disable Supabase RLS, loosen rate limits, or bypass authentication to make builds or tests pass.

---

## 2. WORKFLOW & PROTOCOL

Follow the canonical protocol defined in [`PROJECT_RULES.md`](PROJECT_RULES.md):
$$\text{SPEC} \longrightarrow \text{PLAN} \longrightarrow \text{EXECUTE} \longrightarrow \text{VERIFY} \longrightarrow \text{COMMIT}$$

- **Search-First Discipline**: Always use grep/ripgrep to locate specific lines before reading entire files.
- **Verification Gates**: Every phase must pass its architectural verification test in `scripts/`.
- **Master Quality Gate**: Ensure `npm test` (`npx -y tsx scripts/verify-all-gates.ts`) passes with zero regressions.
