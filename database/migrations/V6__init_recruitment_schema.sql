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
    status VARCHAR(50) DEFAULT 'NEW', -- NEW, CONTACTED, INTERVIEW, HIRED, REJECTED
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

-- Grant to ADMIN (all permissions)
INSERT INTO role_permissions (role_id, permission_id) VALUES
('ADMIN', 'recruitment:view'),
('ADMIN', 'recruitment:manage')
ON CONFLICT DO NOTHING;

-- Grant to BRANCH_MANAGER
INSERT INTO role_permissions (role_id, permission_id) VALUES
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
