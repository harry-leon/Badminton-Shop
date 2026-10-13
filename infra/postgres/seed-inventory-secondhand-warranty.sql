-- =========================================================================
-- SEED DATA FOR INVENTORY, SECONDHAND, ORDER & WARRANTY SERVICES
-- =========================================================================

-- 1. INVENTORY SERVICE
\connect inventory_db;

INSERT INTO stock_levels (branch_id, sku, item_type, on_hand, reserved) VALUES
-- Chi nhánh Quận 1 (TP.HCM)
('BR_HCM_01', 'YONEX-AX99PRO-3UG5', 'STANDARD', 15, 0),
('BR_HCM_01', 'YONEX-AX99PRO-4UG5', 'STANDARD', 20, 0),
('BR_HCM_01', 'YONEX-AX100ZZ-3UG5', 'STANDARD', 10, 0),
('BR_HCM_01', 'YONEX-AX100ZZ-4UG5', 'STANDARD', 18, 0),
('BR_HCM_01', 'YONEX-ARC11PRO-3UG5', 'STANDARD', 12, 0),
('BR_HCM_01', 'YONEX-ARC11PRO-4UG5', 'STANDARD', 14, 0),
('BR_HCM_01', 'LINING-AX80-3UG5', 'STANDARD', 10, 0),
('BR_HCM_01', 'LINING-AX80-4UG5', 'STANDARD', 15, 0),
('BR_HCM_01', 'LINING-HAL8000-4UG5', 'STANDARD', 12, 0),
('BR_HCM_01', 'VICTOR-RYUGA2-4UG5', 'STANDARD', 10, 0),

-- Chi nhánh Cầu Giấy (Hà Nội)
('BR_HN_01', 'YONEX-AX99PRO-4UG5', 'STANDARD', 12, 0),
('BR_HN_01', 'YONEX-AX100ZZ-4UG5', 'STANDARD', 15, 0),
('BR_HN_01', 'YONEX-ARC11PRO-4UG5', 'STANDARD', 8, 0),
('BR_HN_01', 'LINING-AX80-4UG5', 'STANDARD', 10, 0),
('BR_HN_01', 'LINING-HAL8000-4UG5', 'STANDARD', 8, 0),
('BR_HN_01', 'VICTOR-RYUGA2-4UG5', 'STANDARD', 8, 0),

-- Chi nhánh Hải Châu (Đà Nẵng)
('BR_DN_01', 'YONEX-AX99PRO-4UG5', 'STANDARD', 6, 0),
('BR_DN_01', 'YONEX-AX100ZZ-4UG5', 'STANDARD', 8, 0),
('BR_DN_01', 'YONEX-ARC11PRO-4UG5', 'STANDARD', 5, 0),
('BR_DN_01', 'LINING-AX80-4UG5', 'STANDARD', 6, 0)
ON CONFLICT (branch_id, sku) DO NOTHING;

-- Sổ cái nhập kho ban đầu
INSERT INTO stock_movements (branch_id, sku, movement_type, quantity, reason, created_by)
SELECT branch_id, sku, 'INBOUND', on_hand, 'Nhập hàng đầu kỳ khai trương chuỗi chi nhánh', 'admin'
FROM stock_levels
ON CONFLICT DO NOTHING;

-- 2. SECONDHAND SERVICE
\connect secondhand_db;

-- Bảng giá thu mua có phiên bản và ngày hiệu lực
INSERT INTO buyback_price_tables (model_name, grade, age_group, base_price, valid_from, version) VALUES
('Yonex Astrox 99 Pro', 'A', '< 6 thang', 2600000, '2026-01-01', 1),
('Yonex Astrox 99 Pro', 'B', '6-12 thang', 2200000, '2026-01-01', 1),
('Yonex Astrox 99 Pro', 'C', '> 12 thang', 1600000, '2026-01-01', 1),

('Yonex Astrox 100ZZ', 'A', '< 6 thang', 2800000, '2026-01-01', 1),
('Yonex Astrox 100ZZ', 'B', '6-12 thang', 2400000, '2026-01-01', 1),
('Yonex Astrox 100ZZ', 'C', '> 12 thang', 1800000, '2026-01-01', 1),

('Lining Axforce 80', 'A', '< 6 thang', 2400000, '2026-01-01', 1),
('Lining Axforce 80', 'B', '6-12 thang', 1900000, '2026-01-01', 1),
('Lining Axforce 80', 'C', '> 12 thang', 1400000, '2026-01-01', 1),

('Victor Thruster Ryuga II', 'A', '< 6 thang', 2300000, '2026-01-01', 1),
('Victor Thruster Ryuga II', 'B', '6-12 thang', 1800000, '2026-01-01', 1),
('Victor Thruster Ryuga II', 'C', '> 12 thang', 1300000, '2026-01-01', 1)
ON CONFLICT DO NOTHING;

-- 3. WARRANTY SERVICE
\connect warranty_db;

INSERT INTO warranty_policies (id, name, coverage_type, duration_months, terms_text) VALUES
('POL_NEW_12M', 'Bảo hành khung vợt mới 12 tháng', 'FRAME_DEFECT', 12, 'Bảo hành 1 đổi 1 hoặc sửa chữa khung vợt nếu xuất hiện nứt gãy tự nhiên do lỗi vật liệu cấu trúc của nhà sản xuất.'),
('POL_SH_30D', 'Bảo hành kết cấu vợt cũ 30 ngày', 'STRUCTURAL_INTEGRITY', 1, 'Bảo hành kết cấu khung chịu lực trong 30 ngày kể từ ngày bàn giao. Không bảo hành cước và quấn cán.'),
('POL_SH_60D', 'Bảo hành kết cấu vợt cũ 60 ngày', 'STRUCTURAL_INTEGRITY', 2, 'Bảo hành kết cấu khung chịu lực trong 60 ngày cho vợt Hạng A (như mới).')
ON CONFLICT (id) DO NOTHING;
