const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.resolve(__dirname, '../docs/ui/screenshots/ui6');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
];

const ROUTES = [
  { path: '/admin', name: 'admin_dashboard' },
  { path: '/admin/inventory', name: 'admin_inventory' },
  { path: '/admin/orders', name: 'admin_orders' },
  { path: '/admin/secondhand', name: 'admin_secondhand' },
  { path: '/admin/warranty', name: 'admin_warranty' },
];

async function capture() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    for (const r of ROUTES) {
      const url = `http://localhost:3000${r.path}`;
      console.log(`Đang chụp [${vp.name}] ${r.name} tại ${url}...`);
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(1000);

        // Chụp full page
        await page.screenshot({
          path: path.join(OUT_DIR, `${r.name}_${vp.name}.png`),
          fullPage: true,
        });

        // Chụp viewport màn hình đầu
        await page.screenshot({
          path: path.join(OUT_DIR, `${r.name}_${vp.name}_fold.png`),
          fullPage: false,
        });
      } catch (err) {
        console.error(`Lỗi khi chụp ${r.name} trên ${vp.name}:`, err.message);
      }
    }

    await context.close();
  }

  await browser.close();
  console.log(`Hoàn thành chụp toàn bộ ma trận ảnh Phase UI-6 lưu tại ${OUT_DIR}!`);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
