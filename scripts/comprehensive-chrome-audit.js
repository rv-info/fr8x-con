const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Routes to inspect
const ROUTES = [
  // Public & Auth Routes
  { name: 'Login Screen', path: '/login', isPublic: true },
  { name: 'Enterprise Registration', path: '/register', isPublic: true },
  { name: 'Reset Password', path: '/reset-password', isPublic: true },
  { name: 'Verify Email Notice', path: '/verify-email', isPublic: true },
  { name: 'Privacy Policy', path: '/privacy', isPublic: true },
  { name: 'Terms of Service', path: '/terms', isPublic: true },
  { name: 'Godfather Login', path: '/godfather/login', isPublic: true },

  // Core App Workspaces
  { name: 'Operational Dashboard', path: '/dashboard' },
  { name: 'Spot Freight Auctions', path: '/auctions' },
  { name: 'Create Spot Auction', path: '/auctions/create' },
  { name: 'Rate Intelligence Benchmarks', path: '/rates' },
  { name: 'Consolidated Network Hub', path: '/network' },
  { name: 'People Search Directory', path: '/people' },
  { name: 'Network CRM Contacts', path: '/contacts' },
  { name: 'Connection Requests Manager', path: '/connections' },
  { name: 'Logistics Career Board', path: '/jobs' },
  { name: 'Industry Freight Feed', path: '/feeds' },
  { name: 'Nexus Community Forum', path: '/nexus' },
  { name: 'Freight Passport & Profile', path: '/profile' },
  { name: 'Notification Center', path: '/notifications' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
];

async function runComprehensiveChromeAudit() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   FR8X ENTERPRISE CHROME BROWSER FULL APPLICATION AUDIT          ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: VIEWPORTS[0] });

  // 1. Setup authenticated session cookies and localStorage
  const nowMs = Date.now();
  const uid = '00000000-0000-0000-0000-000000000001';
  const email = 'audit.engineer@fr8x.in';

  const sessionPayload = {
    uid,
    email,
    issuedAt: nowMs,
    expiresAt: nowMs + 2 * 60 * 60 * 1000,
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

  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon.ico') && !text.includes('WebSocket')) {
        consoleErrors.push({ url: page.url(), text });
      }
    }
  });

  const failedRequests = [];
  page.on('requestfailed', (req) => {
    const url = req.url();
    if (!url.includes('favicon.ico')) {
      failedRequests.push({ url, failure: req.failure() });
    }
  });

  // Seed authenticated localStorage
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
    localStorage.setItem('fr8x_user_status', 'available');
    localStorage.setItem('fr8x_last_activity_time', now);
    localStorage.setItem('fr8x_session_start_time', now);
    localStorage.setItem('fr8x_user', JSON.stringify(mockProfile));
    localStorage.setItem('fr8x_auth_token', 'mock-valid-token');
  }, { uid, email });

  const auditReport = [];

  // Inspect each route on Desktop first
  for (const r of ROUTES) {
    console.log(`\n▶ Inspecting Route: ${r.name} (${r.path})`);
    try {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`http://localhost:3000${r.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(2000); // Allow hydration

      // Detailed DOM & Computed Style Audit
      const domAudit = await page.evaluate(() => {
        const textElements = Array.from(document.querySelectorAll(
          'h1, h2, h3, h4, h5, h6, p, span, a, button, input, label, th, td, b, strong, small, optgroup, option, textarea, kbd, em'
        ));

        let totalTextElements = 0;
        let calibriCount = 0;
        let elevenPxCount = 0;
        const nonCalibriSamples = [];
        const non11PxSamples = [];
        const darkBackgrounds = [];

        textElements.forEach((el) => {
          const text = (el.innerText || el.value || el.placeholder || '').trim();
          if (!text && el.tagName !== 'INPUT' && el.tagName !== 'BUTTON') return;
          totalTextElements++;

          const cs = window.getComputedStyle(el);
          const ff = cs.fontFamily.toLowerCase();
          const fs = cs.fontSize;

          if (ff.includes('calibri')) {
            calibriCount++;
          } else {
            nonCalibriSamples.push({
              tag: el.tagName,
              className: el.className,
              text: text.substring(0, 35),
              fontFamily: cs.fontFamily,
            });
          }

          if (fs === '11px') {
            elevenPxCount++;
          } else {
            non11PxSamples.push({
              tag: el.tagName,
              className: el.className,
              text: text.substring(0, 35),
              fontSize: fs,
            });
          }

          // Check backgrounds
          const bg = cs.backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            const m = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (m) {
              const red = parseInt(m[1]), green = parseInt(m[2]), blue = parseInt(m[3]);
              const luminance = (0.299 * red + 0.587 * green + 0.114 * blue);
              // Disallow dark backgrounds (< 100 luminance) on cards/panels/sections
              if (luminance < 100 && !(el.tagName === 'BUTTON' && el.classList.contains('primary'))) {
                darkBackgrounds.push({ tag: el.tagName, className: el.className, bg });
              }
            }
          }
        });

        // Horizontal overflow check
        const scrollWidth = document.documentElement.scrollWidth;
        const clientWidth = document.documentElement.clientWidth;
        const hasHorizontalOverflow = scrollWidth > clientWidth + 2;

        return {
          totalTextElements,
          calibriRatio: totalTextElements > 0 ? calibriCount / totalTextElements : 1,
          elevenPxRatio: totalTextElements > 0 ? elevenPxCount / totalTextElements : 1,
          nonCalibriCount: nonCalibriSamples.length,
          nonCalibriSamples: nonCalibriSamples.slice(0, 5),
          non11PxCount: non11PxSamples.length,
          non11PxSamples: non11PxSamples.slice(0, 5),
          darkBackgroundCount: darkBackgrounds.length,
          darkBackgroundSamples: darkBackgrounds.slice(0, 3),
          hasHorizontalOverflow,
          scrollWidth,
          clientWidth,
        };
      });

      // Capture desktop screenshot
      const safeSlug = r.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const shotPath = path.join(SCREENSHOT_DIR, `${safeSlug}-desktop.png`);
      await page.screenshot({ path: shotPath, fullPage: false });

      console.log(`  • Visible text elements checked: ${domAudit.totalTextElements}`);
      console.log(`  • Calibri Conformance: ${(domAudit.calibriRatio * 100).toFixed(1)}% (${domAudit.nonCalibriCount} violations)`);
      console.log(`  • 11px Size Conformance: ${(domAudit.elevenPxRatio * 100).toFixed(1)}% (${domAudit.non11PxCount} violations)`);
      console.log(`  • Dark Background Violations: ${domAudit.darkBackgroundCount}`);
      console.log(`  • Horizontal Overflow: ${domAudit.hasHorizontalOverflow ? `YES (${domAudit.scrollWidth}px > ${domAudit.clientWidth}px)` : 'NO (Perfect)'}`);
      console.log(`  📸 Screenshot: ${path.basename(shotPath)}`);

      if (domAudit.non11PxCount > 0) {
        console.log('    ⚠ Non-11px samples:', domAudit.non11PxSamples);
      }
      if (domAudit.nonCalibriCount > 0) {
        console.log('    ⚠ Non-Calibri samples:', domAudit.nonCalibriSamples);
      }

      const routePassed = domAudit.calibriRatio >= 0.98 && domAudit.elevenPxRatio >= 0.98 && !domAudit.hasHorizontalOverflow;
      auditReport.push({
        route: r.path,
        name: r.name,
        passed: routePassed,
        domAudit,
      });

    } catch (err) {
      console.error(`  ✗ Error inspecting route ${r.path}:`, err.message);
      auditReport.push({
        route: r.path,
        name: r.name,
        passed: false,
        error: err.message,
      });
    }
  }

  // 2. Responsive Viewports Inspection on Key Core Pages
  console.log('\n▶ Running Multi-Device Responsive Inspection (Laptop, Tablet, Mobile)...');
  const responsiveRoutes = ['/dashboard', '/auctions', '/rates', '/feeds', '/profile'];

  for (const vp of [VIEWPORTS[1], VIEWPORTS[2], VIEWPORTS[3]]) {
    console.log(`\n  Checking Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})...`);
    await page.setViewportSize({ width: vp.width, height: vp.height });

    for (const rPath of responsiveRoutes) {
      await page.goto(`http://localhost:3000${rPath}`, { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(1000);

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 2;
      });

      const shotName = `${rPath.replace('/', '')}-${vp.name}.png`;
      const vpShot = path.join(SCREENSHOT_DIR, shotName);
      await page.screenshot({ path: vpShot, fullPage: false });
      console.log(`    • ${rPath} -> Overflow: ${overflow ? 'FAIL' : 'PASS'} | 📸 ${shotName}`);
    }
  }

  await browser.close();

  console.log('\n======================================================================');
  console.log('   FR8X CHROME AUDIT SUMMARY REPORT                                   ');
  console.log('======================================================================');

  let totalRoutes = auditReport.length;
  let passedRoutes = auditReport.filter(a => a.passed).length;
  console.log(`Routes Audited: ${totalRoutes} | Fully Compliant: ${passedRoutes} | Flagged: ${totalRoutes - passedRoutes}\n`);

  auditReport.forEach((a) => {
    console.log(`  ${a.passed ? '✔ [PASS]' : '✖ [FAIL]'} ${a.name} (${a.route})`);
  });

  console.log(`\nBrowser Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors.slice(0, 5));
  }
  console.log(`Failed Network Requests: ${failedRequests.length}`);

  const allPassed = passedRoutes === totalRoutes;
  console.log(`\nFinal Audit Verdict: ${allPassed ? '100% ACCEPTANCE PASSED' : 'CORRECTIONS REQUIRED'}`);
  process.exit(allPassed ? 0 : 1);
}

runComprehensiveChromeAudit();
