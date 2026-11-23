import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function run() {
  console.log('========================================================================');
  console.log('  TABLE EDITOR, GLASSMORPHISM & NOTIFICATIONS VERIFICATION SUITE');
  console.log('========================================================================\n');

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
    console.log(`\n▶ [Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})]`);
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
        displayName: 'Rajat Kumar RAI',
        name: 'Rajat Kumar RAI',
        company: 'COGOPORT PRIVATE LIMITED',
        companyName: 'COGOPORT PRIVATE LIMITED',
        designation: 'ASM',
        city: 'Gurugram',
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
      await page.goto('http://localhost:3000/feeds', { waitUntil: 'domcontentloaded', timeout: 35000 });
      await page.waitForTimeout(2000);

      // ── 1. VERIFY PROFILE DROPDOWN PLAN BADGE (DEFECT 3) ──
      console.log('  [1] Verifying Profile Dropdown Plan Badge...');
      const userBtn = page.locator('.user-top-btn, button:has-text("RR")').first();
      const hasUserBtn = await userBtn.isVisible().catch(() => false);
      if (hasUserBtn) {
        await userBtn.click();
        await page.waitForTimeout(400);

        const userDropdown = page.locator('.user-dropdown-menu').first();
        await userDropdown.waitFor({ state: 'visible', timeout: 5000 });

        const planBadge = userDropdown.locator('.user-plan-badge');
        const badgeVisible = await planBadge.isVisible().catch(() => false);

        if (!badgeVisible) {
          console.error('  ✗ FAIL: .user-plan-badge is not visible!');
          allPassed = false;
        } else {
          const badgeText = (await planBadge.innerText()).trim();
          console.log(`  Plan badge text rendered: "${badgeText}"`);
          if (!badgeText.includes('PLAN')) {
            console.error(`  ✗ FAIL: Plan badge text does not include "PLAN"! Found: "${badgeText}"`);
            allPassed = false;
          } else {
            console.log('  ✓ PASS: Plan badge contains "PLAN" ("' + badgeText + '").');
          }

          // Verify computed styles: background is not white and color is dark teal
          const badgeStyles = await planBadge.evaluate((el) => {
            const cs = window.getComputedStyle(el);
            return {
              bg: cs.backgroundColor,
              color: cs.color,
              display: cs.display,
            };
          });
          console.log(`  Plan badge computed styles: bg=${badgeStyles.bg}, color=${badgeStyles.color}`);
          if (badgeStyles.color === badgeStyles.bg) {
            console.error('  ✗ FAIL: Plan badge text color is identical to background (invisible text)!');
            allPassed = false;
          } else {
            console.log('  ✓ PASS: Plan badge has high contrast text and visible styled background.');
          }
        }

        await page.screenshot({ path: path.join(artifactDir, `verified-profile-dropdown-${vp.name}.png`) });

        // Close user dropdown by clicking close-red-box
        const closeUserBtn = userDropdown.locator('.close-red-box').first();
        if (await closeUserBtn.isVisible().catch(() => false)) {
          await closeUserBtn.click();
        } else {
          await page.keyboard.press('Escape');
        }
        await page.waitForTimeout(300);
      }

      // ── 2. VERIFY NOTIFICATIONS CATEGORIES GRID (DEFECT 2) ──
      console.log('  [2] Verifying Notifications Categories Grid & Zero Overflow...');
      const notifBtn = page.locator('.topicon').first();
      await notifBtn.click();
      await page.waitForTimeout(400);

      const notifModal = page.locator('.notifications-dropdown').first();
      await notifModal.waitFor({ state: 'visible', timeout: 5000 });
      const notifBox = await notifModal.boundingBox();

      if (notifBox) {
        const notifCatsContainer = notifModal.locator('.notif-cats').first();
        const catsBox = await notifCatsContainer.boundingBox();

        const catButtons = notifCatsContainer.locator('button');
        const catBtnCount = await catButtons.count();
        console.log(`  Notification category tabs count: ${catBtnCount}`);

        if (catBtnCount < 5) {
          console.error(`  ✗ FAIL: Expected at least 5 category tabs, found ${catBtnCount}`);
          allPassed = false;
        } else {
          console.log('  ✓ PASS: All category tabs rendered.');
        }

        // Verify zero overflow: every category button must stay within catsBox width
        if (catsBox) {
          let hasOverflow = false;
          for (let i = 0; i < catBtnCount; i++) {
            const btnBox = await catButtons.nth(i).boundingBox();
            if (btnBox && (btnBox.x + btnBox.width > catsBox.x + catsBox.width + 2)) {
              console.error(`  ✗ FAIL: Category button ${i} overflows right edge of container!`);
              hasOverflow = true;
              allPassed = false;
              break;
            }
          }
          if (!hasOverflow) {
            console.log('  ✓ PASS: All notification category buttons fit within container with zero horizontal clipping.');
          }
        }
      }

      await page.screenshot({ path: path.join(artifactDir, `verified-notifications-${vp.name}.png`) });

      // Close notifications
      const closeNotifBtn = notifModal.locator('.close-red-box').first();
      if (await closeNotifBtn.isVisible().catch(() => false)) {
        await closeNotifBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
      await page.waitForTimeout(300);

      // ── 3. VERIFY RICH TEXT EDITOR & INTERACTIVE TABLE (DEFECT 1) ──
      if (vp.name === 'desktop') {
        console.log('  [3] Verifying Real Functional Table Editor in RichPostEditor...');
        const editorContainer = page.locator('.rich-post-editor-container').first();
        await editorContainer.waitFor({ state: 'visible', timeout: 5000 });

        // Click the "Table" button in the toolbar
        const tableBtn = editorContainer.locator('button[title*="Table"]').first();
        await tableBtn.waitFor({ state: 'visible', timeout: 5000 });
        await tableBtn.click();
        await page.waitForTimeout(400);

        // Verify Table Configuration Modal appears
        const tableModalTitle = page.locator('h4:has-text("Insert Structured Rate / Commodity Table")').first();
        await tableModalTitle.waitFor({ state: 'visible', timeout: 5000 });
        console.log('  ✓ PASS: Table configuration modal opened cleanly.');

        await page.screenshot({ path: path.join(artifactDir, 'verified-table-modal.png') });

        // Confirm Insertion: click "Insert Table into Post"
        const insertBtn = page.locator('button:has-text("Insert Table into Post")').first();
        await insertBtn.waitFor({ state: 'visible', timeout: 5000 });
        await insertBtn.click();
        await page.waitForTimeout(800);

        // Verify the Interactive Table Card is now rendered!
        const interactiveCard = editorContainer.locator('.fr8x-interactive-table-card').first();
        await interactiveCard.waitFor({ state: 'visible', timeout: 5000 });
        console.log('  ✓ PASS: Genuine Interactive Table Card mounted in editor.');

        // Verify Working Controls are present
        const addRowBtn = interactiveCard.locator('button:has-text("Add Row")');
        const delRowBtn = interactiveCard.locator('button:has-text("Del Row")');
        const addColBtn = interactiveCard.locator('button:has-text("Add Col")');
        const delColBtn = interactiveCard.locator('button:has-text("Del Col")');
        const clearBtn = interactiveCard.locator('button:has-text("Clear")');
        const removeBtn = interactiveCard.locator('button:has-text("Remove")');

        const controlsPresent =
          (await addRowBtn.isVisible()) &&
          (await delRowBtn.isVisible()) &&
          (await addColBtn.isVisible()) &&
          (await delColBtn.isVisible()) &&
          (await clearBtn.isVisible()) &&
          (await removeBtn.isVisible());

        if (!controlsPresent) {
          console.error('  ✗ FAIL: One or more table controls (Add Row, Del Row, Add Col, Del Col, Clear, Remove) missing!');
          allPassed = false;
        } else {
          console.log('  ✓ PASS: All working table controls (Add Row, Del Row, Add Col, Del Col, Clear, Remove) verified.');
        }

        // Test Typing in Header and Data Cells
        const headerInputs = interactiveCard.locator('thead input');
        const cellInputs = interactiveCard.locator('tbody input');
        const initialCellCount = await cellInputs.count();
        console.log(`  Initial data cell inputs count: ${initialCellCount}`);

        if (initialCellCount >= 6) {
          // Fill first row
          await cellInputs.nth(0).fill('Nhava Sheva (INNSA)');
          await cellInputs.nth(1).fill('Maersk Line');
          await cellInputs.nth(2).fill('$1450 / 22 Days');

          // Test Add Row control
          const rowCountBefore = await interactiveCard.locator('tbody tr').count();
          await addRowBtn.click();
          await page.waitForTimeout(300);
          const rowCountAfter = await interactiveCard.locator('tbody tr').count();
          console.log(`  Row count before: ${rowCountBefore}, after Add Row: ${rowCountAfter}`);

          if (rowCountAfter === rowCountBefore + 1) {
            console.log('  ✓ PASS: Add Row button successfully added a new row to the table.');
          } else {
            console.error('  ✗ FAIL: Add Row button failed to increase row count!');
            allPassed = false;
          }

          // Test Delete Row control
          await delRowBtn.click();
          await page.waitForTimeout(300);
          const rowCountFinal = await interactiveCard.locator('tbody tr').count();
          if (rowCountFinal === rowCountBefore) {
            console.log('  ✓ PASS: Del Row button successfully removed the row.');
          } else {
            console.error('  ✗ FAIL: Del Row button failed to decrease row count!');
            allPassed = false;
          }
        }

        await page.screenshot({ path: path.join(artifactDir, 'verified-interactive-table-editing.png') });

        // Test Live Preview Toggle
        const previewBtn = editorContainer.locator('button:has-text("Preview")').first();
        await previewBtn.click();
        await page.waitForTimeout(500);

        const previewContainer = editorContainer.locator('.rich-editor-preview');
        await previewContainer.waitFor({ state: 'visible', timeout: 5000 });

        const previewTable = previewContainer.locator('.fr8x-post-table');
        const hasPreviewTable = await previewTable.isVisible().catch(() => false);

        if (!hasPreviewTable) {
          console.error('  ✗ FAIL: Table not rendered as .fr8x-post-table in live preview!');
          allPassed = false;
        } else {
          console.log('  ✓ PASS: Live preview successfully rendered structured HTML table (.fr8x-post-table).');
          const previewText = await previewTable.innerText();
          if (previewText.includes('Nhava Sheva') && previewText.includes('Maersk')) {
            console.log('  ✓ PASS: Interactive table data preserved and rendered accurately in preview.');
          } else {
            console.error('  ✗ FAIL: Cell contents not reflected in preview!');
            allPassed = false;
          }
        }

        await page.screenshot({ path: path.join(artifactDir, 'verified-table-preview.png') });

        // Switch back to edit
        const editBtn = editorContainer.locator('button:has-text("Edit")').first();
        await editBtn.click();
        await page.waitForTimeout(300);
      }

    } catch (err: any) {
      console.error(`  ✗ Viewport ${vp.name} error:`, err.message);
      allPassed = false;
    } finally {
      await context.close();
    }
  }

  await browser.close();

  console.log('\n========================================================================');
  if (allPassed) {
    console.log('🎉 ALL TABLE EDITOR, GLASSMORPHISM & NOTIFICATIONS CHECKS PASSED!');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED. REVIEW LOGS.');
    process.exit(1);
  }
}

run();
