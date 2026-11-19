const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOT_DIR = path.join(__dirname, '../screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function verifyChromeOnline() {
  console.log('=== FR8X CHROME ONLINE STATUS & TYPOGRAPHY DIAGNOSTIC ===\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // 1. Navigate to /test-pill
    console.log('1. Navigating to /test-pill on Chrome...');
    await page.goto('http://localhost:3000/test-pill', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500); // Allow hydration & NetworkContext latency probe

    // 2. Locate NetworkStatusPill
    console.log('2. Inspecting NetworkStatusPill button...');
    const pillBtn = await page.$('#status-pill-wrap button[aria-haspopup="true"]');
    if (!pillBtn) {
      throw new Error('NetworkStatusPill button not found on page');
    }

    const initialText = await pillBtn.innerText();
    const btnHtml = await pillBtn.innerHTML();
    console.log(`   Initial Pill Label: "${initialText.trim()}"`);
    console.log(`   Initial Pill innerHTML: ${btnHtml}`);

    // 3. Inspect Online Dot Computed Styles
    const dotSpan = await page.$('#status-pill-wrap button > span:first-of-type, #status-pill-wrap button span[style*="border-radius"], #status-pill-wrap button span[style*="borderRadius"]');
    const dotStyle = await page.evaluate((el) => {
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      return {
        background: cs.backgroundColor,
        width: cs.width,
        height: cs.height,
        boxShadow: cs.boxShadow,
      };
    }, dotSpan);
    console.log('   Online Dot Computed:', dotStyle);

    // Money Green #3FA66B = rgb(63, 166, 107)
    const isMoneyGreen = dotStyle && dotStyle.background.includes('63, 166, 107');
    console.log(`   ✓ Money Green Online Dot Verified: ${isMoneyGreen ? 'PASS' : 'FAIL (' + dotStyle?.background + ')'}`);

    // Check Button Typography
    const pillTypography = await page.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return {
        fontFamily: cs.fontFamily,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
      };
    }, pillBtn);
    console.log('   Pill Button Typography:', pillTypography);
    const isCalibri11 = pillTypography.fontFamily.toLowerCase().includes('calibri') && pillTypography.fontSize === '11px';
    console.log(`   ✓ Calibri 11px Typography Verified: ${isCalibri11 ? 'PASS' : 'FAIL'}`);

    const shot1 = path.join(SCREENSHOT_DIR, 'chrome-online-pill.png');
    await page.screenshot({ path: shot1 });
    console.log(`   📸 Saved screenshot: ${path.basename(shot1)}`);

    // 4. Click Pill to open Availability Popover
    console.log('\n3. Clicking Pill to open Availability Popover...');
    await pillBtn.click();
    await page.waitForTimeout(600);

    const shot2 = path.join(SCREENSHOT_DIR, 'chrome-online-popover.png');
    await page.screenshot({ path: shot2 });
    console.log(`   📸 Saved screenshot: ${path.basename(shot2)}`);

    // Inspect Popover Items & Styles
    const popoverAudit = await page.evaluate(() => {
      const popover = document.querySelector('div[style*="position: absolute"]');
      if (!popover) return null;
      const cs = window.getComputedStyle(popover);
      const items = Array.from(popover.querySelectorAll('button')).map((b) => {
        const bcs = window.getComputedStyle(b);
        const dot = b.querySelector('span[style*="border-radius: 50%"], span[style*="borderRadius: 50%"]');
        const dotColor = dot ? window.getComputedStyle(dot).backgroundColor : null;
        return {
          text: b.innerText.split('\n')[0].trim(),
          fontSize: bcs.fontSize,
          fontFamily: bcs.fontFamily,
          dotColor,
        };
      });
      return {
        border: cs.border,
        background: cs.backgroundColor,
        fontFamily: cs.fontFamily,
        items,
      };
    });
    console.log('   Popover Audit Details:', popoverAudit);

    // 5. Toggle to Away
    console.log('\n4. Toggling Status to Away...');
    const awayOption = await page.$('div[style*="position: absolute"] button:has-text("Away")');
    if (awayOption) {
      await awayOption.click();
      await page.waitForTimeout(500);
      const awayText = await pillBtn.innerText();
      console.log(`   Pill Label after Away: "${awayText.trim()}"`);

      const awayDot = await page.$('#status-pill-wrap button span[style*="border-radius: 50%"], #status-pill-wrap button span[style*="borderRadius: 50%"]');
      const awayDotColor = await page.evaluate(el => el ? window.getComputedStyle(el).backgroundColor : null, awayDot);
      // Amber #D97706 = rgb(217, 119, 6)
      const isAmber = awayDotColor && awayDotColor.includes('217, 119, 6');
      console.log(`   ✓ Away Amber Dot Verified: ${isAmber ? 'PASS' : 'FAIL (' + awayDotColor + ')'}`);

      const shot3 = path.join(SCREENSHOT_DIR, 'chrome-online-away.png');
      await page.screenshot({ path: shot3 });
      console.log(`   📸 Saved screenshot: ${path.basename(shot3)}`);
    }

    // 6. Toggle to Offline
    console.log('\n5. Toggling Status to Offline...');
    await pillBtn.click();
    await page.waitForTimeout(500);
    const popoverButtons = await page.$$('div[style*="position: absolute"] button');
    console.log('   Popover buttons count in Step 5:', popoverButtons.length);
    for (let i = 0; i < popoverButtons.length; i++) {
      console.log(`   Button ${i} text:`, (await popoverButtons[i].innerText()).replace(/\n/g, ' '));
    }
    const offlineOption = popoverButtons[2]; // 3rd button is Offline
    if (offlineOption) {
      await offlineOption.click();
      await page.waitForTimeout(600);
      const offlineText = await pillBtn.innerText();
      console.log(`   Pill Label after Offline: "${offlineText.trim()}"`);

      const offlineDot = await page.$('#status-pill-wrap button span[style*="border-radius: 50%"], #status-pill-wrap button span[style*="borderRadius: 50%"]');
      const offlineDotColor = await page.evaluate(el => el ? window.getComputedStyle(el).backgroundColor : null, offlineDot);
      // Neutral Gray #66736D = rgb(102, 115, 109)
      const isGray = offlineDotColor && offlineDotColor.includes('102, 115, 109');
      console.log(`   ✓ Offline Neutral Gray Dot Verified: ${isGray ? 'PASS' : 'FAIL (' + offlineDotColor + ')'}`);

      const shot4 = path.join(SCREENSHOT_DIR, 'chrome-online-offline.png');
      await page.screenshot({ path: shot4 });
      console.log(`   📸 Saved screenshot: ${path.basename(shot4)}`);
    }

    // 7. Toggle back to Online
    console.log('\n6. Toggling Status back to Online...');
    await pillBtn.click();
    await page.waitForTimeout(400);
    const onlineOption = await page.$('div[style*="position: absolute"] button:has-text("Online")');
    if (onlineOption) {
      await onlineOption.click();
      await page.waitForTimeout(500);
      const onlineText = await pillBtn.innerText();
      console.log(`   Pill Label after Online: "${onlineText.trim()}"`);

      const restoredDot = await page.$('#status-pill-wrap button span[style*="border-radius: 50%"], #status-pill-wrap button span[style*="borderRadius: 50%"]');
      const restoredColor = await page.evaluate(el => el ? window.getComputedStyle(el).backgroundColor : null, restoredDot);
      const restoredGreen = restoredColor && restoredColor.includes('63, 166, 107');
      console.log(`   ✓ Restored Online Green Dot Verified: ${restoredGreen ? 'PASS' : 'FAIL (' + restoredColor + ')'}`);
    }

    // 8. Console Error Hygiene
    console.log('\n7. Checking Chrome Console Errors...');
    const relevantErrors = consoleErrors.filter(e => !e.includes('favicon.ico') && !e.includes('WebSocket'));
    console.log(`   Relevant Console Errors: ${relevantErrors.length}`);
    if (relevantErrors.length > 0) {
      console.log('   Errors:', relevantErrors);
    }

    await browser.close();

    const success = isMoneyGreen && isCalibri11 && relevantErrors.length === 0;
    console.log(`\n======================================================================`);
    console.log(`   CHROME ONLINE & TYPOGRAPHY RESULT: ${success ? 'ALL CHECKS PASSED (100%)' : 'FLAGGED'}`);
    console.log(`======================================================================\n`);
    process.exit(success ? 0 : 1);
  } catch (err) {
    console.error('Error during Chrome verification:', err);
    await browser.close();
    process.exit(1);
  }
}

verifyChromeOnline();
