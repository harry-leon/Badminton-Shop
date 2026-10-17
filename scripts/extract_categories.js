const sharp = require('C:/badminton-shop/frontend/node_modules/sharp/dist/index.cjs');
const fs = require('fs');
const path = require('path');

const src = 'C:/Users/htquo/.gemini/antigravity/brain/4176e60b-9553-4607-8085-eb2596e0d63c/.user_uploaded/media_1792118511521_5a559b3e.png';
const outDir = 'c:/badminton-shop/frontend/public/images/categories';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function process() {
  const meta = await sharp(src).metadata();
  console.log('Source image metadata:', meta.width, 'x', meta.height);

  const items = [
    { row: 0, col: 0, name: 'cat-vot-cau-long.png', title: 'VỢT CẦU LÔNG' },
    { row: 0, col: 1, name: 'cat-giay-cau-long.png', title: 'GIÀY CẦU LÔNG' },
    { row: 0, col: 2, name: 'cat-ao-cau-long.png', title: 'ÁO CẦU LÔNG' },
    { row: 0, col: 3, name: 'cat-vay-cau-long.png', title: 'VÁY CẦU LÔNG' },
    { row: 1, col: 0, name: 'cat-quan-cau-long.png', title: 'QUẦN CẦU LÔNG' },
    { row: 1, col: 1, name: 'cat-tui-vot-cau-long.png', title: 'TÚI VỢT CẦU LÔNG' },
    { row: 1, col: 2, name: 'cat-balo-cau-long.png', title: 'BALO CẦU LÔNG' },
    { row: 1, col: 3, name: 'cat-phu-kien-cau-long.png', title: 'PHỤ KIỆN CẦU LÔNG' }
  ];

  const colW = Math.floor(meta.width / 4); // 256
  const rowH = Math.floor(meta.height / 2); // 250

  for (const item of items) {
    const left = item.col * colW;
    const top = item.row * rowH;
    const width = (item.col === 3) ? (meta.width - left) : colW;
    const height = (item.row === 1) ? (meta.height - top) : rowH;

    const dest = path.join(outDir, item.name);
    await sharp(src)
      .extract({ left, top, width, height })
      .toFile(dest);
    console.log('Saved:', dest, width, 'x', height);
  }
}

process().catch(console.error);
