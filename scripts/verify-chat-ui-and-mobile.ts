import assert from 'node:assert';
import { chromium } from 'playwright';

async function seedAuth(context: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>['newContext']>>) {
  const nowMs = Date.now();
  const payloadB64 = Buffer.from(
    JSON.stringify({
      uid: '00000000-0000-0000-0000-000000000001',
      email: 'audit.director@fr8x.in',
      issuedAt: nowMs,
      expiresAt: nowMs + 86400000,
    })
  ).toString('base64url');

  await context.addCookies([
    {
      name: 'fr8x_session',
      value: `${payloadB64}.mockvalidsignature`,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    },
  ]);

  await context.addInitScript(() => {
    localStorage.setItem(
      'fr8x_cached_user_profile',
      JSON.stringify({
        uid: '00000000-0000-0000-0000-000000000001',
        id: '00000000-0000-0000-0000-000000000001',
        email: 'audit.director@fr8x.in',
        displayName: 'Captain Vikram Singh',
        company: 'Adani Logistics Ltd',
        designation: 'Head of Ocean Freight',
        plan: 'enterprise',
        verified: true,
        status: 'active',
        role: 'user',
      })
    );
    localStorage.setItem(
      'fr8x_chat_contacts',
      JSON.stringify([
        { id: 'peer-1', name: 'Aarav Mehta', role: 'Pricing Lead', company: 'BlueWave Freight', online: true, presenceStatus: 'active', unreadCount: 1 },
        { id: 'peer-2', name: 'Neha Kapoor', role: 'Ops Manager', company: 'PortLink India', online: false, presenceStatus: 'away', unreadCount: 0 },
        { id: 'peer-3', name: 'Rohan Nair', role: 'Chartering', company: 'Oceanic Lines', online: true, presenceStatus: 'active', unreadCount: 0 },
        { id: 'peer-4', name: 'Sonia Verma', role: 'Customs Head', company: 'GlobalCargo', online: true, presenceStatus: 'idle', unreadCount: 2 },
      ])
    );
  });
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // 1. Desktop (1440x900): launcher, 4 simultaneous windows, minimize/maximize/close
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await seedAuth(ctx);
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);

    await page.getByRole('button', { name: 'Open Nexus' }).click();
    await page.locator('.chatlauncherpanel').waitFor({ state: 'visible', timeout: 5000 });

    const contactRows = page.locator('.chatlauncherpanel .chatcontact');
    assert((await contactRows.count()) >= 4, 'Expected 4 seeded contacts in launcher');
    for (let i = 0; i < 4; i++) {
      await contactRows.nth(i).click();
    }
    assert.strictEqual(await page.locator('.singlechatwindow').count(), 4, 'Expected 4 simultaneous chat windows on desktop');

    // Maximize, minimize, close
    await page.locator('.singlechatwindow').first().getByTitle('Maximize window').click();
    assert((await page.locator('.singlechatwindow.maximized').count()) === 1, 'Maximize toggles .maximized');
    await page.locator('.singlechatwindow').first().getByTitle('Minimize chat').click();
    assert((await page.locator('.minichattab').count()) === 1, 'Minimize renders .minichattab');
    await page.locator('.minichattab').first().click();
    assert.strictEqual(await page.locator('.singlechatwindow').count(), 4, 'Restored window back to 4 open windows');
    await page.locator('.singlechatwindow').first().getByTitle('Close chat').click();
    assert.strictEqual(await page.locator('.singlechatwindow').count(), 3, 'Close reduces open windows to 3');
    console.log('✓ Desktop floating chat UI (launcher, 4 simultaneous windows, maximize/minimize/close) passed');
    await ctx.close();
  }

  // 2. Mobile (390x844, 375x812, 360x800): 100dvh sheet, 16px composer, >=44px touch targets, 0 overflow
  for (const vp of [
    { width: 390, height: 844 },
    { width: 375, height: 812 },
    { width: 360, height: 800 },
  ]) {
    const ctx = await browser.newContext({ viewport: vp });
    await seedAuth(ctx);
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);

    await page.getByRole('button', { name: 'Open Nexus' }).click();
    await page.locator('.chatlauncherpanel').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.chatlauncherpanel .chatcontact').first().click();
    await page.locator('.singlechatwindow').last().waitFor({ state: 'visible', timeout: 5000 });

    const metrics = await page.evaluate(() => {
      const win = document.querySelector('.singlechatwindow') as HTMLElement | null;
      const ta = win?.querySelector('.compose textarea') as HTMLElement | null;
      const sendBtn = win?.querySelector('.sendbtn') as HTMLElement | null;
      const closeBtn = win?.querySelector('.close-red-box') as HTMLElement | null;
      return {
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        winH: win ? Math.round(win.getBoundingClientRect().height) : 0,
        vh: window.innerHeight,
        taFontSize: ta ? parseFloat(getComputedStyle(ta).fontSize) : 0,
        sendW: sendBtn ? Math.round(sendBtn.getBoundingClientRect().width) : 0,
        sendH: sendBtn ? Math.round(sendBtn.getBoundingClientRect().height) : 0,
        closeW: closeBtn ? Math.round(closeBtn.getBoundingClientRect().width) : 0,
        closeH: closeBtn ? Math.round(closeBtn.getBoundingClientRect().height) : 0,
      };
    });

    assert.strictEqual(metrics.overflow, 0, `Mobile ${vp.width}x${vp.height} overflow=${metrics.overflow}`);
    assert(metrics.winH >= vp.height - 2, `Mobile chat sheet expected ~${vp.height}px, got ${metrics.winH}px`);
    assert(metrics.taFontSize >= 16, `Composer textarea fontSize expected >=16px, got ${metrics.taFontSize}`);
    assert(metrics.sendW >= 44 && metrics.sendH >= 44, `Send button expected >=44x44, got ${metrics.sendW}x${metrics.sendH}`);
    assert(metrics.closeW >= 44 && metrics.closeH >= 44, `Close button expected >=44x44, got ${metrics.closeW}x${metrics.closeH}`);
    console.log(`✓ Mobile ${vp.width}x${vp.height} chat sheet passed (height=${metrics.winH}px, composer=${metrics.taFontSize}px, send=${metrics.sendW}x${metrics.sendH})`);
    await ctx.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
