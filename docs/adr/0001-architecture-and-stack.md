# ADR 0001: Kiến Trúc Balanced Microservices và Stack Công Nghệ

## Trạng Thái
Đã chấp thuận (Accepted) — Ngày: 2026-10-13

## Bối Cảnh
Dự án Badminton Shop là hệ thống thương mại điện tử phục vụ chuỗi cửa hàng bán vợt cầu lông và phụ kiện tại Việt Nam, bao gồm nghiệp vụ thu mua và bán lại vợt second-hand được kiểm định nghiêm ngặt. Hệ thống yêu cầu đảm bảo tính nhất quán dữ liệu, xử lý đồng thời cao (không bán vượt tồn kho), khả năng mở rộng và phục vụ làm portfolio kỹ sư Backend Java cấp cao.

## Quyết Định Kiến Trúc

### 1. Phân Tách Dịch Vụ (Balanced Microservices)
Hệ thống được chia thành 7 dịch vụ độc lập theo ranh giới nghiệp vụ:
- `api-gateway`: Cổng giao tiếp biên, định tuyến, rate limiting, xác thực JWT, lan truyền Correlation ID.
- `identity-service`: Quản lý tài khoản, phân quyền (ADMIN, BRANCH_MANAGER, STAFF, CUSTOMER), phân công nhân viên - chi nhánh.
- `catalog-service`: Quản lý sản phẩm, thương hiệu, SKU, thông số kỹ thuật vợt, listing second-hand (read model).
- `inventory-service`: Quản lý tồn kho theo chi nhánh, sổ cái biến động (append-only), reservation có thời hạn, chuyển kho.
- `order-service`: Giỏ hàng, saga đặt hàng, thanh toán manual (COD/VietQR), fulfillment, hủy và hoàn tiền.
- `secondhand-service`: Quy trình thu mua, wizard kiểm định A/B/C/D, bảng giá thu mua có phiên bản, duyệt bán lại.
- `warranty-service`: Chính sách bảo hành (snapshot), quản lý yêu cầu bảo hành vòng đời đầy đủ.

### 2. Ngăn Cách Dữ Liệu (Database-per-Service)
- Mỗi dịch vụ sở hữu cơ sở dữ liệu/schema độc lập trong PostgreSQL.
- Nghiêm cấm foreign key và truy vấn chéo giữa các dịch vụ.
- Dùng chung một instance PostgreSQL trong môi trường local/VPS để tiết kiệm tài nguyên nhưng phân lập hoàn toàn schema và credentials.

### 3. Giao Tiếp & Nhất Quán Dữ Liệu
- **Đồng bộ**: REST API với chuẩn RFC 9457 Problem Details (`application/problem+json`).
- **Bất đồng bộ**: RabbitMQ 4.3 kết hợp Transactional Outbox pattern và Idempotent Consumer (inbox pattern).
- **Saga Orchestration**: Điều phối quy trình tạo đơn hàng trong `order-service`, gọi đồng bộ sang `inventory-service` để giữ chỗ (reservation) với Idempotency-Key.

### 4. Công Nghệ Đã Chọn
- **Ngôn ngữ & Framework Backend**: Java 21/25 LTS, Spring Boot 4.1.x (Spring Framework 7, Spring Security 7).
- **Database**: PostgreSQL 18.
- **Message Broker**: RabbitMQ 4.3.
- **Object Storage**: MinIO (S3 API compatible).
- **Frontend**: Next.js 16.x App Router, TypeScript strict, Tailwind CSS.

## Hệ Quả
- **Tích cực**: Phân lập trách nhiệm rõ ràng, dễ bảo trì, khả năng mở rộng từng phần, chứng minh được tư duy microservices vững vàng.
- **Thách thức**: Cần xử lý cẩn thận tính nhất quán cuối cùng (eventual consistency) và cơ chế bù trừ (compensation) khi có lỗi phát sinh.
