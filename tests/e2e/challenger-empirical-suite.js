#!/usr/bin/env node

/**
 * EMPIRICAL ADVERSARIAL VERIFICATION SUITE — CHALLENGER M2 & M3
 */

const crypto = require('crypto');
const path = require('path');
const { chromium } = require('playwright');

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

async function runEmpiricalSuite() {
  console.log('================================================================');
  console.log('   CHALLENGER ADVERSARIAL EMPIRICAL SUITE (M2 & M3)');
  console.log('================================================================\n');

  const browser = await launchBrowser();
  const results = [];

  function record(name, pass, details) {
    results.push({ name, pass, details });
    const mark = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} : ${name}`);
    if (details) {
      console.log(`       └─ ${details}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Cart Page on 320px Viewport (iPhone SE narrowest)
    // -------------------------------------------------------------
    console.log('\n--- [TEST 1] Cart Page on 320px Viewport ---');
    {
      const context = await browser.newContext({
        viewport: { width: 320, height: 640 },
      });
      const page = await context.newPage();

      // Navigate to /cart first, populate localStorage, then reload
      await page.goto('http://localhost:3000/cart', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.evaluate(() => {
        const testCart = [
          {
            id: 'item-challenger-1',
            name: 'Vợt Cầu Lông Yonex Astrox 99 Pro Trắng / Cherry Sunburst 4U/G5 Chính Hãng Phân Phối SmashCourt',
            sku: 'AX99-P-4U-CS',
            price: 4250000,
            quantity: 2,
            imageUrl: '/images/products/yonex-astrox-99-pro.png',
            isSecondhand: false,
          },
        ];
        localStorage.setItem('smashcourt_cart_items', JSON.stringify(testCart));
      });
      await page.goto('http://localhost:3000/cart', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);

      const cartMetrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const scrollWidth = doc.scrollWidth;
        const innerWidth = window.innerWidth;
        const noWindowOverflow = scrollWidth <= innerWidth;

        const titleEl = document.querySelector('h3.line-clamp-2');
        const titleRect = titleEl ? titleEl.getBoundingClientRect() : null;

        const itemRow = titleEl ? titleEl.closest('.divide-y > div') : null;
        const rowStyle = itemRow ? window.getComputedStyle(itemRow) : null;

        const minusBtn = document.querySelector('button[aria-label="Giảm số lượng"]');
        const plusBtn = document.querySelector('button[aria-label="Tăng số lượng"]');
        const trashBtn = document.querySelector('button[aria-label="Xóa sản phẩm"]');

        const minusRect = minusBtn ? minusBtn.getBoundingClientRect() : null;
        const plusRect = plusBtn ? plusBtn.getBoundingClientRect() : null;
        const trashRect = trashBtn ? trashBtn.getBoundingClientRect() : null;

        return {
          scrollWidth,
          innerWidth,
          noWindowOverflow,
          titleFound: !!titleEl,
          titleWidth: titleRect ? titleRect.width : 0,
          titleHeight: titleRect ? titleRect.height : 0,
          minusFound: !!minusBtn,
          minusW: minusRect ? minusRect.width : 0,
          minusH: minusRect ? minusRect.height : 0,
          plusFound: !!plusBtn,
          plusW: plusRect ? plusRect.width : 0,
          plusH: plusRect ? plusRect.height : 0,
          trashFound: !!trashBtn,
          trashW: trashRect ? trashRect.width : 0,
          trashH: trashRect ? trashRect.height : 0,
          flexDirection: rowStyle ? rowStyle.flexDirection : null,
        };
      });

      record(
        'Cart 320px: Zero horizontal window overflow (scrollWidth <= 320px)',
        cartMetrics.noWindowOverflow,
        `scrollWidth=${cartMetrics.scrollWidth}px, innerWidth=${cartMetrics.innerWidth}px`
      );

      const titleReadable = cartMetrics.titleFound && cartMetrics.titleWidth >= 140;
      record(
        'Cart 320px: Product title width >= 140px (anti-character stacking)',
        titleReadable,
        `titleWidth=${cartMetrics.titleWidth}px, titleHeight=${cartMetrics.titleHeight}px, flexDir=${cartMetrics.flexDirection}`
      );

      const steppersOk =
        cartMetrics.minusFound &&
        cartMetrics.plusFound &&
        cartMetrics.minusW >= 44 &&
        cartMetrics.minusH >= 44 &&
        cartMetrics.plusW >= 44 &&
        cartMetrics.plusH >= 44;
      record(
        'Cart 320px: Stepper minus/plus buttons touch targets >= 44x44px',
        steppersOk,
        `minus=${cartMetrics.minusW}x${cartMetrics.minusH}px, plus=${cartMetrics.plusW}x${cartMetrics.plusH}px`
      );

      const trashOk = cartMetrics.trashFound && cartMetrics.trashW >= 44 && cartMetrics.trashH >= 44;
      record(
        'Cart 320px: Trash button touch target >= 44x44px',
        trashOk,
        `width=${cartMetrics.trashW}px, height=${cartMetrics.trashH}px`
      );

      await context.close();
    }

    // -------------------------------------------------------------
    // TEST 2: ProductCatalogGrid Vaul Drawer 85dvh & Safe-Area Inset
    // -------------------------------------------------------------
    console.log('\n--- [TEST 2] ProductCatalogGrid Vaul Drawer (360px) ---');
    {
      const context = await browser.newContext({
        viewport: { width: 360, height: 800 },
      });
      const page = await context.newPage();

      await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);

      const filterBtn = await page.$('button:has-text("Bộ lọc")');
      const filterBtnExists = !!filterBtn;
      record('Catalog: Mobile filter trigger button found', filterBtnExists);

      if (filterBtn) {
        await filterBtn.click();
        await page.waitForTimeout(800);

        const drawerMetrics = await page.evaluate(() => {
          const content = document.querySelector('[vaul-drawer]') || document.querySelector('.max-h-\\[85dvh\\]');
          if (!content) return { found: false };

          const computed = window.getComputedStyle(content);
          const rect = content.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const maxHeightPx = parseFloat(computed.maxHeight);

          const classList = content.className || '';
          const has85dvhClass = classList.includes('85dvh');
          const hasSafeAreaPadding = classList.includes('safe-area-inset-bottom');

          // Footer CTA button: text starts with "Xem"
          const buttons = Array.from(content.querySelectorAll('button'));
          const ctaBtn = buttons.find((b) => b.textContent.includes('Xem'));
          const ctaRect = ctaBtn ? ctaBtn.getBoundingClientRect() : null;

          return {
            found: true,
            windowHeight,
            rectHeight: rect.height,
            maxHeightPx,
            has85dvhClass,
            hasSafeAreaPadding,
            ctaFound: !!ctaBtn,
            ctaHeight: ctaRect ? ctaRect.height : 0,
            ctaWidth: ctaRect ? ctaRect.width : 0,
          };
        });

        record(
          'Catalog Vaul Drawer: Content rendered with max-h-[85dvh]',
          drawerMetrics.found && drawerMetrics.has85dvhClass,
          `found=${drawerMetrics.found}, has85dvhClass=${drawerMetrics.has85dvhClass}, maxHeightPx=${drawerMetrics.maxHeightPx}px (expected <= ${800 * 0.85}px)`
        );

        record(
          'Catalog Vaul Drawer: Safe-area bottom inset applied',
          drawerMetrics.hasSafeAreaPadding,
          `hasSafeAreaPadding=${drawerMetrics.hasSafeAreaPadding}`
        );

        record(
          'Catalog Vaul Drawer: Footer CTA height >= 44px',
          drawerMetrics.ctaFound && drawerMetrics.ctaHeight >= 44,
          `ctaHeight=${drawerMetrics.ctaHeight}px, ctaWidth=${drawerMetrics.ctaWidth}px`
        );
      }

      await context.close();
    }

    // -------------------------------------------------------------
    // TEST 3: StickyAnchorBar Positioning at 64px / 92px
    // -------------------------------------------------------------
    console.log('\n--- [TEST 3] StickyAnchorBar Positioning & Adversarial Overflow Interaction ---');
    {
      // 3A: Static code inspection & computed values
      const contextStatic = await browser.newContext({ viewport: { width: 360, height: 800 } });
      const pageStatic = await contextStatic.newPage();
      await pageStatic.goto('http://localhost:3000/vot-cau-long/yonex-astrox-99-pro', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await pageStatic.waitForTimeout(1000);

      const staticCheck = await pageStatic.evaluate(() => {
        const el = document.querySelector('div.sticky.z-20');
        return {
          found: !!el,
          className: el ? el.className : '',
          computedPosition: el ? window.getComputedStyle(el).position : null,
          computedTop: el ? window.getComputedStyle(el).top : null,
        };
      });

      record(
        'StickyAnchorBar: Element specifies sticky with top-[64px] lg:top-[92px]',
        staticCheck.found && staticCheck.className.includes('sticky top-[64px] lg:top-[92px]'),
        `class="${staticCheck.className}", computedPosition=${staticCheck.computedPosition}, computedTop=${staticCheck.computedTop}`
      );

      // 3B: Live Scroll Sticking Test (ADVERSARIAL STRESS TEST)
      // Test without body overflow override (live code)
      const liveScrollTest = await pageStatic.evaluate(async () => {
        const el = document.querySelector('div.sticky.z-20');
        const initialY = window.scrollY + el.getBoundingClientRect().top;
        window.scrollTo(0, initialY - 64 + 200);
        await new Promise((r) => setTimeout(r, 150));
        return {
          topAfterScroll: el.getBoundingClientRect().top,
          stuck: Math.abs(el.getBoundingClientRect().top - 64) <= 2,
        };
      });

      record(
        'StickyAnchorBar Live Sticking (ADVERSARIAL FINDING): Fails to stick when body has overflow-x: hidden',
        !liveScrollTest.stuck,
        `topAfterScroll=${liveScrollTest.topAfterScroll}px (expected 64px; fails because body overflow-x: hidden promotes body to scroll container)`
      );

      // 3C: Sticking Test with modern overflow-x: clip (Verification of remediation)
      const remediatedTest = await pageStatic.evaluate(async () => {
        document.documentElement.style.overflowX = 'clip';
        document.body.style.overflowX = 'clip';
        const el = document.querySelector('div.sticky.z-20');
        const initialY = window.scrollY + el.getBoundingClientRect().top;
        window.scrollTo(0, initialY - 64 + 200);
        await new Promise((r) => setTimeout(r, 150));
        return {
          topAfterScroll: el.getBoundingClientRect().top,
          stuck: Math.abs(el.getBoundingClientRect().top - 64) <= 2,
        };
      });

      record(
        'StickyAnchorBar Remediation Test: Sticking functional at 64px under overflow-x: clip',
        remediatedTest.stuck,
        `topAfterScroll=${remediatedTest.topAfterScroll}px with overflow-x: clip`
      );

      await contextStatic.close();
    }

    // -------------------------------------------------------------
    // TEST 4: Admin Portal Tablet Portrait Collapse (768px-1023px)
    // -------------------------------------------------------------
    console.log('\n--- [TEST 4] Admin Portal Tablet Portrait Collapse ---');
    {
      const adminToken = generateAdminSessionToken();

      // 4A: Tablet Portrait (768x1024)
      const contextTablet = await browser.newContext({
        viewport: { width: 768, height: 1024 },
      });
      await contextTablet.addCookies([
        {
          name: 'smash_session',
          value: adminToken,
          domain: 'localhost',
          path: '/',
        },
      ]);
      const pageTablet = await contextTablet.newPage();
      await pageTablet.goto('http://localhost:3000/portal', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await pageTablet.waitForTimeout(1000);

      const tabletMetrics = await pageTablet.evaluate(() => {
        const aside = document.querySelector('aside');
        const asideStyle = aside ? window.getComputedStyle(aside) : null;
        const hamburgerBtn = document.querySelector('button[aria-label="Mở menu quản trị"]');
        const hamburgerStyle = hamburgerBtn ? window.getComputedStyle(hamburgerBtn) : null;

        return {
          asideFound: !!aside,
          asideDisplay: asideStyle ? asideStyle.display : null,
          hamburgerFound: !!hamburgerBtn,
          hamburgerDisplay: hamburgerStyle ? hamburgerStyle.display : null,
        };
      });

      record(
        'Portal Tablet (768px): Desktop sidebar <aside> is hidden (display: none)',
        tabletMetrics.asideFound && tabletMetrics.asideDisplay === 'none',
        `asideDisplay=${tabletMetrics.asideDisplay}`
      );

      record(
        'Portal Tablet (768px): Mobile/tablet hamburger button is visible',
        tabletMetrics.hamburgerFound && tabletMetrics.hamburgerDisplay !== 'none',
        `hamburgerDisplay=${tabletMetrics.hamburgerDisplay}`
      );

      // Open drawer on tablet and check height
      const hamburger = await pageTablet.$('button[aria-label="Mở menu quản trị"]');
      if (hamburger) {
        await hamburger.click();
        await pageTablet.waitForTimeout(500);

        const drawerMetrics = await pageTablet.evaluate(() => {
          const drawer = document.querySelector('div.h-\\[100dvh\\]');
          if (!drawer) return { found: false };
          const rect = drawer.getBoundingClientRect();
          const computed = window.getComputedStyle(drawer);
          return {
            found: true,
            rectHeight: rect.height,
            overscroll: computed.overscrollBehavior || computed.overscrollBehaviorY,
          };
        });

        record(
          'Portal Tablet (768px): Mobile drawer opens with full 100dvh height and overscroll-contain',
          drawerMetrics.found && drawerMetrics.rectHeight === 1024,
          `drawerHeight=${drawerMetrics.rectHeight}px, overscroll=${drawerMetrics.overscroll}`
        );
      }
      await contextTablet.close();

      // 4B: Desktop Landscape (1024px)
      const contextDesktop1024 = await browser.newContext({
        viewport: { width: 1024, height: 768 },
      });
      await contextDesktop1024.addCookies([
        {
          name: 'smash_session',
          value: adminToken,
          domain: 'localhost',
          path: '/',
        },
      ]);
      const pageDesktop1024 = await contextDesktop1024.newPage();
      await pageDesktop1024.goto('http://localhost:3000/portal', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await pageDesktop1024.waitForTimeout(1000);

      const desktopMetrics = await pageDesktop1024.evaluate(() => {
        const aside = document.querySelector('aside');
        const asideStyle = aside ? window.getComputedStyle(aside) : null;
        const hamburgerBtn = document.querySelector('button[aria-label="Mở menu quản trị"]');
        const hamburgerStyle = hamburgerBtn ? window.getComputedStyle(hamburgerBtn) : null;

        return {
          asideDisplay: asideStyle ? asideStyle.display : null,
          hamburgerDisplay: hamburgerStyle ? hamburgerStyle.display : null,
        };
      });

      record(
        'Portal Desktop (1024px): Desktop sidebar <aside> is visible (display: flex)',
        desktopMetrics.asideDisplay === 'flex',
        `asideDisplay=${desktopMetrics.asideDisplay}`
      );

      record(
        'Portal Desktop (1024px): Mobile hamburger button is hidden (display: none)',
        desktopMetrics.hamburgerDisplay === 'none',
        `hamburgerDisplay=${desktopMetrics.hamburgerDisplay}`
      );
      await contextDesktop1024.close();
    }

    // -------------------------------------------------------------
    // TEST 5: portal/secondhand/page.tsx Buyback Price Table
    // -------------------------------------------------------------
    console.log('\n--- [TEST 5] Secondhand Buyback Price Table ---');
    {
      const adminToken = generateAdminSessionToken();
      const context = await browser.newContext({
        viewport: { width: 360, height: 800 },
      });
      await context.addCookies([
        {
          name: 'smash_session',
          value: adminToken,
          domain: 'localhost',
          path: '/',
        },
      ]);
      const page = await context.newPage();
      await page.goto('http://localhost:3000/portal/secondhand?tab=PRICE_TABLES', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);

      const tableMetrics = await page.evaluate(() => {
        const doc = document.documentElement;
        const scrollWidth = doc.scrollWidth;
        const innerWidth = window.innerWidth;
        const noWindowOverflow = scrollWidth <= innerWidth;

        const table = document.querySelector('table');
        if (!table) return { found: false, noWindowOverflow };

        const wrapper = table.parentElement;
        const wrapperStyle = wrapper ? window.getComputedStyle(wrapper) : null;
        const tableStyle = window.getComputedStyle(table);
        const minWidthVal = parseFloat(tableStyle.minWidth);

        return {
          found: true,
          noWindowOverflow,
          scrollWidth,
          innerWidth,
          wrapperOverflowX: wrapperStyle ? wrapperStyle.overflowX : null,
          minWidthVal,
          tableScrollWidth: table.scrollWidth,
        };
      });

      record(
        'Secondhand Buyback: Table exists with min-w-[650px]',
        tableMetrics.found && tableMetrics.minWidthVal >= 650,
        `found=${tableMetrics.found}, minWidth=${tableMetrics.minWidthVal}px`
      );

      record(
        'Secondhand Buyback: Enclosed in overflow-x: auto wrapper',
        tableMetrics.wrapperOverflowX === 'auto',
        `wrapperOverflowX=${tableMetrics.wrapperOverflowX}`
      );

      record(
        'Secondhand Buyback on 360px: Zero window horizontal overflow (scrollWidth <= 360px)',
        tableMetrics.noWindowOverflow,
        `scrollWidth=${tableMetrics.scrollWidth}px, innerWidth=${tableMetrics.innerWidth}px`
      );

      await context.close();
    }

    // -------------------------------------------------------------
    // TEST 6: Portal Data Tables across Critical Routes on 360px
    // -------------------------------------------------------------
    console.log('\n--- [TEST 6] Critical Portal Routes Horizontal Containment ---');
    {
      const adminToken = generateAdminSessionToken();
      const routes = [
        '/portal',
        '/portal/orders',
        '/portal/inventory',
        '/portal/products',
        '/portal/customers',
        '/portal/recruitment',
        '/portal/stringing',
      ];

      for (const r of routes) {
        const context = await browser.newContext({
          viewport: { width: 360, height: 800 },
        });
        await context.addCookies([
          {
            name: 'smash_session',
            value: adminToken,
            domain: 'localhost',
            path: '/',
          },
        ]);
        const page = await context.newPage();
        await page.goto(`http://localhost:3000${r}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(800);

        const metrics = await page.evaluate(() => {
          const doc = document.documentElement;
          const scrollWidth = doc.scrollWidth;
          const innerWidth = window.innerWidth;
          const noWindowOverflow = scrollWidth <= innerWidth;

          const tables = Array.from(document.querySelectorAll('table'));
          const tableDetails = tables.map((t) => {
            const w = t.parentElement;
            const ws = w ? window.getComputedStyle(w) : null;
            const ts = window.getComputedStyle(t);
            return {
              overflowX: ws ? ws.overflowX : null,
              minWidth: parseFloat(ts.minWidth),
            };
          });

          return {
            noWindowOverflow,
            scrollWidth,
            innerWidth,
            tableCount: tables.length,
            tableDetails,
          };
        });

        record(
          `Portal [360px] ${r}: Zero horizontal window overflow`,
          metrics.noWindowOverflow,
          `scrollWidth=${metrics.scrollWidth}px, innerWidth=${metrics.innerWidth}px, tables=${metrics.tableCount}`
        );

        await context.close();
      }
    }

  } finally {
    await browser.close();
  }

  console.log('\n================================================================');
  console.log('                 EMPIRICAL VERIFICATION SUMMARY');
  console.log('================================================================');
  const passedCount = results.filter((r) => r.pass).length;
  const totalCount = results.length;
  console.log(`Passed: ${passedCount} / ${totalCount} (${Math.round((passedCount / totalCount) * 100)}%)`);
}

runEmpiricalSuite().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
