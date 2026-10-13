# MASTER PROMPT — Hệ thống thương mại điện tử cầu lông đa chi nhánh (Backend Java microservices + Frontend Next.js)

> Cách dùng: dán toàn bộ file này vào Claude Code (hoặc AI coding agent khác) ở thư mục repo trống. Agent phải làm **theo từng Phase** ở mục 14, dừng lại cuối mỗi Phase để báo cáo, không tự làm trước các Phase sau.
> Ký hiệu: **[CHỐT]** = chủ dự án đã quyết định, không được tự ý đổi. **[ĐỀ XUẤT]** = đề xuất mặc định để hoàn thiện scope, được phép đổi nếu chủ dự án yêu cầu (đổi thì ghi lại bằng ADR).

---

## 1. Vai trò và mục tiêu

Bạn là kỹ sư backend/fullstack senior. Hãy xây dựng một hệ thống bán vợt cầu lông và phụ kiện cho chuỗi cửa hàng vật lý tại Việt Nam, có nghiệp vụ thu mua – bán lại vợt đã qua sử dụng.

- **[CHỐT]** Mục đích: dự án **portfolio để ứng tuyển Backend Java**. Điều nhà tuyển dụng cần thấy: nghiệp vụ đúng, xử lý đồng thời đúng, kiến trúc có lý do, kiểm thử tốt, vận hành được. Số lượng service **không** phải thước đo.
- **[CHỐT]** Làm **một mình**, ngân sách **thấp**, thời gian **dài** (nhưng vẫn phải cắt MVP rõ ràng), triển khai **local trước**, có kế hoạch lên VPS/cloud sau.
- **[CHỐT]** Thị trường Việt Nam, tiền tệ VND (số nguyên, không có phần thập phân), giao diện tiếng Việt, múi giờ hiển thị Asia/Ho_Chi_Minh (lưu UTC).
- **[CHỐT]** Quy mô dữ liệu: khoảng 100–1.000 SKU. Số chi nhánh **cố định** trong dự án.
- **[ĐỀ XUẤT]** Dữ liệu mẫu: 3 chi nhánh (TP.HCM, Hà Nội, Đà Nẵng), ~150 SKU seed, vài chục vợt second-hand.

---

## 2. Nhật ký quyết định (Decision Register)

### 2.1 Đã chốt bởi chủ dự án

| Chủ đề | Quyết định |
|---|---|
| Mô hình bán | Website bán vợt + phụ kiện, nhấn mạnh hàng chính hãng, bảo hành, giao diện thu hút |
| Chi nhánh | Nhiều cửa hàng vật lý; **tồn kho riêng từng chi nhánh** |
| Fulfillment | Khách nhận tại cửa hàng **hoặc** giao hàng từ chi nhánh phù hợp |
| Nhân viên | Một nhân viên có thể làm ở **nhiều chi nhánh** |
| Điều chuyển | Có điều chuyển hàng giữa chi nhánh |
| Second-hand | Cửa hàng **trực tiếp thu mua** từ người bán (không phải sàn ký gửi); mỗi chiếc là **một đơn vị duy nhất** có hồ sơ riêng |
| Thu mua – tiếp nhận | Chỉ tại cửa hàng (không đăng ký online) |
| Thu mua – kiểm định | Nhân viên kiểm: **checklist chi tiết + cấp hạng tổng thể**; hạng **A/B/C/D** |
| Thu mua – xác thực | Nhân viên kiểm tra, bắt buộc lưu **ảnh + serial (nếu có)** + kết quả |
| Thu mua – giá | Bảng giá **quản trị cấu hình** (nhiều yếu tố); nhân viên được **điều chỉnh có giới hạn** |
| Thu mua – thanh toán | **Sau khi thống nhất giá và xác nhận mua**; tiền mặt **hoặc** chuyển khoản |
| Thu mua – từ chối | **Trả lại vợt cho khách** |
| Bán lại | **Quản lý duyệt** tình trạng và giá bán; chỉ sau đó vợt mới vào tồn kho khả dụng và lên website |
| Bảo hành second-hand | Chính sách và thời hạn **gắn theo từng chiếc** |
| Audit | Lưu đầy đủ: ảnh, checklist, người làm, thời điểm, giá đề xuất/giá cuối, lịch sử thay đổi |
| Kỹ thuật | Java, Spring Boot, PostgreSQL, JWT, kiến trúc microservices mức **balanced**, observability cơ bản, kiểm thử mức cao |
| Frontend | **Next.js + TypeScript** (SEO quan trọng) |
| Mục tiêu SEO | Trang danh mục/chi tiết sản phẩm phải render phía server, index được |

### 2.2 Đề xuất để hoàn thiện (sửa được)

**Catalog & giá**
- **[ĐỀ XUẤT]** Hàng mới quản lý theo **SKU + số lượng** (không serial từng chiếc). Hàng second-hand quản lý **từng chiếc** (mỗi chiếc = 1 stockable item, số lượng 0/1).
- **[ĐỀ XUẤT]** Giá hàng mới: **một bảng giá chung toàn chuỗi**; mô hình dữ liệu chừa chỗ cho ngoại lệ theo chi nhánh nhưng **không làm trong MVP**.
- **[ĐỀ XUẤT]** Danh mục: Vợt, Dây cước, Quấn cán, Cầu lông, Túi/bao vợt. Danh mục do admin tạo được nhưng seed sẵn các nhóm trên. Giày/quần áo để sau MVP.
- **[ĐỀ XUẤT]** Dịch vụ căng cước, khuyến mãi/mã giảm giá/điểm thành viên, đánh giá sản phẩm, wishlist: **ngoài MVP** (Phase mở rộng).
- **[ĐỀ XUẤT]** Nguồn nhập hàng mới: nhập kho thủ công bởi quản lý (phiếu nhập), có trường nhà cung cấp dạng text; chưa làm module mua hàng.

