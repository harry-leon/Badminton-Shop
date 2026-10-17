-- V5__extend_banners_and_homepage_cms.sql
-- Extend banners table for Homepage CMS & Hero Slider Management

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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_banners_active_pos ON banners(is_active, position);
CREATE INDEX IF NOT EXISTS idx_banners_validity ON banners(start_at, end_at);
