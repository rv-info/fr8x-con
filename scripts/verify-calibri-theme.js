const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'calibri-9px');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const ROUTES = [
  { name: 'dashboard', path: '/dashboard', auth: true },
  { name: 'feeds', path: '/feeds', auth: true },
  { name: 'nexus', path: '/nexus', auth: true },
  { name: 'auctions', path: '/auctions', auth: true },
  { name: 'rates', path: '/rates', auth: true },
  { name: 'network', path: '/network', auth: true },
  { name: 'jobs', path: '/jobs', auth: true },
  { name: 'profile', path: '/profile', auth: true },
  { name: 'login', path: '/login', auth: false },
  { name: 'register', path: '/register', auth: false },
];

(async () => {
  console.log('Connecting to browser and waiting for server to be responsive...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Retry ping until dev server is ready
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await context.request.get('http://localhost:3000/api/ping');
      if (res.ok) {
        serverReady = true;
        console.log('Dev server ready!');
        break;
      }
    } catch (e) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // 1. Session endpoint
  try {
    await context.request.post('http://localhost:3000/api/auth/session', {
      data: {
        uid: 'usr_demo_audit',
        email: 'rajesh.sharma@fr8x.in',
        role: 'user',
        companyId: 'CMP-00001',
      },
    });
  } catch (e) {}

  // 2. Hydrate client localStorage
  await page.addInitScript(() => {
    const mockUser = {
      uid: 'usr_demo_audit',
      id: 'usr_demo_audit',
      displayName: 'Captain Rajesh Sharma',
      email: 'rajesh.sharma@fr8x.in',
      company: 'SYB INTERNATIONAL',
      companyName: 'SYB INTERNATIONAL',
      designation: 'Managing Director & Principal Broker',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      plan: 'enterprise',
      hasGoldenTick: true,
      isVerified: true,
      role: 'user',
      status: 'active',
      avatarUrl: '',
    };
    const now = Date.now().toString();
    localStorage.setItem('fr8x_active_user_uid', mockUser.uid);
    localStorage.setItem('fr8x_cached_user_profile', JSON.stringify(mockUser));
    localStorage.setItem('fr8x_session_start_time', now);
    localStorage.setItem('fr8x_last_activity_time', now);
    localStorage.setItem('fr8x_user_status', 'available');
  });

  const auditReport = [];

  for (const route of ROUTES) {
    console.log(`Checking route: ${route.path}...`);
    try {
      await page.goto(`http://localhost:3000${route.path}`, { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForTimeout(4000);

      const metrics = await page.evaluate((r) => {
        const body = document.body;
        const bodyComputed = window.getComputedStyle(body);
        
        const h1 = document.querySelector('h1');
        const h1Computed = h1 ? window.getComputedStyle(h1) : null;
        
        const activeNav = document.querySelector('.nav a.on') || document.querySelector('.nav a[aria-current="page"]');
        const activeNavComputed = activeNav ? window.getComputedStyle(activeNav) : null;
        const activeNavIcon = activeNav ? activeNav.querySelector('svg, i, .bi') : null;
        const activeNavIconComputed = activeNavIcon ? window.getComputedStyle(activeNavIcon) : null;

        const card = document.querySelector('.card') || document.querySelector('.dashboard-kpi-card');
        const cardComputed = card ? window.getComputedStyle(card) : null;

        const table = document.querySelector('table');
        const th = document.querySelector('th');
        const td = document.querySelector('td');
        const thComputed = th ? window.getComputedStyle(th) : null;
        const tdComputed = td ? window.getComputedStyle(td) : null;

        const btn = document.querySelector('.btn.primary') || document.querySelector('.btn') || document.querySelector('button');
        const btnComputed = btn ? window.getComputedStyle(btn) : null;

        const input = document.querySelector('input');
        const inputComputed = input ? window.getComputedStyle(input) : null;

        return {
          url: window.location.href,
          fontFamily: bodyComputed.fontFamily,
          fontSize: bodyComputed.fontSize,
          backgroundColor: bodyComputed.backgroundColor,
          textColor: bodyComputed.color,
          h1: h1Computed ? {
            fontSize: h1Computed.fontSize,
            fontWeight: h1Computed.fontWeight,
            color: h1Computed.color,
          } : null,
          activeNav: activeNavComputed ? {
            backgroundColor: activeNavComputed.backgroundColor,
            color: activeNavComputed.color,
            fontSize: activeNavComputed.fontSize,
            fontWeight: activeNavComputed.fontWeight,
            borderRadius: activeNavComputed.borderRadius,
            iconTag: activeNavIcon ? activeNavIcon.tagName : null,
            iconClass: activeNavIcon ? activeNavIcon.getAttribute('class') : null,
            iconColor: activeNavIconComputed ? (activeNavIconComputed.color || activeNavIconComputed.fill) : null,
          } : null,
          card: cardComputed ? {
            backgroundColor: cardComputed.backgroundColor,
            border: cardComputed.border,
            borderRadius: cardComputed.borderRadius,
          } : null,
          table: thComputed ? {
            thFontSize: thComputed.fontSize,
            thFontWeight: thComputed.fontWeight,
            tdFontSize: tdComputed ? tdComputed.fontSize : null,
            tdBorderBottom: tdComputed ? tdComputed.borderBottom : null,
          } : null,
          button: btnComputed ? {
            fontSize: btnComputed.fontSize,
            fontWeight: btnComputed.fontWeight,
            backgroundColor: btnComputed.backgroundColor,
            color: btnComputed.color,
            borderRadius: btnComputed.borderRadius,
          } : null,
          input: inputComputed ? {
            fontSize: inputComputed.fontSize,
            borderRadius: inputComputed.borderRadius,
            border: inputComputed.border,
          } : null,
        };
      }, route);

      console.log(`  Metrics for ${route.name}:`, JSON.stringify(metrics, null, 2));
      auditReport.push({ route: route.name, metrics });

      // Capture desktop screenshot
      await page.screenshot({ path: path.join(OUTPUT_DIR, `${route.name}-desktop.png`) });
    } catch (err) {
      console.error(`  Error verifying ${route.name}:`, err.message);
    }
  }

  // Mobile viewport check for dashboard
  try {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'dashboard-mobile.png') });
    console.log('Saved dashboard-mobile.png');

    // Tablet viewport check for dashboard
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'dashboard-tablet.png') });
    console.log('Saved dashboard-tablet.png');
  } catch (err) {
    console.error('Error on mobile/tablet:', err.message);
  }

  await browser.close();

  fs.writeFileSync(path.join(OUTPUT_DIR, 'audit-results.json'), JSON.stringify(auditReport, null, 2), 'utf8');
  console.log('✅ Audit report and screenshots saved successfully in screenshots/calibri-9px!');
})();