**Đơn hàng & thanh toán**
- **[ĐỀ XUẤT]** Đặt hàng **bắt buộc đăng nhập** (guest checkout để Phase mở rộng). Giỏ hàng lưu phía server cho user đã đăng nhập.
- **[ĐỀ XUẤT]** Thanh toán: **COD** và **chuyển khoản QR (VietQR)** do nhân viên xác nhận thủ công. Thiết kế interface `PaymentProvider` để sau này cắm VNPay/MoMo sandbox; MVP chỉ có `ManualProvider`.
- **[ĐỀ XUẤT]** Giữ tồn kho **ngay khi tạo đơn**, tự nhả khi hết hạn: QR = 30 phút; COD = 12 giờ chờ nhân viên xác nhận. Hết hạn → đơn tự hủy, nhả hàng.
- **[ĐỀ XUẤT]** **Không tách đơn** giữa nhiều chi nhánh trong MVP: một đơn chỉ lấy từ một chi nhánh đủ hàng. Không có chi nhánh nào đủ → báo khách để đổi số lượng/chọn chi nhánh khác.
- **[ĐỀ XUẤT]** Chọn chi nhánh: **nhận tại cửa hàng → khách chọn**; **giao hàng → hệ thống chọn** (ưu tiên chi nhánh cùng tỉnh/thành, còn đủ hàng, rồi theo thứ tự ưu tiên cấu hình); nhân viên được đổi chi nhánh trước khi bắt đầu xử lý.
- **[ĐỀ XUẤT]** Hủy đơn theo trạng thái: tự hủy được khi `PENDING_*`/`CONFIRMED`; sau khi `PREPARING` phải qua nhân viên duyệt; sau `SHIPPING` không hủy mà chuyển quy trình trả hàng.
- **[ĐỀ XUẤT]** Hoàn tiền: có quy trình **yêu cầu → duyệt (quản lý chi nhánh) → ghi nhận hoàn**, thực hiện thủ công, chưa đối soát cổng.
- **[ĐỀ XUẤT]** Giao hàng: không tích hợp hãng vận chuyển thật; nhân viên nhập đơn vị vận chuyển + mã vận đơn; có vòng đời giao hàng riêng. Nhận tại cửa hàng dùng **mã nhận hàng (pickup code)** để xác nhận bàn giao.

**Kho & điều chuyển**
- **[ĐỀ XUẤT]** Phiếu điều chuyển: `DRAFT → APPROVED (quản lý) → IN_TRANSIT (trừ kho gửi khi xác nhận xuất thực tế) → RECEIVED | PARTIALLY_RECEIVED`.
- **[ĐỀ XUẤT]** Hàng đang vận chuyển: **không** thuộc tồn khả dụng của cả hai chi nhánh; theo dõi riêng là `in_transit`.
- **[ĐỀ XUẤT]** Nhận thiếu/hỏng: cho nhận một phần, bắt buộc ghi số thực nhận + lý do; tạo bản ghi chênh lệch (`discrepancy`) để quản lý xử lý.
- **[ĐỀ XUẤT]** Kiểm kê và điều chỉnh tồn kho **có trong MVP**, bắt buộc lý do + người thực hiện, ghi vào sổ cái tồn kho (append-only).
- **[ĐỀ XUẤT]** Quyền xem tồn kho: xem số lượng toàn hệ thống, **chỉ thao tác tại chi nhánh được phân công**.

**Phân quyền**
- **[ĐỀ XUẤT]** 4 vai trò: `ADMIN`, `BRANCH_MANAGER`, `STAFF`, `CUSTOMER`. Quyền của nhân viên giới hạn theo **danh sách chi nhánh được phân công**; khi thao tác, client gửi header `X-Branch-Id` và server kiểm tra lại với phân công (không tin client).

**Second-hand (lấp các chỗ còn mơ hồ)**
- **[ĐỀ XUẤT]** Ý nghĩa cấp hạng: **A** = như mới; **B** = tốt, trầy nhẹ; **C** = dùng nhiều, hao mòn rõ nhưng khung khỏe; **D** = **không đủ điều kiện thu mua** (nứt/cong khung, sửa chữa không kinh tế, nghi giả) → bị từ chối và trả khách. Hạng D vẫn được lưu hồ sơ kiểm định để audit.
- **[ĐỀ XUẤT]** Bảng giá thu mua: khóa theo `model + cấp hạng + nhóm tuổi đời + có/không phụ kiện kèm`; **có phiên bản và ngày hiệu lực**; chỉ ADMIN/BRANCH_MANAGER sửa; mỗi giao dịch lưu **snapshot** giá bảng được dùng.
- **[ĐỀ XUẤT]** Điều chỉnh giá của nhân viên: tối đa **±10%** so với giá bảng (cấu hình được, ADMIN đổi). Vượt ngưỡng → cần BRANCH_MANAGER duyệt. Mọi điều chỉnh bắt buộc lý do.
- **[ĐỀ XUẤT]** Xác thực: kết quả `VERIFIED` / `UNVERIFIED` / `SUSPECTED_FAKE`. `UNVERIFIED` và `SUSPECTED_FAKE` **không được thu mua** (khớp quyết định “từ chối → trả lại khách”); chỉ BRANCH_MANAGER được nâng `UNVERIFIED` lên `VERIFIED` kèm bằng chứng bổ sung.
- **[ĐỀ XUẤT]** Thanh toán cho người bán chỉ tính là hoàn tất khi có bản ghi thanh toán (tiền mặt: người chi + biên nhận; chuyển khoản: mã giao dịch). Chưa có bản ghi → thu mua chưa hoàn tất.
- **[ĐỀ XUẤT]** Thông tin người bán: họ tên, SĐT, số giấy tờ tùy thân (lưu **mã hóa/che một phần**, chỉ vai trò có quyền mới xem đủ). Dữ liệu seed dùng giá trị giả.
- **[ĐỀ XUẤT]** Bảo hành second-hand mặc định 30 ngày cho kết cấu khung (nứt/gãy không do người dùng), thiết lập khi quản lý duyệt bán lại, **có thể khác nhau từng chiếc**; không bảo hành dây/quấn cán.

