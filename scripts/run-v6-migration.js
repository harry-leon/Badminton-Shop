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
    console.log(`Running V6 migration on [${dbName}]...`);
    await client.query(sql);
    console.log(`✓ Migration on [${dbName}] completed successfully.`);
  } catch (err) {
    console.error(`✗ Error on [${dbName}]:`, err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  // 1. INVENTORY_DB: Purchase Orders (Nhập kho từ NCC)
  const inventorySql = `
    CREATE TABLE IF NOT EXISTS purchase_orders (
        id VARCHAR(50) PRIMARY KEY,
        branch_id VARCHAR(50) NOT NULL,
        supplier_name VARCHAR(255) NOT NULL,
        total_items INT NOT NULL DEFAULT 0,
        total_cost BIGINT DEFAULT 0,
        status VARCHAR(30) DEFAULT 'DRAFT',
        notes TEXT,
        created_by VARCHAR(100) NOT NULL,
        approved_by VARCHAR(100),
        received_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS purchase_order_lines (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        po_id VARCHAR(50) NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
        sku VARCHAR(100) NOT NULL,
        ordered_qty INT NOT NULL,
        received_qty INT DEFAULT 0,
        unit_cost BIGINT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Seed 2 PO mẫu
    INSERT INTO purchase_orders (id, branch_id, supplier_name, total_items, total_cost, status, notes, created_by, approved_by, received_at)
    VALUES 
    ('PO_2026_001', 'BR_HCM_01', 'Yonex Vietnam Official (Sunrise Sports)', 30, 85000000, 'RECEIVED', 'Lô vợt Astrox 99 Pro và 88D Pro thi đấu', 'manager_hcm', 'admin', NOW() - INTERVAL '3 days'),
    ('PO_2026_002', 'BR_HN_01', 'Victor Rackets Co. LTD', 20, 48000000, 'APPROVED', 'Đơn hàng giày thi đấu Victor P9200III và cước VBS-66', 'manager_hn', 'admin', NULL)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO purchase_order_lines (po_id, sku, ordered_qty, received_qty, unit_cost)
    VALUES
    ('PO_2026_001', 'YONEX-AX99PRO-4UG5', 15, 15, 3100000),
    ('PO_2026_001', 'YONEX-AX88DPRO-4UG5', 15, 15, 2900000),
    ('PO_2026_002', 'VICTOR-TK-RYUGAII-4U', 20, 0, 2400000)
    ON CONFLICT DO NOTHING;
  `;
  await runSql('inventory_db', inventorySql);

  // 2. ORDER_DB: Stringing Orders (Phiếu đan cước vợt chuẩn BWF)
  const orderSql = `
    CREATE TABLE IF NOT EXISTS stringing_orders (
        id VARCHAR(50) PRIMARY KEY,
        order_code VARCHAR(50) UNIQUE,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        branch_id VARCHAR(50) NOT NULL,
        racket_model VARCHAR(255) NOT NULL,
        string_type VARCHAR(100) NOT NULL,
        tension_lbs NUMERIC(4,1) NOT NULL,
        knot_type VARCHAR(50) DEFAULT '4_KNOTS_BWF',
        technician_name VARCHAR(100),
        price BIGINT NOT NULL DEFAULT 120000,
        status VARCHAR(30) DEFAULT 'RECEIVED',
        notes TEXT,
        created_by VARCHAR(100),
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    -- Seed 3 phiếu căng cước mẫu
    INSERT INTO stringing_orders (id, order_code, customer_name, customer_phone, branch_id, racket_model, string_type, tension_lbs, knot_type, technician_name, price, status, notes, created_by)
    VALUES
    ('STR_001', 'STR-2026-0001', 'Nguyễn Văn Hùng', '0912345678', 'BR_HCM_01', 'Yonex Astrox 100ZZ', 'Yonex BG65Ti', 26.5, '4_KNOTS_BWF', 'Trần Kỹ Thuật', 140000, 'READY', 'Khách hẹn lấy lúc 17h, căng 4 nút BWF chuẩn', 'staff_hcm_1'),
    ('STR_002', 'STR-2026-0002', 'Lê Hoàng Nam', '0987654321', 'BR_HCM_01', 'Victor Thruster Ryuga II', 'Yonex Exbolt 65', 25.0, '4_KNOTS_BWF', 'Trần Kỹ Thuật', 160000, 'STRINGING', 'Đang căng máy điện tử Yonex Precision 9.0', 'staff_hcm_1'),
    ('STR_003', 'STR-2026-0003', 'Phạm Minh Đức', '0903112233', 'BR_HN_01', 'Lining Aeronaut 9000C', 'Lining No.1', 27.0, '4_KNOTS_BWF', 'Nguyễn Thợ Cước', 130000, 'COMPLETED', 'Đã trả khách, kiểm tra độ nảy hoàn hảo', 'staff_hn_1')
    ON CONFLICT (id) DO NOTHING;
  `;
  await runSql('order_db', orderSql);

  // 3. IDENTITY_DB: Permissions & Role Assignments
  const identitySql = `
    INSERT INTO permissions (id, code, module, category, name, description) VALUES
    ('customers:view', 'customers:view', 'CUSTOMERS', 'CUSTOMERS', 'Xem danh sách khách hàng', 'Xem thông tin và lịch sử mua sắm khách hàng'),
    ('customers:manage', 'customers:manage', 'CUSTOMERS', 'CUSTOMERS', 'Quản lý khách hàng', 'Cập nhật hạng thành viên và ghi chú khách hàng'),
    ('purchase_orders:view', 'purchase_orders:view', 'INVENTORY', 'INVENTORY', 'Xem đơn nhập kho', 'Xem danh sách phiếu nhập kho từ nhà cung cấp'),
    ('purchase_orders:manage', 'purchase_orders:manage', 'INVENTORY', 'INVENTORY', 'Quản lý đơn nhập kho', 'Tạo và duyệt nhập kho từ NCC'),
    ('stringing:view', 'stringing:view', 'SERVICES', 'SERVICES', 'Xem dịch vụ căng cước', 'Xem danh sách phiếu đan cước tại quầy'),
    ('stringing:manage', 'stringing:manage', 'SERVICES', 'SERVICES', 'Quản lý dịch vụ căng cước', 'Tiếp nhận, gán KTV và hoàn thành đan cước'),
    ('reports:view', 'reports:view', 'REPORTS', 'REPORTS', 'Xem báo cáo doanh thu', 'Xem báo cáo thống kê và phân tích tài chính')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'ADMIN', id FROM permissions
    WHERE id IN ('customers:view','customers:manage','purchase_orders:view','purchase_orders:manage','stringing:view','stringing:manage','reports:view')
    ON CONFLICT DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'BRANCH_MANAGER', id FROM permissions
    WHERE id IN ('customers:view','purchase_orders:view','purchase_orders:manage','stringing:view','stringing:manage','reports:view')
    ON CONFLICT DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'STAFF', id FROM permissions
    WHERE id IN ('customers:view','purchase_orders:view','stringing:view','stringing:manage')
    ON CONFLICT DO NOTHING;
  `;
  await runSql('identity_db', identitySql);

  console.log('=== V6 Migration Finished Successfully ===');
}

main().catch(console.error);
