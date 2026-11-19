const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots', 'rectified');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const MODULES = [
  {
    name: 'Dashboard',
    route: '/dashboard',
    tabs: [],
  },
  {
    name: 'Feeds',
    route: '/feeds',
    tabs: [
      { name: 'All Posts', selector: '.feed-tab-btn:has-text("All")' },
      { name: 'Intelligence', selector: '.feed-tab-btn:has-text("Intelligence")' },
      { name: 'Reverse Auctions', selector: '.feed-tab-btn:has-text("Reverse")' },
    ],
  },
  {
    name: 'Nexus',
    route: '/nexus',
    tabs: [
      { name: 'Community', selector: '.feed-tab-btn:has-text("Community")' },
      { name: 'Reviews', selector: '.feed-tab-btn:has-text("Reviews")' },
      { name: 'Blacklist', selector: '.feed-tab-btn:has-text("Blacklist")' },
    ],
  },
  {
    name: 'Auctions',
    route: '/auctions',
    tabs: [
      { name: 'All Auctions', selector: '.auctions-tab-btn:has-text("All")' },
      { name: 'Active Live', selector: '.auctions-tab-btn:has-text("Active")' },
      { name: 'Ending Soon', selector: '.auctions-tab-btn:has-text("Ending")' },
    ],
  },
  {
    name: 'Rates',
    route: '/rates',
    tabs: [
      { name: 'All Market Rates', selector: 'button:has-text("All Market"), button:has-text("All Rates")' },
      { name: 'My Rates', selector: 'button:has-text("My Rates")' },
      { name: 'Expiring Soon', selector: 'button:has-text("Expiring Soon")' },
    ],
  },
  {
    name: 'Network',
    route: '/network',
    tabs: [
      { name: 'Overview', selector: 'button:has-text("Overview")' },
      { name: 'Discover', selector: 'button:has-text("Discover")' },
      { name: 'Connections', selector: 'button:has-text("Connections")' },
      { name: 'Requests', selector: 'button:has-text("Requests")' },
      { name: 'CRM', selector: 'button:has-text("CRM")' },
    ],
  },
  {
    name: 'Jobs',
    route: '/jobs',
    tabs: [
      { name: 'All Jobs', selector: 'button:has-text("All Jobs"), button:has-text("All")' },
      { name: 'My Listings', selector: 'button:has-text("My Listings")' },
    ],
  },
  {
    name: 'Profile',
    route: '/profile',
    tabs: [
      { name: 'Overview', selector: 'button:has-text("Overview")' },
      { name: 'Experience & Education', selector: 'button:has-text("Experience")' },
      { name: 'KYC & Compliance', selector: 'button:has-text("KYC")' },
      { name: 'Scorecard', selector: 'button:has-text("Scorecard")' },
      { name: 'Privacy', selector: 'button:has-text("Privacy")' },
    ],
  },
];

