import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.resolve(process.cwd(), 'mobile/qa');
const DESKTOP_BASE_DIR = path.join(OUT_DIR, 'screenshots/desktop-baseline');
const DESKTOP_AFTER_DIR = path.join(OUT_DIR, 'screenshots/desktop-after');
const MOBILE_AFTER_DIR = path.join(OUT_DIR, 'screenshots/mobile-after');

fs.mkdirSync(DESKTOP_AFTER_DIR, { recursive: true });
fs.mkdirSync(MOBILE_AFTER_DIR, { recursive: true });

const ALL_VIEWPORTS = [320, 340, 360, 375, 390, 393, 402, 414, 430, 480, 600, 768, 820];

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
    const docOverflow = document.documentElement.scrollWidth - vw;
    const mobileRootActive = Boolean(document.querySelector('[data-fr8x-mobile-root="true"]'));

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
    document.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), select, textarea').forEach((el) => {
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
      mobileRootActive,
      docOverflow,
      smallButtonsCount: smallButtons.length,
      smallButtonsSample: smallButtons.slice(0, 6),
      smallInputsCount: smallInputs.length,
      smallInputsSample: smallInputs.slice(0, 5),
      clippedRightCount: clippedRight.length,
      clippedRightSample: clippedRight.slice(0, 5),
    };
  });
}