**Bảo hành**
- **[ĐỀ XUẤT]** Hàng mới: chính sách bảo hành theo sản phẩm/nhóm (seed mẫu 12 tháng khung vợt — chỉ là dữ liệu demo, không phải cam kết thật). Khi bán, **snapshot** chính sách + ngày bắt đầu (ngày giao/bàn giao) vào dòng đơn hàng.
- **[ĐỀ XUẤT]** Yêu cầu bảo hành: `SUBMITTED → RECEIVED → INSPECTING → APPROVED | REJECTED → RESOLVED (sửa/đổi/hoàn) → CLOSED`; có ảnh, lý do, lịch sử xử lý; tra cứu theo mã đơn + SĐT hoặc theo serial.

**Kỹ thuật**
- **[ĐỀ XUẤT]** **Message broker: RabbitMQ** (nhẹ, rẻ, chạy được trên VPS nhỏ). Không dùng Kafka vì không có nhu cầu throughput/replay tương xứng.
- **[ĐỀ XUẤT]** Lưu ảnh: object storage tương thích S3 qua **MinIO** (local/VPS), truy cập qua interface `FileStorage`.
- **[ĐỀ XUẤT]** Triển khai ban đầu: Docker Compose; VPS đơn lẻ sau này.

---

## 3. Phiên bản công nghệ (kiểm tra lại khi bắt đầu)

Agent **phải kiểm tra phiên bản ổn định mới nhất** của từng thành phần trước khi khai báo phụ thuộc, không dựa vào trí nhớ. Tại thời điểm viết prompt:

- Java: **LTS mới nhất được Spring Boot hỗ trợ** (ưu tiên Java 25 LTS; nếu thư viện nào chưa tương thích thì dùng Java 21 LTS và ghi ADR).
- Spring Boot: dòng **4.1.x** (GA 10/06/2026) hoặc patch ổn định mới hơn. Spring Boot 3.5 đã hết hỗ trợ OSS, **không dùng**.
- Next.js: dòng **16.x** (kiểm tra patch ổn định mới nhất bằng `npm view next version`), App Router, TypeScript strict.
- PostgreSQL: bản ổn định mới (kiểm tra), Flyway cho migration.
- RabbitMQ, MinIO, Redis (chỉ thêm nếu có lý do rõ ràng — mặc định **không dùng Redis** để giảm chi phí vận hành).

Nhớ rằng Spring Boot 4 có thay đổi lớn so với 3.x (Spring Framework 7, Jackson 3 mặc định, modular auto-configuration, Spring Security 7). Đọc release notes/migration guide trước khi viết cấu hình; không copy snippet kiểu Boot 3 mà chưa kiểm tra.

---

## 4. Kiến trúc tổng thể (balanced microservices)

### 4.1 Nguyên tắc
1. Tách service theo **ranh giới nghiệp vụ và nhu cầu nhất quán dữ liệu**, không theo bảng.
2. Mỗi service **sở hữu database riêng** (database/schema + user DB riêng, không truy vấn chéo, không FK chéo service). Dùng chung một instance PostgreSQL để tiết kiệm.
3. Giao tiếp **đồng bộ (REST)** khi cần câu trả lời ngay; **bất đồng bộ (RabbitMQ)** cho sự kiện nghiệp vụ.
4. Không có thư viện dùng chung chứa domain model. Chỉ cho phép một module `platform-commons` rất nhỏ: định dạng lỗi, correlation id, cấu hình bảo mật JWT, tiện ích outbox/inbox.
5. Mọi quyết định kiến trúc quan trọng ghi thành **ADR** ngắn trong `docs/adr/`.

### 4.2 Danh sách service

| Service | Trách nhiệm | Dữ liệu sở hữu |
|---|---|---|
| `api-gateway` | Định tuyến, xác thực JWT ở biên, rate limit cơ bản, CORS, correlation id | — |
| `identity-service` | Đăng ký/đăng nhập, JWT access + refresh, vai trò, **phân công nhân viên–chi nhánh**, hồ sơ khách | users, roles, staff_branch_assignments, refresh_tokens |
| `catalog-service` | Sản phẩm, thương hiệu, danh mục, SKU, thông số vợt, ảnh, giá, **listing second-hand** (bản chiếu để hiển thị), dữ liệu SEO | products, skus, prices, listings |
| `inventory-service` | Chi nhánh, tồn kho theo chi nhánh, **reservation**, sổ cái tồn kho, nhập kho, điều chuyển, kiểm kê, chênh lệch | branches, stock_levels, stock_movements, reservations, transfers, stocktakes |
| `order-service` | Giỏ hàng, đơn hàng, thanh toán (manual), fulfillment (giao/nhận), hủy, hoàn tiền | carts, orders, order_lines, payments, shipments, refunds |
| `secondhand-service` | Phiếu thu mua, kiểm định, bảng giá thu mua, hồ sơ từng chiếc, thanh toán cho người bán, duyệt bán lại | buyback_cases, inspections, price_tables, units, seller_payments |
| `warranty-service` | Chính sách bảo hành, yêu cầu bảo hành, lịch sử xử lý | policies, claims, claim_events |