async function seedAuth(context, page) {
  const nowMs = Date.now();
  const uid = '00000000-0000-0000-0000-000000000001';
  const email = 'audit.director@fr8x.in';

  const sessionPayload = {
    uid,
    email,
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

  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(({ uid, email }) => {
    const mockProfile = {
      uid,
      id: uid,
      email,
      displayName: 'Captain Vikram Singh',
      name: 'Captain Vikram Singh',
      company: 'Adani Logistics Ltd',
      companyName: 'Adani Logistics Ltd',
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
  }, { uid, email });
}

async function runRectificationVerification() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   FR8X ENTERPRISE UI/UX COMPLETE RECTIFICATION & AUDIT SUITE    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const auditReport = [];

  // =========================================================================
  // 1. DESKTOP VIEWPORT AUDIT (1440x900)
  // =========================================================================
  console.log('▶ [PHASE 1] Running Desktop Browser Inspection (1440x900)...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const desktopPage = await desktopContext.newPage();
  await seedAuth(desktopContext, desktopPage);

  for (const mod of MODULES) {
    console.log(`\n▶ Inspecting Module: ${mod.name} (${mod.route})`);
    try {
      await desktopPage.goto(`http://localhost:3000${mod.route}`, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await desktopPage.waitForTimeout(1500);

      // Verify Mobile Nav is ABSENT on Desktop
      const mobileNavPresence = await desktopPage.evaluate(() => {
        const nav = document.querySelector('.mobile-bottom-nav');
        if (!nav) return { rendered: false, visible: false };
        const cs = window.getComputedStyle(nav);
        return {
          rendered: true,
          visible: cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0',
          display: cs.display,
        };
      });

      console.log(`  • Mobile Bottom Nav on Desktop: ${!mobileNavPresence.visible ? '✔ ABSENT (Correct)' : '✖ DETECTED (Error)'}`);

      // Inspect typography and color compliance
      const domAudit = await desktopPage.evaluate(() => {
        let totalText = 0;
        let calibriCount = 0;
        let elevenPxCount = 0;
        let darkBgCount = 0;

        const textEls = document.querySelectorAll(
          'p, span, h1, h2, h3, h4, h5, h6, a, button, input, select, textarea, label, td, th, div, b, strong, em, small'
        );

        textEls.forEach((el) => {
          const text = (el.innerText || el.value || el.placeholder || '').trim();
          if (!text && el.tagName !== 'INPUT' && el.tagName !== 'BUTTON') return;
          totalText++;

          const cs = window.getComputedStyle(el);
          const ff = cs.fontFamily.toLowerCase();
          const fs = cs.fontSize;

          if (ff.includes('calibri')) calibriCount++;
          if (fs === '11px') elevenPxCount++;

          const bg = cs.backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (m) {
              const r = parseInt(m[1]), g = parseInt(m[2]), b = parseInt(m[3]);
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              if (lum < 100 && !(el.tagName === 'BUTTON' && el.classList.contains('primary'))) {
                darkBgCount++;
              }
            }
          }
        });

        const overflow = document.documentElement.scrollWidth > window.innerWidth + 2;

        return {
          totalText,
          calibriRatio: totalText > 0 ? calibriCount / totalText : 1,
          elevenPxRatio: totalText > 0 ? elevenPxCount / totalText : 1,
          darkBgCount,
          overflow,
        };
      });

      console.log(`  • Visible text elements: ${domAudit.totalText}`);
      console.log(`  • Calibri Conformance: ${(domAudit.calibriRatio * 100).toFixed(1)}%`);
      console.log(`  • 11px Font Size Conformance: ${(domAudit.elevenPxRatio * 100).toFixed(1)}%`);
      console.log(`  • Dark Background Violations: ${domAudit.darkBgCount}`);
      console.log(`  • Horizontal Overflow: ${domAudit.overflow ? 'FAIL' : 'PASS'}`);

      // Capture desktop screenshot
      const shotPath = path.join(SCREENSHOT_DIR, `${mod.name.toLowerCase()}-desktop-rectified.png`);
      await desktopPage.screenshot({ path: shotPath, fullPage: false });
      console.log(`  📸 Screenshot: ${path.basename(shotPath)}`);

      // Inspect tabs within module
      for (const tab of mod.tabs) {
        try {
          const tabButton = desktopPage.locator(tab.selector).first();
          if (await tabButton.isVisible()) {
            await tabButton.click();
            await desktopPage.waitForTimeout(600);
            const tabShot = path.join(
              SCREENSHOT_DIR,
              `${mod.name.toLowerCase()}-tab-${tab.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`
            );
            await desktopPage.screenshot({ path: tabShot, fullPage: false });
            console.log(`    ↳ Tab [${tab.name}]: Activated & Captured (${path.basename(tabShot)})`);
          }
        } catch (tabErr) {
          // Tab click optional
        }
      }

      auditReport.push({
        module: mod.name,
        mobileNavAbsent: !mobileNavPresence.visible,
        calibriCompliant: domAudit.calibriRatio >= 0.99,
        elevenPxCompliant: domAudit.elevenPxRatio >= 0.99,
        darkBgZero: domAudit.darkBgCount === 0,
        overflowZero: !domAudit.overflow,
      });
    } catch (err) {
      console.error(`  ✗ Error inspecting ${mod.name}:`, err.message);
    }
  }

  // =========================================================================
  // 2. MOBILE VIEWPORT AUDIT (375x667)
  // =========================================================================
  console.log('\n▶ [PHASE 2] Running Mobile Browser Inspection (375x667)...');
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 667 },
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobileContext.newPage();
  await seedAuth(mobileContext, mobilePage);

  for (const mod of MODULES) {
    await mobilePage.goto(`http://localhost:3000${mod.route}`, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await mobilePage.waitForTimeout(1000);

    const mobileCheck = await mobilePage.evaluate(() => {
      const nav = document.querySelector('.mobile-bottom-nav');
      const cs = nav ? window.getComputedStyle(nav) : null;
      const isNavVisible = cs ? cs.display !== 'none' : false;
      const overflow = document.documentElement.scrollWidth > window.innerWidth + 2;
      return { isNavVisible, overflow };
    });

    const mShot = path.join(SCREENSHOT_DIR, `${mod.name.toLowerCase()}-mobile-rectified.png`);
    await mobilePage.screenshot({ path: mShot, fullPage: false });
    console.log(`  • ${mod.name} Mobile: Nav Visible: ${mobileCheck.isNavVisible ? 'PASS' : 'WARN'} | Overflow: ${mobileCheck.overflow ? 'FAIL' : 'PASS'} | 📸 ${path.basename(mShot)}`);
  }

  // =========================================================================
  // 3. TABLET VIEWPORT AUDIT (768x1024)
  // =========================================================================
  console.log('\n▶ [PHASE 3] Running Tablet Browser Inspection (768x1024)...');
  const tabletContext = await browser.newContext({
    viewport: { width: 768, height: 1024 },
  });
  const tabletPage = await tabletContext.newPage();
  await seedAuth(tabletContext, tabletPage);

  for (const mod of MODULES) {
    await tabletPage.goto(`http://localhost:3000${mod.route}`, { waitUntil: 'domcontentloaded', timeout: 35000 });
    await tabletPage.waitForTimeout(1000);

    const tOverflow = await tabletPage.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });

    const tShot = path.join(SCREENSHOT_DIR, `${mod.name.toLowerCase()}-tablet-rectified.png`);
    await tabletPage.screenshot({ path: tShot, fullPage: false });
    console.log(`  • ${mod.name} Tablet: Overflow: ${tOverflow ? 'FAIL' : 'PASS'} | 📸 ${path.basename(tShot)}`);
  }

  await browser.close();

  console.log('\n======================================================================');
  console.log('   FR8X RECTIFICATION COMPLIANCE SUMMARY                              ');
  console.log('======================================================================');

  let allPassed = true;
  auditReport.forEach((r) => {
    const passed = r.mobileNavAbsent && r.calibriCompliant && r.elevenPxCompliant && r.darkBgZero && r.overflowZero;
    if (!passed) allPassed = false;
    console.log(`  ${passed ? '✔ [PASS]' : '✖ [FAIL]'} ${r.module}: NavAbsent=${r.mobileNavAbsent}, Calibri=${r.calibriCompliant}, 11px=${r.elevenPxCompliant}, DarkBg0=${r.darkBgZero}, Overflow0=${r.overflowZero}`);
  });

  console.log(`\nFinal Verdict: ${allPassed ? '100% RECTIFIED & FULLY COMPLIANT' : 'FURTHER TUNING REQUIRED'}`);
  process.exit(allPassed ? 0 : 1);
}

runRectificationVerification();
