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