Gợi ý lộ trình giảm rủi ro cho người làm một mình: **bắt đầu mỗi service như một module sạch trong cùng repo (monorepo), chạy riêng ngay từ đầu bằng Compose**, nhưng không thêm service thứ 8 (notification…) trừ khi có luồng nghiệp vụ thật. Thông báo (email/SMS) ở MVP chỉ cần ghi log/giả lập qua interface `Notifier`.

### 4.3 Cách second-hand đi vào tồn kho và catalog (quan trọng)
- Khi quản lý **duyệt bán lại**, `secondhand-service` phát sự kiện `SecondHandUnitApproved` (outbox).
- `inventory-service` tạo một **stockable item** cho chiếc vợt đó với số lượng **1 tại chi nhánh thu mua** (ràng buộc DB `quantity <= 1` cho loại item `UNIQUE`).
- `catalog-service` tạo **listing** với ảnh, hạng, mô tả tình trạng, giá bán đã duyệt, chính sách bảo hành.
- Nhờ vậy luồng **reservation** của đơn hàng dùng **cùng một mã** cho hàng mới và hàng second-hand; tính duy nhất của chiếc vợt được bảo đảm bằng ràng buộc tồn kho, không bằng cờ ở service khác.
- Nếu bước tạo ở `inventory`/`catalog` thất bại: retry có giới hạn → vào DLQ → trạng thái unit hiển thị `PUBLISH_FAILED` để quản lý thấy và retry thủ công.

### 4.4 Nhất quán dữ liệu và độ tin cậy
- **Transactional outbox** ở mọi service phát sự kiện: ghi nghiệp vụ + bản ghi outbox trong **cùng một transaction**; một relay đọc outbox và publish lên RabbitMQ.
- **Idempotent consumer** (bảng inbox/`processed_messages` theo `messageId`), xử lý trùng lặp an toàn.
- **Idempotency-Key** cho các API tạo tài nguyên có tiền/tồn kho (tạo đơn, ghi nhận thanh toán, tạo reservation).
- **Saga tạo đơn (orchestration trong `order-service`)**:
  1. `order-service` tạo đơn ở trạng thái `PENDING_RESERVATION`.
  2. Gọi **đồng bộ** `inventory-service` để reserve (kèm Idempotency-Key, timeout, retry giới hạn, circuit breaker bằng Resilience4j).
  3. Thành công → đơn `PENDING_PAYMENT` (QR) hoặc `PENDING_CONFIRMATION` (COD); thất bại do hết hàng → đơn `REJECTED_OUT_OF_STOCK` và báo khách.
  4. Hết hạn giữ hàng/hủy → sự kiện `OrderCancelled`/`ReservationExpired` → inventory nhả hàng (**compensation**).
  5. Bàn giao/xuất hàng → sự kiện chuyển reservation thành trừ tồn thực (`on_hand -= qty`).
- **Xử lý đồng thời tồn kho**: cập nhật có điều kiện trong một câu SQL (`UPDATE ... SET reserved = reserved + :q WHERE branch_id=:b AND item_id=:i AND on_hand - reserved >= :q`), không đọc-rồi-ghi ở tầng ứng dụng; có **bài test đồng thời** chứng minh không bán vượt (xem mục 11).
- Job định kỳ (có khóa, ví dụ ShedLock hoặc `SELECT ... FOR UPDATE SKIP LOCKED`) quét reservation hết hạn.
- Dùng **optimistic locking** (`@Version`) cho các aggregate có luồng trạng thái (đơn, phiếu điều chuyển, phiếu thu mua).

### 4.5 Quy ước dữ liệu
- ID: UUID (ưu tiên UUID v7 nếu thư viện ổn định) + mã nghiệp vụ dễ đọc cho người dùng (ví dụ `DH-20261013-0001`).
- Tiền: `BIGINT` đơn vị VND, kèm `currency = 'VND'` ở cấp bảng nếu cần mở rộng. **Không dùng float/double.**
- Thời gian: `timestamptz`, lưu UTC.
- Mọi bảng nghiệp vụ có `created_at`, `updated_at`, `created_by`, `version`.
- Xóa mềm cho dữ liệu cần audit; sổ cái tồn kho và lịch sử kiểm định là **append-only**.
- Migration bằng Flyway, không dùng `ddl-auto` ngoài môi trường test.

---

## 5. Nghiệp vụ chi tiết cần hiện thực

### 5.1 Máy trạng thái

**Đơn hàng**
`PENDING_RESERVATION → PENDING_PAYMENT | PENDING_CONFIRMATION → CONFIRMED → PREPARING → (giao) SHIPPING → DELIVERED → COMPLETED` hoặc `(nhận tại cửa hàng) READY_FOR_PICKUP → COMPLETED`; nhánh phụ: `CANCELLED`, `REJECTED_OUT_OF_STOCK`, `EXPIRED`, `REFUND_REQUESTED → REFUNDED | REFUND_REJECTED`.

