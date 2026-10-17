-- SUPABASE FULL SCHEMA FOR BADMINTON-SHOP
-- Generated for easy one-click execution in Supabase SQL Editor


-- ==========================================
-- FILE: V1__init_identity_schema.sql
-- ==========================================
-- =========================================================================
-- V1: IDENTITY & DYNAMIC RBAC SCHEMA
-- =========================================================================

CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(100) PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id VARCHAR(50) NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(100) NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions(permission_id);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL REFERENCES roles(id) ON UPDATE CASCADE,
    branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_branch_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, branch_id)
);


-- ==========================================
-- FILE: V2__init_catalog_schema.sql
-- ==========================================
-- =========================================================================
-- V2: CATALOG SCHEMA
-- =========================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    country VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id),
    brand_id UUID NOT NULL REFERENCES brands(id),
    base_price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    description TEXT,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku_code VARCHAR(100) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    weight_grip VARCHAR(50),
    color VARCHAR(100),
    price DECIMAL(12, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    angle VARCHAR(20) NOT NULL CHECK (angle IN ('FRONT', 'BACK', 'SIDE', 'HEAD', 'THROAT', 'GRIP', 'DETAIL')),
    image_url TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, angle)
);

CREATE TABLE IF NOT EXISTS product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    balance_point_mm INT,
    balance_category VARCHAR(50),
    shaft_stiffness VARCHAR(50),
    weight_grip VARCHAR(50),
    max_tension_lbs INT,
    max_tension_kg NUMERIC(4,1),
    length_mm INT DEFAULT 675,
    frame_shape VARCHAR(50),
    play_style VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT,
    position VARCHAR(50) DEFAULT 'HOME_MAIN',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- FILE: V3__init_operations_schema.sql
-- ==========================================
-- =========================================================================
-- V3: INVENTORY, ORDER, SECONDHAND & WARRANTY SCHEMA
-- =========================================================================

