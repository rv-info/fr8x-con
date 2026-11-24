import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function run() {
  console.log('========================================================================');
  console.log('  GLOBAL 3D GLASSMORPHISM BUTTON, TAB & UI VERIFICATION SUITE');
  console.log('========================================================================\n');

  const browser = await chromium.launch({ headless: true });
  const localScreenshotDir = path.join(process.cwd(), 'public', 'test-screenshots');
  const artifactDir = 'C:\\Users\\RajatKumarRai\\.gemini\\antigravity\\brain\\049a7b0d-9d06-42f1-bd9e-7ea837be749c';

  if (!fs.existsSync(localScreenshotDir)) {
    fs.mkdirSync(localScreenshotDir, { recursive: true });
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

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✓ [PASS] ${message}`);
    } else {
      console.error(`  ✗ [FAIL] ${message}`);
    }
  }

  for (const vp of viewports) {
    console.log(`\n▶ [Testing Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height})]`);
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
      window.localStorage.setItem('fr8x_user', JSON.stringify(mockProfile));
      window.localStorage.setItem('fr8x_current_user', JSON.stringify(mockProfile));
      window.localStorage.setItem('fr8x_profile_cache', JSON.stringify(mockProfile));
      window.localStorage.setItem('fr8x_session_active', 'true');
      window.localStorage.setItem('fr8x_auth_timestamp', now);
      window.localStorage.setItem('fr8x_auth_sync', now);
    });

    const page = await context.newPage();

    // 1. Navigate to /feeds
    console.log(`  Navigating to http://localhost:3000/feeds...`);
    await page.goto('http://localhost:3000/feeds', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // 2. Check CSS Variables & Glass Tokens
    const glassTokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        primary: style.getPropertyValue('--glass-primary').trim(),
        secondary: style.getPropertyValue('--glass-secondary').trim(),
        border: style.getPropertyValue('--glass-border').trim(),
        highlight: style.getPropertyValue('--glass-highlight').trim(),
        shadow: style.getPropertyValue('--glass-shadow').trim(),
      };
    });
    assert(glassTokens.primary.includes('linear-gradient'), 'Root CSS token --glass-primary defines 3D glass gradient');
    assert(glassTokens.secondary.includes('linear-gradient'), 'Root CSS token --glass-secondary defines 3D glass gradient');
    assert(glassTokens.highlight.includes('inset'), 'Root CSS token --glass-highlight defines top-edge inset reflection');

    // 3. Check Primary Button Styles (e.g. Post Update or Save button)
    const primaryBtnProps = await page.evaluate(() => {
      const btn = document.querySelector('.btn.primary, button.primary-btn, button[type="submit"]') as HTMLElement;
      if (!btn) return null;
      const s = window.getComputedStyle(btn);
      return {
        background: s.backgroundImage || s.background,
        boxShadow: s.boxShadow,
        borderRadius: s.borderRadius,
        color: s.color,
      };
    });
    if (primaryBtnProps) {
      assert(primaryBtnProps.background.includes('gradient'), 'Primary button displays 3D glass gradient');
      assert(primaryBtnProps.boxShadow.includes('inset'), 'Primary button has top-edge inset 3D reflection highlight');
    }

    // 4. Check Tabs & Segmented Control Styling
    const tabProps = await page.evaluate(() => {
      const activeTab = document.querySelector('.tab.active, .tabs button.active, .feed-tab-btn.active') as HTMLElement;
      const tabContainer = document.querySelector('.tabs, .tab-bar, .feed-tabs-container') as HTMLElement;
      return {
        activeTabBg: activeTab ? window.getComputedStyle(activeTab).backgroundImage : '',
        activeTabShadow: activeTab ? window.getComputedStyle(activeTab).boxShadow : '',
        containerBg: tabContainer ? window.getComputedStyle(tabContainer).backgroundColor : '',
      };
    });
    if (tabProps.activeTabBg) {
      assert(tabProps.activeTabBg.includes('gradient'), 'Active tab uses Raven Teal 3D glass gradient');
      assert(tabProps.activeTabShadow.includes('inset'), 'Active tab features 3D depth inset shadow');
    }

    // 5. Test Quick Shortcuts if on Desktop
    if (vp.name === 'desktop') {
      const shortcutProps = await page.evaluate(() => {
        const item = document.querySelector('.feed-shortcut-link') as HTMLElement;
        if (!item) return null;
        const s = window.getComputedStyle(item);
        return {
          background: s.backgroundImage || s.background,
          boxShadow: s.boxShadow,
          borderRadius: s.borderRadius,
        };
      });
      if (shortcutProps) {
        assert(shortcutProps.background.includes('gradient'), 'Quick Shortcuts tiles feature 3D glass gradient');
        assert(shortcutProps.boxShadow.includes('inset'), 'Quick Shortcuts tiles have top-edge inset highlight');
      }
    }

    // 6. Test Header Controls: Currency Converter Header spacing
    const currencyBtn = page.locator('.currency-select, button:has-text("INR"), button:has-text("USD")').first();
    if (await currencyBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await currencyBtn.click();
      await page.waitForTimeout(600);

      const convHeadLayout = await page.evaluate(() => {
        const modal = document.querySelector('.currency-converter-modal');
        if (!modal) return null;
        const head = modal.querySelector('.conv-head') as HTMLElement;
        const title = head?.querySelector('b') as HTMLElement;
        const closeBtn = head?.querySelector('.close-red-box') as HTMLElement;
        if (!head || !title || !closeBtn) return null;

        const headStyle = window.getComputedStyle(head);
        const titleRect = title.getBoundingClientRect();
        const closeRect = closeBtn.getBoundingClientRect();

        const overlaps = titleRect.right > closeRect.left;
        return {
          display: headStyle.display,
          justifyContent: headStyle.justifyContent,
          overlaps,
          gap: closeRect.left - titleRect.right,
        };
      });

      if (convHeadLayout) {
        assert(convHeadLayout.display === 'flex', 'Currency Converter header (.conv-head) uses flex layout');
        assert(!convHeadLayout.overlaps, 'Currency Converter title and Close button have zero overlap');
      }

      // Close currency modal
      const closeConvBtn = page.locator('.currency-converter-modal .close-red-box').first();
      if (await closeConvBtn.isVisible()) {
        await closeConvBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // 7. Test User Plan Badge in Profile Dropdown
    const userMenuBtn = page.locator('.user-top-btn').first();
    if (await userMenuBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await userMenuBtn.click();
      await page.waitForTimeout(600);

      const badgeProps = await page.evaluate(() => {
        const badge = document.querySelector('.user-plan-badge') as HTMLElement;
        if (!badge) return null;
        const s = window.getComputedStyle(badge);
        return {
          text: badge.textContent?.trim(),
          color: s.color,
          bg: s.backgroundColor,
          border: s.borderColor,
        };
      });

      if (badgeProps) {
        assert(badgeProps.text === 'ENTERPRISE PLAN', `User plan badge renders correct text: "${badgeProps.text}"`);
        assert(badgeProps.color === 'rgb(7, 91, 91)', 'User plan badge text is visible brand Raven Teal');
      }

      // Save screenshot of profile dropdown
      const profileShot = path.join(localScreenshotDir, `glass-profile-${vp.name}.png`);
      await page.screenshot({ path: profileShot });
      fs.copyFileSync(profileShot, path.join(artifactDir, `glass-profile-${vp.name}.png`));

      // Close menu
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }

    // 8. Capture Full Page Viewport Screenshot
    const mainShot = path.join(localScreenshotDir, `glass-surface-${vp.name}.png`);
    await page.screenshot({ path: mainShot });
    fs.copyFileSync(mainShot, path.join(artifactDir, `glass-surface-${vp.name}.png`));
    console.log(`  ✓ Saved screenshot for ${vp.name}: glass-surface-${vp.name}.png`);

    await context.close();
  }

  await browser.close();

  console.log('\n========================================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('========================================================================\n');

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error during 3D glassmorphism verification:', err);
  process.exit(1);
});
