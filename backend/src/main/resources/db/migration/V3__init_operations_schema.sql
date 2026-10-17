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