**Phiếu thu mua (buyback case)**
`DRAFT → INSPECTING → QUOTED → ACCEPTED_BY_SELLER → PAID (hoàn tất thu mua)`; nhánh phụ: `REJECTED_RETURNED` (hạng D, chưa xác minh, nghi giả, hoặc không đạt), `DECLINED_BY_SELLER` (người bán không chấp nhận giá), `PENDING_MANAGER_APPROVAL` (giá điều chỉnh vượt ngưỡng).

**Hồ sơ từng chiếc (unit)**
`PURCHASED → PENDING_RESALE_APPROVAL → APPROVED_FOR_SALE (đã tạo listing + tồn kho 1) → RESERVED → SOLD`; nhánh phụ: `WITHDRAWN`, `PUBLISH_FAILED`, `IN_WARRANTY_SERVICE`.

**Phiếu điều chuyển**: như mục 2.2. **Yêu cầu bảo hành**: như mục 2.2.

Mỗi chuyển trạng thái phải: kiểm quyền, kiểm trạng thái hợp lệ (bảng chuyển tiếp trong code, có unit test), ghi lịch sử (ai, khi nào, từ→đến, lý do).

### 5.2 Quy tắc quan trọng cần có test
1. Không bao giờ `on_hand - reserved < 0`, kể cả khi 50 request đồng thời tranh nhau 1 sản phẩm.
2. Một chiếc vợt second-hand chỉ giữ được cho **một** đơn tại một thời điểm.
3. Hết hạn giữ hàng thì nhả đúng một lần (idempotent).
4. Nhân viên không thao tác được ở chi nhánh không được phân công (kể cả khi giả mạo `X-Branch-Id`).
5. Giá điều chỉnh vượt ±ngưỡng không thể tự duyệt bởi nhân viên.
6. Vợt hạng D / `UNVERIFIED` / `SUSPECTED_FAKE` không thể chuyển sang `PAID`.
7. Vợt chưa qua duyệt bán lại không xuất hiện trên website và không có tồn kho khả dụng.
8. Điều chuyển: trừ kho gửi đúng thời điểm xuất; hàng `in_transit` không bán được; nhận thiếu tạo `discrepancy`.
9. Snapshot bảng giá, snapshot chính sách bảo hành không đổi khi bảng gốc đổi sau này.
10. Mọi thao tác nhạy cảm có audit log (ai/khi nào/trước–sau).

---

## 6. Thiết kế API

- REST, JSON, tiền tố `/api/v1`. Mô tả bằng **OpenAPI** (springdoc), mỗi service tự xuất spec; gateway có trang tổng hợp.
- Lỗi theo **RFC 9457 Problem Details** (`application/problem+json`) kèm `code` nghiệp vụ ổn định và `traceId`.
- Phân trang theo cursor hoặc `page/size` có giới hạn tối đa; sắp xếp/lọc whitelist.
- Validation ở biên (Jakarta Validation), thông báo lỗi tiếng Việt cho trường người dùng nhập.
- API công khai (catalog đọc) cache được (`ETag`/`Cache-Control`); API quản trị không cache.
- Versioning: giữ `/v1`; thay đổi phá vỡ thì thêm `/v2`.

---

## 7. Bảo mật

- **JWT**: access token ngắn hạn (~15 phút), refresh token xoay vòng (rotation) có phát hiện tái sử dụng, lưu hash trong DB. Claims: `sub`, `roles`, `branches` (danh sách chi nhánh được phân công). Ký bằng khóa bất đối xứng; `identity-service` công bố JWKS; các service khác xác thực bằng JWKS (resource server).
- Kiểm quyền **ở từng service** (method security + kiểm `branchId`), không chỉ ở gateway.
- Mật khẩu: Argon2id hoặc bcrypt với cost phù hợp; rate limit đăng nhập; khóa tạm khi sai nhiều lần.
- Dữ liệu cá nhân (giấy tờ người bán, SĐT, địa chỉ): che một phần khi hiển thị, mã hóa cột nhạy cảm, không ghi vào log.
- Secrets chỉ qua biến môi trường/Docker secrets; **không commit** `.env` thật; có `.env.example`.
- Upload ảnh: giới hạn kích thước/loại MIME, kiểm tra magic bytes, đặt tên ngẫu nhiên, không phục vụ trực tiếp từ thư mục ứng dụng.
- CORS chặt, header bảo mật, CSRF phù hợp khi frontend dùng cookie.
- Quét phụ thuộc (Dependabot/OWASP Dependency-Check) trong CI.

---

## 8. Frontend (Next.js)

### 8.1 Công nghệ
- Next.js 16.x App Router, React, **TypeScript strict**, Node LTS.
- Tailwind CSS + shadcn/ui (Radix) cho thành phần giao diện; Framer Motion (motion) dùng tiết chế.
- Dữ liệu: Server Components cho trang công khai; TanStack Query cho phần tương tác phía client; React Hook Form + Zod cho form.
- **Next.js đóng vai trò BFF**: lưu token trong cookie **httpOnly + Secure + SameSite**, gọi gateway từ server; trình duyệt không giữ JWT trong localStorage.
- Phông chữ: dùng `next/font`; **kiểm tra hỗ trợ đủ dấu tiếng Việt** (chữ có nhiều dấu như “ặ, ữ, ợ”) trước khi chốt.
- Ngôn ngữ: chỉ tiếng Việt ở MVP, nhưng không hard-code chuỗi rải rác (gom vào file nội dung để dễ thêm i18n).

