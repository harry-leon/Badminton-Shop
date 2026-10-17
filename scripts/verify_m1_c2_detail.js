const { Pool } = require('../frontend/node_modules/pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'catalog_db'
});

async function main() {
  const cats = await pool.query('SELECT id, name, slug FROM categories ORDER BY id');
  
  for (const cat of cats.rows) {
    console.log(`\n================================================================`);
    console.log(`CATEGORY: [${cat.id}] "${cat.name}" (${cat.slug})`);
    console.log(`================================================================`);
    const prods = await pool.query(`
      SELECT p.id, p.name, p.brand_id, p.image_source, p.image_url,
             s.id as sku_id, s.price, s.size, s.color, s.weight, s.grip_size, s.variant_name
      FROM products p
      JOIN skus s ON p.id = s.product_id
      WHERE p.category_id = $1
      ORDER BY p.name, s.id;
    `, [cat.id]);

    prods.rows.forEach(p => {
      const variantInfo = [
        p.variant_name ? `var:${p.variant_name}` : null,
        p.size ? `sz:${p.size}` : null,
        p.color ? `col:${p.color}` : null,
        p.weight ? `w:${p.weight}` : null,
        p.grip_size ? `grip:${p.grip_size}` : null,
      ].filter(Boolean).join(' ');

      console.log(`- ${p.name}`);
      console.log(`  Brand: ${p.brand_id} | Price: ${parseInt(p.price).toLocaleString()} VND | SKU: ${p.sku_id} ${variantInfo ? '(' + variantInfo + ')' : ''}`);
      console.log(`  Source: ${p.image_source}`);
      console.log(`  Image: ${p.image_url}`);
    });
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
