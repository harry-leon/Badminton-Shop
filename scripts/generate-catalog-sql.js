const fs = require('fs');
const path = require('path');
const { categories, brands, newProducts } = require('./build-catalog-seed');

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

function generateSql() {
  const lines = [];

  lines.push('-- =========================================================================');
  lines.push('-- MILESTONE M1: CATALOG EXPANSION (100+ Products across 10 Categories)');
  lines.push('-- =========================================================================');
  lines.push('\\connect catalog_db;\n');

  lines.push('-- 1. DDL Schema Migrations');
  lines.push('ALTER TABLE skus ALTER COLUMN weight DROP NOT NULL;');
  lines.push('ALTER TABLE skus ALTER COLUMN grip_size DROP NOT NULL;');
  lines.push('ALTER TABLE skus ALTER COLUMN balance_point_mm DROP NOT NULL;');
  lines.push('ALTER TABLE skus ALTER COLUMN stiffness DROP NOT NULL;');
  lines.push('ALTER TABLE skus ALTER COLUMN max_tension_lbs DROP NOT NULL;');
  lines.push('ALTER TABLE skus ADD COLUMN IF NOT EXISTS size VARCHAR(50);');
  lines.push('ALTER TABLE skus ADD COLUMN IF NOT EXISTS color VARCHAR(50);');
  lines.push('ALTER TABLE skus ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100);');
  lines.push('ALTER TABLE products ADD COLUMN IF NOT EXISTS image_source VARCHAR(255);');
  lines.push('ALTER TABLE product_attributes ADD COLUMN IF NOT EXISTS specs_json JSONB;\n');

  lines.push('-- 2. Update image_source for existing 10 flagship racquets');
  lines.push("UPDATE products SET image_source = 'https://www.yonex.com' WHERE brand_id = 'yonex' AND image_source IS NULL;");
  lines.push("UPDATE products SET image_source = 'https://www.victorsport.com' WHERE brand_id = 'victor' AND image_source IS NULL;");
  lines.push("UPDATE products SET image_source = 'https://www.lining.com' WHERE brand_id = 'lining' AND image_source IS NULL;\n");

  lines.push('-- 3. Seed / Update Brands');
  for (const b of brands) {
    lines.push(`INSERT INTO brands (id, name, country, description) VALUES (${escapeSql(b.id)}, ${escapeSql(b.name)}, ${escapeSql(b.country)}, ${escapeSql(b.description)}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country, description = EXCLUDED.description;`);
  }
  lines.push('');

  lines.push('-- 4. Seed / Update 10 Categories');
  for (const c of categories) {
    lines.push(`INSERT INTO categories (id, name, slug) VALUES (${escapeSql(c.id)}, ${escapeSql(c.name)}, ${escapeSql(c.slug)}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;`);
  }
  lines.push('');

  lines.push('-- 5. Seed New Products & SKUs');
  lines.push('DO $$');
  lines.push('DECLARE');
  lines.push('    v_pid UUID;');
  lines.push('BEGIN');

  for (const p of newProducts) {
    lines.push(`    -- ${p.name} (${p.category_id})`);
    lines.push(`    SELECT id INTO v_pid FROM products WHERE slug = ${escapeSql(p.slug)};`);
    lines.push('    IF v_pid IS NULL THEN');
    lines.push('        v_pid := gen_random_uuid();');
    lines.push(`        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)`);
    lines.push(`        VALUES (v_pid, ${escapeSql(p.brand_id)}, ${escapeSql(p.category_id)}, ${escapeSql(p.name)}, ${escapeSql(p.slug)}, ${escapeSql(p.description)}, ${escapeSql(p.player_type)}, ${escapeSql(p.image_url)}, ${escapeSql(p.image_source)}, 12, true);`);
    lines.push('    ELSE');
    lines.push(`        UPDATE products SET name = ${escapeSql(p.name)}, brand_id = ${escapeSql(p.brand_id)}, category_id = ${escapeSql(p.category_id)}, description = ${escapeSql(p.description)}, player_type = ${escapeSql(p.player_type)}, image_url = ${escapeSql(p.image_url)}, image_source = ${escapeSql(p.image_source)} WHERE id = v_pid;`);
    lines.push('    END IF;');

    for (const s of p.skus) {
      const sizeVal = s.size ? escapeSql(s.size) : 'NULL';
      const colorVal = s.color ? escapeSql(s.color) : 'NULL';
      lines.push(`    INSERT INTO skus (id, product_id, price, is_active, size, color)`);
      lines.push(`    VALUES (${escapeSql(s.id)}, v_pid, ${s.price}, true, ${sizeVal}, ${colorVal})`);
      lines.push(`    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;`);
    }
    lines.push('');
  }

  lines.push('END $$;\n');

  lines.push('-- 6. Final verification query');
  lines.push("SELECT c.id, c.name, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id, c.name ORDER BY c.id;");

  return lines.join('\n');
}

const sql = generateSql();
const targetPath = path.join(__dirname, '..', 'infra', 'postgres', 'init-scripts', '02-catalog-expansion.sql');
fs.writeFileSync(targetPath, sql, 'utf8');
console.log('Successfully generated SQL file:', targetPath, `(${sql.length} bytes)`);
