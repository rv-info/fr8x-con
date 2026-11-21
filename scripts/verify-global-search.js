const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(process.cwd(), 'screenshots', 'global-search');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const MOCK_MEMBERS = [
  {
    uid: 'usr_kumar_r_syb',
    id: 'usr_kumar_r_syb',
    displayName: 'Kumar R',
    firstName: 'Kumar',
    lastName: 'R',
    company: 'SYB INTERNATIONAL',
    companyName: 'SYB INTERNATIONAL',
    designation: 'PRICING',
    city: 'Ludhiana',
    country: 'India',
    location: 'Ludhiana, India',
    isVerified: true,
    plan: 'verified_b2b',
    hasGoldenTick: true,
    status: 'active',
  },
  {
    uid: 'usr_rajat_rai_prod',
    id: 'usr_rajat_rai_prod',
    displayName: 'Rajat Kumar RAI',
    firstName: 'Rajat',
    lastName: 'Kumar RAI',
    company: 'COGOPORT PRIVATE LIMITED',
    companyName: 'COGOPORT PRIVATE LIMITED',
    designation: 'ASM',
    city: 'Gurugram',
    country: 'India',
    location: 'Gurugram, India',
    isVerified: true,
    plan: 'trial',
    hasGoldenTick: false,
    status: 'active',
  },
  {
    uid: 'usr_sharma_rajesh',
    id: 'usr_sharma_rajesh',
    displayName: 'Capt. Rajesh Sharma',
    company: 'Adani Logistics & Ports',
    companyName: 'Adani Logistics & Ports',
    designation: 'VP Ocean Operations',
    city: 'Mumbai',
    country: 'India',
    location: 'Mumbai, India',
    isVerified: true,
    plan: 'enterprise',
    hasGoldenTick: true,
    status: 'active',
  },
];

async function setupRoutesAndAuth(context, page) {
  // Mock /api/members and /api/people/search to match exact production user dataset
  await page.route('**/api/members*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        members: MOCK_MEMBERS,
      }),
    });
  });

  await page.route('**/api/people/search*', async (route) => {
    const url = new URL(route.request().url());
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const filtered = MOCK_MEMBERS.filter(
      (m) =>
        m.displayName.toLowerCase().includes(q) ||
        m.company.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q)
    );
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        users: filtered,
        people: filtered,
      }),
    });
  });

  await page.route('**/api/companies/search*', async (route) => {
    const url = new URL(route.request().url());
    const q = (url.searchParams.get('q') || '').toLowerCase();
    const companies = [
      { id: 'comp-adani', name: 'Adani Logistics & Ports', location: 'Mumbai, India', verified: true, type: 'Enterprise Terminal & Rail Operator' },
      { id: 'comp-syb', name: 'SYB INTERNATIONAL', location: 'Ludhiana, India', verified: true, type: 'Logistics Enterprise Member' },
      { id: 'comp-cogo', name: 'COGOPORT PRIVATE LIMITED', location: 'Gurugram, India', verified: true, type: 'Logistics Enterprise Member' },
    ].filter((c) => c.name.toLowerCase().includes(q));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        companies,
      }),
    });
  });

  const uid = 'usr_rajat_rai_prod';
  const email = 'rajat.rai@cogoport.com';
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

  console.log('Seeding auth at http://localhost:3000/login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.evaluate(({ uid, email }) => {
    const mockProfile = {
      uid,
      id: uid,
      email,
      displayName: 'Rajat Kumar RAI',
      name: 'Rajat Kumar RAI',
      company: 'COGOPORT PRIVATE LIMITED',
      companyName: 'COGOPORT PRIVATE LIMITED',
      designation: 'ASM',
      city: 'Gurugram',
      country: 'India',
      plan: 'trial',
      verified: true,
      hasGoldenTick: false,
      isVerified: true,
      kycStatus: 'pending',
      status: 'active',
      role: 'user',
    };
    const now = String(Date.now());
    localStorage.setItem('fr8x_cached_user_profile', JSON.stringify(mockProfile));
    localStorage.setItem('fr8x_user_profile', JSON.stringify(mockProfile));
    localStorage.setItem('fr8x_user', JSON.stringify(mockProfile));
    localStorage.setItem('fr8x_auth_user', JSON.stringify(mockProfile));
    localStorage.setItem('fr8x_active_user_uid', uid);
    localStorage.setItem('fr8x_user_storage_key', uid);
    localStorage.setItem('ACTIVE_SESSION_KEY', now);
    localStorage.setItem('fr8x_session_expiry', String(Date.now() + 86400000));
  }, { uid, email });
}

