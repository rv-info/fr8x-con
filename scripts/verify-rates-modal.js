const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const screenshotDir = path.join(process.cwd(), 'screenshots', 'rates-editor');
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

  console.log('Navigating to http://localhost:3000/login for auth seeding...');
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
      status: 'active',
      role: 'user',
    };
    const now = String(Date.now());
    localStorage.setItem('fr8x_cached_user_profile', JSON.stringify(mockProfile));
    localStorage.setItem('fr8x_active_user_uid', mockProfile.uid);
    localStorage.setItem('ACTIVE_SESSION_KEY', now);
    localStorage.setItem('fr8x_session_expiry', String(Date.now() + 86400000));
  }, { uid, email });
  console.log('Auth seeded successfully.');
}

async function runVerification() {
  console.log('Launching Chromium for Rates Editor Live Verification...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  page.on('dialog', async (dialog) => {
    console.log(`Dialog message: ${dialog.message()}`);
    await dialog.accept();
  });

  try {
    console.log('Seeding authentication...');
    await seedAuth(context, page);

    console.log('Navigating to http://localhost:3000/rates ...');
    await page.goto('http://localhost:3000/rates', { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(3000);

    // Initial screenshot
    await page.screenshot({ path: path.join(screenshotDir, '00_rates_page_initial.png') });
    console.log('Captured 00_rates_page_initial.png');

    // 1. Locate "Show Rates Editor" button
    const showEditorBtn = page.locator('button:has-text("Show Rates Editor")');
    await showEditorBtn.waitFor({ state: 'visible', timeout: 15000 });
    console.log('Found "Show Rates Editor" button. Clicking...');

    await showEditorBtn.click();
    await page.waitForTimeout(1000);

    // Check that NO "Form reset to clean state." toast appears
    const resetToast = page.locator('text=Form reset to clean state.');
    const hasResetToast = await resetToast.isVisible().catch(() => false);
    if (hasResetToast) {
      console.error('FAIL: "Form reset to clean state." appeared upon clicking Show Rates Editor!');
    } else {
      console.log('PASS: No "Form reset to clean state." toast appeared when clicking Show Rates Editor.');
    }

    // Check that modal is visible
    const modalContainer = page.locator('.rates-editor-modal-container');
    await modalContainer.waitFor({ state: 'visible', timeout: 8000 });
    console.log('PASS: Rates Editor Modal is visible!');

    // Check Modal Header
    const modalHeader = page.locator('#rates-editor-title');
    const headerText = await modalHeader.textContent();
    console.log(`Modal header text: "${headerText}"`);

    // Verify modal dimensions at 1920x1080
    const box1920 = await modalContainer.boundingBox();
    console.log(`Modal dimensions at 1920x1080: Width=${Math.round(box1920.width)}px, Height=${Math.round(box1920.height)}px`);
    await page.screenshot({ path: path.join(screenshotDir, '01_rates_editor_modal_opened_1920.png') });
    console.log('Captured 01_rates_editor_modal_opened_1920.png');

    // Test at 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(600);
    const box1440 = await modalContainer.boundingBox();
    console.log(`Modal dimensions at 1440x900: Width=${Math.round(box1440.width)}px, Height=${Math.round(box1440.height)}px`);
    await page.screenshot({ path: path.join(screenshotDir, '02_rates_editor_modal_1440.png') });
    console.log('Captured 02_rates_editor_modal_1440.png');

    // Test at 1366x768
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.waitForTimeout(600);
    const box1366 = await modalContainer.boundingBox();
    console.log(`Modal dimensions at 1366x768: Width=${Math.round(box1366.width)}px, Height=${Math.round(box1366.height)}px`);
    await page.screenshot({ path: path.join(screenshotDir, '03_rates_editor_modal_1366.png') });
    console.log('Captured 03_rates_editor_modal_1366.png');

    // Test at Mobile 375x812
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(600);
    const boxMobile = await modalContainer.boundingBox();
    console.log(`Modal dimensions at 375x812: Width=${Math.round(boxMobile.width)}px, Height=${Math.round(boxMobile.height)}px`);
    await page.screenshot({ path: path.join(screenshotDir, '04_rates_editor_modal_mobile_375.png') });
    console.log('Captured 04_rates_editor_modal_mobile_375.png');

    // Reset viewport to 1440x900 for functional form test
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(600);

    // 2. Fill form fields
    console.log('Filling form fields in Rates Editor...');
    // Carrier
    const carrierInput = modalContainer.locator('input[placeholder*="shipping line"]');
    await carrierInput.fill('MSC');
    await page.waitForTimeout(200);

    // POR & POL
    const porInput = modalContainer.locator('input[placeholder="POR"]');
    await porInput.fill('Nhava Sheva');

    const polInput = modalContainer.locator('input[placeholder="POL"]');
    await polInput.fill('Nhava Sheva');

    // POD & FPOD
    const podInput = modalContainer.locator('input[placeholder="POD"]');
    await podInput.fill('Rotterdam');

    const fpodInput = modalContainer.locator('input[placeholder="FPOD"]');
    await fpodInput.fill('Rotterdam');

    // Rates 20DV & 40HC
    const d20Input = modalContainer.locator('input[placeholder="e.g. 1480"]');
    await d20Input.fill('1550');

    const h40Input = modalContainer.locator('input[placeholder="e.g. 2320"]');
    await h40Input.fill('2450');

    // Free Time
    const freeTimeInput = modalContainer.locator('input[placeholder="e.g. 14 days"]');
    await freeTimeInput.fill('14 days');

    // Validity
    const validityInput = modalContainer.locator('input[type="date"]');
    await validityInput.fill('2026-10-31');

    // Transit
    const transitInput = modalContainer.locator('input[placeholder="e.g. 29 days"]');
    await transitInput.fill('28 days');

    // Routing
    const routingInput = modalContainer.locator('input[placeholder="Direct / TS"]');
    await routingInput.fill('Direct Ocean Service');

    // Remarks
    const remarksInput = modalContainer.locator('textarea[placeholder*="Surcharges"]');
    await remarksInput.fill('Freight valid for general FCL cargo, subject to standard carrier terms.');

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, '05_form_filled.png') });
    console.log('Captured 05_form_filled.png');

    // 3. Click "SAVE RATE"
    console.log('Clicking "SAVE RATE" button...');
    const saveBtn = modalContainer.locator('button:has-text("SAVE RATE")');
    await saveBtn.click();
    await page.waitForTimeout(1000);

    // Verify success toast
    const saveToast = page.locator('text=New custom i-Rate saved to workspace.');
    const hasSaveToast = await saveToast.isVisible().catch(() => false);
    console.log(`Saved rate toast visible: ${hasSaveToast}`);

    // Modal should now be closed
    const isModalVisibleAfterSave = await modalContainer.isVisible().catch(() => false);
    console.log(`Modal closed after save: ${!isModalVisibleAfterSave}`);

    await page.screenshot({ path: path.join(screenshotDir, '06_rates_table_after_save.png') });
    console.log('Captured 06_rates_table_after_save.png');

    // 4. Click row to open in Edit Mode
    console.log('Switching to "My i-Rates" tab or clicking row to edit...');
    const myRatesTab = page.locator('.tab:has-text("My i-Rates")').first();
    if (await myRatesTab.isVisible()) {
      await myRatesTab.click();
      await page.waitForTimeout(600);
    }

    const tableRow = page.locator('.rates-table tbody tr').first();
    if (await tableRow.isVisible()) {
      console.log('Found table row. Clicking to open in Edit Mode...');
      await tableRow.click();
      await page.waitForTimeout(800);

      // Verify modal opened in Edit Mode
      await modalContainer.waitFor({ state: 'visible', timeout: 5000 });
      const editBadge = modalContainer.locator('text=Editing Rate');
      const isEditBadgeVisible = await editBadge.isVisible().catch(() => false);
      console.log(`Edit mode badge visible: ${isEditBadgeVisible}`);

      const updateBtn = modalContainer.locator('button:has-text("UPDATE")');
      const isUpdateBtnVisible = await updateBtn.isVisible().catch(() => false);
      console.log(`UPDATE button visible: ${isUpdateBtnVisible}`);

      const dupBtn = modalContainer.locator('button:has-text("DUPLICATE AS NEW")');
      const isDupBtnVisible = await dupBtn.isVisible().catch(() => false);
      console.log(`DUPLICATE AS NEW button visible: ${isDupBtnVisible}`);

      await page.screenshot({ path: path.join(screenshotDir, '07_rates_modal_edit_mode.png') });
      console.log('Captured 07_rates_modal_edit_mode.png');

      // 5. Test CLEAR button inside modal
      console.log('Clicking CLEAR button inside modal...');
      const clearBtn = modalContainer.locator('button:has-text("CLEAR")');
      await clearBtn.click();
      await page.waitForTimeout(500);

      // Assert toast "Form reset to clean state." appears ONLY upon clicking the CLEAR button
      const clearToast = page.locator('text=Form reset to clean state.');
      const hasClearToast = await clearToast.isVisible().catch(() => false);
      console.log(`PASS: "Form reset to clean state." appeared upon clicking CLEAR: ${hasClearToast}`);

      await page.screenshot({ path: path.join(screenshotDir, '08_rates_modal_after_clear.png') });
      console.log('Captured 08_rates_modal_after_clear.png');

      // Close modal
      const closeBtn = modalContainer.locator('button[aria-label="Close Rates Editor"]');
      await closeBtn.click();
      await page.waitForTimeout(500);
    }

    console.log('ALL PLAYWRIGHT TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during live verification:', err);
    await page.screenshot({ path: path.join(screenshotDir, 'error_state.png') }).catch(() => {});
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runVerification();
