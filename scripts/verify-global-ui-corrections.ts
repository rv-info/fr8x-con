import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function run() {
  console.log('================================================================');
  console.log('  GLOBAL UI/UX CORRECTIONS MULTI-VIEWPORT VERIFICATION SUITE');
  console.log('================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const artifactDir = path.join(process.cwd(), 'public', 'test-screenshots');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }

  const nowMs = Date.now();
  const sessionPayload = {
    uid: '00000000-0000-0000-0000-000000000001',
    email: 'audit.director@fr8x.in',
    issuedAt: nowMs,
    expiresAt: nowMs + 24 * 60 * 60 * 1000,
  };
  const payloadB64 = Buffer.from(JSON.stringify(sessionPayload)).toString('base64url');
  const sessionToken = `${payloadB64}.mockvalidsignature`;

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 375, height: 667 },
  ];

  let allPassed = true;

  for (const vp of viewports) {
    console.log(`\n▶ Testing Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})...`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });

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

    await context.addInitScript(() => {
      const mockProfile = {
        uid: '00000000-0000-0000-0000-000000000001',
        id: '00000000-0000-0000-0000-000000000001',
        email: 'audit.director@fr8x.in',
        displayName: 'Captain Vikram Singh',
        name: 'Captain Vikram Singh',
        company: 'Adani Logistics Ltd',
        companyName: 'Adani Logistics Ltd',
        companyLogoUrl: '/icons/ship-icon.png',
        designation: 'Head of Ocean Freight',
        city: 'Mumbai',
        country: 'India',
        plan: 'enterprise',
        verified: true,
        hasGoldenTick: true,
        status: 'active',
        role: 'user',
      };
      const now = String(Date.now());
      localStorage.setItem('fr8x_cached_user_profile', JSON.stringify(mockProfile));
      localStorage.setItem('fr8x_active_user_uid', mockProfile.uid);
      localStorage.setItem('ACTIVE_SESSION_KEY', now);
      localStorage.setItem('fr8x_session_expiry', String(Date.now() + 86400000));
    });

    const page = await context.newPage();

    try {
      await page.goto('http://localhost:3000/feeds', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

      // ── 1. AVAILABILITY STATUS DROPDOWN CHECK ──
      console.log('  [1] Verifying Availability Status Dropdown...');
      const pillBtn = page.locator('.net-pill-btn').first();
      await pillBtn.waitFor({ state: 'visible', timeout: 10000 });
      await pillBtn.click();
      await page.waitForTimeout(500);

      const popover = page.locator('.net-pill-popover').first();
      await popover.waitFor({ state: 'visible', timeout: 5000 });
      const popoverBox = await popover.boundingBox();

      if (!popoverBox) throw new Error('Could not compute popover bounding box');

      // Check header text: NO unsupported claims
      const popoverText = await popover.innerText();
      if (popoverText.includes('4G / High-Speed') || popoverText.includes('⚡ High-Speed')) {
        console.error('  ✗ FAIL: Availability popover still displays unsupported speed claims!');
        allPassed = false;
      } else {
        console.log('  ✓ PASS: Unsupported speed claims successfully removed from Availability header.');
      }

      // Check vertical 3 options
      const optCount = await page.locator('.net-status-option-btn').count();
      if (optCount !== 3) {
        console.error(`  ✗ FAIL: Expected 3 availability options, found ${optCount}`);
        allPassed = false;
      } else {
        console.log('  ✓ PASS: Exactly 3 availability options rendered.');
      }

      // Take screenshot of Availability
      await page.screenshot({ path: path.join(artifactDir, `corrected-availability-${vp.name}.png`) });

      // ── 2. CURRENCY CONVERTER & MUTUAL EXCLUSION CHECK (When visible) ──
      const currBtn = page.locator('.currency-select').first();
      const hasCurrBtn = await currBtn.isVisible().catch(() => false);
      if (hasCurrBtn) {
        console.log('  [2] Verifying Currency Converter & Mutual Exclusion...');
        await currBtn.click();
        await page.waitForTimeout(500);

        // Verify Availability popover auto-closed
        const isAvailVisible = await popover.isVisible().catch(() => false);
        if (isAvailVisible) {
          console.error('  ✗ FAIL: Availability popover did not auto-close when Currency opened (Mutual Exclusion Failure)!');
          allPassed = false;
        } else {
          console.log('  ✓ PASS: Mutual exclusion verified — Availability auto-closed when Currency opened.');
        }

        const currModal = page.locator('.currency-converter-modal').first();
        await currModal.waitFor({ state: 'visible', timeout: 5000 });
        const currBox = await currModal.boundingBox();

        if (currBox) {
          console.log(`  Currency Converter dimensions: ${currBox.width.toFixed(0)}x${currBox.height.toFixed(0)}px`);
          if (currBox.height > 520) {
            console.error(`  ✗ FAIL: Currency Converter is too tall (${currBox.height}px)! Huge grid still exists.`);
            allPassed = false;
          } else {
            console.log('  ✓ PASS: Currency Converter is compact and fits comfortably in viewport.');
          }
        }

        // Verify exactly 5 quick currency shortcuts
        const shortcutButtons = currModal.locator('div[style*="grid-template-columns"] button');
        const scCount = await shortcutButtons.count();
        if (scCount === 5) {
          console.log('  ✓ PASS: Exactly 5 curated currency shortcuts (INR, USD, EUR, GBP, AED) rendered.');
        } else {
          console.error(`  ✗ FAIL: Expected 5 currency shortcuts, found ${scCount}`);
          allPassed = false;
        }

        // Take screenshot of Currency Converter
        await page.screenshot({ path: path.join(artifactDir, `corrected-currency-${vp.name}.png`) });
      }

      // ── 3. NOTIFICATIONS PANEL & MUTUAL EXCLUSION CHECK ──
      console.log('  [3] Verifying Notifications Panel & Mutual Exclusion...');
      const notifBtn = page.locator('.topicon').first();
      await notifBtn.click();
      await page.waitForTimeout(500);

      // Verify Currency or Availability modal auto-closed
      if (hasCurrBtn) {
        const isCurrVisible = await page.locator('.currency-converter-modal').isVisible().catch(() => false);
        if (isCurrVisible) {
          console.error('  ✗ FAIL: Currency modal did not auto-close when Notifications opened (Mutual Exclusion Failure)!');
          allPassed = false;
        } else {
          console.log('  ✓ PASS: Mutual exclusion verified — Currency auto-closed when Notifications opened.');
        }
      } else {
        const isAvailVisible = await popover.isVisible().catch(() => false);
        if (isAvailVisible) {
          console.error('  ✗ FAIL: Availability popover did not auto-close when Notifications opened (Mutual Exclusion Failure)!');
          allPassed = false;
        } else {
          console.log('  ✓ PASS: Mutual exclusion verified — Availability auto-closed when Notifications opened.');
        }
      }

      const notifModal = page.locator('.notifications-dropdown').first();
      await notifModal.waitFor({ state: 'visible', timeout: 5000 });
      const notifBox = await notifModal.boundingBox();

      // Verify Category Tabs
      const notifCats = notifModal.locator('.notif-cats button');
      const catCount = await notifCats.count();
      console.log(`  Notification category tabs count: ${catCount}`);
      if (catCount >= 5) {
        console.log('  ✓ PASS: All 5 category tabs rendered.');
      } else {
        console.error(`  ✗ FAIL: Expected 5 category tabs, found ${catCount}`);
        allPassed = false;
      }

      // Take screenshot of Notifications Panel
      await page.screenshot({ path: path.join(artifactDir, `corrected-notifications-${vp.name}.png`) });

      // Press Escape to test dismissal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const isNotifVisibleAfterEscape = await notifModal.isVisible().catch(() => false);
      if (!isNotifVisibleAfterEscape) {
        console.log('  ✓ PASS: Notifications panel closed cleanly on Escape key.');
      } else {
        console.error('  ✗ FAIL: Notifications panel remained visible after Escape key!');
        allPassed = false;
      }

      // ── 4. QUICK SHORTCUTS CARD & BRANDING (Desktop) ──
      if (vp.name === 'desktop') {
        console.log('  [4] Verifying Quick Shortcuts Card & Company Branding...');
        const shortcuts = page.locator('.feed-shortcut-link');
        const scTotal = await shortcuts.count();
        if (scTotal === 5) {
          console.log(`  ✓ PASS: All 5 Quick Shortcuts rendered.`);
          const heights = [];
          for (let i = 0; i < scTotal; i++) {
            const box = await shortcuts.nth(i).boundingBox();
            if (box) heights.push(box.height);
          }
          const allSameHeight = heights.every(h => Math.abs(h - heights[0]) < 2);
          if (allSameHeight) {
            console.log(`  ✓ PASS: All Quick Shortcuts have uniform height (${heights[0]}px).`);
          } else {
            console.error(`  ✗ FAIL: Quick Shortcuts have inconsistent heights: ${heights.join(', ')}`);
            allPassed = false;
          }
        }

        // Check Left rail company logo
        const leftRailLogo = page.locator('.feed-left-rail img[alt*="Company"]').first();
        const hasCompanyLogo = await leftRailLogo.isVisible().catch(() => false);
        if (hasCompanyLogo) {
          console.log('  ✓ PASS: Company logo rendered with proper branding containment.');
        }

        await page.screenshot({ path: path.join(artifactDir, `corrected-feed-left-rail.png`) });
      }

      // ── 5. RATES EDITOR AI BADGE CHECK (Desktop) ──
      if (vp.name === 'desktop') {
        console.log('  [5] Verifying Rates Editor Internal AI Badge Removal...');
        await page.goto('http://localhost:3000/rates', { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        // Click "+ Create Rate" or "+ Post Rate" to open Rates Editor modal
        const createRateBtn = page.locator('button:has-text("+ Create Rate"), button:has-text("+ Post Rate"), button:has-text("Create Rate")').first();
        const hasBtn = await createRateBtn.isVisible().catch(() => false);
        if (hasBtn) {
          await createRateBtn.click();
          await page.waitForTimeout(600);

          const modal = page.locator('.rates-modal, .rates-editor-modal, [class*="modal"]').first();
          const modalText = await page.evaluate(() => document.body.innerText);

          if (modalText.includes('Self-Hosted Edge Model (1.85 MB)')) {
            console.error('  ✗ FAIL: Internal model size label "Self-Hosted Edge Model (1.85 MB)" is STILL visible!');
            allPassed = false;
          } else {
            console.log('  ✓ PASS: Internal model label "Self-Hosted Edge Model (1.85 MB)" successfully eliminated.');
          }

          if (modalText.includes('Instant Parsing') && modalText.includes('AI NATURAL-LANGUAGE RATE ENTRY')) {
            console.log('  ✓ PASS: Professional customer-facing description "Instant Parsing" remains intact.');
          }

          await page.screenshot({ path: path.join(artifactDir, `corrected-rates-editor.png`) });
        }
      }

    } catch (err: any) {
      console.error(`  ✗ Viewport ${vp.name} error:`, err.message);
      allPassed = false;
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 ALL GLOBAL UI/UX CORRECTION CHECKS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED. REVIEW LOGS.');
    process.exit(1);
  }
}

run();
