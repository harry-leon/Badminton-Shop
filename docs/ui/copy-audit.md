# BẢNG KIỂM KÊ VÀ ĐÁNH GIÁ NỘI DUNG (COPY AUDIT) — SMASH COURT

> Tài liệu thuộc **Phase UI-0 (Khảo sát và đường cơ sở)** của quy trình làm mới giao diện theo phong cách **Quiet Court**.  
> **Nguyên tắc biên tập**:
> 1. Viết như người bán hàng am hiểu sâu sắc về cầu lông: ngắn gọn, chân thực, súc tích, không tâng bốc.
> 2. Cấm tuyệt đối từ ngữ so sánh tuyệt đối ("vô địch", "siêu đàn hồi", "đỉnh cao", "chuẩn quốc tế", "đẳng cấp thế giới").
> 3. Cấm để lộ chi tiết kỹ thuật nội bộ (mã quy tắc R1–R10, tên database PostgreSQL 18, mã SKU monospace cho khách).
> 4. Thống nhất tiếng Việt tự nhiên và chuẩn mực, không pha trộn tiếng Anh tùy tiện.
> 5. Phân loại xử lý: **Giữ** (nội dung chuẩn) · **Rút gọn** (lược bỏ từ thừa/khoa trương) · **Xóa** (thừa, sáo rỗng hoặc lộ kỹ thuật).

---

## 1. HEADER & FOOTER DÙNG CHUNG (`layout.tsx`)

