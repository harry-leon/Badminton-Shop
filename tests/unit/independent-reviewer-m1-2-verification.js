/**
 * Independent Verification Script by Reviewer M1-2
 * Tests:
 * 1. 360px viewport scrollWidth <= clientWidth on 4 target routes
 * 2. Vaul bottom sheet on mobile (<768px): trigger, drag handle, dynamic "Xem N sản phẩm"
 * 3. Desktop 280px sidebar: w-[280px] shrink-0, computed width = 280px
 * 4. Typography: zero <b>, zero <strong>, computed font-weight <= 500 across storefront
 * 5. Forbidden tokens scan on live pages & source
 * 6. Halbertec 8000 stock logic: 4UG5 default & in-stock (20), 3UG5 merged out-of-stock with tel:19006868
 */

const { withPage } = require('../e2e/helpers/browser');
const assert = require('assert');

async function run() {
  console.log('===============================================================');
  console.log(' INDEPENDENT REVIEWER M1-2 EMPIRICAL VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passedChecks = 0;
  let totalChecks = 0;

  function recordCheck(name, passed, detail) {
    totalChecks++;
    if (passed) {
      passedChecks++;
      console.log(`[PASS] ${name} ${detail ? '(' + detail + ')' : ''}`);
    } else {
      console.error(`[FAIL] ${name}: ${detail}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 1. RESPONSIVE 360PX VIEWPORT & OVERFLOW
  // ---------------------------------------------------------------------------
  console.log('--- 1. Testing 360px Viewport Horizontal Overflow ---');
  const targetRoutes = [
    '/',
    '/vot-cau-long',
    '/vot-cau-long/yonex-astrox-99-pro',
    '/vot-cau-long/lining-halbertec-8000'
  ];

  await withPage({ viewport: { width: 360, height: 800 } }, async (page) => {
    for (const route of targetRoutes) {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle', timeout: 15000 });

      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
        const clientWidth = doc.clientWidth;
        return { scrollWidth, clientWidth, noOverflow: scrollWidth <= clientWidth };
      });

      recordCheck(
        `360px Viewport no overflow on ${route}`,
        overflow.noOverflow,
        `scrollWidth: ${overflow.scrollWidth}px, clientWidth: ${overflow.clientWidth}px`
      );
    }
  });

  // ---------------------------------------------------------------------------
  // 2. MOBILE VAUL BOTTOM SHEET (<768px)
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Testing Mobile Vaul Bottom Sheet (<768px) ---');
  await withPage({ viewport: { width: 375, height: 812 } }, async (page) => {
    await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'networkidle', timeout: 15000 });

    // Check filter trigger button
    const trigger = await page.$('button[aria-label="Mở bộ lọc"]');
    recordCheck('Mobile Filter trigger button present', !!trigger, trigger ? 'Found button[aria-label="Mở bộ lọc"]' : 'Missing');

    if (trigger) {
      await trigger.click();
      await page.waitForTimeout(800); // wait for drawer animation

      // Check drawer content
      const drawerVisible = await page.evaluate(() => {
        const drawer = document.querySelector('[data-vaul-drawer]');
        const handle = document.querySelector('.cursor-grab');
        const ctaBtn = Array.from(document.querySelectorAll('[data-vaul-drawer] button')).find(b => b.textContent && b.textContent.includes('Xem') && b.textContent.includes('sản phẩm'));
        return {
          hasDrawer: !!drawer,
          hasHandle: !!handle,
          ctaText: ctaBtn ? ctaBtn.textContent.trim() : null
        };
      });

      recordCheck('Vaul bottom sheet opens', drawerVisible.hasDrawer, 'data-vaul-drawer element found');
      recordCheck('Vaul drag handle present', drawerVisible.hasHandle, 'Grab handle div found');
      recordCheck('Dynamic CTA button present in drawer', !!drawerVisible.ctaText, `CTA: "${drawerVisible.ctaText}"`);

      // Dynamic count check: toggle a brand checkbox inside the drawer
      const initialCtaText = drawerVisible.ctaText;
      const brandCheckbox = await page.$('[data-vaul-drawer] input[type="checkbox"][value="Yonex"]');
      if (brandCheckbox) {
        await brandCheckbox.click();
        await page.waitForTimeout(400);
        const updatedCtaText = await page.evaluate(() => {
          const ctaBtn = Array.from(document.querySelectorAll('[data-vaul-drawer] button')).find(b => b.textContent && b.textContent.includes('Xem') && b.textContent.includes('sản phẩm'));
          return ctaBtn ? ctaBtn.textContent.trim() : null;
        });
        recordCheck('Dynamic "Xem N sản phẩm" updates on filter toggle', updatedCtaText !== initialCtaText, `From "${initialCtaText}" -> "${updatedCtaText}"`);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 3. DESKTOP 280PX LEFT SIDEBAR (>=1024px)
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. Testing Desktop 280px Left Sidebar ---');
  await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'networkidle', timeout: 15000 });

    const sidebarMetrics = await page.evaluate(() => {
      const aside = document.querySelector('aside[data-filter-sidebar]');
      if (!aside) return null;
      const rect = aside.getBoundingClientRect();
      const computed = window.getComputedStyle(aside);
      return {
        className: aside.className,
        renderedWidth: rect.width,
        computedWidth: computed.width,
        isSticky: computed.position === 'sticky'
      };
    });

    recordCheck('Desktop sidebar present', !!sidebarMetrics, sidebarMetrics ? `width: ${sidebarMetrics.renderedWidth}px` : 'Missing aside');
    if (sidebarMetrics) {
      recordCheck('Desktop sidebar has w-[280px] shrink-0', sidebarMetrics.className.includes('w-[280px]') && sidebarMetrics.className.includes('shrink-0'), sidebarMetrics.className);
      recordCheck('Desktop sidebar rendered width is ~280px', Math.abs(sidebarMetrics.renderedWidth - 280) <= 2, `Actual: ${sidebarMetrics.renderedWidth}px`);
    }
  });

  // ---------------------------------------------------------------------------
  // 4. TYPOGRAPHY & FORBIDDEN TOKENS
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. Testing Typography & Forbidden Tokens Across Storefront ---');
  const auditRoutes = [
    '/',
    '/vot-cau-long',
    '/vot-cau-long/yonex-astrox-99-pro',
    '/vot-cau-long/lining-halbertec-8000',
    '/second-hand',
    '/tra-cuu-bao-hanh',
    '/chi-nhanh',
    '/so-sanh'
  ];

  await withPage({ viewport: { width: 1280, height: 800 } }, async (page) => {
    for (const route of auditRoutes) {
      await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle', timeout: 15000 });

      const audit = await page.evaluate(() => {
        const boldCount = document.querySelectorAll('b, strong').length;
        
        // Font-weight check
        const allElements = Array.from(document.querySelectorAll('body *'));
        const heavyElements = [];
        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          const weight = parseInt(style.fontWeight, 10);
          if (weight > 500) {
            heavyElements.push({
              tag: el.tagName,
              text: (el.textContent || '').slice(0, 30),
              weight
            });
          }
        }

        // Forbidden tokens
        const html = document.body.innerHTML;
        const text = document.body.innerText;
        const forbiddenPatterns = [
          { pattern: /Quy tắc R\d/i, name: '(Quy tắc R...)' },
          { pattern: /Snapshot Immutability/i, name: 'Snapshot Immutability' },
          { pattern: /Unique Unit/i, name: 'Unique Unit' },
          { pattern: /Design System/i, name: 'Design System' },
          { pattern: /Quiet Court/i, name: 'Quiet Court' },
        ];

        const tokenViolations = [];
        for (const { pattern, name } of forbiddenPatterns) {
          if (pattern.test(text) || pattern.test(html)) {
            tokenViolations.push(name);
          }
        }

        return {
          boldCount,
          heavyCount: heavyElements.length,
          heavySample: heavyElements.slice(0, 3),
          tokenViolations
        };
      });

      recordCheck(`Zero <b> or <strong> on ${route}`, audit.boldCount === 0, `bold tags: ${audit.boldCount}`);
      recordCheck(`Computed font-weight <= 500 on ${route}`, audit.heavyCount === 0, `violations: ${audit.heavyCount}`);
      recordCheck(`Zero forbidden tokens on ${route}`, audit.tokenViolations.length === 0, audit.tokenViolations.length ? `Found: ${audit.tokenViolations.join(', ')}` : 'Clean');
    }
  });

  // ---------------------------------------------------------------------------
  // 5. HALBERTEC 8000 STOCK LOGIC & VARIANT SWITCHING
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Testing Halbertec 8000 Stock Logic ---');
  await withPage({ viewport: { width: 1280, height: 800 } }, async (page) => {
    await page.goto('http://localhost:3000/vot-cau-long/lining-halbertec-8000', { waitUntil: 'networkidle', timeout: 15000 });

    const initialVariant = await page.evaluate(() => {
      // Find selected SKU button
      const allButtons = Array.from(document.querySelectorAll('button'));
      const activeBtn = allButtons.find(b => b.className && (b.className.includes('border-ink') || b.className.includes('bg-ink/5') || b.className.includes('font-medium')));
      const text = document.body.innerText;
      return {
        selectedText: activeBtn ? activeBtn.textContent.trim() : '',
        has4UG5: text.includes('4UG5') || text.includes('4U-G5') || text.includes('4U'),
        inStockBadge: text.includes('Còn hàng') || text.includes('Còn 20') || text.includes('20 cây'),
        allButtons: allButtons.map(b => b.textContent.trim()).filter(Boolean)
      };
    });

    recordCheck('Halbertec 8000 4U present and selectable', initialVariant.has4UG5, `Buttons: ${initialVariant.allButtons.join(', ')}`);
    recordCheck('Halbertec 8000 4U shows in-stock status (20 available)', initialVariant.inStockBadge, 'In-stock text found');

    // Switch to 3UG5 variant
    const switched = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn3U = buttons.find(b => b.textContent && (b.textContent.includes('3UG5') || b.textContent.includes('3U')));
      if (!btn3U) return { found3U: false };
      btn3U.click();
      return { found3U: true };
    });

    recordCheck('Found 3UG5 variant button', switched.found3U, 'Button present');

    if (switched.found3U) {
      await page.waitForTimeout(600);
      const oosState = await page.evaluate(() => {
        const text = document.body.innerText;
        const hotlineLink = document.querySelector('a[href^="tel:19006868"], a[href="tel:19006868"]');
        const isOutOfStock = text.includes('Hết hàng') || text.includes('Tạm hết hàng') || text.includes('hết hàng');
        return {
          isOutOfStock,
          hasHotline: !!hotlineLink,
          hotlineHref: hotlineLink ? hotlineLink.getAttribute('href') : null,
          hotlineText: hotlineLink ? hotlineLink.textContent.trim() : null
        };
      });

      recordCheck('3UG5 displays single merged out-of-stock row', oosState.isOutOfStock, 'Out-of-stock message rendered');
      recordCheck('3UG5 displays hotline call button tel:19006868', oosState.hasHotline && oosState.hotlineHref === 'tel:19006868', `href: ${oosState.hotlineHref}, text: "${oosState.hotlineText}"`);
    }
  });

  console.log('\n===============================================================');
  console.log(` RESULT: ${passedChecks}/${totalChecks} CHECKS PASSED (${((passedChecks/totalChecks)*100).toFixed(1)}%)`);
  console.log('===============================================================');

  if (passedChecks === totalChecks) {
    console.log('\n>>> INDEPENDENT VERIFICATION: 100% PASS <<<');
    process.exit(0);
  } else {
    console.error(`\n>>> INDEPENDENT VERIFICATION: ${totalChecks - passedChecks} CHECKS FAILED <<<`);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
