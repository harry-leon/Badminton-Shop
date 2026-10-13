-- =========================================================================
-- DATABASE SCHEMAS FOR ALL SERVICES — ZERO MOCK, PRODUCTION READY
-- =========================================================================

-- -------------------------------------------------------------------------
-- INVENTORY SERVICE (inventory_db)
-- -------------------------------------------------------------------------
\connect inventory_db;

CREATE TABLE IF NOT EXISTS stock_levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id VARCHAR(50) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    item_type VARCHAR(20) DEFAULT 'STANDARD', -- STANDARD or UNIQUE (for second-hand, quantity <= 1)
    on_hand INT NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
    reserved INT NOT NULL DEFAULT 0 CHECK (reserved >= 0),
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_reserved_lte_on_hand CHECK (reserved <= on_hand),
    CONSTRAINT chk_unique_item_qty CHECK (item_type != 'UNIQUE' OR on_hand <= 1),
    UNIQUE(branch_id, sku)
);

CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id VARCHAR(50) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    movement_type VARCHAR(50) NOT NULL, -- INBOUND, OUTBOUND_SALE, TRANSFER_OUT, TRANSFER_IN, ADJUSTMENT_AUDIT
    quantity INT NOT NULL, -- positive for inbound/add, negative for outbound/sub
    reference_id VARCHAR(100),
    reason TEXT NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    branch_id VARCHAR(50) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, RELEASED, FULFILLED
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_transfers (
    id VARCHAR(50) PRIMARY KEY, -- TRF-20261013-0001
    from_branch_id VARCHAR(50) NOT NULL,
    to_branch_id VARCHAR(50) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    received_quantity INT DEFAULT 0,
    discrepancy_quantity INT DEFAULT 0,
    discrepancy_reason TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, APPROVED, IN_TRANSIT, RECEIVED, PARTIALLY_RECEIVED, CANCELLED
    created_by VARCHAR(100) NOT NULL,
    approved_by VARCHAR(100),
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- ORDER SERVICE (order_db)
-- -------------------------------------------------------------------------
\connect order_db;

CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY, -- DH-20261013-0001
    customer_id UUID NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    shipping_address TEXT,
    fulfillment_type VARCHAR(30) NOT NULL, -- DELIVERY or STORE_PICKUP
    branch_id VARCHAR(50) NOT NULL,
    pickup_code VARCHAR(20),
    payment_method VARCHAR(30) NOT NULL, -- COD or VIETQR
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
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id),
    payment_method VARCHAR(30) NOT NULL,
    amount BIGINT NOT NULL CHECK (amount > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, FAILED
    vietqr_payload TEXT,
    transaction_ref VARCHAR(100),
    confirmed_by VARCHAR(100),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(50) NOT NULL REFERENCES orders(id),
    amount BIGINT NOT NULL CHECK (amount > 0),
    reason TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED', -- REQUESTED, APPROVED, REJECTED, REFUNDED
    requested_by VARCHAR(100) NOT NULL,
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------------------
-- SECONDHAND SERVICE (secondhand_db)
-- -------------------------------------------------------------------------
\connect secondhand_db;

CREATE TABLE IF NOT EXISTS buyback_price_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_name VARCHAR(100) NOT NULL,
    grade VARCHAR(10) NOT NULL, -- A, B, C
    age_group VARCHAR(50) NOT NULL, -- < 6 thang, 6-12 thang, > 12 thang
    base_price BIGINT NOT NULL CHECK (base_price > 0),
    valid_from DATE NOT NULL,
    valid_to DATE,
    version INT NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buyback_cases (
    id VARCHAR(50) PRIMARY KEY, -- BB-20261013-0001
    branch_id VARCHAR(50) NOT NULL,
    staff_id VARCHAR(100) NOT NULL,
    seller_name VARCHAR(255) NOT NULL,
    seller_phone VARCHAR(20) NOT NULL,
    seller_id_card_masked VARCHAR(50) NOT NULL,
    racket_model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100),
    checklist_json TEXT NOT NULL,
    grade VARCHAR(10) NOT NULL, -- A, B, C, D
    auth_status VARCHAR(30) NOT NULL, -- VERIFIED, UNVERIFIED, SUSPECTED_FAKE
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
    id VARCHAR(50) PRIMARY KEY, -- SH-20261013-0001
    buyback_case_id VARCHAR(50) NOT NULL REFERENCES buyback_cases(id),
    serial_number VARCHAR(100),
    model_name VARCHAR(100) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    branch_id VARCHAR(50) NOT NULL,
    resale_price BIGINT NOT NULL CHECK (resale_price > 0),
    warranty_days INT NOT NULL DEFAULT 30,
    condition_notes TEXT,
    images_json TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PURCHASED', -- PURCHASED, PENDING_RESALE_APPROVAL, APPROVED_FOR_SALE, PUBLISH_FAILED, RESERVED, SOLD, WITHDRAWN
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1
);

-- -------------------------------------------------------------------------
-- WARRANTY SERVICE (warranty_db)
-- -------------------------------------------------------------------------
\connect warranty_db;

CREATE TABLE IF NOT EXISTS warranty_policies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    coverage_type VARCHAR(50) NOT NULL, -- FRAME_DEFECT, STRUCTURAL_INTEGRITY
    duration_months INT NOT NULL,
    terms_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS warranty_claims (
    id VARCHAR(50) PRIMARY KEY, -- CLM-20261013-0001
    order_code VARCHAR(50) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    serial_number VARCHAR(100),
    product_name VARCHAR(255) NOT NULL,
    policy_snapshot TEXT NOT NULL,
    damage_description TEXT NOT NULL,
    images_json TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED, RECEIVED, INSPECTING, APPROVED, REJECTED, RESOLVED, CLOSED
    rejection_reason TEXT,
    resolution_type VARCHAR(50), -- REPAIR, REPLACE, REFUND
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