| Trang / Khu vực | Thành phần | Đoạn chữ hiện tại | Đánh giá | Bản mới đề xuất (Quiet Court) | Rationale |
|---|---|---|---|---|---|
| **Header** | Logo & Slogan | `SMASH COURT` + `Chính hãng` (badge xanh chanh) | **Rút gọn** | `Smash Court` (chữ thường tinh tế, bỏ badge \"Chính hãng\" ở logo) | Logo sang trọng, không cần tự gắn mác chính hãng cạnh tên thương hiệu; tin cậy sẽ thể hiện ở dải chứng nhận. |
| **Header** | Menu điều hướng | `VỢT MỚI 100%`, `VỢT KIỂM ĐỊNH (2ND)`, `TRA CỨU BẢO HÀNH` | **Rút gọn** | `Vợt mới`, `Vợt cũ đã kiểm định`, `Bảo hành` | Chuyển sang câu thường (sentence case), bỏ chữ số 100%, bỏ (2nd) lai tạp Anh-Việt. |
| **Header** | Nút Quản trị | `Admin Portal →` (lộ công khai góc phải header) | **Xóa khỏi header công khai** | Ẩn hoàn toàn với khách; chỉ hiện trong Menu Tài khoản khi đã đăng nhập vai trò nhân viên. | Khách hàng không cần thấy nút vào trang quản trị nội bộ. |
| **Header** | Chức năng thiếu | *(Chưa có tìm kiếm, giỏ hàng, tài khoản)* | **Thêm mới** | Thêm thanh tìm kiếm nhanh (⌘K), icon giỏ hàng kèm đếm số lượng, icon tài khoản. | Hoàn thiện trải nghiệm mua sắm tiêu chuẩn theo Mục 7. |
| **Footer** | Giới thiệu hệ thống | `100% giao dịch có biên bản kiểm định, lưu trữ snapshot giá và bảo hành bất biến vào hệ thống PostgreSQL 18.` | **Rút gọn** | `Mọi cây vợt đều có biên bản kiểm định tình trạng và chính sách bảo hành minh bạch.` | Khách hàng không quan tâm tên cơ sở dữ liệu `PostgreSQL 18`. |
| **Footer** | Bản quyền & Tiêu chuẩn | `Tuân thủ nghiêm ngặt 10 Quy tắc cốt lõi R1-R10 & Kịch bản thực tế K1-K10.` | **Xóa** | `Hệ thống cửa hàng cầu lông chính hãng tại Hà Nội, Đà Nẵng, TP.HCM.` | R1-R10 là đặc tả kỹ thuật kiến trúc backend, không đưa lên giao diện người dùng. |

---

## 2. TRANG CHỦ (`/` - `src/app/page.tsx`)

| Thành phần | Đoạn chữ hiện tại | Đánh giá | Bản mới đề xuất (Quiet Court) | Rationale |
|---|---|---|---|---|
| **Hero Title** | `HỆ THỐNG CẦU LÔNG CHUYÊN NGHIỆP — VỢT CHÍNH HÃNG & SÀN KIỂM ĐỊNH VỢT CŨ ĐỘC LẬP` | **Rút gọn** | `Vợt chính hãng, nhận tại cửa hàng gần bạn.` | Tiêu đề ngắn gọn (dưới 8 từ), tập trung vào giá trị cốt lõi cho người chơi. |
| **Hero Subtitle** | `Phân phối chính hãng Yonex, Victor, Lining. Vợt cũ kiểm định 16 tiêu chí với mã định danh Serial độc bản.` | **Rút gọn** | `Phân phối Yonex, Victor, Li-Ning. Sàn vợt cũ kiểm định độc lập với tình trạng minh bạch từng cây.` | Ngắn gọn, súc tích, câu chữ tự nhiên. |
| **Hero Buttons** | `KHÁM PHÁ VỢT MỚI →` / `XEM SÀN VỢT CŨ (2ND) →` | **Rút gọn** | `Xem vợt mới` / `Vợt cũ đã kiểm định` | Chữ thường, bỏ in hoa toàn bộ và mũi tên thô. |
| **Khối Cam kết** | `ĐẶC QUYỀN SMASH COURT — KIẾN TRÚC VẬN HÀNH BẢO VỆ NGƯỜI DÙNG` | **Rút gọn** | `Cam kết từ Smash Court` | Cắt bỏ cụm từ kỹ thuật \"kiến trúc vận hành\". |
| **Cam kết 1** | `Khóa Giữ Hàng Tức Thì (R1)` / `Đảm bảo tồn kho thật, không bán ảo, không tranh chấp đơn khi mở bán.` | **Rút gọn** | `Giữ chỗ tức thì` / `Tồn kho chuẩn xác theo thời gian thực tại từng chi nhánh.` | Bỏ mã \"(R1)\", viết dưới góc độ lợi ích của người mua. |
| **Cam kết 2** | `Kiểm Định Độc Bản (R2)` / `Vợt cũ được cấp số định danh riêng (Unique Unit), ảnh chụp thực tế từng vết xước.` | **Rút gọn** | `Mỗi cây vợt là một phiên bản` / `Ảnh chụp rõ nét từng chi tiết và vết xước thực tế.` | Bỏ \"(R2)\", bỏ thuật ngữ tiếng Anh \"Unique Unit\". |
| **Cam kết 3** | `VietQR Chống Sai Tiền` / `Tự động sinh mã VietQR NAPAS kèm nội dung chuyển khoản độc nhất.` | **Rút gọn** | `Thanh toán VietQR chính xác` / `Quét mã nhận diện đơn tự động, an toàn và nhanh chóng.` | Câu văn mượt mà, dễ hiểu. |
| **Cam kết 4** | `Snapshot Bất Biến (R9)` / `Lưu trữ thông số kỹ thuật và điều khoản bảo hành tại thời điểm mua hàng.` | **Rút gọn** | `Bảo hành minh bạch` / `Lưu trọn vẹn thông số và điều kiện bảo hành vào ngày bạn nhận vợt.` | Bỏ \"(R9)\", bỏ từ \"bất biến\" mang tính kỹ thuật máy tính. |
| **Tiêu đề Section** | `VỢT CŨ KIỂM ĐỊNH MỚI LÊN SÀN (CHIẾC DUY NHẤT)` | **Rút gọn** | `Vợt cũ vừa lên sàn` | Câu thường, thẻ sản phẩm tự thể hiện \"Chiếc duy nhất\". |
| **Tiêu đề Section** | `BỘ SƯU TẬP VỢT THI ĐẤU CHÍNH HÃNG FLAGSHIP` | **Rút gọn** | `Dòng vợt nổi bật` | Cắt bớt từ đao to búa lớn (\"thi đấu chính hãng flagship\"). |

---

## 3. DANH MỤC VỢT CẦU LÔNG (`/vot-cau-long`)

| Thành phần | Đoạn chữ hiện tại | Đánh giá | Bản mới đề xuất (Quiet Court) | Rationale |
|---|---|---|---|---|
| **Header Banner** | `100% Chính Hãng Phân Phối` (badge xanh) | **Rút gọn** | `Chính hãng phân phối` | Bỏ số 100%, dùng huy hiệu xám nhạt tinh tế. |
| **Hero Title** | `Bộ Sưu Tập Vợt Cầu Lông Đỉnh Cao` | **Rút gọn** | `Vợt cầu lông` | Tiêu đề tối giản, đúng phong cách Quiet Court. |
| **Hero Subtitle** | `Đầy đủ các dòng vợt thi đấu cao cấp nhất từ Yonex, Li-Ning, Victor. Dữ liệu kho thời gian thực kết nối trực tiếp PostgreSQL 18...` | **Rút gọn** | `Các dòng vợt từ Yonex, Li-Ning, Victor với thông số rõ ràng và tồn kho thực tế tại từng chi nhánh.` | Bỏ từ \"đỉnh cao\", \"cao cấp nhất\", bỏ \"kết nối trực tiếp PostgreSQL 18\". |
| **Bộ lọc** | `TẤT CẢ THƯƠNG HIỆU`, `TẤT CẢ LỐI CHƠI` | **Rút gọn** | `Tất cả thương hiệu`, `Tất cả lối chơi` | Chữ thường, không IN HOA. |
| **Thẻ Sản phẩm** | `TẤN CÔNG TOÀN DIỆN`, `CÔNG THỦ TOÀN DIỆN` | **Rút gọn** | `Thiên công`, `Cân bằng`, `Thiên thủ` | Thuật ngữ cầu lông chuẩn xác, ngắn gọn, dễ quét mắt. |
| **Thẻ Sản phẩm** | Nhãn `GIÁ TỪ` | **Rút gọn** | `Từ 3.950.000 ₫` | Gộp gọn vào cùng một dòng giá, dùng chữ thường. |
| **Thẻ Sản phẩm** | Nút `Chi tiết →` | **Rút gọn** | *(Bỏ chữ, toàn bộ thẻ là liên kết; hover hiện nút Xem nhanh)* | Giảm rối mắt cho lưới danh mục. |

---

## 4. CHI TIẾT SẢN PHẨM (`/vot-cau-long/[slug]`)

| Thành phần | Đoạn chữ hiện tại | Đánh giá | Bản mới đề xuất (Quiet Court) | Rationale |
|---|---|---|---|---|
| **Tiêu đề khối** | `THÔNG SỐ KỸ THUẬT THI ĐẤU CHUẨN QUỐC TẾ` | **Rút gọn** | `Thông số kỹ thuật` | Bỏ \"thi đấu chuẩn quốc tế\". |
| **Đặc tả sản phẩm** | `Vũ khí vô địch thế giới của Chen Long với carbon FRTP siêu đàn hồi...` | **Rút gọn** | `Vợt thiên công, thân cứng, đầu nặng, phù hợp người chơi có lực cổ tay tốt.` | Trình bày công năng thực tế thay vì quảng cáo ngôi sao và chất liệu phóng đại. |
| **Cam kết đi kèm** | `ĐÃ BAO GỒM THUẾ VAT` | **Xóa / Đưa vào ghi chú nhỏ** | `(Đã gồm VAT)` hoặc đưa vào chân trang tóm tắt đơn. | Không làm phân tán sự chú ý cạnh mức giá chính. |
| **Chọn phiên bản** | `1. CHỌN PHIÊN BẢN (TRỌNG LƯỢNG & CÁN VỢT)` | **Rút gọn** | `Chọn loại` (kèm pill `3U · G5`, `4U · G5`) | Ngắn gọn, hiện đại, không đánh số thứ tự 1., 2. cứng nhắc. |
| **Chọn chi nhánh** | `2. TỒN KHO THỰC TẾ TẠI CÁC CHI NHÁNH (CHỌN NƠI MUA)` | **Rút gọn** | `Nhận tại cửa hàng` (mỗi chi nhánh 1 dòng kèm trạng thái `Còn 10` hoặc `Hết hàng`) | Bỏ đánh số, giao diện sạch và dễ tương tác. |
| **Nút Mua hàng** | `Hết Hàng Tại Chi Nhánh Đã Chọn` (nút vàng chanh nhạt, chữ mờ) | **Sửa UX & Copy** | `Thêm vào giỏ` / `Hết hàng tại chi nhánh này, chọn chi nhánh khác` | Tự động chọn chi nhánh còn hàng; có nút hướng dẫn nếu chi nhánh được chọn hết hàng. |
| **Bảo hành & Vận chuyển** | Khối text cam kết dài dòng với nhiều icon lòe loẹt | **Rút gọn** | Accordion 4 mục: `Thông số chi tiết`, `Chính sách bảo hành`, `Vận chuyển & Nhận hàng`, `Hướng dẫn chọn cước đan` | Gọn gàng, chỉ mở ra khi khách cần tìm hiểu sâu. |

---

## 5. SÀN VỢT CŨ KIỂM ĐỊNH (`/second-hand`)

| Thành phần | Đoạn chữ hiện tại | Đánh giá | Bản mới đề xuất (Quiet Court) | Rationale |
|---|---|---|---|---|
| **Tiêu đề trang** | `SÀN VỢT CŨ KIỂM ĐỊNH (SECOND-HAND) — ĐỘC QUYỀN HẠNG A/B/C` | **Rút gọn** | `Vợt cũ đã kiểm định` | Bỏ tiếng Anh chêm xen, bỏ chữ \"Độc quyền\". |
| **Mô tả trang** | `Chuyên trang vợt cầu lông cũ chính hãng có kiểm định 16 tiêu chuẩn độc lập... Không bán hàng giả, hàng nứt gãy.` | **Rút gọn** | `Mỗi cây vợt được kiểm tra 16 tiêu chí tại quầy, chụp rõ vết xước và dán tem bảo hành riêng từng chiếc.` | Rõ ràng, tạo sự an tâm mà không cần nhấn mạnh phủ định \"không bán hàng giả\". |
| **Huy hiệu phân hạng** | `HẠNG A (LIKE NEW 98-99%)`, `HẠNG B (90-95%)` | **Rút gọn** | Chip xám nhẹ: `Hạng A · Như mới` / `Hạng B · Xước nhẹ` | Bỏ chữ in hoa, bỏ từ lóng \"Like New\". |
| **Ghi chú nón vợt** | `Mã nón Serial: 260341SP — Duy nhất tại cửa hàng` | **Rút gọn** | `Serial: 260341SP · Chiếc duy nhất` | Chữ thường, màu mực phụ (`--muted`). |
| **Nút Đặt mua** | `ĐẶT MUA CHIẾC NÀY (GIỮ KHO 30 PHÚT) →` | **Rút gọn** | `Đặt mua chiếc này` | Không viết hoa toàn bộ, thông tin giữ kho ghi chú bằng một dòng phụ bên dưới. |

---

## 6. TRA CỨU BẢO HÀNH (`/tra-cuu-bao-hanh`)

| Thành phần | Đoạn chữ hiện tại | Đánh giá | Bản mới đề xuất (Quiet Court) | Rationale |
|---|---|---|---|---|
| **Tiêu đề trang** | `TRA CỨU BẢO HÀNH ĐIỆN TỬ VÀ TIẾN ĐỘ XỬ LÝ KHIẾU NẠI` | **Rút gọn** | `Tra cứu bảo hành` | Tối giản, không dài dòng. |
| **Mô tả bảo mật** | `Hệ thống bảo vệ dữ liệu khách hàng (chống IDOR). Để xem chi tiết hồ sơ...` | **Rút gọn** | `Nhập số điện thoại mua hàng để xem thông tin bảo hành và tiến độ xử lý.` | Giải thích tự nhiên, khách hàng không cần nghe thuật ngữ bảo mật mạng `IDOR`. |
| **Nút hành động** | `TRA CỨU HỒ SƠ NGAY` | **Rút gọn** | `Tra cứu` | Gọn gàng, thân thiện. |
| **Timeline trạng thái** | `1. TIẾP NHẬN` → `2. KIỂM ĐỊNH` → `3. RA QUYẾT ĐỊNH` → `4. HOÀN TẤT` | **Rút gọn** | `Tiếp nhận` → `Kiểm định` → `Xử lý` → `Hoàn tất` | Trình bày dạng timeline dọc trang nhã, câu thường. |

---

## 7. KHU VỰC QUẢN TRỊ NỘI BỘ (`/admin/*`)

| Trang / Module | Thành phần | Đoạn chữ hiện tại | Đánh giá | Bản mới đề xuất (Quiet Court) | Rationale |
|---|---|---|---|---|---|
| **Admin Layout** | Header | `SMASH COURT INTERNAL PORTAL` | **Rút gọn** | `Smash Court Quản trị` | Gọn, loại bỏ tiếng Anh không cần thiết. |
| **Admin Thu mua** | Wizard | `BẮT BUỘC KIỂM TRA ĐỦ 5 TIÊU CHÍ KỸ THUẬT TRƯỚC KHI BÁO GIÁ` | **Rút gọn** | `5 tiêu chí kiểm định kỹ thuật tại quầy` | Bỏ IN HOA và từ ngữ mệnh lệnh quá gắt gao. |
| **Admin Đơn hàng** | Trạng thái | `ĐỐI SOÁT GIAO DỊCH VIETQR KHỚP 100% MỚI DUYỆT PAID` | **Rút gọn** | `Đối soát mã VietQR trước khi xác nhận thanh toán` | Câu chữ nghiệp vụ chuẩn mực, chuyên nghiệp. |
