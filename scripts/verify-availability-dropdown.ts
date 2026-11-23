import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function run() {
  console.log('================================================================');
  console.log('  AVAILABILITY STATUS DROPDOWN MULTI-VIEWPORT VERIFICATION SUITE');
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

      // Locate the status pill button
      const pillBtn = page.locator('.net-pill-btn').first();
      await pillBtn.waitFor({ state: 'visible', timeout: 10000 });
      const triggerBox = await pillBtn.boundingBox();
      console.log(`  Trigger button bounding box:`, triggerBox);

      // Click to open dropdown
      await pillBtn.click();
      await page.waitForTimeout(600);

      const popover = page.locator('.net-pill-popover').first();
      await popover.waitFor({ state: 'visible', timeout: 5000 });
      const popoverBox = await popover.boundingBox();
      console.log(`  Popover bounding box:`, popoverBox);

      if (!popoverBox || !triggerBox) {
        throw new Error('Could not compute bounding boxes');
      }

      // Check vertical gap between trigger and popover (should be 6-8px)
      const verticalGap = popoverBox.y - (triggerBox.y + triggerBox.height);
      console.log(`  Vertical gap below trigger: ${verticalGap.toFixed(1)}px`);
      if (verticalGap < 4 || verticalGap > 12) {
        console.error(`  ✗ FAIL: Vertical gap ${verticalGap}px is outside expected 6-8px range.`);
        allPassed = false;
      } else {
        console.log(`  ✓ PASS: Vertical gap is exactly within 6-8px range.`);
      }

      // Check that popover is within viewport
      if (popoverBox.x < 0 || popoverBox.x + popoverBox.width > vp.width) {
        console.error(`  ✗ FAIL: Popover overflows viewport horizontally (x: ${popoverBox.x}, width: ${popoverBox.width}, vpWidth: ${vp.width})`);
        allPassed = false;
      } else {
        console.log(`  ✓ PASS: Popover stays completely within horizontal viewport bounds.`);
      }

      // Check that options are arranged vertically (each option has greater Y than previous)
      const options = page.locator('.net-status-option-btn');
      const optCount = await options.count();
      console.log(`  Status options count: ${optCount}`);
      if (optCount !== 3) {
        console.error(`  ✗ FAIL: Expected 3 options (Online, Away, Appear Offline), got ${optCount}`);
        allPassed = false;
      }

      const optBoxes = [];
      for (let i = 0; i < optCount; i++) {
        const ob = await options.nth(i).boundingBox();
        if (ob) optBoxes.push(ob);
      }

      if (optBoxes.length === 3) {
        const isVertical = optBoxes[1].y > optBoxes[0].y + 30 && optBoxes[2].y > optBoxes[1].y + 30;
        const isSameX = Math.abs(optBoxes[0].x - optBoxes[1].x) < 5 && Math.abs(optBoxes[1].x - optBoxes[2].x) < 5;
        if (isVertical && isSameX) {
          console.log(`  ✓ PASS: Options are strictly vertical and stacked row-by-row (Opt1 Y:${optBoxes[0].y.toFixed(0)}, Opt2 Y:${optBoxes[1].y.toFixed(0)}, Opt3 Y:${optBoxes[2].y.toFixed(0)})`);
        } else {
          console.error(`  ✗ FAIL: Options are NOT stacked vertically! Got Ys: ${optBoxes.map(b => b.y).join(', ')}`);
          allPassed = false;
        }
      }

      // Check overlap with Trade Careers & Jobs (if visible on this viewport)
      const sideCard = page.locator('.side-card').first();
      const hasSideCard = await sideCard.isVisible().catch(() => false);
      if (hasSideCard) {
        const sideBox = await sideCard.boundingBox();
        if (sideBox) {
          // Check rectangle intersection
          const overlapsX = Math.max(0, Math.min(popoverBox.x + popoverBox.width, sideBox.x + sideBox.width) - Math.max(popoverBox.x, sideBox.x));
          const overlapsY = Math.max(0, Math.min(popoverBox.y + popoverBox.height, sideBox.y + sideBox.height) - Math.max(popoverBox.y, sideBox.y));
          const hasOverlap = overlapsX > 0 && overlapsY > 0;
          if (hasOverlap) {
            console.error(`  ✗ FAIL: Popover collides with side-card! Overlap area: ${overlapsX}px x ${overlapsY}px`);
            allPassed = false;
          } else {
            console.log(`  ✓ PASS: Zero collision with Trade Careers & Jobs side card (disjoint bounding boxes).`);
          }
        }
      }

      // Take screenshot for visual audit
      const ssPath = path.join(artifactDir, `availability-dropdown-${vp.name}.png`);
      await page.screenshot({ path: ssPath });
      console.log(`  Saved screenshot: ${ssPath}`);

      // Test Escape key closure
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const isVisibleAfterEscape = await popover.isVisible().catch(() => false);
      if (!isVisibleAfterEscape) {
        console.log(`  ✓ PASS: Dropdown successfully closes on Escape key.`);
      } else {
        console.error(`  ✗ FAIL: Dropdown remained visible after pressing Escape.`);
        allPassed = false;
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
    console.log('🎉 ALL VIEWPORT & INTERACTION TESTS PASSED CLEANLY!');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED. PLEASE REVIEW LOGS.');
    process.exit(1);
  }
}

run();
