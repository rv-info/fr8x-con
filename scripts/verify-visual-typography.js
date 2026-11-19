const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      http.get(url, (res) => {
        resolve();
      }).on('error', (err) => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Server did not start within ' + timeoutMs + 'ms'));
        } else {
          setTimeout(check, 1000);
        }
      });
    }
    check();
  });
}

async function runVisualAudit() {
  console.log('=== FR8X VISUAL & TYPOGRAPHY REGRESSION AUDIT ===\n');

  try {
    console.log('Waiting for Next.js dev server on http://localhost:3000...');
    await waitForServer('http://localhost:3000');
    console.log('✔ Server is online and responding.\n');
  } catch (e) {
    console.error('Error waiting for server:', e.message);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Inject session auth into localStorage so protected routes can be inspected
  const page = await context.newPage();
  
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Pre-seed localStorage with authenticated mock session
  await page.goto('http://localhost:3000/login');
  await page.evaluate(() => {
    localStorage.setItem('fr8x_auth_token', 'mock-valid-jwt');
    localStorage.setItem('fr8x_user', JSON.stringify({
      uid: 'audit-user-001',
      email: 'audit@fr8x.in',
      displayName: 'Captain Vikram Singh',
      company: 'Adani Logistics Ltd',
      companyName: 'Adani Logistics Ltd',
      designation: 'Head of Ocean Freight',
      city: 'Mumbai',
      country: 'India',
      plan: 'enterprise',
      verified: true,
      hasGoldenTick: true,
    }));
  });

  const routes = [
    { name: 'Login Screen', path: '/login', public: true },
    { name: 'Enterprise Registration', path: '/register', public: true },
    { name: 'Operational Dashboard', path: '/dashboard' },
    { name: 'Spot Freight Auctions', path: '/auctions' },
    { name: 'Rate Intelligence Benchmarks', path: '/rates' },
    { name: 'Consolidated Network Hub', path: '/network' },
    { name: 'Logistics Career Board', path: '/jobs' },
    { name: 'Industry Feed', path: '/feeds' },
    { name: 'Nexus Community Forum', path: '/nexus' },
    { name: 'Freight Passport & Profile', path: '/profile' },
    { name: 'Notification Center', path: '/notifications' },
  ];

  const results = [];

  for (const r of routes) {
    console.log(`\n▶ Inspecting Route: ${r.name} (${r.path})`);
    try {
      await page.goto(`http://localhost:3000${r.path}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1500); // allow client-side hydration

      // Audit typography and computed styles
      const audit = await page.evaluate(() => {
        const textElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, span, a, button, input, label, th, td, b, strong, small'));
        
        let totalChecked = 0;
        let calibriCount = 0;
        let elevenPxCount = 0;
        let fontFamilies = new Set();
        let fontSizes = new Set();
        let nonWhiteDarkBgs = [];

        textElements.slice(0, 80).forEach((el) => {
          if (!el.innerText && !el.value && !el.placeholder) return;
          totalChecked++;
          const cs = window.getComputedStyle(el);
          const ff = cs.fontFamily;
          const fs = cs.fontSize;

          fontFamilies.add(ff);
          fontSizes.add(fs);

          if (ff.toLowerCase().includes('calibri')) calibriCount++;
          if (fs === '11px') elevenPxCount++;

          // Check backgrounds
          const bg = cs.backgroundColor;
          if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
            // Check if dark
            const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (match) {
              const r = parseInt(match[1]), g = parseInt(match[2]), b = parseInt(match[3]);
              const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
              if (luminance < 100 && !(el.tagName === 'BUTTON' && el.classList.contains('primary'))) {
                nonWhiteDarkBgs.push(`${el.tagName}.${el.className} (rgb: ${r},${g},${b})`);
              }
            }
          }
        });

        // Sample specific key elements
        const pageTitle = document.querySelector('h1, .page-title');
        const firstButton = document.querySelector('button, .btn');
        const firstInput = document.querySelector('input');
        const firstHeader = document.querySelector('th');
        const firstCell = document.querySelector('td');

        const samples = {
          pageTitle: pageTitle ? { ff: window.getComputedStyle(pageTitle).fontFamily, fs: window.getComputedStyle(pageTitle).fontSize, fw: window.getComputedStyle(pageTitle).fontWeight } : null,
          firstButton: firstButton ? { ff: window.getComputedStyle(firstButton).fontFamily, fs: window.getComputedStyle(firstButton).fontSize, fw: window.getComputedStyle(firstButton).fontWeight } : null,
          firstInput: firstInput ? { ff: window.getComputedStyle(firstInput).fontFamily, fs: window.getComputedStyle(firstInput).fontSize, fw: window.getComputedStyle(firstInput).fontWeight } : null,
          firstHeader: firstHeader ? { ff: window.getComputedStyle(firstHeader).fontFamily, fs: window.getComputedStyle(firstHeader).fontSize, fw: window.getComputedStyle(firstHeader).fontWeight } : null,
          firstCell: firstCell ? { ff: window.getComputedStyle(firstCell).fontFamily, fs: window.getComputedStyle(firstCell).fontSize, fw: window.getComputedStyle(firstCell).fontWeight } : null,
        };

        return {
          totalChecked,
          calibriRatio: totalChecked > 0 ? (calibriCount / totalChecked) : 1,
          elevenPxRatio: totalChecked > 0 ? (elevenPxCount / totalChecked) : 1,
          fontFamilies: Array.from(fontFamilies).slice(0, 3),
          fontSizes: Array.from(fontSizes),
          samples,
          darkBgCount: nonWhiteDarkBgs.length,
          darkBgSamples: nonWhiteDarkBgs.slice(0, 3),
        };
      });

      // Capture desktop screenshot
      const safeName = r.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const screenshotDesktop = path.join(SCREENSHOT_DIR, `${safeName}-desktop.png`);
      await page.screenshot({ path: screenshotDesktop, fullPage: false });

      console.log(`  ✓ Checked ${audit.totalChecked} visible text elements.`);
      console.log(`  ✓ Calibri Font Conformance: ${(audit.calibriRatio * 100).toFixed(1)}%`);
      console.log(`  ✓ 11px Size Conformance: ${(audit.elevenPxRatio * 100).toFixed(1)}% (Observed sizes: ${audit.fontSizes.join(', ')})`);
      if (audit.samples.pageTitle) {
        console.log(`  • Page Title Sample: ${audit.samples.pageTitle.ff} | Size: ${audit.samples.pageTitle.fs} | Weight: ${audit.samples.pageTitle.fw}`);
      }
      if (audit.samples.firstButton) {
        console.log(`  • Button Sample: ${audit.samples.firstButton.ff} | Size: ${audit.samples.firstButton.fs} | Weight: ${audit.samples.firstButton.fw}`);
      }
      console.log(`  • Dark Background Violations: ${audit.darkBgCount}`);
      console.log(`  📸 Screenshot saved: ${path.basename(screenshotDesktop)}`);

      results.push({ route: r.path, name: r.name, audit, ok: audit.elevenPxRatio >= 0.95 && audit.calibriRatio >= 0.95 });
    } catch (err) {
      console.error(`  ✗ Error evaluating ${r.path}:`, err.message);
      results.push({ route: r.path, name: r.name, ok: false, error: err.message });
    }
  }

  // Responsive Viewports Test (Mobile: 375x667, Tablet: 768x1024)
  console.log('\n▶ Running Responsive Viewports Evaluation...');
  for (const vp of [
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ]) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const vpShot = path.join(SCREENSHOT_DIR, `dashboard-${vp.name}.png`);
    await page.screenshot({ path: vpShot, fullPage: false });
    console.log(`  📸 Saved ${vp.name} viewport capture (${vp.width}x${vp.height}): ${path.basename(vpShot)}`);
  }

  await browser.close();

  console.log('\n======================================================================');
  console.log('   FR8X VISUAL AUDIT SUMMARY: ALL ROUTES INSPECTED                    ');
  console.log('======================================================================');
  const allPassing = results.every(r => r.ok);
  results.forEach(r => {
    console.log(`  ${r.ok ? '✔' : '✖'} [${r.ok ? 'PASS' : 'FAIL'}] ${r.name} (${r.route})`);
  });

  console.log(`\nOverall Visual & Typography Conformance: ${allPassing ? '100% PASS' : 'FLAGGED ITEMS'}`);
  process.exit(allPassing ? 0 : 1);
}

runVisualAudit();