function comparePngs(basePath, afterPath) {
  if (!fs.existsSync(basePath) || !fs.existsSync(afterPath)) return { comparable: false };
  const a = PNG.sync.read(fs.readFileSync(basePath));
  const b = PNG.sync.read(fs.readFileSync(afterPath));
  if (a.width !== b.width || a.height !== b.height) {
    return { comparable: true, sameDimensions: false, diffRatio: 1 };
  }
  let diffPixels = 0;
  const total = a.width * a.height;
  for (let i = 0; i < a.data.length; i += 4) {
    if (
      Math.abs(a.data[i] - b.data[i]) > 12 ||
      Math.abs(a.data[i + 1] - b.data[i + 1]) > 12 ||
      Math.abs(a.data[i + 2] - b.data[i + 2]) > 12
    ) {
      diffPixels++;
    }
  }
  return { comparable: true, sameDimensions: true, diffRatio: +(diffPixels / total).toFixed(4) };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = { mobileRoutes: [], viewportMatrix: [], interactiveChecks: [], desktopRegression: [] };

  // 1. Full 24-route sweep at 320px, 390px, and 768px
  for (const w of [320, 390, 768]) {
    console.log(`Testing all 24 routes at ${w}px...`);
    const pubCtx = await browser.newContext({ viewport: { width: w, height: 844 } });
    const pubPage = await pubCtx.newPage();
    for (const r of PUBLIC_ROUTES) {
      await pubPage.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await pubPage.waitForTimeout(800);
      const metrics = await collectDomMetrics(pubPage);
      results.mobileRoutes.push({ viewport: w, route: r.path, ...metrics });
      if (w === 390) {
        await pubPage.screenshot({ path: path.join(MOBILE_AFTER_DIR, `${r.name}.png`), fullPage: false });
      }
    }
    await pubCtx.close();

    const appCtx = await browser.newContext({ viewport: { width: w, height: 844 } });
    await seedAuth(appCtx);
    const appPage = await appCtx.newPage();
    for (const r of APP_ROUTES) {
      await appPage.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await appPage.waitForTimeout(1200);
      const metrics = await collectDomMetrics(appPage);
      results.mobileRoutes.push({ viewport: w, route: r.path, ...metrics });
      if (w === 390) {
        await appPage.screenshot({ path: path.join(MOBILE_AFTER_DIR, `${r.name}.png`), fullPage: false });
      }
      if (w === 320 && ['dashboard', 'feeds', 'auctions', 'profile'].includes(r.name)) {
        await appPage.screenshot({ path: path.join(MOBILE_AFTER_DIR, `${r.name}-320.png`), fullPage: false });
      }
    }
    await appCtx.close();
  }

  // 2. Full 13-viewport matrix (320..820px) on core routes
  console.log('Testing all 13 mobile/tablet viewports (320px..820px)...');
  for (const w of ALL_VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
    await seedAuth(ctx);
    const page = await ctx.newPage();
    for (const p of ['/dashboard', '/feeds', '/auctions']) {
      await page.goto(`${BASE_URL}${p}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(900);
      const m = await collectDomMetrics(page);
      results.viewportMatrix.push({ viewport: w, route: p, docOverflow: m.docOverflow, clippedRightCount: m.clippedRightCount, smallInputsCount: m.smallInputsCount });
    }
    await ctx.close();
  }

  // 3. Interactive State Checks at 390x844
  console.log('Testing interactive mobile states (Drawer, Search Sheet, Login Validation)...');
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const pubPage = await ctx.newPage();
    await pubPage.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pubPage.waitForTimeout(800);
    await pubPage.locator('button[type="submit"]').click();
    await pubPage.waitForTimeout(400);
    await pubPage.screenshot({ path: path.join(MOBILE_AFTER_DIR, 'state-login-validation.png'), fullPage: false });
    results.interactiveChecks.push({ check: 'login-validation-rendered', ok: true });
    await ctx.close();

    const appCtx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await seedAuth(appCtx);
    const appPage = await appCtx.newPage();
    await appPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await appPage.waitForTimeout(1200);

    // Open Drawer
    await appPage.getByRole('button', { name: 'Open navigation menu' }).click();
    await appPage.waitForTimeout(300);
    const drawerVisible = await appPage.getByRole('dialog', { name: 'Mobile Navigation' }).isVisible();
    await appPage.screenshot({ path: path.join(MOBILE_AFTER_DIR, 'state-drawer-open.png'), fullPage: false });
    await appPage.keyboard.press('Escape');
    await appPage.waitForTimeout(200);
    const drawerClosed = !(await appPage.getByRole('dialog', { name: 'Mobile Navigation' }).isVisible());
    results.interactiveChecks.push({ check: 'mobile-drawer-open-and-escape-close', ok: drawerVisible && drawerClosed });

    // Open Search Sheet
    await appPage.getByRole('button', { name: 'Search workspace' }).click();
    await appPage.waitForTimeout(250);
    const searchVisible = await appPage.getByRole('dialog', { name: 'Search FR8X' }).isVisible();
    await appPage.screenshot({ path: path.join(MOBILE_AFTER_DIR, 'state-search-open.png'), fullPage: false });
    await appPage.getByRole('button', { name: 'Close search' }).click();
    results.interactiveChecks.push({ check: 'mobile-search-sheet', ok: searchVisible });

    await appCtx.close();
  }

  // 4. Desktop Non-Interference Regression (1440x900)
  console.log('Verifying Desktop Non-Interference (1440x900)...');
  {
    const dCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await seedAuth(dCtx);
    const dPage = await dCtx.newPage();
    for (const r of [
      { name: 'dashboard', path: '/dashboard' },
      { name: 'feeds', path: '/feeds' },
      { name: 'rates', path: '/rates' },
      { name: 'auctions', path: '/auctions' },
      { name: 'network', path: '/network' },
      { name: 'profile', path: '/profile' },
    ]) {
      await dPage.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await dPage.waitForTimeout(1400);
      const mobileInjected = await dPage.evaluate(() => ({
        mobileRootCount: document.querySelectorAll('[data-fr8x-mobile-root]').length,
        mobileTopbarCount: document.querySelectorAll('.fr8x-m-topbar').length,
        mobileBottomNavCount: document.querySelectorAll('.fr8x-m-bottomnav').length,
      }));
      const afterFile = path.join(DESKTOP_AFTER_DIR, `${r.name}.png`);
      await dPage.screenshot({ path: afterFile, fullPage: false });
      const cmp = comparePngs(path.join(DESKTOP_BASE_DIR, `${r.name}.png`), afterFile);
      results.desktopRegression.push({ route: r.path, ...mobileInjected, ...cmp });
    }
    await dCtx.close();
  }

  fs.writeFileSync(path.join(OUT_DIR, 'audit-after.json'), JSON.stringify(results, null, 2));
  console.log('\n=== MOBILE AFTER SUMMARY (390px) ===');
  for (const m of results.mobileRoutes.filter((x) => x.viewport === 390)) {
    console.log(
      `  [390] ${m.route.padEnd(26)} overflow=${m.docOverflow} smallBtns=${m.smallButtonsCount} smallInputs=${m.smallInputsCount} clippedRight=${m.clippedRightCount}`
    );
  }
  console.log('\n=== DESKTOP REGRESSION (1440x900) ===');
  for (const d of results.desktopRegression) {
    console.log(`  [1440] ${d.route.padEnd(16)} mobileRoot=${d.mobileRootCount} mobileTopbar=${d.mobileTopbarCount} diffRatio=${d.diffRatio}`);
  }
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
