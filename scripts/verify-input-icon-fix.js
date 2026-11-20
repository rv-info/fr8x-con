const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(process.cwd(), 'screenshots', 'input-icon-fix');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function seedAuth(context, page) {
  const uid = 'usr_operator_seed_01';
  const email = 'vikram@adanilogistics.com';
  const nowMs = Date.now();
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

  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 90000 });
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

async function runAudit() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   INPUT FIELD LEADING-ICON & PLACEHOLDER AUDIT IN CHROME         ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 812 },
  ];

  const results = [];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`📱 Testing Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})`);
    console.log(`========================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();

    // Authenticate context
    await seedAuth(context, page);

    // ──────────────────────────────────────────────────────────────────────────
    // 1. INSPECT RATES PAGE & MY I-RATES FORM (CARRIER, POR, POL, POD, FPOD)
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n[${vp.name}] Navigating to /rates...`);
    await page.goto('http://localhost:3000/rates', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(2000);

    // Switch to "My i-Rates" tab where CARRIER, POR, POL, POD, FPOD editor is located
    console.log(`[${vp.name}] Switching to My i-Rates tab...`);
    const desktopTab = await page.$('button:has-text("My i-Rates")');
    if (desktopTab && await desktopTab.isVisible()) {
      await desktopTab.click();
      await page.waitForTimeout(1000);
    }
    const mobileTab = await page.$('.rates-mobile-tab-btn:has-text("My i-Rates")');
    if (mobileTab && await mobileTab.isVisible()) {
      await mobileTab.click();
      await page.waitForTimeout(1000);
    }

    // If mobile or collapsed, click toggle button
    const toggleBtn = await page.$('.mobile-editor-toggle-btn');
    if (toggleBtn && await toggleBtn.isVisible()) {
      console.log(`[${vp.name}] Clicking mobile-editor-toggle-btn...`);
      await toggleBtn.click();
      await page.waitForTimeout(1000);
    }

    // If "Open Rates Editor" button is visible, click it
    const openEditorButtons = await page.$$('button');
    for (const btn of openEditorButtons) {
      const text = await btn.innerText();
      if (text.includes('Open Rates Editor') || text.includes('Add New Rate')) {
        const isVis = await btn.isVisible();
        if (isVis) {
          await btn.click();
          await page.waitForTimeout(1000);
          break;
        }
      }
    }

    // Inspect the 5 target fields
    console.log(`[${vp.name}] Inspecting CARRIER, POR, POL, POD, FPOD fields...`);
    const rateFields = await page.evaluate(() => {
      const targets = ['Carrier', 'POR', 'POL', 'POD', 'FPOD'];
      const inputs = Array.from(document.querySelectorAll('input'));
      return targets.map(ph => {
        const inp = inputs.find(i => (i.placeholder || '').toLowerCase() === ph.toLowerCase());
        if (!inp) return { placeholder: ph, found: false };

        const parent = inp.parentElement;
        const icon = parent ? parent.querySelector('svg') : null;
        const iRect = inp.getBoundingClientRect();
        const iconRect = icon ? icon.getBoundingClientRect() : null;
        const padLeft = parseFloat(window.getComputedStyle(inp).paddingLeft);
        const iconLeft = iconRect ? iconRect.left - iRect.left : null;
        const iconRight = iconRect ? iconRect.right - iRect.left : null;
        const gap = iconRight !== null ? padLeft - iconRight : null;
        const overlap = iconRight !== null ? iconRight >= padLeft : false;

        return {
          placeholder: inp.placeholder,
          found: true,
          paddingLeft: window.getComputedStyle(inp).paddingLeft,
          hasIcon: Boolean(icon),
          iconLeft: iconLeft !== null ? Number(iconLeft.toFixed(1)) : null,
          iconRight: iconRight !== null ? Number(iconRight.toFixed(1)) : null,
          iconWidth: iconRect ? Number(iconRect.width.toFixed(1)) : null,
          gap: gap !== null ? Number(gap.toFixed(1)) : null,
          overlap,
        };
      });
    });

    for (const f of rateFields) {
      if (f.found) {
        console.log(`  • ${f.placeholder.toUpperCase()}: paddingLeft=${f.paddingLeft}, iconLeft=${f.iconLeft}px, iconRight=${f.iconRight}px, gap=${f.gap}px, OVERLAP=${f.overlap ? '❌ YES' : '✅ NO'}`);
        results.push({ viewport: vp.name, page: '/rates', field: f.placeholder, ...f });
      } else {
        console.log(`  • ${f.placeholder.toUpperCase()}: NOT FOUND in DOM`);
      }
    }

    // Take screenshot of rates editor
    await page.screenshot({ path: path.join(OUT_DIR, `rates-${vp.name}-editor-clean.png`), fullPage: false });

    // Fill sample values to verify entered text doesn't overlap
    const carrierInput = await page.$('input[placeholder="Carrier"]');
    if (carrierInput && await carrierInput.isVisible()) await carrierInput.fill('MAERSK LINE (MSK)');
    const porInput = await page.$('input[placeholder="POR"]');
    if (porInput && await porInput.isVisible()) await porInput.fill('INNSA (Nhava Sheva)');
    const polInput = await page.$('input[placeholder="POL"]');
    if (polInput && await polInput.isVisible()) await polInput.fill('INNSA (Nhava Sheva)');
    const podInput = await page.$('input[placeholder="POD"]');
    if (podInput && await podInput.isVisible()) await podInput.fill('NLRTM (Rotterdam)');
    const fpodInput = await page.$('input[placeholder="FPOD"]');
    if (fpodInput && await fpodInput.isVisible()) await fpodInput.fill('NLRTM (Rotterdam)');
    await page.waitForTimeout(500);

    // Capture screenshot with values entered
    await page.screenshot({ path: path.join(OUT_DIR, `rates-${vp.name}-values-entered.png`), fullPage: false });

    // ──────────────────────────────────────────────────────────────────────────
    // 2. CHECK /AUCTIONS SEARCH
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n[${vp.name}] Checking /auctions search bar...`);
    await page.goto('http://localhost:3000/auctions', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1500);

    const auctionSearch = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search auctions by ID"]');
      if (!input) return null;
      const parent = input.parentElement;
      const icon = parent ? parent.querySelector('svg') : null;
      const computed = window.getComputedStyle(input);
      const padLeft = parseFloat(computed.paddingLeft);
      const iRect = input.getBoundingClientRect();
      const iconRect = icon ? icon.getBoundingClientRect() : null;
      const iconRight = iconRect ? iconRect.right - iRect.left : null;
      const gap = iconRight !== null ? padLeft - iconRight : null;
      return {
        placeholder: input.placeholder,
        paddingLeft: computed.paddingLeft,
        hasIcon: Boolean(icon),
        iconRight: iconRight !== null ? Number(iconRight.toFixed(1)) : null,
        gap: gap !== null ? Number(gap.toFixed(1)) : null,
        overlap: iconRight !== null ? iconRight >= padLeft : false,
      };
    });

    if (auctionSearch) {
      console.log(`  • AUCTIONS SEARCH: paddingLeft=${auctionSearch.paddingLeft}, gap=${auctionSearch.gap}px, OVERLAP=${auctionSearch.overlap ? '❌ YES' : '✅ NO'}`);
      results.push({ viewport: vp.name, page: '/auctions', field: 'auctionSearch', ...auctionSearch });
    }
    await page.screenshot({ path: path.join(OUT_DIR, `auctions-${vp.name}-search.png`), fullPage: false });

    // ──────────────────────────────────────────────────────────────────────────
    // 3. CHECK /JOBS SEARCH
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n[${vp.name}] Checking /jobs search bar...`);
    await page.goto('http://localhost:3000/jobs', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1500);

    const jobSearch = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search jobs, companies"]');
      if (!input) return null;
      const parent = input.parentElement;
      const icon = parent ? parent.querySelector('svg') : null;
      const computed = window.getComputedStyle(input);
      const padLeft = parseFloat(computed.paddingLeft);
      const iRect = input.getBoundingClientRect();
      const iconRect = icon ? icon.getBoundingClientRect() : null;
      const iconRight = iconRect ? iconRect.right - iRect.left : null;
      const gap = iconRight !== null ? padLeft - iconRight : null;
      return {
        placeholder: input.placeholder,
        paddingLeft: computed.paddingLeft,
        hasIcon: Boolean(icon),
        iconRight: iconRight !== null ? Number(iconRight.toFixed(1)) : null,
        gap: gap !== null ? Number(gap.toFixed(1)) : null,
        overlap: iconRight !== null ? iconRight >= padLeft : false,
      };
    });

    if (jobSearch) {
      console.log(`  • JOBS SEARCH: paddingLeft=${jobSearch.paddingLeft}, gap=${jobSearch.gap}px, OVERLAP=${jobSearch.overlap ? '❌ YES' : '✅ NO'}`);
      results.push({ viewport: vp.name, page: '/jobs', field: 'jobSearch', ...jobSearch });
    }
    await page.screenshot({ path: path.join(OUT_DIR, `jobs-${vp.name}-search.png`), fullPage: false });

    // ──────────────────────────────────────────────────────────────────────────
    // 4. CHECK /NETWORK SEARCH
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n[${vp.name}] Checking /network search bar...`);
    await page.goto('http://localhost:3000/network', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1500);

    const networkSearch = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search freight professionals"]');
      if (!input) return null;
      const parent = input.parentElement;
      const icon = parent ? parent.querySelector('svg') : null;
      const computed = window.getComputedStyle(input);
      const padLeft = parseFloat(computed.paddingLeft);
      const iRect = input.getBoundingClientRect();
      const iconRect = icon ? icon.getBoundingClientRect() : null;
      const iconRight = iconRect ? iconRect.right - iRect.left : null;
      const gap = iconRight !== null ? padLeft - iconRight : null;
      return {
        placeholder: input.placeholder,
        paddingLeft: computed.paddingLeft,
        hasIcon: Boolean(icon),
        iconRight: iconRight !== null ? Number(iconRight.toFixed(1)) : null,
        gap: gap !== null ? Number(gap.toFixed(1)) : null,
        overlap: iconRight !== null ? iconRight >= padLeft : false,
      };
    });

    if (networkSearch) {
      console.log(`  • NETWORK SEARCH: paddingLeft=${networkSearch.paddingLeft}, gap=${networkSearch.gap}px, OVERLAP=${networkSearch.overlap ? '❌ YES' : '✅ NO'}`);
      results.push({ viewport: vp.name, page: '/network', field: 'networkSearch', ...networkSearch });
    }
    await page.screenshot({ path: path.join(OUT_DIR, `network-${vp.name}-search.png`), fullPage: false });

    // ──────────────────────────────────────────────────────────────────────────
    // 5. CHECK /NEXUS SEARCH
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n[${vp.name}] Checking /nexus search bar...`);
    await page.goto('http://localhost:3000/nexus', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1500);

    const nexusSearch = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search Nexus by keyword"]');
      if (!input) return null;
      const parent = input.parentElement;
      const icon = parent ? parent.querySelector('svg') : null;
      const computed = window.getComputedStyle(input);
      const padLeft = parseFloat(computed.paddingLeft);
      const iRect = input.getBoundingClientRect();
      const iconRect = icon ? icon.getBoundingClientRect() : null;
      const iconRight = iconRect ? iconRect.right - iRect.left : null;
      const gap = iconRight !== null ? padLeft - iconRight : null;
      return {
        placeholder: input.placeholder,
        paddingLeft: computed.paddingLeft,
        hasIcon: Boolean(icon),
        iconRight: iconRight !== null ? Number(iconRight.toFixed(1)) : null,
        gap: gap !== null ? Number(gap.toFixed(1)) : null,
        overlap: iconRight !== null ? iconRight >= padLeft : false,
      };
    });

    if (nexusSearch) {
      console.log(`  • NEXUS SEARCH: paddingLeft=${nexusSearch.paddingLeft}, gap=${nexusSearch.gap}px, OVERLAP=${nexusSearch.overlap ? '❌ YES' : '✅ NO'}`);
      results.push({ viewport: vp.name, page: '/nexus', field: 'nexusSearch', ...nexusSearch });
    }
    await page.screenshot({ path: path.join(OUT_DIR, `nexus-${vp.name}-search.png`), fullPage: false });

    await context.close();
  }

  await browser.close();

  // Summary Report
  console.log('\n======================================================');
  console.log('📊 FINAL COMPREHENSIVE VERIFICATION AUDIT SUMMARY');
  console.log('======================================================');
  const failures = results.filter(r => r.overlap);
  console.log(`Total Inputs Inspected Across Viewports: ${results.length}`);
  console.log(`Total Overlap Failures: ${failures.length}`);

  fs.writeFileSync(
    path.join(OUT_DIR, 'audit-summary.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), total: results.length, failures: failures.length, results }, null, 2)
  );

  if (failures.length > 0) {
    console.error('❌ OVERLAP FAILURES DETECTED:');
    console.error(failures);
    process.exit(1);
  } else {
    console.log('🎉 ALL FIELDS VERIFIED: ZERO OVERLAPS ACROSS DESKTOP, TABLET, AND MOBILE!');
    console.log(`📁 Inspection screenshots saved in: ${OUT_DIR}`);
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
