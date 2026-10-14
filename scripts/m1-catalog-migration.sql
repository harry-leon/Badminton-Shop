-- Migration & Seed for Milestone M1 (Catalog Upgrade)
\connect catalog_db;

-- 1. Create product_images table
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

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort ON product_images(product_id, sort_order ASC, id ASC);

-- 2. Alter products table with standardized attribute columns
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS play_style VARCHAR(50),
ADD COLUMN IF NOT EXISTS play_style_code VARCHAR(30),
ADD COLUMN IF NOT EXISTS balance_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS shaft_stiffness VARCHAR(50),
ADD COLUMN IF NOT EXISTS weight_classes VARCHAR(50),
ADD COLUMN IF NOT EXISTS grip_sizes VARCHAR(50),
ADD COLUMN IF NOT EXISTS max_tension_lbs INT,
ADD COLUMN IF NOT EXISTS max_tension_kg NUMERIC(4,1),
ADD COLUMN IF NOT EXISTS length_mm INT DEFAULT 675,
ADD COLUMN IF NOT EXISTS frame_shape VARCHAR(50) DEFAULT 'ISOMETRIC',
ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'Chuyên nghiệp';

-- 3. Create product_attributes table
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

CREATE INDEX IF NOT EXISTS idx_product_attributes_product_id ON product_attributes(product_id);

-- 4. Seed 70 product_images (7 angles for all 10 products)
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT id, image_url FROM products LOOP
        -- 1. FRONT (sort_order = 1, is_primary = true)
        INSERT INTO product_images (product_id, angle, image_url, sort_order, is_primary)
        VALUES (rec.id, 'FRONT', rec.image_url, 1, TRUE)
        ON CONFLICT (product_id, angle) DO UPDATE 
        SET image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order, is_primary = EXCLUDED.is_primary;

        -- 2. BACK (sort_order = 2, is_primary = false)
        INSERT INTO product_images (product_id, angle, image_url, sort_order, is_primary)
        VALUES (rec.id, 'BACK', rec.image_url, 2, FALSE)
        ON CONFLICT (product_id, angle) DO UPDATE 
        SET image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order, is_primary = EXCLUDED.is_primary;

        -- 3. SIDE (sort_order = 3, is_primary = false)
        INSERT INTO product_images (product_id, angle, image_url, sort_order, is_primary)
        VALUES (rec.id, 'SIDE', rec.image_url, 3, FALSE)
        ON CONFLICT (product_id, angle) DO UPDATE 
        SET image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order, is_primary = EXCLUDED.is_primary;

        -- 4. HEAD (sort_order = 4, is_primary = false)
        INSERT INTO product_images (product_id, angle, image_url, sort_order, is_primary)
        VALUES (rec.id, 'HEAD', rec.image_url, 4, FALSE)
        ON CONFLICT (product_id, angle) DO UPDATE 
        SET image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order, is_primary = EXCLUDED.is_primary;

        -- 5. THROAT (sort_order = 5, is_primary = false)
        INSERT INTO product_images (product_id, angle, image_url, sort_order, is_primary)
        VALUES (rec.id, 'THROAT', rec.image_url, 5, FALSE)
        ON CONFLICT (product_id, angle) DO UPDATE 
        SET image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order, is_primary = EXCLUDED.is_primary;

        -- 6. GRIP (sort_order = 6, is_primary = false)
        INSERT INTO product_images (product_id, angle, image_url, sort_order, is_primary)
        VALUES (rec.id, 'GRIP', rec.image_url, 6, FALSE)
        ON CONFLICT (product_id, angle) DO UPDATE 
        SET image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order, is_primary = EXCLUDED.is_primary;

        -- 7. DETAIL (sort_order = 7, is_primary = false)
        INSERT INTO product_images (product_id, angle, image_url, sort_order, is_primary)
        VALUES (rec.id, 'DETAIL', rec.image_url, 7, FALSE)
        ON CONFLICT (product_id, angle) DO UPDATE 
        SET image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order, is_primary = EXCLUDED.is_primary;
    END LOOP;
END $$;

-- 5. Populate standardized attributes for all 10 products
UPDATE products SET
    play_style = 'Tấn công',
    play_style_code = 'ATTACK',
    balance_category = 'Nặng đầu',
    shaft_stiffness = 'Cứng',
    weight_classes = '3U, 4U',
    grip_sizes = 'G5',
    max_tension_lbs = 29,
    max_tension_kg = 13.0,
    length_mm = 675,
    frame_shape = 'ISOMETRIC',
    level = 'Chuyên nghiệp'
WHERE slug = 'yonex-astrox-99-pro';

UPDATE products SET
    play_style = 'Tấn công',
    play_style_code = 'ATTACK',
    balance_category = 'Nặng đầu',
    shaft_stiffness = 'Rất cứng',
    weight_classes = '3U, 4U',
    grip_sizes = 'G5',
    max_tension_lbs = 29,
    max_tension_kg = 13.0,
    length_mm = 675,
    frame_shape = 'ISOMETRIC',
    level = 'Chuyên nghiệp'
WHERE slug = 'yonex-astrox-100zz';

UPDATE products SET
    play_style = 'Tấn công',
    play_style_code = 'ATTACK',
    balance_category = 'Nặng đầu',
    shaft_stiffness = 'Cứng',
    weight_classes = '3U, 4U',
    grip_sizes = 'G5',
    max_tension_lbs = 29,
    max_tension_kg = 13.0,
    length_mm = 675,
    frame_shape = 'ISOMETRIC',
    level = 'Chuyên nghiệp'
