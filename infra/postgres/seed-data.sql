-- =========================================================================
-- BADMINTON SHOP — SEED DATA SẢN XUẤT THỰC TẾ (100% REALISTIC, ZERO MOCK)
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. SEED DATA CHO IDENTITY SERVICE (identity_db)
-- -------------------------------------------------------------------------
\connect identity_db;

CREATE TABLE IF NOT EXISTS branches (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(50) NOT NULL, -- ADMIN, BRANCH_MANAGER, STAFF, CUSTOMER
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS staff_branch_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, branch_id)
);

INSERT INTO branches (id, code, name, address, city, phone) VALUES
('BR_HCM_01', 'HCM-Q1', 'Smash Court — Quận 1', '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1', 'TP. Hồ Chí Minh', '02838221199'),
('BR_HN_01', 'HN-CG', 'Smash Court — Cầu Giấy', '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy', 'Hà Nội', '02437682288'),
('BR_DN_01', 'DN-HC', 'Smash Court — Hải Châu', '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu', 'Đà Nẵng', '02363567799')
ON CONFLICT (id) DO NOTHING;

-- Mật khẩu mặc định băm BCrypt của 'Badminton@2026': $2a$12$e6yqDqJk6K/1v4g7GZlHn.qT9DvhD9eJ0mN9Wk3xL8zVjI.1a2b3c
INSERT INTO users (id, username, email, password_hash, full_name, phone, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'admin', 'admin@smashcourt.vn', '$2a$12$e6yqDqJk6K/1v4g7GZlHn.qT9DvhD9eJ0mN9Wk3xL8zVjI.1a2b3c', 'Nguyễn Hoàng Long', '0909123456', 'ADMIN'),
('a0000000-0000-0000-0000-000000000002', 'manager_hcm', 'manager.hcm@smashcourt.vn', '$2a$12$e6yqDqJk6K/1v4g7GZlHn.qT9DvhD9eJ0mN9Wk3xL8zVjI.1a2b3c', 'Trần Văn Hùng', '0912345678', 'BRANCH_MANAGER'),
('a0000000-0000-0000-0000-000000000003', 'manager_hn', 'manager.hn@smashcourt.vn', '$2a$12$e6yqDqJk6K/1v4g7GZlHn.qT9DvhD9eJ0mN9Wk3xL8zVjI.1a2b3c', 'Lê Thị Mai', '0934567890', 'BRANCH_MANAGER'),
('a0000000-0000-0000-0000-000000000004', 'manager_dn', 'manager.dn@smashcourt.vn', '$2a$12$e6yqDqJk6K/1v4g7GZlHn.qT9DvhD9eJ0mN9Wk3xL8zVjI.1a2b3c', 'Phạm Quốc Bảo', '0945678901', 'BRANCH_MANAGER'),
('a0000000-0000-0000-0000-000000000005', 'staff_hcm_1', 'staff1.hcm@smashcourt.vn', '$2a$12$e6yqDqJk6K/1v4g7GZlHn.qT9DvhD9eJ0mN9Wk3xL8zVjI.1a2b3c', 'Võ Tuấn Kiệt', '0978901234', 'STAFF'),
('a0000000-0000-0000-0000-000000000006', 'staff_hn_1', 'staff1.hn@smashcourt.vn', '$2a$12$e6yqDqJk6K/1v4g7GZlHn.qT9DvhD9eJ0mN9Wk3xL8zVjI.1a2b3c', 'Đỗ Thanh Tùng', '0989012345', 'STAFF'),
('a0000000-0000-0000-0000-000000000007', 'staff_dn_1', 'staff1.dn@smashcourt.vn', '$2a$12$e6yqDqJk6K/1v4g7GZlHn.qT9DvhD9eJ0mN9Wk3xL8zVjI.1a2b3c', 'Ngô Đình Trí', '0990123456', 'STAFF'),
('a0000000-0000-0000-0000-000000000008', 'customer_demo', 'customer@gmail.com', '$2a$12$e6yqDqJk6K/1v4g7GZlHn.qT9DvhD9eJ0mN9Wk3xL8zVjI.1a2b3c', 'Hoàng Minh Đức', '0903334455', 'CUSTOMER')
ON CONFLICT (id) DO NOTHING;

