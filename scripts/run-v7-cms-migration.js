const { Client } = require('../frontend/node_modules/pg');

const dbConfig = {
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'catalog_db'
};

async function runMigration() {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    console.log('Connected to catalog_db successfully.');

    await client.query('BEGIN');

    // 1. Bổ sung position và các trường cần thiết cho banners
    console.log('1. Updating banners table...');
    await client.query(`
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS position VARCHAR(50) DEFAULT 'HERO_SLIDER';
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS badge VARCHAR(255);
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS primary_cta_text VARCHAR(100);
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS primary_cta_link VARCHAR(255);
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS secondary_cta_text VARCHAR(100);
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS secondary_cta_link VARCHAR(255);
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS product_tag VARCHAR(255);
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS product_sub VARCHAR(255);
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS product_price VARCHAR(100);
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ;
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS end_at TIMESTAMPTZ;
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE banners ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
      CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);
    `);

    // Chuẩn hóa position hiện có nếu là HOME_MAIN
    await client.query(`
      UPDATE banners SET position = 'HERO_SLIDER' WHERE position = 'HOME_MAIN' OR position IS NULL;
    `);

    // 2. Bổ sung trường hiển thị cho categories
    console.log('2. Updating categories table...');
    await client.query(`
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS tag_subtitle VARCHAR(255);
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT TRUE;
    `);

    // 3. Tạo bảng quản lý Tag & Huy hiệu sản phẩm
    console.log('3. Creating product_tags table...');
    await client.query(`
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

      INSERT INTO product_tags (id, code, name, bg_color, text_color, icon_name, sort_order) VALUES
      ('tag_hot', 'HOT', 'Bán chạy / Hot', '#D97706', '#FFFFFF', 'Flame', 1),
      ('tag_new', 'NEW', 'Mới về', '#0F5132', '#FFFFFF', 'Sparkles', 2),
      ('tag_sale', 'SALE', 'Khuyến mãi sốc', '#DC2626', '#FFFFFF', 'Tag', 3),
      ('tag_limited', 'LIMITED', 'Bản giới hạn', '#7C3AED', '#FFFFFF', 'Star', 4),
      ('tag_gift', 'GIFT', 'Tặng cước + Quấn cán', '#2563EB', '#FFFFFF', 'Gift', 5),
      ('tag_top1', 'TOP1', 'Khuyên dùng cho VĐV', '#B45309', '#FFFFFF', 'Award', 6)
      ON CONFLICT (id) DO NOTHING;
    `);

    // 4. Tạo bảng Cài đặt chung Giao diện (site_settings)
    console.log('4. Creating site_settings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        group_name VARCHAR(50) NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_by VARCHAR(100)
      );

      INSERT INTO site_settings (key, value, group_name, description) VALUES
      ('header_hotline', '1900 6868', 'HEADER', 'Hotline hiển thị trên thanh công cụ đầu trang'),
      ('header_hotline_hours', '08:30 – 21:30', 'HEADER', 'Giờ phục vụ hotline'),
      ('header_announcement', 'Smash Court — Hệ thống phân phối Yonex, Victor, Li-Ning chính hãng & Sàn vợt cũ 16 tiêu chí', 'HEADER', 'Dòng thông báo chạy hoặc hiển thị đầu trang'),
      ('store_logo_text', 'SmashCourt', 'HEADER', 'Tên thương hiệu text logo'),
      ('footer_hotline', '1900 6868 (Miễn phí)', 'FOOTER', 'Hotline hiển thị ở Footer'),
      ('footer_email', 'cskh@smashcourt.vn', 'FOOTER', 'Email tiếp nhận khiếu nại & CSKH'),
      ('footer_address_hcm', '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM', 'FOOTER', 'Địa chỉ Showroom HCM'),
      ('footer_address_hn', '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội', 'FOOTER', 'Địa chỉ Showroom Hà Nội'),
      ('footer_address_dn', '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu, Đà Nẵng', 'FOOTER', 'Địa chỉ Showroom Đà Nẵng'),
      ('footer_zalo_url', 'https://zalo.me/0988123456', 'SOCIAL', 'Liên kết Zalo CSKH'),
      ('footer_facebook_url', 'https://facebook.com/smashcourt.badminton', 'SOCIAL', 'Liên kết Fanpage Facebook')
      ON CONFLICT (key) DO NOTHING;
    `);

    // 5. Seed dữ liệu mặc định cho Bộ 3 Banner Ưu đãi (HOME_PROMO_3) vào banners
    console.log('5. Seeding HOME_PROMO_3 banners...');
    await client.query(`
      INSERT INTO banners (id, position, title, badge, description, primary_cta_text, primary_cta_link, image_url, sort_order, is_active)
      VALUES
      ('promo-yonex-sale-30', 'HOME_PROMO_3', 'VỢT YONEX SALE 30%', 'ƯU ĐÃI TUẦN NÀY', 'Tặng combo cước BG65 + Quấn cán miễn phí khi mua dòng vợt Astrox, Nanoflare.', 'Săn ngay', '/vot-cau-long?brand=Yonex', 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80', 1, true),
      ('promo-giay-2026', 'HOME_PROMO_3', 'GIÀY THI ĐẤU 2026', 'BỘ SƯU TẬP MỚI', 'Đệm Power Cushion + trợ lực khớp gối, thoáng khí và bám sân cực êm.', 'Khám phá', '/giay-cau-long', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80', 2, true),
      ('promo-vot-cu-16-tc', 'HOME_PROMO_3', 'SÀN VỢT CŨ 16 TIÊU CHÍ', 'ĐỘC QUYỀN SMASHCOURT', 'Bảo hành kết cấu 30 ngày, chụp soi rõ từng vết trầy, tiết kiệm tới 40%.', 'Xem kho vợt', '/second-hand', 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=800&auto=format&fit=crop&q=80', 3, true)
      ON CONFLICT (id) DO UPDATE SET 
        position = EXCLUDED.position,
        title = EXCLUDED.title,
        badge = EXCLUDED.badge,
        description = EXCLUDED.description,
        primary_cta_text = EXCLUDED.primary_cta_text,
        primary_cta_link = EXCLUDED.primary_cta_link,
        image_url = EXCLUDED.image_url,
        sort_order = EXCLUDED.sort_order;
    `);

    // 6. Seed dữ liệu mặc định cho Dải Cam kết Vàng (USP_BAR)
    console.log('6. Seeding USP_BAR items...');
    await client.query(`
      INSERT INTO banners (id, position, title, badge, description, image_url, sort_order, is_active)
      VALUES
      ('usp-van-chuyen', 'USP_BAR', 'Vận chuyển TOÀN QUỐC', 'Truck', 'Thanh toán khi nhận hàng', '', 1, true),
      ('usp-chat-luong', 'USP_BAR', 'Bảo đảm chất lượng', 'ThumbsUp', 'Sản phẩm 100% chính hãng BWF', '', 2, true),
      ('usp-thanh-toan', 'USP_BAR', 'Tiến hành THANH TOÁN', 'CreditCard', 'Với nhiều PHƯƠNG THỨC linh hoạt', '', 3, true),
      ('usp-doi-tra', 'USP_BAR', 'Đổi sản phẩm mới', 'RotateCcw', 'Đổi mới 7 ngày nếu lỗi nhà sản xuất', '', 4, true)
      ON CONFLICT (id) DO UPDATE SET 
        position = EXCLUDED.position,
        title = EXCLUDED.title,
        badge = EXCLUDED.badge,
        description = EXCLUDED.description,
        sort_order = EXCLUDED.sort_order;
    `);

    // 7. Seed dữ liệu mặc định cho VĐV Đại diện (ATHLETES)
    console.log('7. Seeding ATHLETES items...');
    await client.query(`
      INSERT INTO banners (id, position, title, badge, description, primary_cta_text, primary_cta_link, image_url, sort_order, is_active)
      VALUES
      ('athlete-viktor-axelsen', 'ATHLETES', 'Viktor Axelsen', 'Kỷ Lục Gia Thế Giới', 'Đại sứ vũ khí Yonex Astrox 100ZZ Kurenai', 'Chi tiết vũ khí', '/vot-cau-long?brand=Yonex', 'https://images.unsplash.com/photo-1521537634581-0dced2fed2a8?w=800&auto=format&fit=crop&q=80', 1, true),
      ('athlete-kento-momota', 'ATHLETES', 'Kento Momota', 'Nhà Vô Địch Thế Giới 2 Lần', 'Huyền thoại kiểm soát cầu cùng Yonex Astrox 99 Pro White Tiger', 'Xem bộ sưu tập', '/vot-cau-long?brand=Yonex', 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80', 2, true),
      ('athlete-an-se-young', 'ATHLETES', 'An Se-young', 'Số 1 Đơn Nữ Thế Giới', 'Vũ khí bứt phá phản tạt Yonex Arcsaber 11 Pro', 'Tìm hiểu ngay', '/vot-cau-long?brand=Yonex', 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&auto=format&fit=crop&q=80', 3, true)
      ON CONFLICT (id) DO UPDATE SET 
        position = EXCLUDED.position,
        title = EXCLUDED.title,
        badge = EXCLUDED.badge,
        description = EXCLUDED.description,
        primary_cta_text = EXCLUDED.primary_cta_text,
        primary_cta_link = EXCLUDED.primary_cta_link,
        image_url = EXCLUDED.image_url,
        sort_order = EXCLUDED.sort_order;
    `);

    // 8. Cập nhật ảnh và tag phụ cho bảng categories
    console.log('8. Updating category images and subtitles...');
    await client.query(`
      -- Đảm bảo các categories chính có dữ liệu
      INSERT INTO categories (id, name, slug, description, image_url, tag_subtitle, sort_order, is_featured)
      VALUES
      ('cat_racket', 'Vợt Cầu Lông', 'vot-cau-long', 'Vợt thi đấu & tập luyện chính hãng', '/images/categories/cat-vot-cau-long-v2.png', 'Yonex · Victor · Li-Ning', 1, true),
      ('cat_shoes', 'Giày Cầu Lông', 'giay-cau-long', 'Giày chuyên dụng bám thảm sân cầu', '/images/categories/cat-giay-cau-long-v2.png', 'Bám sân · Giảm chấn gót', 2, true),
      ('cat_apparel', 'Áo Quần Cầu Lông', 'quan-ao', 'Trang phục thi đấu thể thao', '/images/categories/cat-ao-cau-long-v2.png', 'Thoáng khí · Thấm mồ hôi', 3, true),
      ('cat_bag', 'Túi & Balo Vợt', 'tui-bao-vot', 'Bao vợt & balo chuyên dụng cách nhiệt', '/images/categories/cat-tui-balo-vot-v2.png', 'Cách nhiệt · Ngăn giày riêng', 4, true),
      ('cat_string', 'Dây Cước Đan', 'day-cuoc', 'Cước vợt cầu lông Yonex, Victor, Lining', '/images/categories/cat-day-cuoc-dan-v2.png', 'Đan máy điện tử lấy ngay', 5, true),
      ('cat_grip', 'Quấn Cán Vợt', 'quan-can', 'Quấn cán cao su êm tay chống trượt', '/images/categories/cat-quan-can-ac102-v2.png', 'Êm tay · Chống trơn trượt', 6, true),
      ('cat_secondhand', 'Vợt Cũ Kiểm Định', 'second-hand', 'Sàn giao dịch vợt cũ 16 tiêu chí độc quyền', '/images/categories/cat-vot-cu-kiem-dinh-v2.png', '16 tiêu chuẩn độc bản ★', 7, true),
      ('cat_accessory', 'Phụ Kiện Khác', 'phu-kien', 'Băng cổ tay, móc khóa, lót giày, tất chân', '/images/categories/cat-phu-kien-khac-v2.png', 'Tất · Băng chặn mồ hôi', 8, true)
      ON CONFLICT (slug) DO UPDATE SET
        image_url = EXCLUDED.image_url,
        tag_subtitle = EXCLUDED.tag_subtitle,
        sort_order = EXCLUDED.sort_order,
        is_featured = EXCLUDED.is_featured;
    `);

    await client.query('COMMIT');
    console.log('✅ Migration V7 CMS executed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    throw err;
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);
