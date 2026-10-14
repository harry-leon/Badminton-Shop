const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const OUTPUT_DIR = path.resolve(__dirname, '../docs/ui/screenshots/design');

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

  // 1. Chụp Light Mode
  console.log('Chụp /_design chế độ Sáng (Light Mode)...');
  const contextLight = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const pageLight = await contextLight.newPage();
  await pageLight.goto('http://localhost:3000/_design', { waitUntil: 'networkidle', timeout: 15000 });
  await pageLight.waitForTimeout(800);
  await pageLight.screenshot({
    path: path.join(OUTPUT_DIR, 'design_system_light.png'),
    fullPage: true,
  });
  await contextLight.close();
  console.log('✓ Đã lưu design_system_light.png');

  // 2. Chụp Dark Mode
  console.log('Chụp /_design chế độ Tối (Dark Mode)...');
  const contextDark = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });
  const pageDark = await contextDark.newPage();
  await pageDark.goto('http://localhost:3000/_design', { waitUntil: 'networkidle', timeout: 15000 });
  // Click nút Dark mode trên trang để kích hoạt class .dark
  const darkBtn = pageDark.locator('button:has-text("Tối")');
  if (await darkBtn.isVisible()) {
    await darkBtn.click();
    await pageDark.waitForTimeout(500);
  }
  await pageDark.screenshot({
    path: path.join(OUTPUT_DIR, 'design_system_dark.png'),
    fullPage: true,
  });
  await contextDark.close();
  console.log('✓ Đã lưu design_system_dark.png');

  // 3. Chụp cận cảnh 2 phương án Hero (Phương án A & Phương án B)
  console.log('Chụp cận cảnh so sánh 2 phương án Hero...');
  const contextHero = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'light',
  });
  const pageHero = await contextHero.newPage();
  await pageHero.goto('http://localhost:3000/_design', { waitUntil: 'networkidle', timeout: 15000 });
  await pageHero.waitForTimeout(500);
  const heroSection = pageHero.locator('section:has-text("7. So sánh hai phương án Hero")');
  if (await heroSection.isVisible()) {
    await heroSection.screenshot({
      path: path.join(OUTPUT_DIR, 'hero_variants_comparison.png'),
    });
    console.log('✓ Đã lưu hero_variants_comparison.png');
  }
  await contextHero.close();

  await browser.close();
  console.log('\nHoàn tất chụp ảnh nghiệm thu Phase UI-1!');
}

run().catch((err) => {
  console.error('Lỗi khi chụp ảnh /_design:', err);
  process.exit(1);
});