WHERE slug = 'yonex-astrox-88d-pro';

UPDATE products SET
    play_style = 'Phòng thủ',
    play_style_code = 'DEFENSE',
    balance_category = 'Cân bằng',
    shaft_stiffness = 'Cứng',
    weight_classes = '4U',
    grip_sizes = 'G5',
    max_tension_lbs = 28,
    max_tension_kg = 12.5,
    length_mm = 675,
    frame_shape = 'ISOMETRIC',
    level = 'Chuyên nghiệp'
WHERE slug = 'yonex-astrox-88s-pro';

UPDATE products SET
    play_style = 'Phòng thủ',
    play_style_code = 'DEFENSE',
    balance_category = 'Cân bằng',
    shaft_stiffness = 'Rất cứng',
    weight_classes = '3U, 4U',
    grip_sizes = 'G5',
    max_tension_lbs = 29,
    max_tension_kg = 13.0,
    length_mm = 675,
    frame_shape = 'AERO_BOX',
    level = 'Chuyên nghiệp'
WHERE slug = 'yonex-nanoflare-1000z';

UPDATE products SET
    play_style = 'Công thủ toàn diện',
    play_style_code = 'ALL_AROUND',
    balance_category = 'Cân bằng',
    shaft_stiffness = 'Cứng',
    weight_classes = '3U, 4U',
    grip_sizes = 'G5',
    max_tension_lbs = 29,
    max_tension_kg = 13.0,
    length_mm = 675,
    frame_shape = 'ISOMETRIC',
    level = 'Chuyên nghiệp'
WHERE slug = 'yonex-arcsaber-11-pro';

UPDATE products SET
    play_style = 'Tấn công',
    play_style_code = 'ATTACK',
    balance_category = 'Nặng đầu',
    shaft_stiffness = 'Cứng',
    weight_classes = '3U, 4U, 5U',
    grip_sizes = 'G5, G6',
    max_tension_lbs = 31,
    max_tension_kg = 14.0,
    length_mm = 675,
    frame_shape = 'AERO_BOX',
    level = 'Chuyên nghiệp'
WHERE slug = 'lining-axforce-80';

UPDATE products SET
    play_style = 'Công thủ toàn diện',
    play_style_code = 'ALL_AROUND',
    balance_category = 'Cân bằng',
    shaft_stiffness = 'Trung bình',
    weight_classes = '3U, 4U',
    grip_sizes = 'G5',
    max_tension_lbs = 31,
    max_tension_kg = 14.0,
    length_mm = 675,
    frame_shape = 'ISOMETRIC',
    level = 'Chuyên nghiệp'
WHERE slug = 'lining-halbertec-8000';

UPDATE products SET
    play_style = 'Tấn công',
    play_style_code = 'ATTACK',
    balance_category = 'Nặng đầu',
    shaft_stiffness = 'Cứng',
    weight_classes = '3U, 4U',
    grip_sizes = 'G5',
    max_tension_lbs = 32,
    max_tension_kg = 14.5,
    length_mm = 675,
    frame_shape = 'ISOMETRIC',
    level = 'Chuyên nghiệp'
WHERE slug = 'victor-thruster-ryuga-ii';

UPDATE products SET
    play_style = 'Phòng thủ',
    play_style_code = 'DEFENSE',
    balance_category = 'Cân bằng',
    shaft_stiffness = 'Cứng',
    weight_classes = '3U, 4U',
    grip_sizes = 'G5',
    max_tension_lbs = 30,
    max_tension_kg = 13.5,
    length_mm = 675,
    frame_shape = 'AERO_BOX',
    level = 'Chuyên nghiệp'
WHERE slug = 'victor-auraspeed-100x';

-- Populate product_attributes table from products and skus
INSERT INTO product_attributes (
    product_id,
    balance_point_mm,
    balance_category,
    shaft_stiffness,
    weight_grip,
    max_tension_lbs,
    max_tension_kg,
    length_mm,
    frame_shape,
    play_style
)
SELECT 
    p.id,
    COALESCE(MIN(s.balance_point_mm), 295) as balance_point_mm,
    p.balance_category,
    p.shaft_stiffness,
    p.weight_classes || ' ' || p.grip_sizes as weight_grip,
    p.max_tension_lbs,
    p.max_tension_kg,
    p.length_mm,
    p.frame_shape,
    p.play_style
FROM products p
LEFT JOIN skus s ON p.id = s.product_id
GROUP BY p.id, p.balance_category, p.shaft_stiffness, p.weight_classes, p.grip_sizes, p.max_tension_lbs, p.max_tension_kg, p.length_mm, p.frame_shape, p.play_style
ON CONFLICT (product_id) DO UPDATE SET
    balance_point_mm = EXCLUDED.balance_point_mm,
    balance_category = EXCLUDED.balance_category,
    shaft_stiffness = EXCLUDED.shaft_stiffness,
    weight_grip = EXCLUDED.weight_grip,
    max_tension_lbs = EXCLUDED.max_tension_lbs,
    max_tension_kg = EXCLUDED.max_tension_kg,
    length_mm = EXCLUDED.length_mm,
    frame_shape = EXCLUDED.frame_shape,
    play_style = EXCLUDED.play_style;
