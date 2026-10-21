const { chromium } = require('playwright');
const crypto = require('crypto');

function generateAdminSessionToken() {
  const secret = process.env.SESSION_SECRET || 'smashcourt-default-session-secret-key-prod-2026';
  const payload = JSON.stringify({
    user: {
      id: 'admin-challenger',
      userId: 'admin-challenger',
      username: 'admin-challenger',
      email: 'challenger@smashcourt.vn',
      full_name: 'Adversarial Challenger',
      name: 'Adversarial Challenger',
      role: 'ADMIN',
      branch_id: 'BR_HCM_01',
    },
    userId: 'admin-challenger',
    role: 'ADMIN',
    name: 'Adversarial Challenger',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

async function launchBrowser() {
  const { chromium } = require('playwright');
  try {
    return await chromium.launch({ headless: true });
  } catch (e1) {
    try {
      return await chromium.launch({ headless: true, channel: 'chrome' });
    } catch (e2) {
      return await chromium.launch({ headless: true, channel: 'msedge' });
    }
  }
}

async function diagnose() {
  const browser = await launchBrowser();

  // DIAGNOSIS 1: StickyAnchorBar on PDP
  console.log('=== DIAGNOSING STICKY ANCHOR BAR ===');
  {
    const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
    await page.goto('http://localhost:3000/vot-cau-long/yonex-astrox-99-pro');
    await page.waitForTimeout(1000);

    const info = await page.evaluate(() => {
      const el = document.querySelector('nav[aria-label*="Điều hướng phân mục"]')?.parentElement;
      if (!el) return { error: 'StickyAnchorBar not found' };

      const computed = window.getComputedStyle(el);
      const initialRect = el.getBoundingClientRect();
      const parent = el.parentElement;
      const parentStyle = parent ? window.getComputedStyle(parent) : null;
      
      // Check all ancestors for overflow
      const ancestors = [];
      let cur = el.parentElement;
      while (cur) {
        const s = window.getComputedStyle(cur);
        ancestors.push({
          tag: cur.tagName,
          id: cur.id,
          class: cur.className ? String(cur.className).slice(0, 50) : '',
          overflow: s.overflow,
          overflowX: s.overflowX,
          overflowY: s.overflowY,
          position: s.position,
        });
        cur = cur.parentElement;
      }

      return {
        initialRect,
        computedPosition: computed.position,
        computedTop: computed.top,
        ancestors,
      };
    });
    console.log('StickyAnchorBar Diagnostic:', JSON.stringify(info, null, 2));
    await page.close();
  }

  // DIAGNOSIS 2: Secondhand buyback tab & table
  console.log('\n=== DIAGNOSING SECONDHAND BUYBACK TABLE ===');
  {
    const context = await browser.newContext({ viewport: { width: 768, height: 1024 } });
    await context.addCookies([
      {
        name: 'smash_session',
        value: generateAdminSessionToken(),
        domain: 'localhost',
        path: '/',
      },
    ]);
    const page = await context.newPage();
    await page.goto('http://localhost:3000/portal/secondhand');
    await page.waitForTimeout(1000);

    const tabs = await page.evaluate(() => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      return allButtons.map(b => ({
        text: b.textContent.trim(),
        className: b.className,
      })).filter(b => b.text.includes('giá') || b.text.includes('Bảng') || b.text.includes('QUY TẮC') || b.text.includes('GIÁ'));
    });
    console.log('Available price tabs:', tabs);

    // Let's see what tables exist on the page
    const tables = await page.evaluate(() => {
      const allTables = Array.from(document.querySelectorAll('table'));
      return allTables.map(t => ({
        className: t.className,
        minWidth: window.getComputedStyle(t).minWidth,
        parentClass: t.parentElement?.className,
        parentOverflowX: t.parentElement ? window.getComputedStyle(t.parentElement).overflowX : null,
      }));
    });
    console.log('Initial tables on page:', tables);

    // Click tab if found
    const btn = await page.$('button:has-text("Bảng giá thu mua")');
    if (btn) {
      console.log('Found button "Bảng giá thu mua", clicking...');
      await btn.click();
      await page.waitForTimeout(1000);

      const tablesAfter = await page.evaluate(() => {
        const allTables = Array.from(document.querySelectorAll('table'));
        return allTables.map(t => ({
          className: t.className,
          minWidth: window.getComputedStyle(t).minWidth,
          parentClass: t.parentElement?.className,
          parentOverflowX: t.parentElement ? window.getComputedStyle(t.parentElement).overflowX : null,
        }));
      });
      console.log('Tables after clicking tab:', tablesAfter);
    } else {
      console.log('Button "Bảng giá thu mua" NOT FOUND!');
    }
    await context.close();
  }

  // DIAGNOSIS 3: Vaul Drawer footer CTA
  console.log('\n=== DIAGNOSING VAUL DRAWER FOOTER CTA ===');
  {
    const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
    await page.goto('http://localhost:3000/vot-cau-long');
    await page.waitForTimeout(1000);

    const filterBtn = await page.$('button:has-text("Bộ lọc")');
    if (filterBtn) {
      await filterBtn.click();
      await page.waitForTimeout(800);

      const buttons = await page.evaluate(() => {
        const content = document.querySelector('[vaul-drawer]') || document.querySelector('.max-h-\\[85dvh\\]');
        if (!content) return { error: 'Drawer content not found' };

        const allButtons = Array.from(content.querySelectorAll('button'));
        return allButtons.map(b => ({
          text: b.textContent.trim().slice(0, 40),
          className: b.className,
          rect: b.getBoundingClientRect(),
          computedHeight: window.getComputedStyle(b).height,
        }));
      });
      console.log('Drawer buttons:', JSON.stringify(buttons, null, 2));
    }
    await page.close();
  }

  await browser.close();
}

diagnose().catch(console.error);
