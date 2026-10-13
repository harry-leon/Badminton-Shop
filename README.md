# 🏸 BADMINTON SHOP — MULTI-BRANCH E-COMMERCE PLATFORM

> **Nền tảng thương mại điện tử cầu lông chuyên nghiệp**: Vợt mới chính hãng, Sàn vợt cũ kiểm định (Second-hand), Tra cứu bảo hành điện tử, và Cổng quản trị vận hành đa chi nhánh (Admin Portal).

[![Master Test Suite](https://img.shields.io/badge/Master%20Test%20Suite-42%2F42%20PASS%20(100%25)-emerald?style=for-the-badge&logo=checkmarx)](test/test-suite.js)
[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016%20Turbopack-black?style=for-the-badge&logo=next.js)](frontend/)
[![PostgreSQL 18](https://img.shields.io/badge/Database-PostgreSQL%2018%20Native-blue?style=for-the-badge&logo=postgresql)](infra/postgres/)
[![Java 21](https://img.shields.io/badge/Backend-Java%2021%20LTS-orange?style=for-the-badge&logo=openjdk)](pom.xml)

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

Hệ thống được thiết kế theo kiến trúc **Domain-Driven Microservices** kết hợp mô hình **Database-Per-Service Isolation**:

```mermaid
graph TD
    Client[Storefront Web & Admin Portal<br/>Next.js 16 Turbopack] -->|HTTP / REST + Correlation ID| Gateway[API Gateway<br/>Spring Cloud Gateway]
    
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

## 2. ĐIỂM NỔI BẬT VỀ KỸ THUẬT & 10 QUY TẮC CỐT LÕI (R1 — R10)

1. **Khóa chống bán vượt mức (R1)**: Áp dụng câu lệnh cập nhật nguyên tử `UPDATE stock_levels SET reserved = reserved + :q WHERE on_hand - reserved >= :q` kết hợp CHECK constraint PostgreSQL `chk_reserved_lte_on_hand`. Tuyệt đối không bao giờ xảy ra tình trạng âm kho.
2. **Đơn vị duy nhất cho vợt cũ (R2)**: Mỗi chiếc vợt second-hand là một thực thể `item_type = 'UNIQUE'` với số lượng $\le 1$ (`chk_unique_item_qty`). Chỉ duy nhất một khách hàng có thể giữ chỗ mua tại một thời điểm.
3. **Giải phóng kho Idempotent (R3)**: Tự động hủy đơn và nhả tồn kho đúng một lần sau 30 phút (VietQR) hoặc 12 giờ (COD).
4. **Bảo mật phạm vi chi nhánh (R4)**: Kiểm soát đa chi nhánh qua header `X-Branch-Id`, nhân viên chỉ được thao tác tại chi nhánh được phân công.
5. **Kiểm soát giá thu mua (R5)**: Thuật toán so khớp ngưỡng $\pm 10\%$. Nếu nhân viên điều chỉnh vượt quá mức này, phiếu tự động chuyển sang hàng chờ Quản lý chi nhánh (`BRANCH_MANAGER`) duyệt.
6. **Loại trừ sản phẩm rủi ro (R6)**: Vợt Hạng D (nứt gãy carbon) hoặc chưa xác minh chính hãng bị hệ thống từ chối chi tiền thu mua (`REJECTED`).
7. **Cổng phê duyệt mở bán (R7)**: Vợt cũ chỉ được niêm yết lên website khi Quản lý chi nhánh ký duyệt hồ sơ kiểm định (`APPROVED_FOR_SALE`).
8. **Điều chuyển kho đúng thời điểm (R8)**: Tồn kho chi nhánh gửi chỉ bị trừ khi thực tế xuất hàng (`IN_TRANSIT`). Hàng nhận thiếu được ghi nhận vào `discrepancy`.
9. **Snapshot dữ liệu bất biến (R9)**: Giá bán, tên sản phẩm và chính sách bảo hành được snapshot nguyên vẹn vào dòng đơn hàng. Mọi thay đổi bảng giá sau đó không làm sai lệch đơn cũ.
10. **Sổ cái kế toán Append-Only (R10)**: Mọi biến động kho được ghi vào `stock_movements`, bảo đảm tổng sổ cái luôn khớp 100% với mức tồn thực tế.

---

## 3. HƯỚNG DẪN CÀI ĐẶT & CHẠY TRONG $\le$ 15 PHÚT

### 3.1 Yêu Cầu Môi Trường
- Node.js $\ge$ 20.x & npm
- PostgreSQL 18 (hoặc Docker Compose)

### 3.2 Khởi Động Nhanh
```bash
# 1. Clone repository
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

# 4. Khởi động Giao diện Next.js
cd frontend
npm install
npm run dev
# Mở trình duyệt tại: http://localhost:3000
```

---

## 4. TÀI KHOẢN TRẢI NGHIỆM HỆ THỐNG (DEMO ACCOUNTS)

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

## 5. ĐÁNH ĐỔI THIẾT KẾ & GIỚI HẠN ĐÃ BIẾT (KNOWN TRADE-OFFS)

1. **Không tách đơn giao hàng ngầm (No Silent Split-Shipment)**: Nếu một đơn hàng gồm nhiều món mà không có chi nhánh nào có đủ tồn kho, hệ thống thông báo rõ cho khách hàng thay vì âm thầm tách đơn thành 2 chuyến giao hàng khác nhau phát sinh thêm phí ship.
2. **Thanh toán VietQR đối soát có người kiểm chứng**: Sử dụng chuỗi VietQR chuẩn NAPAS kèm mã đơn duy nhất. Nhân viên quầy/kế toán đối soát trực tiếp mã giao dịch ngân hàng để bảo đảm 100% an toàn trước khi kích hoạt `PAID`.
3. **Thu mua vợt cũ độc quyền tại quầy**: Từ chối quy trình thu mua online chuyển khoản trước để bảo vệ cửa hàng trước nguy cơ hàng giả, hàng nứt hàn carbon ngầm.

---

## 6. TÀI LIỆU KỸ THUẬT THAM KHẢO

- [ADR 0001: Kiến Trúc Microservices & Công Nghệ](docs/adr/0001-architecture-and-stack.md)
- [Máy Trạng Thái Nghiệp Vụ (Order, Buyback, Unit, Warranty)](docs/domain/state-machines.md)
- [Ma Trận Phân Quyền Vai Trò & Chi Nhánh (RBAC Matrix)](docs/rbac-matrix.md)
- [Hướng Dẫn Vận Hành & Xử Lý Sự Cố (Operational Runbook)](docs/runbook.md)
- [Báo Cáo Nghiệm Thu 23 Danh Mục Checklist](C:/Users/htquo/.gemini/antigravity/brain/3ace9f90-b641-4e7b-88a8-e6bab8c2f70f/full_system_checklist_report.md)
