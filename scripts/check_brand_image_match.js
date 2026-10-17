const { Pool } = require('../frontend/node_modules/pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'catalog_db'
});

async function main() {
  const prods = await pool.query(`
    SELECT id, name, brand_id, category_id, image_source, image_url
    FROM products
    ORDER BY category_id, brand_id, name;
  `);

  console.log('=== CHECKING BRAND vs IMAGE_URL vs IMAGE_SOURCE ===\n');
  let mismatchCount = 0;
  for (const p of prods.rows) {
    const isVictor = p.brand_id === 'victor';
    const isLining = p.brand_id === 'lining';
    const isMizuno = p.brand_id === 'mizuno';
    const isSodex = p.brand_id === 'sodex';
    const isStarbalm = p.brand_id === 'starbalm';
    const isYonex = p.brand_id === 'yonex';

    const urlHasYonex = p.image_url.includes('yonex.com');
    const urlHasVictor = p.image_url.includes('victorsport.com');
    const urlHasLining = p.image_url.includes('lining.com');
    const urlHasMizuno = p.image_url.includes('mizuno.com');
    const urlHasSodex = p.image_url.includes('sodex');
    const urlHasStarbalm = p.image_url.includes('starbalm');

    // Check if brand matches url
    let matched = true;
    if (isYonex && !urlHasYonex) matched = false;
    if (isVictor && !urlHasVictor) matched = false;
    if (isLining && !urlHasLining) matched = false;
    if (isMizuno && !urlHasMizuno) matched = false;
    if (isSodex && !urlHasSodex) matched = false;
    if (isStarbalm && !urlHasStarbalm) matched = false;

    if (!matched) {
      mismatchCount++;
      console.log(`[MISMATCH ${mismatchCount}]`);
      console.log(`  Product: ${p.name}`);
      console.log(`  Brand: ${p.brand_id} | Category: ${p.category_id}`);
      console.log(`  Source: ${p.image_source}`);
      console.log(`  URL: ${p.image_url}\n`);
    }
  }

  console.log(`Total brand/URL mismatches found: ${mismatchCount} / ${prods.rows.length}`);
  await pool.end();
}

main().catch(console.error);
