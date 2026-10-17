import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from '../frontend/node_modules/pg/lib/index.js';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || 'private_hOECE/HeE+7R8xq8MW++vJEoyJU=';
const URL_ENDPOINT = (process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/htqhun').replace(/\/$/, '');
const authHeader = `Basic ${Buffer.from(`${PRIVATE_KEY}:`).toString('base64')}`;

const dbConfig = {
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
  database: 'catalog_db',
};

async function uploadToImageKit(fileData, fileName) {
  const folder = '/Badminton-shop/products';
  const formData = new FormData();

  // ImageKit hỗ trợ nhận trực tiếp URL từ xa hoặc Base64
  if (typeof fileData === 'string' && fileData.startsWith('http')) {
    formData.append('file', fileData);
  } else {
    formData.append('file', fileData.toString('base64'));
  }

  formData.append('fileName', fileName);
  formData.append('folder', folder);
  formData.append('useUniqueFileName', 'false');
  formData.append('tags', 'Badminton-shop,products,auto-migrated');

  const res = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: { Authorization: authHeader },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

function sanitizeFileName(name, fallbackExt = '.jpg') {
  let clean = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!path.extname(clean)) {
    clean += fallbackExt;
  }
  return clean;
}

async function run() {
  console.log('🚀 Bắt đầu quét và đồng bộ toàn bộ ảnh sản phẩm lên ImageKit (/Badminton-shop/products)...');
  const client = new Client(dbConfig);
  await client.connect();

  const res = await client.query('SELECT id, slug, name, image_url FROM products ORDER BY created_at ASC');
  const products = res.rows;
  console.log(`Tìm thấy tổng cộng ${products.length} sản phẩm trong catalog_db.`);

  let updatedCount = 0;
  let alreadyImageKit = 0;
  let errorCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const prefix = `[${i + 1}/${products.length}] ${p.name}`;

    // Nếu ảnh đã là link ImageKit thì bỏ qua
    if (p.image_url && p.image_url.includes('imagekit.io')) {
      console.log(`${prefix} -> Đã ở ImageKit (${p.image_url})`);
      alreadyImageKit++;
      continue;
    }

    try {
      let targetFileName = `${p.slug || 'product-' + p.id}`;
      let uploadSource = null;

      // Trường hợp 1: Ảnh local (/images/products/...)
      if (p.image_url && p.image_url.startsWith('/images/products/')) {
        const localPath = path.resolve(__dirname, '../frontend/public', p.image_url.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          uploadSource = fs.readFileSync(localPath);
          targetFileName = path.basename(localPath);
        } else {
          console.log(`${prefix} -> ⚠️ Không tìm thấy file cục bộ ${localPath}`);
          continue;
        }
      } 
      // Trường hợp 2: Link ảnh từ xa (http/https)
      else if (p.image_url && p.image_url.startsWith('http')) {
        uploadSource = p.image_url;
        const extMatch = p.image_url.match(/\.(png|jpg|jpeg|webp|gif)($|\?)/i);
        const ext = extMatch ? `.${extMatch[1].toLowerCase()}` : '.jpg';
        targetFileName = sanitizeFileName(p.slug || p.name, ext);
      } else {
        console.log(`${prefix} -> ⚠️ Không có URL hợp lệ: ${p.image_url}`);
        continue;
      }

      process.stdout.write(`${prefix} -> Đang tải lên ImageKit (${targetFileName})... `);
      const uploaded = await uploadToImageKit(uploadSource, targetFileName);

      // Cập nhật lại URL mới vào database
      await client.query('UPDATE products SET image_url = $1 WHERE id = $2', [uploaded.url, p.id]);
      console.log(`✅ OK -> ${uploaded.url}`);
      updatedCount++;

      // Nghỉ nhẹ 100ms tránh rate limit
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      errorCount++;
      console.log(`❌ Lỗi: ${err.message}`);
    }
  }

  console.log('\n=============================================');
  console.log(`Tổng kết:`);
  console.log(`- Đã có sẵn trên ImageKit: ${alreadyImageKit}`);
  console.log(`- Tải lên & cập nhật Database thành công: ${updatedCount}`);
  console.log(`- Thất bại: ${errorCount}`);
  console.log('=============================================\n');

  await client.end();
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
