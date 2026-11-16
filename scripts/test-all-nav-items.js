const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROUTES = [
  { href: '/dashboard', label: 'Dashboard', expectedIcon: 'lucide-layout-dashboard' },
  { href: '/feeds', label: 'Feeds', expectedIcon: 'lucide-rss' },
  { href: '/nexus', label: 'Nexus', expectedIcon: 'lucide-globe' },
  { href: '/auctions', label: 'Auctions', expectedIcon: 'lucide-gavel' },
  { href: '/rates', label: 'Rates', expectedIcon: 'lucide-bar-chart-3' },
  { href: '/network', label: 'Network', expectedIcon: 'lucide-users' },
  { href: '/jobs', label: 'Jobs', expectedIcon: 'lucide-briefcase' },
  { href: '/profile', label: 'Profile', expectedIcon: 'lucide-user' },
];

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

  const report = [];

  for (const route of ROUTES) {
    console.log(`\nTesting route: ${route.href} (${route.label})...`);
    await page.goto(`http://localhost:3000${route.href}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3500);

    const navStatus = await page.evaluate((r) => {
      const activeLink = document.querySelector('.nav a.on') || document.querySelector('.nav a[aria-current="page"]');
      if (!activeLink) return { error: 'No active link found', currentUrl: window.location.href };

      const svg = activeLink.querySelector('svg');
      const computed = window.getComputedStyle(activeLink);
      const svgComputed = svg ? window.getComputedStyle(svg) : null;

      return {
        currentUrl: window.location.href,
        href: activeLink.getAttribute('href'),
        ariaCurrent: activeLink.getAttribute('aria-current'),
        backgroundColor: computed.backgroundColor,
        border: computed.border,
        color: computed.color,
        hasSvg: !!svg,
        svgClass: svg ? svg.getAttribute('class') : null,
        svgColor: svgComputed ? svgComputed.color : null,
        svgStroke: svgComputed ? svgComputed.stroke : null,
        svgWidth: svgComputed ? svgComputed.width : null,
        svgHeight: svgComputed ? svgComputed.height : null,
        svgVisible: svgComputed ? (svgComputed.visibility === 'visible' && svgComputed.opacity === '1') : false,
      };
    }, route);

    console.log(`  Result for ${route.label}:`, navStatus);
    report.push({ ...route, ...navStatus });
  }

  // Also test expanded sidebar toggle
  console.log('\nTesting Expanded Sidebar Toggle...');
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // Click the collapse toggle button
  const toggleBtn = await page.$('.desktop-only-collapse');
  if (toggleBtn) {
    await toggleBtn.click();
    await page.waitForTimeout(1000);

    const expandedState = await page.evaluate(() => {
      const side = document.querySelector('.side');
      const activeLink = document.querySelector('.nav a.on');
      const svg = activeLink ? activeLink.querySelector('svg') : null;
      const labelSpan = activeLink ? activeLink.querySelector('span') : null;

      return {
        isCollapsed: side ? side.classList.contains('is-collapsed') : null,
        hasActiveLink: !!activeLink,
        activeLabel: labelSpan ? labelSpan.textContent : null,
        hasSvg: !!svg,
        svgStroke: svg ? window.getComputedStyle(svg).stroke : null,
      };
    });

    console.log('  Expanded state result:', expandedState);
    await page.screenshot({ path: 'screenshots/dashboard-expanded-desktop.png' });
    console.log('Saved screenshots/dashboard-expanded-desktop.png');
  }

  await browser.close();

  console.log('\n========================================');
  console.log('ALL NAVIGATION TESTING RESULTS:');
  console.log(JSON.stringify(report, null, 2));
})();
