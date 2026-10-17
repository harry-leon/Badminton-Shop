const { Pool } = require('../frontend/node_modules/pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'catalog_db'
});

async function main() {
  console.log('=== VERIFICATION OF CATALOG_DB FOR M1 (C2) - PART 2 ===\n');

  // Check specs on products
  const pSpecs = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(description) as with_desc,
      COUNT(player_type) as with_player_type,
      COUNT(play_style) as with_play_style,
      COUNT(balance_category) as with_balance_cat,
      COUNT(shaft_stiffness) as with_stiffness,
      COUNT(weight_classes) as with_weights,
      COUNT(grip_sizes) as with_grip_sizes,
      COUNT(max_tension_lbs) as with_max_tension,
      COUNT(length_mm) as with_length,
      COUNT(frame_shape) as with_frame_shape,
      COUNT(level) as with_level,
      COUNT(image_url) as with_image_url,
      COUNT(image_source) as with_image_source
    FROM products;
  `);
  console.log('\nProducts specs population:', pSpecs.rows[0]);

  // Breakdown of product specs by category
  console.log('\nProduct specs breakdown by category:');
  const catSpecs = await pool.query(`
    SELECT c.id, c.name,
      COUNT(p.id) as total,
      COUNT(p.player_type) as with_player_type,
      COUNT(p.play_style) as with_play_style,
      COUNT(p.balance_category) as with_balance_cat,
      COUNT(p.shaft_stiffness) as with_stiffness,
      COUNT(p.weight_classes) as with_weights,
      COUNT(p.grip_sizes) as with_grip_sizes,
      COUNT(p.max_tension_lbs) as with_tension
    FROM categories c
    JOIN products p ON c.id = p.category_id
    GROUP BY c.id, c.name
    ORDER BY c.id;
  `);
  catSpecs.rows.forEach(r => {
    console.log(`  [${r.id}] total: ${r.total}, player_type: ${r.with_player_type}, play_style: ${r.with_play_style}, balance: ${r.with_balance_cat}, stiff: ${r.with_stiffness}, weights: ${r.with_weights}, tension: ${r.with_tension}`);
  });

  // Check SKU prices: check if any sku has price <= 0 or missing
  const skuPriceIssues = await pool.query(`
    SELECT id, product_id, price FROM skus WHERE price <= 0 OR price IS NULL;
  `);
  console.log(`\nSKUs with non-positive/null price: ${skuPriceIssues.rows.length}`);

  // Check for duplicate product names or slugs
  const dupSlugs = await pool.query(`
    SELECT slug, COUNT(*) as count FROM products GROUP BY slug HAVING COUNT(*) > 1;
  `);
  console.log(`Duplicate product slugs: ${dupSlugs.rows.length}`);

  // Check for duplicate SKU ids
  const dupSkus = await pool.query(`
    SELECT id, COUNT(*) as count FROM skus GROUP BY id HAVING COUNT(*) > 1;
  `);
  console.log(`Duplicate SKU IDs: ${dupSkus.rows.length}`);

  // Check foreign key integrity
  const invalidBrands = await pool.query(`
    SELECT p.id, p.name, p.brand_id FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    WHERE b.id IS NULL;
  `);
  console.log(`Products with invalid brand_id: ${invalidBrands.rows.length}`);

  const invalidCats = await pool.query(`
    SELECT p.id, p.name, p.category_id FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE c.id IS NULL;
  `);
  console.log(`Products with invalid category_id: ${invalidCats.rows.length}`);

  const invalidSkuProducts = await pool.query(`
    SELECT s.id, s.product_id FROM skus s
    LEFT JOIN products p ON s.product_id = p.id
    WHERE p.id IS NULL;
  `);
  console.log(`SKUs with invalid product_id: ${invalidSkuProducts.rows.length}`);

  // Detailed examination of product descriptions
  const shortDescs = await pool.query(`
    SELECT id, name, LENGTH(description) as len FROM products WHERE LENGTH(description) < 20;
  `);
  console.log(`Products with short description (<20 chars): ${shortDescs.rows.length}`);

  // Detailed examination of product names
  const emptyNames = await pool.query(`
    SELECT id, name FROM products WHERE name IS NULL OR TRIM(name) = '';
  `);
  console.log(`Products with empty name: ${emptyNames.rows.length}`);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
