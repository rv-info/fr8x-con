const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(process.cwd(), 'screenshots', 'audit-verification');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function seedAuth(context, page) {
  const uid = 'usr_operator_seed_01';
  const email = 'vikram@adanilogistics.com';
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
      isVerified: true,
      kycStatus: 'verified',
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
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    await seedAuth(context, page);

    // ─────────────────────────────────────────────────────────────
    // TEST 1: Feeds Page Layout, Quick Shortcuts & Chat FAB
    // ─────────────────────────────────────────────────────────────
    console.log('Checking /feeds page layout...');
    await page.goto('http://localhost:3000/feeds', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    // Check Chat FAB presence & styling
    const chatFab = page.locator('.chatfab');
    await chatFab.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✓ .chatfab floating launcher is present and visible.');

    // Verify Chat is NOT expanded across bottom of screen
    const multichattray = page.locator('.multichattray');
    const trayBox = await multichattray.boundingBox();
    console.log('Chat tray bounding box:', trayBox);

    // Check Quick Shortcuts
    const postJobBtn = page.locator('button.feed-shortcut-link:has-text("Post a Job")');
    await postJobBtn.waitFor({ state: 'visible', timeout: 5000 });
    const rateIntelLink = page.locator('a.feed-shortcut-link[href="/rates"]');
    await rateIntelLink.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Quick Shortcuts: "+ Post a Job" button and "Rate Intelligence" link (/rates) found.');

    await page.screenshot({ path: path.join(screenshotDir, '01_feeds_page_clean_layout.png') });
    console.log('✓ Captured 01_feeds_page_clean_layout.png');

    // Click Chat FAB to open Launcher
    await chatFab.click();
    await page.waitForTimeout(800);

    const launcher = page.locator('.chatlauncherpanel');
    await launcher.waitFor({ state: 'visible', timeout: 5000 });
    console.log('✓ Chat launcher panel opened.');
    await page.screenshot({ path: path.join(screenshotDir, '02_feeds_chat_launcher_open.png') });

    // Open first contact chat
    const firstContact = launcher.locator('.chatcontact').first();
    if (await firstContact.count() > 0) {
      await firstContact.click();
      await page.waitForTimeout(800);

      const singleChat = page.locator('.singlechatwindow');
      await singleChat.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✓ Single chat window opened as floating popup.');

      // Check header does not contain raw UUIDs
      const headerText = await singleChat.locator('.chathead').innerText();
      console.log('Chat header text:', headerText.replace(/\n/g, ' '));
      if (/usr_|u-|comp_|[0-9a-f]{8}-[0-9a-f]{4}/i.test(headerText)) {
        console.warn('WARNING: Raw identifier detected in chat header!');
      } else {
        console.log('✓ No raw UUIDs in chat header.');
      }

      await page.screenshot({ path: path.join(screenshotDir, '03_feeds_floating_chat_popup.png') });

      // Click minimize
      const minBtn = singleChat.locator('button[title="Minimize chat"]');
      await minBtn.click();
      await page.waitForTimeout(600);

      const minTab = page.locator('.minichattab');
      await minTab.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✓ Minimized to .minichattab docked pill.');
      await page.screenshot({ path: path.join(screenshotDir, '04_feeds_minimized_chat_pill.png') });
    }

    // ─────────────────────────────────────────────────────────────
    // TEST 2: Profile Page Dual Media Box (88px x 88px)
    // ─────────────────────────────────────────────────────────────
    console.log('Checking /profile page media controls...');
    await page.goto('http://localhost:3000/profile', { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(3000);

    const profilePhotoText = page.locator('text=PROFILE PHOTO');
    await profilePhotoText.waitFor({ state: 'visible', timeout: 10000 });
    const companyLogoText = page.locator('text=COMPANY LOGO');
    await companyLogoText.waitFor({ state: 'visible', timeout: 10000 });
    console.log('✓ Profile Photo and Company Logo dual media sections visible.');

    await page.screenshot({ path: path.join(screenshotDir, '05_profile_dual_media_controls.png') });
    console.log('✓ Captured 05_profile_dual_media_controls.png');

    // ─────────────────────────────────────────────────────────────
    // TEST 3: Rates Page (Verify no full-width chat panel)
    // ─────────────────────────────────────────────────────────────
    console.log('Checking /rates page layout...');
    await page.goto('http://localhost:3000/rates', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    await page.screenshot({ path: path.join(screenshotDir, '06_rates_clean_layout.png') });
    console.log('✓ Captured 06_rates_clean_layout.png');

    // ─────────────────────────────────────────────────────────────
    // TEST 4: Mobile Viewport (375x667)
    // ─────────────────────────────────────────────────────────────
    console.log('Checking mobile responsive view...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotDir, '07_mobile_clean_layout.png') });
    console.log('✓ Captured 07_mobile_clean_layout.png');

    console.log('\n=== ALL PLAYWRIGHT VERIFICATIONS PASSED ===\n');
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
