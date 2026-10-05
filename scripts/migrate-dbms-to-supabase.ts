/**
 * scripts/migrate-dbms-to-supabase.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Controlled One-Time Migration Script:
 * Extracts real business entities from local .data/dbms/*.json files,
 * validates and normalizes them, and outputs a versioned SQL migration file:
 * supabase/migrations/20261005000003_seed_legacy_dbms_data.sql
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';

function escapeSqlString(str: any): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeSqlJson(obj: any): string {
  if (obj === null || obj === undefined) return "'{}'::jsonb";
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

function runMigration() {
  const dbmsDir = path.join(process.cwd(), '.data', 'dbms');
  if (!fs.existsSync(dbmsDir)) {
    console.log('[Migrate] .data/dbms directory not found.');
    return;
  }

  let sql = `-- ============================================================================
-- FR8X LEGACY DBMS MIGRATION SEED
-- Generated: ${new Date().toISOString()}
-- Single source of truth: Supabase PostgreSQL
-- ============================================================================

`;

  // 1. Companies
  const companiesPath = path.join(dbmsDir, 'companies.json');
  if (fs.existsSync(companiesPath)) {
    const companies = JSON.parse(fs.readFileSync(companiesPath, 'utf8'));
    sql += `-- 1. COMPANIES\n`;
    for (const c of companies) {
      if (!c.id) continue;
      sql += `INSERT INTO public.companies (
  id, name, legal_name, country, state, city, postal_code, address, gstin, pan, cin, status, is_verified, created_at, updated_at
) VALUES (
  ${escapeSqlString(c.id)},
  ${escapeSqlString(c.tradeName || c.legalName || 'Enterprise')},
  ${escapeSqlString(c.legalName || c.tradeName || 'Enterprise')},
  ${escapeSqlString(c.country || 'India')},
  ${escapeSqlString(c.state || '')},
  ${escapeSqlString(c.city || 'Mumbai')},
  ${escapeSqlString(c.postalCode || '')},
  ${escapeSqlString(c.registeredAddress || c.address || '')},
  ${escapeSqlString(c.gstn || c.gstin || null)},
  ${escapeSqlString(c.pan || null)},
  ${escapeSqlString(c.cin || null)},
  ${escapeSqlString(c.status || 'verified')},
  ${Boolean(c.verified || c.is_verified)},
  COALESCE(${escapeSqlString(c.createdAt)}, NOW()),
  COALESCE(${escapeSqlString(c.updatedAt)}, NOW())
) ON CONFLICT (id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  updated_at = NOW();\n\n`;
    }
  }

  // 2. Users / Profiles
  const usersPath = path.join(dbmsDir, 'users.json');
  if (fs.existsSync(usersPath)) {
    const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
    sql += `-- 2. USERS / PROFILES\n`;
    for (const u of users) {
      if (!u.email) continue;
      // Derive a stable UUID based on email hash or generate one
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const id = uuidRegex.test(u.id || '') ? u.id : uuidRegex.test(u.uid || '') ? u.uid : null;
      const idExpr = id ? escapeSqlString(id) : `gen_random_uuid()`;
      const uidVal = u.uid || u.id || null;

      sql += `INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  ${idExpr},
  ${escapeSqlString(uidVal)},
  ${escapeSqlString(u.email.trim().toLowerCase())},
  ${escapeSqlString(u.displayName || u.email)},
  ${escapeSqlString(u.firstName || '')},
  ${escapeSqlString(u.lastName || '')},
  ${escapeSqlString(u.phone || u.mobile || '')},
  ${escapeSqlString(u.mobile || u.phone || '')},
  ${escapeSqlString(u.designation || 'Freight Logistics Manager')},
  ${escapeSqlString(u.company || 'Enterprise')},
  ${escapeSqlString(u.companyId || null)},
  ${escapeSqlString(u.city || 'Mumbai')},
  ${escapeSqlString(u.state || 'Maharashtra')},
  ${escapeSqlString(u.country || 'India')},
  ${escapeSqlString(u.location || `${u.city || 'Mumbai'}, ${u.state || 'Maharashtra'}, ${u.country || 'India'}`)},
  ${escapeSqlString(u.role || 'company_admin')},
  ${escapeSqlString(u.plan || 'trial')},
  ${Boolean(u.hasGoldenTick)},
  ${Boolean(u.isVerified || u.email_verified)},
  ${Boolean(u.email_verified || u.isVerified)},
  ${Number(u.failedLoginAttempts) || 0},
  ${escapeSqlJson(u.privacySettings || {})},
  COALESCE(${escapeSqlString(u.createdAt)}, NOW()),
  COALESCE(${escapeSqlString(u.updatedAt)}, NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();\n\n`;
    }
  }

  // 3. Rates
  const ratesPath = path.join(dbmsDir, 'rates.json');
  if (fs.existsSync(ratesPath)) {
    const rates = JSON.parse(fs.readFileSync(ratesPath, 'utf8'));
    sql += `-- 3. RATES\n`;
    for (const r of rates) {
      if (!r.id) continue;
      sql += `INSERT INTO public.rates (
  id, sp, line, por, pol, pod, fpod, rate20, rate40, rate40hc, currency, type, ft, validity, transit_time, owner_uid, is_owner, is_self_posted, status, created_at, updated_at
) VALUES (
  ${escapeSqlString(r.id)},
  ${escapeSqlString(r.sp || 'Spot Carrier')},
  ${escapeSqlString(r.line || 'Direct Line')},
  ${escapeSqlString(r.por || r.pol || 'Origin Port')},
  ${escapeSqlString(r.pol || 'Origin Port')},
  ${escapeSqlString(r.pod || 'Destination Port')},
  ${escapeSqlString(r.fpod || r.pod || 'Destination Port')},
  ${Number(r.rate20) || 0},
  ${Number(r.rate40) || 0},
  ${Number(r.rate40hc) || Number(r.rate40) || 0},
  ${escapeSqlString(r.currency || 'USD')},
  ${escapeSqlString(r.type || 'Direct Spot')},
  ${Number(r.ft) || 14},
  COALESCE(${escapeSqlString(r.validity)}, CURRENT_DATE + INTERVAL '14 days'),
  ${escapeSqlString(r.transitTime || r.transit_time || '30')},
  ${escapeSqlString(r.ownerUid || r.createdBy || null)},
  ${Boolean(r.isOwner !== false)},
  ${Boolean(r.isSelfPosted !== false)},
  ${escapeSqlString(r.status || 'active')},
  COALESCE(${escapeSqlString(r.createdAt)}, NOW()),
  COALESCE(${escapeSqlString(r.updatedAt)}, NOW())
) ON CONFLICT (id) DO UPDATE SET
  rate20 = EXCLUDED.rate20,
  rate40 = EXCLUDED.rate40,
  validity = EXCLUDED.validity,
  updated_at = NOW();\n\n`;
    }
  }

  // 4. Auctions
  const auctionsPath = path.join(dbmsDir, 'auctions.json');
  if (fs.existsSync(auctionsPath)) {
    const auctions = JSON.parse(fs.readFileSync(auctionsPath, 'utf8'));
    sql += `-- 4. AUCTIONS\n`;
    for (const a of auctions) {
      if (!a.id) continue;
      sql += `INSERT INTO public.auctions (
  id, title, rfq_id, creator_uid, creator_name, creator_company, auction_type, start_date, start_time, duration_minutes, end_date_time, timezone, status, rank, time_left, is_published, competition_ceiling, bids_submitted_count, payment_status, posting_fee_inr, shipment, containers, origin_charges, destination_charges, created_at, updated_at
) VALUES (
  ${escapeSqlString(a.id)},
  ${escapeSqlString(a.title || 'Spot Auction')},
  ${escapeSqlString(a.rfqId || null)},
  ${escapeSqlString(a.creatorUid || null)},
  ${escapeSqlString(a.creatorName || null)},
  ${escapeSqlString(a.creatorCompany || null)},
  ${escapeSqlString(a.auctionType || 'Specific bidder')},
  COALESCE(${escapeSqlString(a.startDate)}, CURRENT_DATE),
  ${escapeSqlString(a.startTime || '10:00')},
  ${Number(a.durationMinutes) || 120},
  COALESCE(${escapeSqlString(a.endDateTime)}, NOW() + INTERVAL '2 hours'),
  ${escapeSqlString(a.timezone || 'Asia/Kolkata')},
  ${escapeSqlString(a.status || 'Draft')},
  ${escapeSqlString(a.rank || 'Pending')},
  ${escapeSqlString(a.timeLeft || '120m')},
  ${Boolean(a.isPublished)},
  ${a.competitionCeiling != null ? Number(a.competitionCeiling) : 'NULL'},
  ${Number(a.bidsSubmittedCount) || 0},
  ${escapeSqlString(a.paymentStatus || 'unpaid')},
  ${a.postingFeeINR != null ? Number(a.postingFeeINR) : 300},
  ${escapeSqlJson(a.shipment || {})},
  ${escapeSqlJson(a.containers || [])},
  ${escapeSqlJson(a.originCharges || {})},
  ${escapeSqlJson(a.destinationCharges || {})},
  COALESCE(${escapeSqlString(a.publishedAt || a.createdAt)}, NOW()),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();\n\n`;
    }
  }

  // 5. Transactions
  const txPath = path.join(dbmsDir, 'transactions.json');
  if (fs.existsSync(txPath)) {
    const transactions = JSON.parse(fs.readFileSync(txPath, 'utf8'));
    sql += `-- 5. TRANSACTIONS\n`;
    for (const t of transactions) {
      if (!t.id) continue;
      sql += `INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  ${escapeSqlString(t.id)},
  ${escapeSqlString(t.orderId || t.id)},
  ${escapeSqlString(t.paymentId || null)},
  ${escapeSqlString(t.userId || null)},
  ${escapeSqlString(t.userEmail || null)},
  ${Number(t.amount) || 0},
  ${escapeSqlString(t.currency || 'INR')},
  ${escapeSqlString(t.planId || null)},
  ${escapeSqlString(t.itemType || 'subscription')},
  ${escapeSqlString(t.itemTitle || 'Plan')},
  ${escapeSqlString(t.status || 'created')},
  ${escapeSqlString(t.gateway || 'Razorpay')},
  ${escapeSqlJson(t.metadata || {})},
  COALESCE(${escapeSqlString(t.createdAt)}, NOW()),
  COALESCE(${escapeSqlString(t.updatedAt)}, NOW())
) ON CONFLICT (id) DO NOTHING;\n\n`;
    }
  }

  const outPath = path.join(process.cwd(), 'supabase', 'migrations', '20261005000003_seed_legacy_dbms_data.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`[Migrate] Successfully generated migration seed: ${outPath}`);
}

runMigration();
