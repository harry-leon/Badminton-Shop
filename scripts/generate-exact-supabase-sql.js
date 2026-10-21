const path = require('path');
const { Client } = require(path.resolve(__dirname, '../frontend/node_modules/pg'));
const fs = require('fs');

async function run() {
  const catalog = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/catalog_db' });
  const secondhand = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:5432/secondhand_db' });

  await catalog.connect();
  await secondhand.connect();

  async function getTableDDL(client, tableName) {
    const res = await client.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    const colDefs = res.rows.map(r => {
      let type = r.data_type.toUpperCase();
      if (type === 'CHARACTER VARYING') {
        type = `VARCHAR(${r.character_maximum_length || 255})`;
      } else if (type === 'USER-DEFINED') {
        type = 'TEXT';
      } else if (type === 'ARRAY') {
        type = 'TEXT[]';
      }
      let def = `    ${r.column_name} ${type}`;
      if (r.column_name === 'id' || (tableName === 'site_settings' && r.column_name === 'key')) {
        def += ' PRIMARY KEY';
      }
      return def;
    });

    return `CREATE TABLE ${tableName} (\n${colDefs.join(',\n')}\n);\n\n`;
  }

  async function dumpTable(client, tableName) {
    const res = await client.query(`SELECT * FROM ${tableName}`);
    if (res.rows.length === 0) return '';
    let out = `-- SEED DATA: ${tableName} (${res.rows.length} rows)\n`;
    for (const row of res.rows) {
      const keys = Object.keys(row);
      const cols = keys.join(', ');
      const vals = keys.map(k => {
        const v = row[k];
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'boolean') return v ? 'true' : 'false';
        if (typeof v === 'number') return v;
        if (v instanceof Date) {
          return `'${v.toISOString()}'`;
        }
        if (Array.isArray(v)) {
          if (k === 'tags') {
            if (v.length === 0) return 'ARRAY[]::text[]';
            const items = v.map(item => `'${String(item).replace(/'/g, "''")}'`).join(', ');
            return `ARRAY[${items}]::text[]`;
          }
          return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
        }
        if (typeof v === 'object') {
          return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
        }
        return `'${String(v).replace(/'/g, "''")}'`;
      }).join(', ');
      out += `INSERT INTO ${tableName} (${cols}) VALUES (${vals}) ON CONFLICT DO NOTHING;\n`;
    }
    out += '\n';
    return out;
  }

  let sql = `-- =========================================================================\n`;
  sql += `-- SUPABASE SETUP & SEED DATA (EXACT 100% SCHEMA MATCH)\n`;
  sql += `-- Copy and paste entire contents into Supabase Dashboard -> SQL Editor -> Run\n`;
  sql += `-- =========================================================================\n\n`;
  sql += `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\nCREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n`;

  sql += `-- 0. CLEAN DROP ALL OLD TABLES WITH CASCADE TO PREVENT CONFLICTS\n`;
  sql += `DROP TABLE IF EXISTS audit_logs CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS claim_events CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS refunds CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS payments CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS order_lines CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS orders CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS buyback_prices CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS buyback_cases CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS secondhand_units CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS stock_levels CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS staff_branch_assignments CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS reservations CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS product_reviews CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS product_images CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS product_attributes CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS skus CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS products CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS categories CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS brands CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS product_tags CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS banners CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS site_settings CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS role_permissions CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS permissions CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS roles CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS branches CASCADE;\n`;
  sql += `DROP TABLE IF EXISTS users CASCADE;\n\n`;

  // 1. Roles & Permissions DDL & Seed
  sql += `CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT TRUE
);\n\n`;

  sql += `INSERT INTO roles (id, name, description, is_system) VALUES
('ADMIN', 'Tổng Quản trị viên', 'Toàn quyền điều hành mọi phân hệ, cấu hình hệ thống và phân quyền', true),
('BRANCH_MANAGER', 'Quản lý Chi nhánh', 'Phê duyệt thu mua vợt cũ, mở bán lại, duyệt bảo hành và đối soát chi nhánh', true),
('STAFF', 'Nhân viên Bán hàng', 'Xử lý đơn quầy, tiếp nhận thu mua, kiểm định sơ bộ và điều chuyển kho', true),
('CUSTOMER', 'Khách hàng Thành viên', 'Duyệt mua hàng, đặt chỗ vợt cũ, quản lý sổ bảo hành điện tử', true)
ON CONFLICT (id) DO NOTHING;\n\n`;

  // Branches & Stock
  sql += `CREATE TABLE branches (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);\n\n`;

  sql += `INSERT INTO branches (id, code, name, address, city, phone) VALUES
('BR_HCM_01', 'HCM01', 'Smash Court — Quận 1 (TP.HCM)', 'Số 123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1', 'TP. Hồ Chí Minh', '0901234567'),
('BR_HN_01', 'HN01', 'Smash Court — Cầu Giấy (Hà Nội)', 'Số 45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy', 'Hà Nội', '0902345678'),
('BR_DN_01', 'DN01', 'Smash Court — Hải Châu (Đà Nẵng)', 'Số 78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu', 'Đà Nẵng', '0903456789')
ON CONFLICT (id) DO NOTHING;\n\n`;

  // DDLs from catalog_db
  sql += await getTableDDL(catalog, 'brands');
  sql += await getTableDDL(catalog, 'categories');
  sql += await getTableDDL(catalog, 'products');
  sql += await getTableDDL(catalog, 'skus');
  sql += await getTableDDL(catalog, 'product_images');
  sql += await getTableDDL(catalog, 'product_tags');
  sql += await getTableDDL(catalog, 'banners');
  sql += await getTableDDL(catalog, 'site_settings');

  // DDLs from secondhand_db
  sql += await getTableDDL(secondhand, 'secondhand_units');

  sql += `CREATE TABLE stock_levels (
    sku VARCHAR(50) NOT NULL,
    branch_id VARCHAR(50) NOT NULL,
    on_hand INT NOT NULL DEFAULT 0,
    reserved INT NOT NULL DEFAULT 0,
    PRIMARY KEY (sku, branch_id)
);\n\n`;

  // Dump data
  sql += await dumpTable(catalog, 'brands');
  sql += await dumpTable(catalog, 'categories');
  sql += await dumpTable(catalog, 'products');
  sql += await dumpTable(catalog, 'skus');
  sql += await dumpTable(catalog, 'product_images');
  sql += await dumpTable(catalog, 'product_tags');
  sql += await dumpTable(catalog, 'banners');
  sql += await dumpTable(catalog, 'site_settings');
  sql += await dumpTable(secondhand, 'secondhand_units');

  await catalog.end();
  await secondhand.end();

  const outPath = path.resolve(__dirname, '../supabase_setup.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log('SUCCESS! Generated exact match SQL:', outPath, 'Bytes:', sql.length);
}

run().catch(console.error);
