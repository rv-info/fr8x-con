const { chromium } = require('playwright');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'after');

const TARGETS = [
  { name: 'rates', path: '/rates', viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'jobs', path: '/jobs', viewports: ['desktop', 'tablet'] },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

async function setupAuth(context, page) {
  try {
    await context.request.post('http://localhost:3000/api/auth/session', {
      data: {
        uid: 'usr_demo_audit',
        email: 'rajesh.sharma@fr8x.in',
        role: 'user',
        companyId: 'CMP-00001',
      },
    });
  } catch (e) {
    console.warn('Session endpoint call warning:', e.message);
  }

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
}

(async () => {
  console.log('🚀 Recapturing rates and jobs with extended hydration wait...');
  const browser = await chromium.launch({ headless: true });

  for (const pageInfo of TARGETS) {
    for (const vpKey of pageInfo.viewports) {
      const vp = VIEWPORTS[vpKey];
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });

      const page = await context.newPage();
      await setupAuth(context, page);

      const url = `http://localhost:3000${pageInfo.path}`;
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(4500);

        const screenshotFileName = `${pageInfo.name}-${vpKey}.png`;
        const screenshotPath = path.join(OUTPUT_DIR, screenshotFileName);

        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`   ✓ [${vpKey}] Saved: ${screenshotFileName} (URL: ${page.url()})`);
      } catch (err) {
        console.error(`   ✗ [${vpKey}] Failed: ${err.message}`);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  console.log('Done recapturing rates & jobs!');
})();
