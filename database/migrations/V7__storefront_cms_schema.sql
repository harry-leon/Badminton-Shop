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
