const fs = require('fs');
const path = require('path');

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'catalog', path: '/vot-cau-long' },
  { name: 'product-detail', path: '/vot-cau-long/yonex-astrox-99-pro' },
  { name: 'secondhand', path: '/second-hand' },
  { name: 'warranty-lookup', path: '/tra-cuu-bao-hanh' },
  { name: 'admin-inventory', path: '/admin/inventory' },
  { name: 'admin-orders', path: '/admin/orders' },
  { name: 'admin-secondhand', path: '/admin/secondhand' },
  { name: 'admin-warranty', path: '/admin/warranty' },
];

const VIEWPORTS = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

const COLOR_SCHEMES = ['light', 'dark'];

const OUTPUT_DIR = path.resolve(__dirname, '../docs/ui/screenshots/before');

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let playwright;
  try {
    playwright = require('playwright');
  } catch (err) {
    console.error('Playwright module not found directly, trying npx / local install...');
    process.exit(1);
  }

  const { chromium } = playwright;
  
  let browser;
  try {
    // Try standard chromium
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log('Default chromium not installed, falling back to installed Google Chrome...');
    try {
      browser = await chromium.launch({ headless: true, channel: 'chrome' });
    } catch (e2) {
      console.error('Failed to launch browser:', e2.message);
      process.exit(1);
    }
  }

  console.log(`Browser launched successfully. Starting before screenshot capture (${ROUTES.length} routes x ${VIEWPORTS.length} viewports x ${COLOR_SCHEMES.length} schemes)...`);

  let capturedCount = 0;

  for (const vp of VIEWPORTS) {
    for (const scheme of COLOR_SCHEMES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: scheme,
        deviceScaleFactor: 1,
      });

      const page = await context.newPage();

      for (const route of ROUTES) {
        const url = `http://localhost:3000${route.path}`;
        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
          // Short delay for client hydrate / fonts
          await page.waitForTimeout(500);

          const filename = `${route.name}_${vp.name}_${scheme}.png`;
          const filepath = path.join(OUTPUT_DIR, filename);

          await page.screenshot({ path: filepath, fullPage: true });
          capturedCount++;
          console.log(`[${capturedCount}/${ROUTES.length * VIEWPORTS.length * COLOR_SCHEMES.length}] Saved: ${filename}`);
        } catch (err) {
          console.error(`Failed to capture ${url} (${vp.name}, ${scheme}):`, err.message);
        }
      }

      await context.close();
    }
  }

  await browser.close();
  console.log(`\nCompleted! Total ${capturedCount} screenshots saved to ${OUTPUT_DIR}`);
}

run().catch(err => {
  console.error('Fatal error during capture:', err);
  process.exit(1);
});
