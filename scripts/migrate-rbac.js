const { Pool } = require('./frontend/node_modules/pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/identity_db' });

async function migrate() {
  const sql = `
    CREATE TABLE IF NOT EXISTS roles (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
      permission_id VARCHAR(50) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
      granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (role_id, permission_id)
    );

    INSERT INTO roles (id, name, description) VALUES
    ('ADMIN', 'Tổng quản trị viên', 'Toàn quyền điều hành mọi phân hệ, cấu hình hệ thống và phân quyền'),
    ('BRANCH_MANAGER', 'Quản lý chi nhánh', 'Phê duyệt thu mua vợt cũ, mở bán lại, duyệt bảo hành và đối soát chi nhánh'),
    ('STAFF', 'Nhân viên bán hàng', 'Xử lý đơn quầy, tiếp nhận thu mua, kiểm định sơ bộ và điều chuyển kho'),
    ('CUSTOMER', 'Khách hàng thành viên', 'Duyệt mua hàng, đặt chỗ vợt cũ, quản lý sổ bảo hành điện tử')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO permissions (id, name, category, description) VALUES
    ('inventory.view', 'Xem tồn kho', 'INVENTORY', 'Xem tồn kho thực tế và sổ cái biến động'),
    ('inventory.transfer', 'Điều chuyển kho', 'INVENTORY', 'Tạo và thực hiện xuất/nhập điều chuyển hàng'),
    ('orders.view', 'Xem đơn hàng', 'ORDERS', 'Xem danh sách đơn hàng và thông tin khách mua'),
    ('orders.process', 'Xử lý đơn hàng', 'ORDERS', 'Xác nhận đơn, đóng gói và giao hàng'),
    ('secondhand.inspect', 'Tiếp nhận thu mua', 'SECONDHAND', 'Tạo hồ sơ thu mua và đánh giá 16 tiêu chí'),
    ('secondhand.approve_price', 'Duyệt giá thu mua', 'SECONDHAND', 'Duyệt thanh toán hồ sơ có giá lệch >10%'),
    ('secondhand.approve_resale', 'Duyệt mở bán lại', 'SECONDHAND', 'Phê duyệt mở bán vợt cũ lên website'),
    ('warranty.intake', 'Tiếp nhận bảo hành', 'WARRANTY', 'Tiếp nhận và chuyển trạng thái đang giám định'),
    ('warranty.decide', 'Phán quyết bảo hành', 'WARRANTY', 'Quyết định chấp thuận đổi mới hoặc từ chối có biên bản'),
    ('roles.manage', 'Quản lý phân quyền', 'RBAC', 'Tạo vai trò mới và phân quyền động cho từng vai trò')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id)
    SELECT 'ADMIN', id FROM permissions
    ON CONFLICT DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('BRANCH_MANAGER', 'inventory.view'),
    ('BRANCH_MANAGER', 'inventory.transfer'),
    ('BRANCH_MANAGER', 'orders.view'),
    ('BRANCH_MANAGER', 'orders.process'),
    ('BRANCH_MANAGER', 'secondhand.inspect'),
    ('BRANCH_MANAGER', 'secondhand.approve_price'),
    ('BRANCH_MANAGER', 'secondhand.approve_resale'),
    ('BRANCH_MANAGER', 'warranty.intake'),
    ('BRANCH_MANAGER', 'warranty.decide')
    ON CONFLICT DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id) VALUES
    ('STAFF', 'inventory.view'),
    ('STAFF', 'inventory.transfer'),
    ('STAFF', 'orders.view'),
    ('STAFF', 'orders.process'),
    ('STAFF', 'secondhand.inspect'),
    ('STAFF', 'warranty.intake')
    ON CONFLICT DO NOTHING;
  `;

  await pool.query(sql);
  console.log('RBAC schema and seed migration complete!');
  await pool.end();
}

migrate().catch(e => {
  console.error(e);
  process.exit(1);
});
