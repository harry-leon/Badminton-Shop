-- =========================================================================
-- MIGRATION: Chuẩn hóa mã SKU và kích hoạt tồn kho cho Vợt cũ (Second-Hand)
-- =========================================================================

-- 1. Chuẩn hóa SKU trong order_db
\connect order_db;

UPDATE order_lines 
SET sku = 'YONEX-AX99PRO-4UG5' 
WHERE sku = 'SKU-AX99P-4UG5';

UPDATE order_lines 
SET sku = 'YONEX-AX100ZZ-4UG5' 
WHERE sku = 'SKU-AX100ZZ-4UG5';

UPDATE order_lines 
SET sku = 'YONEX-NF700PRO-4UG5' 
WHERE sku = 'SKU-NF700P-4UG5';

UPDATE order_lines 
SET sku = 'YONEX-ARC11PRO-4UG5' 
WHERE sku = 'SKU-ARC11P-4UG5';

-- 2. Chuẩn hóa SKU trong stock_transfers (inventory_db)
\connect inventory_db;

UPDATE stock_transfers 
SET sku = 'YONEX-AX99PRO-4UG5' 
WHERE sku = 'SKU-AX99P-4UG5';

UPDATE stock_transfers 
SET sku = 'YONEX-AX100ZZ-4UG5' 
WHERE sku = 'SKU-AX100ZZ-4UG5';

UPDATE stock_transfers 
SET sku = 'YONEX-ARC11PRO-4UG5' 
WHERE sku = 'SKU-ARC11P-4UG5';

-- 3. Kích hoạt tồn kho cho 2 Vợt cũ đã được duyệt mở bán (R2 & R7)
INSERT INTO stock_levels (branch_id, sku, item_type, on_hand, reserved, updated_at)
VALUES 
('BR_HCM_01', 'SH-20261013-0001', 'UNIQUE', 1, 0, CURRENT_TIMESTAMP),
('BR_HN_01', 'SH-20261013-0002', 'UNIQUE', 1, 0, CURRENT_TIMESTAMP)
ON CONFLICT (branch_id, sku) 
DO UPDATE SET on_hand = 1, item_type = 'UNIQUE', updated_at = CURRENT_TIMESTAMP;

-- Ghi nhận sổ cái nhập kho cho 2 vợt cũ (R10)
INSERT INTO stock_movements (branch_id, sku, movement_type, quantity, reference_id, reason, created_by)
VALUES 
('BR_HCM_01', 'SH-20261013-0001', 'INBOUND', 1, 'BB-20261013-001', 'Nhập kho vợt cũ Hạng A sau khi duyệt mở bán', 'ql_nguyen_van_a'),
('BR_HN_01', 'SH-20261013-0002', 'INBOUND', 1, 'BB-20261013-002', 'Nhập kho vợt cũ Hạng B sau khi duyệt mở bán', 'ql_tran_thi_b')
ON CONFLICT DO NOTHING;
