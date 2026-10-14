# BẢNG KÊ CÁC TUYÊN BỐ MARKETING CẦN XÁC NHẬN (CLAIMS TO CONFIRM)
**Dự án**: Smash Court Overhaul — Storefront & Platform Refactor  
**Mã tài liệu**: `docs/ui/claims-to-confirm.md`  
**Giai đoạn**: Milestone M0 (Chuẩn hóa Storefront & Khử độc nội dung)  
**Nguyên tắc chỉ đạo**: Triết lý thiết kế Quiet Court — Khách quan, chuẩn mực thể thao, trung thực, triệt tiêu phóng đại, bảo mật kiến trúc nội bộ.

---

## I. TỔNG QUAN & NGUYÊN TẮC BIÊN TẬP

Theo yêu cầu từ **ORIGINAL_REQUEST §R0** và tiêu chuẩn giao diện **Quiet Court**, toàn bộ nội dung hiển thị trên storefront phải tuân thủ 5 nguyên tắc biên tập nghiêm ngặt:
1. **Tuyệt đối không sử dụng từ ngữ so sánh tuyệt đối hoặc quảng cáo phóng đại**: Loại bỏ các từ như *"vô địch", "kỷ lục thế giới", "siêu đàn hồi", "đẳng cấp", "số 1", "hủy diệt", "như chớp mắt"*.
2. **Không cam kết dịch vụ vượt quá năng lực vận hành thực tế của MVP**: Các cam kết về thời gian căng vợt 15 phút, khắc laser miễn phí, bảo hiểm giao hàng 100% trong 1-2 ngày cần được xác nhận hoặc diễn đạt thận trọng.
3. **Triệt tiêu toàn bộ thuật ngữ nội bộ và rò rỉ kiến trúc**: Không để khách hàng nhìn thấy mã quy tắc (*R1–R10, K1–K10*), tên cơ sở dữ liệu (*PostgreSQL 18*), khái niệm kỹ thuật máy tính (*Snapshot Immutability, Unique Unit, Atomic Lock, IDOR*).
4. **Đồng bộ 100% dữ liệu danh mục & địa giới hành chính**: Giá niêm yết, danh sách thương hiệu, và địa chỉ chi nhánh phải khớp chính xác giữa giao diện người dùng và cơ sở dữ liệu (`identity_db`, `catalog_db`).
5. **Giữ tinh thần "Quiet Court"**: Khiêm nhường, chuyên nghiệp, đáng tin cậy, tôn trọng sự hiểu biết và trải nghiệm của người chơi cầu lông chân chính.

---

## II. BẢNG DANH MỤC CÁC TUYÊN BỐ CẦN XÁC NHẬN & HIỆU CHỈNH

### Nhóm 1: Tuyên bố so sánh nhất & Mô tả sản phẩm phóng đại (Superlatives)

