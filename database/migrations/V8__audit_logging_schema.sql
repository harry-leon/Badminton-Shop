-- =========================================================================
-- V8: AUDIT LOGGING SCHEMA & PERMISSIONS
-- Hệ thống ghi nhật ký hoạt động, an ninh và kiểm toán thao tác quản trị
-- =========================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) NOT NULL DEFAULT 'INFO', -- 'INFO', 'WARN', 'ERROR', 'CRITICAL'
    module VARCHAR(50) NOT NULL, -- 'AUTH', 'USERS', 'PRODUCTS', 'BANNERS', 'CATEGORIES', 'ORDERS', 'SETTINGS', 'SYSTEM'
    action VARCHAR(100) NOT NULL, -- 'LOGIN_SUCCESS', 'USER_CREATE', 'PRODUCT_UPDATE', etc.
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
CREATE INDEX IF NOT EXISTS idx_audit_logs_level ON audit_logs(level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_name);

-- Thêm quyền logs:view cho hệ thống phân quyền RBAC
INSERT INTO permissions (id, code, module, category, name, description) VALUES
('logs:view', 'logs:view', 'SYSTEM', 'SYSTEM', 'Xem nhật ký hệ thống', 'Xem toàn bộ audit logs và lịch sử thao tác của nhân sự')
ON CONFLICT (id) DO NOTHING;

-- Cấp quyền logs:view cho vai trò ADMIN và BRANCH_MANAGER
INSERT INTO role_permissions (role_id, permission_id) VALUES
('ADMIN', 'logs:view'),
('BRANCH_MANAGER', 'logs:view')
ON CONFLICT DO NOTHING;