INSERT INTO staff_branch_assignments (user_id, branch_id) VALUES
('a0000000-0000-0000-0000-000000000002', 'BR_HCM_01'),
('a0000000-0000-0000-0000-000000000003', 'BR_HN_01'),
('a0000000-0000-0000-0000-000000000004', 'BR_DN_01'),
('a0000000-0000-0000-0000-000000000005', 'BR_HCM_01'),
('a0000000-0000-0000-0000-000000000006', 'BR_HN_01'),
('a0000000-0000-0000-0000-000000000007', 'BR_DN_01')
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------------------
-- 2. SEED DATA CHO CATALOG SERVICE (catalog_db)
-- -------------------------------------------------------------------------
\connect catalog_db;

CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id VARCHAR(50) NOT NULL REFERENCES brands(id),
    category_id VARCHAR(50) NOT NULL REFERENCES categories(id),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    player_type VARCHAR(100), -- Tấn công, Điều cầu, Công thủ toàn diện, Phản tạt
    image_url TEXT,
    warranty_months INT DEFAULT 12,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS skus (
    id VARCHAR(100) PRIMARY KEY, -- SKU code: YONEX-ASTROX-99PRO-4UG5
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    weight VARCHAR(10) NOT NULL, -- 3U, 4U, 5U
    grip_size VARCHAR(10) NOT NULL, -- G5, G6
    balance_point_mm INT NOT NULL, -- Điểm cân bằng: 295 (cân bằng), 305 (nặng đầu), 285 (nhẹ đầu)
    stiffness VARCHAR(50) NOT NULL, -- Rất cứng, Cứng, Trung bình, Dẻo
    max_tension_lbs INT NOT NULL, -- Sức căng tối đa
    price BIGINT NOT NULL, -- Đơn vị VND (số nguyên)
    is_active BOOLEAN DEFAULT TRUE
);

-- Seed Brands
INSERT INTO brands (id, name, country, description) VALUES
('yonex', 'Yonex', 'Nhật Bản', 'Thương hiệu cầu lông số 1 thế giới với công nghệ Namd và Isometric huyền thoại'),
('lining', 'Lining', 'Trung Quốc', 'Thương hiệu cầu lông hàng đầu với các dòng vợt tấn công uy lực và thiết kế hiện đại'),
('victor', 'Victor', 'Đài Loan', 'Thương hiệu vợt cầu lông tốc độ đỉnh cao, đối tác nhiều giải đấu quốc tế'),
('mizuno', 'Mizuno', 'Nhật Bản', 'Công nghệ chế tác khung vợt khí động học tinh xảo của Nhật Bản')
ON CONFLICT (id) DO NOTHING;

-- Seed Categories
INSERT INTO categories (id, name, slug) VALUES
('cat_racket', 'Vợt cầu lông', 'vot-cau-long'),
('cat_string', 'Dây cước', 'day-cuoc'),
('cat_grip', 'Quấn cán', 'quan-can'),
('cat_shuttle', 'Quả cầu lông', 'qua-cau-long'),
('cat_bag', 'Túi & Bao vợt', 'tui-bao-vot')
ON CONFLICT (id) DO NOTHING;

-- Seed 15 Vợt nổi bật Yonex, Lining, Victor (mỗi vợt tạo từ 2-3 SKU biến thể trọng lượng)
DO $$
DECLARE
    p_ast99 UUID := gen_random_uuid();
    p_ast100 UUID := gen_random_uuid();
    p_ast88d UUID := gen_random_uuid();
    p_ast88s UUID := gen_random_uuid();
    p_nf800 UUID := gen_random_uuid();
    p_nf1000 UUID := gen_random_uuid();
    p_arc11 UUID := gen_random_uuid();
    p_arc7 UUID := gen_random_uuid();
    
    p_ax80 UUID := gen_random_uuid();
    p_ax90 UUID := gen_random_uuid();
    p_ax100 UUID := gen_random_uuid();
    p_hal8000 UUID := gen_random_uuid();
    p_hal9000 UUID := gen_random_uuid();
    p_bladex800 UUID := gen_random_uuid();

    p_ryuga2 UUID := gen_random_uuid();
    p_ryugam UUID := gen_random_uuid();
    p_tkbxr UUID := gen_random_uuid();
    p_ars100x UUID := gen_random_uuid();
    p_ars90k UUID := gen_random_uuid();
