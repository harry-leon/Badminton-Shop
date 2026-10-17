import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || '';
if (!PRIVATE_KEY) {
  console.error('IMAGEKIT_PRIVATE_KEY is not set');
  process.exit(1);
}
const authHeader = `Basic ${Buffer.from(`${PRIVATE_KEY}:`).toString('base64')}`;

const downloadsDir = 'C:/Users/htquo/Downloads/Banner';
const targetBannerDir = path.resolve(__dirname, '../frontend/public/images/banners');

// Mapping nguồn từ Downloads sang các tên file cần thay thế trong dự án
const bannerSources = [
  {
    srcFile: 'Quảng cáo cước cầu lông Ryzonic 62 geschniegelt.png',
    targets: ['banner-1-gosen-ryzonic.png', 'banner-gosen-ryzonic-62.png'],
    label: 'Banner 1 - Gosen Ryzonic 62'
  },
  {
    srcFile: 'Đam Mê Bắt Đầu Từ Sân.png',
    targets: ['banner-2-dam-me-san-cau.png', 'banner-dam-me-san-cau.png'],
    label: 'Banner 2 - Đam Mê Sân Cầu'
  },
  {
    srcFile: 'Bứt Phá Trên Sân Cầu.png',
    targets: ['banner-3-but-pha-san-cau.png', 'banner-but-pha-san-cau.png'],
    label: 'Banner 3 - Bứt Phá Sân Cầu (Đỏ/Đen)'
  },
  {
    srcFile: 'Bứt Phá Trên Sân Cầu Lông.png',
    targets: ['banner-4-rise-smash-repeat.png', 'banner-rise-smash-repeat.png'],
    label: 'Banner 4 - Rise Smash Repeat / Bứt Phá Sân Cầu Lông (Xanh Neon)'
  }
];

// File IDs của các banner cũ cần xóa trên ImageKit
const oldFileIdsToDelete = [
  '6ad18feeead997d09a5feef2', // banner-1-gosen-ryzonic.png
  '6ad18ff0ead997d09a5ff2de', // banner-2-dam-me-san-cau.png
  '6ad18ff1ead997d09a5ff692', // banner-3-but-pha-san-cau.png
  '6ad18ff3ead997d09a5ffa7f', // banner-4-rise-smash-repeat.png
  '6ad18ff8ead997d09a6007b1', // banner-but-pha-san-cau.png
  '6ad18ff9ead997d09a600a80', // banner-dam-me-san-cau.png
  '6ad18ffbead997d09a600efa', // banner-gosen-ryzonic-62.png
  '6ad18ffeead997d09a601eff', // banner-rise-smash-repeat.png
];

async function deleteOldFile(fileId) {
  try {
    const res = await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader }
    });
    console.log(`🗑️ Đã xóa file cũ trên ImageKit [${fileId}]: Status ${res.status}`);
  } catch (err) {
    console.warn(`Không thể xóa file ${fileId}:`, err.message);
  }
}

async function uploadFile(buffer, fileName) {
  const base64File = buffer.toString('base64');
  const formData = new FormData();
  formData.append('file', base64File);
  formData.append('fileName', fileName);
  formData.append('folder', '/banners');
  formData.append('useUniqueFileName', 'false');
  formData.append('tags', 'badminton-shop,banners,high-res');

  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: formData
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log('=== BẮT ĐẦU CẬP NHẬT BANNER ĐỘ PHÂN GIẢI CAO (2K / 2170px) ===\n');

  // Bước 1: Xóa các banner mờ 1024px cũ trên ImageKit
  console.log('1. Xóa các banner cũ độ phân giải thấp trên ImageKit...');
  for (const id of oldFileIdsToDelete) {
    await deleteOldFile(id);
  }

  // Bước 2: Copy file độ nét cao vào thư mục public local
  console.log('\n2. Sao chép các file nét cao (2170x724) vào local frontend/public/images/banners...');
  for (const item of bannerSources) {
    const srcPath = path.join(downloadsDir, item.srcFile);
    if (!fs.existsSync(srcPath)) {
      console.error(`Không tìm thấy file nguồn: ${srcPath}`);
      continue;
    }
    const buf = fs.readFileSync(srcPath);

    for (const targetName of item.targets) {
      const destPath = path.join(targetBannerDir, targetName);
      fs.writeFileSync(destPath, buf);
      console.log(`   Copied -> ${targetName} (${(buf.length / 1024).toFixed(1)} KB)`);
    }
  }

  // Bước 3: Đẩy các file nét cao lên ImageKit
  console.log('\n3. Đẩy banner độ nét cao lên ImageKit...');
  const mappingPath = path.resolve(__dirname, 'imagekit-mapping.json');
  let mapping = {};
  if (fs.existsSync(mappingPath)) {
    mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
  }

  for (const item of bannerSources) {
    const srcPath = path.join(downloadsDir, item.srcFile);
    const buf = fs.readFileSync(srcPath);

    for (const targetName of item.targets) {
      process.stdout.write(`   Uploading ${targetName} (${item.label})... `);
      try {
        const uploadRes = await uploadFile(buf, targetName);
        mapping[`/images/banners/${targetName}`] = {
          imagekitUrl: uploadRes.url,
          fileId: uploadRes.fileId,
          size: uploadRes.size,
          width: uploadRes.width,
          height: uploadRes.height
        };
        console.log(`✅ OK (${uploadRes.width}x${uploadRes.height}px) -> ${uploadRes.url}`);
      } catch (err) {
        console.log(`❌ Lỗi: ${err.message}`);
      }
    }
  }

  fs.writeFileSync(mappingPath, JSON.stringify(mapping, null, 2), 'utf8');

  console.log('\n=== HOÀN TẤT CẬP NHẬT BANNER SIÊU NÉT (2170x724) LÊN IMAGEKIT! ===\n');
}

main().catch(err => {
  console.error('Lỗi thực thi:', err);
  process.exit(1);
});