| STT | Phân loại (Claim Category) | Vị trí xuất hiện | Nội dung hiện tại | Đánh giá & Rủi ro | Đề xuất thay thế (Quiet Court) | Trạng thái |
|:---:|:---|:---|:---|:---|:---:|
| 1.1 | `seed-data.sql:210` & PDP Axforce 80 | *"Vũ khí vô địch thế giới của Chen Long với carbon FRTP siêu đàn hồi"* | Phóng đại; Chen Long đã giải nghệ; "siêu đàn hồi" là từ ngữ cấm theo Quiet Court. | *"Vợt thiên công thân cứng, khung carbon tăng cường trợ lực đập cầu dồn ép."* | **Đã sửa** |
| 1.2 | `seed-data.sql:192` & PDP Nanoflare 1000Z | *"Cây vợt xác lập kỷ lục thế giới về tốc độ đập cầu với khung AERO Frame siêu tốc"* | Tuyên bố kỷ lục cần giấy chứng nhận Guinness/BWF chính thức; "siêu tốc" là từ ngữ phóng đại. | *"Khung AERO Frame khí động học, tối ưu tốc độ vung vợt trong các pha phản tạt cự ly ngắn."* | **Đã sửa** |
| 1.3 | `seed-data.sql:201` & PDP Arcsaber 11 Pro | *"Cây vợt kiểm soát và điều cầu số 1 với khả năng giữ cầu lâu trên mặt lưới"* | Tuyên bố "số 1" vi phạm luật cạnh tranh và quảng cáo thương mại; mang tính cảm tính. | *"Khung vợt kiểm soát với rãnh Control-Assist, gia tăng thời gian tiếp xúc cầu cho đường cầu ổn định."* | **Đã sửa** |
| 1.4 | `seed-data.sql:229` & PDP Ryuga II | Lối chơi: *"Tấn công hủy diệt"* | Từ ngữ "hủy diệt" mang tính bạo lực, phô trương, lệch phong cách nhã nhặn của Quiet Court. | *"Tấn công uy lực"* | **Đã sửa** |
| 1.5 | `seed-data.sql:238` & PDP Auraspeed 100X | *"Tốc độ vung vợt như chớp mắt, chuyên gia xử lý cầu nhanh tầm trung"* | "Như chớp mắt" là lối ví von văn chương không chuẩn mực kỹ thuật thể thao. | *"Thân đũa trợ lực nhanh, chuyên biệt cho các tình huống gài lưới và đôi công tì đè."* | **Đã sửa** |
| 1.6 | `page.tsx:318` (Homepage lối chơi) | *"Đầu nhẹ, thân đũa siêu đàn hồi, tối ưu tốc độ vung vợt..."* | Từ "siêu đàn hồi" vi phạm Quiet Court Design Rule. | *"Đầu nhẹ, đũa vợt đàn hồi nhanh, tối ưu tốc độ vung vợt trong các pha xử lý trên lưới."* | **Đã sửa** |
| 1.7 | `vot-cau-long/page.tsx:85` | *"Phân phối chính hãng 100% · Bảo hành khung 12 tháng"* | Việc lặp lại "100%" tạo cảm giác gượng ép; khách hàng tin tưởng qua chính sách cụ thể. | *"Chính hãng phân phối · Bảo hành khung 12 tháng"* | **Đề xuất** |

---

### Nhóm 2: Cam kết dịch vụ & Năng lực vận hành thực tế (Operational Commitments)

| STT | Phân loại (Claim Category) | Vị trí xuất hiện | Nội dung hiện tại | Đánh giá & Rủi ro | Đề xuất thay thế (Quiet Court) | Xác nhận cần thiết |
|:---:|:---|:---|:---|:---|:---|
| 2.1 | `chi-nhanh/page.tsx:19` | *"Máy căng cước điện tử chuẩn BWF lấy ngay 15 phút"* | BWF không có quy chuẩn riêng cấp cho máy căng cước cửa hàng bán lẻ; cam kết "15 phút" gây tắc nghẽn khi đông khách. | *"Máy căng cước điện tử hiện đại, hỗ trợ hoàn thành trong ngày theo lịch hẹn."* | Xác nhận thời gian căng vợt thực tế tại từng chi nhánh. |
| 2.2 | `chi-nhanh/page.tsx:36` | *"Khắc tên và trọng lượng laser cán vợt miễn phí"* | MVP chưa đầu tư máy khắc laser công nghiệp tại cửa hàng Cầu Giấy; có nguy cơ khách hàng khiếu nại nếu không có máy. | *"Tư vấn thông số và hỗ trợ quấn cán, dán đầu vợt tiêu chuẩn miễn phí."* | Xác nhận cửa hàng có máy khắc laser thật không. |
| 2.3 | `vot-cau-long/[slug]/page.tsx:372` | *"Nhận tại cửa hàng: Sẵn sàng tại chi nhánh còn hàng sau 15 phút xác nhận."* | Cam kết 15 phút là phi thực tế khi nhân viên đang bận tiếp khách hoặc đơn phát sinh ngoài giờ. | *"Nhận tại cửa hàng: Hàng sẵn sàng sau khi bạn nhận được thông báo xác nhận từ chi nhánh."* | Xác nhận SLA soạn hàng của nhân viên quầy. |
| 2.4 | `vot-cau-long/[slug]/page.tsx:375` | *"Giao hàng toàn quốc: Đóng gói ống bọc chuyên dụng... bảo hiểm hàng hóa 100%. Giao nhanh 1–2 ngày..."* | Cần xác nhận đối tác vận chuyển (Viettel Post / GHN) có hợp đồng bảo hiểm gãy nứt khung 100% hay không; giao liên tỉnh 1-2 ngày không áp dụng vùng sâu xa. | *"Giao hàng toàn quốc: Đóng gói hộp chuyên dụng bảo vệ khung vợt, theo dõi hành trình trực tuyến. Thời gian 1–3 ngày làm việc."* | Xác nhận hợp đồng đơn vị vận chuyển. |
| 2.5 | `Footer.tsx:62` | *"Hotline: 1900 6868 (Miễn phí)"* | Đầu số 1900 6868 là số giả định; đầu số 1900 theo quy định viễn thông thường tính cước 1.000–3.000 đ/phút, không thể ghi "Miễn phí" (trừ 1800). | Cập nhật số điện thoại hotline thực tế hoặc số cố định từng chi nhánh (ví dụ: `028 3822 1234` hoặc hotline 1800 nếu có). | Cung cấp số điện thoại liên hệ chính thức của doanh nghiệp. |
| 2.6 | `Footer.tsx:72` | *"Đổi trả miễn phí trong 7 ngày nếu lỗi nhà sản xuất"* | Cần xác định rõ quy trình đổi trả: đổi cây mới tương đương hay gửi hãng thẩm định lỗi? | *"Hỗ trợ đổi mới trong 7 ngày đầu nếu phát sinh lỗi kỹ thuật từ nhà sản xuất."* | Xác nhận chính sách đổi trả hàng mới/cũ. |
| 2.7 | `page.tsx:390`, `second-hand/page.tsx:47` | *"Quy trình kiểm định đa điểm 16 tiêu chuẩn"* | Trong `admin/secondhand/page.tsx`, wizard thu mua hiện tại chỉ kiểm tra 5 tiêu chí kỹ thuật chính (đũa, khung, gen, sơn, trọng lượng). | Cần thống nhất danh mục chi tiết 16 tiêu chí kiểm định vật lý hoặc điều chỉnh câu chữ thành: *"Quy trình kiểm tra kỹ thuật đa điểm toàn diện tại quầy."* | Ban hành văn bản 16 tiêu chí kiểm định nội bộ. |

