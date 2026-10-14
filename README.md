# 🏸 SMASH COURT — MULTI-BRANCH BADMINTON E-COMMERCE & SECOND-HAND INSPECTION PLATFORM

> **Nền tảng thương mại điện tử cầu lông chuyên nghiệp**: Vợt mới chính hãng, Sàn vợt cũ kiểm định (Second-hand), Tra cứu bảo hành điện tử, và Cổng quản trị vận hành đa chi nhánh (Admin Portal) theo phong cách thiết kế **Quiet Court**.

[![Master Test Suite](https://img.shields.io/badge/Master%20Test%20Suite-51%2F51%20PASS%20(100%25)-emerald?style=for-the-badge&logo=checkmarx)](test/test-suite.js)
[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016%20Turbopack-black?style=for-the-badge&logo=next.js)](frontend/)
[![Design Rules](https://img.shields.io/badge/Design%20Rules-100%25%20PASS%20(0%20violation)-blue?style=for-the-badge)](scripts/check-design-rules.js)
[![PostgreSQL 18](https://img.shields.io/badge/Database-PostgreSQL%2018%20Native%20(6%20DBs)-blue?style=for-the-badge&logo=postgresql)](infra/postgres/)
[![Java 21](https://img.shields.io/badge/Backend-Java%2021%20LTS-orange?style=for-the-badge&logo=openjdk)](pom.xml)

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Hệ thống được thiết kế theo kiến trúc **Domain-Driven Microservices** kết hợp mô hình **Database-Per-Service Isolation** với 6 cơ sở dữ liệu PostgreSQL 18 native phân lập hoàn toàn:

```mermaid
graph TD
    Client[Storefront Web & Admin Portal<br/>Next.js 16 Turbopack - Quiet Court UI] -->|HTTP / REST + Correlation ID| Gateway[API Gateway<br/>Spring Cloud Gateway]
    
    Gateway --> Identity[Identity Service<br/>Port 8081 | identity_db]
    Gateway --> Catalog[Catalog Service<br/>Port 8082 | catalog_db]
    Gateway --> Inventory[Inventory Service<br/>Port 8083 | inventory_db]
    Gateway --> Order[Order Service<br/>Port 8084 | order_db]
    Gateway --> Secondhand[Secondhand Service<br/>Port 8085 | secondhand_db]
    Gateway --> Warranty[Warranty Service<br/>Port 8086 | warranty_db]

    Order -.->|RabbitMQ Events / Outbox| Inventory
    Secondhand -.->|Domain Event: Approved| Catalog
    Order -.->|Domain Event: Completed| Warranty
```

---

## 2. TRIẾT LÝ THIẾT KẾ MỚI — "QUIET COURT"

Toàn bộ hệ thống giao diện được tái thiết kế theo định hướng **Quiet Court**: Tối giản, sang trọng, thể thao, mobile-first, loại bỏ hoàn toàn các lỗi font quá đậm, in hoa tùy tiện hay thẻ lồng thẻ:

- **Bảng màu Design Tokens**:
  - Nền trang trắng ngà `#F5F4F0` (`--bg`), thẻ phẳng trắng thuần `#FFFFFF` (`--surface`).
  - Chữ chính đen mực `#111613` (`--ink`), chữ phụ xám trung tính `#6A726E` (`--muted`).
  - Đường phân cách mảnh 1px `#E4E3DD` (`--line`), màu xanh sân đấu `#0F5132` (`--brand`) làm điểm nhấn tinh tế.
- **Phông chữ tiếng Việt chuẩn mực**:
  - 100% sử dụng font `Be Vietnam Pro` (subset vietnamese + latin), tối ưu hóa hiển thị dấu thanh tiếng Việt.
  - Phân cấp trọng lượng tinh giản: **400** cho toàn bộ nội dung văn bản, **500** cho tiêu đề, nút bấm, nhãn và giá tiền.
  - Tuyệt đối cấm các class `font-semibold`, `font-bold`, `font-black`, `uppercase`, `tracking-wider` trên storefront.
- **Trải nghiệm khách hàng & Quản trị**:
  - Tìm kiếm nhanh ⌘K trên toàn hệ thống (`CommandSearch.tsx`).
  - Giỏ hàng Drawer trượt mượt mà kèm trang thanh toán 1 trang hỗ trợ VietQR Napas và COD.
  - Tra cứu bảo hành điện tử với dòng thời gian 4 bước và cơ chế bảo mật PII (`0909****56`, `Trần V*** A***`).
  - Sàn vợt cũ kiểm định 5 điểm cốt lõi với mã serial nón vợt và cam kết bảo hành riêng từng chiếc.
  - Cổng quản trị tích hợp bộ chọn chi nhánh làm việc (Team Switcher) và bảng dữ liệu DataTable có sticky header.

---

## 3. CÁC QUY TẮC CỐT LÕI (R1 — R10) ĐÃ KIỂM CHỨNG 100%

1. **Khóa chống bán vượt mức (R1)**: Áp dụng câu lệnh cập nhật nguyên tử `UPDATE stock_levels SET reserved = reserved + :q WHERE on_hand - reserved >= :q` kết hợp CHECK constraint PostgreSQL `chk_reserved_lte_on_hand`. Tuyệt đối không bao giờ xảy ra tình trạng âm kho dưới tải tranh chấp đồng thời (Test C1 PASS).
2. **Đơn vị duy nhất cho vợt cũ (R2)**: Mỗi chiếc vợt second-hand là một thực thể `item_type = 'UNIQUE'` với số lượng $\le 1$ (`chk_unique_item_qty`). Chỉ duy nhất một khách hàng có thể giữ chỗ mua tại một thời điểm (Test C2 PASS).
3. **Giải phóng kho Idempotent (R3)**: Tự động hủy đơn và nhả tồn kho đúng một lần sau 30 phút (VietQR) hoặc 12 giờ (COD) qua worker `/api/inventory/expire` (Test C3 PASS).
4. **Bảo mật phạm vi chi nhánh (R4)**: Kiểm soát đa chi nhánh qua header `X-Branch-Id`, nhân viên chỉ được thao tác tại chi nhánh được phân công.
5. **Kiểm soát giá thu mua (R5)**: Thuật toán so khớp ngưỡng $\pm 10\%$. Nếu nhân viên điều chỉnh vượt quá mức này, phiếu tự động chuyển sang hàng chờ Quản lý chi nhánh (`BRANCH_MANAGER`) duyệt.
6. **Loại trừ sản phẩm rủi ro (R6)**: Vợt Hạng D (nứt gãy carbon) hoặc chưa xác minh chính hãng bị hệ thống từ chối chi tiền thu mua (`REJECTED`) và lập biên bản lưu vết kiểm toán.
7. **Cổng phê duyệt mở bán (R7)**: Vợt cũ chỉ được niêm yết lên website khi Quản lý chi nhánh ký duyệt hồ sơ kiểm định (`APPROVED_FOR_SALE`).
8. **Điều chuyển kho đúng thời điểm (R8)**: Tồn kho chi nhánh gửi chỉ bị trừ khi thực tế xuất hàng (`IN_TRANSIT`). Hàng nhận thiếu được ghi nhận vào `discrepancy`.
9. **Snapshot dữ liệu bất biến (R9)**: Giá bán, tên sản phẩm và chính sách bảo hành được snapshot nguyên vẹn vào dòng đơn hàng. Mọi thay đổi bảng giá sau đó không làm sai lệch đơn cũ.
10. **Sổ cái kế toán Append-Only (R10)**: Mọi biến động kho được ghi vào `stock_movements`, bảo đảm tổng sổ cái luôn khớp 100% với mức tồn thực tế.

---

## 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY HỆ THỐNG

### 4.1 Yêu Cầu Môi Trường
- Node.js $\ge$ 20.x & npm
- PostgreSQL 18 native (cổng 5432)

### 4.2 Khởi Động Nhanh
```bash
# 1. Clone repository và checkout nhánh dev
git clone https://github.com/harry-leon/Badminton-Shop.git
cd Badminton-Shop
git checkout dev

# 2. Khởi tạo cơ sở dữ liệu PostgreSQL 18 (Zero-Mock)
psql -U postgres -f infra/postgres/init-databases.sql
psql -U postgres -f infra/postgres/schema-all-services.sql
psql -U postgres -f infra/postgres/seed-data.sql
psql -U postgres -f infra/postgres/seed-inventory-secondhand-warranty.sql
psql -U postgres -f infra/postgres/seed-orders-and-claims.sql
psql -U postgres -f infra/postgres/seed-secondhand-cases.sql
psql -U postgres -f infra/postgres/seed-transfers.sql

# 3. Chạy Master Test Suite kiểm chứng (100% PASS)
node test/test-suite.js

# 4. Kiểm tra quy tắc thiết kế Quiet Court (100% PASS)
node scripts/check-design-rules.js

# 5. Khởi động Giao diện Next.js Turbopack
cd frontend
npm install
npm run dev
```

Truy cập hệ thống:
- **Trang chủ Cửa hàng (Storefront)**: [http://localhost:3000](http://localhost:3000)
- **Thư viện Styleguide Component**: [http://localhost:3000/_design](http://localhost:3000/_design)
- **Cổng Quản trị Vận hành (Admin Portal)**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 5. TÀI KHOẢN TRẢI NGHIỆM HỆ THỐNG (DEMO ACCOUNTS)

Mật khẩu mặc định cho toàn bộ tài khoản: `Password@123`

| Tên Đăng Nhập | Vai Trò (Role) | Phạm Vi Chi Nhánh | Quyền Hạn Nổi Bật |
|:---|:---|:---|:---|
| `admin` | `ADMIN` | Toàn hệ thống (HQ) | Cấu hình toàn bộ hệ thống, quản lý chi nhánh |
| `ql_nguyen_van_a` | `BRANCH_MANAGER` | Smash Court Q.1 (TP.HCM) | Duyệt giá vượt $\pm 10\%$, duyệt mở bán vợt cũ, duyệt hoàn tiền |
| `nv_le_van_b` | `STAFF` | Smash Court Q.1 (TP.HCM) | Thu mua tại quầy, đối soát VietQR, xuất kho điều chuyển |
| `kt_nguyen_thu` | `STAFF` (Kế toán) | Smash Court Q.1 (TP.HCM) | Đối soát dòng tiền ngân hàng VietQR NAPAS |
| `ql_tran_thi_b` | `BRANCH_MANAGER` | Smash Court Cầu Giấy (Hà Nội) | Quản lý kho và nhân sự chi nhánh Hà Nội |
| `nv_pham_van_e` | `STAFF` | Smash Court Cầu Giấy (Hà Nội) | Bán hàng và tiếp nhận bảo hành tại Hà Nội |
| `ql_dang_phuc` | `BRANCH_MANAGER` | Smash Court Hải Châu (Đà Nẵng) | Quản lý chi nhánh Đà Nẵng |
| `nv_hoang_van_g` | `STAFF` | Smash Court Hải Châu (Đà Nẵng) | Bán hàng và đóng gói đơn COD tại Đà Nẵng |

---

## 6. KẾT QUẢ NGHIỆM THU TỔNG THỂ

- **Test Suite**: 51/51 tests PASS (100.0%).
- **Design Rules**: 0 lỗi vi phạm trên toàn bộ 19 tệp storefront.
- **Biên dịch Production**: 23/23 routes tĩnh và động biên dịch thành công không cảnh báo.
- **Kho ảnh minh chứng**: Lưu trữ đầy đủ 54 ảnh "Before" tại `docs/ui/screenshots/before/` và 91 ảnh "After" tại `docs/ui/screenshots/after/`.
