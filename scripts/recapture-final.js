const { chromium } = require('playwright');
const path = require('path');
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'after');

const TARGETS = [
  { name: 'auctions', path: '/auctions', viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'auctions-create', path: '/auctions/create', viewports: ['desktop'] },
  { name: 'profile', path: '/profile', viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'notifications', path: '/notifications', viewports: ['desktop'] },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

async function setupAuth(context, page) {
  try {
    await context.request.post('http://localhost:3000/api/auth/session', {
      data: { uid: 'usr_demo_audit', email: 'rajesh.sharma@fr8x.in', role: 'user', companyId: 'CMP-00001' }
    });
  } catch (e) {}

  await page.addInitScript(() => {
    const mockUser = {
      uid: 'usr_demo_audit', id: 'usr_demo_audit', displayName: 'Captain Rajesh Sharma',
      email: 'rajesh.sharma@fr8x.in', company: 'SYB INTERNATIONAL', companyName: 'SYB INTERNATIONAL',
      designation: 'Managing Director & Principal Broker', city: 'Mumbai', state: 'Maharashtra',
      country: 'India', plan: 'enterprise', hasGoldenTick: true, isVerified: true, role: 'user',
      status: 'active', avatarUrl: ''
    };
    const now = Date.now().toString();
    localStorage.setItem('fr8x_active_user_uid', mockUser.uid);
    localStorage.setItem('fr8x_cached_user_profile', JSON.stringify(mockUser));
    localStorage.setItem('fr8x_session_start_time', now);
    localStorage.setItem('fr8x_last_activity_time', now);
    localStorage.setItem('fr8x_user_status', 'available');
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const item of TARGETS) {
    for (const vpKey of item.viewports) {
      const vp = VIEWPORTS[vpKey];
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await setupAuth(context, page);

      try {
        await page.goto('http://localhost:3000' + item.path, { waitUntil: 'domcontentloaded', timeout: 35000 });
        await page.waitForTimeout(5000);

        const filename = `${item.name}-${vpKey}.png`;
        await page.screenshot({ path: path.join(OUTPUT_DIR, filename) });
        console.log('Saved:', filename);
      } catch (err) {
        console.error('Failed:', item.name, vpKey, err.message);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  console.log('Done recapturing final views!');
})();