### 8.2 SEO (yêu cầu cốt lõi)
- Trang chủ, danh mục, chi tiết sản phẩm, chi tiết vợt second-hand: **SSR/ISR**, URL sạch có slug (`/vot-cau-long/yonex-astrox-99-pro-4u`), canonical, `metadata` động.
- **JSON-LD** `Product` + `Offer` (giá VND, tình trạng còn hàng, `itemCondition` cho hàng cũ), `BreadcrumbList`, `Organization`/`LocalBusiness` cho từng chi nhánh.
- `sitemap.xml` và `robots.txt` sinh động; Open Graph/Twitter card; ảnh dùng `next/image` có `alt` có nghĩa.
- Trang lọc (hãng, giá, trọng lượng…) dùng URL query; chặn index tổ hợp lọc vô nghĩa bằng `noindex`/canonical.
- Mục tiêu hiệu năng: Core Web Vitals tốt trên di động (LCP < 2,5 s ở dữ liệu seed), đo bằng Lighthouse CI.
- Trang quản trị, giỏ hàng, thanh toán, tài khoản: `noindex`.

### 8.3 Phân vùng giao diện
1. **Storefront công khai** (ưu tiên số 1): trang chủ, danh mục, bộ lọc, chi tiết sản phẩm, so sánh vợt (tối đa 3 chiếc), giỏ hàng, thanh toán, theo dõi đơn, tra cứu bảo hành, trang chi nhánh.
2. **Khu tài khoản khách**: đơn hàng, yêu cầu bảo hành, địa chỉ.
3. **Khu quản trị/nhân viên** (route group riêng, giao diện **đặc, dễ quét**, ưu tiên bảng và biểu mẫu): chọn chi nhánh làm việc, kho, nhập kho, điều chuyển, kiểm kê, đơn hàng, thu mua second-hand (wizard kiểm định), duyệt bán lại, bảo hành, quản lý bảng giá, người dùng/phân quyền.

### 8.4 Định hướng phong cách thiết kế — “Court & Motion”
Mục tiêu cảm xúc: **năng động như trên sân nhưng đáng tin như cửa hàng chính hãng**; không rối, không giống mẫu e-commerce chung chung.

**Màu sắc** (dùng design token CSS, hỗ trợ sáng/tối):
- Nền chính: trắng ngà ấm (`#F7F7F2`) / chế độ tối: gần đen xanh (`#0B1210`).
- Màu thương hiệu: **xanh sân đậm** (`#0F5132` → dải gradient nhẹ sang `#16794C`).
- Điểm nhấn hành động: **xanh chanh điện** (`#C8F31D`) cho CTA chính và nhãn nổi bật; cam tín hiệu (`#FF6B2C`) chỉ cho giảm giá/cảnh báo.
- Trung tính: bộ xám xanh (slate) từ `#EEF1EE` đến `#1A2420`.
- Kiểm tra tương phản WCAG AA cho mọi cặp chữ/nền (chữ trên nền chanh dùng màu tối).

**Chữ**: tiêu đề đậm, tỉ lệ lớn, cảm giác thể thao (ví dụ họ Barlow Condensed hoặc Be Vietnam Pro đậm — chọn một phương án **đã xác minh đủ glyph tiếng Việt**); nội dung dùng Be Vietnam Pro hoặc Inter. Số liệu kỹ thuật dùng chữ có chữ số tabular.

**Bố cục và hình ảnh**:
- Ảnh sản phẩm lớn, nền sạch, tỷ lệ nhất quán; hero có chuyển động nhẹ gợi cú smash/đường cầu (không lạm dụng, tôn trọng `prefers-reduced-motion`).
- Thẻ sản phẩm bo góc vừa (12–16px), bóng đổ mềm, hover nâng nhẹ; lưới thoáng.
- **Thông số vợt hiển thị trực quan**: thanh trực quan cho điểm cân bằng (nặng đầu/cân bằng/nhẹ đầu), độ cứng đũa, trọng lượng (3U/4U/5U), mức căng dây tối đa — thay cho bảng chữ khô.
- **Huy hiệu tin cậy** nhất quán: “Chính hãng”, “Bảo hành X tháng”, “Nhận tại cửa hàng”.
- **Second-hand có ngôn ngữ thị giác riêng**: huy hiệu hạng A/B/C (A xanh đậm, B xanh lá, C vàng), dòng “Chiếc duy nhất — còn 1”, bộ ảnh nhiều góc từ kiểm định, **checklist tình trạng hiển thị dạng chip**, và dòng “Đã kiểm định bởi cửa hàng” (không nêu tên nhân viên).
- Khu quản trị: nền trung tính, bảng dày, trạng thái bằng chip màu có **icon + chữ** (không chỉ dựa vào màu), phím tắt cho thao tác lặp lại.

**Khả năng tiếp cận và đáp ứng**: thiết kế **mobile-first**, kiểm tra từ 360px; điều hướng bằng bàn phím, focus rõ, nhãn ARIA đúng; mục tiêu axe không lỗi nghiêm trọng.

**Nội dung**: giọng văn gần gũi, rõ ràng, tránh phóng đại; giá hiển thị `1.250.000 ₫` (định dạng `vi-VN`).

**Cách làm thiết kế**: trước khi viết trang, tạo **design tokens + thư viện component nhỏ** (Button, Badge, ProductCard, SpecBar, GradeBadge, PriceTag, StatusChip, DataTable) rồi ghép trang; dùng Storybook hoặc trang `/_design` để rà soát.

---

## 9. Quan sát và vận hành (mức cơ bản)

