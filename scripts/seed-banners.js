const { Client } = require('./frontend/node_modules/pg');
const fs = require('fs');

const banners = JSON.parse(fs.readFileSync('./frontend/src/data/banners.json', 'utf8'));

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgres_password',
  database: 'catalog_db'
});

async function main() {
  await client.connect();
  await client.query('DELETE FROM banners');
  const sql = 'INSERT INTO banners (id, title, image_url, primary_cta_link, sort_order, is_active, badge, description, primary_cta_text, secondary_cta_text, secondary_cta_link, product_tag, product_price, features) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)';
  
  for (let i = 0; i < banners.length; i++) {
    const b = banners[i];
    await client.query(sql, [
      b.id,
      b.title,
      b.imageSrc,
      b.primaryCtaLink,
      i + 1,
      b.isActive,
      b.badge,
      b.description,
      b.primaryCtaText,
      b.secondaryCtaText,
      b.secondaryCtaLink,
      b.productTag,
      b.productPrice,
      JSON.stringify(b.features)
    ]);
  }
  const res = await client.query('SELECT id, title, image_url FROM banners');
  console.log('Seeded banners in catalog_db successfully:');
  console.table(res.rows);
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
