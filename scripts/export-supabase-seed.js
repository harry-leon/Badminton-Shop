const path = require('path');
const { Client } = require(path.resolve(__dirname, '../frontend/node_modules/pg'));
const fs = require('fs');

async function exportSql() {
  const catalog = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/catalog_db' });
  const secondhand = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/secondhand_db' });
  const inventory = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/inventory_db' });

  await catalog.connect();
  let sql = `-- =========================================================================\n`;
  sql += `-- SUPABASE SETUP & SEED DATA (FULL SMASH COURT DATASET)\n`;
  sql += `-- Copy and paste entire contents into Supabase Dashboard -> SQL Editor -> Run\n`;
  sql += `-- =========================================================================\n\n`;

  sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\nCREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n`;

  // 1. DDL for catalog tables
  sql += `-- 1. BRANDS & CATEGORIES\n`;
  sql += `CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL,
    description TEXT
);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id VARCHAR(50),
    image_url TEXT,
    tag_subtitle VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_featured BOOLEAN DEFAULT TRUE
);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id VARCHAR(50) NOT NULL REFERENCES brands(id),
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    player_type VARCHAR(100),
    play_style VARCHAR(50),
    play_style_code VARCHAR(30),
    balance_category VARCHAR(50),
    shaft_stiffness VARCHAR(50),
    weight_classes VARCHAR(50),
    grip_sizes VARCHAR(50),
    max_tension_lbs INT,
    max_tension_kg NUMERIC(4,1),
    length_mm INT DEFAULT 675,
    frame_shape VARCHAR(50) DEFAULT 'ISOMETRIC',
    level VARCHAR(50) DEFAULT 'Chuyên nghiệp',
    image_url TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    warranty_months INT DEFAULT 12,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS skus (
    id VARCHAR(50) PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    weight VARCHAR(10),
    grip_size VARCHAR(10),
    stiffness VARCHAR(50),
    color VARCHAR(50),
    balance_point_mm INT,
    max_tension_lbs INT,
    price DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2),
    barcode VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE
);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    angle VARCHAR(20) NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, angle)
);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS product_tags (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    bg_color VARCHAR(20),
    text_color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE
);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS banners (
    id VARCHAR(100) PRIMARY KEY,
    position VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    badge VARCHAR(100),
    description TEXT,
    primary_cta_text VARCHAR(100),
    primary_cta_link TEXT,
    secondary_cta_text VARCHAR(100),
    secondary_cta_link TEXT,
    image_url TEXT NOT NULL,
    mobile_image_url TEXT,
    product_tag VARCHAR(50),
    product_sub VARCHAR(100),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS stock_levels (
    sku VARCHAR(50) NOT NULL,
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(id),
    on_hand INT NOT NULL DEFAULT 0,
    reserved INT NOT NULL DEFAULT 0,
    PRIMARY KEY (sku, branch_id)
);\n\n`;

  sql += `CREATE TABLE IF NOT EXISTS secondhand_units (
    id VARCHAR(50) PRIMARY KEY,
    serial_number VARCHAR(100) NOT NULL,
    model_name VARCHAR(255) NOT NULL,
    brand VARCHAR(50) DEFAULT 'Yonex',
    category VARCHAR(50) DEFAULT 'cat_secondhand',
    grade VARCHAR(10) NOT NULL,
    resale_price DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2),
    images_json TEXT,
    branch_id VARCHAR(50),
    condition_notes TEXT,
    weight VARCHAR(10),
    grip VARCHAR(10),
    balance VARCHAR(50),
    status VARCHAR(50) DEFAULT 'APPROVED_FOR_SALE',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);\n\n`;

  // Function to dump data from table
  async function dumpTable(client, tableName, primaryKey = 'id') {
    const res = await client.query(`SELECT * FROM ${tableName}`);
    if (res.rows.length === 0) return '';
    let out = `-- SEED DATA: ${tableName} (${res.rows.length} rows)\n`;
    for (const row of res.rows) {
      const keys = Object.keys(row);
      const cols = keys.join(', ');
      const vals = keys.map(k => {
        const v = row[k];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'boolean' || typeof v === 'number') return v;
        if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
        return `'${String(v).replace(/'/g, "''")}'`;
      }).join(', ');
      out += `INSERT INTO ${tableName} (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
    }
    out += '\n';
    return out;
  }

  sql += await dumpTable(catalog, 'brands', 'id');
  sql += await dumpTable(catalog, 'categories', 'id');
  sql += await dumpTable(catalog, 'products', 'id');
  sql += await dumpTable(catalog, 'skus', 'id');
  sql += await dumpTable(catalog, 'product_images', 'id');
  sql += await dumpTable(catalog, 'product_tags', 'code');
  sql += await dumpTable(catalog, 'banners', 'id');
  sql += await dumpTable(catalog, 'site_settings', 'key');
  await catalog.end();

  // Secondhand
  try {
    await secondhand.connect();
    sql += await dumpTable(secondhand, 'secondhand_units', 'id');
    await secondhand.end();
  } catch (e) {
    console.log('Secondhand dump warning:', e.message);
  }

  // Inventory
  try {
    await inventory.connect();
    sql += await dumpTable(inventory, 'branches', 'id');
    sql += await dumpTable(inventory, 'stock_levels', 'sku');
    await inventory.end();
  } catch (e) {
    console.log('Inventory dump warning:', e.message);
  }

  const outPath = path.resolve(__dirname, '../supabase_setup.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log('Generated:', outPath, 'Bytes:', sql.length);
}

exportSql().catch(console.error);
