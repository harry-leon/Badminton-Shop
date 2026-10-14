const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const TEST_STRING = "Vợt cầu lông Yonex Astrox 99 Pro — Ặ Ữ Ợ Ẩ Ễ Ỳ Đ đ";
const OUTPUT_DIR = path.resolve(__dirname, '../docs/ui/screenshots/typography');

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

  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await context.newPage();

  // Create an HTML page testing Be Vietnam Pro at weights 400 and 500
  const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,400;0,500;1,400&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #F5F4F0;
      color: #111613;
      font-family: 'Be Vietnam Pro', sans-serif;
      padding: 48px;
    }
    .sample-box {
      background: #FFFFFF;
      border: 1px solid #E4E3DD;
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
    }
    .label {
      font-size: 13px;
      color: #6A726E;
      margin-bottom: 12px;
      font-weight: 400;
    }
    .w400 {
      font-weight: 400;
      font-size: 24px;
      line-height: 1.5;
    }
    .w500 {
      font-weight: 500;
      font-size: 28px;
      line-height: 1.3;
      letter-spacing: -0.02em;
    }
    .letters-grid {
      display: flex;
      gap: 16px;
      margin-top: 16px;
      font-size: 32px;
    }
    .char-card {
      background: #F5F4F0;
      border: 1px solid #E4E3DD;
      border-radius: 8px;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <h1 style="font-size: 32px; font-weight: 500; margin-bottom: 8px;">Xác Minh Phông Chữ Tiếng Việt — Be Vietnam Pro</h1>
  <p style="color: #6A726E; font-size: 14px; margin-bottom: 32px;">Kiểm tra độ thẳng hàng của dấu mũ, dấu móc, dấu hỏi, dấu ngã trên các nguyên âm phức tạp tiếng Việt.</p>

  <div class="sample-box">
    <div class="label">NỘI DUNG CHÍNH (WEIGHT 400, FONT-SIZE 24PX)</div>
    <div class="w400">${TEST_STRING}</div>
  </div>

  <div class="sample-box">
    <div class="label">TIÊU ĐỀ & ĐIỂM NHẤN (WEIGHT 500, FONT-SIZE 28PX, LETTER-SPACING -0.02EM)</div>
    <div class="w500">${TEST_STRING}</div>
  </div>

  <div class="sample-box">
    <div class="label">CÁC KÝ TỰ CÓ DẤU PHỨC TẠP RIÊNG LẺ (WEIGHT 500)</div>
    <div class="letters-grid">
      ${["Ặ", "Ữ", "Ợ", "Ẩ", "Ễ", "Ỳ", "Đ", "đ"].map(c => `<div class="char-card w500">${c}</div>`).join('')}
    </div>
  </div>
</body>
</html>
  `;

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const screenshotPath = path.join(OUTPUT_DIR, 'be_vietnam_pro_verification.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });

  console.log(`Đã lưu ảnh xác minh phông chữ tiếng Việt tại: ${screenshotPath}`);
  await browser.close();
}

run().catch(err => {
  console.error('Lỗi khi xác minh phông chữ:', err);
  process.exit(1);
});
