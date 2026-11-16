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

  await page.goto('http://localhost:3000/auctions', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);

  const navInfo = await page.evaluate(() => {
    const nav = document.querySelector('.nav');
    const links = Array.from(document.querySelectorAll('.nav a')).map(a => ({
      href: a.getAttribute('href'),
      className: a.className,
      ariaCurrent: a.getAttribute('aria-current'),
      hasSvg: !!a.querySelector('svg'),
      svgClass: a.querySelector('svg')?.getAttribute('class')
    }));
    return {
      currentUrl: window.location.href,
      navHtml: nav?.innerHTML,
      links
    };
  });

  console.log(JSON.stringify(navInfo, null, 2));
  await browser.close();
})();
