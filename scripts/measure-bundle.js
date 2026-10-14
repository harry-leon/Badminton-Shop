const fs = require('fs');
const path = require('path');

const chunksDir = path.resolve(__dirname, '../frontend/.next/static/chunks');

if (!fs.existsSync(chunksDir)) {
  console.log('Chưa tìm thấy .next/static/chunks, hãy chạy npm run build trước.');
  process.exit(1);
}

let totalBytes = 0;
const files = [];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walk(full);
    } else if (ent.name.endsWith('.js')) {
      const sz = fs.statSync(full).size;
      totalBytes += sz;
      files.push({ file: path.relative(chunksDir, full), sizeKb: (sz / 1024).toFixed(1) });
    }
  }
}

walk(chunksDir);

console.log('=== KÍCH THƯỚC BUNDLE JS HIỆN TẠI (.next/static/chunks) ===');
files.sort((a, b) => parseFloat(b.sizeKb) - parseFloat(a.sizeKb));
files.slice(0, 15).forEach((f, idx) => {
  console.log(`${idx + 1}. ${f.file.padEnd(50)} ${f.sizeKb.padStart(8)} KB`);
});
console.log('-----------------------------------------------------------');
console.log(`Tổng dung lượng JS static chunks: ${(totalBytes / 1024).toFixed(1)} KB (~${(totalBytes / (1024 * 1024)).toFixed(2)} MB)\n`);
