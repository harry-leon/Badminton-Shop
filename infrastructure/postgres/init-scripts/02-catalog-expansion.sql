-- =========================================================================
-- MILESTONE M1: CATALOG EXPANSION (100+ Products across 10 Categories)
-- =========================================================================
\connect catalog_db;

-- 1. DDL Schema Migrations
ALTER TABLE skus ALTER COLUMN weight DROP NOT NULL;
ALTER TABLE skus ALTER COLUMN grip_size DROP NOT NULL;
ALTER TABLE skus ALTER COLUMN balance_point_mm DROP NOT NULL;
ALTER TABLE skus ALTER COLUMN stiffness DROP NOT NULL;
ALTER TABLE skus ALTER COLUMN max_tension_lbs DROP NOT NULL;
ALTER TABLE skus ADD COLUMN IF NOT EXISTS size VARCHAR(50);
ALTER TABLE skus ADD COLUMN IF NOT EXISTS color VARCHAR(50);
ALTER TABLE skus ADD COLUMN IF NOT EXISTS variant_name VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_source VARCHAR(255);
ALTER TABLE product_attributes ADD COLUMN IF NOT EXISTS specs_json JSONB;

-- 2. Update image_source for existing 10 flagship racquets
UPDATE products SET image_source = 'https://www.yonex.com' WHERE brand_id = 'yonex' AND image_source IS NULL;
UPDATE products SET image_source = 'https://www.victorsport.com' WHERE brand_id = 'victor' AND image_source IS NULL;
UPDATE products SET image_source = 'https://www.lining.com' WHERE brand_id = 'lining' AND image_source IS NULL;

-- 3. Seed / Update Brands
INSERT INTO brands (id, name, country, description) VALUES ('yonex', 'Yonex', 'Nhật Bản', 'Thương hiệu cầu lông số 1 thế giới với công nghệ Namd và Isometric huyền thoại') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country, description = EXCLUDED.description;
INSERT INTO brands (id, name, country, description) VALUES ('lining', 'Lining', 'Trung Quốc', 'Thương hiệu cầu lông hàng đầu với các dòng vợt tấn công uy lực và thiết kế hiện đại') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country, description = EXCLUDED.description;
INSERT INTO brands (id, name, country, description) VALUES ('victor', 'Victor', 'Đài Loan', 'Thương hiệu vợt cầu lông tốc độ đỉnh cao, đối tác nhiều giải đấu quốc tế') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country, description = EXCLUDED.description;
INSERT INTO brands (id, name, country, description) VALUES ('mizuno', 'Mizuno', 'Nhật Bản', 'Công nghệ chế tác khung vợt khí động học tinh xảo của Nhật Bản') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country, description = EXCLUDED.description;
INSERT INTO brands (id, name, country, description) VALUES ('sodex', 'Sodex', 'Việt Nam', 'Thương hiệu dụng cụ thể thao và lưới thi đấu tiêu chuẩn quốc tế') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country, description = EXCLUDED.description;
INSERT INTO brands (id, name, country, description) VALUES ('starbalm', 'Starbalm', 'Hà Lan', 'Sản phẩm chăm sóc y tế thể thao, xịt lạnh và gel massage cơ bắp chuyên dụng') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, country = EXCLUDED.country, description = EXCLUDED.description;

-- 4. Seed / Update 10 Categories
INSERT INTO categories (id, name, slug) VALUES ('cat_racket', 'Vợt cầu lông mới chính hãng', 'vot-cau-long') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;
INSERT INTO categories (id, name, slug) VALUES ('cat_string', 'Dây cước / Cước đan vợt', 'day-cuoc') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;
INSERT INTO categories (id, name, slug) VALUES ('cat_grip', 'Quấn cán vợt', 'quan-can') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;
INSERT INTO categories (id, name, slug) VALUES ('cat_shoes', 'Giày cầu lông', 'giay-cau-long') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;
INSERT INTO categories (id, name, slug) VALUES ('cat_shuttle', 'Quả cầu lông', 'qua-cau-long') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;
INSERT INTO categories (id, name, slug) VALUES ('cat_bag', 'Túi & Bao vợt', 'tui-bao-vot') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;
INSERT INTO categories (id, name, slug) VALUES ('cat_net', 'Lưới cầu lông', 'luoi-cau-long') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;
INSERT INTO categories (id, name, slug) VALUES ('cat_apparel', 'Quần áo thể thao cầu lông', 'quan-ao') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;
INSERT INTO categories (id, name, slug) VALUES ('cat_accessory', 'Phụ kiện', 'phu-kien') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;
INSERT INTO categories (id, name, slug) VALUES ('cat_secondhand', 'Vợt cũ đã kiểm định', 'second-hand') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug;

-- 5. Seed New Products & SKUs
DO $$
DECLARE
    v_pid UUID;
