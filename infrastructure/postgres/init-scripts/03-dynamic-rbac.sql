-- =========================================================================
-- MIGRATION: DYNAMIC RBAC TABLES FOR IDENTITY SERVICE (identity_db)
-- Milestone M3: Dynamic Admin & Dynamic RBAC
-- =========================================================================

-- 1. Bảng danh mục Vai trò (Roles)
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist if table was previously created with older schema
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'is_system') THEN
        ALTER TABLE roles ADD COLUMN is_system BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'roles' AND column_name = 'updated_at') THEN
        ALTER TABLE roles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 2. Bảng danh mục Quyền hạn chi tiết (Permissions)
CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist if table was previously created with older schema
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'code') THEN
        ALTER TABLE permissions ADD COLUMN code VARCHAR(100);
        UPDATE permissions SET code = id WHERE code IS NULL;
        ALTER TABLE permissions ALTER COLUMN code SET NOT NULL;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'permissions' AND constraint_name = 'permissions_code_key') THEN
            ALTER TABLE permissions ADD CONSTRAINT permissions_code_key UNIQUE (code);
        END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'module') THEN
        ALTER TABLE permissions ADD COLUMN module VARCHAR(50);
        UPDATE permissions SET module = COALESCE(category, 'GENERAL') WHERE module IS NULL;
        ALTER TABLE permissions ALTER COLUMN module SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'category') THEN
        ALTER TABLE permissions ADD COLUMN category VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'permissions' AND column_name = 'created_at') THEN
        ALTER TABLE permissions ADD COLUMN created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 3. Bảng phân quyền Vai trò - Quyền hạn (Role_Permissions)
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(permission_id);

-- 4. Ràng buộc toàn vẹn dữ liệu cho users.role -> roles.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_role' AND table_name = 'users'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role) REFERENCES roles(id) ON UPDATE CASCADE;
    END IF;
END $$;

