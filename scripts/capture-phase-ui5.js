const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const OUTPUT_DIR = path.resolve(__dirname, '../docs/ui/screenshots/ui5');

const ROUTES = [
  { name: 'cart', path: '/cart' },
  { name: 'checkout', path: '/checkout' },
  { name: 'warranty_lookup', path: '/tra-cuu-bao-hanh' },
  { name: 'branches', path: '/chi-nhanh' },
  { name: 'account', path: '/account' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 768, height: 1024 },
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

  // 1. Chụp ma trận 5 routes x 3 viewports
  for (const r of ROUTES) {
    for (const vp of VIEWPORTS) {
      console.log(`Chụp ${r.name} trên ${vp.name} (${vp.width}x${vp.height})...`);
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });

      try {
        await page.goto(`http://localhost:3000${r.path}`, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(500);

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

  // 2. Kịch bản tương tác: Tra cứu bảo hành với dữ liệu thật từ DB (CLM-20261013-0001)
  console.log('\nChụp kết quả tra cứu bảo hành có timeline...');
  const searchPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  try {
    await searchPage.goto('http://localhost:3000/tra-cuu-bao-hanh?orderCode=DH-20261013-0001&phone=0909123456', {
      waitUntil: 'networkidle',
      timeout: 15000,
    });
    await searchPage.waitForTimeout(600);

    await searchPage.screenshot({
      path: path.join(OUTPUT_DIR, 'warranty_result_timeline.png'),
      fullPage: true,
    });
    console.log('✓ Đã lưu warranty_result_timeline.png');
  } catch (err) {
    console.error('Lỗi chụp kết quả tra cứu bảo hành:', err.message);
  } finally {
    await searchPage.close();
  }

  // 3. Kịch bản tương tác: Thêm 1 sản phẩm vào giỏ rồi chụp trang checkout và cart
  console.log('\nChụp trang Cart & Checkout có sản phẩm thật...');
  const cartPage = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  try {
    // Vào trang catalog để bấm nút Mua hoặc thêm sản phẩm
    await cartPage.goto('http://localhost:3000/cart', { waitUntil: 'networkidle' });
    // Thiết lập giỏ hàng mẫu vào localStorage
    await cartPage.evaluate(() => {
      localStorage.setItem('smashcourt_cart_items', JSON.stringify([
        {
          id: 'yonex-astrox-99-pro',
          name: 'Yonex Astrox 99 Pro Cherry Sunburst',
          sku: 'YONEX-AX99PRO-4UG5',
          price: 4250000,
          quantity: 1,
          imageUrl: '/images/products/yonex-astrox-99-pro.jpg',
        }
      ]));
    });

    // Tải lại trang cart
    await cartPage.goto('http://localhost:3000/cart', { waitUntil: 'networkidle', timeout: 15000 });
    await cartPage.waitForTimeout(500);

    await cartPage.screenshot({
      path: path.join(OUTPUT_DIR, 'cart_with_item_desktop.png'),
      fullPage: true,
    });
    console.log('✓ Đã lưu cart_with_item_desktop.png');

    // Chuyển sang trang checkout
    await cartPage.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle', timeout: 15000 });
    await cartPage.waitForTimeout(500);

    await cartPage.screenshot({
      path: path.join(OUTPUT_DIR, 'checkout_with_item_desktop.png'),
      fullPage: true,
    });
    console.log('✓ Đã lưu checkout_with_item_desktop.png');
  } catch (err) {
    console.error('Lỗi chụp cart có sản phẩm:', err.message);
  } finally {
    await cartPage.close();
  }

  await browser.close();
  console.log('\nHoàn tất chụp ảnh nghiệm thu Phase UI-5!');
}

run().catch((err) => {
  console.error('Lỗi khi chụp ảnh Phase UI-5:', err);
  process.exit(1);
});