- Log JSON có cấu trúc, kèm `traceId`/`correlationId` lan truyền qua gateway → service → message.
- Spring Boot Actuator: `/health` (liveness/readiness), `/metrics`; Micrometer → Prometheus; dashboard Grafana mẫu chạy qua **Compose profile `observability`** (tùy chọn để tiết kiệm tài nguyên).
- Tracing: bật OpenTelemetry cơ bản (có thể xuất ra Jaeger/Tempo trong profile `observability`); tối thiểu có trace id trong log.
- Metric nghiệp vụ tối thiểu: số reservation tạo/hết hạn/thất bại, độ trễ tạo đơn, số message trong DLQ, số chênh lệch điều chuyển chưa xử lý.
- Cảnh báo/đồ thị: DLQ > 0, reservation hết hạn bất thường, lỗi 5xx tăng.

---

## 10. Triển khai và môi trường

- Monorepo: `services/*`, `frontend/`, `infra/`, `docs/`.
- `infra/docker-compose.yml` chạy toàn bộ: PostgreSQL, RabbitMQ, MinIO, các service, gateway, frontend; `profiles` cho `observability`.
- Một lệnh khởi động (`make up` hoặc `./scripts/dev.sh`), một lệnh seed dữ liệu mẫu, một lệnh chạy toàn bộ test.
- Cấu hình theo biến môi trường (12-factor); profile `local`, `test`, `prod`.
- CI (GitHub Actions): build, unit test, integration test (Testcontainers), lint, quét phụ thuộc, build image. CD lên VPS để ở Phase cuối.
- Chuẩn bị sẵn cho VPS: healthcheck trong Compose, restart policy, **backup PostgreSQL định kỳ** (script + hướng dẫn khôi phục đã thử), reverse proxy (Caddy/Nginx) với TLS, giới hạn tài nguyên container. Ngân sách thấp: ưu tiên một VPS nhỏ, công cụ mã nguồn mở.

---

## 11. Chiến lược kiểm thử (mức cao)

| Tầng | Nội dung | Công cụ gợi ý |
|---|---|---|
| Unit | Máy trạng thái, tính giá thu mua, quy tắc điều chỉnh giá, chọn chi nhánh, tính hạn giữ hàng | JUnit 5, AssertJ, Mockito |
| Integration (từng service) | Repository + migration + API thật với DB thật | Spring Boot Test, **Testcontainers** (PostgreSQL, RabbitMQ) |
| **Concurrency** | N luồng cùng reserve một SKU/một chiếc vợt unique; kiểm tra không bán vượt, đúng một người thắng | Testcontainers + `ExecutorService`/CountDownLatch |
| Messaging | Outbox → RabbitMQ → consumer; trùng message; thất bại → DLQ; compensation | Testcontainers |
| Contract | Giữ ổn định hợp đồng giữa order↔inventory, secondhand→inventory/catalog | Spring Cloud Contract hoặc Pact |
| Security | Phân quyền theo vai trò + chi nhánh; token hết hạn/giả mạo; IDOR | Spring Security Test |
| E2E | Vài luồng vàng: mua hàng (QR & COD), nhận tại cửa hàng, thu mua → duyệt → bán, điều chuyển, bảo hành | Playwright |
| Frontend | Component test, axe a11y, Lighthouse CI cho trang SEO | Vitest/Testing Library, axe, Lighthouse CI |
| Hiệu năng (nhẹ) | Kịch bản đặt hàng đồng thời và duyệt catalog | k6 |

Mục tiêu tham khảo: phủ logic nghiệp vụ lõi ≥ 80%, **100% các quy tắc ở mục 5.2 có test tương ứng**. Test phải chạy được trong CI và local bằng một lệnh.

---

## 12. Cấu trúc repo đề xuất

```
badminton-shop/
├─ services/
│  ├─ api-gateway/
│  ├─ identity-service/
│  ├─ catalog-service/
│  ├─ inventory-service/
│  ├─ order-service/
│  ├─ secondhand-service/
│  └─ warranty-service/
├─ platform-commons/          # rất nhỏ: lỗi, correlation id, JWT config, outbox/inbox
├─ frontend/                  # Next.js (storefront + admin route group)
├─ infra/                     # docker-compose, rabbitmq/minio/postgres init, observability
├─ docs/
│  ├─ adr/                    # quyết định kiến trúc
│  ├─ domain/                 # sơ đồ trạng thái, quy tắc nghiệp vụ
│  └─ runbook.md              # vận hành, backup/restore
└─ scripts/                   # dev.sh, seed, test-all
```

Mỗi service theo kiến trúc phân lớp rõ ràng (hoặc hexagonal gọn): `api` (controller/DTO) → `application` (use case) → `domain` (entity, quy tắc, state machine) → `infrastructure` (JPA, messaging, client). Logic nghiệp vụ nằm ở `domain`/`application`, **không** nằm trong controller.

---

## 13. Quy tắc làm việc cho AI agent

