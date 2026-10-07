/**
 * scripts/push-supabase-schema.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FR8X Automated Supabase Schema Migration Runner.
 *
 * Pushes the authoritative 16-table PostgreSQL schema directly to Supabase via:
 *   1. Supabase Management API (HTTPS with SUPABASE_ACCESS_TOKEN) - No DB ports required!
 *   OR
 *   2. Direct PostgreSQL Connection (DATABASE_URL / SUPABASE_DB_URL with pg client)
 *
 * Usage:
 *   npm run db:push
 *   npx tsx scripts/push-supabase-schema.ts [--verify-only] [--file <path>]
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { Client } from 'pg';

// ─── 1. Load Environment Variables from .env.local ───────────────────────────
function loadEnv(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const env: Record<string, string> = {};
  if (!fs.existsSync(envPath)) return env;

  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };

function extractProjectRef(supabaseUrl?: string): string | null {
  if (!supabaseUrl) return null;
  const match = supabaseUrl.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match ? match[1] : null;
}

// ─── 2. Execution Strategy 1: Supabase Management API ────────────────────────
async function pushViaManagementApi(projectRef: string, accessToken: string, sql: string): Promise<boolean> {
  console.log(`\n▶ [STRATEGY 1] Executing via Supabase Management API (Project: ${projectRef})...`);
  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query: sql }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  ✖ Management API returned HTTP ${res.status}:`, errText);
      return false;
    }

    console.log(`  ✔ Management API successfully applied migration.`);
    return true;
  } catch (err: any) {
    console.error(`  ✖ Management API network error:`, err.message);
    return false;
  }
}

// ─── 3. Execution Strategy 2: Direct PostgreSQL Connection ───────────────────
async function pushViaPostgres(connectionString: string, sql: string): Promise<boolean> {
  console.log(`\n▶ [STRATEGY 2] Executing via Direct PostgreSQL Connection (pg client)...`);
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log(`  ✔ Connected to PostgreSQL instance.`);

    console.log(`  Applying SQL migration statements...`);
    await client.query(sql);
    console.log(`  ✔ SQL migration applied successfully.`);

    // Verify tables
    const verifyRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tableNames = verifyRes.rows.map((r: any) => r.table_name);
    console.log(`\n─── LIVE DATABASE TABLES IN PUBLIC SCHEMA (${tableNames.length}) ───`);
    tableNames.forEach((name, idx) => console.log(`  ${String(idx + 1).padStart(2, ' ')}. public.${name}`));

    await client.end();
    return true;
  } catch (err: any) {
    console.error(`  ✖ PostgreSQL execution error:`, err.message);
    try { await client.end(); } catch {}
    return false;
  }
}

// ─── 4. Schema Verification via Management API ───────────────────────────────
async function verifyViaManagementApi(projectRef: string, accessToken: string) {
  const endpoint = `https://api.supabase.com/v1/projects/${projectRef}/database/query`;
  const query = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ query }),
    });

    if (res.ok) {
      const rows: any[] = await res.json();
      const tableNames = rows.map((r: any) => r.table_name);
      console.log(`\n─── LIVE DATABASE TABLES IN PUBLIC SCHEMA (${tableNames.length}) ───`);
      tableNames.forEach((name, idx) => console.log(`  ${String(idx + 1).padStart(2, ' ')}. public.${name}`));
    }
  } catch {}
}

// ─── 5. Main Migration Entrypoint ───────────────────────────────────────────
async function main() {
  console.log('================================================================');
  console.log('  FR8X AUTOMATED SUPABASE SCHEMA MIGRATION RUNNER');
  console.log('================================================================');

  const args = process.argv.slice(2);
  const verifyOnly = args.includes('--verify-only');
  let migrationFile = path.resolve(process.cwd(), 'supabase/migrations/20261005000010_fr8x_master_schema.sql');

  const fileIdx = args.indexOf('--file');
  if (fileIdx !== -1 && args[fileIdx + 1]) {
    migrationFile = path.resolve(process.cwd(), args[fileIdx + 1]);
  }

  if (!fs.existsSync(migrationFile)) {
    console.error(`✖ Migration file not found: ${migrationFile}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(migrationFile, 'utf8');
  console.log(`Migration File: ${path.relative(process.cwd(), migrationFile)} (${(sqlContent.length / 1024).toFixed(1)} KB)`);

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://haarbaqeuuirwkhmefev.supabase.co';
  const projectRef = env.SUPABASE_PROJECT_REF || extractProjectRef(supabaseUrl) || 'haarbaqeuuirwkhmefev';
  const accessToken = env.SUPABASE_ACCESS_TOKEN;
  const dbUrl = env.DATABASE_URL || env.SUPABASE_DB_URL;

  console.log(`Supabase Project Ref: ${projectRef}`);
  console.log(`DATABASE_URL Configured: ${dbUrl ? 'YES' : 'NO'}`);
  console.log(`SUPABASE_ACCESS_TOKEN Configured: ${accessToken ? 'YES' : 'NO'}`);

  if (verifyOnly) {
    if (accessToken) {
      await verifyViaManagementApi(projectRef, accessToken);
      return;
    }
    if (dbUrl) {
      const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
      await client.connect();
      const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;");
      console.log(`\n─── LIVE TABLES (${res.rows.length}) ───`);
      res.rows.forEach((r: any, i: number) => console.log(`  ${i + 1}. public.${r.table_name}`));
      await client.end();
      return;
    }
    console.error('Cannot verify: neither SUPABASE_ACCESS_TOKEN nor DATABASE_URL is configured.');
    return;
  }

  // Attempt Execution
  let success = false;

  // Option A: If SUPABASE_ACCESS_TOKEN is provided
  if (accessToken) {
    success = await pushViaManagementApi(projectRef, accessToken, sqlContent);
    if (success) {
      await verifyViaManagementApi(projectRef, accessToken);
    }
  }

  // Option B: If DATABASE_URL is provided
  if (!success && dbUrl) {
    success = await pushViaPostgres(dbUrl, sqlContent);
  }

  // If neither credential is configured
  if (!success) {
    console.log('\n================================================================');
    console.log('  HOW TO AUTOMATE SCHEMA PUSH (CHOOSE ONE OPTION)');
    console.log('================================================================');
    console.log(`
Option 1: Supabase Personal Access Token (RECOMMENDED - HTTPS, No port issues)
  1. Go to: https://supabase.com/dashboard/account/tokens
  2. Click "Generate new token" (Name: "FR8X CLI")
  3. Add to .env.local:
     SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  4. Run:
     npm run db:push

Option 2: Direct PostgreSQL Connection String
  1. Go to: Supabase Dashboard -> Project Settings -> Database
  2. Under "Connection string" -> select "URI" (Transaction pooler or Session mode)
  3. Add to .env.local:
     DATABASE_URL="postgresql://postgres.${projectRef}:[YOUR-DB-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
  4. Run:
     npm run db:push

Option 3: Official Supabase CLI
  1. Run: npx supabase login
  2. Run: npx supabase link --project-ref ${projectRef}
  3. Run: npx supabase db push
`);
    process.exit(1);
  }

  console.log('\n🎉 ALL MIGRATIONS PUSHED & VERIFIED ON SUPABASE POSTGRESQL!\n');
}

main().catch(err => {
  console.error('Fatal error in migration runner:', err);
  process.exit(1);
});
