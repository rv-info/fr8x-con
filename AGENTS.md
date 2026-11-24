# AGENTS.md — Mandatory AI Coding Agent Instructions
## FR8X Connect Engineering Standards & Operating Directives

> **APPLICABILITY**: All AI Coding Agents (Antigravity, Claude, Copilot, Cursor, Gemini, OpenAI, etc.)  
> **CANONICAL RULESET**: [`PROJECT_RULES.md`](PROJECT_RULES.md)  

---

## 1. ENGINEERING & OPERATING DIRECTIVES

Before implementing, refactoring, or deploying any feature, API endpoint, database query, background job, or third-party integration, every coding agent must adhere to the project standards:

### Essential Agent Rules:
1. **Bounded Database Queries**: Ensure Supabase / PostgreSQL queries use sensible bounds and pagination (`.limit(50)` default). Avoid unbounded full-table scans across high-volume tables.
2. **Efficient Client Communication**: Prefer Supabase Realtime push subscriptions or user-driven refreshes over aggressive client polling.
3. **Clean Web Origin Assets**: Keep large binaries and downloadable installers off the web origin (`public/`), using external cloud storage (e.g. Google Drive, Cloudflare R2, GitHub Releases).
4. **Security Controls**: Never disable Supabase RLS, loosen rate limits, or bypass authentication to make builds or tests pass.
5. **Quality & Test Gates**: Ensure all architectural verification tests in `scripts/` pass without regressions (`npm test`).

---

## 2. WORKFLOW & PROTOCOL

Follow the canonical protocol defined in [`PROJECT_RULES.md`](PROJECT_RULES.md):
$$\text{SPEC} \longrightarrow \text{PLAN} \longrightarrow \text{EXECUTE} \longrightarrow \text{VERIFY} \longrightarrow \text{COMMIT}$$

- **Search-First Discipline**: Always use grep/ripgrep to locate specific lines before reading entire files.
- **Verification Gates**: Every phase must pass its architectural verification test in `scripts/`.
- **Master Quality Gate**: Ensure `npm test` (`npx -y tsx scripts/verify-all-gates.ts`) passes with zero regressions.
