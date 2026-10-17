const { Client } = require('../frontend/node_modules/pg');

const dbConfig = {
  host: process.env.PG_HOST || '127.0.0.1',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || '',
};

async function runSql(dbName, sql) {
  const client = new Client({ ...dbConfig, database: dbName });
  await client.connect();
  try {
    console.log(`Running migration on [${dbName}]...`);
    await client.query(sql);
    console.log(`✓ Migration on [${dbName}] completed successfully.`);
  } catch (err) {
    console.error(`✗ Error on [${dbName}]:`, err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  // 1. CATALOG_DB
  const catalogSql = `
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS badge VARCHAR(255);
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS primary_cta_text VARCHAR(100) DEFAULT 'Xem ngay';
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS secondary_cta_text VARCHAR(100);
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS secondary_cta_link TEXT;
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS product_tag VARCHAR(255);
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS product_price VARCHAR(100);
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);

    ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
    ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];

    CREATE TABLE IF NOT EXISTS product_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        customer_id UUID,
        author_name VARCHAR(255) NOT NULL,
        rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        title VARCHAR(255),
        comment TEXT,
        status VARCHAR(30) DEFAULT 'APPROVED',
        moderated_by VARCHAR(100),
        moderated_at TIMESTAMPTZ,
        is_verified_purchase BOOLEAN DEFAULT TRUE,
        reply TEXT,
        reply_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_status ON product_reviews(status);
  `;
  await runSql('catalog_db', catalogSql);

  // 2. IDENTITY_DB
  const identitySql = `
    ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

    INSERT INTO permissions (id, code, module, category, name, description) VALUES
    ('users:view', 'users:view', 'USERS', 'USERS', 'Xem danh sách nhân viên', 'Xem thông tin tài khoản nội bộ'),
    ('users:manage', 'users:manage', 'USERS', 'USERS', 'Quản lý nhân viên', 'Tạo/sửa/vô hiệu hóa tài khoản nhân viên'),
    ('branches:view', 'branches:view', 'BRANCHES', 'BRANCHES', 'Xem thông tin chi nhánh', 'Xem danh sách và thông tin chi nhánh'),
    ('branches:manage', 'branches:manage', 'BRANCHES', 'BRANCHES', 'Quản lý chi nhánh', 'Thêm/sửa/xóa thông tin chi nhánh'),
    ('banners:manage', 'banners:manage', 'BANNERS', 'BANNERS', 'Quản lý banner quảng cáo', 'Tạo/sửa/xóa banner trên trang chủ'),
    ('catalog:manage', 'catalog:manage', 'CATALOG', 'CATALOG', 'Quản lý danh mục catalog', 'CRUD thương hiệu và danh mục sản phẩm'),
    ('refunds:manage', 'refunds:manage', 'ORDERS', 'ORDERS', 'Xử lý hoàn tiền', 'Tạo và phê duyệt phiếu hoàn tiền'),
    ('warranty:manage_policies', 'warranty:manage_policies', 'WARRANTY', 'WARRANTY', 'Quản lý chính sách bảo hành', 'Thêm/sửa chính sách bảo hành sản phẩm'),
    ('buyback:manage_prices', 'buyback:manage_prices', 'SECONDHAND', 'SECONDHAND', 'Quản lý bảng giá thu mua', 'CRUD bảng giá thu mua chuẩn theo model')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'ADMIN', id FROM permissions
    ON CONFLICT DO NOTHING;
  `;
  await runSql('identity_db', identitySql);

  // 3. ORDER_DB
  const orderSql = `
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(100);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
  `;
  await runSql('order_db', orderSql);

  // 4. WARRANTY_DB
  const warrantySql = `
    ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS estimated_return_date DATE;
    ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS repair_cost BIGINT DEFAULT 0;
    ALTER TABLE warranty_claims ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50);
  `;
  await runSql('warranty_db', warrantySql);

  console.log('All migrations completed!');
}

main().catch(console.error);
