import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();

function verifySourceContracts() {
  const loadingSys = fs.readFileSync(path.join(root, 'components/ui/LoadingSystem.tsx'), 'utf8');
  const loadingCss = fs.readFileSync(path.join(root, 'components/ui/loading.css'), 'utf8');
  const delayedHook = fs.readFileSync(path.join(root, 'lib/hooks/useDelayedLoading.ts'), 'utf8');
  const skeleton = fs.readFileSync(path.join(root, 'components/ui/SkeletonScreen.tsx'), 'utf8');
  const button = fs.readFileSync(path.join(root, 'components/ui/Button.tsx'), 'utf8');
  const appShell = fs.readFileSync(path.join(root, 'components/layout/AppShell.tsx'), 'utf8');

  assert(loadingSys.includes('export function AnimatedOrb'), 'AnimatedOrb exported');
  assert(loadingSys.includes('export function OrbLoader'), 'OrbLoader exported');
  assert(loadingSys.includes('export function RouteTransitionBar'), 'RouteTransitionBar exported');
  assert(loadingSys.includes('role="status"') && loadingSys.includes('aria-live="polite"'), 'Accessible status roles');
  assert(loadingCss.includes('#26313A'), 'Blue Shadow #26313A primary orb color');
  assert(loadingCss.includes('prefers-reduced-motion: reduce'), 'Reduced motion support');
  assert(delayedHook.includes('delayMs = 180'), '180ms calibrated delay');
  assert(skeleton.includes("'form'") && skeleton.includes("'chart'") && skeleton.includes("'modal'") && skeleton.includes("'list'"), 'Extended skeleton variants');
  assert(button.includes('<AnimatedOrb'), 'Button uses AnimatedOrb');
  assert(appShell.includes('<OrbLoader') && appShell.includes('<RouteTransitionBar'), 'AppShell integrates OrbLoader & RouteTransitionBar');
  console.log('✓ Source contracts verified');
}

async function seedSessionCookie(context: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newContext']>>) {
  const nowMs = Date.now();
  const payloadB64 = Buffer.from(
    JSON.stringify({
      uid: '00000000-0000-0000-0000-000000000001',
      email: 'audit.director@fr8x.in',
      issuedAt: nowMs,
      expiresAt: nowMs + 86400000,
    })
  ).toString('base64url');
  await context.addCookies([
    {
      name: 'fr8x_session',
      value: `${payloadB64}.mockvalidsignature`,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

async function verifyBrowserStates() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop (1440x900): verify bootstrap OrbLoader size (~64px) and ARIA
  const dCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await seedSessionCookie(dCtx);
  const dPage = await dCtx.newPage();
  await dPage.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const dOrb = await dPage.locator('.fr8x-orb--page').first();
  await dOrb.waitFor({ state: 'visible', timeout: 5000 });
  const dBox = await dOrb.boundingBox();
  assert(dBox && dBox.width >= 56 && dBox.width <= 72, `Desktop page orb expected 56-72px, got ${dBox?.width}`);
  const dStatus = await dPage.locator('.fr8x-loader-page[role="status"][aria-live="polite"][aria-busy="true"]').count();
  assert(dStatus >= 1, 'Desktop page loader exposes role=status, aria-live=polite, aria-busy=true');
  await dPage.screenshot({ path: path.join(root, 'mobile/qa/screenshots/desktop-after/orb-bootstrap.png') });
  await dCtx.close();

  // 2. Mobile (390x844): verify scaled mobile page orb (~50px) & reduced-motion
  const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await seedSessionCookie(mCtx);
  const mPage = await mCtx.newPage();
  await mPage.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
  const mOrb = await mPage.locator('.fr8x-orb--page').first();
  await mOrb.waitFor({ state: 'visible', timeout: 5000 });
  const mInfo = await mOrb.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const ring = el.querySelector('.fr8x-orb-ring-outer');
    return { width: r.width, animName: ring ? getComputedStyle(ring).animationName : null };
  });
  assert(mInfo.width >= 44 && mInfo.width <= 56, `Mobile page orb expected 44-56px, got ${mInfo.width}`);
  assert(mInfo.animName === 'none', `Expected animationName=none under prefers-reduced-motion, got ${mInfo.animName}`);
  await mPage.screenshot({ path: path.join(root, 'mobile/qa/screenshots/mobile-after/orb-bootstrap.png') });
  await mCtx.close();

  await browser.close();
  console.log('✓ Browser desktop, mobile, ARIA, and reduced-motion orb states verified');
}

async function main() {
  verifySourceContracts();
  await verifyBrowserStates();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
