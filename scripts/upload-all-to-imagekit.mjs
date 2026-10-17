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
const URL_ENDPOINT = (process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/htqhun').replace(/\/$/, '');

const authHeader = `Basic ${Buffer.from(`${PRIVATE_KEY}:`).toString('base64')}`;
const publicImagesDir = path.resolve(__dirname, '../frontend/public/images');

async function uploadFile(fullPath, targetSubdir, fileName) {
  const fileBytes = fs.readFileSync(fullPath);
  const base64File = fileBytes.toString('base64');
  const folder = `/Badminton-shop/${targetSubdir.replace(/\\/g, '/')}`;

  const formData = new FormData();
  formData.append('file', base64File);
  formData.append('fileName', fileName);
  formData.append('folder', folder);
  formData.append('useUniqueFileName', 'false');
  formData.append('tags', `Badminton-shop,${targetSubdir}`);

  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: {
      Authorization: authHeader,
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  console.log('🚀 Bắt đầu upload toàn bộ thư mục ảnh dự án vào folder /Badminton-shop trên ImageKit.io...');
  console.log(`Endpoint: ${URL_ENDPOINT}`);
  console.log(`Thư mục nguồn: ${publicImagesDir}\n`);

  const results = {};
  let totalCount = 0;
  let successCount = 0;
  let errorCount = 0;

  const subdirs = ['banners', 'categories', 'products', 'secondhand', 'branches'];

  for (const subdir of subdirs) {
    const dirPath = path.join(publicImagesDir, subdir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      if (!fs.statSync(fullPath).isFile()) continue;

      totalCount++;
      const localRelPath = `/images/${subdir}/${file}`;

      try {
        process.stdout.write(`[${totalCount}] Uploading ${localRelPath} -> /Badminton-shop/${subdir}/... `);
        const res = await uploadFile(fullPath, subdir, file);
        results[localRelPath] = {
          imagekitUrl: res.url,
          fileId: res.fileId,
          filePath: res.filePath,
          size: res.size,
          width: res.width,
          height: res.height,
        };
        successCount++;
        console.log(`✅ OK -> ${res.url}`);
      } catch (err) {
        errorCount++;
        console.log(`❌ LỖI: ${err.message}`);
      }
    }
  }

  const outputPath = path.resolve(__dirname, 'imagekit-mapping.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');

  console.log('\n=============================================');
  console.log(`Hoàn tất! Tổng cộng: ${totalCount} ảnh`);
  console.log(`Thành công: ${successCount}`);
  console.log(`Thất bại: ${errorCount}`);
  console.log(`Kết quả lưu tại: ${outputPath}`);
  console.log('=============================================\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
