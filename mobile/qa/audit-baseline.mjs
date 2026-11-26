import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.resolve(process.cwd(), 'mobile/qa');
const DESKTOP_DIR = path.join(OUT_DIR, 'screenshots/desktop-baseline');
const MOBILE_BEFORE_DIR = path.join(OUT_DIR, 'screenshots/mobile-before');

fs.mkdirSync(DESKTOP_DIR, { recursive: true });
fs.mkdirSync(MOBILE_BEFORE_DIR, { recursive: true });

const PUBLIC_ROUTES = [
  { name: 'landing', path: '/' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'reset-password', path: '/reset-password' },
  { name: 'verify-email', path: '/verify-email' },
  { name: 'download', path: '/download' },
  { name: 'privacy', path: '/privacy' },
  { name: 'terms', path: '/terms' },
  { name: 'sitemap', path: '/sitemap' },
  { name: 'godfather-login', path: '/godfather/login' },
  { name: 'godfather-reset-password', path: '/godfather/reset-password' },
];

const APP_ROUTES = [
  { name: 'dashboard', path: '/dashboard' },
  { name: 'feeds', path: '/feeds' },
  { name: 'rates', path: '/rates' },
  { name: 'auctions', path: '/auctions' },
  { name: 'auctions-create', path: '/auctions/create' },
  { name: 'network', path: '/network' },
  { name: 'connections', path: '/connections' },
  { name: 'contacts', path: '/contacts' },
  { name: 'people', path: '/people' },
  { name: 'nexus', path: '/nexus' },
  { name: 'jobs', path: '/jobs' },
  { name: 'profile', path: '/profile' },
  { name: 'notifications', path: '/notifications' },
];

