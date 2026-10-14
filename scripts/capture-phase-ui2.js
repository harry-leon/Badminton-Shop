const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const OUTPUT_DIR = path.resolve(__dirname, '../docs/ui/screenshots/ui2');

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  }

  // 1. Chụp Trang chủ với Header và Footer mới
  console.log('1. Chụp Trang chủ với Header & Footer mới...');
  const page1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page1.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
  await page1.waitForTimeout(500);
  await page1.screenshot({
    path: path.join(OUTPUT_DIR, 'storefront_header_footer.png'),
    fullPage: false,
  });
  console.log('✓ Đã lưu storefront_header_footer.png');
  await page1.close();

  // 2. Chụp Command Search ⌘K Dialog
  console.log('2. Chụp Hộp thoại tìm kiếm nhanh ⌘K...');
  const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page2.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
  await page2.waitForTimeout(500);
  await page2.keyboard.press('Control+k');
  await page2.waitForTimeout(400);
  await page2.screenshot({
    path: path.join(OUTPUT_DIR, 'command_search_dialog.png'),
  });
  console.log('✓ Đã lưu command_search_dialog.png');
  await page2.close();

  // 3. Chụp Cart Drawer slide-in
  console.log('3. Chụp Cart Drawer...');
  const page3 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page3.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
  await page3.waitForTimeout(500);
  const cartBtn = page3.locator('button[title="Xem giỏ hàng"]');
  await cartBtn.click();
  await page3.waitForTimeout(500);
  await page3.screenshot({
    path: path.join(OUTPUT_DIR, 'cart_drawer_open.png'),
  });
  console.log('✓ Đã lưu cart_drawer_open.png');
  await page3.close();

  // 4. Chụp Trang Admin Inventory sạch (không còn 2 header)
  console.log('4. Chụp Admin Inventory sạch...');
  const page4 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page4.goto('http://localhost:3000/admin/inventory', { waitUntil: 'networkidle', timeout: 15000 });
  await page4.waitForTimeout(500);
  await page4.screenshot({
    path: path.join(OUTPUT_DIR, 'admin_clean_layout.png'),
    fullPage: false,
  });
  console.log('✓ Đã lưu admin_clean_layout.png');
  await page4.close();

  await browser.close();
  console.log('\nHoàn tất toàn bộ ảnh chụp nghiệm thu Phase UI-2!');
}

run().catch((err) => {
  console.error('Lỗi khi chụp ảnh Phase UI-2:', err);
  process.exit(1);
});