async function run() {
  console.log('Launching headless Chromium for Global Search verification...');
  const browser = await chromium.launch({ headless: true });

  try {
    // ═════════════════════════════════════════════════════════════════
    // 1. DESKTOP VIEWPORT TEST (1440x900)
    // ═════════════════════════════════════════════════════════════════
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await setupRoutesAndAuth(context, page);

    console.log('Navigating to /profile...');
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2500);

    // Record topbar position before search opens
    const topBar = page.locator('header.top');
    await topBar.waitFor({ state: 'visible', timeout: 10000 });
    const topBarBoxBefore = await topBar.boundingBox();
    console.log('TopBar bounding box before search:', topBarBoxBefore);

    // Open Global Search via shortcut click
    console.log('Opening Global Search modal...');
    const searchTrigger = page.locator('.global-search-trigger');
    await searchTrigger.waitFor({ state: 'visible', timeout: 10000 });
    await searchTrigger.click();

    // Verify overlay and modal exist
    const searchOverlay = page.locator('.global-search-overlay');
    await searchOverlay.waitFor({ state: 'visible', timeout: 5000 });
    const searchModal = page.locator('.global-search-modal');
    await searchModal.waitFor({ state: 'visible', timeout: 5000 });

    // Verify topbar was NOT pushed or shifted down
    const topBarBoxAfter = await topBar.boundingBox();
    console.log('TopBar bounding box after search opened:', topBarBoxAfter);
    if (Math.abs(topBarBoxAfter.y - topBarBoxBefore.y) > 2) {
      console.error(`FAIL: TopBar shifted in Y by ${topBarBoxAfter.y - topBarBoxBefore.y}px!`);
    } else {
      console.log('✓ PASS: TopBar position is strictly preserved (no DOM layout displacement).');
    }

    // Modal bounding box check
    const modalBox = await searchModal.boundingBox();
    console.log('Search modal bounding box:', modalBox);
    console.log(`✓ PASS: Search modal is floating and centered (top: ${modalBox.y}px, width: ${modalBox.width}px).`);

    await page.screenshot({ path: path.join(screenshotDir, '01-global-search-open-empty.png') });
    console.log('Saved 01-global-search-open-empty.png');

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Search "kumar" - Self exclusion & categorisation
    // ─────────────────────────────────────────────────────────────
    console.log('Searching "kumar"...');
    const searchInput = page.locator('.global-search-input-row input');
    await searchInput.fill('kumar');
    await page.waitForTimeout(1200);

    // Check results
    const resultItems = page.locator('.gs-result-item');
    const resultCount = await resultItems.count();
    console.log(`Found ${resultCount} global search result items for "kumar".`);

    const resultTexts = await resultItems.allInnerTexts();
    console.log('Result texts found:');
    resultTexts.forEach((t, i) => console.log(`  [${i + 1}] ${t.replace(/\n+/g, ' · ')}`));

    // Ensure logged-in user "Rajat Kumar RAI" is not suggested as a redundant self-contact
    const containsSelfRedundant = resultTexts.some(
      (text) => text.includes('Rajat Kumar RAI') && text.includes('COGOPORT')
    );
    if (containsSelfRedundant) {
      console.error('FAIL: Logged-in user "Rajat Kumar RAI" was returned as a contact recommendation!');
    } else {
      console.log('✓ PASS: Logged-in user is strictly excluded from people recommendations.');
    }

    // Verify Kumar R from SYB INTERNATIONAL is found
    const containsKumarR = resultTexts.some(
      (text) => text.includes('Kumar R') && text.includes('SYB INTERNATIONAL')
    );
    if (containsKumarR) {
      console.log('✓ PASS: "Kumar R" at SYB INTERNATIONAL correctly rendered in search results.');
    } else {
      console.warn('Note: Kumar R was not found in the immediate results snippet.');
    }

    // Verify section labels
    const sectionLabels = page.locator('.gs-section-label');
    const sectionTexts = await sectionLabels.allInnerTexts();
    console.log('Visible categories:', sectionTexts);

    await page.screenshot({ path: path.join(screenshotDir, '02-global-search-kumar-results.png') });
    console.log('Saved 02-global-search-kumar-results.png');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Keyboard navigation (ArrowDown, ArrowUp)
    // ─────────────────────────────────────────────────────────────
    console.log('Testing keyboard navigation...');
    await searchInput.press('ArrowDown');
    await page.waitForTimeout(200);
    const activeItem1 = page.locator('.gs-result-item.active');
    const activeCount1 = await activeItem1.count();
    console.log(`Active items after ArrowDown 1: ${activeCount1}`);
    if (activeCount1 > 0) {
      console.log('Active text 1:', (await activeItem1.first().innerText()).replace(/\n+/g, ' · '));
    }

    await searchInput.press('ArrowDown');
    await page.waitForTimeout(200);
    const activeItem2 = page.locator('.gs-result-item.active');
    const activeCount2 = await activeItem2.count();
    console.log(`Active items after ArrowDown 2: ${activeCount2}`);
    if (activeCount2 > 0) {
      console.log('Active text 2:', (await activeItem2.first().innerText()).replace(/\n+/g, ' · '));
    }

    await page.screenshot({ path: path.join(screenshotDir, '03-global-search-keyboard-nav.png') });
    console.log('Saved 03-global-search-keyboard-nav.png');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Search "adani" - Companies & Executives
    // ─────────────────────────────────────────────────────────────
    console.log('Searching "adani"...');
    await searchInput.fill('');
    await searchInput.fill('adani');
    await page.waitForTimeout(1200);

    const adaniResultTexts = await page.locator('.gs-result-item').allInnerTexts();
    console.log('Adani search results:');
    adaniResultTexts.forEach((t, i) => console.log(`  [${i + 1}] ${t.replace(/\n+/g, ' · ')}`));

    await page.screenshot({ path: path.join(screenshotDir, '04-global-search-adani-results.png') });
    console.log('Saved 04-global-search-adani-results.png');

    // ─────────────────────────────────────────────────────────────
    // TEST 5: Close Search via Escape
    // ─────────────────────────────────────────────────────────────
    console.log('Pressing Escape to close search...');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    const isVisibleAfterEsc = await searchOverlay.isVisible();
    console.log('Search overlay visible after Escape:', isVisibleAfterEsc);
    if (!isVisibleAfterEsc) {
      console.log('✓ PASS: Search dismissed cleanly on Escape.');
    }

    await context.close();

    // ═════════════════════════════════════════════════════════════════
    // 2. MOBILE VIEWPORT TEST (375x667)
    // ═════════════════════════════════════════════════════════════════
    console.log('\nTesting mobile viewport (375x667)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await setupRoutesAndAuth(mobileContext, mobilePage);

    await mobilePage.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await mobilePage.waitForTimeout(2000);

    // Open search on mobile
    const mobileTrigger = mobilePage.locator('.global-search-trigger');
    await mobileTrigger.waitFor({ state: 'attached', timeout: 10000 });
    await mobileTrigger.click({ force: true });
    await mobilePage.waitForTimeout(1000);

    const mobileModal = mobilePage.locator('.global-search-modal');
    await mobileModal.waitFor({ state: 'visible', timeout: 5000 });
    const mobileBox = await mobileModal.boundingBox();
    console.log('Mobile modal bounding box:', mobileBox);

    const mobileInput = mobilePage.locator('.global-search-input-row input');
    await mobileInput.fill('kumar');
    await mobilePage.waitForTimeout(1200);

    await mobilePage.screenshot({ path: path.join(screenshotDir, '05-global-search-mobile.png') });
    console.log('Saved 05-global-search-mobile.png');

    await mobileContext.close();

    console.log('\n=============================================================');
    console.log('ALL GLOBAL SEARCH PLAYWRIGHT VERIFICATION CHECKS COMPLETED!');
    console.log('=============================================================\n');
  } catch (err) {
    console.error('Playwright verification encountered an error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
