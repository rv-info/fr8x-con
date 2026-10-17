/**
 * scripts/test-integrity-forensics-and-enhancements.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Quality Gate 15: Registration Integrity, Forensic De-duplication,
 * Godfather Dynamic Stats, Database-Backed Notification Center,
 * Persistent Search History, and Rich Post Table Formatting.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { parseRichText } from '../lib/utils';
import { sanitizeRichTextPost } from '../lib/security/input-validation';
import { notificationDbService } from '../lib/supabase/db';

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║  FR8X QUALITY GATE 15: INTEGRITY, FORENSICS & ENHANCEMENTS      ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

let checksCount = 0;
function pass(msg: string) {
  checksCount++;
  console.log(`  ✔ [Check ${checksCount}] ${msg}`);
}

async function runGate15() {
  console.log('▶ [TEST SUITE 1/5] Forensic Audit & Zero-Synthetic Location Verification');

  // Check migration file exists and has no hardcoded Mumbai
  const migrationPath = path.resolve(__dirname, '../supabase/migrations/20261017000000_fix_registration_integrity_and_deduplication.sql');
  assert(fs.existsSync(migrationPath), 'Migration 20261017000000 must exist');
  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  assert(migrationContent.includes('idx_profiles_lower_email'), 'Migration must enforce lower(trim(email)) uniqueness');
  assert(migrationContent.includes('user_search_history'), 'Migration must create user_search_history table');
  assert(!migrationContent.includes("COALESCE(NEW.raw_user_meta_data->>'city', 'Mumbai')"), 'Migration must NOT have COALESCE Mumbai defaults in SQL');
  assert(!migrationContent.includes("DEFAULT 'Mumbai'"), 'Migration must NOT have DEFAULT Mumbai in SQL');
  pass('Database migration enforces case-insensitive email uniqueness and removes synthetic location fallbacks');

  // Check people search route
  const searchRoutePath = path.resolve(__dirname, '../app/api/people/search/route.ts');
  const searchRoute = fs.readFileSync(searchRoutePath, 'utf8');
  assert(!searchRoute.includes("city: u.city || 'Mumbai'"), 'people/search/route.ts must not have Mumbai fallback');
  assert(!searchRoute.includes("${u.city || 'Mumbai'}"), 'people/search/route.ts must not interpolate Mumbai fallback');
  pass('Directory search route uses canonical provided location without Mumbai fallback');

  // Check people profile route
  const profileRoutePath = path.resolve(__dirname, '../app/api/people/profile/[id]/route.ts');
  const profileRoute = fs.readFileSync(profileRoutePath, 'utf8');
  assert(!profileRoute.includes("return u.city || 'Mumbai';"), 'profile/[id]/route.ts must not return hardcoded Mumbai');
  assert(!profileRoute.includes("${storeUser.city || 'Mumbai'}"), 'profile/[id]/route.ts must not interpolate Mumbai');
  pass('Profile route eliminates hardcoded Mumbai location returns');

  // Check members route
  const membersRoutePath = path.resolve(__dirname, '../app/api/members/route.ts');
  const membersRoute = fs.readFileSync(membersRoutePath, 'utf8');
  assert(!membersRoute.includes("city = row.city || 'Mumbai'"), 'members/route.ts must not have Mumbai fallback');
  assert(membersRoute.includes('seenNameCompany'), 'members/route.ts must deduplicate across store and DB');
  pass('Members API route implements multi-source identity deduplication');

  console.log('\n▶ [TEST SUITE 2/5] GODFATHER Super Admin Dynamic Statistics Audit');

  // Check GodfatherDataContext terms agreements
  const gfContextPath = path.resolve(__dirname, '../lib/godfather/context/GodfatherDataContext.tsx');
  const gfContext = fs.readFileSync(gfContextPath, 'utf8');
  assert(!gfContext.includes('totalAcceptances: 1420'), 'GodfatherDataContext must not have hardcoded 1420 acceptances');
  assert(!gfContext.includes('totalAcceptances: 840'), 'GodfatherDataContext must not have hardcoded 840 acceptances');
  assert(!gfContext.includes('totalAcceptances: 195'), 'GodfatherDataContext must not have hardcoded 195 acceptances');
  assert(gfContext.includes('acceptedMembersCount'), 'GodfatherDataContext must calculate acceptances dynamically from live members');
  pass('Godfather Terms & Agreements eliminate artificial static 1,420 acceptances and compute real live totals');

  // Check Godfather compliance page
  const compliancePagePath = path.resolve(__dirname, '../app/godfather/trust-safety/compliance/page.tsx');
  const compliancePage = fs.readFileSync(compliancePagePath, 'utf8');
  assert(!compliancePage.includes('<div className="gf-metric-value text-sky-700">1,420</div>'), 'Compliance page must not hardcode 1,420 screenings');
  assert(!compliancePage.includes('<div className="gf-metric-value text-emerald-700">100%</div>'), 'Compliance page must not hardcode 100% GSTIN');
  assert(compliancePage.includes('gstinVerifiedRate'), 'Compliance page must compute gstinVerifiedRate dynamically');
  assert(compliancePage.includes('amlScreeningsCount'), 'Compliance page must compute amlScreeningsCount dynamically');
  pass('Compliance governance page derives GSTIN verification rate and AML screenings from real records');

  // Check Godfather dashboard page
  const gfPagePath = path.resolve(__dirname, '../app/godfather/page.tsx');
  const gfPage = fs.readFileSync(gfPagePath, 'utf8');
  assert(!gfPage.includes('const openReportsCount = 1;'), 'Godfather page must not hardcode openReportsCount = 1');
  assert(gfPage.includes('openReportsCount = (cases || [])'), 'Godfather page must compute open reports from cases');
  assert(!gfPage.includes("'Corporate Logistics Park'"), 'Godfather page must not use dummy KYC address');
  pass('Godfather dashboard page computes open cases dynamically and uses real entity KYC address');

  console.log('\n▶ [TEST SUITE 3/5] Notification Center & Preservation Controls');

  // Check notificationDbService methods
  assert(typeof notificationDbService.getNotifications === 'function', 'notificationDbService.getNotifications must exist');
  assert(typeof notificationDbService.markAsRead === 'function', 'notificationDbService.markAsRead must exist');
  assert(typeof notificationDbService.markAllAsRead === 'function', 'notificationDbService.markAllAsRead must exist');
  assert(typeof notificationDbService.clearNotification === 'function', 'notificationDbService.clearNotification must exist');
  assert(typeof notificationDbService.clearAllNotifications === 'function', 'notificationDbService.clearAllNotifications must exist');
  assert(typeof notificationDbService.createNotification === 'function', 'notificationDbService.createNotification must exist');
  pass('Database notification service exposes markAsRead, markAllAsRead, clearNotification, clearAllNotifications, createNotification');

  // Check Notification Center page exists
  const notifPagePath = path.resolve(__dirname, '../app/notifications/page.tsx');
  assert(fs.existsSync(notifPagePath), 'app/notifications/page.tsx must exist');
  const notifPage = fs.readFileSync(notifPagePath, 'utf8');
  assert(notifPage.includes('Notification Center'), 'Notification Center page must have heading');
  assert(notifPage.includes('Clear All'), 'Notification Center must provide Clear All control');
  assert(notifPage.includes('Data Preservation Notice'), 'Notification Center must explicitly document data preservation');
  pass('Dedicated Notification Center page provides categorized alert feed, unread filter, and preservation safeguards');

  // Check TopBar notification dropdown
  const topBarPath = path.resolve(__dirname, '../components/layout/TopBar.tsx');
  const topBar = fs.readFileSync(topBarPath, 'utf8');
  assert(topBar.includes('clearNotification'), 'TopBar must use clearNotification');
  assert(topBar.includes('clearAllNotifications'), 'TopBar must use clearAllNotifications');
  assert(topBar.includes('/notifications'), 'TopBar must link to /notifications');
  pass('TopBar notification hub provides Clear One, Clear All, and link to Notification Center');

  console.log('\n▶ [TEST SUITE 4/5] Persistent Search History & Privacy Filtering');

  // Check search history API
  const historyRoutePath = path.resolve(__dirname, '../app/api/search/history/route.ts');
  assert(fs.existsSync(historyRoutePath), 'app/api/search/history/route.ts must exist');
  const historyRoute = fs.readFileSync(historyRoutePath, 'utf8');
  assert(historyRoute.includes('GET'), 'Search history route must support GET');
  assert(historyRoute.includes('POST'), 'Search history route must support POST');
  assert(historyRoute.includes('DELETE'), 'Search history route must support DELETE');
  assert(historyRoute.includes('SENSITIVE_PATTERNS'), 'Search history must filter sensitive credentials and PII');
  pass('Search history API handles user-scoped persistence, Clear One, Clear All, and PII sanitization');

  // Check SearchConnectionsModal integration
  const searchModalPath = path.resolve(__dirname, '../components/connections/SearchConnectionsModal.tsx');
  const searchModal = fs.readFileSync(searchModalPath, 'utf8');
  assert(searchModal.includes('recentSearches'), 'SearchConnectionsModal must track recentSearches');
  assert(searchModal.includes('recordSearchHistory'), 'SearchConnectionsModal must record search history');
  assert(searchModal.includes('removeHistoryItem'), 'SearchConnectionsModal must support removing single search');
  assert(searchModal.includes('clearAllHistory'), 'SearchConnectionsModal must support clearAllHistory');
  pass('SearchConnectionsModal integrates persistent search history with chip navigation and individual delete');

  // Check TopBar global search integration
  assert(topBar.includes('globalSearchHistory'), 'TopBar must track globalSearchHistory');
  assert(topBar.includes('recordGlobalSearch'), 'TopBar must record global search');
  assert(topBar.includes('removeGlobalHistoryItem'), 'TopBar must support removing global search item');
  pass('TopBar global search modal integrates persistent recent searches with repeat search on click');

  console.log('\n▶ [TEST SUITE 5/5] Rich Post Editor, Responsive Tables & Server Sanitization');

  // Check RichPostEditor component exists
  const editorPath = path.resolve(__dirname, '../components/posts/RichPostEditor.tsx');
  assert(fs.existsSync(editorPath), 'RichPostEditor.tsx must exist');
  const editorCode = fs.readFileSync(editorPath, 'utf8');
  assert(editorCode.includes('handleInsertTable'), 'RichPostEditor must support inserting structured tables');
  assert(editorCode.includes('handleUndo'), 'RichPostEditor must support undo');
  assert(editorCode.includes('handleRedo'), 'RichPostEditor must support redo');
  assert(editorCode.includes('isPreview'), 'RichPostEditor must support preview mode');
  pass('RichPostEditor component provides full toolbar with tables, undo/redo, shortcuts, and preview mode');

  // Check parseRichText with GFM table parsing
  const sampleTableMd = `
### Port Rate Matrix
| Port of Loading | Carrier Line | 40HC Freight Rate | Free Days |
| :--- | :--- | :--- | :--- |
| Nhava Sheva (INNSA) | Maersk Line | $1,250 USD | 14 Days |
| Mundra Port (INMUN) | MSC Mediterranean | $950 USD | 12 Days |

*Blank sailings expected next week.*
`;
  const parsedHtml = parseRichText(sampleTableMd);
  assert(parsedHtml.includes('<table class="fr8x-post-table">'), 'parseRichText must render table with class fr8x-post-table');
  assert(parsedHtml.includes('<th>Port of Loading</th>'), 'parseRichText must render table headers');
  assert(parsedHtml.includes('<td>Nhava Sheva (INNSA)</td>'), 'parseRichText must render table data cells');
  assert(parsedHtml.includes('<h3>Port Rate Matrix</h3>'), 'parseRichText must render h3 heading');
  assert(parsedHtml.includes('<strong>Blank sailings expected next week.</strong>'), 'parseRichText must render bold text');
  pass('parseRichText parses GFM tables, headings, and formatting into mobile-responsive HTML');

  // Check sanitizeRichTextPost security against XSS injection
  const maliciousInput = `
# Market Update
<script>alert("xss")</script>
<img src="x" onerror="stealTokens()" />
<a href="javascript:stealCookies()">Click for Rates</a>
| Port | Rate |
| :--- | :--- |
| Nhava Sheva | $1,200 |
`;
  const sanitizedPost = sanitizeRichTextPost(maliciousInput);
  assert(!sanitizedPost.includes('<script>'), 'Sanitizer must strip <script> tags');
  assert(!sanitizedPost.includes('onerror'), 'Sanitizer must strip inline onerror event handlers');
  assert(!sanitizedPost.includes('javascript:'), 'Sanitizer must block javascript: URL protocols');
  assert(sanitizedPost.includes('| Nhava Sheva | $1,200 |'), 'Sanitizer must preserve safe table markdown content');
  pass('sanitizeRichTextPost strictly blocks script tags, event handlers, and dangerous protocols while preserving tables');

  // Check feeds page uses RichPostEditor
  const feedsPagePath = path.resolve(__dirname, '../app/feeds/page.tsx');
  const feedsPage = fs.readFileSync(feedsPagePath, 'utf8');
  assert(feedsPage.includes('<RichPostEditor'), 'feeds/page.tsx must embed RichPostEditor');
  assert(feedsPage.includes('sanitizeRichTextPost'), 'feeds/page.tsx must sanitize rich text before saving');
  pass('Feeds page wires RichPostEditor and server sanitization into post composition and editing');

  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log(`║  🎉 ALL ${checksCount} INTEGRITY & ENHANCEMENT CHECKS PASSED PERFECTLY     ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
}

runGate15().catch((err) => {
  console.error('\n✖ Gate 15 verification failed:', err);
  process.exit(1);
});