-- 1. INVENTORY
CREATE TABLE IF NOT EXISTS stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    item_type VARCHAR(20) DEFAULT 'STANDARD',
    on_hand INT NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
    reserved INT NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reserved_lte_on_hand CHECK (reserved <= on_hand),
    CONSTRAINT chk_unique_item_qty CHECK (item_type != 'UNIQUE' OR on_hand <= 1),
    UNIQUE(branch_id, sku)
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    movement_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    reference_id VARCHAR(100),
    reason TEXT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfers (
    id VARCHAR(50) PRIMARY KEY,
    from_branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    to_branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    received_quantity INT DEFAULT 0,
    discrepancy_quantity INT DEFAULT 0,
    discrepancy_reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    created_by VARCHAR(100) NOT NULL,
    approved_by VARCHAR(100),
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. ORDERS & PAYMENTS
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    customer_id UUID,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT,
    fulfillment_type VARCHAR(30) NOT NULL,
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    pickup_code VARCHAR(20),
    payment_method VARCHAR(30) NOT NULL,
    total_amount BIGINT NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_RESERVATION',
    idempotency_key VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS order_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    unit_price_snapshot BIGINT NOT NULL CHECK (unit_price_snapshot >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    subtotal BIGINT NOT NULL,
    warranty_policy_snapshot TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(30) NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    vietqr_payload TEXT,
    transaction_ref VARCHAR(100),
    confirmed_by VARCHAR(100),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount BIGINT NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
    requested_by VARCHAR(100) NOT NULL,
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. SECONDHAND
CREATE TABLE IF NOT EXISTS buyback_price_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    age_group VARCHAR(50) NOT NULL,
    base_price BIGINT NOT NULL CHECK (base_price > 0),
    valid_from DATE NOT NULL,
    valid_to DATE,
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buyback_cases (
    id VARCHAR(50) PRIMARY KEY,
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    staff_id VARCHAR(100) NOT NULL,
    seller_name VARCHAR(255) NOT NULL,
    seller_phone VARCHAR(20) NOT NULL,
    seller_id_card_masked VARCHAR(50) NOT NULL,
    racket_model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    checklist_json TEXT NOT NULL,
    grade VARCHAR(10) NOT NULL,
    auth_status VARCHAR(30) NOT NULL,
    base_price_snapshot BIGINT NOT NULL,
    adjusted_price BIGINT NOT NULL,
    adjustment_reason TEXT,
    manager_approval_required BOOLEAN DEFAULT FALSE,
    manager_approved_by VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    payment_method VARCHAR(20),
    payment_ref VARCHAR(100),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS secondhand_units (
    id VARCHAR(50) PRIMARY KEY,
    buyback_case_id VARCHAR(50) NOT NULL REFERENCES buyback_cases(id) ON DELETE CASCADE,
    serial_number VARCHAR(100),
    model_name VARCHAR(100) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    resale_price BIGINT NOT NULL CHECK (resale_price > 0),
    warranty_days INT NOT NULL DEFAULT 30,
    condition_notes TEXT,
    images_json TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PURCHASED',
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1
);

-- 4. WARRANTY
CREATE TABLE IF NOT EXISTS warranty_policies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    coverage_type VARCHAR(50) NOT NULL,
    duration_months INT NOT NULL,
    terms_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS warranty_claims (
    id VARCHAR(50) PRIMARY KEY,
    order_code VARCHAR(50) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    serial_number VARCHAR(100),
    product_name VARCHAR(255) NOT NULL,
    policy_snapshot TEXT NOT NULL,
    damage_description TEXT NOT NULL,
    images_json TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED',
    rejection_reason TEXT,
    resolution_type VARCHAR(50),
    assigned_technician VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claim_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id VARCHAR(50) NOT NULL REFERENCES warranty_claims(id) ON DELETE CASCADE,
    from_status VARCHAR(50) NOT NULL,
    to_status VARCHAR(50) NOT NULL,
    actor VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- FILE: V4__seed_master_data.sql
-- ==========================================
-- =========================================================================
-- V4: SEED MASTER & SAMPLE DATA
-- =========================================================================

-- 1. Branches
INSERT INTO branches (id, name, city, address) VALUES
('BR_HCM_01', 'Smash Court — Quận 1', 'TP. Hồ Chí Minh', '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1'),
('BR_HN_01', 'Smash Court — Cầu Giấy', 'Hà Nội', '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy'),
('BR_DN_01', 'Smash Court — Hải Châu', 'Đà Nẵng', '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu'),
('ALL', 'Toàn quốc (Tất cả chi nhánh)', 'Toàn quốc', 'Quản trị tập trung toàn hệ thống')
ON CONFLICT (id) DO NOTHING;

-- 2. Roles
INSERT INTO roles (id, name, description, is_system) VALUES
('ADMIN', 'Tổng Quản trị viên', 'Toàn quyền điều hành mọi phân hệ, cấu hình hệ thống và phân quyền', true),
('BRANCH_MANAGER', 'Quản lý Chi nhánh', 'Phê duyệt thu mua vợt cũ, mở bán lại, duyệt bảo hành và đối soát chi nhánh', true),
('STAFF', 'Nhân viên Bán hàng', 'Xử lý đơn quầy, tiếp nhận thu mua, kiểm định sơ bộ và điều chuyển kho', true),
('CUSTOMER', 'Khách hàng Thành viên', 'Duyệt mua hàng, đặt chỗ vợt cũ, quản lý sổ bảo hành điện tử', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Permissions
INSERT INTO permissions (id, code, module, category, name, description) VALUES
('dashboard:view', 'dashboard:view', 'DASHBOARD', 'DASHBOARD', 'Xem Tổng quan Vận hành', 'Truy cập trang chủ /admin và xem thống kê KPI'),
('orders:view', 'orders:view', 'ORDERS', 'ORDERS', 'Xem Danh sách Đơn hàng', 'Tra cứu danh sách đơn hàng toàn hệ thống hoặc chi nhánh'),
('orders:process', 'orders:process', 'ORDERS', 'ORDERS', 'Xử lý Tiến độ Đơn hàng', 'Xác nhận đơn, chuẩn bị hàng (PREPARE), giao hàng'),
('orders:reconcile_vietqr', 'orders:reconcile_vietqr', 'ORDERS', 'ORDERS', 'Đối soát Thanh toán VietQR', 'Nhập mã ngân hàng, xác nhận đơn đã thanh toán'),
('orders:cancel', 'orders:cancel', 'ORDERS', 'ORDERS', 'Hủy Đơn hàng Chi nhánh', 'Thao tác hủy đơn khi chưa xử lý'),
('inventory:view', 'inventory:view', 'INVENTORY', 'INVENTORY', 'Xem Tồn kho & Điều chuyển', 'Xem danh sách tồn kho chi nhánh và các phiếu chuyển'),
('inventory:transfer_create', 'inventory:transfer_create', 'INVENTORY', 'INVENTORY', 'Lập Phiếu Điều chuyển Kho', 'Tạo yêu cầu điều chuyển hàng giữa các chi nhánh'),
('inventory:transfer_dispatch', 'inventory:transfer_dispatch', 'INVENTORY', 'INVENTORY', 'Xuất Kho Điều chuyển', 'Xuất hàng chuyển sang IN_TRANSIT, trừ kho gửi'),
('inventory:transfer_receive', 'inventory:transfer_receive', 'INVENTORY', 'INVENTORY', 'Nhận Hàng Điều chuyển', 'Nhận hàng tại chi nhánh đích, ghi nhận chênh lệch'),
('secondhand:view', 'secondhand:view', 'SECONDHAND', 'SECONDHAND', 'Xem Hồ sơ Thu mua & Kho Vợt Cũ', 'Tra cứu danh sách vợt cũ và biên bản kiểm định'),
('secondhand:intake', 'secondhand:intake', 'SECONDHAND', 'SECONDHAND', 'Tiếp nhận Kiểm định Vợt Cũ', 'Lập hồ sơ thu mua 5 điểm, phân hạng A/B/C/D'),
('secondhand:approve_price', 'secondhand:approve_price', 'SECONDHAND', 'SECONDHAND', 'Phê duyệt Giá Vượt Ngưỡng', 'Duyệt giá thu mua điều chỉnh vượt ±10%'),
('secondhand:approve_resale', 'secondhand:approve_resale', 'SECONDHAND', 'SECONDHAND', 'Phê duyệt Mở bán Niêm yết', 'Đưa vợt cũ lên sàn website công khai'),
('warranty:view', 'warranty:view', 'WARRANTY', 'WARRANTY', 'Xem Hồ sơ Tiếp nhận Bảo hành', 'Xem danh sách yêu cầu bảo hành từ khách hàng'),
('warranty:inspect', 'warranty:inspect', 'WARRANTY', 'WARRANTY', 'Kỹ thuật Tiếp nhận Giám định', 'Nhận vợt thực tế và chuyển sang INSPECTING'),
('warranty:decide', 'warranty:decide', 'WARRANTY', 'WARRANTY', 'Quyết định Kết quả Bảo hành', 'Duyệt đổi mới, sửa chữa hoặc từ chối có biên bản'),
('reviews:view', 'reviews:view', 'REVIEWS', 'REVIEWS', 'Xem Đánh giá Khách hàng', 'Xem phản hồi đánh giá sản phẩm'),
('reviews:moderate', 'reviews:moderate', 'REVIEWS', 'REVIEWS', 'Kiểm duyệt & Phản hồi Đánh giá', 'Ẩn đánh giá vi phạm hoặc trả lời khách'),
('products:view', 'products:view', 'PRODUCTS', 'PRODUCTS', 'Xem Danh sách Sản phẩm', 'Xem danh mục sản phẩm'),
('products:manage', 'products:manage', 'PRODUCTS', 'PRODUCTS', 'Quản lý Sản phẩm', 'Thêm mới hoặc cập nhật thông tin sản phẩm'),
('roles:view', 'roles:view', 'ROLES', 'ROLES', 'Xem Danh sách Vai trò & Quyền', 'Truy cập giao diện xem ma trận phân quyền'),
('roles:manage', 'roles:manage', 'ROLES', 'ROLES', 'Quản trị Phân quyền', 'Tạo vai trò mới và phân quyền')
ON CONFLICT (id) DO NOTHING;

-- 4. Role Permissions
-- ADMIN: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'ADMIN', id FROM permissions
ON CONFLICT DO NOTHING;

-- STAFF initial permissions: dashboard, orders:view, orders:process, inventory:view, secondhand:view, warranty:view
INSERT INTO role_permissions (role_id, permission_id) VALUES
('STAFF', 'dashboard:view'),
('STAFF', 'orders:view'),
('STAFF', 'orders:process'),
('STAFF', 'inventory:view'),
('STAFF', 'secondhand:view'),
('STAFF', 'warranty:view')
ON CONFLICT DO NOTHING;

-- 5. Seed Users (passwords hashed with BCrypt for 'admin123' / 'staff123')
-- $2a$10$w0fG/YhOa1N1H0JkLz0eReFj6xRkFq.8P3U9a.u2J1rCskW9t3QW2 = 'admin123'
INSERT INTO users (id, username, email, password_hash, full_name, phone, role, branch_id) VALUES
('00000000-0000-0000-0000-000000000001', 'admin', 'admin@smashcourt.vn', '$2a$10$w0fG/YhOa1N1H0JkLz0eReFj6xRkFq.8P3U9a.u2J1rCskW9t3QW2', 'Nguyễn Quản Trị', '0901234567', 'ADMIN', 'ALL'),
('00000000-0000-0000-0000-000000000002', 'staff_hcm', 'staff.hcm@smashcourt.vn', '$2a$10$w0fG/YhOa1N1H0JkLz0eReFj6xRkFq.8P3U9a.u2J1rCskW9t3QW2', 'Trần Nhân Viên', '0912345678', 'STAFF', 'BR_HCM_01'),
('00000000-0000-0000-0000-000000000003', 'customer', 'customer@gmail.com', '$2a$10$w0fG/YhOa1N1H0JkLz0eReFj6xRkFq.8P3U9a.u2J1rCskW9t3QW2', 'Lê Khách Hàng', '0987654321', 'CUSTOMER', NULL)
ON CONFLICT (username) DO NOTHING;

-- 6. Brands & Categories
INSERT INTO brands (id, name, slug, country, description) VALUES
('11111111-0000-0000-0000-000000000001', 'Yonex', 'yonex', 'Nhật Bản', 'Thương hiệu cầu lông hàng đầu thế giới'),
('11111111-0000-0000-0000-000000000002', 'Lining', 'lining', 'Trung Quốc', 'Hãng thể thao hàng đầu châu Á'),
('11111111-0000-0000-0000-000000000003', 'Victor', 'victor', 'Đài Loan', 'Thương hiệu vợt danh tiếng thế giới')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (id, name, slug, description) VALUES
('22222222-0000-0000-0000-000000000001', 'Vợt Cầu Lông', 'vot-cau-long', 'Các dòng vợt chính hãng từ Yonex, Lining, Victor'),
('22222222-0000-0000-0000-000000000002', 'Giày Cầu Lông', 'giay-cau-long', 'Giày chuyên dụng êm chân bám sân'),
('22222222-0000-0000-0000-000000000003', 'Phụ Kiện Cầu Lông', 'phu-kien-cau-long', 'Cước đan, quấn cán, túi vợt cầu lông')
ON CONFLICT (slug) DO NOTHING;

-- 7. Sample Products
INSERT INTO products (id, name, slug, category_id, brand_id, base_price, status, description, play_style, balance_category, shaft_stiffness, weight_classes) VALUES
('33333333-0000-0000-0000-000000000001', 'Vợt Cầu Lông Yonex Astrox 88D Pro', 'yonex-astrox-88d-pro', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 4250000, 'ACTIVE', 'Dòng vợt tấn công đỉnh cao dành cho người chơi chuyên nghiệp', 'Tấn công dồn dập', 'Nặng đầu (Head Heavy)', 'Cứng', '3U, 4U'),
('33333333-0000-0000-0000-000000000002', 'Vợt Cầu Lông Lining Axforce 90 Max', 'lining-axforce-90-max', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002', 4650000, 'ACTIVE', 'Cây vợt smash uy lực vượt trội của Lining', 'Thiên công', 'Nặng đầu', 'Cứng', '3U, 4U'),
('33333333-0000-0000-0000-000000000003', 'Vợt Cầu Lông Victor Thruster Ryuga II', 'victor-thruster-ryuga-ii', '22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003', 3900000, 'ACTIVE', 'Cây vợt đồng hành cùng Lee Zii Jia', 'Công thủ toàn diện', 'Hơi nặng đầu', 'Trung bình', '4U')
ON CONFLICT (slug) DO NOTHING;

-- 8. SKUs & Stock
INSERT INTO skus (id, product_id, sku_code, barcode, weight_grip, color, price) VALUES
('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'YONEX-88D-4UG5', '8938880001', '4U-G5', 'Đen / Đỏ', 4250000),
('44444444-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000002', 'LINING-AF90-4UG5', '8938880002', '4U-G5', 'Đỏ Rồng', 4650000)
ON CONFLICT (sku_code) DO NOTHING;

INSERT INTO stock_levels (branch_id, sku, item_type, on_hand, reserved) VALUES
('BR_HCM_01', 'YONEX-88D-4UG5', 'STANDARD', 15, 0),
('BR_HN_01', 'YONEX-88D-4UG5', 'STANDARD', 8, 0),
('BR_HCM_01', 'LINING-AF90-4UG5', 'STANDARD', 10, 0)
ON CONFLICT (branch_id, sku) DO NOTHING;


-- ==========================================
-- FILE: V5__extend_admin_schema.sql
-- ==========================================
-- =========================================================================
-- V5: EXTEND ADMIN SCHEMA - Bổ sung các fields còn thiếu cho quản trị
-- Chạy trên các database tương ứng (catalog_db, identity_db, order_db, warranty_db)
-- =========================================================================

-- 1. CATALOG_DB
-- 1.1 Banners: Mở rộng trường quản lý banner
ALTER TABLE banners ADD COLUMN IF NOT EXISTS badge VARCHAR(255);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS primary_cta_text VARCHAR(100) DEFAULT 'Xem ngay';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS primary_cta_link VARCHAR(255);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS secondary_cta_text VARCHAR(100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS secondary_cta_link TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS product_tag VARCHAR(255);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS product_sub VARCHAR(255);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS product_price VARCHAR(100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS features TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);

-- 1.2 Products: SEO & tags
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255);
ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 1.3 Product Reviews Table
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

-- 2. IDENTITY_DB
ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50) REFERENCES branches(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;


-- ==========================================
-- FILE: V6__init_recruitment_schema.sql
-- ==========================================
-- =========================================================================
-- V6: RECRUITMENT MANAGEMENT SCHEMA & SEED DATA
-- =========================================================================

-- 1. Job Postings (Tin tuyển dụng)
CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    branch_unit VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    position VARCHAR(150) NOT NULL,
    salary VARCHAR(100) NOT NULL,
    salary_details TEXT,
    quantity INT DEFAULT 1,
    description JSONB DEFAULT '[]'::jsonb,
    requirements JSONB DEFAULT '[]'::jsonb,
    benefits JSONB DEFAULT '[]'::jsonb,
    work_time TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_postings_branch ON job_postings(branch_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_active ON job_postings(is_active);

-- 2. Job Applications (Hồ sơ ứng viên nộp qua website)
CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    intro TEXT,
    cv_url TEXT,
    status VARCHAR(50) DEFAULT 'NEW',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_applications_branch ON job_applications(branch_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);

-- 3. Register Recruitment Permissions in Identity DB
INSERT INTO permissions (id, code, module, category, name, description) VALUES
('recruitment:view', 'recruitment:view', 'RECRUITMENT', 'RECRUITMENT', 'Xem Tin & Hồ sơ Tuyển dụng', 'Truy cập danh sách tin tuyển dụng và hồ sơ ứng tuyển của chi nhánh'),
('recruitment:manage', 'recruitment:manage', 'RECRUITMENT', 'RECRUITMENT', 'Quản lý Tuyển dụng Chi nhánh', 'Đăng tin mới, chỉnh sửa trạng thái tin và xét duyệt hồ sơ ứng viên')
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id) VALUES
('ADMIN', 'recruitment:view'),
('ADMIN', 'recruitment:manage'),
('BRANCH_MANAGER', 'recruitment:view'),
('BRANCH_MANAGER', 'recruitment:manage')
ON CONFLICT DO NOTHING;

-- 4. Seed initial job postings
INSERT INTO job_postings (id, slug, title, branch_id, branch_unit, location, position, salary, salary_details, quantity, description, requirements, benefits, work_time, image_url, is_active)
VALUES
(
    'a1000000-0000-0000-0000-000000000001',
    'smashcourt-quan-1-tuyen-dung-nhan-vien-ban-hang',
    'SmashCourt Quận 1 Tuyển Dụng Nhân Viên Bán Hàng',
    'BR_HCM_01',
    'SmashCourt Quận 1 (TP.HCM)',
    '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM',
    'Nhân viên bán hàng & Tư vấn cầu lông',
    '8 – 12 triệu/tháng',
    'Lương cứng + Thưởng doanh số cá nhân + Thưởng đan vợt (Tổng thu nhập trên 10 Triệu/tháng)',
    3,
    '["Đón tiếp khách hàng, tư vấn chuyên sâu các dòng vợt, giày và phụ kiện cầu lông chính hãng.", "Sắp xếp, vệ sinh quầy kệ, kiểm kê hàng hóa xuất nhập trong ca.", "Hỗ trợ đan vợt (được đào tạo bài bản từ cơ bản đến nâng cao trên máy điện tử chuẩn BWF).", "Thực hiện các công việc khác theo phân công của Quản lý chi nhánh."]'::jsonb,
    '["Nam/Nữ từ 18 – 28 tuổi, ngoại hình ưa nhìn, nhanh nhẹn, trung thực.", "Đam mê hoặc có hiểu biết cơ bản về bộ môn cầu lông là một lợi thế lớn.", "Kỹ năng giao tiếp tự tin, thái độ phục vụ khách hàng tận tâm, nhiệt tình.", "Có thể xoay ca linh hoạt (Ca sáng: 08:00 – 15:30, Ca chiều: 14:30 – 21:30)."]'::jsonb,
    '["Thu nhập cạnh tranh: Lương cứng + Hoa hồng bán hàng + Thưởng đan vợt + Thưởng chuyên cần.", "Được đào tạo tay nghề căng cước 4 nút chuyên nghiệp theo tiêu chuẩn quốc tế BWF.", "Chính sách mua sản phẩm vợt, phụ kiện cầu lông chính hãng với giá ưu đãi nhân viên.", "Môi trường làm việc năng động, đồng nghiệp thân thiện, giao lưu thể thao hàng tuần."]'::jsonb,
    'Xoay ca linh hoạt (Ca 1: 08:00 – 15:30 | Ca 2: 14:30 – 21:30) · Được nghỉ 1 ngày/tuần.',
    '/images/branches/branch-quan-1.png',
    TRUE
),
(
    'a1000000-0000-0000-0000-000000000002',
    'smashcourt-cau-giay-ha-noi-tuyen-dung-nhan-vien-ban-hang',
    'SmashCourt Cầu Giấy (Hà Nội) Tuyển Nhân Viên Showroom',
    'BR_HN_01',
    'SmashCourt Flagship Cầu Giấy',
    '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
    'Nhân viên bán hàng showroom',
    '7 – 11 triệu/tháng',
    'Lương cứng theo ca + Hoa hồng đơn hàng + Thưởng tháng',
    4,
    '["Tư vấn trực tiếp cho khách hàng ghé thăm showroom về các sản phẩm vợt, giày, quần áo thi đấu.", "Quản lý dữ liệu đơn hàng và hỗ trợ khách hàng đăng ký bảo hành điện tử.", "Tham gia các buổi livestream giới thiệu sản phẩm mới trên fanpage showroom."]'::jsonb,
    '["Sinh viên các trường đại học hoặc người đã tốt nghiệp tìm kiếm công việc gắn bó lâu dài.", "Thân thiện, niềm nở, có tinh thần trách nhiệm trong công việc."]'::jsonb,
    '["Thu nhập ổn định, môi trường máy lạnh sang trọng.", "Học hỏi kiến thức sản phẩm và cơ hội thăng tiến lên Trưởng ca / Quản lý."]'::jsonb,
    'Part-time hoặc Full-time linh hoạt 4 - 8 tiếng/ngày.',
    '/images/branches/branch-cau-giay.png',
    TRUE
),
(
    'a1000000-0000-0000-0000-000000000003',
    'smashcourt-hai-chau-da-nang-tuyen-dung-nhan-vien-ban-hang',
    'SmashCourt Hải Châu (Đà Nẵng) Tuyển Nhân Viên Tư Vấn & Thu Ngân',
    'BR_DN_01',
    'SmashCourt Showroom Hải Châu (Đà Nẵng)',
    '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng',
    'Nhân viên tư vấn & Thu ngân',
    '7 – 10 triệu/tháng',
    'Lương cứng + Thưởng KPI doanh số showroom Hải Châu',
    2,
    '["Thực hiện thanh toán quét mã VietQR và xuất hóa đơn cho khách.", "Hỗ trợ khách hàng lựa chọn phụ kiện cước, quấn cán, giày thi đấu.", "Bảo quản quầy thu ngân và phối hợp quản lý kho chi nhánh."]'::jsonb,
    '["Nhanh nhẹn, trung thực, cẩn thận trong việc kiểm đếm tiền và thanh toán.", "Có kỹ năng vi tính văn phòng cơ bản."]'::jsonb,
    '["Được đóng bảo hiểm đầy đủ, thưởng lễ tết theo quy chế công ty.", "Tham gia các hoạt động team-building và giải cầu lông nội bộ."]'::jsonb,
    'Xoay ca theo phân công của Quản lý chi nhánh.',
    '/images/branches/branch-hai-chau.png',
    TRUE
)
ON CONFLICT (slug) DO NOTHING;


-- ==========================================
-- FILE: V7__storefront_cms_schema.sql
-- ==========================================
-- =========================================================================
-- V7: STOREFRONT CMS & DYNAMIC UI CUSTOMIZATION SCHEMA
-- =========================================================================

-- 1. Bổ sung position và các trường cần thiết cho banners
ALTER TABLE banners ADD COLUMN IF NOT EXISTS position VARCHAR(50) DEFAULT 'HERO_SLIDER';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS badge VARCHAR(255);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image_url TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS primary_cta_text VARCHAR(100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS primary_cta_link VARCHAR(255);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS secondary_cta_text VARCHAR(100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS secondary_cta_link VARCHAR(255);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS product_tag VARCHAR(255);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS product_sub VARCHAR(255);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS product_price VARCHAR(100);
ALTER TABLE banners ADD COLUMN IF NOT EXISTS features TEXT;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE banners ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);

-- 2. Bổ sung trường hiển thị cho categories
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS tag_subtitle VARCHAR(255);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT TRUE;

-- 3. Tạo bảng quản lý Tag & Huy hiệu sản phẩm
CREATE TABLE IF NOT EXISTS product_tags (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    bg_color VARCHAR(50) DEFAULT '#DC2626',
    text_color VARCHAR(50) DEFAULT '#FFFFFF',
    icon_name VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tạo bảng Cài đặt chung Giao diện (site_settings)
CREATE TABLE IF NOT EXISTS site_settings (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    group_name VARCHAR(50) NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100)
);

-- 5. Products & Product Reviews
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


-- ==========================================
-- FILE: V8__audit_logging_schema.sql
-- ==========================================
-- =========================================================================
-- V8: AUDIT LOGGING SCHEMA & PERMISSIONS
-- Hệ thống ghi nhật ký hoạt động, an ninh và kiểm toán thao tác quản trị
-- =========================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARN', 'ERROR', 'CRITICAL'
    module VARCHAR(50) NOT NULL, -- 'AUTH', 'USERS', 'PRODUCTS', 'BANNERS', 'CATEGORIES', 'ORDERS', 'SETTINGS', 'SYSTEM'
    action VARCHAR(100) NOT NULL, -- 'LOGIN_SUCCESS', 'USER_CREATE', 'PRODUCT_UPDATE', etc.
    actor_id UUID,
    actor_name VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    actor_role VARCHAR(50) DEFAULT 'SYSTEM',
    ip_address VARCHAR(50),
    user_agent TEXT,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_name);

-- Thêm quyền logs:view cho hệ thống phân quyền RBAC
INSERT INTO permissions (id, code, module, category, name, description) VALUES
('logs:view', 'logs:view', 'SYSTEM', 'SYSTEM', 'Xem nhật ký hệ thống', 'Xem toàn bộ audit logs và lịch sử thao tác của nhân sự')
ON CONFLICT (id) DO NOTHING;

-- Cấp quyền logs:view cho vai trò ADMIN và BRANCH_MANAGER
INSERT INTO role_permissions (role_id, permission_id) VALUES
('ADMIN', 'logs:view'),
('BRANCH_MANAGER', 'logs:view')
ON CONFLICT DO NOTHING;

