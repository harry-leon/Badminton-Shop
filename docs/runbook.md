# HƯỚNG DẪN VẬN HÀNH & XỬ LÝ SỰ CỐ (OPERATIONAL RUNBOOK)

Tài liệu hướng dẫn đội ngũ vận hành hệ thống **Badminton Shop** giải quyết các sự cố thực tế trong quá trình chạy production.

---

## 1. QUY TRÌNH ĐỐI SOÁT TỒN KHO & SỔ CÁI (STOCK RECONCILIATION)

### 1.1 Nguyên Lý Cân Bằng (Quy Tắc R10)
Tổng số lượng trong sổ cái kế toán `stock_movements` phải luôn bằng chính xác tổng số lượng thực tế trong bảng `stock_levels`:
$$\sum_{\text{movements}} \text{quantity} = \sum_{\text{levels}} \text{on\_hand}$$

### 1.2 Câu Lệnh Đối Soát Hàng Ngày
```sql
\connect inventory_db;

-- 1. Tính tổng sổ cái
SELECT SUM(quantity) AS total_ledger FROM stock_movements;

-- 2. Tính tổng tồn kho hiện hành
SELECT SUM(on_hand) AS total_on_hand FROM stock_levels;

-- 3. Phát hiện SKU có chênh lệch giữa mức tồn và lịch sử biến động
SELECT 
    sl.branch_id,
    sl.sku,
    sl.on_hand,
    COALESCE(sm.total_movement, 0) AS calculated_on_hand,
    sl.on_hand - COALESCE(sm.total_movement, 0) AS discrepancy
FROM stock_levels sl
LEFT JOIN (
    SELECT branch_id, sku, SUM(quantity) AS total_movement
    FROM stock_movements
    GROUP BY branch_id, sku
) sm ON sl.branch_id = sm.branch_id AND sl.sku = sm.sku
WHERE sl.on_hand <> COALESCE(sm.total_movement, 0);
```

Nếu câu truy vấn số 3 trả về 0 dòng $\rightarrow$ Hệ thống cân bằng 100%.

---

## 2. QUY TRÌNH XỬ LÝ SỰ CỐ DEAD LETTER QUEUE (DLQ)

Khi consumer gặp lỗi vượt quá 3 lần retry:
1. Message được tự động định tuyến về `DLQ` tương ứng (ví dụ: `order.dlq`, `inventory.dlq`).
2. Kiểm tra log sự cố với Correlation ID:
   ```bash
   grep "X-Correlation-Id: <ID>" /var/log/badminton-shop/*.log
   ```
3. Sau khi khắc phục lỗi downstream (hoặc database phục hồi), kích hoạt chạy lại message từ DLQ mà không ghi đè dữ liệu nhờ tính chất Idempotent Consumer (inbox deduplication).

---

## 3. QUY TRÌNH HỦY ĐƠN HÀNG HẾT HẠN GIỮ HÀNG (QUY TẮC R3)

- **Đơn VietQR**: Hạn giữ hàng tối đa 30 phút.
- **Đơn COD**: Hạn giữ hàng tối đa 12 giờ.
- Background cron worker quét các reservation quá hạn và kích hoạt hủy đơn:
  ```sql
  \connect inventory_db;
  -- Cập nhật reservation hết hạn và giải phóng reserved đúng 1 lần (Idempotent)
  UPDATE stock_levels sl
  SET reserved = sl.reserved - r.quantity
  FROM reservations r
  WHERE r.status = 'ACTIVE' 
    AND r.expires_at < CURRENT_TIMESTAMP
    AND sl.branch_id = r.branch_id 
    AND sl.sku = r.sku;
  ```

---

## 4. QUY TRÌNH KHÔI PHỤC DỮ LIỆU TỪ BẢN SAO LƯU (BACKUP & RESTORE)

Bản sao lưu hàng ngày được thực hiện qua `pg_dump`:
```bash
# Backup toàn bộ 6 database
pg_dump -U postgres -d identity_db > backup_identity.sql
pg_dump -U postgres -d catalog_db > backup_catalog.sql
pg_dump -U postgres -d inventory_db > backup_inventory.sql
pg_dump -U postgres -d order_db > backup_order.sql
pg_dump -U postgres -d secondhand_db > backup_secondhand.sql
pg_dump -U postgres -d warranty_db > backup_warranty.sql

# Restore khi gặp sự cố
psql -U postgres -d inventory_db < backup_inventory.sql
```
Sau khi restore, luôn chạy script đối soát ở mục 1 để bảo đảm tính toàn vẹn.
