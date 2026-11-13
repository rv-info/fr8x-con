const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'before');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const PAGES = [
  // Public Pages
  { name: 'login', path: '/login', auth: false, viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'register', path: '/register', auth: false, viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'reset-password', path: '/reset-password', auth: false, viewports: ['desktop'] },
  { name: 'download', path: '/download', auth: false, viewports: ['desktop', 'mobile'] },
  { name: 'privacy', path: '/privacy', auth: false, viewports: ['desktop'] },
  { name: 'terms', path: '/terms', auth: false, viewports: ['desktop'] },

  // Authenticated Workspace Pages
  { name: 'dashboard', path: '/dashboard', auth: true, viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'feeds', path: '/feeds', auth: true, viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'nexus', path: '/nexus', auth: true, viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'auctions', path: '/auctions', auth: true, viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'auctions-create', path: '/auctions/create', auth: true, viewports: ['desktop'] },
  { name: 'rates', path: '/rates', auth: true, viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'network', path: '/network', auth: true, viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'jobs', path: '/jobs', auth: true, viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'profile', path: '/profile', auth: true, viewports: ['desktop', 'tablet', 'mobile'] },
  { name: 'notifications', path: '/notifications', auth: true, viewports: ['desktop'] },

  // Platform Admin Pages
  { name: 'godfather-login', path: '/godfather/login', auth: false, viewports: ['desktop'] },
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
};

async function setupAuth(context, page) {
  // 1. Obtain real signed session cookie
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
}

(async () => {
  console.log('🚀 Starting high-fidelity baseline capture of all FR8X pages...');
  const browser = await chromium.launch({ headless: true });

  const results = [];

  for (const pageInfo of PAGES) {
    console.log(`\n📸 Auditing: ${pageInfo.name} (${pageInfo.path})`);

    for (const vpKey of pageInfo.viewports) {
      const vp = VIEWPORTS[vpKey];
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });

      const page = await context.newPage();

      if (pageInfo.auth) {
        await setupAuth(context, page);
      }

      const url = `http://localhost:3000${pageInfo.path}`;
      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        const screenshotFileName = `${pageInfo.name}-${vpKey}.png`;
        const screenshotPath = path.join(OUTPUT_DIR, screenshotFileName);

        await page.screenshot({ path: screenshotPath, fullPage: false });
        console.log(`   ✓ [${vpKey}] Saved: ${screenshotFileName} (URL: ${currentUrl})`);

        results.push({
          page: pageInfo.name,
          url: pageInfo.path,
          renderedUrl: currentUrl,
          viewport: vpKey,
          status: response ? response.status() : 'OK',
          screenshot: screenshotFileName,
        });
      } catch (err) {
        console.error(`   ✗ [${vpKey}] Failed: ${err.message}`);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  console.log(`\n🎉 Successfully captured ${results.length} baseline screenshots in ${OUTPUT_DIR}`);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(results, null, 2));
})();
