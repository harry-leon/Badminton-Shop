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

async function runAdversarialTests() {
  console.log('====================================================================');
  console.log('  M1 ROUND 2: EMPIRICAL ADVERSARIAL CHALLENGER VERIFICATION');
  console.log('====================================================================\n');

  const browser = await playwright.chromium.launch({ headless: true, channel: 'msedge' });
  let failures = 0;

  // 1. Geometric & Touch Target Verification across viewports
  const viewportsToTest = [320, 340, 360, 375, 390, 414, 500, 600, 768, 1024];

  for (const vpWidth of viewportsToTest) {
    const page = await browser.newPage({ viewport: { width: vpWidth, height: 700 } });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(600);

    const data = await page.evaluate((width) => {
      const header = document.querySelector('header');
      const hamburger = document.querySelector('header button:has(svg.lucide-menu), header button[aria-label*="menu" i]');
      const searchBtn = document.querySelector('header a[href="/tim-kiem"]');
      const cartBtn = document.querySelector('header button[aria-label="Xem giỏ hàng"], header button:has(svg circle[cx="8"])');
      const headerThemeToggle = Array.from(document.querySelectorAll('header button')).find(b => b.textContent && b.textContent.includes('GIAO DIỆN'));
      const slogan = Array.from(document.querySelectorAll('header span')).find(s => s.textContent && s.textContent.includes('Vợt tốt trải nghiệm tốt'));

      const getRect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return {
          left: Math.round(r.left * 10) / 10,
          right: Math.round(r.right * 10) / 10,
          top: Math.round(r.top * 10) / 10,
          bottom: Math.round(r.bottom * 10) / 10,
          width: Math.round(r.width * 10) / 10,
          height: Math.round(r.height * 10) / 10,
          display: style.display,
          visibility: style.visibility,
        };
      };

      return {
        width,
        headerScrollWidth: header ? header.scrollWidth : 0,
        hamburger: getRect(hamburger),
        searchBtn: getRect(searchBtn),
        cartBtn: getRect(cartBtn),
        headerThemeToggle: getRect(headerThemeToggle),
        sloganVisible: slogan ? window.getComputedStyle(slogan).display !== 'none' : false,
      };
    }, vpWidth);

    console.log(`[Viewport ${vpWidth}px]: Header scrollWidth: ${data.headerScrollWidth}px`);

    if (vpWidth < 1024) {
      // Hamburger must exist and be visible
      if (!data.hamburger || data.hamburger.width === 0) {
        console.error(`  FAIL: Hamburger missing or hidden on ${vpWidth}px`);
        failures++;
      } else {
        const rightEdge = data.hamburger.right;
        const fitsInViewport = rightEdge <= vpWidth;
        const widthOk = data.hamburger.width >= 44;
        const heightOk = data.hamburger.height >= 44;

        if (!fitsInViewport) {
          console.error(`  FAIL: Hamburger extends beyond viewport (${rightEdge} > ${vpWidth})`);
          failures++;
        } else if (!widthOk || !heightOk) {
          console.error(`  FAIL: Hamburger touch target < 44px (${data.hamburger.width}x${data.hamburger.height})`);
          failures++;
        } else {
          console.log(`  PASS: Hamburger within screen (right=${rightEdge}px <= ${vpWidth}px, dimensions=${data.hamburger.width}x${data.hamburger.height}px)`);
        }
      }

      // Check cart button
      if (data.cartBtn) {
        const cartWidthOk = data.cartBtn.width >= 44;
        const cartHeightOk = data.cartBtn.height >= 44;
        if (!cartWidthOk || !cartHeightOk) {
          console.error(`  FAIL: Cart button touch target < 44px (${data.cartBtn.width}x${data.cartBtn.height})`);
          failures++;
        } else {
          console.log(`  PASS: Cart button touch target ${data.cartBtn.width}x${data.cartBtn.height}px`);
        }
      }

      // Check header theme toggle on < 640px
      if (vpWidth < 640) {
        if (data.headerThemeToggle && data.headerThemeToggle.display !== 'none' && data.headerThemeToggle.width > 0) {
          console.error(`  FAIL: Top-bar theme toggle is visible on narrow viewport ${vpWidth}px!`);
          failures++;
        } else {
          console.log(`  PASS: Top-bar theme toggle correctly hidden on ${vpWidth}px`);
        }
      }
    } else {
      // On >= 1024px, hamburger should be hidden
      if (data.hamburger && data.hamburger.display !== 'none' && data.hamburger.width > 0) {
        console.error(`  FAIL: Hamburger should be hidden on desktop ${vpWidth}px`);
        failures++;
      } else {
        console.log(`  PASS: Desktop category bar active, hamburger hidden.`);
      }
    }

    await page.close();
  }

  // 2. Comprehensive Drawer Interactions & Theme Toggle on 320px Viewport
  console.log('\n▶ Testing Mobile Drawer Interactions on 320px:');
  const drawerPage = await browser.newPage({ viewport: { width: 320, height: 640 } });
  await drawerPage.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 20000 });
  await drawerPage.waitForTimeout(600);

  // Read initial theme
  const initialTheme = await drawerPage.evaluate(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  console.log(`  Initial HTML theme: ${initialTheme}`);

  // Open drawer
  const hamburgerBtn = await drawerPage.$('header button:has(svg.lucide-menu), header button[aria-label*="menu" i]');
  if (!hamburgerBtn) {
    console.error('  FAIL: Hamburger button selector not found');
    failures++;
  } else {
    await hamburgerBtn.click();
    await drawerPage.waitForTimeout(400);

    // Verify drawer is open
    const drawerContainer = await drawerPage.$('div.fixed.inset-0.z-50');
    if (!drawerContainer) {
      console.error('  FAIL: Drawer container not rendered after click');
      failures++;
    } else {
      console.log('  PASS: Drawer successfully opened on Hamburger click.');
    }

    // Verify drawer header theme toggle button
    const headerToggle = await drawerPage.$('div[class*="border-b"] button[title*="Chuyển sang chế độ"], div[class*="border-b"] button[aria-label*="Chuyển sang chế độ"]');
    if (!headerToggle) {
      console.error('  FAIL: Drawer header theme toggle button not found');
      failures++;
    } else {
      const box = await headerToggle.boundingBox();
      console.log(`  Drawer header theme button dimensions: ${box.width}x${box.height}px`);
      if (box.width < 44 || box.height < 44) {
        console.error(`  FAIL: Drawer header theme button < 44x44px`);
        failures++;
      } else {
        console.log('  PASS: Drawer header theme button meets >= 44x44px touch target.');
      }

      // Click to toggle theme
      await headerToggle.click();
      await drawerPage.waitForTimeout(400);

      const toggledTheme = await drawerPage.evaluate(() =>
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      );
      console.log(`  Theme after drawer header toggle: ${toggledTheme}`);
      if (toggledTheme === initialTheme) {
        console.error('  FAIL: Theme did not toggle when clicking drawer header theme button');
        failures++;
      } else {
        console.log('  PASS: Theme correctly changed from ' + initialTheme + ' to ' + toggledTheme);
      }
    }

    // Verify drawer shortcuts theme toggle button
    const shortcutsToggle = await drawerPage.$('button:has-text("Giao diện:"), button:has-text("Chế độ giao diện")');
    if (!shortcutsToggle) {
      console.error('  FAIL: Drawer shortcuts theme toggle button not found');
      failures++;
    } else {
      const sBox = await shortcutsToggle.boundingBox();
      console.log(`  Drawer shortcuts theme button dimensions: ${sBox.width}x${sBox.height}px`);
      if (sBox.height < 44) {
        console.error('  FAIL: Drawer shortcuts theme button height < 44px');
        failures++;
      } else {
        console.log('  PASS: Drawer shortcuts theme button height >= 44px');
      }

      // Click to toggle back
      await shortcutsToggle.click();
      await drawerPage.waitForTimeout(400);

      const revertedTheme = await drawerPage.evaluate(() =>
        document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      );
      console.log(`  Theme after shortcuts toggle: ${revertedTheme}`);
      if (revertedTheme !== initialTheme) {
        console.error('  FAIL: Theme did not revert to ' + initialTheme);
        failures++;
      } else {
        console.log('  PASS: Theme correctly reverted back to ' + revertedTheme);
      }
    }

    // Verify close button
    const closeBtn = await drawerPage.$('div[class*="border-b"] button[aria-label="Đóng menu"]');
    if (!closeBtn) {
      console.error('  FAIL: Drawer close button not found');
      failures++;
    } else {
      const cBox = await closeBtn.boundingBox();
      console.log(`  Drawer close button dimensions: ${cBox.width}x${cBox.height}px`);
      if (cBox.width < 44 || cBox.height < 44) {
        console.error('  FAIL: Drawer close button < 44x44px');
        failures++;
      } else {
        console.log('  PASS: Drawer close button meets >= 44x44px touch target.');
      }

      // Click close button
      await closeBtn.click();
      await drawerPage.waitForTimeout(400);

      const isDrawerStillVisible = await drawerPage.evaluate(() => {
        return !!document.querySelector('div.fixed.inset-0.z-50');
      });
      if (isDrawerStillVisible) {
        console.error('  FAIL: Drawer did not close after clicking close button');
        failures++;
      } else {
        console.log('  PASS: Drawer successfully closed.');
      }
    }

    // Test backdrop click to close
    await hamburgerBtn.click();
    await drawerPage.waitForTimeout(400);
    // Click outside drawer on backdrop (e.g. at (315, 300) since drawer is max 320-32 = 288px)
    await drawerPage.mouse.click(310, 300);
    await drawerPage.waitForTimeout(400);
    const isDrawerOpenAfterBackdrop = await drawerPage.evaluate(() => {
      return !!document.querySelector('div.fixed.inset-0.z-50');
    });
    if (isDrawerOpenAfterBackdrop) {
      console.error('  FAIL: Drawer did not close after clicking backdrop');
      failures++;
    } else {
      console.log('  PASS: Drawer backdrop click dismisses drawer correctly.');
    }
  }

  await drawerPage.close();
  await browser.close();

  console.log('\n====================================================================');
  if (failures === 0) {
    console.log('  ALL EMPIRICAL ADVERSARIAL CHALLENGER TESTS PASSED (0 FAILURES)!');
  } else {
    console.log(`  TESTS COMPLETED WITH ${failures} FAILURE(S).`);
  }
  console.log('====================================================================\n');

  process.exit(failures === 0 ? 0 : 1);
}

runAdversarialTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
