const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

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

  // 2. Hydrate client localStorage with demo profile
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

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const activeLink = await page.evaluate(() => {
    const link = document.querySelector('.nav a.on') || document.querySelector('.nav a[aria-current="page"]');
    if (!link) return 'No active link found';
    const computed = window.getComputedStyle(link);
    const svg = link.querySelector('svg');
    const svgComputed = svg ? window.getComputedStyle(svg) : null;
    return {
      outerHTML: link.outerHTML,
      clientWidth: link.clientWidth,
      clientHeight: link.clientHeight,
      color: computed.color,
      backgroundColor: computed.backgroundColor,
      border: computed.border,
      svg: svg ? {
        outerHTML: svg.outerHTML,
        width: svgComputed.width,
        height: svgComputed.height,
        color: svgComputed.color,
        stroke: svgComputed.stroke,
        fill: svgComputed.fill,
        display: svgComputed.display,
        visibility: svgComputed.visibility,
        opacity: svgComputed.opacity,
        clientWidth: svg.clientWidth,
        clientHeight: svg.clientHeight,
        rect: svg.getBoundingClientRect()
      } : null
    };
  });
  console.log('--- ACTIVE LINK INFO ---');
  console.log(JSON.stringify(activeLink, null, 2));

  await page.screenshot({ path: 'screenshots/dashboard-fixed-desktop.png', fullPage: true });
  console.log('Saved screenshots/dashboard-fixed-desktop.png');

  await browser.close();
})();
