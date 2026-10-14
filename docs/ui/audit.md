# BÁO CÁO KHẢO SÁT THIẾT KẾ & KHIẾM KHUYẾT HỆ THỐNG (UI AUDIT)

> Tài liệu thuộc **Phase UI-0 (Khảo sát và đường cơ sở)** của quy trình làm mới giao diện theo phong cách **Quiet Court**.  
> Tổng hợp các phát hiện từ hình ảnh thực tế, mã nguồn `frontend/src/app` và đo kiểm đường cơ sở trên trình duyệt Chrome.

---

## 1. MƯỜI MỘT (11) VẤN ĐỀ LỚN NHẤT ĐÃ QUAN SÁT TỪ HIỆN TRẠNG

| # | Vấn đề | Biểu hiện thực tế trên code/màn hình | Mức độ | Hướng xử lý theo Quiet Court |
|---|---|---|---|---|
| **1** | **Header nặng và thiếu chức năng** | Dùng thanh nền xanh đặc `#0F5132`, shadow dày; menu chữ đậm nhỏ; thiếu ô tìm kiếm, icon giỏ hàng, menu tài khoản; nút `Admin Portal →` lộ công khai cho khách hàng. | **P0** | Header sáng/trong suốt (translucent blur), thêm tìm kiếm nhanh ⌘K, giỏ hàng dạng Drawer, icon tài khoản; link quản trị chỉ hiện cho tài khoản có vai trò nhân viên. |
| **2** | **Chữ quá nhỏ (vi phạm khả năng đọc)** | Breadcrumb, mô tả, nhãn thông số, chi nhánh dùng cỡ `text-[10px]` và `text-[11px]` (10–11px), vi phạm tiêu chuẩn hiển thị trên thiết bị di động. | **P0** | Quy định cỡ chữ tối thiểu: nội dung 16px, phụ 14px, chú thích tối thiểu 13px. Tuyệt đối không dùng chữ dưới 13px. Tiêu đề dùng hàm `clamp()`. |
| **3** | **Lạm dụng In đậm, IN HOA & Title Case** | 100% component ngập tràn `font-black`, `font-bold`, `uppercase` (\"1. CHỌN PHIÊN BẢN (TRỌNG LƯỢNG & CÁN VỢT)\", \"Hết Hàng Tại Chi Nhánh Đã Chọn\"). | **P0** | Chuyển toàn bộ sang câu thường tiếng Việt (sentence case). Trọng số: 400 cho nội dung, 500 cho tiêu đề/giá/nhấn mạnh. Cấm trọng số 600–900 ở storefront. Phân cấp bằng khoảng trắng, kích thước và `tracking-tight`. |
| **4** | **Quá nhiều màu sắc lộn xộn** | Pha trộn vô tội vạ xanh sân `#0F5132`, xanh chanh `#C8F31D`, xanh lá `emerald-800`, cam `#FF6B2C`, nền `#F7F7F2`; giá đổi màu xanh; nút disabled vàng chanh. | **P1** | Rút gọn về hệ token Quiet Court: Chữ chỉ dùng `--ink` và `--muted`. Nút chính nền `--ink` chữ `--bg`. Nền trang `--bg: #F5F4F0`. Màu `--brand` chỉ làm điểm nhấn nhỏ; `--accent` tối đa 1 chỗ/màn hình; `--sale` chỉ cho giá giảm. |
| **5** | **Thẻ lồng thẻ (Card nesting)** | Khung trang bao khung ảnh, khung ảnh bao khung thông số, từng chi nhánh lại có khung viền riêng `border border-stone-200` tạo cảm giác chật chội, tù túng. | **P1** | Thiết kế phẳng một mức bề mặt: Bỏ hầu hết các đường viền dày, phân nhóm thông tin bằng khoảng trắng rộng (padding 80–120px desktop, 48–64px mobile) và đường kẻ mảnh 1px màu `--line`. |
| **6** | **Nội dung sáo rỗng & Lộ chi tiết kỹ thuật** | Xuất hiện các cụm từ sáo rỗng (\"Chuẩn Quốc Tế\", \"Vũ khí vô địch thế giới... siêu đàn hồi\"); lộ mã quy tắc nội bộ R1-R10, tên database PostgreSQL 18 và mã SKU monospace cho khách mua hàng. | **P1** | Rà soát và làm sạch bằng `copy-audit.md`: viết câu chữ mộc mạc, chân thực, tập trung vào công năng vợt; xóa toàn bộ chi tiết kỹ thuật khỏi storefront. |
| **7** | **Lỗi UX nghiêm trọng ở tồn kho chi nhánh** | Chi nhánh đầu tiên theo thứ tự mã (`BR_DN_01` Hải Châu) tình cờ hết hàng khiến nút mua bị khóa (`disabled`) ngay khi vừa mở trang chi tiết vợt, dù Quận 1 còn 10 cây. | **P0** | Tự động chọn chi nhánh còn hàng gần nhất; hiển thị mờ các chi nhánh hết hàng kèm thông báo trực quan, tránh gây hiểu lầm cho người mua. |
| **8** | **Ảnh sản phẩm thô & Tải nặng** | Dùng thẻ `<img>` truyền thống tải trực tiếp file PNG dung lượng lớn (1.5MB – 5.7MB), không tối ưu WebP/AVIF, không có blur placeholder, ảnh nền trắng đặt trên nền kem tạo vệt vuông xấu. | **P1** | Chuyển sang `next/image` với blur placeholder, kích thước cố định, sử dụng `mix-blend-mode: multiply` để hòa tiệp nền trắng của ảnh vào nền trung tính ấm của trang web. |
| **9** | **Nút CTA khó đọc & Trạng thái yếu** | Nút mua hàng trạng thái disabled dùng nền vàng chanh nhạt `#C8F31D` với chữ mờ, độ tương phản cực thấp (vi phạm nặng chuẩn WCAG AA). | **P0** | Thiết kế đầy đủ 5 trạng thái cho nút: default, hover, active (nhấn co 0.98), loading (spinner tinh gọn), disabled (nền xám nhạt, tương phản đạt chuẩn WCAG AA). |
| **10** | **Thiết kế phẳng, thiếu cảm xúc thể thao** | Toàn bộ giao diện tĩnh hoàn toàn, không có vi hiệu ứng tương tác, thiếu khoảnh khắc đặc trưng gợi cú smash/đường cầu lông. | **P2** | Bổ sung chuyển động có chủ đích bằng `motion`: hero chữ vào trượt nhẹ 8-16px, thẻ sản phẩm hover phóng 1.03, vòng chọn loại trượt `layoutId`, tôn trọng `prefers-reduced-motion`. |
| **11** | **Lẫn lộn ngôn ngữ Anh – Việt** | Xuất hiện các chuỗi lai tạp: \"Admin Portal\", \"Vợt Kiểm Định (2nd)\", \"Like New 98-99%\", \"Unique Unit\". | **P1** | Thống nhất tiếng Việt tự nhiên và chuẩn mực trên toàn hệ thống: \"Smash Court Quản trị\", \"Vợt cũ đã kiểm định\", \"Hạng A · Như mới\". |

---

## 2. CÁC PHÁT HIỆN THÊM NGOÀI MỤC 2 (RÀ SOÁT THEO MỤC 8)

| # | Hạng mục phát hiện | Chi tiết khiếm khuyết | Hướng khắc phục |
|---|---|---|---|
| **12** | **Thiếu Favicon & Open Graph Image** | File `favicon.ico` chưa có icon cầu lông đặc trưng; thiếu ảnh `og:image` kích thước chuẩn `1200x630` cho việc chia sẻ mạng xã hội. | Thiết kế icon vợt/quả cầu SVG tối giản làm favicon và tạo Open Graph image mang phong cách Quiet Court. |
| **13** | **Thiếu file `sitemap.ts` & `robots.ts`** | Chưa có dynamic sitemap tự động lấy slug từ `catalog_db` và `secondhand_db` để phục vụ SEO. | Bổ sung `src/app/sitemap.ts` và `src/app/robots.ts` đúng chuẩn App Router của Next.js. |
| **14** | **Bộ lọc danh mục chưa đồng bộ URL** | Bộ lọc thương hiệu và lối chơi ở `/vot-cau-long` chỉ lưu trong React state cục bộ, khi reload trang hoặc chia sẻ link bị mất trạng thái. | Tích hợp thư viện `nuqs` để đồng bộ bộ lọc vào search params (`?brand=...&playstyle=...`), hỗ trợ bookmark và SEO. |
| **15** | **Hoàn toàn chưa hỗ trợ Chế độ Tối (Dark Mode)** | File `globals.css` chỉ khai báo biến màu sáng, không có class `.dark` hay media query `prefers-color-scheme`. | Thiết lập `next-themes` và định nghĩa bộ token tối: nền đen xanh `--bg: #0B0F0D`, bề mặt `--surface: #141A17`, chữ `--ink: #F5F4F0`. |
| **16** | **Chưa tích hợp phông chữ chuẩn tiếng Việt** | Chưa khai báo phông qua `next/font/google`, đang phụ thuộc vào phông sans hệ thống (dễ lỗi dấu tiếng Việt khi hiển thị Ặ, Ữ, Ợ, Ẩ, Ễ, Ỳ, Đ, đ). | Cấu hình `Be Vietnam Pro` qua `next/font/google` với `subsets: ['vietnamese', 'latin']`, `display: 'swap'`. |
| **17** | **Thông báo Toast & Modal thô sơ** | Một số hành động trong Admin dùng `window.alert()` hoặc `window.prompt()` làm chặn luồng thực thi của trình duyệt. | Thay thế 100% bằng thư viện `sonner` với thông báo toast có animation mượt mà và hỗ trợ ARIA `aria-live`. |
| **18** | **Mã CSS cứng (Hardcoded classes)** | Hàng chục nơi dùng mã màu trực tiếp như `bg-[#0F5132]`, `text-[#C8F31D]`, `bg-[#F7F7F2]` thay vì dùng CSS variables hoặc Tailwind theme tokens. | Quy chuẩn toàn bộ về biến token Quiet Court trong Tailwind v4 `@theme`. |

---

## 3. BẢNG KIỂM TRA ĐƯỜNG CƠ SỞ HIỆU NĂNG & KÍCH THƯỚC BUNDLE (BASELINE)

### 3.1 Kích thước mã nguồn & Bundle Turbopack (Ghi nhận trước khi tối ưu)
- **Cấu hình**: Next.js 16.4.0, Turbopack, App Router, React 19.
- **Trang chủ (`/`)**: Render động theo thời gian thực (Zero-Mock từ `secondhand_db` và `catalog_db`).
- **Trang danh mục (`/vot-cau-long`)**: Render động kết hợp Client Component bộ lọc.
- **Trang chi tiết (`/vot-cau-long/[slug]`)**: Render động kết hợp Client Component đặt hàng `OrderSection.tsx`.

### 3.2 Mục tiêu chỉ số hiệu năng (Core Web Vitals) đặt ra cho các Phase sau:
- **LCP (Largest Contentful Paint)**: < 2.5 giây (Di động 4G / CPU throttled).
- **CLS (Cumulative Layout Shift)**: < 0.1 (Không giật nhảy bố cục khi nạp ảnh và font).
- **INP (Interaction to Next Paint)**: < 200 ms (Phản hồi tức thì khi click chọn phiên bản, mở drawer giỏ hàng).
- **Lighthouse Điểm số**:
  - SEO ≥ 90 (Giữ vững chuẩn SEO kỹ thuật).
  - Accessibility ≥ 95 (Đạt WCAG AA toàn diện).
  - Performance ≥ 85 (Trên thiết bị di động).
