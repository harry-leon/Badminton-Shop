-- =========================================================================
-- SEED DATA: ORDER SERVICE (order_db) & WARRANTY SERVICE (warranty_db)
-- =========================================================================

\connect order_db;

-- 1. Insert Orders
INSERT INTO orders (
    id, customer_id, customer_name, customer_phone, shipping_address, fulfillment_type, branch_id, pickup_code, payment_method, total_amount, status, idempotency_key, created_at, updated_at
) VALUES
(
    'DH-20261013-0001',
    'a1111111-1111-1111-1111-111111111111',
    'Trần Văn An',
    '0909123456',
    '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    'DELIVERY',
    'BR_HCM_01',
    NULL,
    'VIETQR',
    4450000,
    'COMPLETED',
    'IDEMP-ORD-001',
    CURRENT_TIMESTAMP - INTERVAL '10 days',
    CURRENT_TIMESTAMP - INTERVAL '7 days'
),
(
    'DH-20261013-0002',
    'b2222222-2222-2222-2222-222222222222',
    'Lê Thị Mai',
    '0918765432',
    NULL,
    'STORE_PICKUP',
    'BR_HN_01',
    'PK-9812',
    'VIETQR',
    4350000,
    'READY_FOR_PICKUP',
    'IDEMP-ORD-002',
    CURRENT_TIMESTAMP - INTERVAL '1 day',
    CURRENT_TIMESTAMP - INTERVAL '3 hours'
),
(
    'DH-20261013-0003',
    'c3333333-3333-3333-3333-333333333333',
    'Nguyễn Hoàng Nam',
    '0988112233',
    '45 Bạch Đằng, Quận Hải Châu, TP. Đà Nẵng',
    'DELIVERY',
    'BR_DN_01',
    NULL,
    'COD',
    2900000,
    'PREPARING',
    'IDEMP-ORD-003',
    CURRENT_TIMESTAMP - INTERVAL '5 hours',
    CURRENT_TIMESTAMP - INTERVAL '2 hours'
),
(
    'DH-20261013-0004',
    'd4444444-4444-4444-4444-444444444444',
    'Phạm Quốc Bảo',
    '0933557799',
    '78 Lê Lợi, Quận 1, TP. Hồ Chí Minh',
    'DELIVERY',
    'BR_HCM_01',
    NULL,
    'VIETQR',
    3800000,
    'AWAITING_PAYMENT',
    'IDEMP-ORD-004',
    CURRENT_TIMESTAMP - INTERVAL '20 minutes',
    CURRENT_TIMESTAMP - INTERVAL '20 minutes'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Order Lines with immutable snapshots (R9)
INSERT INTO order_lines (
    order_id, sku, product_name_snapshot, unit_price_snapshot, quantity, subtotal, warranty_policy_snapshot
) VALUES
(
    'DH-20261013-0001',
    'SKU-AX99P-4UG5',
    'Vợt Cầu Lông Yonex Astrox 99 Pro (White Tiger) 4U-G5',
    4450000,
    1,
    4450000,
    'Chính sách POL_NEW_12M: Bảo hành khung vợt mới 12 tháng. 1 đổi 1 hoặc sửa chữa khung nếu nứt gãy tự nhiên do lỗi vật liệu NSX. Cước tối đa 28lbs.'
),
(
    'DH-20261013-0002',
    'SKU-AX100ZZ-4UG5',
    'Vợt Cầu Lông Yonex Astrox 100ZZ Kurenai 4U-G5',
    4350000,
    1,
    4350000,
    'Chính sách POL_NEW_12M: Bảo hành khung vợt mới 12 tháng.'
),
(
    'DH-20261013-0003',
    'SKU-NF700P-4UG5',
    'Vợt Cầu Lông Yonex Nanoflare 700 Pro (Cyan) 4U-G5',
    2900000,
    1,
    2900000,
    'Chính sách POL_NEW_12M: Bảo hành khung vợt mới 12 tháng.'
),
(
    'DH-20261013-0004',
    'SKU-ARC11P-4UG5',
    'Vợt Cầu Lông Yonex Arcsaber 11 Pro 4U-G5',
    3800000,
    1,
    3800000,
    'Chính sách POL_NEW_12M: Bảo hành khung vợt mới 12 tháng.'
)
ON CONFLICT DO NOTHING;

-- 3. Insert Payments
INSERT INTO payments (
    order_id, payment_method, amount, status, vietqr_payload, transaction_ref, confirmed_by, confirmed_at
) VALUES
(
    'DH-20261013-0001',
    'VIETQR',
    4450000,
    'CONFIRMED',
    '00020101021238540010A0000007270124000697042201109999888877520460115303704540744500005802VN62210817DH2026101300016304E8A1',
    'TXN-VCB-20261013-9988',
    'kt_nguyen_thu',
    CURRENT_TIMESTAMP - INTERVAL '10 days'
),
(
    'DH-20261013-0002',
    'VIETQR',
    4350000,
    'CONFIRMED',
    '00020101021238540010A0000007270124000697042201109999888877520460115303704540743500005802VN62210817DH2026101300026304C1B2',
    'TXN-TCB-20261013-1122',
    'nv_le_van_b',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    'DH-20261013-0004',
    'VIETQR',
    3800000,
    'PENDING',
    '00020101021238540010A0000007270124000697042201109999888877520460115303704540738000005802VN62210817DH2026101300046304D5F9',
    NULL,
    NULL,
    NULL
)
ON CONFLICT DO NOTHING;

-- =========================================================================
-- SEED DATA: WARRANTY SERVICE (warranty_db)
-- =========================================================================
\connect warranty_db;

INSERT INTO warranty_claims (
    id, order_code, customer_phone, serial_number, product_name, policy_snapshot, damage_description, images_json, status, rejection_reason, resolution_type, assigned_technician, created_at, updated_at
) VALUES
(
    'CLM-20261013-0001',
    'DH-20261013-0001',
    '0909123456',
    'SN-AX99P-2026-0042',
    'Vợt Cầu Lông Yonex Astrox 99 Pro (White Tiger)',
    'Chính sách POL_NEW_12M: Bảo hành khung vợt mới 12 tháng. 1 đổi 1 hoặc sửa chữa khung nếu nứt gãy tự nhiên do lỗi vật liệu NSX. Mức căng tối đa 28lbs.',
    'Khung vợt bị nứt chân gen tại vị trí 2 giờ khi đánh cầu thường. Đan cước BG80 27lbs tại cửa hàng, chưa từng va vợt.',
    '["/images/products/yonex-astrox-99-pro.jpg"]',
    'INSPECTING',
    NULL,
    NULL,
    'ktv_tran_minh',
    CURRENT_TIMESTAMP - INTERVAL '2 days',
    CURRENT_TIMESTAMP - INTERVAL '4 hours'
),
(
    'CLM-20261013-0002',
    'DH-20261013-0002',
    '0918765432',
    'SN-100ZZ-2025-0188',
    'Vợt Cầu Lông Yonex Astrox 100ZZ Kurenai (Cũ Hạng A)',
    'Chính sách POL_SH_60D: Bảo hành kết cấu vợt cũ 60 ngày cho vợt Hạng A (như mới).',
    'Khớp chữ T có tiếng kêu rắc rắc nhẹ khi vung vợt tốc độ cao, nghi ngờ lỏng keo kết cấu.',
    '["/images/products/yonex-astrox-100zz.png"]',
    'APPROVED',
    NULL,
    'REPAIR',
    'ktv_le_dung',
    CURRENT_TIMESTAMP - INTERVAL '4 days',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    'CLM-20261013-0003',
    'DH-20261013-0005',
    '0977889900',
    'SN-NF1000Z-2025-099',
    'Yonex Nanoflare 1000Z',
    'Chính sách POL_NEW_12M: Bảo hành khung vợt mới 12 tháng.',
    'Vết dập móp lớn kèm trầy xước sâu trên đầu khung vợt tại góc 11h.',
    '[]',
    'REJECTED',
    'Từ chối bảo hành do tổn hại xuất phát từ ngoại lực va chạm cơ học trực tiếp (va chạm hai vợt trên sân), vi phạm điều khoản loại trừ bảo hành.',
    NULL,
    'ql_dang_phuc',
    CURRENT_TIMESTAMP - INTERVAL '6 days',
    CURRENT_TIMESTAMP - INTERVAL '5 days'
)
ON CONFLICT (id) DO NOTHING;

-- Insert Claim Events (State machine trail)
INSERT INTO claim_events (claim_id, from_status, to_status, actor, notes, created_at)
VALUES
(
    'CLM-20261013-0001',
    'SUBMITTED',
    'INSPECTING',
    'ktv_tran_minh',
    'Đã tiếp nhận sản phẩm tại chi nhánh Quận 1 (BR_HCM_01). Bắt đầu kiểm tra soi kính lúp tại chân gen 2 giờ.',
    CURRENT_TIMESTAMP - INTERVAL '4 hours'
),
(
    'CLM-20261013-0002',
    'SUBMITTED',
    'INSPECTING',
    'ktv_le_dung',
    'Tiếp nhận tại chi nhánh Cầu Giấy (BR_HN_01). Kiểm tra độ rung lắc đũa vợt và khớp chữ T.',
    CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
    'CLM-20261013-0002',
    'INSPECTING',
    'APPROVED',
    'ql_nguyen_van_a',
    'Xác nhận lỗi liên kết bọt xốp đũa vợt nội tại. Duyệt phương án gia cố bảo dưỡng chuyên sâu hãng.',
    CURRENT_TIMESTAMP - INTERVAL '1 day'
),
(
    'CLM-20261013-0003',
    'SUBMITTED',
    'INSPECTING',
    'ql_dang_phuc',
    'Tiếp nhận tại chi nhánh Đà Nẵng (BR_DN_01).',
    CURRENT_TIMESTAMP - INTERVAL '5 days 10 hours'
),
(
    'CLM-20261013-0003',
    'INSPECTING',
    'REJECTED',
    'ql_dang_phuc',
    'Phát hiện vết sơn cọ xát màu xanh của vợt khác, vết dập móp có góc nhọn do va đập mạnh. Lập biên bản từ chối bảo hành.',
    CURRENT_TIMESTAMP - INTERVAL '5 days'
);
