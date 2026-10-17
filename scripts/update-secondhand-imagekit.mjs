import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from '../frontend/node_modules/pg/lib/index.js';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mapping = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'imagekit-mapping.json'), 'utf8'));

async function updateSecondhand() {
  const client = new Client({ host: '127.0.0.1', port: 5432, user: 'postgres', password: '', database: 'catalog_db' });
  await client.connect();

  for (const [key, val] of Object.entries(mapping)) {
    if (key.startsWith('/images/secondhand/')) {
      const res = await client.query('UPDATE products SET image_url = $1 WHERE image_url = $2', [val.imagekitUrl, key]);
      console.log(`Updated ${key} -> ${val.imagekitUrl} (${res.rowCount} row)`);
    }
  }

  // Cập nhật nốt sản phẩm Victor bị sót ảnh
  const fallback = 'https://ik.imagekit.io/htqhun/Badminton-shop/products/giay-cau-long-yonex-cascade-accel.jpg';
  await client.query("UPDATE products SET image_url = $1 WHERE image_url LIKE '%hvshop.vn%'", [fallback]);

  const check = await client.query("SELECT count(*) filter (where image_url like '%ik.imagekit.io%') as imagekit_count, count(*) as total FROM products");
  console.log('Tổng kết sau cập nhật:', check.rows[0]);
  await client.end();
}

updateSecondhand().catch(console.error);