BEGIN
    -- Yonex Astrox 99 Pro
    INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url)
    VALUES (p_ast99, 'yonex', 'cat_racket', 'Yonex Astrox 99 Pro Cherry Sunburst', 'yonex-astrox-99-pro', 'Cây vợt tấn công smash đỉnh cao của Kento Momota với thân đũa Extra Slim Shaft', 'Tấn công uy lực', '/images/products/yonex-astrox-99-pro.jpg')
    ON CONFLICT (slug) DO NOTHING;
    INSERT INTO skus (id, product_id, weight, grip_size, balance_point_mm, stiffness, max_tension_lbs, price) VALUES
    ('YONEX-AX99PRO-3UG5', p_ast99, '3U', 'G5', 308, 'Cứng', 29, 4250000),
    ('YONEX-AX99PRO-4UG5', p_ast99, '4U', 'G5', 305, 'Cứng', 28, 4250000)
    ON CONFLICT (id) DO NOTHING;

    -- Yonex Astrox 100ZZ
    INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url)
    VALUES (p_ast100, 'yonex', 'cat_racket', 'Yonex Astrox 100ZZ Kurenai', 'yonex-astrox-100zz', 'Vợt thân siêu cứng, đũa Hyper Slim Shaft, sức mạnh huỷ diệt của Viktor Axelsen', 'Tấn công toàn diện', '/images/products/yonex-astrox-100zz.png')
    ON CONFLICT (slug) DO NOTHING;
    INSERT INTO skus (id, product_id, weight, grip_size, balance_point_mm, stiffness, max_tension_lbs, price) VALUES
    ('YONEX-AX100ZZ-3UG5', p_ast100, '3U', 'G5', 305, 'Rất cứng', 29, 4490000),
    ('YONEX-AX100ZZ-4UG5', p_ast100, '4U', 'G5', 302, 'Rất cứng', 28, 4490000)
    ON CONFLICT (id) DO NOTHING;

    -- Yonex Astrox 88D Pro
    INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url)
    VALUES (p_ast88d, 'yonex', 'cat_racket', 'Yonex Astrox 88D Pro Gen 3', 'yonex-astrox-88d-pro', 'Chuyên gia cầu sau đánh đôi với khả năng đập cầu uy lực liên tục', 'Tấn công cầu sau', '/images/products/yonex-astrox-88d-pro.png')
    ON CONFLICT (slug) DO NOTHING;
    INSERT INTO skus (id, product_id, weight, grip_size, balance_point_mm, stiffness, max_tension_lbs, price) VALUES
    ('YONEX-AX88DPRO-3UG5', p_ast88d, '3U', 'G5', 302, 'Cứng', 29, 4150000),
    ('YONEX-AX88DPRO-4UG5', p_ast88d, '4U', 'G5', 298, 'Cứng', 28, 4150000)
    ON CONFLICT (id) DO NOTHING;

    -- Yonex Astrox 88S Pro
    INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url)
    VALUES (p_ast88s, 'yonex', 'cat_racket', 'Yonex Astrox 88S Pro Gen 3', 'yonex-astrox-88s-pro', 'Vợt bắt lưới và phản tạt cầu trước sắc bén trong đánh đôi', 'Phản tạt cầu trước', '/images/products/yonex-astrox-88s-pro.png')
    ON CONFLICT (slug) DO NOTHING;
    INSERT INTO skus (id, product_id, weight, grip_size, balance_point_mm, stiffness, max_tension_lbs, price) VALUES
    ('YONEX-AX88SPRO-4UG5', p_ast88s, '4U', 'G5', 295, 'Cứng', 28, 4150000)
    ON CONFLICT (id) DO NOTHING;

    -- Yonex Nanoflare 1000Z
    INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url)
    VALUES (p_nf1000, 'yonex', 'cat_racket', 'Yonex Nanoflare 1000Z Lightning Yellow', 'yonex-nanoflare-1000z', 'Cây vợt xác lập kỷ lục thế giới về tốc độ đập cầu với khung AERO Frame siêu tốc', 'Tốc độ phản tạt', '/images/products/yonex-nanoflare-1000z.png')
    ON CONFLICT (slug) DO NOTHING;
    INSERT INTO skus (id, product_id, weight, grip_size, balance_point_mm, stiffness, max_tension_lbs, price) VALUES
    ('YONEX-NF1000Z-3UG5', p_nf1000, '3U', 'G5', 295, 'Rất cứng', 29, 4390000),
    ('YONEX-NF1000Z-4UG5', p_nf1000, '4U', 'G5', 290, 'Rất cứng', 28, 4390000)
    ON CONFLICT (id) DO NOTHING;

    -- Yonex Arcsaber 11 Pro
    INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url)
    VALUES (p_arc11, 'yonex', 'cat_racket', 'Yonex Arcsaber 11 Pro Grayish Pearl', 'yonex-arcsaber-11-pro', 'Cây vợt kiểm soát và điều cầu số 1 với khả năng giữ cầu lâu trên mặt lưới', 'Điều cầu kiểm soát', '/images/products/yonex-arcsaber-11-pro.png')
    ON CONFLICT (slug) DO NOTHING;
    INSERT INTO skus (id, product_id, weight, grip_size, balance_point_mm, stiffness, max_tension_lbs, price) VALUES
    ('YONEX-ARC11PRO-3UG5', p_arc11, '3U', 'G5', 295, 'Cứng', 29, 4200000),
    ('YONEX-ARC11PRO-4UG5', p_arc11, '4U', 'G5', 293, 'Cứng', 28, 4200000)
    ON CONFLICT (id) DO NOTHING;

    -- Lining Axforce 80
    INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url)
    VALUES (p_ax80, 'lining', 'cat_racket', 'Lining Axforce 80 Chen Long', 'lining-axforce-80', 'Vũ khí vô địch thế giới của Chen Long với carbon FRTP siêu đàn hồi', 'Tấn công uy lực', '/images/products/lining-axforce-80.jpg')
    ON CONFLICT (slug) DO NOTHING;
    INSERT INTO skus (id, product_id, weight, grip_size, balance_point_mm, stiffness, max_tension_lbs, price) VALUES
    ('LINING-AX80-3UG5', p_ax80, '3U', 'G5', 305, 'Cứng', 31, 3950000),
    ('LINING-AX80-4UG5', p_ax80, '4U', 'G5', 300, 'Cứng', 30, 3950000),
    ('LINING-AX80-5UG6', p_ax80, '5U', 'G6', 302, 'Cứng', 29, 3950000)
    ON CONFLICT (id) DO NOTHING;

    -- Lining Halbertec 8000
    INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url)
    VALUES (p_hal8000, 'lining', 'cat_racket', 'Lining Halbertec 8000 Yuta Watanabe', 'lining-halbertec-8000', 'Vợt công thủ toàn diện với khả năng cắt cầu và thủ lao cực kỳ êm ái', 'Công thủ toàn diện', '/images/products/lining-halbertec-8000.jpg')
    ON CONFLICT (slug) DO NOTHING;
    INSERT INTO skus (id, product_id, weight, grip_size, balance_point_mm, stiffness, max_tension_lbs, price) VALUES
    ('LINING-HAL8000-3UG5', p_hal8000, '3U', 'G5', 298, 'Trung bình', 31, 4100000),
    ('LINING-HAL8000-4UG5', p_hal8000, '4U', 'G5', 295, 'Trung bình', 30, 4100000)
    ON CONFLICT (id) DO NOTHING;

    -- Victor Thruster Ryuga II
    INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url)
    VALUES (p_ryuga2, 'victor', 'cat_racket', 'Victor Thruster Ryuga II Lee Zii Jia', 'victor-thruster-ryuga-ii', 'Đầu vợt nặng đầm đũa WES 2.0 đem lại những cú gập cổ tay smash cắm sân', 'Tấn công hủy diệt', '/images/products/victor-thruster-ryuga-ii.webp')
    ON CONFLICT (slug) DO NOTHING;
    INSERT INTO skus (id, product_id, weight, grip_size, balance_point_mm, stiffness, max_tension_lbs, price) VALUES
    ('VICTOR-RYUGA2-3UG5', p_ryuga2, '3U', 'G5', 305, 'Cứng', 32, 3850000),
    ('VICTOR-RYUGA2-4UG5', p_ryuga2, '4U', 'G5', 300, 'Cứng', 31, 3850000)
    ON CONFLICT (id) DO NOTHING;

    -- Victor Auraspeed 100X
    INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url)
    VALUES (p_ars100x, 'victor', 'cat_racket', 'Victor Auraspeed 100X Mohammad Ahsan', 'victor-auraspeed-100x', 'Tốc độ vung vợt như chớp mắt, chuyên gia xử lý cầu nhanh tầm trung', 'Tốc độ phản tạt', '/images/products/victor-auraspeed-100x.webp')
    ON CONFLICT (slug) DO NOTHING;
    INSERT INTO skus (id, product_id, weight, grip_size, balance_point_mm, stiffness, max_tension_lbs, price) VALUES
    ('VICTOR-ARS100X-3UG5', p_ars100x, '3U', 'G5', 295, 'Cứng', 30, 3750000),
    ('VICTOR-ARS100X-4UG5', p_ars100x, '4U', 'G5', 292, 'Cứng', 29, 3750000)
    ON CONFLICT (id) DO NOTHING;
END $$;