---

### Nhóm 3: Dữ liệu thực tế không đồng nhất (Canonical Data Discrepancies)

| STT | Phân loại (Claim Category) | Dữ liệu kiểm tra | Vị trí xung đột | Dữ liệu đúng (Theo Database & Yêu cầu) | Phương án xử lý |
|:---:|:---|:---|:---|:---|
| 3.1 | **Địa chỉ CN TP.HCM** | `Footer.tsx:53`: `120 Nguyễn Thị Minh Khai, P. Võ Thị Sáu`<br>`admin-context.tsx:13`: `15 Lê Duẩn, P. Bến Nghé` | `123 Nguyễn Thị Minh Khai, P. Bến Thành, Quận 1` (`identity_db.branches`) | Chuẩn hóa tất cả file về `123 Nguyễn Thị Minh Khai, P. Bến Thành, Quận 1`. |
| 3.2 | **Địa chỉ CN Đà Nẵng** | `Footer.tsx:59`, `page.tsx:500`: `88 Nguyễn Văn Linh`<br>`admin-context.tsx:15`: `102 Bạch Đằng` | `78 Nguyễn Văn Linh, Phường Nam Dương, Hải Châu` (`identity_db.branches`) | Chuẩn hóa tất cả file về `78 Nguyễn Văn Linh, Phường Nam Dương, Hải Châu`. |
| 3.3 | **Địa chỉ CN Hà Nội** | `Footer.tsx:56`, `chi-nhanh/page.tsx:30`: `45 Xuân Thủy`<br>`admin-context.tsx:14`: `28 Cầu Giấy` | Thống nhất dùng địa chỉ canonical từ database `identity_db`. | Đồng bộ hóa `admin-context.tsx` và `Footer.tsx` cùng một nguồn. |
| 3.4 | **Giá Hero Yonex Astrox 99 Pro** | `page.tsx:195`: `3.950.000 ₫`<br>`_design/page.tsx:16`: `3.950.000 ₫` | `4.250.000 ₫` (Giá SKU trong `catalog_db.skus` và `ORIGINAL_REQUEST §R0`) | Sửa giá hiển thị trên Banner Hero trang chủ thành `4.250.000 ₫`. |
| 3.5 | **Danh sách Hãng đối tác** | `page.tsx:377` (Marquee): có thương hiệu `MIZUNO` | Trong `catalog_db`, Mizuno chưa có bất kỳ sản phẩm nào (`ORIGINAL_REQUEST §R0: gỡ Mizuno do chưa có sản phẩm`) | Gỡ `MIZUNO` khỏi dải chữ thương hiệu trên trang chủ. |

---

### Nhóm 4: Rò rỉ văn bản kỹ thuật & Quy tắc nội bộ trên giao diện khách hàng

