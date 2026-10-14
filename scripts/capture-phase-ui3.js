const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const OUTPUT_DIR = path.resolve(__dirname, '../docs/ui/screenshots/ui3');

const VIEWPORTS = [
  { name: 'mobile', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];

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

  for (const vp of VIEWPORTS) {
    console.log(`Chụp Landing Page trên ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });

    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(600);

    const filename = `landing_${vp.name}_full.png`;
    await page.screenshot({
      path: path.join(OUTPUT_DIR, filename),
      fullPage: true,
    });
    console.log(`✓ Đã lưu ${filename}`);

    // Chụp viewport màn hình đầu tiên (Above the fold / Hero)
    const heroFilename = `landing_${vp.name}_hero.png`;
    await page.screenshot({
      path: path.join(OUTPUT_DIR, heroFilename),
      fullPage: false,
    });
    console.log(`✓ Đã lưu ${heroFilename}`);

    await page.close();
  }

  await browser.close();
  console.log('\nHoàn tất toàn bộ ảnh chụp nghiệm thu Phase UI-3!');
}

run().catch((err) => {
  console.error('Lỗi khi chụp ảnh Phase UI-3:', err);
  process.exit(1);
});
