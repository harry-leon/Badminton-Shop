const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const OUTPUT_DIR = path.resolve(__dirname, '../docs/ui/screenshots/ui4');

const ROUTES = [
  { name: 'catalog', path: '/vot-cau-long' },
  { name: 'detail_astrox99', path: '/vot-cau-long/yonex-astrox-99-pro' },
  { name: 'secondhand', path: '/second-hand' },
  { name: 'compare_empty', path: '/so-sanh' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 360, height: 800 },
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

  // 1. Chụp ma trận các routes chính trên desktop và mobile
  for (const r of ROUTES) {
    for (const vp of VIEWPORTS) {
      console.log(`Chụp ${r.name} trên ${vp.name} (${vp.width}x${vp.height})...`);
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });

      try {
        await page.goto(`http://localhost:3000${r.path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(600);

        const filename = `${r.name}_${vp.name}.png`;
        await page.screenshot({
          path: path.join(OUTPUT_DIR, filename),
          fullPage: true,
        });
        console.log(`✓ Đã lưu ${filename}`);

        // Chụp above the fold
        const foldFilename = `${r.name}_${vp.name}_fold.png`;
        await page.screenshot({
          path: path.join(OUTPUT_DIR, foldFilename),
          fullPage: false,
        });
        console.log(`✓ Đã lưu ${foldFilename}`);
      } catch (err) {
        console.error(`Lỗi chụp ${r.name} trên ${vp.name}:`, err.message);
      } finally {
        await page.close();
      }
    }
  }

  // 2. Kịch bản tương tác: Chọn 2 cây vợt để so sánh và chụp FloatingCompareBar + Compare Table
  console.log('\nThực hiện kịch bản so sánh 2 cây vợt...');
  const interactivePage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  try {
    await interactivePage.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'networkidle', timeout: 15000 });
    await interactivePage.waitForTimeout(600);

    // Click nút so sánh của 2 card đầu tiên
    const compareButtons = await interactivePage.$$('button[aria-label^="So sánh"]');
    if (compareButtons.length >= 2) {
      await compareButtons[0].click();
      await interactivePage.waitForTimeout(400);
      await compareButtons[1].click();
      await interactivePage.waitForTimeout(600);

      // Chụp FloatingCompareBar xuất hiện ở đáy màn hình
      await interactivePage.screenshot({
        path: path.join(OUTPUT_DIR, 'catalog_with_floating_compare_bar.png'),
        fullPage: false,
      });
      console.log('✓ Đã lưu catalog_with_floating_compare_bar.png');

      // Chuyển sang trang /so-sanh với dữ liệu 2 cây vừa chọn
      await interactivePage.goto('http://localhost:3000/so-sanh', { waitUntil: 'networkidle', timeout: 15000 });
      await interactivePage.waitForTimeout(600);

      await interactivePage.screenshot({
        path: path.join(OUTPUT_DIR, 'compare_table_with_2_rackets.png'),
        fullPage: true,
      });
      console.log('✓ Đã lưu compare_table_with_2_rackets.png');
    }
  } catch (err) {
    console.error('Lỗi kịch bản so sánh:', err.message);
  } finally {
    await interactivePage.close();
  }

  // 3. Kịch bản kiểm chứng tự động chọn chi nhánh còn hàng nhiều nhất
  console.log('\nKiểm chứng tự động chọn chi nhánh còn hàng trên trang chi tiết...');
  const detailPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  try {
    await detailPage.goto('http://localhost:3000/vot-cau-long/yonex-astrox-99-pro', { waitUntil: 'networkidle', timeout: 15000 });
    await detailPage.waitForTimeout(600);

    // Chụp phần OrderSection tự động chọn chi nhánh còn hàng (không bị khóa nút mua)
    await detailPage.screenshot({
      path: path.join(OUTPUT_DIR, 'detail_best_branch_selected.png'),
      fullPage: false,
    });
    console.log('✓ Đã lưu detail_best_branch_selected.png');
  } catch (err) {
    console.error('Lỗi kiểm chứng chi nhánh:', err.message);
  } finally {
    await detailPage.close();
  }

  await browser.close();
  console.log('\nHoàn tất chụp ảnh nghiệm thu Phase UI-4!');
}

run().catch((err) => {
  console.error('Lỗi khi chụp ảnh Phase UI-4:', err);
  process.exit(1);
});