| STT | Phân loại (Claim Category) | Vị trí xuất hiện | Cụm từ rò rỉ | Lý do cần loại bỏ | Cụm từ thay thế chuẩn mực |
|:---:|:---|:---|:---|:---|
| 4.1 | `second-hand/page.tsx:56` | `(Quy tắc R2: Unique Unit)` | Khách hàng không hiểu mã nghiệp vụ R2; tiếng Anh pha tạp. | *(Loại bỏ hoàn toàn mã R2 và Unique Unit)*: *"Mỗi cây vợt là một sản phẩm độc bản duy nhất..."* |
| 4.2 | `second-hand/SecondhandOrderButton.tsx:101` | `Quy tắc R2: Sản phẩm độc bản duy nhất` | Lộ mã quy tắc backend. | `Sản phẩm độc bản duy nhất` |
| 4.3 | `page.tsx:422` | `độc nhất (Unique Unit) ... lưu snapshot điều kiện bảo hành` | Lộ thuật ngữ lập trình backend (`Unique Unit`, `snapshot`). | `sản phẩm độc bản ... lưu trữ điều kiện bảo hành bất biến` |
| 4.4 | `tra-cuu-bao-hanh/page.tsx:256` | `Snapshot chính sách bất biến` | Dùng từ mượn tiếng Anh "Snapshot" thô kệch. | `Cam kết chính sách bất biến` |
| 4.5 | `tra-cuu-bao-hanh/page.tsx:262` | `snapshot chính sách bảo hành đã cam kết (Quy tắc R9: Snapshot Immutability)` | Lộ nguyên văn quy tắc thiết kế R9. | `chính sách bảo hành đã cam kết theo đơn hàng` |
| 4.6 | `tra-cuu-bao-hanh/page.tsx:369` | `Quy tắc R9: Snapshot Immutability` | Lộ tiêu đề quy tắc backend. | `Chính sách bảo hành bất biến` |
| 4.7 | `tra-cuu-bao-hanh/page.tsx:461` | `Quy tắc K10: Kết luận từ chối bảo hành có bằng chứng:` | Lộ mã kịch bản kiểm thử K10. | `Lý do từ chối bảo hành kèm căn cứ kỹ thuật:` |
| 4.8 | `OrderSection.tsx:274` | `Đặt mua ngay (Khóa kho R1)` | Lộ mã quy tắc R1 trên nút bấm chính. | `Đặt mua ngay` |
| 4.9 | `OrderSection.tsx:346` | `Khóa kho nguyên tử R1` | Dùng thuật ngữ kỹ thuật máy tính ("nguyên tử / atomic"). | `Đảm bảo tồn kho thời gian thực` |
| 4.10 | `checkout/page.tsx:407` | `Xác nhận đặt hàng (Khóa kho R1)` | Lộ mã R1 trên nút thanh toán. | `Xác nhận đặt hàng` |
| 4.11 | `checkout/page.tsx:412` | `Khóa kho nguyên tử R1 · Cam kết không bán âm kho` | Khách hàng chỉ cần biết đơn hàng được giữ đúng tồn kho. | `Giữ hàng tự động · Cam kết chính xác theo tồn kho` |
| 4.12 | `Header.tsx:36` & `Footer.tsx:42` | `Design System`, `Thư viện thiết kế (Quiet Court)` | Link lộ công cụ nội bộ của lập trình viên ra ngoài menu chính. | Ẩn hoàn toàn khỏi Header và Footer công khai. |

---

## III. KẾ HOẠCH HÀNH ĐỘNG DÀNH CHO NHÓM PHÁT TRIỂN (ACTION PLAN)

1. **Giai đoạn M0**: Áp dụng triệt để các thay đổi tại **Nhóm 3** (Đồng bộ chi nhánh, giá, gỡ Mizuno) và **Nhóm 4** (Quét sạch văn bản rò rỉ mã R/K, Snapshot, Unique Unit, khóa `/_design`).
2. **Giai đoạn M1**: Biên tập lại dữ liệu mô tả sản phẩm trong `infra/postgres/seed-data.sql` và schema `product_images` theo chuẩn khách quan của **Nhóm 1**.
3. **Phê duyệt nghiệp vụ**: Trình Product Owner / Quản lý cửa hàng bảng câu hỏi xác nhận cho **Nhóm 2** (SLA căng cước, hotline chính thức, quy chế bảo hiểm vận chuyển).
