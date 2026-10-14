const fs = require('fs');
const path = require('path');

const appDir = path.resolve(__dirname, '../frontend/src/app');
const storefrontDir = path.join(appDir, '(storefront)');

const targets = ['page.tsx', 'vot-cau-long', 'second-hand', 'tra-cuu-bao-hanh'];

targets.forEach((t) => {
  const src = path.join(appDir, t);
  const dest = path.join(storefrontDir, t);
  if (fs.existsSync(src)) {
    if (fs.existsSync(dest)) {
      console.log(`Đích ${dest} đã tồn tại, xóa để ghi đè...`);
      fs.rmSync(dest, { recursive: true, force: true });
    }
    fs.renameSync(src, dest);
    console.log(`Đã chuyển: ${t} -> (storefront)/${t}`);
  } else {
    console.log(`Không tìm thấy ${src}, bỏ qua.`);
  }
});

console.log('Hoàn thành di chuyển route vào Route Group (storefront)!');
