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
