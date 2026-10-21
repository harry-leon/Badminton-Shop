-- =========================================================================
-- SUPABASE PATCH: TẠO CÁC BẢNG OPERATIONS & AUDIT BỊ THIẾU
-- Chạy script này trong Supabase Dashboard -> SQL Editor -> Run
-- =========================================================================

-- 1. BẢNG ĐƠN HÀNG (ORDERS) & CHI TIẾT ĐƠN HÀNG (ORDER_LINES)
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
    warranty_policy_snapshot TEXT NOT NULL DEFAULT 'Bảo hành tiêu chuẩn 30 ngày'
);

-- 2. THANH TOÁN & HOÀN TIỀN (PAYMENTS & REFUNDS)
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

-- 3. ĐIỀU CHUYỂN KHO & THU MUA VỢT CŨ
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
    estimated_price BIGINT NOT NULL,
    final_price BIGINT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VALUATION',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. BẢO HÀNH (WARRANTY CLAIMS & CLAIM EVENTS)
CREATE TABLE IF NOT EXISTS warranty_claims (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50),
    sku VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    branch_id VARCHAR(50) NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    issue_description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED',
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS claim_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id VARCHAR(50) NOT NULL REFERENCES warranty_claims(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. AUDIT LOGS (NHẬT KÝ HỆ THỐNG)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) NOT NULL DEFAULT 'INFO',
    module VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor_id UUID,
    actor_name VARCHAR(100) NOT NULL DEFAULT 'SYSTEM',
    actor_role VARCHAR(50) DEFAULT 'SYSTEM',
    ip_address VARCHAR(50),
    user_agent TEXT,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_order_lines_order_id ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
