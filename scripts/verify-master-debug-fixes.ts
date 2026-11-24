/**
 * scripts/verify-master-debug-fixes.ts
 * Comprehensive Verification of FR8X Master Bug Fixes & Architectural Requirements
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('══════════════════════════════════════════════════════════════════');
console.log('  FR8X MASTER DEBUGGING & ARCHITECTURAL VERIFICATION SUITE');
console.log('══════════════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passCount++;
  } catch (err: any) {
    console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

// ─── 1. USERAVATAR & COMPANY LOGO FALLBACK ───
console.log('─── 1. UserAvatar & Company Logo Architecture ───');
test('UserAvatar source includes Building2 fallback for missing company logo', () => {
  const avatarSrc = fs.readFileSync(path.join(process.cwd(), 'components/ui/UserAvatar.tsx'), 'utf-8');
  assert(avatarSrc.includes('import { Building2 } from \'lucide-react\''), 'Must import Building2');
  assert(avatarSrc.includes('showCompanyLogo && diameter >= 24'), 'Must check showCompanyLogo and diameter');
  assert(avatarSrc.includes('fr8x-avatar-company-logo'), 'Must include fr8x-avatar-company-logo container');
  assert(avatarSrc.includes('localStorage.getItem(`fr8x_user_logo_${user.uid}`)'), 'Must check localStorage fallback');
});

test('TopBar user profile dropdown includes company logo with Building2 fallback and verified badge', () => {
  const topBarSrc = fs.readFileSync(path.join(process.cwd(), 'components/layout/TopBar.tsx'), 'utf-8');
  assert(topBarSrc.includes('Building2 size={12}'), 'Must have Building2 fallback for company logo');
  assert(topBarSrc.includes('user-plan-badge'), 'Must retain user-plan-badge');
  assert(topBarSrc.includes('VERIFIED'), 'Must include VERIFIED badge');
});

// ─── 2. RATE INTELLIGENCE UNIFIED RATES EDITOR ───
console.log('\n─── 2. Rate Intelligence Unified Editor ───');
test('app/rates/page.tsx + Add New Rate and row click open RatesEditorModal', () => {
  const ratesSrc = fs.readFileSync(path.join(process.cwd(), 'app/rates/page.tsx'), 'utf-8');
  assert(ratesSrc.includes('setShowRatesEditorModal(true)'), 'Must call setShowRatesEditorModal(true)');
  assert(ratesSrc.includes('+ Add New Rate'), 'Must include + Add New Rate button');
  assert(ratesSrc.includes('Show Rates Editor'), 'Must include Show Rates Editor button');
  assert(ratesSrc.includes('title="Edit this rate in Rates Editor"'), 'Must have explicit edit button for owners');
});

// ─── 3. PAYMENT GATEWAY FOR JOBS & ADS ───
console.log('\n─── 3. Payment Gateway Authoritative Pricing & Webhooks ───');
test('app/api/payments/razorpay/route.ts defines JOB_CATALOG and AD_CATALOG', () => {
  const paySrc = fs.readFileSync(path.join(process.cwd(), 'app/api/payments/razorpay/route.ts'), 'utf-8');
  assert(paySrc.includes('JOB_CATALOG'), 'Must define JOB_CATALOG');
  assert(paySrc.includes('AD_CATALOG'), 'Must define AD_CATALOG');
  assert(paySrc.includes("itemType === 'job'"), 'Must handle job itemType');
  assert(paySrc.includes("itemType === 'ad'"), 'Must handle ad itemType');
  assert(paySrc.includes('amountINR: 300'), 'Job 2 days tariff must be 300');
  assert(paySrc.includes('amountINR: 1200'), 'Job 7 days tariff must be 1200');
  assert(paySrc.includes('amountINR: 2640'), 'Job 15 days tariff must be 2640');
  assert(paySrc.includes('amountINR: 5340'), 'Job 30 days tariff must be 5340');
  assert(paySrc.includes('amountINR: 1000'), 'Ad 2 days tariff must be 1000');
  assert(paySrc.includes('amountINR: 5000'), 'Ad 10 days tariff must be 5000');
});

test('app/api/webhooks/razorpay/route.ts updates job status on verified payment', () => {
  const webhookSrc = fs.readFileSync(path.join(process.cwd(), 'app/api/webhooks/razorpay/route.ts'), 'utf-8');
  assert(webhookSrc.includes("itemType === 'job'"), 'Must intercept job itemType in webhook');
  assert(webhookSrc.includes('saveJob'), 'Must persist updated job in DB');
  assert(webhookSrc.includes("status: 'active'"), 'Must set job status to active');
  assert(webhookSrc.includes("payment_status: 'paid'"), 'Must set payment_status to paid');
});

// ─── 4. JOBS BOARD REDESIGN & APPLICATION WORKFLOW ───
console.log('\n─── 4. Jobs Board Redesign & Application Flow ───');
test('app/jobs/page.tsx includes UserAvatar, SHOW JOB button, and APPLY NOW workflow', () => {
  const jobsSrc = fs.readFileSync(path.join(process.cwd(), 'app/jobs/page.tsx'), 'utf-8');
  assert(jobsSrc.includes('UserAvatar'), 'Must render UserAvatar in job cards and modals');
  assert(jobsSrc.includes('SHOW JOB'), 'Must render clearly visible SHOW JOB button');
  assert(jobsSrc.includes('APPLY NOW'), 'Must render APPLY NOW button');
  assert(jobsSrc.includes('Candidate Apply Now Modal'), 'Must include candidate application modal');
  assert(jobsSrc.includes('Recruiter Applications Management Modal'), 'Must include recruiter applications modal');
  assert(jobsSrc.includes('You have already submitted an application'), 'Must prevent duplicate applications');
});

// ─── 5. SIDEBAR JOBS & SPONSORED AD REDESIGN ───
console.log('\n─── 5. Sidebar Jobs & Sponsored Ads ───');
test('app/feeds/page.tsx includes Trade Careers widget, 3-action sponsor ad, and Lightbox', () => {
  const feedsSrc = fs.readFileSync(path.join(process.cwd(), 'app/feeds/page.tsx'), 'utf-8');
  assert(feedsSrc.includes('Trade Careers &amp; Jobs'), 'Must render Trade Careers & Jobs header');
  assert(feedsSrc.includes('Looking for logistics talent?'), 'Must render recruitment prompt when 0 jobs');
  assert(feedsSrc.includes('Visit Website'), 'Must render Visit Website button');
  assert(feedsSrc.includes('Contact Sponsor'), 'Must render Contact Sponsor button');
  assert(feedsSrc.includes('View Full Creative'), 'Must render View Full Creative button');
  assert(feedsSrc.includes('lightbox-overlay'), 'Must include full-resolution Lightbox Modal');
  assert(feedsSrc.includes('objectFit: \'contain\''), 'Creative banner must preserve aspect ratio with contain');
});

// ─── 6. LOGIN PAGE SESSION NAVIGATION ───
console.log('\n─── 6. Login Page Session Navigation ───');
test('app/login/page.tsx eliminates forced-refresh race condition', () => {
  const loginSrc = fs.readFileSync(path.join(process.cwd(), 'app/login/page.tsx'), 'utf-8');
  assert(loginSrc.includes('router.refresh()'), 'Must call router.refresh() before redirect');
  assert(loginSrc.includes('window.location.assign(\'/feeds\')'), 'Must have guaranteed assign fallback');
  assert(loginSrc.includes('router.replace(\'/feeds\')'), 'Must auto-redirect if already authenticated on mount');
});

console.log('\n══════════════════════════════════════════════════════════════════');
console.log(`  VERIFICATION RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('══════════════════════════════════════════════════════════════════');

if (failCount > 0) {
  process.exit(1);
}