1. **Đọc hết prompt trước khi code.** Nếu phát hiện mâu thuẫn hoặc thiếu sót nghiêm trọng, nêu ở đầu báo cáo Phase; **không tự đổi mục [CHỐT]**.
2. Làm **theo Phase**. Cuối mỗi Phase: chạy test, cập nhật tài liệu, tóm tắt (đã làm gì, đã kiểm chứng ra sao, còn tồn đọng gì, rủi ro), rồi **dừng chờ xác nhận**.
3. Mỗi thay đổi lớn nhỏ gọn, commit theo Conventional Commits.
4. Không thêm công nghệ ngoài danh sách (Redis, Kafka, Elasticsearch, Kubernetes, service mesh…) nếu chưa có ADR nêu lý do **và** chủ dự án đồng ý.
5. Không bịa phiên bản/API của thư viện: kiểm tra tài liệu chính thức; nếu không chắc, nói rõ.
6. Không viết secrets thật; không log dữ liệu cá nhân.
7. Ưu tiên **đúng và kiểm chứng được** hơn là nhiều tính năng. Một tính năng chưa có test cho quy tắc quan trọng của nó thì **chưa xong**.
8. Seed dữ liệu thực tế đủ để demo (tên model vợt, hãng phổ biến, giá VND hợp lý) nhưng **dùng dữ liệu giả, ảnh minh họa không vi phạm bản quyền** (placeholder hoặc ảnh tự tạo).
9. Khi cần quyết định chưa có trong prompt: chọn phương án đơn giản nhất phù hợp ngân sách thấp/một người làm, ghi vào `docs/adr/` và nêu trong báo cáo Phase.
10. Trả lời, comment tài liệu bằng tiếng Việt; tên code, bảng, API bằng tiếng Anh.

---

## 14. Lộ trình theo Phase (Definition of Done)

**Phase 0 — Nền móng**
Monorepo, Docker Compose (Postgres, RabbitMQ, MinIO), `platform-commons`, khung gateway + một service mẫu, CI chạy được, định dạng lỗi chuẩn, correlation id, ADR đầu tiên, tài liệu máy trạng thái ban đầu.
*Xong khi*: `make up` chạy sạch; CI xanh; một request đi gateway → service có trace id trong log.

**Phase 1 — Identity + Catalog + Storefront SEO**
Đăng ký/đăng nhập, JWT + refresh rotation, vai trò, phân công chi nhánh; catalog (hãng, danh mục, SKU, thông số vợt, ảnh, giá); storefront SSR với danh mục, bộ lọc, chi tiết, sitemap, JSON-LD; design tokens + thư viện component.
*Xong khi*: duyệt catalog đầy đủ trên storefront; Lighthouse SEO ≥ 90 trên trang sản phẩm seed; test phân quyền đạt.

**Phase 2 — Inventory + Branch + Admin cơ bản**
Chi nhánh, tồn kho theo chi nhánh, sổ cái, nhập kho, reservation (API + hết hạn + nhả), điều chuyển đủ vòng đời, kiểm kê/điều chỉnh, chênh lệch; giao diện quản trị chọn chi nhánh làm việc.
*Xong khi*: test concurrency và các quy tắc 1, 3, 4, 8 (mục 5.2) đạt.

**Phase 3 — Order + Payment + Fulfillment**
Giỏ hàng, tạo đơn qua saga, thanh toán COD/QR thủ công, xác nhận, giao/nhận tại cửa hàng với pickup code, hủy, hoàn tiền; luồng mua hàng trên storefront; quản trị đơn.
*Xong khi*: E2E mua hàng (QR & COD) + nhận tại cửa hàng chạy được; outbox/inbox + DLQ có test; saga compensation có test.

**Phase 4 — Second-hand**
Phiếu thu mua, wizard kiểm định (checklist + hạng + ảnh + serial), bảng giá có phiên bản, điều chỉnh giá có giới hạn và duyệt, thanh toán người bán, duyệt bán lại, phát sự kiện → tạo tồn kho/listing; trang second-hand trên storefront với ngôn ngữ thị giác riêng.
*Xong khi*: quy tắc 2, 5, 6, 7, 9 có test; E2E thu mua → duyệt → khách mua thành công.

**Phase 5 — Warranty**
Chính sách theo sản phẩm/từng chiếc, snapshot khi bán, yêu cầu bảo hành đủ vòng đời, tra cứu bảo hành phía khách, giao diện xử lý phía nhân viên.
*Xong khi*: E2E bảo hành chạy được; snapshot chính sách có test.

**Phase 6 — Hoàn thiện và triển khai**
Observability profile, k6 cơ bản, rà soát bảo mật, runbook, backup/restore đã thử, script triển khai VPS, README dự án (kiến trúc, sơ đồ, bài học, cách chạy demo), dữ liệu demo và kịch bản trình diễn 5 phút.
*Xong khi*: người ngoài clone repo và chạy được demo theo README trong ≤ 15 phút.

**Phase mở rộng (chỉ khi chủ dự án yêu cầu)**: guest checkout, mã giảm giá/điểm thành viên, đánh giá sản phẩm, wishlist, dịch vụ căng cước, cổng thanh toán sandbox (VNPay/MoMo), tách đơn nhiều chi nhánh, giá theo chi nhánh, đăng ký thu mua online.

---

## 15. Ngoài phạm vi MVP (không làm trừ khi được yêu cầu)

Sàn nhiều người bán/ký gửi; tích hợp hãng vận chuyển thật; thanh toán thật; app di động; đa ngôn ngữ/đa tiền tệ; chatbot/AI; Kubernetes/service mesh; Kafka/event sourcing đầy đủ; hệ thống kế toán.

---

## 16. Báo cáo khi bắt đầu

Trước khi code Phase 0, hãy trả lời ngắn gọn:
1. Phiên bản bạn sẽ dùng cho Java, Spring Boot, Next.js, PostgreSQL, RabbitMQ (đã kiểm tra nguồn).
2. Những điểm trong prompt bạn thấy mâu thuẫn, thiếu hoặc rủi ro (nếu có).
3. Kế hoạch chi tiết Phase 0 (danh sách việc, thời gian ước lượng).

Sau đó chờ xác nhận rồi bắt đầu.