BEGIN
    -- Dây cước Yonex Exbolt 68 (0.68mm) (cat_string)
    SELECT id INTO v_pid FROM products WHERE slug = 'day-cuoc-yonex-exbolt-68';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_string', 'Dây cước Yonex Exbolt 68 (0.68mm)', 'day-cuoc-yonex-exbolt-68', 'Cước đan vợt công nghệ sợi rèn Forged Fiber thế hệ mới, tối ưu hóa độ nảy và độ bền vượt trội cho các cú đập cầu uy lực.', 'Trợ lực & Độ bền', 'https://www.yonex.com/media/catalog/product/b/g/bgxb68_ex_pac_686.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dây cước Yonex Exbolt 68 (0.68mm)', brand_id = 'yonex', category_id = 'cat_string', description = 'Cước đan vợt công nghệ sợi rèn Forged Fiber thế hệ mới, tối ưu hóa độ nảy và độ bền vượt trội cho các cú đập cầu uy lực.', player_type = 'Trợ lực & Độ bền', image_url = 'https://www.yonex.com/media/catalog/product/b/g/bgxb68_ex_pac_686.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-STR-EXB68-WH', v_pid, 220000, true, NULL, 'Trắng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-STR-EXB68-BK', v_pid, 220000, true, NULL, 'Đen')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Dây cước Yonex Exbolt 65 (0.65mm) (cat_string)
    SELECT id INTO v_pid FROM products WHERE slug = 'day-cuoc-yonex-exbolt-65';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_string', 'Dây cước Yonex Exbolt 65 (0.65mm)', 'day-cuoc-yonex-exbolt-65', 'Sợi cước trợ lực nhanh, tiếng nổ đanh giòn tai, kiểm soát cầu chính xác và độ nhạy mặt lưới xuất sắc.', 'Tốc độ & Tiếng nổ', 'https://www.yonex.com/media/catalog/product/b/g/bgxb65_ex_pac_003.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dây cước Yonex Exbolt 65 (0.65mm)', brand_id = 'yonex', category_id = 'cat_string', description = 'Sợi cước trợ lực nhanh, tiếng nổ đanh giòn tai, kiểm soát cầu chính xác và độ nhạy mặt lưới xuất sắc.', player_type = 'Tốc độ & Tiếng nổ', image_url = 'https://www.yonex.com/media/catalog/product/b/g/bgxb65_ex_pac_003.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-STR-EXB65-WH', v_pid, 210000, true, NULL, 'Trắng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Dây cước Yonex Exbolt 63 (0.63mm) (cat_string)
    SELECT id INTO v_pid FROM products WHERE slug = 'day-cuoc-yonex-exbolt-63';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_string', 'Dây cước Yonex Exbolt 63 (0.63mm)', 'day-cuoc-yonex-exbolt-63', 'Dây cước siêu mảnh 0.63mm cho lực đẩy cầu tối đa, phản tạt chớp nhoáng với tiếng nổ vang vọng sân đấu.', 'Trợ lực tối đa', 'https://www.yonex.com/media/catalog/product/b/g/bgxb63_ex_pac_022.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dây cước Yonex Exbolt 63 (0.63mm)', brand_id = 'yonex', category_id = 'cat_string', description = 'Dây cước siêu mảnh 0.63mm cho lực đẩy cầu tối đa, phản tạt chớp nhoáng với tiếng nổ vang vọng sân đấu.', player_type = 'Trợ lực tối đa', image_url = 'https://www.yonex.com/media/catalog/product/b/g/bgxb63_ex_pac_022.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-STR-EXB63-YL', v_pid, 210000, true, NULL, 'Vàng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Dây cước Yonex Aerosonic (0.61mm) (cat_string)
    SELECT id INTO v_pid FROM products WHERE slug = 'day-cuoc-yonex-aerosonic';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_string', 'Dây cước Yonex Aerosonic (0.61mm)', 'day-cuoc-yonex-aerosonic', 'Cước đan mỏng nhất thế giới với đường kính chỉ 0.61mm, tạo ra âm thanh smash hủy diệt và lực đẩy phi thường.', 'Âm thanh đanh & Tốc độ', '/images/products/yonex-aerosonic.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dây cước Yonex Aerosonic (0.61mm)', brand_id = 'yonex', category_id = 'cat_string', description = 'Cước đan mỏng nhất thế giới với đường kính chỉ 0.61mm, tạo ra âm thanh smash hủy diệt và lực đẩy phi thường.', player_type = 'Âm thanh đanh & Tốc độ', image_url = '/images/products/yonex-aerosonic.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-STR-AEROSONIC-WH', v_pid, 230000, true, NULL, 'Trắng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Dây cước Yonex BG66 Force (0.65mm) (cat_string)
    SELECT id INTO v_pid FROM products WHERE slug = 'day-cuoc-yonex-bg66-force';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_string', 'Dây cước Yonex BG66 Force (0.65mm)', 'day-cuoc-yonex-bg66-force', 'Cước đan phủ lớp Quick Repulsion đàn hồi cao, giữ lực căng bền bỉ và tạo độ xoáy cắm sân khi smash.', 'Tấn công kiểm soát', 'https://www.yonex.com/media/catalog/product/b/g/bg66f_ex_pac.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dây cước Yonex BG66 Force (0.65mm)', brand_id = 'yonex', category_id = 'cat_string', description = 'Cước đan phủ lớp Quick Repulsion đàn hồi cao, giữ lực căng bền bỉ và tạo độ xoáy cắm sân khi smash.', player_type = 'Tấn công kiểm soát', image_url = 'https://www.yonex.com/media/catalog/product/b/g/bg66f_ex_pac.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-STR-BG66F-WH', v_pid, 190000, true, NULL, 'Trắng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Dây cước Yonex BG66 Ultimax (0.65mm) (cat_string)
    SELECT id INTO v_pid FROM products WHERE slug = 'day-cuoc-yonex-bg66-ultimax';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_string', 'Dây cước Yonex BG66 Ultimax (0.65mm)', 'day-cuoc-yonex-bg66-ultimax', 'Dây cước phổ biến nhất của các vận động viên đỉnh cao, cân bằng hoàn hảo giữa lực nảy, âm thanh nổ và cảm giác cầu.', 'Toàn diện đỉnh cao', 'https://www.yonex.com/media/catalog/product/b/g/bg66um_001-1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dây cước Yonex BG66 Ultimax (0.65mm)', brand_id = 'yonex', category_id = 'cat_string', description = 'Dây cước phổ biến nhất của các vận động viên đỉnh cao, cân bằng hoàn hảo giữa lực nảy, âm thanh nổ và cảm giác cầu.', player_type = 'Toàn diện đỉnh cao', image_url = 'https://www.yonex.com/media/catalog/product/b/g/bg66um_001-1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-STR-BG66UM-RD', v_pid, 190000, true, NULL, 'Đỏ')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Dây cước Yonex BG80 Power (0.68mm) (cat_string)
    SELECT id INTO v_pid FROM products WHERE slug = 'day-cuoc-yonex-bg80-power';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_string', 'Dây cước Yonex BG80 Power (0.68mm)', 'day-cuoc-yonex-bg80-power', 'Lõi sợi Vectran siêu cứng cáp, truyền tải 100% sức mạnh cổ tay thành cú đập cầu sấm sét.', 'Tấn công uy lực', 'https://www.yonex.com/media/catalog/product/b/g/bg80p_ex_pac_221006.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dây cước Yonex BG80 Power (0.68mm)', brand_id = 'yonex', category_id = 'cat_string', description = 'Lõi sợi Vectran siêu cứng cáp, truyền tải 100% sức mạnh cổ tay thành cú đập cầu sấm sét.', player_type = 'Tấn công uy lực', image_url = 'https://www.yonex.com/media/catalog/product/b/g/bg80p_ex_pac_221006.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-STR-BG80P-OR', v_pid, 200000, true, NULL, 'Cam')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Dây cước Yonex BG80 (0.68mm) (cat_string)
    SELECT id INTO v_pid FROM products WHERE slug = 'day-cuoc-yonex-bg80';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_string', 'Dây cước Yonex BG80 (0.68mm)', 'day-cuoc-yonex-bg80', 'Cước đan mặt nhám giữ cầu tốt, lực cắn cầu chuẩn xác thích hợp cho người chơi lối đánh tấn công smash uy lực.', 'Cắn cầu & Tấn công', 'https://www.yonex.com/media/catalog/product/b/g/bg80yx_004-1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dây cước Yonex BG80 (0.68mm)', brand_id = 'yonex', category_id = 'cat_string', description = 'Cước đan mặt nhám giữ cầu tốt, lực cắn cầu chuẩn xác thích hợp cho người chơi lối đánh tấn công smash uy lực.', player_type = 'Cắn cầu & Tấn công', image_url = 'https://www.yonex.com/media/catalog/product/b/g/bg80yx_004-1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-STR-BG80-YL', v_pid, 180000, true, NULL, 'Vàng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Dây cước Yonex Aerobite Hybrid (0.67mm / 0.61mm) (cat_string)
    SELECT id INTO v_pid FROM products WHERE slug = 'day-cuoc-yonex-aerobite-hybrid';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_string', 'Dây cước Yonex Aerobite Hybrid (0.67mm / 0.61mm)', 'day-cuoc-yonex-aerobite-hybrid', 'Cước lai 2 thành phần độc đáo đầu tiên trên thế giới, dây dọc phủ polyurethane cắn cầu cực mạnh, dây ngang siêu mảnh trợ lực.', 'Cắt cầu & Xoáy hiểm', '/images/products/yonex-aerobite.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dây cước Yonex Aerobite Hybrid (0.67mm / 0.61mm)', brand_id = 'yonex', category_id = 'cat_string', description = 'Cước lai 2 thành phần độc đáo đầu tiên trên thế giới, dây dọc phủ polyurethane cắn cầu cực mạnh, dây ngang siêu mảnh trợ lực.', player_type = 'Cắt cầu & Xoáy hiểm', image_url = '/images/products/yonex-aerobite.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-STR-AEROBITE-RDWH', v_pid, 230000, true, NULL, 'Đỏ / Trắng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Dây cước Yonex Aerobite Boost Hybrid (0.72mm / 0.61mm) (cat_string)
    SELECT id INTO v_pid FROM products WHERE slug = 'day-cuoc-yonex-aerobite-boost';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_string', 'Dây cước Yonex Aerobite Boost Hybrid (0.72mm / 0.61mm)', 'day-cuoc-yonex-aerobite-boost', 'Phiên bản Aerobite tăng cường độ bền với dây dọc Vectran 0.72mm cho những cú đập cầu siêu cắm và cắt cầu hiểm hóc.', 'Tấn công hủy diệt & Cắt cầu', '/images/products/yonex-aerobite-boost.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dây cước Yonex Aerobite Boost Hybrid (0.72mm / 0.61mm)', brand_id = 'yonex', category_id = 'cat_string', description = 'Phiên bản Aerobite tăng cường độ bền với dây dọc Vectran 0.72mm cho những cú đập cầu siêu cắm và cắt cầu hiểm hóc.', player_type = 'Tấn công hủy diệt & Cắt cầu', image_url = '/images/products/yonex-aerobite-boost.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-STR-BGABBT-GRGY', v_pid, 240000, true, NULL, 'Xám / Đỏ')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Dây cước Yonex BG65 Titanium (0.70mm) (cat_string)
    SELECT id INTO v_pid FROM products WHERE slug = 'day-cuoc-yonex-bg65-titanium';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_string', 'Dây cước Yonex BG65 Titanium (0.70mm)', 'day-cuoc-yonex-bg65-titanium', 'Phủ hợp chất Titanium hydride mang lại độ bền bỉ huyền thoại kết hợp cảm giác tiếp xúc cầu sắc nét và chắc chắn.', 'Bền bỉ số 1 & Chắc tay', 'https://www.yonex.com/media/catalog/product/b/g/bg65ti_ex_pac_221006.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dây cước Yonex BG65 Titanium (0.70mm)', brand_id = 'yonex', category_id = 'cat_string', description = 'Phủ hợp chất Titanium hydride mang lại độ bền bỉ huyền thoại kết hợp cảm giác tiếp xúc cầu sắc nét và chắc chắn.', player_type = 'Bền bỉ số 1 & Chắc tay', image_url = 'https://www.yonex.com/media/catalog/product/b/g/bg65ti_ex_pac_221006.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-STR-BG65TI-WH', v_pid, 160000, true, NULL, 'Trắng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quấn cán vợt Yonex Super Grap AC102-3 (Vỉ 3 cái) (cat_grip)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-can-yonex-super-grap-ac102-3';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_grip', 'Quấn cán vợt Yonex Super Grap AC102-3 (Vỉ 3 cái)', 'quan-can-yonex-super-grap-ac102-3', 'Dòng quấn cán số 1 thế giới với khả năng thấm hút mồ hôi vượt trội và độ bám dính êm ái tự nhiên.', 'Bám dính & Êm tay', '/images/products/yonex-ac102-3.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quấn cán vợt Yonex Super Grap AC102-3 (Vỉ 3 cái)', brand_id = 'yonex', category_id = 'cat_grip', description = 'Dòng quấn cán số 1 thế giới với khả năng thấm hút mồ hôi vượt trội và độ bám dính êm ái tự nhiên.', player_type = 'Bám dính & Êm tay', image_url = '/images/products/yonex-ac102-3.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-GRP-AC102-3-WH', v_pid, 120000, true, NULL, 'Trắng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quấn cán vợt Yonex Super Grap AC102-12 (Cuộn 12 cái) (cat_grip)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-can-yonex-super-grap-ac102-12';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_grip', 'Quấn cán vợt Yonex Super Grap AC102-12 (Cuộn 12 cái)', 'quan-can-yonex-super-grap-ac102-12', 'Cuộn 12 chiếc tiết kiệm cho vận động viên thi đấu thường xuyên, độ dày 0.6mm tiêu chuẩn quốc tế.', 'Tiết kiệm & Chuyên nghiệp', '/images/products/yonex-ac102-12.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quấn cán vợt Yonex Super Grap AC102-12 (Cuộn 12 cái)', brand_id = 'yonex', category_id = 'cat_grip', description = 'Cuộn 12 chiếc tiết kiệm cho vận động viên thi đấu thường xuyên, độ dày 0.6mm tiêu chuẩn quốc tế.', player_type = 'Tiết kiệm & Chuyên nghiệp', image_url = '/images/products/yonex-ac102-12.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-GRP-AC102-12-WH', v_pid, 430000, true, NULL, 'Trắng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quấn cán vợt Yonex Super Grap AC102EX-30 (Hộp 30 cái) (cat_grip)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-can-yonex-ac102ex-30';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_grip', 'Quấn cán vợt Yonex Super Grap AC102EX-30 (Hộp 30 cái)', 'quan-can-yonex-ac102ex-30', 'Hộp quấn cán lớn 30 cái dành cho câu lạc bộ và tuyển thủ, chất liệu Polyurethane cao cấp chống trơn tuột.', 'Câu lạc bộ & Đội tuyển', 'https://www.yonex.com/media/catalog/product/a/c/ac102ex-30_011_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quấn cán vợt Yonex Super Grap AC102EX-30 (Hộp 30 cái)', brand_id = 'yonex', category_id = 'cat_grip', description = 'Hộp quấn cán lớn 30 cái dành cho câu lạc bộ và tuyển thủ, chất liệu Polyurethane cao cấp chống trơn tuột.', player_type = 'Câu lạc bộ & Đội tuyển', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac102ex-30_011_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-GRP-AC102-30-WH', v_pid, 950000, true, NULL, 'Trắng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quấn cán gân Yonex Wave Grap AC108EX (cat_grip)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-can-gan-yonex-wave-grap-ac108ex';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_grip', 'Quấn cán gân Yonex Wave Grap AC108EX', 'quan-can-gan-yonex-wave-grap-ac108ex', 'Thiết kế gân cao su trung tâm tạo điểm tì ngón tay vững chắc, hỗ trợ tăng lực gập cổ tay khi đập cầu.', 'Gân trợ lực ngón tay', 'https://www.yonex.com/media/catalog/product/a/c/ac108ex_007_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quấn cán gân Yonex Wave Grap AC108EX', brand_id = 'yonex', category_id = 'cat_grip', description = 'Thiết kế gân cao su trung tâm tạo điểm tì ngón tay vững chắc, hỗ trợ tăng lực gập cổ tay khi đập cầu.', player_type = 'Gân trợ lực ngón tay', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac108ex_007_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-GRP-AC108EX-BK', v_pid, 65000, true, NULL, 'Đen')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quấn cán vải Cotton Yonex Towel Grip AC402EX (cat_grip)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-can-vai-yonex-towel-grip-ac402ex';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_grip', 'Quấn cán vải Cotton Yonex Towel Grip AC402EX', 'quan-can-vai-yonex-towel-grip-ac402ex', 'Chất liệu vải bông cotton 100% thấm hút mồ hôi tối đa, giải pháp số 1 cho người chơi đổ nhiều mồ hôi tay.', 'Thấm mồ hôi cực mạnh', 'https://www.yonex.com/media/catalog/product/a/c/ac402ex_004_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quấn cán vải Cotton Yonex Towel Grip AC402EX', brand_id = 'yonex', category_id = 'cat_grip', description = 'Chất liệu vải bông cotton 100% thấm hút mồ hôi tối đa, giải pháp số 1 cho người chơi đổ nhiều mồ hôi tay.', player_type = 'Thấm mồ hôi cực mạnh', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac402ex_004_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-GRP-AC402EX-YL', v_pid, 75000, true, NULL, 'Vàng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Màng xốp quấn lót cán Yonex Cushion Wrap AC380 (cat_grip)
    SELECT id INTO v_pid FROM products WHERE slug = 'mang-xop-quan-lot-can-yonex-ac380';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_grip', 'Màng xốp quấn lót cán Yonex Cushion Wrap AC380', 'mang-xop-quan-lot-can-yonex-ac380', 'Màng lót xốp mềm êm ái quấn trước khi bọc quấn cán, giúp điều chỉnh kích thước cán G5 sang G6 và giảm chấn cổ tay.', 'Giảm chấn & Êm ái', 'https://www.yonex.com/media/catalog/product/a/c/ac380_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Màng xốp quấn lót cán Yonex Cushion Wrap AC380', brand_id = 'yonex', category_id = 'cat_grip', description = 'Màng lót xốp mềm êm ái quấn trước khi bọc quấn cán, giúp điều chỉnh kích thước cán G5 sang G6 và giảm chấn cổ tay.', player_type = 'Giảm chấn & Êm ái', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac380_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-GRP-AC380', v_pid, 110000, true, NULL, 'Trong suốt')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Băng dính bịt chuôi vợt Yonex Grip End Tape AC158 (cat_grip)
    SELECT id INTO v_pid FROM products WHERE slug = 'bang-dinh-bit-chuoi-yonex-ac158';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_grip', 'Băng dính bịt chuôi vợt Yonex Grip End Tape AC158', 'bang-dinh-bit-chuoi-yonex-ac158', 'Băng dính cao su dẻo cố định phần đầu quấn cán vợt, không để lại keo bẩn và tăng tính thẩm mỹ chuyên nghiệp.', 'Phụ trợ bảo vệ cán', 'https://www.yonex.com/media/catalog/product/a/c/ac158_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Băng dính bịt chuôi vợt Yonex Grip End Tape AC158', brand_id = 'yonex', category_id = 'cat_grip', description = 'Băng dính cao su dẻo cố định phần đầu quấn cán vợt, không để lại keo bẩn và tăng tính thẩm mỹ chuyên nghiệp.', player_type = 'Phụ trợ bảo vệ cán', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac158_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-GRP-AC158', v_pid, 45000, true, NULL, 'Đen')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quấn cán vợt Victor Wet Grip GR233 (cat_grip)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-can-vot-victor-wet-grip-gr233';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_grip', 'Quấn cán vợt Victor Wet Grip GR233', 'quan-can-vot-victor-wet-grip-gr233', 'Quấn cán bề mặt ướt chống trơn trượt của Victor, công nghệ phủ màng chống thấm nước gia tăng tuổi thọ sử dụng.', 'Chống trơn trượt', 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-2014121216590334758.webp', 'https://dkjulgymkya8y.cloudfront.net', 12, true);
    ELSE
        UPDATE products SET name = 'Quấn cán vợt Victor Wet Grip GR233', brand_id = 'victor', category_id = 'cat_grip', description = 'Quấn cán bề mặt ướt chống trơn trượt của Victor, công nghệ phủ màng chống thấm nước gia tăng tuổi thọ sử dụng.', player_type = 'Chống trơn trượt', image_url = 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-2014121216590334758.webp', image_source = 'https://dkjulgymkya8y.cloudfront.net' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-GRP-GR233-BL', v_pid, 45000, true, NULL, 'Xanh dương')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quấn cán vải cotton Victor GR50 (cat_grip)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-can-vai-cotton-victor-gr50';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_grip', 'Quấn cán vải cotton Victor GR50', 'quan-can-vai-cotton-victor-gr50', 'Sợi bông tự nhiên hút ẩm nhanh chóng, cảm giác cầm đầm tay giúp các cú đánh chắc chắn trong điều kiện thời tiết nóng ẩm.', 'Hút ẩm & Đầm tay', 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-2013062510534662718.webp', 'https://dkjulgymkya8y.cloudfront.net', 12, true);
    ELSE
        UPDATE products SET name = 'Quấn cán vải cotton Victor GR50', brand_id = 'victor', category_id = 'cat_grip', description = 'Sợi bông tự nhiên hút ẩm nhanh chóng, cảm giác cầm đầm tay giúp các cú đánh chắc chắn trong điều kiện thời tiết nóng ẩm.', player_type = 'Hút ẩm & Đầm tay', image_url = 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-2013062510534662718.webp', image_source = 'https://dkjulgymkya8y.cloudfront.net' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-GRP-GR50-OR', v_pid, 55000, true, NULL, 'Cam')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quấn cán vợt Victor Ultra Grip GR262 (cat_grip)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-can-vot-victor-ultra-grip-gr262';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_grip', 'Quấn cán vợt Victor Ultra Grip GR262', 'quan-can-vot-victor-ultra-grip-gr262', 'Độ dày 0.6mm với họa tiết lỗ thoáng khí thoát nhiệt, giữ bàn tay luôn khô ráo trong những set đấu kéo dài.', 'Thoáng khí tản nhiệt', 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-2016122818254938542.webp', 'https://dkjulgymkya8y.cloudfront.net', 12, true);
    ELSE
        UPDATE products SET name = 'Quấn cán vợt Victor Ultra Grip GR262', brand_id = 'victor', category_id = 'cat_grip', description = 'Độ dày 0.6mm với họa tiết lỗ thoáng khí thoát nhiệt, giữ bàn tay luôn khô ráo trong những set đấu kéo dài.', player_type = 'Thoáng khí tản nhiệt', image_url = 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-2016122818254938542.webp', image_source = 'https://dkjulgymkya8y.cloudfront.net' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-GRP-GR262-WH', v_pid, 50000, true, NULL, 'Trắng')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quấn cán vợt Mizuno M-Grip Non-Slip (cat_grip)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-can-vot-mizuno-m-grip-non-slip';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'mizuno', 'cat_grip', 'Quấn cán vợt Mizuno M-Grip Non-Slip', 'quan-can-vot-mizuno-m-grip-non-slip', 'Hạt vi ma sát trên bề mặt giúp cầm vợt chắc chắn mà không cần dùng nhiều lực bóp cán, tiết kiệm thể lực tối ưu.', 'Ma sát hạt & Tiết kiệm lực', 'https://static.wixstatic.com/media/711e69_1aab5240a4bf4830bbfc01420fab1830~mv2.png/v1/fill/w_840,h_840,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/711e69_1aab5240a4bf4830bbfc01420fab1830~mv2.png', 'https://static.wixstatic.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quấn cán vợt Mizuno M-Grip Non-Slip', brand_id = 'mizuno', category_id = 'cat_grip', description = 'Hạt vi ma sát trên bề mặt giúp cầm vợt chắc chắn mà không cần dùng nhiều lực bóp cán, tiết kiệm thể lực tối ưu.', player_type = 'Ma sát hạt & Tiết kiệm lực', image_url = 'https://static.wixstatic.com/media/711e69_1aab5240a4bf4830bbfc01420fab1830~mv2.png/v1/fill/w_840,h_840,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/711e69_1aab5240a4bf4830bbfc01420fab1830~mv2.png', image_source = 'https://static.wixstatic.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('MIZUNO-GRP-MGRIP-BK', v_pid, 45000, true, NULL, 'Đen')
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giày cầu lông Yonex Power Cushion 65Z4 Men (cat_shoes)
    SELECT id INTO v_pid FROM products WHERE slug = 'giay-cau-long-yonex-power-cushion-65z4-men';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shoes', 'Giày cầu lông Yonex Power Cushion 65Z4 Men', 'giay-cau-long-yonex-power-cushion-65z4-men', 'Mẫu giày toàn diện huyền thoại thế hệ mới, đệm Power Cushion+ hấp thụ chấn động và hoàn trả năng lượng vận động hoàn hảo.', 'Toàn diện & Giảm chấn', 'https://www.yonex.com/media/catalog/product/a/l/all_shb65z4m1_011-1_.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Giày cầu lông Yonex Power Cushion 65Z4 Men', brand_id = 'yonex', category_id = 'cat_shoes', description = 'Mẫu giày toàn diện huyền thoại thế hệ mới, đệm Power Cushion+ hấp thụ chấn động và hoàn trả năng lượng vận động hoàn hảo.', player_type = 'Toàn diện & Giảm chấn', image_url = 'https://www.yonex.com/media/catalog/product/a/l/all_shb65z4m1_011-1_.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-65Z4M-40', v_pid, 2850000, true, '40', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-65Z4M-41', v_pid, 2850000, true, '41', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-65Z4M-42', v_pid, 2850000, true, '42', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giày cầu lông Yonex Power Cushion 65Z4 Wide Form Rộng (cat_shoes)
    SELECT id INTO v_pid FROM products WHERE slug = 'giay-cau-long-yonex-power-cushion-65z4-wide';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shoes', 'Giày cầu lông Yonex Power Cushion 65Z4 Wide Form Rộng', 'giay-cau-long-yonex-power-cushion-65z4-wide', 'Thiết kế form chân bè 4E đặc trưng dành riêng cho người Châu Á, giảm áp lực lên các đầu ngón chân khi di chuyển đảo hướng.', 'Chân bè & Thoải mái', 'https://www.yonex.com/media/catalog/product/a/l/all_shb65z4w1_011-1_.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Giày cầu lông Yonex Power Cushion 65Z4 Wide Form Rộng', brand_id = 'yonex', category_id = 'cat_shoes', description = 'Thiết kế form chân bè 4E đặc trưng dành riêng cho người Châu Á, giảm áp lực lên các đầu ngón chân khi di chuyển đảo hướng.', player_type = 'Chân bè & Thoải mái', image_url = 'https://www.yonex.com/media/catalog/product/a/l/all_shb65z4w1_011-1_.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-65Z4W-41', v_pid, 2850000, true, '41', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-65Z4W-42', v_pid, 2850000, true, '42', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giày cầu lông Yonex Power Cushion Aerus Z2 Men (cat_shoes)
    SELECT id INTO v_pid FROM products WHERE slug = 'giay-cau-long-yonex-power-cushion-aerus-z2-men';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shoes', 'Giày cầu lông Yonex Power Cushion Aerus Z2 Men', 'giay-cau-long-yonex-power-cushion-aerus-z2-men', 'Đôi giày nhẹ nhất lịch sử Yonex với trọng lượng chỉ 240g, thân giày đúc liền mạch Feather Bounce Foam di chuyển siêu tốc.', 'Siêu nhẹ & Tốc độ', 'https://www.yonex.com/media/catalog/product/a/l/all_shbaz2m_207-1.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Giày cầu lông Yonex Power Cushion Aerus Z2 Men', brand_id = 'yonex', category_id = 'cat_shoes', description = 'Đôi giày nhẹ nhất lịch sử Yonex với trọng lượng chỉ 240g, thân giày đúc liền mạch Feather Bounce Foam di chuyển siêu tốc.', player_type = 'Siêu nhẹ & Tốc độ', image_url = 'https://www.yonex.com/media/catalog/product/a/l/all_shbaz2m_207-1.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-AERUSZ2-41', v_pid, 2950000, true, '41', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-AERUSZ2-42', v_pid, 2950000, true, '42', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giày cầu lông Yonex Power Cushion Eclipsion Z3 Men (cat_shoes)
    SELECT id INTO v_pid FROM products WHERE slug = 'giay-cau-long-yonex-power-cushion-eclipsion-z3-men';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shoes', 'Giày cầu lông Yonex Power Cushion Eclipsion Z3 Men', 'giay-cau-long-yonex-power-cushion-eclipsion-z3-men', 'Hệ thống đĩa đỡ gót chân Lateral Shell chống lật cổ chân tuyệt đối, đế cao su bám sân vững vàng trong các pha cứu cầu khẩn cấp.', 'Ổn định & Chống lật cổ chân', 'https://www.yonex.com/media/catalog/product/a/l/all_shbelz3m_532-1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Giày cầu lông Yonex Power Cushion Eclipsion Z3 Men', brand_id = 'yonex', category_id = 'cat_shoes', description = 'Hệ thống đĩa đỡ gót chân Lateral Shell chống lật cổ chân tuyệt đối, đế cao su bám sân vững vàng trong các pha cứu cầu khẩn cấp.', player_type = 'Ổn định & Chống lật cổ chân', image_url = 'https://www.yonex.com/media/catalog/product/a/l/all_shbelz3m_532-1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-ECLPZ3-41', v_pid, 3150000, true, '41', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-ECLPZ3-42', v_pid, 3150000, true, '42', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giày cầu lông Yonex Cascade Drive 3 (cat_shoes)
    SELECT id INTO v_pid FROM products WHERE slug = 'giay-cau-long-yonex-cascade-drive-3';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shoes', 'Giày cầu lông Yonex Cascade Drive 3', 'giay-cau-long-yonex-cascade-drive-3', 'Đệm gót Memory Foam ôm khít bàn chân, đế Radial Blade phân tán lực đồng đều cho những bước di chuyển thanh thoát.', 'Êm ái & Dẻo dai', 'https://www.yonex.com/media/catalog/product/a/l/all_shbcd3_239-1.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Giày cầu lông Yonex Cascade Drive 3', brand_id = 'yonex', category_id = 'cat_shoes', description = 'Đệm gót Memory Foam ôm khít bàn chân, đế Radial Blade phân tán lực đồng đều cho những bước di chuyển thanh thoát.', player_type = 'Êm ái & Dẻo dai', image_url = 'https://www.yonex.com/media/catalog/product/a/l/all_shbcd3_239-1.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-CSDRV3-41', v_pid, 2350000, true, '41', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-CSDRV3-42', v_pid, 2350000, true, '42', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giày cầu lông Yonex Cascade Accel (cat_shoes)
    SELECT id INTO v_pid FROM products WHERE slug = 'giay-cau-long-yonex-cascade-accel';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shoes', 'Giày cầu lông Yonex Cascade Accel', 'giay-cau-long-yonex-cascade-accel', 'Thiết kế trẻ trung năng động, lưới tản nhiệt Double Russel Mesh thông thoáng khí giúp đôi chân luôn dễ chịu.', 'Trẻ trung & Thoáng mát', 'https://www.yonex.com/media/catalog/product/a/l/all_shbca2_002-1.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Giày cầu lông Yonex Cascade Accel', brand_id = 'yonex', category_id = 'cat_shoes', description = 'Thiết kế trẻ trung năng động, lưới tản nhiệt Double Russel Mesh thông thoáng khí giúp đôi chân luôn dễ chịu.', player_type = 'Trẻ trung & Thoáng mát', image_url = 'https://www.yonex.com/media/catalog/product/a/l/all_shbca2_002-1.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-CSACC-40', v_pid, 1950000, true, '40', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-CSACC-41', v_pid, 1950000, true, '41', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giày cầu lông Yonex Cascade Accel Wide (cat_shoes)
    SELECT id INTO v_pid FROM products WHERE slug = 'giay-cau-long-yonex-cascade-accel-wide';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shoes', 'Giày cầu lông Yonex Cascade Accel Wide', 'giay-cau-long-yonex-cascade-accel-wide', 'Phiên bản chân rộng của Cascade Accel, tối ưu hóa độ êm và không gây cọ xát ngón út cho bàn chân đầy đặn.', 'Chân bè & Giá tốt', 'https://www.yonex.com/media/catalog/product/a/l/all_shbca2w_039-1.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Giày cầu lông Yonex Cascade Accel Wide', brand_id = 'yonex', category_id = 'cat_shoes', description = 'Phiên bản chân rộng của Cascade Accel, tối ưu hóa độ êm và không gây cọ xát ngón út cho bàn chân đầy đặn.', player_type = 'Chân bè & Giá tốt', image_url = 'https://www.yonex.com/media/catalog/product/a/l/all_shbca2w_039-1.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-CSACCW-41', v_pid, 1950000, true, '41', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-CSACCW-42', v_pid, 1950000, true, '42', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giày cầu lông Yonex Strider Flow (cat_shoes)
    SELECT id INTO v_pid FROM products WHERE slug = 'giay-cau-long-yonex-strider-flow';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shoes', 'Giày cầu lông Yonex Strider Flow', 'giay-cau-long-yonex-strider-flow', 'Phân khúc tầm trung xuất sắc với đế Hexagrip bám sàn gỗ và sàn thảm chuyên dụng, bảo vệ khớp gối người mới chơi.', 'Người mới & Phong trào', 'https://www.yonex.com/media/catalog/product/i/n/int_shbsf1_148-1.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Giày cầu lông Yonex Strider Flow', brand_id = 'yonex', category_id = 'cat_shoes', description = 'Phân khúc tầm trung xuất sắc với đế Hexagrip bám sàn gỗ và sàn thảm chuyên dụng, bảo vệ khớp gối người mới chơi.', player_type = 'Người mới & Phong trào', image_url = 'https://www.yonex.com/media/catalog/product/i/n/int_shbsf1_148-1.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-STRDF-41', v_pid, 1450000, true, '41', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giày cầu lông Yonex Strider Beat (cat_shoes)
    SELECT id INTO v_pid FROM products WHERE slug = 'giay-cau-long-yonex-strider-beat';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shoes', 'Giày cầu lông Yonex Strider Beat', 'giay-cau-long-yonex-strider-beat', 'Trọng lượng nhẹ, đệm lót êm ái thích hợp cho học sinh, sinh viên và người tập luyện thể thao hàng ngày.', 'Tập luyện phong trào', 'https://www.yonex.com/media/catalog/product/i/n/int_shbsb1_206-1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Giày cầu lông Yonex Strider Beat', brand_id = 'yonex', category_id = 'cat_shoes', description = 'Trọng lượng nhẹ, đệm lót êm ái thích hợp cho học sinh, sinh viên và người tập luyện thể thao hàng ngày.', player_type = 'Tập luyện phong trào', image_url = 'https://www.yonex.com/media/catalog/product/i/n/int_shbsb1_206-1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHOE-STRDB-40', v_pid, 1350000, true, '40', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giày cầu lông Victor P9200III Tai Tzu Ying (cat_shoes)
    SELECT id INTO v_pid FROM products WHERE slug = 'giay-cau-long-victor-p9200iii-tai-tzu-ying';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_shoes', 'Giày cầu lông Victor P9200III Tai Tzu Ying', 'giay-cau-long-victor-p9200iii-tai-tzu-ying', 'Đôi giày thi đấu của huyền thoại Tai Tzu Ying, công nghệ đế kép EnergyMax 3.0 đàn hồi vượt trội và bọc ngón chân chống mòn.', 'Huyền thoại Tai Tzu Ying', 'https://hvshop.vn/wp-content/uploads/2023/11/giay-cau-long-victor-p9200iii-do.jpg', 'https://hvshop.vn', 12, true);
    ELSE
        UPDATE products SET name = 'Giày cầu lông Victor P9200III Tai Tzu Ying', brand_id = 'victor', category_id = 'cat_shoes', description = 'Đôi giày thi đấu của huyền thoại Tai Tzu Ying, công nghệ đế kép EnergyMax 3.0 đàn hồi vượt trội và bọc ngón chân chống mòn.', player_type = 'Huyền thoại Tai Tzu Ying', image_url = 'https://hvshop.vn/wp-content/uploads/2023/11/giay-cau-long-victor-p9200iii-do.jpg', image_source = 'https://hvshop.vn' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-SHOE-P9200-41', v_pid, 2550000, true, '41', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giày cầu lông Victor A970NitroLite (cat_shoes)
    SELECT id INTO v_pid FROM products WHERE slug = 'giay-cau-long-victor-a970nitrolite';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_shoes', 'Giày cầu lông Victor A970NitroLite', 'giay-cau-long-victor-a970nitrolite', 'Công nghệ bọt khí NitroLite siêu nhẹ giảm áp lực tối đa, hỗ trợ tăng tốc bứt phá trong tích tắc.', 'Tốc độ & Phản xạ', 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-107647_0_20231128170406.webp', 'https://dkjulgymkya8y.cloudfront.net', 12, true);
    ELSE
        UPDATE products SET name = 'Giày cầu lông Victor A970NitroLite', brand_id = 'victor', category_id = 'cat_shoes', description = 'Công nghệ bọt khí NitroLite siêu nhẹ giảm áp lực tối đa, hỗ trợ tăng tốc bứt phá trong tích tắc.', player_type = 'Tốc độ & Phản xạ', image_url = 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-107647_0_20231128170406.webp', image_source = 'https://dkjulgymkya8y.cloudfront.net' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-SHOE-A970-42', v_pid, 2850000, true, '42', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giày cầu lông Mizuno Wave Claw 2 (cat_shoes)
    SELECT id INTO v_pid FROM products WHERE slug = 'giay-cau-long-mizuno-wave-claw-2';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'mizuno', 'cat_shoes', 'Giày cầu lông Mizuno Wave Claw 2', 'giay-cau-long-mizuno-wave-claw-2', 'Công nghệ sóng Mizuno Wave độc quyền phân tán lực chấn động dọc thân giày, đế D-Flex Groove hỗ trợ xoay trở bàn chân linh hoạt.', 'Cơ động & Bám sân', 'https://luongsport.com/wp-content/uploads/2022/06/71ga211003_7d0bd6658dd245a9a47d62636640f2b2_master-1-1.jpg', 'https://luongsport.com', 12, true);
    ELSE
        UPDATE products SET name = 'Giày cầu lông Mizuno Wave Claw 2', brand_id = 'mizuno', category_id = 'cat_shoes', description = 'Công nghệ sóng Mizuno Wave độc quyền phân tán lực chấn động dọc thân giày, đế D-Flex Groove hỗ trợ xoay trở bàn chân linh hoạt.', player_type = 'Cơ động & Bám sân', image_url = 'https://luongsport.com/wp-content/uploads/2022/06/71ga211003_7d0bd6658dd245a9a47d62636640f2b2_master-1-1.jpg', image_source = 'https://luongsport.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('MIZUNO-SHOE-WAVECLAW2-41', v_pid, 2600000, true, '41', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quả cầu lông Yonex Aerosensa 50 (AS-50) (cat_shuttle)
    SELECT id INTO v_pid FROM products WHERE slug = 'qua-cau-long-yonex-aerosensa-50';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shuttle', 'Quả cầu lông Yonex Aerosensa 50 (AS-50)', 'qua-cau-long-yonex-aerosensa-50', 'Quả cầu lông thi đấu chính thức tại Thế vận hội Olympic và giải vô địch thế giới BWF, lông ngỗng tự nhiên cao cấp được chọn lọc nghiêm ngặt.', 'Tiêu chuẩn Olympic BWF', 'https://www.yonex.com/media/catalog/product/a/e/aerosensa_50.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quả cầu lông Yonex Aerosensa 50 (AS-50)', brand_id = 'yonex', category_id = 'cat_shuttle', description = 'Quả cầu lông thi đấu chính thức tại Thế vận hội Olympic và giải vô địch thế giới BWF, lông ngỗng tự nhiên cao cấp được chọn lọc nghiêm ngặt.', player_type = 'Tiêu chuẩn Olympic BWF', image_url = 'https://www.yonex.com/media/catalog/product/a/e/aerosensa_50.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHT-AS50', v_pid, 920000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quả cầu lông Yonex Aerosensa 40 (AS-40) (cat_shuttle)
    SELECT id INTO v_pid FROM products WHERE slug = 'qua-cau-long-yonex-aerosensa-40';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shuttle', 'Quả cầu lông Yonex Aerosensa 40 (AS-40)', 'qua-cau-long-yonex-aerosensa-40', 'Cầu thi đấu chuyên nghiệp quốc tế với quỹ đạo bay ổn định tuyệt đối và đế gỗ bần tự nhiên chống móp méo.', 'Thi đấu quốc tế', 'https://www.yonex.com/media/catalog/product/a/e/aerosensa_40.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quả cầu lông Yonex Aerosensa 40 (AS-40)', brand_id = 'yonex', category_id = 'cat_shuttle', description = 'Cầu thi đấu chuyên nghiệp quốc tế với quỹ đạo bay ổn định tuyệt đối và đế gỗ bần tự nhiên chống móp méo.', player_type = 'Thi đấu quốc tế', image_url = 'https://www.yonex.com/media/catalog/product/a/e/aerosensa_40.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHT-AS40', v_pid, 820000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quả cầu lông Yonex Aerosensa 30 (AS-30) (cat_shuttle)
    SELECT id INTO v_pid FROM products WHERE slug = 'qua-cau-long-yonex-aerosensa-30';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shuttle', 'Quả cầu lông Yonex Aerosensa 30 (AS-30)', 'qua-cau-long-yonex-aerosensa-30', 'Lựa chọn hàng đầu của các giải đấu vô địch quốc gia và câu lạc bộ chuyên nghiệp, độ bền lông cầu vượt trội.', 'Thi đấu quốc gia', 'https://www.yonex.com/media/catalog/product/a/s/as-30_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quả cầu lông Yonex Aerosensa 30 (AS-30)', brand_id = 'yonex', category_id = 'cat_shuttle', description = 'Lựa chọn hàng đầu của các giải đấu vô địch quốc gia và câu lạc bộ chuyên nghiệp, độ bền lông cầu vượt trội.', player_type = 'Thi đấu quốc gia', image_url = 'https://www.yonex.com/media/catalog/product/a/s/as-30_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHT-AS30', v_pid, 720000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quả cầu lông Yonex Aerosensa 20 (AS-20) (cat_shuttle)
    SELECT id INTO v_pid FROM products WHERE slug = 'qua-cau-long-yonex-aerosensa-20';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shuttle', 'Quả cầu lông Yonex Aerosensa 20 (AS-20)', 'qua-cau-long-yonex-aerosensa-20', 'Quả cầu lông lông vịt tự nhiên được cân bằng chính xác, đường bay chuẩn và độ bền cao phục vụ tập luyện nâng cao.', 'Tập luyện nâng cao', 'https://www.yonex.com/media/catalog/product/a/s/as-20_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quả cầu lông Yonex Aerosensa 20 (AS-20)', brand_id = 'yonex', category_id = 'cat_shuttle', description = 'Quả cầu lông lông vịt tự nhiên được cân bằng chính xác, đường bay chuẩn và độ bền cao phục vụ tập luyện nâng cao.', player_type = 'Tập luyện nâng cao', image_url = 'https://www.yonex.com/media/catalog/product/a/s/as-20_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHT-AS20', v_pid, 640000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quả cầu lông Yonex Aerosensa 10 (AS-10) (cat_shuttle)
    SELECT id INTO v_pid FROM products WHERE slug = 'qua-cau-long-yonex-aerosensa-10';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shuttle', 'Quả cầu lông Yonex Aerosensa 10 (AS-10)', 'qua-cau-long-yonex-aerosensa-10', 'Sản phẩm kinh tế nhất dòng Aerosensa, đáp ứng hoàn hảo nhu cầu giao lưu và tập luyện của các câu lạc bộ phong trào.', 'Câu lạc bộ phong trào', 'https://www.yonex.com/media/catalog/product/a/s/as-10_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quả cầu lông Yonex Aerosensa 10 (AS-10)', brand_id = 'yonex', category_id = 'cat_shuttle', description = 'Sản phẩm kinh tế nhất dòng Aerosensa, đáp ứng hoàn hảo nhu cầu giao lưu và tập luyện của các câu lạc bộ phong trào.', player_type = 'Câu lạc bộ phong trào', image_url = 'https://www.yonex.com/media/catalog/product/a/s/as-10_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHT-AS10', v_pid, 580000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quả cầu lông nhựa Yonex Mavis 350 (Ống 6 quả) (cat_shuttle)
    SELECT id INTO v_pid FROM products WHERE slug = 'qua-cau-long-nhua-yonex-mavis-350';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shuttle', 'Quả cầu lông nhựa Yonex Mavis 350 (Ống 6 quả)', 'qua-cau-long-nhua-yonex-mavis-350', 'Quả cầu nhựa bán chạy số 1 thế giới với cánh nylon siêu bền gấp 5 lần cầu lông vũ, mô phỏng quỹ đạo bay như cầu thật.', 'Siêu bền bỉ ngoài trời & CLB', 'https://www.yonex.com/media/catalog/product/m/-/m-350_000_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quả cầu lông nhựa Yonex Mavis 350 (Ống 6 quả)', brand_id = 'yonex', category_id = 'cat_shuttle', description = 'Quả cầu nhựa bán chạy số 1 thế giới với cánh nylon siêu bền gấp 5 lần cầu lông vũ, mô phỏng quỹ đạo bay như cầu thật.', player_type = 'Siêu bền bỉ ngoài trời & CLB', image_url = 'https://www.yonex.com/media/catalog/product/m/-/m-350_000_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHT-M350', v_pid, 240000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quả cầu lông Yonex Featherweight CW-70P (cat_shuttle)
    SELECT id INTO v_pid FROM products WHERE slug = 'qua-cau-long-yonex-featherweight-cw70p';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_shuttle', 'Quả cầu lông Yonex Featherweight CW-70P', 'qua-cau-long-yonex-featherweight-cw70p', 'Cầu lông vũ thế hệ mới với công nghệ xử lý lông chống gãy rụng khi thời tiết khô hanh hoặc điều hòa nhiệt độ thấp.', 'Chống gãy rụng', 'https://www.yonex.com/media/catalog/product/a/l/all_cw-70p_011_sub.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quả cầu lông Yonex Featherweight CW-70P', brand_id = 'yonex', category_id = 'cat_shuttle', description = 'Cầu lông vũ thế hệ mới với công nghệ xử lý lông chống gãy rụng khi thời tiết khô hanh hoặc điều hòa nhiệt độ thấp.', player_type = 'Chống gãy rụng', image_url = 'https://www.yonex.com/media/catalog/product/a/l/all_cw-70p_011_sub.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-SHT-CW70P', v_pid, 660000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quả cầu lông Victor Master No.1 (cat_shuttle)
    SELECT id INTO v_pid FROM products WHERE slug = 'qua-cau-long-victor-master-no1';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_shuttle', 'Quả cầu lông Victor Master No.1', 'qua-cau-long-victor-master-no1', 'Cầu lông ngỗng chọn lọc tiêu chuẩn giải đấu BWF Super Series, đế gỗ cork 3 lớp giữ cảm giác đập cầu chắc nịch.', 'Thi đấu chuyên nghiệp', 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-1456_0_20230419163918.webp', 'https://dkjulgymkya8y.cloudfront.net', 12, true);
    ELSE
        UPDATE products SET name = 'Quả cầu lông Victor Master No.1', brand_id = 'victor', category_id = 'cat_shuttle', description = 'Cầu lông ngỗng chọn lọc tiêu chuẩn giải đấu BWF Super Series, đế gỗ cork 3 lớp giữ cảm giác đập cầu chắc nịch.', player_type = 'Thi đấu chuyên nghiệp', image_url = 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-1456_0_20230419163918.webp', image_source = 'https://dkjulgymkya8y.cloudfront.net' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-SHT-MASTER1', v_pid, 650000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quả cầu lông Victor Champion No.1 (cat_shuttle)
    SELECT id INTO v_pid FROM products WHERE slug = 'qua-cau-long-victor-champion-no1';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_shuttle', 'Quả cầu lông Victor Champion No.1', 'qua-cau-long-victor-champion-no1', 'Quả cầu lông được ưa chuộng tại các trường học và học viện thể thao, ổn định gió và tuổi thọ cao.', 'Học viện & Trường học', 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-1476_0_20230419162824.webp', 'https://dkjulgymkya8y.cloudfront.net', 12, true);
    ELSE
        UPDATE products SET name = 'Quả cầu lông Victor Champion No.1', brand_id = 'victor', category_id = 'cat_shuttle', description = 'Quả cầu lông được ưa chuộng tại các trường học và học viện thể thao, ổn định gió và tuổi thọ cao.', player_type = 'Học viện & Trường học', image_url = 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-1476_0_20230419162824.webp', image_source = 'https://dkjulgymkya8y.cloudfront.net' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-SHT-CHAMPION1', v_pid, 520000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quả cầu lông Victor Gold No.1 (cat_shuttle)
    SELECT id INTO v_pid FROM products WHERE slug = 'qua-cau-long-victor-gold-no1';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_shuttle', 'Quả cầu lông Victor Gold No.1', 'qua-cau-long-victor-gold-no1', 'Dòng cầu cao cấp của Victor với tốc độ bay chính xác, đế gỗ cork tự nhiên không bị biến dạng sau các pha smash uy lực.', 'Thi đấu quốc gia', 'https://dkjulgymkya8y.cloudfront.net/images/64573736-096d-4f19-b4bc-ec9fb6693087.webp', 'https://dkjulgymkya8y.cloudfront.net', 12, true);
    ELSE
        UPDATE products SET name = 'Quả cầu lông Victor Gold No.1', brand_id = 'victor', category_id = 'cat_shuttle', description = 'Dòng cầu cao cấp của Victor với tốc độ bay chính xác, đế gỗ cork tự nhiên không bị biến dạng sau các pha smash uy lực.', player_type = 'Thi đấu quốc gia', image_url = 'https://dkjulgymkya8y.cloudfront.net/images/64573736-096d-4f19-b4bc-ec9fb6693087.webp', image_source = 'https://dkjulgymkya8y.cloudfront.net' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-SHT-GOLD1', v_pid, 560000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Túi cầu lông Yonex Pro Tournament Bag BA02631V (cat_bag)
    SELECT id INTO v_pid FROM products WHERE slug = 'tui-cau-long-yonex-pro-tournament-bag-ba02631v';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_bag', 'Túi cầu lông Yonex Pro Tournament Bag BA02631V', 'tui-cau-long-yonex-pro-tournament-bag-ba02631v', 'Túi hình chữ nhật chuyên dụng của các tay vợt hàng đầu thế giới, ngăn cách nhiệt bảo vệ căng cước và ngăn giày riêng biệt.', 'Đấu thủ chuyên nghiệp', 'https://www.yonex.com/media/catalog/product/i/n/int_ba02631v_112-1.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Túi cầu lông Yonex Pro Tournament Bag BA02631V', brand_id = 'yonex', category_id = 'cat_bag', description = 'Túi hình chữ nhật chuyên dụng của các tay vợt hàng đầu thế giới, ngăn cách nhiệt bảo vệ căng cước và ngăn giày riêng biệt.', player_type = 'Đấu thủ chuyên nghiệp', image_url = 'https://www.yonex.com/media/catalog/product/i/n/int_ba02631v_112-1.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-BAG-BA02631V', v_pid, 1950000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Bao vợt Yonex Pro Racquet Bag 9 ngăn BA02612V (cat_bag)
    SELECT id INTO v_pid FROM products WHERE slug = 'bao-vot-yonex-pro-racquet-bag-9-ngan-ba02612v';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_bag', 'Bao vợt Yonex Pro Racquet Bag 9 ngăn BA02612V', 'bao-vot-yonex-pro-racquet-bag-9-ngan-ba02612v', 'Sức chứa lên tới 9 cây vợt kèm quần áo và phụ kiện, dây đeo vai êm ái chống gù lưng khi di chuyển thi đấu xa.', 'Thi đấu xa nhà & Đội tuyển', 'https://www.yonex.com/media/catalog/product/i/n/int_ba02612v_112-1.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Bao vợt Yonex Pro Racquet Bag 9 ngăn BA02612V', brand_id = 'yonex', category_id = 'cat_bag', description = 'Sức chứa lên tới 9 cây vợt kèm quần áo và phụ kiện, dây đeo vai êm ái chống gù lưng khi di chuyển thi đấu xa.', player_type = 'Thi đấu xa nhà & Đội tuyển', image_url = 'https://www.yonex.com/media/catalog/product/i/n/int_ba02612v_112-1.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-BAG-BA02612V', v_pid, 2450000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Balo cầu lông Yonex Pro Backpack BA42605V (cat_bag)
    SELECT id INTO v_pid FROM products WHERE slug = 'balo-cau-long-yonex-pro-backpack-ba42605v';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_bag', 'Balo cầu lông Yonex Pro Backpack BA42605V', 'balo-cau-long-yonex-pro-backpack-ba42605v', 'Balo thể thao gọn nhẹ đa năng, có ngăn đựng 2 cây vợt chống trầy và ngăn đáy thoáng khí đựng giày thể thao.', 'Gọn nhẹ & Đa năng hàng ngày', 'https://www.yonex.com/media/catalog/product/i/n/int_ba42605v_112-1.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Balo cầu lông Yonex Pro Backpack BA42605V', brand_id = 'yonex', category_id = 'cat_bag', description = 'Balo thể thao gọn nhẹ đa năng, có ngăn đựng 2 cây vợt chống trầy và ngăn đáy thoáng khí đựng giày thể thao.', player_type = 'Gọn nhẹ & Đa năng hàng ngày', image_url = 'https://www.yonex.com/media/catalog/product/i/n/int_ba42605v_112-1.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-BAG-BA42605V', v_pid, 1450000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Túi cầu lông Yonex Pro Stand Bag BA92231W (cat_bag)
    SELECT id INTO v_pid FROM products WHERE slug = 'tui-cau-long-yonex-pro-stand-bag-ba92231w';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_bag', 'Túi cầu lông Yonex Pro Stand Bag BA92231W', 'tui-cau-long-yonex-pro-stand-bag-ba92231w', 'Túi đứng chuyên nghiệp có vách chia đồ linh hoạt, ngăn đựng vợt chống sốc và khóa kéo khóa tự động an toàn.', 'Chuyên nghiệp đẳng cấp', 'https://www.yonex.com/media/catalog/product/b/a/ba92231w_007_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Túi cầu lông Yonex Pro Stand Bag BA92231W', brand_id = 'yonex', category_id = 'cat_bag', description = 'Túi đứng chuyên nghiệp có vách chia đồ linh hoạt, ngăn đựng vợt chống sốc và khóa kéo khóa tự động an toàn.', player_type = 'Chuyên nghiệp đẳng cấp', image_url = 'https://www.yonex.com/media/catalog/product/b/a/ba92231w_007_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-BAG-BA92231W', v_pid, 2150000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Bao vợt Yonex Pro 9-Racket Bag BA92229 (cat_bag)
    SELECT id INTO v_pid FROM products WHERE slug = 'bao-vot-yonex-pro-9-racket-bag-ba92229';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_bag', 'Bao vợt Yonex Pro 9-Racket Bag BA92229', 'bao-vot-yonex-pro-9-racket-bag-ba92229', 'Chất liệu polyester phủ màng chống thấm nước, 3 ngăn chính lớn kèm túi lưới phụ kiện nhỏ bên hông.', 'Chống thấm nước & Dung tích lớn', 'https://www.yonex.com/media/catalog/product/b/a/ba92229_007_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Bao vợt Yonex Pro 9-Racket Bag BA92229', brand_id = 'yonex', category_id = 'cat_bag', description = 'Chất liệu polyester phủ màng chống thấm nước, 3 ngăn chính lớn kèm túi lưới phụ kiện nhỏ bên hông.', player_type = 'Chống thấm nước & Dung tích lớn', image_url = 'https://www.yonex.com/media/catalog/product/b/a/ba92229_007_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-BAG-BA92229', v_pid, 2350000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Balo thể thao Yonex Active Backpack BA92212 (cat_bag)
    SELECT id INTO v_pid FROM products WHERE slug = 'balo-the-thao-yonex-active-backpack-ba92212';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_bag', 'Balo thể thao Yonex Active Backpack BA92212', 'balo-the-thao-yonex-active-backpack-ba92212', 'Thiết kế hiện đại thanh lịch có thể dùng đi làm và đi tập cầu lông, đệm lưng thoát khí êm ái tối đa.', 'Đi làm & Đi chơi thể thao', 'https://www.yonex.com/media/catalog/product/b/a/ba92212_007_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Balo thể thao Yonex Active Backpack BA92212', brand_id = 'yonex', category_id = 'cat_bag', description = 'Thiết kế hiện đại thanh lịch có thể dùng đi làm và đi tập cầu lông, đệm lưng thoát khí êm ái tối đa.', player_type = 'Đi làm & Đi chơi thể thao', image_url = 'https://www.yonex.com/media/catalog/product/b/a/ba92212_007_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-BAG-BA92212', v_pid, 1350000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Bao vợt đơn chống sốc Yonex Soft Case AC541 (cat_bag)
    SELECT id INTO v_pid FROM products WHERE slug = 'bao-vot-don-chong-soc-yonex-soft-case-ac541';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_bag', 'Bao vợt đơn chống sốc Yonex Soft Case AC541', 'bao-vot-don-chong-soc-yonex-soft-case-ac541', 'Túi vải nhung mềm mại bảo vệ bề mặt sơn vợt chống trầy xước khi để trong balo hoặc vali du lịch.', 'Bảo vệ vợt chống xước', 'https://www.yonex.com/media/catalog/product/a/c/ac541_007_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Bao vợt đơn chống sốc Yonex Soft Case AC541', brand_id = 'yonex', category_id = 'cat_bag', description = 'Túi vải nhung mềm mại bảo vệ bề mặt sơn vợt chống trầy xước khi để trong balo hoặc vali du lịch.', player_type = 'Bảo vệ vợt chống xước', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac541_007_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-BAG-AC541', v_pid, 180000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Túi cầu lông Victor Supreme Rectangular BR9611 (cat_bag)
    SELECT id INTO v_pid FROM products WHERE slug = 'tui-cau-long-victor-supreme-rectangular-br9611';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_bag', 'Túi cầu lông Victor Supreme Rectangular BR9611', 'tui-cau-long-victor-supreme-rectangular-br9611', 'Túi vuông thời thượng của Victor với lớp lót bạc cách nhiệt giữ cước không bị chùng dưới nắng nóng.', 'Thời trang & Cách nhiệt', 'https://dkjulgymkya8y.cloudfront.net/victor/ca/product-90973_0_20220518141722.webp', 'https://dkjulgymkya8y.cloudfront.net', 12, true);
    ELSE
        UPDATE products SET name = 'Túi cầu lông Victor Supreme Rectangular BR9611', brand_id = 'victor', category_id = 'cat_bag', description = 'Túi vuông thời thượng của Victor với lớp lót bạc cách nhiệt giữ cước không bị chùng dưới nắng nóng.', player_type = 'Thời trang & Cách nhiệt', image_url = 'https://dkjulgymkya8y.cloudfront.net/victor/ca/product-90973_0_20220518141722.webp', image_source = 'https://dkjulgymkya8y.cloudfront.net' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-BAG-BR9611', v_pid, 1850000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Balo cầu lông đa năng Victor BR3029 (cat_bag)
    SELECT id INTO v_pid FROM products WHERE slug = 'balo-cau-long-da-nang-victor-br3029';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_bag', 'Balo cầu lông đa năng Victor BR3029', 'balo-cau-long-da-nang-victor-br3029', 'Phom dáng cứng cáp giữ form chuẩn, trang bị quai đeo chống trượt và phản quang an toàn khi di chuyển buổi tối.', 'An toàn & Tiện ích', 'https://cdn.shopvnb.com/img/300x300/uploads/gallery/tui-cau-long-victor-br3029-trang-sua-gia-cong_1715051324.webp', 'https://cdn.shopvnb.com', 12, true);
    ELSE
        UPDATE products SET name = 'Balo cầu lông đa năng Victor BR3029', brand_id = 'victor', category_id = 'cat_bag', description = 'Phom dáng cứng cáp giữ form chuẩn, trang bị quai đeo chống trượt và phản quang an toàn khi di chuyển buổi tối.', player_type = 'An toàn & Tiện ích', image_url = 'https://cdn.shopvnb.com/img/300x300/uploads/gallery/tui-cau-long-victor-br3029-trang-sua-gia-cong_1715051324.webp', image_source = 'https://cdn.shopvnb.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-BAG-BR3029', v_pid, 1150000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Bao vợt cầu lông Mizuno Tour 6 cây (cat_bag)
    SELECT id INTO v_pid FROM products WHERE slug = 'bao-vot-cau-long-mizuno-tour-6-cay';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'mizuno', 'cat_bag', 'Bao vợt cầu lông Mizuno Tour 6 cây', 'bao-vot-cau-long-mizuno-tour-6-cay', 'Chất liệu da nhân tạo cao cấp phối sợi dệt carbon sang trọng, ngăn chứa rộng rãi và chống thấm nước hoàn hảo.', 'Sang trọng phong cách Nhật Bản', 'https://merusport.com.my/wp-content/uploads/2024/05/MZ-CP2029-tournament-3-comp-raquet-bag-2.webp', 'https://merusport.com.my', 12, true);
    ELSE
        UPDATE products SET name = 'Bao vợt cầu lông Mizuno Tour 6 cây', brand_id = 'mizuno', category_id = 'cat_bag', description = 'Chất liệu da nhân tạo cao cấp phối sợi dệt carbon sang trọng, ngăn chứa rộng rãi và chống thấm nước hoàn hảo.', player_type = 'Sang trọng phong cách Nhật Bản', image_url = 'https://merusport.com.my/wp-content/uploads/2024/05/MZ-CP2029-tournament-3-comp-raquet-bag-2.webp', image_source = 'https://merusport.com.my' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('MIZUNO-BAG-TOUR6', v_pid, 1650000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Lưới cầu lông Yonex BN139 Tournament BWF Approved (cat_net)
    SELECT id INTO v_pid FROM products WHERE slug = 'luoi-cau-long-yonex-bn139-tournament';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_net', 'Lưới cầu lông Yonex BN139 Tournament BWF Approved', 'luoi-cau-long-yonex-bn139-tournament', 'Lưới cầu lông đạt chuẩn Liên đoàn Cầu lông Thế giới (BWF) cho các giải Grand Prix và Olympic, sợi vinylon bện đôi chống võng.', 'Chuẩn BWF Olympic', 'https://www.yonex.com/media/catalog/product/b/n/bn139_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Lưới cầu lông Yonex BN139 Tournament BWF Approved', brand_id = 'yonex', category_id = 'cat_net', description = 'Lưới cầu lông đạt chuẩn Liên đoàn Cầu lông Thế giới (BWF) cho các giải Grand Prix và Olympic, sợi vinylon bện đôi chống võng.', player_type = 'Chuẩn BWF Olympic', image_url = 'https://www.yonex.com/media/catalog/product/b/n/bn139_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-NET-BN139', v_pid, 750000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Dây cáp và tăng đơ lưới Yonex Tensioner AC152 (cat_net)
    SELECT id INTO v_pid FROM products WHERE slug = 'day-cap-tang-do-luoi-yonex-ac152';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_net', 'Dây cáp và tăng đơ lưới Yonex Tensioner AC152', 'day-cap-tang-do-luoi-yonex-ac152', 'Bộ tăng đơ căng cáp thép lưới cầu lông chuẩn thi đấu, giữ mép lưới trên luôn căng thẳng tắp đúng độ cao 1.55m.', 'Căng cáp thi đấu chuẩn', 'https://www.yonex.com/media/catalog/product/a/c/ac152_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dây cáp và tăng đơ lưới Yonex Tensioner AC152', brand_id = 'yonex', category_id = 'cat_net', description = 'Bộ tăng đơ căng cáp thép lưới cầu lông chuẩn thi đấu, giữ mép lưới trên luôn căng thẳng tắp đúng độ cao 1.55m.', player_type = 'Căng cáp thi đấu chuẩn', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac152_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-NET-AC152', v_pid, 220000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Lưới cầu lông Sodex Sport S25820 Thi đấu quốc gia (cat_net)
    SELECT id INTO v_pid FROM products WHERE slug = 'luoi-cau-long-sodex-sport-s25820';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'sodex', 'cat_net', 'Lưới cầu lông Sodex Sport S25820 Thi đấu quốc gia', 'luoi-cau-long-sodex-sport-s25820', 'Sản phẩm lưới thi đấu chính thức tại các giải quốc gia Việt Nam, đan sợi Polypropylene chống tia UV và thời tiết nhiệt đới.', 'Thi đấu quốc gia Việt Nam', 'https://www.sodexsport.vn/sodex_sport_library/Product-photos/VN/the-thao-dung-vot/cau-long/luoi-cau-long/S27875/luoi-cau-long-bwf-1.JPG', 'https://www.sodexsport.vn', 12, true);
    ELSE
        UPDATE products SET name = 'Lưới cầu lông Sodex Sport S25820 Thi đấu quốc gia', brand_id = 'sodex', category_id = 'cat_net', description = 'Sản phẩm lưới thi đấu chính thức tại các giải quốc gia Việt Nam, đan sợi Polypropylene chống tia UV và thời tiết nhiệt đới.', player_type = 'Thi đấu quốc gia Việt Nam', image_url = 'https://www.sodexsport.vn/sodex_sport_library/Product-photos/VN/the-thao-dung-vot/cau-long/luoi-cau-long/S27875/luoi-cau-long-bwf-1.JPG', image_source = 'https://www.sodexsport.vn' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SODEX-NET-S25820', v_pid, 390000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Lưới cầu lông Sodex Sport S25810 Câu lạc bộ (cat_net)
    SELECT id INTO v_pid FROM products WHERE slug = 'luoi-cau-long-sodex-sport-s25810';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'sodex', 'cat_net', 'Lưới cầu lông Sodex Sport S25810 Câu lạc bộ', 'luoi-cau-long-sodex-sport-s25810', 'Lưới đan ô vuông tiêu chuẩn 18mm cho câu lạc bộ và sân tập, mép bạt may viền dù bền bỉ chống xơ rách.', 'Sân tập & Câu lạc bộ', 'https://www.sodexsport.vn/sodex_sport_library/Product-photos/VN/the-thao-dung-vot/cau-long/luoi-cau-long/luoi-cau-long-tap-luyen-S27835.jpg', 'https://www.sodexsport.vn', 12, true);
    ELSE
        UPDATE products SET name = 'Lưới cầu lông Sodex Sport S25810 Câu lạc bộ', brand_id = 'sodex', category_id = 'cat_net', description = 'Lưới đan ô vuông tiêu chuẩn 18mm cho câu lạc bộ và sân tập, mép bạt may viền dù bền bỉ chống xơ rách.', player_type = 'Sân tập & Câu lạc bộ', image_url = 'https://www.sodexsport.vn/sodex_sport_library/Product-photos/VN/the-thao-dung-vot/cau-long/luoi-cau-long/luoi-cau-long-tap-luyen-S27835.jpg', image_source = 'https://www.sodexsport.vn' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SODEX-NET-S25810', v_pid, 290000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Bộ trụ và lưới gấp gọn Sodex Sport S25700 Portable (cat_net)
    SELECT id INTO v_pid FROM products WHERE slug = 'bo-tru-luoi-gap-gon-sodex-sport-s25700';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'sodex', 'cat_net', 'Bộ trụ và lưới gấp gọn Sodex Sport S25700 Portable', 'bo-tru-luoi-gap-gon-sodex-sport-s25700', 'Khung thép gấp gọn kèm lưới di động thông minh, dựng sân chơi trong 3 phút trên mọi bề mặt sân cỏ, xi măng hoặc bãi biển.', 'Di động & Dã ngoại', 'https://www.sodexsport.vn/sodex_sport_library/Product-photos/VN/the-thao-dung-vot/cau-long/tru-cau-long/tru-cau-long-di-dong-doi-trong-20kg-doi-trong-bo-sung-20kg-S27045.jpg', 'https://www.sodexsport.vn', 12, true);
    ELSE
        UPDATE products SET name = 'Bộ trụ và lưới gấp gọn Sodex Sport S25700 Portable', brand_id = 'sodex', category_id = 'cat_net', description = 'Khung thép gấp gọn kèm lưới di động thông minh, dựng sân chơi trong 3 phút trên mọi bề mặt sân cỏ, xi măng hoặc bãi biển.', player_type = 'Di động & Dã ngoại', image_url = 'https://www.sodexsport.vn/sodex_sport_library/Product-photos/VN/the-thao-dung-vot/cau-long/tru-cau-long/tru-cau-long-di-dong-doi-trong-20kg-doi-trong-bo-sung-20kg-S27045.jpg', image_source = 'https://www.sodexsport.vn' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SODEX-NET-S25700', v_pid, 1150000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Lưới cầu lông Sodex Sport S25850 Cáp thép bọc PVC (cat_net)
    SELECT id INTO v_pid FROM products WHERE slug = 'luoi-cau-long-sodex-sport-s25850';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'sodex', 'cat_net', 'Lưới cầu lông Sodex Sport S25850 Cáp thép bọc PVC', 'luoi-cau-long-sodex-sport-s25850', 'Trang bị dây cáp thép bọc nhựa PVC 3mm bên trong mép trên, chịu lực kéo căng lớn không đứt gãy sau nhiều năm sử dụng.', 'Cáp thép bọc PVC siêu bền', 'https://www.sodexsport.vn/sodex_sport_library/Product-photos/VN/the-thao-dung-vot/cau-long/tru-cau-long/tru-cau-long-thi-dau-chon-nong-FFBaD-S27220.jpg', 'https://www.sodexsport.vn', 12, true);
    ELSE
        UPDATE products SET name = 'Lưới cầu lông Sodex Sport S25850 Cáp thép bọc PVC', brand_id = 'sodex', category_id = 'cat_net', description = 'Trang bị dây cáp thép bọc nhựa PVC 3mm bên trong mép trên, chịu lực kéo căng lớn không đứt gãy sau nhiều năm sử dụng.', player_type = 'Cáp thép bọc PVC siêu bền', image_url = 'https://www.sodexsport.vn/sodex_sport_library/Product-photos/VN/the-thao-dung-vot/cau-long/tru-cau-long/tru-cau-long-thi-dau-chon-nong-FFBaD-S27220.jpg', image_source = 'https://www.sodexsport.vn' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SODEX-NET-S25850', v_pid, 450000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Lưới cầu lông Victor Competition Net C-7004 (cat_net)
    SELECT id INTO v_pid FROM products WHERE slug = 'luoi-cau-long-victor-competition-c7004';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_net', 'Lưới cầu lông Victor Competition Net C-7004', 'luoi-cau-long-victor-competition-c7004', 'Sợi nylon xoắn chịu lực cao được Victor gia công tỉ mỉ, độ bền màu cao dưới ánh đèn sân khấu và ánh sáng tự nhiên.', 'Thi đấu chuyên nghiệp', 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-1521_0_20200526112111.webp', 'https://dkjulgymkya8y.cloudfront.net', 12, true);
    ELSE
        UPDATE products SET name = 'Lưới cầu lông Victor Competition Net C-7004', brand_id = 'victor', category_id = 'cat_net', description = 'Sợi nylon xoắn chịu lực cao được Victor gia công tỉ mỉ, độ bền màu cao dưới ánh đèn sân khấu và ánh sáng tự nhiên.', player_type = 'Thi đấu chuyên nghiệp', image_url = 'https://dkjulgymkya8y.cloudfront.net/victor/en_us/product-1521_0_20200526112111.webp', image_source = 'https://dkjulgymkya8y.cloudfront.net' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-NET-C7004', v_pid, 480000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Lưới cầu lông ngoài trời Victor Outdoor Net C-7001 (cat_net)
    SELECT id INTO v_pid FROM products WHERE slug = 'luoi-cau-long-ngoai-troi-victor-c7001';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_net', 'Lưới cầu lông ngoài trời Victor Outdoor Net C-7001', 'luoi-cau-long-ngoai-troi-victor-c7001', 'Dành riêng cho sân chơi ngoài trời và bộ môn AirBadminton, sợi lưới kháng ẩm mốc và gió lớn hiệu quả.', 'Ngoài trời & AirBadminton', 'https://assets.victor-shop.com/175500_3_k.jpg', 'https://assets.victor-shop.com', 12, true);
    ELSE
        UPDATE products SET name = 'Lưới cầu lông ngoài trời Victor Outdoor Net C-7001', brand_id = 'victor', category_id = 'cat_net', description = 'Dành riêng cho sân chơi ngoài trời và bộ môn AirBadminton, sợi lưới kháng ẩm mốc và gió lớn hiệu quả.', player_type = 'Ngoài trời & AirBadminton', image_url = 'https://assets.victor-shop.com/175500_3_k.jpg', image_source = 'https://assets.victor-shop.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-NET-C7001', v_pid, 320000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Lưới cầu lông Li-Ning LN-N600 Cáp thép giải đấu (cat_net)
    SELECT id INTO v_pid FROM products WHERE slug = 'luoi-cau-long-lining-ln-n600-cap-thep';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'lining', 'cat_net', 'Lưới cầu lông Li-Ning LN-N600 Cáp thép giải đấu', 'luoi-cau-long-lining-ln-n600-cap-thep', 'Lưới thi đấu cao cấp của Li-Ning với sợi dệt mật độ cao, viền bạt trắng phản quang hỗ trợ trọng tài quan sát chuẩn xác.', 'Giải đấu Li-Ning chính hãng', 'https://in.lining.studio/cdn/shop/files/01_018a21849f.jpg?v=1749897586&width=800', 'https://in.lining.studio', 12, true);
    ELSE
        UPDATE products SET name = 'Lưới cầu lông Li-Ning LN-N600 Cáp thép giải đấu', brand_id = 'lining', category_id = 'cat_net', description = 'Lưới thi đấu cao cấp của Li-Ning với sợi dệt mật độ cao, viền bạt trắng phản quang hỗ trợ trọng tài quan sát chuẩn xác.', player_type = 'Giải đấu Li-Ning chính hãng', image_url = 'https://in.lining.studio/cdn/shop/files/01_018a21849f.jpg?v=1749897586&width=800', image_source = 'https://in.lining.studio' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('LINING-NET-LNN600', v_pid, 520000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Lưới cầu lông Li-Ning LN-N300 Sợi Nylon (cat_net)
    SELECT id INTO v_pid FROM products WHERE slug = 'luoi-cau-long-lining-ln-n300-nylon';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'lining', 'cat_net', 'Lưới cầu lông Li-Ning LN-N300 Sợi Nylon', 'luoi-cau-long-lining-ln-n300-nylon', 'Lưới tập luyện tiêu chuẩn với trọng lượng nhẹ dễ dàng lắp đặt tháo dỡ, đường viền may 4 đường chỉ chắc chắn.', 'Tập luyện phong trào', 'https://sg.lining.studio/cdn/shop/files/01_932981babc.jpg?v=1752148399&width=650', 'https://sg.lining.studio', 12, true);
    ELSE
        UPDATE products SET name = 'Lưới cầu lông Li-Ning LN-N300 Sợi Nylon', brand_id = 'lining', category_id = 'cat_net', description = 'Lưới tập luyện tiêu chuẩn với trọng lượng nhẹ dễ dàng lắp đặt tháo dỡ, đường viền may 4 đường chỉ chắc chắn.', player_type = 'Tập luyện phong trào', image_url = 'https://sg.lining.studio/cdn/shop/files/01_932981babc.jpg?v=1752148399&width=650', image_source = 'https://sg.lining.studio' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('LINING-NET-LNN300', v_pid, 350000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Áo cầu lông thi đấu Yonex Tournament Shirt 10505 VeryCool (cat_apparel)
    SELECT id INTO v_pid FROM products WHERE slug = 'ao-cau-long-yonex-tournament-shirt-10505';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_apparel', 'Áo cầu lông thi đấu Yonex Tournament Shirt 10505 VeryCool', 'ao-cau-long-yonex-tournament-shirt-10505', 'Công nghệ làm mát VeryCool sử dụng Xylitol tự nhiên hạ nhiệt độ cơ thể xuống 3°C, thấm hút mồ hôi và chống bám mùi.', 'Hạ nhiệt cơ thể VeryCool', 'https://www.yonex.com/media/catalog/product/1/0/10505_011_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Áo cầu lông thi đấu Yonex Tournament Shirt 10505 VeryCool', brand_id = 'yonex', category_id = 'cat_apparel', description = 'Công nghệ làm mát VeryCool sử dụng Xylitol tự nhiên hạ nhiệt độ cơ thể xuống 3°C, thấm hút mồ hôi và chống bám mùi.', player_type = 'Hạ nhiệt cơ thể VeryCool', image_url = 'https://www.yonex.com/media/catalog/product/1/0/10505_011_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-APP-10505-M', v_pid, 890000, true, 'M', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-APP-10505-L', v_pid, 890000, true, 'L', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Áo polo cầu lông Yonex Club Polo 10450 (cat_apparel)
    SELECT id INTO v_pid FROM products WHERE slug = 'ao-polo-cau-long-yonex-club-polo-10450';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_apparel', 'Áo polo cầu lông Yonex Club Polo 10450', 'ao-polo-cau-long-yonex-club-polo-10450', 'Cổ bẻ lịch lãm chuẩn phong cách thể thao quý tộc, chất liệu co giãn 4 chiều vận động thoải mái khi vung vợt.', 'Lịch sự & Sang trọng', 'https://www.yonex.com/media/catalog/product/1/0/10450_011_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Áo polo cầu lông Yonex Club Polo 10450', brand_id = 'yonex', category_id = 'cat_apparel', description = 'Cổ bẻ lịch lãm chuẩn phong cách thể thao quý tộc, chất liệu co giãn 4 chiều vận động thoải mái khi vung vợt.', player_type = 'Lịch sự & Sang trọng', image_url = 'https://www.yonex.com/media/catalog/product/1/0/10450_011_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-APP-10450-L', v_pid, 650000, true, 'L', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quần short thi đấu Yonex Tournament Shorts 15125 (cat_apparel)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-short-thi-dau-yonex-tournament-shorts-15125';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_apparel', 'Quần short thi đấu Yonex Tournament Shorts 15125', 'quan-short-thi-dau-yonex-tournament-shorts-15125', 'Thiết kế xẻ gấu chống vướng khi bước sải chân cứu cầu, túi sâu đựng quả cầu tiện lợi khi tập luyện giao cầu.', 'Thoáng mát & Cơ động', 'https://www.yonex.com/media/catalog/product/1/5/15125_007_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quần short thi đấu Yonex Tournament Shorts 15125', brand_id = 'yonex', category_id = 'cat_apparel', description = 'Thiết kế xẻ gấu chống vướng khi bước sải chân cứu cầu, túi sâu đựng quả cầu tiện lợi khi tập luyện giao cầu.', player_type = 'Thoáng mát & Cơ động', image_url = 'https://www.yonex.com/media/catalog/product/1/5/15125_007_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-APP-15125-L', v_pid, 550000, true, 'L', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Tất cầu lông Yonex 3D Ergo Badminton Socks 19120 (cat_apparel)
    SELECT id INTO v_pid FROM products WHERE slug = 'tat-cau-long-yonex-3d-ergo-socks-19120';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_apparel', 'Tất cầu lông Yonex 3D Ergo Badminton Socks 19120', 'tat-cau-long-yonex-3d-ergo-socks-19120', 'Dệt nổi 3D phân bổ theo vòm giải phẫu bàn chân trái/phải riêng biệt, đệm gót dày giảm xóc và chống chai phồng chân.', 'Chống phồng rộp & Giảm chấn', 'https://www.yonex.com/media/catalog/product/1/9/19120_011_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Tất cầu lông Yonex 3D Ergo Badminton Socks 19120', brand_id = 'yonex', category_id = 'cat_apparel', description = 'Dệt nổi 3D phân bổ theo vòm giải phẫu bàn chân trái/phải riêng biệt, đệm gót dày giảm xóc và chống chai phồng chân.', player_type = 'Chống phồng rộp & Giảm chấn', image_url = 'https://www.yonex.com/media/catalog/product/1/9/19120_011_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-APP-19120', v_pid, 140000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Áo thi đấu Yonex Game Shirt 10798 (cat_apparel)
    SELECT id INTO v_pid FROM products WHERE slug = 'ao-thi-dau-yonex-game-shirt-10798';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_apparel', 'Áo thi đấu Yonex Game Shirt 10798', 'ao-thi-dau-yonex-game-shirt-10798', 'Họa tiết hình học hiện đại của tuyển thủ Nhật Bản, công nghệ khử tĩnh điện chống dính áo vào da khi cơ thể ra mồ hôi.', 'Khử tĩnh điện & Thẩm mỹ', 'https://www.yonex.com/media/catalog/product/i/n/int_10798_112-1.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Áo thi đấu Yonex Game Shirt 10798', brand_id = 'yonex', category_id = 'cat_apparel', description = 'Họa tiết hình học hiện đại của tuyển thủ Nhật Bản, công nghệ khử tĩnh điện chống dính áo vào da khi cơ thể ra mồ hôi.', player_type = 'Khử tĩnh điện & Thẩm mỹ', image_url = 'https://www.yonex.com/media/catalog/product/i/n/int_10798_112-1.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-APP-10798-L', v_pid, 790000, true, 'L', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quần short thi đấu Yonex Game Shorts 15277 (cat_apparel)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-short-thi-dau-yonex-game-shorts-15277';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_apparel', 'Quần short thi đấu Yonex Game Shorts 15277', 'quan-short-thi-dau-yonex-game-shorts-15277', 'Vải dệt thoáng khí công nghệ khô nhanh Quick-Dry, dây rút thun co giãn điều chỉnh theo vòng eo.', 'Nhanh khô & Êm nhẹ', 'https://www.yonex.com/media/catalog/product/i/n/int_15277_112-1.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quần short thi đấu Yonex Game Shorts 15277', brand_id = 'yonex', category_id = 'cat_apparel', description = 'Vải dệt thoáng khí công nghệ khô nhanh Quick-Dry, dây rút thun co giãn điều chỉnh theo vòng eo.', player_type = 'Nhanh khô & Êm nhẹ', image_url = 'https://www.yonex.com/media/catalog/product/i/n/int_15277_112-1.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-APP-15277-L', v_pid, 520000, true, 'L', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Áo khoác khởi động Yonex Warm-Up Jacket 50203Y (cat_apparel)
    SELECT id INTO v_pid FROM products WHERE slug = 'ao-khoac-khoi-dong-yonex-warm-up-50203y';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_apparel', 'Áo khoác khởi động Yonex Warm-Up Jacket 50203Y', 'ao-khoac-khoi-dong-yonex-warm-up-50203y', 'Áo khoác giữ ấm cơ bắp trước và sau trận đấu, cản gió và duy trì nhiệt độ tối ưu hạn chế chấn thương căng cơ.', 'Khởi động & Giữ ấm', 'https://www.yonex.com/media/catalog/product/a/l/all_50203y_011-1.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Áo khoác khởi động Yonex Warm-Up Jacket 50203Y', brand_id = 'yonex', category_id = 'cat_apparel', description = 'Áo khoác giữ ấm cơ bắp trước và sau trận đấu, cản gió và duy trì nhiệt độ tối ưu hạn chế chấn thương căng cơ.', player_type = 'Khởi động & Giữ ấm', image_url = 'https://www.yonex.com/media/catalog/product/a/l/all_50203y_011-1.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-APP-50203Y-L', v_pid, 1250000, true, 'L', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Áo đấu Victor All-England Championship T-3000 (cat_apparel)
    SELECT id INTO v_pid FROM products WHERE slug = 'ao-dau-victor-all-england-t3000';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_apparel', 'Áo đấu Victor All-England Championship T-3000', 'ao-dau-victor-all-england-t3000', 'Phiên bản kỷ niệm giải đấu Toàn Anh danh giá, sợi vải dệt Jacquard kim cương siêu nhẹ và thông khí.', 'Thi đấu kỷ niệm All-England', 'https://www.sakurasport.com/685-large_default/t-30002-ab-t-shirt-unisex-victor.jpg', 'https://www.sakurasport.com', 12, true);
    ELSE
        UPDATE products SET name = 'Áo đấu Victor All-England Championship T-3000', brand_id = 'victor', category_id = 'cat_apparel', description = 'Phiên bản kỷ niệm giải đấu Toàn Anh danh giá, sợi vải dệt Jacquard kim cương siêu nhẹ và thông khí.', player_type = 'Thi đấu kỷ niệm All-England', image_url = 'https://www.sakurasport.com/685-large_default/t-30002-ab-t-shirt-unisex-victor.jpg', image_source = 'https://www.sakurasport.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-APP-T3000-L', v_pid, 750000, true, 'L', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quần short thể thao Victor Team Shorts R-3096 (cat_apparel)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-short-the-thao-victor-r3096';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_apparel', 'Quần short thể thao Victor Team Shorts R-3096', 'quan-short-the-thao-victor-r3096', 'Chất liệu co giãn mềm mại, đường may phẳng phẳng mép không cọ rát da đùi khi vận động với cường độ cao.', 'Bền bỉ & Êm ái', 'https://www.nydhi.com/cdn/shop/products/R-3096_grande.jpg', 'https://www.nydhi.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quần short thể thao Victor Team Shorts R-3096', brand_id = 'victor', category_id = 'cat_apparel', description = 'Chất liệu co giãn mềm mại, đường may phẳng phẳng mép không cọ rát da đùi khi vận động với cường độ cao.', player_type = 'Bền bỉ & Êm ái', image_url = 'https://www.nydhi.com/cdn/shop/products/R-3096_grande.jpg', image_source = 'https://www.nydhi.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('VICTOR-APP-R3096-L', v_pid, 420000, true, 'L', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Áo cầu lông đội tuyển Li-Ning Jersey AAYT081 (cat_apparel)
    SELECT id INTO v_pid FROM products WHERE slug = 'ao-cau-long-doi-tuyen-lining-aayt081';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'lining', 'cat_apparel', 'Áo cầu lông đội tuyển Li-Ning Jersey AAYT081', 'ao-cau-long-doi-tuyen-lining-aayt081', 'Mẫu áo đấu phong cách Rồng uy quyền của tuyển quốc gia, công nghệ sợi AT-Dry khô thoáng tức thì.', 'Uy quyền đội tuyển Li-Ning', 'https://cdn.shopvnb.com/img/300x300/uploads/gallery/ao-cau-long-lining-p-atsu493-4-nam-chinh-hang_1770931938.webp', 'https://cdn.shopvnb.com', 12, true);
    ELSE
        UPDATE products SET name = 'Áo cầu lông đội tuyển Li-Ning Jersey AAYT081', brand_id = 'lining', category_id = 'cat_apparel', description = 'Mẫu áo đấu phong cách Rồng uy quyền của tuyển quốc gia, công nghệ sợi AT-Dry khô thoáng tức thì.', player_type = 'Uy quyền đội tuyển Li-Ning', image_url = 'https://cdn.shopvnb.com/img/300x300/uploads/gallery/ao-cau-long-lining-p-atsu493-4-nam-chinh-hang_1770931938.webp', image_source = 'https://cdn.shopvnb.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('LINING-APP-AAYT081-L', v_pid, 790000, true, 'L', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Quần thi đấu nhanh khô Li-Ning Quick-Dry AAPS039 (cat_apparel)
    SELECT id INTO v_pid FROM products WHERE slug = 'quan-thi-dau-nhanh-kho-lining-aaps039';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'lining', 'cat_apparel', 'Quần thi đấu nhanh khô Li-Ning Quick-Dry AAPS039', 'quan-thi-dau-nhanh-kho-lining-aaps039', 'Trọng lượng chỉ 120g cho cảm giác mặc như không mặc, thoáng khí đa chiều giúp giải phóng nhiệt lượng cơ thể.', 'Siêu nhẹ & Nhanh khô', 'https://cdn.shopvnb.com/img/300x300/uploads/gallery/quan-cau-long-lining-967-xanh-navy_1751244174.webp', 'https://cdn.shopvnb.com', 12, true);
    ELSE
        UPDATE products SET name = 'Quần thi đấu nhanh khô Li-Ning Quick-Dry AAPS039', brand_id = 'lining', category_id = 'cat_apparel', description = 'Trọng lượng chỉ 120g cho cảm giác mặc như không mặc, thoáng khí đa chiều giúp giải phóng nhiệt lượng cơ thể.', player_type = 'Siêu nhẹ & Nhanh khô', image_url = 'https://cdn.shopvnb.com/img/300x300/uploads/gallery/quan-cau-long-lining-967-xanh-navy_1751244174.webp', image_source = 'https://cdn.shopvnb.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('LINING-APP-AAPS039-L', v_pid, 450000, true, 'L', NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Chì dán cân bằng đầu vợt Yonex Lead Tape AC184 (cat_accessory)
    SELECT id INTO v_pid FROM products WHERE slug = 'chi-dan-can-bang-dau-vot-yonex-ac184';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_accessory', 'Chì dán cân bằng đầu vợt Yonex Lead Tape AC184', 'chi-dan-can-bang-dau-vot-yonex-ac184', 'Miếng dán trọng lượng điều chỉnh điểm cân bằng vợt lên khung đầu vợt, tăng lực smash và độ đầm tay theo ý muốn.', 'Tăng trọng lượng đầu vợt', 'https://www.yonex.com/media/catalog/product/a/c/ac184_004_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Chì dán cân bằng đầu vợt Yonex Lead Tape AC184', brand_id = 'yonex', category_id = 'cat_accessory', description = 'Miếng dán trọng lượng điều chỉnh điểm cân bằng vợt lên khung đầu vợt, tăng lực smash và độ đầm tay theo ý muốn.', player_type = 'Tăng trọng lượng đầu vợt', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac184_004_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-ACC-AC184', v_pid, 110000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Băng chặn mồ hôi cổ tay Yonex AC489 Wristband (cat_accessory)
    SELECT id INTO v_pid FROM products WHERE slug = 'bang-chan-mo-hoi-co-tay-yonex-ac489';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_accessory', 'Băng chặn mồ hôi cổ tay Yonex AC489 Wristband', 'bang-chan-mo-hoi-co-tay-yonex-ac489', 'Sợi cotton dệt xù thấm hút mồ hôi từ cánh tay chảy xuống bàn tay, giữ quấn cán luôn khô ráo và tăng độ bám.', 'Chặn mồ hôi cổ tay', 'https://www.yonex.com/media/catalog/product/a/c/ac489_011_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Băng chặn mồ hôi cổ tay Yonex AC489 Wristband', brand_id = 'yonex', category_id = 'cat_accessory', description = 'Sợi cotton dệt xù thấm hút mồ hôi từ cánh tay chảy xuống bàn tay, giữ quấn cán luôn khô ráo và tăng độ bám.', player_type = 'Chặn mồ hôi cổ tay', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac489_011_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-ACC-AC489', v_pid, 95000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Giảm chấn mặt vợt Yonex Vibration Dampener AC165 (cat_accessory)
    SELECT id INTO v_pid FROM products WHERE slug = 'giam-chan-mat-vot-yonex-ac165';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_accessory', 'Giảm chấn mặt vợt Yonex Vibration Dampener AC165', 'giam-chan-mat-vot-yonex-ac165', 'Hạt silicon cài giữa dây đan triệt tiêu rung chấn truyền về khuỷu tay, phòng tránh viêm gân và hội chứng Tennis/Badminton Elbow.', 'Bảo vệ khuỷu tay', 'https://www.yonex.com/media/catalog/product/a/c/ac165_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Giảm chấn mặt vợt Yonex Vibration Dampener AC165', brand_id = 'yonex', category_id = 'cat_accessory', description = 'Hạt silicon cài giữa dây đan triệt tiêu rung chấn truyền về khuỷu tay, phòng tránh viêm gân và hội chứng Tennis/Badminton Elbow.', player_type = 'Bảo vệ khuỷu tay', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac165_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-ACC-AC165', v_pid, 75000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Gen vợt chống lún khung Yonex AC416 (Gói 100 cái) (cat_accessory)
    SELECT id INTO v_pid FROM products WHERE slug = 'gen-vot-chong-lun-khung-yonex-ac416';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_accessory', 'Gen vợt chống lún khung Yonex AC416 (Gói 100 cái)', 'gen-vot-chong-lun-khung-yonex-ac416', 'Gen nhựa nylon cao cấp bảo vệ lỗ xỏ cước trên khung carbon, chống hiện tượng lún sập khung khi căng cước ở mức cân cao.', 'Bảo vệ khung vợt khi căng dây', 'https://www.yonex.com/media/catalog/product/a/c/ac416_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Gen vợt chống lún khung Yonex AC416 (Gói 100 cái)', brand_id = 'yonex', category_id = 'cat_accessory', description = 'Gen nhựa nylon cao cấp bảo vệ lỗ xỏ cước trên khung carbon, chống hiện tượng lún sập khung khi căng cước ở mức cân cao.', player_type = 'Bảo vệ khung vợt khi căng dây', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac416_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-ACC-AC416', v_pid, 140000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Kéo cắt cước khẩn cấp Yonex AC422 String Cut Pliers (cat_accessory)
    SELECT id INTO v_pid FROM products WHERE slug = 'keo-cat-cuoc-khan-cap-yonex-ac422';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_accessory', 'Kéo cắt cước khẩn cấp Yonex AC422 String Cut Pliers', 'keo-cat-cuoc-khan-cap-yonex-ac422', 'Lưỡi thép tôi siêu bén thiết kế mũi cong an toàn, cắt đứt dây cước tức thì khi đứt lưới để bảo vệ khung vợt không bị vặn xoắn.', 'Bảo vệ khung khi đứt cước', 'https://www.yonex.com/media/catalog/product/a/c/ac422_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Kéo cắt cước khẩn cấp Yonex AC422 String Cut Pliers', brand_id = 'yonex', category_id = 'cat_accessory', description = 'Lưỡi thép tôi siêu bén thiết kế mũi cong an toàn, cắt đứt dây cước tức thì khi đứt lưới để bảo vệ khung vợt không bị vặn xoắn.', player_type = 'Bảo vệ khung khi đứt cước', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac422_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-ACC-AC422', v_pid, 380000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Bột chống trơn mồ hôi tay Yonex Grip Powder 2 AC470 (cat_accessory)
    SELECT id INTO v_pid FROM products WHERE slug = 'bot-chong-tron-mo-hoi-tay-yonex-ac470';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_accessory', 'Bột chống trơn mồ hôi tay Yonex Grip Powder 2 AC470', 'bot-chong-tron-mo-hoi-tay-yonex-ac470', 'Bột magie oxit siêu mịn hút sạch dầu nhờn và mồ hôi trên lòng bàn tay, kết hợp tuyệt vời với quấn cán vải cotton.', 'Chống mồ hôi nhờn tay', 'https://www.yonex.com/media/catalog/product/a/c/ac470_1.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Bột chống trơn mồ hôi tay Yonex Grip Powder 2 AC470', brand_id = 'yonex', category_id = 'cat_accessory', description = 'Bột magie oxit siêu mịn hút sạch dầu nhờn và mồ hôi trên lòng bàn tay, kết hợp tuyệt vời với quấn cán vải cotton.', player_type = 'Chống mồ hôi nhờn tay', image_url = 'https://www.yonex.com/media/catalog/product/a/c/ac470_1.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-ACC-AC470', v_pid, 160000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Khăn lau mồ hôi thể thao Yonex Sport Towel AC810 (cat_accessory)
    SELECT id INTO v_pid FROM products WHERE slug = 'khan-lau-mo-hoi-yonex-sport-towel-ac810';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_accessory', 'Khăn lau mồ hôi thể thao Yonex Sport Towel AC810', 'khan-lau-mo-hoi-yonex-sport-towel-ac810', 'Khăn bông dệt sợi cotton 100% kích thước 40x100cm, thấm hút nước nhanh và mềm mịn khi lau mặt giữa các hiệp đấu.', 'Thấm hút êm mịn', 'https://www.yonex.com/media/catalog/product/a/l/all_ac810_112-1.jpg', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Khăn lau mồ hôi thể thao Yonex Sport Towel AC810', brand_id = 'yonex', category_id = 'cat_accessory', description = 'Khăn bông dệt sợi cotton 100% kích thước 40x100cm, thấm hút nước nhanh và mềm mịn khi lau mặt giữa các hiệp đấu.', player_type = 'Thấm hút êm mịn', image_url = 'https://www.yonex.com/media/catalog/product/a/l/all_ac810_112-1.jpg', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('YONEX-ACC-AC810', v_pid, 190000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Chai xịt lạnh giảm đau chấn thương Starbalm Cold Spray 150ml (cat_accessory)
    SELECT id INTO v_pid FROM products WHERE slug = 'chai-xit-lanh-giam-dau-starbalm-cold-spray-150ml';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'starbalm', 'cat_accessory', 'Chai xịt lạnh giảm đau chấn thương Starbalm Cold Spray 150ml', 'chai-xit-lanh-giam-dau-starbalm-cold-spray-150ml', 'Xịt lạnh giảm đau tức thì cho các trường hợp lật sơ mi cổ chân, bong gân hoặc va chạm đối kháng trên sân cầu lông.', 'Sơ cứu chấn thương tức thì', 'https://www.starbalm.com/bestanden/artikelen/9/221_afb_1.jpg', 'https://www.starbalm.com', 12, true);
    ELSE
        UPDATE products SET name = 'Chai xịt lạnh giảm đau chấn thương Starbalm Cold Spray 150ml', brand_id = 'starbalm', category_id = 'cat_accessory', description = 'Xịt lạnh giảm đau tức thì cho các trường hợp lật sơ mi cổ chân, bong gân hoặc va chạm đối kháng trên sân cầu lông.', player_type = 'Sơ cứu chấn thương tức thì', image_url = 'https://www.starbalm.com/bestanden/artikelen/9/221_afb_1.jpg', image_source = 'https://www.starbalm.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('STARBALM-ACC-COLD-150', v_pid, 195000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Gel làm ấm cơ bắp thể thao Starbalm Warm Gel 100ml (cat_accessory)
    SELECT id INTO v_pid FROM products WHERE slug = 'gel-lam-am-co-bap-starbalm-warm-gel-100ml';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'starbalm', 'cat_accessory', 'Gel làm ấm cơ bắp thể thao Starbalm Warm Gel 100ml', 'gel-lam-am-co-bap-starbalm-warm-gel-100ml', 'Gel massage làm ấm và giãn cơ trước khi vào sân thi đấu, kích thích tuần hoàn máu và phòng ngừa chuột rút co thắt.', 'Khởi động & Chống chuột rút', 'https://www.starbalm.com/bestanden/artikelen/9/226_afb_6.jpg', 'https://www.starbalm.com', 12, true);
    ELSE
        UPDATE products SET name = 'Gel làm ấm cơ bắp thể thao Starbalm Warm Gel 100ml', brand_id = 'starbalm', category_id = 'cat_accessory', description = 'Gel massage làm ấm và giãn cơ trước khi vào sân thi đấu, kích thích tuần hoàn máu và phòng ngừa chuột rút co thắt.', player_type = 'Khởi động & Chống chuột rút', image_url = 'https://www.starbalm.com/bestanden/artikelen/9/226_afb_6.jpg', image_source = 'https://www.starbalm.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('STARBALM-ACC-WARMGEL-100', v_pid, 165000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Dầu xoa bóp thể thao Starbalm Massage Oil 100ml (cat_accessory)
    SELECT id INTO v_pid FROM products WHERE slug = 'dau-xoa-bop-the-thao-starbalm-massage-oil-100ml';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'starbalm', 'cat_accessory', 'Dầu xoa bóp thể thao Starbalm Massage Oil 100ml', 'dau-xoa-bop-the-thao-starbalm-massage-oil-100ml', 'Dầu massage thư giãn cơ bắp sau khi thi đấu cường độ cao, giúp đào thải acid lactic ứ đọng và hồi phục thể lực nhanh chóng.', 'Hồi phục thể lực sau trận', 'https://www.starbalm.com/bestanden/artikelen/9/223_afb_3.jpg', 'https://www.starbalm.com', 12, true);
    ELSE
        UPDATE products SET name = 'Dầu xoa bóp thể thao Starbalm Massage Oil 100ml', brand_id = 'starbalm', category_id = 'cat_accessory', description = 'Dầu massage thư giãn cơ bắp sau khi thi đấu cường độ cao, giúp đào thải acid lactic ứ đọng và hồi phục thể lực nhanh chóng.', player_type = 'Hồi phục thể lực sau trận', image_url = 'https://www.starbalm.com/bestanden/artikelen/9/223_afb_3.jpg', image_source = 'https://www.starbalm.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('STARBALM-ACC-MASSAGE-100', v_pid, 185000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Thanh lăn massage giảm mỏi cơ Starbalm Roll-on 75ml (cat_accessory)
    SELECT id INTO v_pid FROM products WHERE slug = 'thanh-lan-massage-giam-moi-co-starbalm-roll-on-75ml';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'starbalm', 'cat_accessory', 'Thanh lăn massage giảm mỏi cơ Starbalm Roll-on 75ml', 'thanh-lan-massage-giam-moi-co-starbalm-roll-on-75ml', 'Con lăn bi kim loại tiện dụng massage các vùng cơ cổ tay, bắp chân mà không làm dính tinh dầu ra tay khi đang cầm vợt.', 'Tiện lợi không dính tay', 'https://www.starbalm.com/bestanden/artikelen/9/222_afb_2.jpg', 'https://www.starbalm.com', 12, true);
    ELSE
        UPDATE products SET name = 'Thanh lăn massage giảm mỏi cơ Starbalm Roll-on 75ml', brand_id = 'starbalm', category_id = 'cat_accessory', description = 'Con lăn bi kim loại tiện dụng massage các vùng cơ cổ tay, bắp chân mà không làm dính tinh dầu ra tay khi đang cầm vợt.', player_type = 'Tiện lợi không dính tay', image_url = 'https://www.starbalm.com/bestanden/artikelen/9/222_afb_2.jpg', image_source = 'https://www.starbalm.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('STARBALM-ACC-ROLLON-75', v_pid, 175000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Vợt cũ kiểm định Yonex Astrox 88D Pro Hạng A (cat_secondhand)
    SELECT id INTO v_pid FROM products WHERE slug = 'vot-cu-yonex-astrox-88d-pro-hang-a';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_secondhand', 'Vợt cũ kiểm định Yonex Astrox 88D Pro Hạng A', 'vot-cu-yonex-astrox-88d-pro-hang-a', 'Vợt cầu lông đã qua kiểm định 16 tiêu chí, đạt Hạng A (98% như mới), nguyên bản không hàn vá khung, bảo hành 60 ngày tại hệ thống.', 'Tấn công cầu sau đã kiểm định', '/images/secondhand/sh-astrox-88d-pro.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Vợt cũ kiểm định Yonex Astrox 88D Pro Hạng A', brand_id = 'yonex', category_id = 'cat_secondhand', description = 'Vợt cầu lông đã qua kiểm định 16 tiêu chí, đạt Hạng A (98% như mới), nguyên bản không hàn vá khung, bảo hành 60 ngày tại hệ thống.', player_type = 'Tấn công cầu sau đã kiểm định', image_url = '/images/secondhand/sh-astrox-88d-pro.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SH-CAT-AST88D-A', v_pid, 3100000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Vợt cũ kiểm định Yonex Nanoflare 800 Pro Hạng B (cat_secondhand)
    SELECT id INTO v_pid FROM products WHERE slug = 'vot-cu-yonex-nanoflare-800-pro-hang-b';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_secondhand', 'Vợt cũ kiểm định Yonex Nanoflare 800 Pro Hạng B', 'vot-cu-yonex-nanoflare-800-pro-hang-b', 'Vợt phản tạt tốc độ đã qua kiểm định máy scan carbon, xước sơn nhẹ viền 12h, bảo hành khung 30 ngày.', 'Phản tạt tốc độ đã kiểm định', '/images/secondhand/sh-nanoflare-800-pro.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Vợt cũ kiểm định Yonex Nanoflare 800 Pro Hạng B', brand_id = 'yonex', category_id = 'cat_secondhand', description = 'Vợt phản tạt tốc độ đã qua kiểm định máy scan carbon, xước sơn nhẹ viền 12h, bảo hành khung 30 ngày.', player_type = 'Phản tạt tốc độ đã kiểm định', image_url = '/images/secondhand/sh-nanoflare-800-pro.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SH-CAT-NF800P-B', v_pid, 2650000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Vợt cũ kiểm định Yonex Astrox 77 Pro Hạng C (cat_secondhand)
    SELECT id INTO v_pid FROM products WHERE slug = 'vot-cu-yonex-astrox-77-pro-hang-c';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_secondhand', 'Vợt cũ kiểm định Yonex Astrox 77 Pro Hạng C', 'vot-cu-yonex-astrox-77-pro-hang-c', 'Cây vợt công thủ toàn diện giá mềm, có vết cọ quẹt sơn bên hông khung nhưng kết cấu sợi carbon nguyên vẹn 100%, bảo hành 30 ngày.', 'Công thủ toàn diện tiết kiệm', '/images/secondhand/sh-astrox-77-pro.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Vợt cũ kiểm định Yonex Astrox 77 Pro Hạng C', brand_id = 'yonex', category_id = 'cat_secondhand', description = 'Cây vợt công thủ toàn diện giá mềm, có vết cọ quẹt sơn bên hông khung nhưng kết cấu sợi carbon nguyên vẹn 100%, bảo hành 30 ngày.', player_type = 'Công thủ toàn diện tiết kiệm', image_url = '/images/secondhand/sh-astrox-77-pro.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SH-CAT-AST77P-C', v_pid, 2100000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Vợt cũ kiểm định Yonex Astrox 100ZZ Kurenai Hạng A (cat_secondhand)
    SELECT id INTO v_pid FROM products WHERE slug = 'vot-cu-yonex-astrox-100zz-hang-a';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_secondhand', 'Vợt cũ kiểm định Yonex Astrox 100ZZ Kurenai Hạng A', 'vot-cu-yonex-astrox-100zz-hang-a', 'Vũ khí siêu cứng của Viktor Axelsen ngoại hình như mới 99%, đầy đủ số serial xuất xứ chính hãng phân phối Sunrise.', 'Tấn công hủy diệt kiểm định', '/images/secondhand/sh-astrox-100zz.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Vợt cũ kiểm định Yonex Astrox 100ZZ Kurenai Hạng A', brand_id = 'yonex', category_id = 'cat_secondhand', description = 'Vũ khí siêu cứng của Viktor Axelsen ngoại hình như mới 99%, đầy đủ số serial xuất xứ chính hãng phân phối Sunrise.', player_type = 'Tấn công hủy diệt kiểm định', image_url = '/images/secondhand/sh-astrox-100zz.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SH-CAT-AST100ZZ-A', v_pid, 3350000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Vợt cũ kiểm định Yonex Arcsaber 11 Pro Hạng A (cat_secondhand)
    SELECT id INTO v_pid FROM products WHERE slug = 'vot-cu-yonex-arcsaber-11-pro-hang-a';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'yonex', 'cat_secondhand', 'Vợt cũ kiểm định Yonex Arcsaber 11 Pro Hạng A', 'vot-cu-yonex-arcsaber-11-pro-hang-a', 'Cây vợt điều cầu số 1 thế giới được tuyển chọn khắt khe, không vết trầy, tặng kèm cước đan mới theo yêu cầu.', 'Điều cầu kiểm soát kiểm định', '/images/secondhand/sh-arcsaber-11-pro.png', 'https://www.yonex.com', 12, true);
    ELSE
        UPDATE products SET name = 'Vợt cũ kiểm định Yonex Arcsaber 11 Pro Hạng A', brand_id = 'yonex', category_id = 'cat_secondhand', description = 'Cây vợt điều cầu số 1 thế giới được tuyển chọn khắt khe, không vết trầy, tặng kèm cước đan mới theo yêu cầu.', player_type = 'Điều cầu kiểm soát kiểm định', image_url = '/images/secondhand/sh-arcsaber-11-pro.png', image_source = 'https://www.yonex.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SH-CAT-ARC11P-A', v_pid, 3150000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Vợt cũ kiểm định Li-Ning Axforce 80 Hạng B (cat_secondhand)
    SELECT id INTO v_pid FROM products WHERE slug = 'vot-cu-lining-axforce-80-hang-b';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'lining', 'cat_secondhand', 'Vợt cũ kiểm định Li-Ning Axforce 80 Hạng B', 'vot-cu-lining-axforce-80-hang-b', 'Dòng vợt của Chen Long với carbon dẻo đàn hồi, đã được căn chỉnh trọng lượng đầu và kiểm tra độ vặn xoắn thân đũa.', 'Tấn công dẻo dai kiểm định', '/images/secondhand/sh-axforce-80.jpg', 'https://www.lining.com', 12, true);
    ELSE
        UPDATE products SET name = 'Vợt cũ kiểm định Li-Ning Axforce 80 Hạng B', brand_id = 'lining', category_id = 'cat_secondhand', description = 'Dòng vợt của Chen Long với carbon dẻo đàn hồi, đã được căn chỉnh trọng lượng đầu và kiểm tra độ vặn xoắn thân đũa.', player_type = 'Tấn công dẻo dai kiểm định', image_url = '/images/secondhand/sh-axforce-80.jpg', image_source = 'https://www.lining.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SH-CAT-AX80-B', v_pid, 2850000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Vợt cũ kiểm định Li-Ning Halbertec 8000 Hạng A (cat_secondhand)
    SELECT id INTO v_pid FROM products WHERE slug = 'vot-cu-lining-halbertec-8000-hang-a';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'lining', 'cat_secondhand', 'Vợt cũ kiểm định Li-Ning Halbertec 8000 Hạng A', 'vot-cu-lining-halbertec-8000-hang-a', 'Vợt của Yuta Watanabe kiểm soát nhịp độ trận đấu tinh tế, tình trạng hoàn hảo như vừa mở hộp, tem chống hàng giả nguyên seal.', 'Công thủ biến hóa kiểm định', '/images/secondhand/sh-halbertec-8000.jpg', 'https://www.lining.com', 12, true);
    ELSE
        UPDATE products SET name = 'Vợt cũ kiểm định Li-Ning Halbertec 8000 Hạng A', brand_id = 'lining', category_id = 'cat_secondhand', description = 'Vợt của Yuta Watanabe kiểm soát nhịp độ trận đấu tinh tế, tình trạng hoàn hảo như vừa mở hộp, tem chống hàng giả nguyên seal.', player_type = 'Công thủ biến hóa kiểm định', image_url = '/images/secondhand/sh-halbertec-8000.jpg', image_source = 'https://www.lining.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SH-CAT-HAL8000-A', v_pid, 3050000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Vợt cũ kiểm định Victor Thruster Ryuga II Hạng A (cat_secondhand)
    SELECT id INTO v_pid FROM products WHERE slug = 'vot-cu-victor-thruster-ryuga-ii-hang-a';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_secondhand', 'Vợt cũ kiểm định Victor Thruster Ryuga II Hạng A', 'vot-cu-victor-thruster-ryuga-ii-hang-a', 'Cây vợt smash cắm sân của Lee Zii Jia, thân đũa WES 2.0 đàn hồi mạnh mẽ, đã test sức căng an toàn 30 LBS.', 'Smash sấm sét kiểm định', '/images/secondhand/sh-ryuga-ii.webp', 'https://www.victorsport.com', 12, true);
    ELSE
        UPDATE products SET name = 'Vợt cũ kiểm định Victor Thruster Ryuga II Hạng A', brand_id = 'victor', category_id = 'cat_secondhand', description = 'Cây vợt smash cắm sân của Lee Zii Jia, thân đũa WES 2.0 đàn hồi mạnh mẽ, đã test sức căng an toàn 30 LBS.', player_type = 'Smash sấm sét kiểm định', image_url = '/images/secondhand/sh-ryuga-ii.webp', image_source = 'https://www.victorsport.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SH-CAT-RYUGA2-A', v_pid, 2900000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Vợt cũ kiểm định Victor Auraspeed 100X Hạng B (cat_secondhand)
    SELECT id INTO v_pid FROM products WHERE slug = 'vot-cu-victor-auraspeed-100x-hang-b';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'victor', 'cat_secondhand', 'Vợt cũ kiểm định Victor Auraspeed 100X Hạng B', 'vot-cu-victor-auraspeed-100x-hang-b', 'Khung vát kim cương xé gió cực nhanh cho người thích lối chơi cầu nhanh tì đè, bảo hành uy tín tại mọi chi nhánh.', 'Tì đè phản xạ kiểm định', '/images/secondhand/sh-auraspeed-100x.webp', 'https://www.victorsport.com', 12, true);
    ELSE
        UPDATE products SET name = 'Vợt cũ kiểm định Victor Auraspeed 100X Hạng B', brand_id = 'victor', category_id = 'cat_secondhand', description = 'Khung vát kim cương xé gió cực nhanh cho người thích lối chơi cầu nhanh tì đè, bảo hành uy tín tại mọi chi nhánh.', player_type = 'Tì đè phản xạ kiểm định', image_url = '/images/secondhand/sh-auraspeed-100x.webp', image_source = 'https://www.victorsport.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SH-CAT-ARS100X-B', v_pid, 2700000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

    -- Vợt cũ kiểm định Mizuno Fortius 11 Quick Hạng A (cat_secondhand)
    SELECT id INTO v_pid FROM products WHERE slug = 'vot-cu-mizuno-fortius-11-quick-hang-a';
    IF v_pid IS NULL THEN
        v_pid := gen_random_uuid();
        INSERT INTO products (id, brand_id, category_id, name, slug, description, player_type, image_url, image_source, warranty_months, is_active)
        VALUES (v_pid, 'mizuno', 'cat_secondhand', 'Vợt cũ kiểm định Mizuno Fortius 11 Quick Hạng A', 'vot-cu-mizuno-fortius-11-quick-hang-a', 'Cực phẩm tốc độ Made in Japan với công nghệ khớp nối Beyond Force System trợ lực bộc phát, ngoại hình 98%.', 'Thần tốc Nhật Bản kiểm định', '/images/secondhand/sh-fortius-11-quick.png', 'https://www.mizuno.com', 12, true);
    ELSE
        UPDATE products SET name = 'Vợt cũ kiểm định Mizuno Fortius 11 Quick Hạng A', brand_id = 'mizuno', category_id = 'cat_secondhand', description = 'Cực phẩm tốc độ Made in Japan với công nghệ khớp nối Beyond Force System trợ lực bộc phát, ngoại hình 98%.', player_type = 'Thần tốc Nhật Bản kiểm định', image_url = '/images/secondhand/sh-fortius-11-quick.png', image_source = 'https://www.mizuno.com' WHERE id = v_pid;
    END IF;
    INSERT INTO skus (id, product_id, price, is_active, size, color)
    VALUES ('SH-CAT-FT11Q-A', v_pid, 2950000, true, NULL, NULL)
    ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, is_active = true, size = EXCLUDED.size, color = EXCLUDED.color;

END $$;

-- 6. Final verification query
SELECT c.id, c.name, COUNT(p.id) as product_count FROM categories c LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id, c.name ORDER BY c.id;