const path = require('path');
let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  try {
    playwright = require(path.resolve(__dirname, '../node_modules/playwright'));
  } catch (e2) {
    playwright = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
  }
}

async function reproduce() {
  console.log('====================================================================');
  console.log('  REPRODUCING M1 DEFECT: HEADER HAMBURGER CLIPPED ON 320PX & 360PX');
  console.log('====================================================================\n');

  const browser = await playwright.chromium.launch({ headless: true, channel: 'msedge' });

  for (const vpWidth of [320, 360]) {
    console.log(`▶ Testing Viewport ${vpWidth}px x 640px:`);
    const page = await browser.newPage({ viewport: { width: vpWidth, height: 640 } });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1000);

    const metrics = await page.evaluate((width) => {
      const header = document.querySelector('header');
      const hamburger = document.querySelector('header button:has(svg.lucide-menu), header button[aria-label*="menu" i]');
      const themeToggle = Array.from(document.querySelectorAll('header button')).find(b => b.textContent && b.textContent.includes('GIAO DIỆN'));
      const cart = Array.from(document.querySelectorAll('header button')).find(b => b.textContent && b.textContent.includes('GIỎ HÀNG'));
      const logo = document.querySelector('header a[href="/"]');

      const getRect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          left: Math.round(r.left * 10) / 10,
          right: Math.round(r.right * 10) / 10,
          width: Math.round(r.width * 10) / 10,
        };
      };

      return {
        viewportWidth: width,
        headerScrollWidth: header ? header.scrollWidth : 0,
        logo: getRect(logo),
        themeToggle: getRect(themeToggle),
        cart: getRect(cart),
        hamburger: getRect(hamburger),
      };
    }, vpWidth);

    console.log(`  Header scrollWidth: ${metrics.headerScrollWidth}px (Viewport: ${vpWidth}px)`);
    console.log(`  Logo rect:           left=${metrics.logo?.left}px, right=${metrics.logo?.right}px, width=${metrics.logo?.width}px`);
    console.log(`  Theme toggle rect:   left=${metrics.themeToggle?.left}px, right=${metrics.themeToggle?.right}px, width=${metrics.themeToggle?.width}px`);
    console.log(`  Cart button rect:    left=${metrics.cart?.left}px, right=${metrics.cart?.right}px, width=${metrics.cart?.width}px`);
    console.log(`  Hamburger rect:      left=${metrics.hamburger?.left}px, right=${metrics.hamburger?.right}px, width=${metrics.hamburger?.width}px`);

    const overflowPx = metrics.hamburger ? metrics.hamburger.right - vpWidth : 0;
    if (overflowPx > 0) {
      console.log(`  [DEFECT DETECTED] Hamburger extends ${overflowPx}px OUTSIDE the ${vpWidth}px screen!`);
      const visibleHitbox = Math.max(0, vpWidth - metrics.hamburger.left);
      console.log(`  Visible touch area: ${visibleHitbox}px width (required >= 44px). Clipped by overflow-x: hidden!\n`);
    } else {
      console.log(`  [OK] Hamburger fits within ${vpWidth}px screen.\n`);
    }

    await page.close();
  }

  await browser.close();
}

reproduce().catch(console.error);