-- 5. Seed 4 Vai trò hệ thống cốt lõi
INSERT INTO roles (id, name, description, is_system, created_at, updated_at) VALUES
('ADMIN', 'Tổng Quản trị viên', 'Toàn quyền điều hành mọi phân hệ, cấu hình hệ thống và phân quyền', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('BRANCH_MANAGER', 'Quản lý Chi nhánh', 'Phê duyệt thu mua vợt cũ, mở bán lại, duyệt bảo hành và đối soát chi nhánh', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('STAFF', 'Nhân viên Bán hàng', 'Xử lý đơn quầy, tiếp nhận thu mua, kiểm định sơ bộ và điều chuyển kho', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('CUSTOMER', 'Khách hàng Thành viên', 'Duyệt mua hàng, đặt chỗ vợt cũ, quản lý sổ bảo hành điện tử', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description, 
    is_system = EXCLUDED.is_system, 
    updated_at = CURRENT_TIMESTAMP;

-- Clean up any legacy dot-notation permissions
DELETE FROM permissions WHERE id LIKE '%.%';

-- 6. Seed 20 Quyền hạn Granular trải đều 7 Modules
INSERT INTO permissions (id, code, module, category, name, description, created_at) VALUES
-- Module: DASHBOARD
('dashboard:view', 'dashboard:view', 'DASHBOARD', 'DASHBOARD', 'Xem Tổng quan Vận hành', 'Truy cập trang chủ /admin và xem thống kê KPI', CURRENT_TIMESTAMP),

-- Module: ORDERS
('orders:view', 'orders:view', 'ORDERS', 'ORDERS', 'Xem Danh sách Đơn hàng', 'Tra cứu danh sách đơn hàng toàn hệ thống hoặc chi nhánh', CURRENT_TIMESTAMP),
('orders:process', 'orders:process', 'ORDERS', 'ORDERS', 'Xử lý Tiến độ Đơn hàng', 'Xác nhận đơn, chuẩn bị hàng (PREPARE), giao hàng', CURRENT_TIMESTAMP),
('orders:reconcile_vietqr', 'orders:reconcile_vietqr', 'ORDERS', 'ORDERS', 'Đối soát Thanh toán VietQR', 'Nhập mã ngân hàng, xác nhận đơn đã thanh toán (K8)', CURRENT_TIMESTAMP),
('orders:cancel', 'orders:cancel', 'ORDERS', 'ORDERS', 'Hủy Đơn hàng Chi nhánh', 'Thao tác hủy đơn khi chưa xử lý', CURRENT_TIMESTAMP),

-- Module: INVENTORY
('inventory:view', 'inventory:view', 'INVENTORY', 'INVENTORY', 'Xem Tồn kho & Điều chuyển', 'Xem danh sách tồn kho chi nhánh và các phiếu chuyển', CURRENT_TIMESTAMP),
('inventory:transfer_create', 'inventory:transfer_create', 'INVENTORY', 'INVENTORY', 'Lập Phiếu Điều chuyển Kho', 'Tạo yêu cầu điều chuyển hàng giữa các chi nhánh', CURRENT_TIMESTAMP),
('inventory:transfer_dispatch', 'inventory:transfer_dispatch', 'INVENTORY', 'INVENTORY', 'Xuất Kho Điều chuyển (R8)', 'Xuất hàng chuyển sang IN_TRANSIT, trừ kho gửi', CURRENT_TIMESTAMP),
('inventory:transfer_receive', 'inventory:transfer_receive', 'INVENTORY', 'INVENTORY', 'Nhận Hàng Điều chuyển (R8)', 'Nhận hàng tại chi nhánh đích, ghi nhận chênh lệch', CURRENT_TIMESTAMP),

-- Module: SECONDHAND
('secondhand:view', 'secondhand:view', 'SECONDHAND', 'SECONDHAND', 'Xem Hồ sơ Thu mua & Kho Vợt Cũ', 'Tra cứu danh sách vợt cũ và biên bản kiểm định', CURRENT_TIMESTAMP),
('secondhand:intake', 'secondhand:intake', 'SECONDHAND', 'SECONDHAND', 'Tiếp nhận Kiểm định Vợt Cũ', 'Lập hồ sơ thu mua 5 điểm, phân hạng A/B/C/D', CURRENT_TIMESTAMP),
('secondhand:approve_price', 'secondhand:approve_price', 'SECONDHAND', 'SECONDHAND', 'Phê duyệt Giá Vượt Ngưỡng (R5)', 'Duyệt giá thu mua điều chỉnh vượt ±10%', CURRENT_TIMESTAMP),
('secondhand:approve_resale', 'secondhand:approve_resale', 'SECONDHAND', 'SECONDHAND', 'Phê duyệt Mở bán Niêm yết (R7)', 'Đưa vợt cũ lên sàn website công khai', CURRENT_TIMESTAMP),

-- Module: WARRANTY
('warranty:view', 'warranty:view', 'WARRANTY', 'WARRANTY', 'Xem Hồ sơ Tiếp nhận Bảo hành', 'Xem danh sách yêu cầu bảo hành từ khách hàng', CURRENT_TIMESTAMP),
('warranty:inspect', 'warranty:inspect', 'WARRANTY', 'WARRANTY', 'Kỹ thuật Tiếp nhận Giám định', 'Nhận vợt thực tế và chuyển sang INSPECTING', CURRENT_TIMESTAMP),
('warranty:decide', 'warranty:decide', 'WARRANTY', 'WARRANTY', 'Quyết định Kết quả Bảo hành', 'Duyệt đổi mới, sửa chữa hoặc từ chối có biên bản (K10)', CURRENT_TIMESTAMP),

-- Module: REVIEWS
('reviews:view', 'reviews:view', 'REVIEWS', 'REVIEWS', 'Xem Đánh giá Khách hàng', 'Xem phản hồi đánh giá sản phẩm', CURRENT_TIMESTAMP),
('reviews:moderate', 'reviews:moderate', 'REVIEWS', 'REVIEWS', 'Kiểm duyệt & Phản hồi Đánh giá', 'Ẩn đánh giá vi phạm (kèm lý do) hoặc trả lời khách', CURRENT_TIMESTAMP),

-- Module: ROLES
('roles:view', 'roles:view', 'ROLES', 'ROLES', 'Xem Danh sách Vai trò & Quyền', 'Truy cập giao diện xem ma trận phân quyền /admin/roles', CURRENT_TIMESTAMP),
('roles:manage', 'roles:manage', 'ROLES', 'ROLES', 'Quản trị Phân quyền (RBAC)', 'Tạo vai trò mới, đổi tên và tick/bỏ quyền hạn', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    module = EXCLUDED.module,
    category = EXCLUDED.category,
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 7. Gán quyền mặc định cho các vai trò cốt lõi

-- ADMIN: Nhận toàn bộ 20/20 quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ADMIN', id FROM permissions
ON CONFLICT DO NOTHING;

-- BRANCH_MANAGER: 17 quyền (Tất cả ngoại trừ roles:manage, có roles:view)
INSERT INTO role_permissions (role_id, permission_id) VALUES
('BRANCH_MANAGER', 'dashboard:view'),
('BRANCH_MANAGER', 'orders:view'),
('BRANCH_MANAGER', 'orders:process'),
('BRANCH_MANAGER', 'orders:reconcile_vietqr'),
('BRANCH_MANAGER', 'orders:cancel'),
('BRANCH_MANAGER', 'inventory:view'),
('BRANCH_MANAGER', 'inventory:transfer_create'),
('BRANCH_MANAGER', 'inventory:transfer_dispatch'),
('BRANCH_MANAGER', 'inventory:transfer_receive'),
('BRANCH_MANAGER', 'secondhand:view'),
('BRANCH_MANAGER', 'secondhand:intake'),
('BRANCH_MANAGER', 'secondhand:approve_price'),
('BRANCH_MANAGER', 'secondhand:approve_resale'),
('BRANCH_MANAGER', 'warranty:view'),
('BRANCH_MANAGER', 'warranty:inspect'),
('BRANCH_MANAGER', 'warranty:decide'),
('BRANCH_MANAGER', 'reviews:view'),
('BRANCH_MANAGER', 'reviews:moderate'),
('BRANCH_MANAGER', 'roles:view')
ON CONFLICT DO NOTHING;

-- STAFF: 11 quyền tác nghiệp quầy (KHÔNG CÓ approve_price, approve_resale, warranty:decide, roles:manage, roles:view)
INSERT INTO role_permissions (role_id, permission_id) VALUES
('STAFF', 'dashboard:view'),
('STAFF', 'orders:view'),
('STAFF', 'orders:process'),
('STAFF', 'inventory:view'),
('STAFF', 'inventory:transfer_create'),
('STAFF', 'inventory:transfer_dispatch'),
('STAFF', 'secondhand:view'),
('STAFF', 'secondhand:intake'),
('STAFF', 'warranty:view'),
('STAFF', 'warranty:inspect'),
('STAFF', 'reviews:view')
ON CONFLICT DO NOTHING;

-- 8. Cập nhật mật khẩu băm BCrypt thực tế cho các tài khoản người dùng
-- Mật khẩu chuẩn: 'Badminton@2026' -> Hash BCrypt 10 rounds thực thụ:
UPDATE users 
SET password_hash = '$2b$10$DOKPAhop.047ba9vOC/OAO5fEXnZKlEE1mCKhWkBNA4cHh8WIZ2Lu'
WHERE password_hash LIKE '$2a$12$e6yqDqJk6K/1v4g7GZlHn.qT9DvhD9eJ0mN9Wk3xL8zVjI%';
