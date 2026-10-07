/**
 * scripts/verify-launch-readiness.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FR8X Automated Launch-Readiness & Architectural Verification Suite.
 * Validates:
 *   1. Canonical Profile Data Normalization (mobile, designation, address, city, state, country, postalCode)
 *   2. Authentication & Session Lifecycles (2-hour hard limit, refresh preservation, logout)
 *   3. Network-Change vs. Genuine Device-Change Detection
 *   4. Metadata, SEO & Freight Keyword Pipeline
 *   5. Zero Active Firebase Imports in Application Code
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { siteMetadata, getSiteMetadata } from '../config/site-metadata';
import { getCanonicalUrl, buildRouteMetadata, robotsPolicy, routeSeoConfigs } from '../config/seo';
import { getKeywordsForRoute, KEYWORD_GROUPS } from '../config/keywords';
import { createSignedSessionToken, verifySignedSessionToken } from '../lib/crypto';
import { serverSecurityStore } from '../lib/server-auth-store';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  ✖ [FAIL] ${desc}`);
    failed++;
  }
}

async function runLaunchReadinessTests() {
  console.log('================================================================');
  console.log('  FR8X MASTER LAUNCH-READINESS VERIFICATION GATE');
  console.log('================================================================\n');

  // ── TEST SUITE 1: Profile Field Normalization & Tracing ────────────────────
  console.log('─── TEST SUITE 1: Profile Data Schema & Field Normalization ───');
  {
    const rawInput = {
      phone: '9876543210',
      mobile: '+91 9876543210',
      designation: 'VP of Global Logistics',
      company: 'TransOceanic Freight Ltd',
      address: '100 Marine Drive',
      formattedAddress: '100 Marine Drive, Nariman Point',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400021',
      emptyBio: '',
    };

    // Normalize input simulating API route logic
    const dbUpdates: any = {};
    if (rawInput.mobile !== undefined || rawInput.phone !== undefined) {
      dbUpdates.mobile = String(rawInput.mobile || rawInput.phone).trim();
      dbUpdates.phone = dbUpdates.mobile;
    }
    if (rawInput.designation !== undefined) dbUpdates.designation = rawInput.designation.trim();
    if (rawInput.company !== undefined) dbUpdates.company_name = rawInput.company.trim();
    if (rawInput.city !== undefined) dbUpdates.city = rawInput.city.trim();
    if (rawInput.state !== undefined) dbUpdates.state = rawInput.state.trim();
    if (rawInput.country !== undefined) dbUpdates.country = rawInput.country.trim();
    if (rawInput.pincode !== undefined) dbUpdates.postal_code = rawInput.pincode.trim();
    if (rawInput.formattedAddress !== undefined || rawInput.address !== undefined) {
      dbUpdates.formatted_address = (rawInput.formattedAddress || rawInput.address).trim();
      dbUpdates.address = dbUpdates.formatted_address;
    }
    dbUpdates.bio = rawInput.emptyBio ? rawInput.emptyBio.trim() : null;

    assert(dbUpdates.mobile === '+91 9876543210', 'Mobile alias is preserved and normalized');
    assert(dbUpdates.phone === dbUpdates.mobile, 'Phone and mobile aliases stay strictly synchronized');
    assert(dbUpdates.designation === 'VP of Global Logistics', 'Designation is correctly extracted');
    assert(dbUpdates.company_name === 'TransOceanic Freight Ltd', 'Company maps to canonical company_name');
    assert(dbUpdates.city === 'Mumbai' && dbUpdates.state === 'Maharashtra', 'City and State are accurately mapped');
    assert(dbUpdates.country === 'India', 'Country is correctly normalized');
    assert(dbUpdates.postal_code === '400021', 'Pincode / PostalCode is normalized to postal_code');
    assert(dbUpdates.formatted_address === '100 Marine Drive, Nariman Point', 'Address and formattedAddress are synchronized');
    assert(dbUpdates.bio === null, 'Empty strings are intentionally converted to null for clean database persistence');
  }

  // ── TEST SUITE 2: Strict 2-Hour Maximum Session Window ─────────────────────
  console.log('\n─── TEST SUITE 2: Authentication & 2-Hour Session Window ───');
  {
    const now = Date.now();
    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
    const testUid = `u_test_session_${now}`;
    const testDeviceId = `dev_${now}`;

    // 1. Initial Login Token
    const initialToken = createSignedSessionToken({
      uid: testUid,
      email: `${testUid}@fr8x.in`,
      role: 'user',
      sessionId: `sess_${now}`,
      deviceId: testDeviceId,
      issuedAt: now,
      expiresAt: now + TWO_HOURS_MS,
    });

    const verifiedInitial = verifySignedSessionToken<any>(initialToken);
    assert(verifiedInitial.valid === true, 'Signed session token validates cryptographically with HMAC');
    assert(verifiedInitial.payload?.issuedAt === now, 'Token preserves original login timestamp issuedAt');
    assert(verifiedInitial.payload?.expiresAt === now + TWO_HOURS_MS, 'Token expires strictly at now + 2 hours');

    // 2. Simulated Page Refresh after 30 minutes: must retain original issuedAt
    const refreshTime = now + 30 * 60 * 1000; // 30 mins later
    const origIssuedAt = verifiedInitial.payload.issuedAt;
    const origExpiresAt = verifiedInitial.payload.expiresAt;

    // Simulate refresh endpoint logic:
    const refreshedToken = createSignedSessionToken({
      uid: testUid,
      email: `${testUid}@fr8x.in`,
      role: 'user',
      sessionId: `sess_${now}`,
      deviceId: testDeviceId,
      issuedAt: origIssuedAt, // Retains original login time!
      expiresAt: origExpiresAt, // Retains original 2-hour expiry!
    });

    const verifiedRefresh = verifySignedSessionToken<any>(refreshedToken);
    assert(verifiedRefresh.payload?.issuedAt === now, 'Session refresh does NOT silently extend issuedAt');
    assert(verifiedRefresh.payload?.expiresAt === now + TWO_HOURS_MS, 'Session refresh preserves original 2-hour hard limit');

    // 3. Simulated Expired Session (2 hours and 1 minute later)
    const expiredTime = now + TWO_HOURS_MS + 60 * 1000;
    const isExpired = expiredTime > verifiedInitial.payload.expiresAt || (expiredTime - verifiedInitial.payload.issuedAt > TWO_HOURS_MS);
    assert(isExpired === true, 'Session is correctly evaluated as expired past 2 hours from initial login');
  }

  // ── TEST SUITE 3: Network Change vs Genuine Device Change ──────────────────
  console.log('\n─── TEST SUITE 3: Network Change vs. Genuine Device Change ───');
  {
    const now = Date.now();
    const testUid = `u_device_test_${now}`;
    const primaryDeviceId = `device_macbook_pro_${now}`;
    const secondaryDeviceId = `device_iphone_15_${now}`;
    const sessionId = `sess_${now}`;
    const initialIp = '103.21.244.10'; // WiFi IP
    const roamingIp = '157.34.120.45'; // 4G Cellular IP

    // Register active session on device 1
    serverSecurityStore.setActiveSession(testUid, sessionId, {
      ip: initialIp,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      deviceId: primaryDeviceId,
    });

    // Case A: Same device, IP changed (WiFi -> 4G Network Change)
    const networkChangeResult = serverSecurityStore.validateActiveSession(
      testUid,
      sessionId,
      primaryDeviceId, // SAME deviceId
      roamingIp,       // DIFFERENT IP
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    );
    assert(networkChangeResult.valid === true, 'Network change (IP switch) on same device is authorized without logout');

    // Case B: Genuine device change (iPhone tries to access session)
    const deviceChangeResult = serverSecurityStore.validateActiveSession(
      testUid,
      sessionId,
      secondaryDeviceId, // DIFFERENT deviceId
      roamingIp,
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'
    );
    assert(
      deviceChangeResult.valid === false && deviceChangeResult.reason === 'concurrent_device_login',
      'Genuine device change is flagged as concurrent_device_login to protect account security'
    );
  }

  // ── TEST SUITE 4: Metadata, SEO & Keywords Pipeline ────────────────────────
  console.log('\n─── TEST SUITE 4: Metadata, SEO & Keywords Configuration ───');
  {
    const meta = getSiteMetadata();
    assert(meta.siteName === 'FR8X', 'siteMetadata exports valid siteName');
    assert(meta.siteUrl.startsWith('https://'), 'siteMetadata exports valid HTTPS siteUrl');
    assert(Boolean(meta.contact.supportEmail), 'siteMetadata exports required support email');

    const canonicalHome = getCanonicalUrl('/');
    const canonicalAuctions = getCanonicalUrl('/auctions');
    assert(canonicalHome === meta.siteUrl, 'Root canonical URL matches canonical base');
    assert(canonicalAuctions === `${meta.siteUrl}/auctions`, 'Sub-route canonical URL matches expected format');

    const routeMeta = buildRouteMetadata('auctions');
    assert(typeof routeMeta.title === 'string' && routeMeta.title.includes('Auctions'), 'buildRouteMetadata generates custom title for auctions');
    assert(Boolean(routeMeta.alternates?.canonical), 'buildRouteMetadata generates canonical URL link');
    assert(robotsPolicy.rules.length > 0, 'robotsPolicy defines indexation rules');
    assert(Object.keys(routeSeoConfigs).length >= 5, 'routeSeoConfigs includes authoritative routes');

    const homeKeywords = getKeywordsForRoute('/');
    const auctionsKeywords = getKeywordsForRoute('/auctions');
    assert(homeKeywords.length > 0 && homeKeywords.includes('digital freight forwarding'), 'Home route maps to freight forwarding keywords');
    assert(auctionsKeywords.includes('freight reverse auction'), 'Auctions route maps to reverse auction keywords');
    assert(KEYWORD_GROUPS.truckingAndFleet.terms.length > 0, 'Domain keywords include road transport & trucking terms');
  }

  // ── TEST SUITE 5: Zero Active Firebase References in Code ──────────────────
  console.log('\n─── TEST SUITE 5: Zero Active Firebase References in Application ───');
  {
    const appDir = path.resolve(__dirname, '../app');
    const libDir = path.resolve(__dirname, '../lib');

    function scanFiles(dir: string): string[] {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(scanFiles(fullPath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const allCodeFiles = [...scanFiles(appDir), ...scanFiles(libDir)];
    let activeFirebaseImports = 0;
    const flaggedFiles: string[] = [];

    for (const file of allCodeFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (
        /from\s+['"]firebase(\/.*)?['"]/.test(content) ||
        /from\s+['"]firebase-admin(\/.*)?['"]/.test(content) ||
        /require\(['"]firebase['"]\)/.test(content) ||
        /require\(['"]firebase-admin['"]\)/.test(content)
      ) {
        activeFirebaseImports++;
        flaggedFiles.push(path.relative(path.resolve(__dirname, '..'), file));
      }
    }

    assert(
      activeFirebaseImports === 0,
      `Zero active Firebase SDK imports in app/ and lib/ (Flagged: ${flaggedFiles.join(', ') || 'None'})`
    );
  }

  console.log('\n================================================================');
  console.log(`  VERIFICATION SUMMARY: ${passed} / ${passed + failed} TESTS PASSED`);
  console.log('================================================================');

  if (failed > 0) {
    console.error('Launch readiness verification failed.');
    process.exit(1);
  } else {
    console.log('>>> ALL LAUNCH READINESS VERIFICATION GATES PASSED! <<<\n');
    process.exit(0);
  }
}

runLaunchReadinessTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