async function seedAuth(context) {
  const nowMs = Date.now();
  const sessionPayload = {
    uid: '00000000-0000-0000-0000-000000000001',
    email: 'audit.director@fr8x.in',
    issuedAt: nowMs,
    expiresAt: nowMs + 24 * 60 * 60 * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(sessionPayload)).toString('base64url');
  const sessionToken = `${payloadB64}.mockvalidsignature`;

  await context.addCookies([
    {
      name: 'fr8x_session',
      value: sessionToken,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  await context.addInitScript(() => {
    const mockProfile = {
      uid: '00000000-0000-0000-0000-000000000001',
      id: '00000000-0000-0000-0000-000000000001',
      email: 'audit.director@fr8x.in',
      displayName: 'Captain Vikram Singh',
      name: 'Captain Vikram Singh',
      company: 'Adani Logistics Ltd',
      companyName: 'Adani Logistics Ltd',
      companyLogoUrl: '/icons/ship-icon.png',
      designation: 'Head of Ocean Freight',
      city: 'Mumbai',
      country: 'India',
      plan: 'enterprise',
      verified: true,
      hasGoldenTick: true,
      status: 'active',
      role: 'user',
    };
    const now = String(Date.now());
    localStorage.setItem('fr8x_cached_user_profile', JSON.stringify(mockProfile));
    localStorage.setItem('fr8x_active_user_uid', mockProfile.uid);
    localStorage.setItem('ACTIVE_SESSION_KEY', now);
    localStorage.setItem('fr8x_session_expiry', String(Date.now() + 86400000));
  });
}

async function collectDomMetrics(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const docOverflow = document.documentElement.scrollWidth - vw;
    const bodyOverflow = document.body.scrollWidth - vw;

    const smallButtons = [];
    document.querySelectorAll('button, a[role="button"], input[type="submit"], input[type="button"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const st = getComputedStyle(el);
      if (st.display === 'none' || st.visibility === 'hidden') return;
      if (r.width < 44 || r.height < 44) {
        smallButtons.push({
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 32),
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      }
    });

    const smallInputs = [];
    document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]), select, textarea').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 16) {
        smallInputs.push({
          tag: el.tagName.toLowerCase(),
          name: el.getAttribute('name') || el.getAttribute('placeholder') || '',
          fontSize: fs,
        });
      }
    });

    const clippedRight = [];
    document.querySelectorAll('h1,h2,h3,p,span,label,button,a,td,th').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.right > vw + 2) {
        clippedRight.push({
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || '').trim().slice(0, 32),
          right: Math.round(r.right),
          vw,
        });
      }
    });

    return {
      vw,
      vh,
      docOverflow,
      bodyOverflow,
      smallButtonsCount: smallButtons.length,
      smallButtonsSample: smallButtons.slice(0, 8),
      smallInputsCount: smallInputs.length,
      smallInputsSample: smallInputs.slice(0, 6),
      clippedRightCount: clippedRight.length,
      clippedRightSample: clippedRight.slice(0, 6),
    };
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop Baseline (1440x900)
  console.log('Capturing Desktop Baseline (1440x900)...');
  const dPublicCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPublicPage = await dPublicCtx.newPage();
  for (const r of [
    { name: 'login', path: '/login' },
    { name: 'register', path: '/register' },
    { name: 'landing', path: '/' },
  ]) {
    await dPublicPage.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await dPublicPage.waitForTimeout(1000);
    await dPublicPage.screenshot({ path: path.join(DESKTOP_DIR, `${r.name}.png`), fullPage: false });
  }
  await dPublicCtx.close();

  const dAppCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await seedAuth(dAppCtx);
  const dAppPage = await dAppCtx.newPage();
  for (const r of [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'feeds', path: '/feeds' },
    { name: 'rates', path: '/rates' },
    { name: 'auctions', path: '/auctions' },
    { name: 'network', path: '/network' },
    { name: 'nexus', path: '/nexus' },
    { name: 'jobs', path: '/jobs' },
    { name: 'profile', path: '/profile' },
  ]) {
    await dAppPage.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await dAppPage.waitForTimeout(1500);
    await dAppPage.screenshot({ path: path.join(DESKTOP_DIR, `${r.name}.png`), fullPage: false });
  }
  await dAppCtx.close();

  // 2. Mobile Audit (390x844 and 320x568)
  const auditResults = [];
  for (const vp of [
    { name: '390', width: 390, height: 844 },
    { name: '320', width: 320, height: 568 },
  ]) {
    console.log(`Auditing Mobile (${vp.width}x${vp.height})...`);
    const mPubCtx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const mPubPage = await mPubCtx.newPage();
    for (const r of PUBLIC_ROUTES) {
      try {
        await mPubPage.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await mPubPage.waitForTimeout(900);
        const metrics = await collectDomMetrics(mPubPage);
        auditResults.push({ viewport: vp.name, route: r.path, ...metrics });
        if (vp.name === '390') {
          await mPubPage.screenshot({ path: path.join(MOBILE_BEFORE_DIR, `${r.name}.png`), fullPage: false });
        }
      } catch (err) {
        auditResults.push({ viewport: vp.name, route: r.path, error: String(err) });
      }
    }
    await mPubCtx.close();

    const mAppCtx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await seedAuth(mAppCtx);
    const mAppPage = await mAppCtx.newPage();
    for (const r of APP_ROUTES) {
      try {
        await mAppPage.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await mAppPage.waitForTimeout(1400);
        const metrics = await collectDomMetrics(mAppPage);
        auditResults.push({ viewport: vp.name, route: r.path, ...metrics });
        if (vp.name === '390') {
          await mAppPage.screenshot({ path: path.join(MOBILE_BEFORE_DIR, `${r.name}.png`), fullPage: false });
        }
      } catch (err) {
        auditResults.push({ viewport: vp.name, route: r.path, error: String(err) });
      }
    }
    await mAppCtx.close();
  }

  fs.writeFileSync(path.join(OUT_DIR, 'audit-before.json'), JSON.stringify(auditResults, null, 2));
  console.log('Audit complete. Summary:');
  for (const item of auditResults) {
    if (item.viewport === '390') {
      console.log(
        `  [390] ${item.route.padEnd(26)} overflow=${item.docOverflow ?? 'ERR'} smallBtns=${item.smallButtonsCount ?? '-'} smallInputs=${item.smallInputsCount ?? '-'} clippedRight=${item.clippedRightCount ?? '-'}`
      );
    }
  }
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
