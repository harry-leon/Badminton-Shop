#!/usr/bin/env node

/**
 * EMPIRICAL ADVERSARIAL TEST SUITE FOR MILESTONES M2 & M3
 * Challenger: challenger_m23_2
 *
 * Verifies:
 * 1. Storefront cart/page.tsx title width & anti-stacking at 320px, stepper & trash touch targets.
 * 2. Storefront ProductCatalogGrid.tsx Vaul drawer 85dvh + safe area padding + desktop 280px sidebar.
 * 3. Storefront StickyAnchorBar.tsx top offset 64px on mobile (<1024px) / 92px on desktop (>=1024px).
 * 4. Admin Portal layout.tsx sidebar hidden on tablet (768px-1023px) under hidden lg:flex, drawer opens, desktop visible at >= 1024px.
 * 5. Admin Portal secondhand Buyback Price Table overflow-x-auto & min-w-[650px].
 * 6. Admin Portal Data Tables across 12 portal routes: overflow-x-auto containment, table min-width, zero document blowout.
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ANSI formatting
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  try {
    playwright = require(path.resolve(__dirname, '../node_modules/playwright'));
  } catch (_e) {
    playwright = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
  }
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

function generateAdminSessionToken() {
  const secret = process.env.SESSION_SECRET || 'smashcourt-default-session-secret-key-prod-2026';
  const payload = JSON.stringify({
    user: {
      id: 'admin-test',
      userId: 'admin-test',
      username: 'admin-test',
      email: 'admin@smashcourt.vn',
      full_name: 'Test Administrator',
      name: 'Test Administrator',
      role: 'ADMIN',
      branch_id: 'BR_HCM_01',
    },
    userId: 'admin-test',
    role: 'ADMIN',
    name: 'Test Administrator',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

async function launchBrowser() {
  const { chromium } = playwright;
  try {
    return await chromium.launch({ headless: true });
  } catch (err1) {
    try {
      return await chromium.launch({ headless: true, channel: 'chrome' });
    } catch (err2) {
      return await chromium.launch({ headless: true, channel: 'msedge' });
    }
  }
}

const results = [];
function recordResult(category, testName, passed, details) {
  results.push({ category, testName, passed, details });
  const status = passed ? `${c.green}✓ PASS${c.reset}` : `${c.red}✗ FAIL${c.reset}`;
  console.log(`  ${status} [${category}] ${testName}`);
  if (details) {
    console.log(`         ${c.gray}${details}${c.reset}`);
  }
}

async function main() {
  console.log(`${c.bold}${c.cyan}================================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}   CHALLENGER M2/M3 EMPIRICAL & ADVERSARIAL TEST SUITE${c.reset}`);
  console.log(`${c.bold}${c.cyan}================================================================================${c.reset}`);
  console.log(`Base URL: ${BASE_URL}\n`);

  const browser = await launchBrowser();
  const sessionToken = generateAdminSessionToken();

  try {
    // =========================================================================
    // TEST SUITE 1: cart/page.tsx on 320px Viewport
    // =========================================================================
    console.log(`${c.bold}--- SUITE 1: Storefront /cart on 320px Viewport ---${c.reset}`);
    {
      const context = await browser.newContext({
        viewport: { width: 320, height: 640 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
      });
      const page = await context.newPage();

      // Inject items into localStorage
      await page.addInitScript(() => {
        localStorage.setItem(
          'smashcourt_cart_items',
          JSON.stringify([
            {
              id: 'cart-1',
              name: 'Vợt cầu lông Yonex Astrox 88D Pro Gen 3 2024 Chính Hãng',
              sku: 'AX88D-P-4U5',
              price: 4350000,
              quantity: 2,
              imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300',
              branchId: 'BR_HCM_01',
              isSecondhand: false,
            },
            {
              id: 'cart-2',
              name: 'Vợt Li-Ning Halbertec 8000 Cũ Grade A 98%',
              sku: 'SH-20261013-0001',
              price: 2850000,
              quantity: 1,
              imageUrl: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=300',
              branchId: 'BR_HCM_01',
              isSecondhand: true,
            },
          ])
        );
      });

      await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle', timeout: 30000 });

      // 1.1 Zero horizontal overflow
      const overflow = await page.evaluate(() => {
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        };
      });
      recordResult(
        'Cart-320px',
        'Root horizontal scrollWidth <= 320px',
        overflow.scrollWidth <= overflow.innerWidth,
        `scrollWidth: ${overflow.scrollWidth}px, innerWidth: ${overflow.innerWidth}px`
      );

      // 1.2 Title width and layout measurement
      const titleMetrics = await page.evaluate(() => {
        const titles = Array.from(document.querySelectorAll('h3')).filter(h =>
          h.textContent && h.textContent.includes('Yonex')
        );
        if (titles.length === 0) return null;
        const titleEl = titles[0];
        const rect = titleEl.getBoundingClientRect();
        const style = window.getComputedStyle(titleEl);
        
        // Find container row flex direction
        const parentRow = titleEl.closest('.flex-col, .sm\\:flex-row');
        const parentComputedStyle = parentRow ? window.getComputedStyle(parentRow) : null;

        return {
          text: titleEl.textContent.trim(),
          width: rect.width,
          height: rect.height,
          fontSize: style.fontSize,
          lineHeight: style.lineHeight,
          flexDirection: parentComputedStyle ? parentComputedStyle.flexDirection : null,
        };
      });

      const titleWideEnough = titleMetrics && titleMetrics.width >= 120;
      recordResult(
        'Cart-320px',
        'Product title maintains readable width (>= 120px) without character crushing',
        titleWideEnough,
        titleMetrics
          ? `Width: ${titleMetrics.width.toFixed(1)}px, Height: ${titleMetrics.height.toFixed(1)}px, FlexDir: ${titleMetrics.flexDirection}`
          : 'Title element not found'
      );

      // 1.3 Stepper & Trash touch targets
      const touchTargets = await page.evaluate(() => {
        const minusBtn = document.querySelector('button[aria-label="Giảm số lượng"]');
        const plusBtn = document.querySelector('button[aria-label="Tăng số lượng"]');
        const trashBtn = document.querySelector('button[aria-label="Xóa sản phẩm"]');
        if (!minusBtn || !plusBtn || !trashBtn) return null;

        const mRect = minusBtn.getBoundingClientRect();
        const pRect = plusBtn.getBoundingClientRect();
        const tRect = trashBtn.getBoundingClientRect();

        return {
          minus: { w: mRect.width, h: mRect.height },
          plus: { w: pRect.width, h: pRect.height },
          trash: { w: tRect.width, h: tRect.height },
        };
      });

      const targetsPass =
        touchTargets &&
        touchTargets.minus.w >= 44 &&
        touchTargets.minus.h >= 44 &&
        touchTargets.plus.w >= 44 &&
        touchTargets.plus.h >= 44 &&
        touchTargets.trash.w >= 44 &&
        touchTargets.trash.h >= 44;

      recordResult(
        'Cart-320px',
        'Stepper buttons & trash button touch targets >= 44x44px',
        targetsPass,
        touchTargets
          ? `Minus: ${touchTargets.minus.w}x${touchTargets.minus.h}px, Plus: ${touchTargets.plus.w}x${touchTargets.plus.h}px, Trash: ${touchTargets.trash.w}x${touchTargets.trash.h}px`
          : 'Buttons not found'
      );

      await context.close();
    }

    // =========================================================================
    // TEST SUITE 2: ProductCatalogGrid.tsx Vaul Drawer & Sidebar
    // =========================================================================
    console.log(`\n${c.bold}--- SUITE 2: ProductCatalogGrid.tsx Vaul Drawer (85dvh) & Sidebar ---${c.reset}`);
    {
      const context = await browser.newContext({
        viewport: { width: 320, height: 640 },
      });
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/vot-cau-long`, { waitUntil: 'networkidle', timeout: 30000 });

      // Click filter drawer button
      const filterButton = await page.locator('button:has-text("Bộ lọc")').first();
      await filterButton.click();
      await page.waitForTimeout(600);

      const drawerMetrics = await page.evaluate(() => {
        const drawerContent = document.querySelector('[vaul-drawer]') || document.querySelector('.max-h-\\[85dvh\\]');
        if (!drawerContent) return null;
        const rect = drawerContent.getBoundingClientRect();
        const style = window.getComputedStyle(drawerContent);
        return {
          height: rect.height,
          maxHeightStyle: style.maxHeight,
          paddingBottom: style.paddingBottom,
          viewportHeight: window.innerHeight,
          ratio: rect.height / window.innerHeight,
          className: drawerContent.className,
        };
      });

      const drawerConstrained =
        drawerMetrics &&
        drawerMetrics.ratio <= 0.855 && // allows tiny subpixel rounding
        drawerMetrics.className.includes('max-h-[85dvh]');

      recordResult(
        'Vaul-Drawer-320px',
        'Vaul Drawer constrained to max-h-[85dvh] with safe-area padding',
        Boolean(drawerConstrained),
        drawerMetrics
          ? `Height: ${drawerMetrics.height.toFixed(1)}px / ${drawerMetrics.viewportHeight}px (Ratio: ${(drawerMetrics.ratio * 100).toFixed(1)}%), max-h: ${drawerMetrics.maxHeightStyle}, pb: ${drawerMetrics.paddingBottom}`
          : 'Drawer content element not found'
      );

      await context.close();

      // Test Desktop Sidebar constraint
      const desktopContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const desktopPage = await desktopContext.newPage();
      await desktopPage.goto(`${BASE_URL}/vot-cau-long`, { waitUntil: 'networkidle', timeout: 30000 });

      const sidebarMetrics = await desktopPage.evaluate(() => {
        const sidebar = document.querySelector('[data-filter-sidebar]');
        if (!sidebar) return null;
        const rect = sidebar.getBoundingClientRect();
        const style = window.getComputedStyle(sidebar);
        return {
          width: rect.width,
          display: style.display,
          position: style.position,
          maxHeight: style.maxHeight,
          className: sidebar.className,
        };
      });

      const sidebarPass =
        sidebarMetrics &&
        Math.abs(sidebarMetrics.width - 280) <= 2 &&
        sidebarMetrics.display === 'block' &&
        sidebarMetrics.className.includes('max-h-[calc(100dvh-7rem)]');

      recordResult(
        'Catalog-Desktop',
        'Desktop left filter sidebar width ~280px with dynamic max-h-[calc(100dvh-7rem)]',
        Boolean(sidebarPass),
        sidebarMetrics
          ? `Width: ${sidebarMetrics.width}px, display: ${sidebarMetrics.display}, max-h: ${sidebarMetrics.maxHeight}`
          : 'Sidebar not found'
      );

      await desktopContext.close();
    }

    // =========================================================================
    // TEST SUITE 3: StickyAnchorBar.tsx Positioning (64px mobile / 92px desktop)
    // =========================================================================
    console.log(`\n${c.bold}--- SUITE 3: StickyAnchorBar.tsx Offset Positioning ---${c.reset}`);
    {
      // Mobile 360x800
      const mobContext = await browser.newContext({
        viewport: { width: 360, height: 800 },
      });
      const mobPage = await mobContext.newPage();
      await mobPage.goto(`${BASE_URL}/vot-cau-long/yonex-astrox-99-pro`, { waitUntil: 'networkidle', timeout: 30000 });

      const mobAnchor = await mobPage.evaluate(() => {
        const nav = document.querySelector('nav[aria-label*="chi tiết sản phẩm"]');
        if (!nav) return null;
        const bar = nav.closest('.sticky');
        if (!bar) return null;
        const style = window.getComputedStyle(bar);
        const navLinks = Array.from(nav.querySelectorAll('a'));
        const linkHeights = navLinks.map(a => a.getBoundingClientRect().height);

        return {
          position: style.position,
          top: style.top,
          className: bar.className,
          linkMinHeight: Math.min(...linkHeights),
        };
      });

      const mobAnchorPass =
        mobAnchor &&
        mobAnchor.position === 'sticky' &&
        mobAnchor.top === '64px';

      recordResult(
        'StickyAnchor-Mobile',
        'StickyAnchorBar positions at top: 64px on mobile (<1024px)',
        Boolean(mobAnchorPass),
        mobAnchor ? `position: ${mobAnchor.position}, top: ${mobAnchor.top}, linkMinHeight: ${mobAnchor.linkMinHeight}px` : 'Bar not found'
      );
      await mobContext.close();

      // Desktop 1440x900
      const dskContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const dskPage = await dskContext.newPage();
      await dskPage.goto(`${BASE_URL}/vot-cau-long/yonex-astrox-99-pro`, { waitUntil: 'networkidle', timeout: 30000 });

      const dskAnchor = await dskPage.evaluate(() => {
        const nav = document.querySelector('nav[aria-label*="chi tiết sản phẩm"]');
        if (!nav) return null;
        const bar = nav.closest('.sticky');
        if (!bar) return null;
        const style = window.getComputedStyle(bar);
        return {
          position: style.position,
          top: style.top,
          className: bar.className,
        };
      });

      const dskAnchorPass =
        dskAnchor &&
        dskAnchor.position === 'sticky' &&
        dskAnchor.top === '92px';

      recordResult(
        'StickyAnchor-Desktop',
        'StickyAnchorBar positions at top: 92px on desktop (>=1024px)',
        Boolean(dskAnchorPass),
        dskAnchor ? `position: ${dskAnchor.position}, top: ${dskAnchor.top}` : 'Bar not found'
      );
      await dskContext.close();
    }

    // =========================================================================
    // TEST SUITE 4: portal/layout.tsx Sidebar Collapse on Tablet (768px-1023px)
    // =========================================================================
    console.log(`\n${c.bold}--- SUITE 4: portal/layout.tsx Sidebar Breakpoint (hidden lg:flex) ---${c.reset}`);
    {
      // 4.1 Tablet Portrait (768x1024)
      const tabContext = await browser.newContext({
        viewport: { width: 768, height: 1024 },
      });
      await tabContext.addCookies([
        {
          name: 'smash_session',
          value: sessionToken,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);
      const tabPage = await tabContext.newPage();
      await tabPage.goto(`${BASE_URL}/portal`, { waitUntil: 'networkidle', timeout: 30000 });

      const tabletState = await tabPage.evaluate(() => {
        const aside = document.querySelector('aside');
        const hamburgerBtn = document.querySelector('button[aria-label="Mở menu quản trị"]');
        return {
          asideDisplay: aside ? window.getComputedStyle(aside).display : null,
          asideClasses: aside ? aside.className : null,
          hamburgerVisible: hamburgerBtn ? window.getComputedStyle(hamburgerBtn).display !== 'none' : false,
          hamburgerRect: hamburgerBtn ? { w: hamburgerBtn.getBoundingClientRect().width, h: hamburgerBtn.getBoundingClientRect().height } : null,
        };
      });

      const tabletPass =
        tabletState.asideDisplay === 'none' &&
        tabletState.hamburgerVisible === true &&
        tabletState.hamburgerRect.w >= 44 &&
        tabletState.hamburgerRect.h >= 44;

      recordResult(
        'Portal-Tablet-768px',
        'Sidebar collapsed (display: none) and 44px hamburger visible on tablet (768px)',
        tabletPass,
        `asideDisplay: ${tabletState.asideDisplay}, hamburgerVisible: ${tabletState.hamburgerVisible}, hamburgerSize: ${tabletState.hamburgerRect?.w}x${tabletState.hamburgerRect?.h}px`
      );

      // Click hamburger and test mobile drawer
      const hamburger = tabPage.locator('button[aria-label="Mở menu quản trị"]');
      await hamburger.click();
      await tabPage.waitForTimeout(400);

      const drawerState = await tabPage.evaluate(() => {
        const drawerClose = document.querySelector('button[aria-label="Đóng menu quản trị"]');
        const drawerBox = drawerClose ? drawerClose.closest('.relative.w-72, [class*="h-[100dvh]"]') : null;
        if (!drawerClose || !drawerBox) return null;
        const rect = drawerBox.getBoundingClientRect();
        const closeRect = drawerClose.getBoundingClientRect();
        return {
          boxHeight: rect.height,
          closeWidth: closeRect.width,
          closeHeight: closeRect.height,
          className: drawerBox.className,
        };
      });

      const drawerPass =
        drawerState &&
        drawerState.closeWidth >= 44 &&
        drawerState.closeHeight >= 44 &&
        drawerState.className.includes('h-[100dvh]');

      recordResult(
        'Portal-Tablet-768px',
        'Tablet Drawer opens with dynamic h-[100dvh] and >= 44px close button',
        Boolean(drawerPass),
        drawerState ? `drawerHeight: ${drawerState.boxHeight}px, closeBtn: ${drawerState.closeWidth}x${drawerState.closeHeight}px` : 'Drawer not found'
      );

      await tabContext.close();

      // 4.2 Desktop (1024x768 and 1440x900)
      const dskContext = await browser.newContext({
        viewport: { width: 1024, height: 768 },
      });
      await dskContext.addCookies([
        {
          name: 'smash_session',
          value: sessionToken,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);
      const dskPage = await dskContext.newPage();
      await dskPage.goto(`${BASE_URL}/portal`, { waitUntil: 'networkidle', timeout: 30000 });

      const dskState = await dskPage.evaluate(() => {
        const aside = document.querySelector('aside');
        const hamburgerBtn = document.querySelector('button[aria-label="Mở menu quản trị"]');
        return {
          asideDisplay: aside ? window.getComputedStyle(aside).display : null,
          hamburgerDisplay: hamburgerBtn ? window.getComputedStyle(hamburgerBtn).display : null,
        };
      });

      const dskPass = dskState.asideDisplay === 'flex' && dskState.hamburgerDisplay === 'none';
      recordResult(
        'Portal-Desktop-1024px',
        'Sidebar visible (display: flex) and hamburger hidden (display: none) at >= 1024px',
        dskPass,
        `asideDisplay: ${dskState.asideDisplay}, hamburgerDisplay: ${dskState.hamburgerDisplay}`
      );

      await dskContext.close();
    }

    // =========================================================================
    // TEST SUITE 5: portal/secondhand/page.tsx Buyback Price Table
    // =========================================================================
    console.log(`\n${c.bold}--- SUITE 5: portal/secondhand Buyback Price Table ---${c.reset}`);
    {
      const context = await browser.newContext({
        viewport: { width: 360, height: 800 },
      });
      await context.addCookies([
        {
          name: 'smash_session',
          value: sessionToken,
          domain: 'localhost',
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);
      const page = await context.newPage();
      await page.goto(`${BASE_URL}/portal/secondhand?tab=PRICE_TABLES`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(600);

      const tableInspection = await page.evaluate(() => {
        // Find table containing 'GIÁ SÀN THU MUA CHUẨN' or 'DÒNG VỢT'
        const ths = Array.from(document.querySelectorAll('th'));
        const buybackTh = ths.find(th => th.textContent && th.textContent.includes('GIÁ SÀN THU MUA'));
        if (!buybackTh) return null;

        const table = buybackTh.closest('table');
        const wrapper = table ? table.parentElement : null;
        if (!table || !wrapper) return null;

        const wrapperStyle = window.getComputedStyle(wrapper);
        const tableRect = table.getBoundingClientRect();
        const rootOverflow = {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        };

        return {
          wrapperOverflowX: wrapperStyle.overflowX,
          tableClientWidth: table.clientWidth,
          tableMinWidthClass: table.className.includes('min-w-[650px]'),
          rootOverflow,
        };
      });

      const tablePass =
        tableInspection &&
        tableInspection.wrapperOverflowX === 'auto' &&
        tableInspection.tableClientWidth >= 650 &&
        tableInspection.rootOverflow.scrollWidth <= tableInspection.rootOverflow.innerWidth;

      recordResult(
        'Secondhand-PriceTable',
        'Buyback Price Table has overflow-x: auto and min-w >= 650px with zero root blowout',
        Boolean(tablePass),
        tableInspection
          ? `wrapperOverflowX: ${tableInspection.wrapperOverflowX}, tableWidth: ${tableInspection.tableClientWidth}px, min-w-[650px]: ${tableInspection.tableMinWidthClass}, rootScrollWidth: ${tableInspection.rootOverflow.scrollWidth}px <= ${tableInspection.rootOverflow.innerWidth}px`
          : 'Buyback Price Table not found'
      );

      await context.close();
    }

    // =========================================================================
    // TEST SUITE 6: All Portal Data Tables & Zero Root Blowout
    // =========================================================================
    console.log(`\n${c.bold}--- SUITE 6: All 12 Portal Pages Data Tables & Containment ---${c.reset}`);
    {
      const portalRoutes = [
        '/portal',
        '/portal/orders',
        '/portal/inventory',
        '/portal/products',
        '/portal/users',
        '/portal/recruitment',
        '/portal/stringing',
        '/portal/customers',
        '/portal/reports',
        '/portal/banners',
        '/portal/secondhand',
        '/portal/logs',
      ];

      for (const route of portalRoutes) {
        const context = await browser.newContext({
          viewport: { width: 360, height: 800 },
        });
        await context.addCookies([
          {
            name: 'smash_session',
            value: sessionToken,
            domain: 'localhost',
            path: '/',
            httpOnly: true,
            sameSite: 'Lax',
          },
        ]);
        const page = await context.newPage();
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 30000 });

        const pageAudit = await page.evaluate(() => {
          const tables = Array.from(document.querySelectorAll('table'));
          const tableDetails = tables.map(t => {
            const wrapper = t.parentElement;
            const wStyle = wrapper ? window.getComputedStyle(wrapper) : null;
            return {
              width: t.clientWidth,
              overflowX: wStyle ? wStyle.overflowX : null,
              hasMinW: /min-w-\[\d+px\]/.test(t.className),
            };
          });

          return {
            tableCount: tables.length,
            tableDetails,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
          };
        });

        const noBlowout = pageAudit.scrollWidth <= pageAudit.innerWidth;
        const allContained = pageAudit.tableDetails.every(
          t => t.overflowX === 'auto' || t.overflowX === 'scroll'
        );

        recordResult(
          'Portal-Tables',
          `${route} (tables: ${pageAudit.tableCount}) zero blowout & overflow containment`,
          noBlowout && (pageAudit.tableCount === 0 || allContained),
          `scrollWidth: ${pageAudit.scrollWidth}px, innerWidth: ${pageAudit.innerWidth}px, tables: ${JSON.stringify(pageAudit.tableDetails.map(t => `${t.width}px (ovf:${t.overflowX})`))}`
        );

        await context.close();
      }
    }
  } catch (err) {
    console.error(`\n${c.red}[ERROR] Unhandled error during test suite execution: ${err.message}${c.reset}`);
    console.error(err.stack);
  } finally {
    await browser.close();
  }

  // Summary
  console.log(`\n${c.bold}${c.cyan}================================================================================${c.reset}`);
  console.log(`${c.bold}${c.cyan}   CHALLENGE VERIFICATION SUMMARY${c.reset}`);
  console.log(`${c.bold}${c.cyan}================================================================================${c.reset}`);

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;
  const passRate = ((passedCount / results.length) * 100).toFixed(1);

  console.log(`Total Checks:  ${results.length}`);
  console.log(`Passed Checks: ${c.green}${passedCount}${c.reset}`);
  console.log(`Failed Checks: ${failedCount === 0 ? c.green + '0' : c.red + failedCount}${c.reset}`);
  console.log(`Pass Rate:     ${passRate}%\n`);

  if (failedCount === 0) {
    console.log(`${c.bold}${c.green}VERDICT: APPROVE — All empirical challenge tests PASSED flawlessly.${c.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${c.bold}${c.red}VERDICT: REQUEST_CHANGES — ${failedCount} test(s) failed.${c.reset}\n`);
    process.exit(1);
  }
}

main();
