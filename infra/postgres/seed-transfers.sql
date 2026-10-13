\connect inventory_db;

INSERT INTO stock_transfers (
    id, from_branch_id, to_branch_id, sku, quantity, received_quantity, discrepancy_quantity, discrepancy_reason, status, created_by, approved_by, sent_at, received_at
) VALUES 
(
    'TRF-20261013-001', 'BR_HCM_01', 'BR_HN_01', 'SKU-AX99P-4UG5', 3, 0, 0, NULL, 'IN_TRANSIT', 'ql_nguyen_van_a', 'ql_nguyen_van_a', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL
),
(
    'TRF-20261013-002', 'BR_HCM_01', 'BR_DN_01', 'SKU-AX100ZZ-4UG5', 2, 2, 0, NULL, 'RECEIVED', 'ql_nguyen_van_a', 'ql_nguyen_van_a', CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP - INTERVAL '5 hours'
),
(
    'TRF-20261013-003', 'BR_HN_01', 'BR_DN_01', 'SKU-ARC11P-4UG5', 5, 4, 1, 'Hao hut 01 cay bi mop bao bi ngoai trong van chuyen duong bo', 'COMPLETED_WITH_DISCREPANCY', 'ql_tran_thi_b', 'ql_dang_phuc', CURRENT_TIMESTAMP - INTERVAL '3 days', CURRENT_TIMESTAMP - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;
