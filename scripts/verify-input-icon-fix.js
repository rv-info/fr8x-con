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
  console.log('🚀 Starting Chrome Input-Icon & Placeholder Non-Overlap Verification...');
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

    // 1. Inspect Rates page: CARRIER, POR, POL, POD, FPOD inputs
    console.log(`\n[${vp.name}] Checking /rates fields: CARRIER, POR, POL, POD, FPOD...`);
    await page.goto('http://localhost:3000/rates', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(2000);

    const rateFields = await page.evaluate(() => {
      const inspectInput = (labelPrefix, placeholderText) => {
        const inputs = Array.from(document.querySelectorAll('input'));
        const input = inputs.find(i => (i.placeholder || '').toLowerCase() === placeholderText.toLowerCase());
        if (!input) return null;

        const parent = input.parentElement;
        const icon = parent ? parent.querySelector('svg') : null;
        const computedStyle = window.getComputedStyle(input);
        const paddingLeft = parseFloat(computedStyle.paddingLeft);
        const inputRect = input.getBoundingClientRect();

        let iconInfo = null;
        let overlap = false;
        if (icon) {
          const iconRect = icon.getBoundingClientRect();
          const iconRelativeLeft = iconRect.left - inputRect.left;
          const iconRelativeRight = iconRect.right - inputRect.left;
          iconInfo = {
            width: iconRect.width,
            height: iconRect.height,
            relativeLeft: iconRelativeLeft,
            relativeRight: iconRelativeRight,
          };
          overlap = iconRelativeRight > paddingLeft;
        }

        return {
          placeholder: input.placeholder,
          value: input.value,
          paddingLeft: paddingLeft,
          paddingLeftCSS: computedStyle.paddingLeft,
          hasIcon: Boolean(icon),
          iconInfo,
          overlap,
        };
      };

      return {
        carrier: inspectInput('CARRIER', 'Carrier'),
        por: inspectInput('POR', 'POR'),
        pol: inspectInput('POL', 'POL'),
        pod: inspectInput('POD', 'POD'),
        fpod: inspectInput('FPOD', 'FPOD'),
        globalSearch: inspectInput('Global Search', 'Global Search: Carrier, Port, Container Type, Route, Remarks…'),
      };
    });

    console.log(`Results for ${vp.name} /rates:`);
    for (const [key, field] of Object.entries(rateFields)) {
      if (field) {
        const gap = field.iconInfo ? (field.paddingLeft - field.iconInfo.relativeRight).toFixed(1) : 'N/A';
        console.log(`  • ${key.toUpperCase()}: placeholder="${field.placeholder}", paddingLeft=${field.paddingLeftCSS}, hasIcon=${field.hasIcon}, iconRight=${field.iconInfo ? field.iconInfo.relativeRight.toFixed(1) + 'px' : 'N/A'}, OVERLAP=${field.overlap ? '❌ YES' : `✅ NO (Clean gap: ${gap}px)`}`);
        results.push({ viewport: vp.name, page: '/rates', field: key, ...field });
      } else {
        console.log(`  • ${key.toUpperCase()}: NOT FOUND in DOM`);
      }
    }

    // Take screenshot of rates page
    await page.screenshot({ path: path.join(OUT_DIR, `rates-${vp.name}-overview.png`), fullPage: false });

    // 2. Check /auctions
    console.log(`\n[${vp.name}] Checking /auctions search bar...`);
    await page.goto('http://localhost:3000/auctions', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1500);

    const auctionSearch = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search auctions by ID"]');
      if (!input) return null;
      const parent = input.parentElement;
      const icon = parent ? parent.querySelector('svg') : null;
      const computed = window.getComputedStyle(input);
      const paddingLeft = parseFloat(computed.paddingLeft);
      const inputRect = input.getBoundingClientRect();
      let iconInfo = null;
      let overlap = false;
      if (icon) {
        const iconRect = icon.getBoundingClientRect();
        iconInfo = {
          relativeLeft: iconRect.left - inputRect.left,
          relativeRight: iconRect.right - inputRect.left,
        };
        overlap = iconInfo.relativeRight > paddingLeft;
      }
      return { placeholder: input.placeholder, paddingLeft: computed.paddingLeft, hasIcon: Boolean(icon), iconInfo, overlap };
    });

    if (auctionSearch) {
      const gap = auctionSearch.iconInfo ? (parseFloat(auctionSearch.paddingLeft) - auctionSearch.iconInfo.relativeRight).toFixed(1) : 'N/A';
      console.log(`  • AUCTIONS SEARCH: paddingLeft=${auctionSearch.paddingLeft}, OVERLAP=${auctionSearch.overlap ? '❌ YES' : `✅ NO (Clean gap: ${gap}px)`}`);
      results.push({ viewport: vp.name, page: '/auctions', field: 'auctionSearch', ...auctionSearch });
    }
    await page.screenshot({ path: path.join(OUT_DIR, `auctions-${vp.name}.png`), fullPage: false });

    // 3. Check /jobs
    console.log(`\n[${vp.name}] Checking /jobs search bar...`);
    await page.goto('http://localhost:3000/jobs', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1500);

    const jobSearch = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search jobs, companies"]');
      if (!input) return null;
      const parent = input.parentElement;
      const icon = parent ? parent.querySelector('svg') : null;
      const computed = window.getComputedStyle(input);
      const paddingLeft = parseFloat(computed.paddingLeft);
      const inputRect = input.getBoundingClientRect();
      let iconInfo = null;
      let overlap = false;
      if (icon) {
        const iconRect = icon.getBoundingClientRect();
        iconInfo = {
          relativeLeft: iconRect.left - inputRect.left,
          relativeRight: iconRect.right - inputRect.left,
        };
        overlap = iconInfo.relativeRight > paddingLeft;
      }
      return { placeholder: input.placeholder, paddingLeft: computed.paddingLeft, hasIcon: Boolean(icon), iconInfo, overlap };
    });

    if (jobSearch) {
      const gap = jobSearch.iconInfo ? (parseFloat(jobSearch.paddingLeft) - jobSearch.iconInfo.relativeRight).toFixed(1) : 'N/A';
      console.log(`  • JOBS SEARCH: paddingLeft=${jobSearch.paddingLeft}, OVERLAP=${jobSearch.overlap ? '❌ YES' : `✅ NO (Clean gap: ${gap}px)`}`);
      results.push({ viewport: vp.name, page: '/jobs', field: 'jobSearch', ...jobSearch });
    }
    await page.screenshot({ path: path.join(OUT_DIR, `jobs-${vp.name}.png`), fullPage: false });

    // 4. Check /network
    console.log(`\n[${vp.name}] Checking /network search bars...`);
    await page.goto('http://localhost:3000/network', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(1500);

    const networkSearch = await page.evaluate(() => {
      const input = document.querySelector('input[placeholder*="Search freight professionals"]');
      if (!input) return null;
      const parent = input.parentElement;
      const icon = parent ? parent.querySelector('svg') : null;
      const computed = window.getComputedStyle(input);
      const paddingLeft = parseFloat(computed.paddingLeft);
      const inputRect = input.getBoundingClientRect();
      let iconInfo = null;
      let overlap = false;
      if (icon) {
        const iconRect = icon.getBoundingClientRect();
        iconInfo = {
          relativeLeft: iconRect.left - inputRect.left,
          relativeRight: iconRect.right - inputRect.left,
        };
        overlap = iconInfo.relativeRight > paddingLeft;
      }
      return { placeholder: input.placeholder, paddingLeft: computed.paddingLeft, hasIcon: Boolean(icon), iconInfo, overlap };
    });

    if (networkSearch) {
      const gap = networkSearch.iconInfo ? (parseFloat(networkSearch.paddingLeft) - networkSearch.iconInfo.relativeRight).toFixed(1) : 'N/A';
      console.log(`  • NETWORK SEARCH: paddingLeft=${networkSearch.paddingLeft}, OVERLAP=${networkSearch.overlap ? '❌ YES' : `✅ NO (Clean gap: ${gap}px)`}`);
      results.push({ viewport: vp.name, page: '/network', field: 'networkSearch', ...networkSearch });
    }
    await page.screenshot({ path: path.join(OUT_DIR, `network-${vp.name}.png`), fullPage: false });

    await context.close();
  }

  await browser.close();

  // Summary Report
  console.log('\n======================================================');
  console.log('📊 FINAL VERIFICATION AUDIT SUMMARY');
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
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
