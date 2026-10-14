const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const AFTER_DIR = path.resolve(__dirname, '../docs/ui/screenshots/after');
if (!fs.existsSync(AFTER_DIR)) {
  fs.mkdirSync(AFTER_DIR, { recursive: true });
}

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'catalog', path: '/vot-cau-long' },
  { name: 'product-detail', path: '/vot-cau-long/yonex-astrox-99-pro' },
  { name: 'secondhand', path: '/second-hand' },
  { name: 'warranty-lookup', path: '/tra-cuu-bao-hanh' },
  { name: 'cart', path: '/cart' },
  { name: 'checkout', path: '/checkout' },
  { name: 'branches', path: '/chi-nhanh' },
  { name: 'account', path: '/account' },
  { name: 'compare', path: '/so-sanh' },
  { name: 'admin-dashboard', path: '/admin' },
  { name: 'admin-inventory', path: '/admin/inventory' },
  { name: 'admin-orders', path: '/admin/orders' },
  { name: 'admin-secondhand', path: '/admin/secondhand' },
  { name: 'admin-warranty', path: '/admin/warranty' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 360, height: 800 },
];

async function run() {
  console.log('=== CHỤP TOÀN BỘ MA TRẬN ẢNH SAU (AFTER) PHASE UI-7 ===');

  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }

  // 1. Chụp các route theo light mode
  for (const r of ROUTES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });

      const url = `http://localhost:3000${r.path}`;
      try {
        console.log(`Chụp [${vp.name}] ${r.name} (light)...`);
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(600);

        await page.screenshot({
          path: path.join(AFTER_DIR, `${r.name}_${vp.name}_light.png`),
          fullPage: true,
        });
      } catch (err) {
        console.error(`Lỗi chụp ${r.name} trên ${vp.name}:`, err.message);
      } finally {
        await page.close();
      }
    }
  }

  // 2. Chụp dark mode cho các route chính
  for (const r of ROUTES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });

      const url = `http://localhost:3000${r.path}`;
      try {
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(400);

        await page.screenshot({
          path: path.join(AFTER_DIR, `${r.name}_${vp.name}_dark.png`),
          fullPage: true,
        });
      } catch (err) {
        console.error(`Lỗi chụp dark ${r.name} trên ${vp.name}:`, err.message);
      } finally {
        await page.close();
      }
    }
  }

  // 3. Kiểm tra reduced-motion
  console.log('Kiểm tra chế độ reduced-motion (prefers-reduced-motion: reduce)...');
  const rmPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });
  await rmPage.emulateMedia({ reducedMotion: 'reduce' });
  await rmPage.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await rmPage.screenshot({
    path: path.join(AFTER_DIR, 'home_reduced_motion.png'),
    fullPage: false,
  });
  await rmPage.close();

  await browser.close();
  console.log(`✓ Đã hoàn tất chụp toàn bộ ma trận ảnh After lưu tại ${AFTER_DIR}!`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
