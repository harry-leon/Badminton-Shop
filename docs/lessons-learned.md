# Báo Cáo Retrospective Kỹ Thuật & Bài Học Kinh Nghiệm Frontend

---

## 1. Tóm tắt (Executive Summary)
Dự án **Badminton Shop (Smash Court)** là hệ thống bán lẻ và kiểm định vợt cầu lông đa chi nhánh, gồm frontend Next.js 16 và backend Spring Boot 3.3.4 (Modular Monolith). Quá trình khảo sát thực tế và phân tích bằng chứng cho thấy 5 bài học then chốt:
1. **Lệch hợp đồng xác thực nghiêm trọng**: Frontend đọc sai tên trường của Backend (`data.token` vs `accessToken`, `data.userInfo` vs `user`), khiến luồng đăng nhập qua backend vô hiệu hóa toàn bộ quyền Admin/Staff và ép về Customer dự phòng.
2. **Kiến trúc phân tầng bị phá vỡ**: Thay vì gọi Backend REST API, frontend tự kết nối trực tiếp PostgreSQL, tự điều phối transaction phân tán qua 3 database không có 2PC/Saga, và tự chạy lệnh DDL `ALTER TABLE` tại runtime.
3. **Bảo mật token và phân quyền từng có lỗ hổng lớn**: Từng tồn tại lỗi Epoch 0 bỏ qua hết hạn token (`exp: 0`), fallback quyền nguy hiểm (`|| 'ADMIN'`), và secret dự phòng bị hardcode trong source code.
4. **Lỗi logic lặp lại diện rộng**: Lỗi gán mặc định còn hàng ở cả 3 chi nhánh (`stockByProduct[p.id] || [...]`) chỉ được sửa ở 1 trang vợt cầu lông và bị bỏ quên trên 8 trang danh mục khác.
5. **Đứt gãy công cụ và tài liệu**: Script `npm test` hỏng ngay khi chạy do sai đường dẫn (`test/` vs `tests/unit/`), tài liệu kiến trúc cũ mô tả sai lệch hoàn toàn tech stack (Axios, STOMP WebSocket, Zustand không hề tồn tại trong code).

---

## 2. Hồ Sơ Dự Án (Project Profile)

### 2.1. Danh mục Chi Tiết Toàn Bộ Công Cụ, Thư Viện & Framework Frontend (30 Công Cụ)

| STT | Công cụ / Package | Phiên bản (Lockfile) | Nhóm chức năng | Mục đích sử dụng cụ thể trong dự án | File & Dòng minh chứng | Đánh giá kiến trúc & Rủi ro |
|:---:|:---|:---:|:---|:---|:---|:---|
| 1 | `next` | `16.4.2` | Core App Router | Fullstack Framework, React Server Components, Route Handlers, Edge Middleware | `frontend/src/middleware.ts:1`, `app/(storefront)/page.tsx:1` | Nền tảng chính; cấu hình `serverExternalPackages: ['pg-cloudflare']` |
| 2 | `react` / `react-dom` | `19.3.0` | Core UI Library | Quản lý DOM ảo, Server Actions, React Context (`AdminContext`, `CartContext`) | `frontend/src/lib/admin-context.tsx:3`, `cart-context.tsx:3` | Bản React 19 mới nhất, tương thích tốt với Radix UI và Server Components |
| 3 | `typescript` | `5.8.0` | Language & Types | Kiểm tra kiểu tĩnh (`tsc --noEmit`), định nghĩa interface DTO sản phẩm, giỏ hàng, người dùng | `frontend/src/types/index.ts:1-65`, `package.json:10` | Chạy 0 lỗi; tuy nhiên thiếu OpenAPI codegen dẫn đến lệch tên trường với Backend (L03) |
| 4 | `tailwindcss` | `4.0.0` | Styling Engine | Styling tiện ích CSS-first theo triết lý Quiet Court, custom dark-variant | `frontend/src/app/globals.css:1-25`, `postcss.config.mjs` | Tailwind v4 dùng `@theme`; từng lỗi dark mode do thiếu `@custom-variant` (L18) |
| 5 | `@radix-ui/react-dialog` | `^1.3.1` | Headless Primitive | Modal liên hệ email, dialog xem ảnh phóng to, dialog xác nhận | `frontend/src/components/EmailContactModal.tsx:1-80` | Chuẩn WCAG AA, không ép buộc style, hỗ trợ focus trap hoàn hảo |
| 6 | `@radix-ui/react-accordion` | `^1.3.1` | Headless Primitive | Bảng thông số kỹ thuật vợt có thể thu gọn/mở rộng, mục giải đáp FAQ | `frontend/src/app/(storefront)/vot-cau-long/[slug]/components/ProductSpecsTable.tsx` | Nhẹ, tree-shakeable, điều khiển bàn phím chuẩn a11y |
| 7 | `@radix-ui/react-dropdown-menu` | `^2.2.1` | Headless Primitive | Dropdown menu danh mục sản phẩm và menu quản lý tài khoản trên thanh Header | `frontend/src/components/Header.tsx:10-180` | Đạt chuẩn ARIA, hỗ trợ định vị popover tự động |
| 8 | `@radix-ui/react-select` | `^2.4.1` | Headless Primitive | Dropdown bộ chọn chi nhánh và bộ lọc danh mục trong Admin Portal | `frontend/src/app/portal/branches/page.tsx`, `Header.tsx` | Thay thế select gốc HTML, tùy biến giao diện Quiet Court mượt mà |
| 9 | `@radix-ui/react-slot` | `^1.5.0` | Headless Primitive | Hỗ trợ tính đa hình (polymorphic component) cho Button qua thuộc tính `asChild` | `frontend/src/components/ui/Button.tsx:3-12` | Cho phép lồng thẻ `<Link>` của Next.js vào `<Button>` mà không vỡ HTML |
| 10 | `@radix-ui/react-tooltip` | `^1.4.1` | Headless Primitive | Hiển thị giải nghĩa các thông số kỹ thuật vợt (3U/4U, điểm cân bằng, độ căng cước) | `frontend/src/app/(storefront)/vot-cau-long/[slug]/components/ProductSpecsTable.tsx` | Hỗ trợ hover và focus qua phím, có delay chống nhấp nháy |
| 11 | `class-variance-authority` (`cva`) | `0.7.1` | Design System Helper | Quản lý các biến thể (variants: default, secondary, outline, destructive) của Button, Badge | `frontend/src/components/ui/Button.tsx:5-28`, `Badge.tsx:4-22` | Chuẩn hóa UI token, tránh viết class điều kiện lặp lại |
| 12 | `clsx` & `tailwind-merge` | `2.1.1` / `3.0.0` | CSS Utility | Hợp nhất class động và tự động khử xung đột thuộc tính Tailwind (ví dụ `p-2` vs `p-4`) | `frontend/src/components/ui/Button.tsx:2-4` | Kích thước cực nhẹ (~1KB), chuẩn mực cho hệ thống Shadcn/UI primitives |
| 13 | `motion` | `12.4.7` | Animation & Motion | Quản lý hiệu ứng mở Drawer, spring physics, chuyển tab sản phẩm, hiệu ứng hover | `frontend/src/components/CartDrawer.tsx:1-120` | Hỗ trợ `reducedMotion="user"`, tôn trọng cấu hình tắt chuyển động của OS |
| 14 | `next-themes` | `0.4.6` | Theme Management | Chuyển đổi Dark / Light mode, lưu preference vào localStorage, chống FOUC | `frontend/src/components/ThemeProvider.tsx:1-15` | Đồng bộ theme mượt mà với class `.dark` trên thẻ `<html>` |
| 15 | `sonner` | `2.0.1` | Toast Notification | Thông báo trạng thái giao dịch, cập nhật giỏ hàng, thông báo lỗi có ARIA live region | `frontend/src/app/layout.tsx:28`, `frontend/src/lib/admin-context.tsx:4` | Thay thế hoàn toàn alert(); hỗ trợ xếp chồng toast thanh lịch |
| 16 | `vaul` | `1.1.2` | Mobile Sheet | Drawer vuốt đáy màn hình chuẩn iOS cho Giỏ hàng và Bộ lọc sản phẩm trên mobile | `frontend/src/components/CartDrawer.tsx:1-150` | Trải nghiệm vuốt chạm mượt mà trên thiết bị di động |
| 17 | `cmdk` | `1.0.4` | Command Palette | Hộp thoại tìm kiếm thông minh nhanh qua phím tắt ⌘K / Ctrl+K | `frontend/src/components/CommandSearch.tsx:1-120` | Tối ưu trải nghiệm tra cứu sản phẩm, mã bảo hành và đơn hàng |
| 18 | `nuqs` | `2.4.0` | URL State Manager | Quản lý trạng thái bộ lọc danh mục (`?brand=...&playstyle=...`) đồng bộ với URL | `frontend/src/app/(storefront)/vot-cau-long/ProductCatalogGrid.tsx` | Type-safe URL query params, hỗ trợ bookmark và tối ưu hóa SEO |
| 19 | `@number-flow/react` | `0.5.5` | Data Presentation | Hiệu ứng chuyển động số mượt mà khi thay đổi giá biến thể SKU hoặc giỏ hàng | `frontend/src/components/ui/PriceTag.tsx:1-40` | Tăng tính thẩm mỹ cao cấp cho giá trị tiền tệ |
| 20 | `embla-carousel-react` | `8.5.2` | Carousel / Slider | Slider banner trang chủ và thư viện ảnh sản phẩm mobile có hỗ trợ touch swipe | `frontend/src/components/HeroBannerCarousel.tsx`, `ProductGallery.tsx` | Carousel nhẹ nhất hiện nay (~7KB), không ép style, không phụ thuộc ngoài |
| 21 | `yet-another-react-lightbox` | `3.21.7` | Media Viewer | Phóng to soi chi tiết vết xước và số serial trên nón vợt cũ kiểm định | `frontend/src/app/(storefront)/second-hand/[id]/SecondhandGallery.tsx` | Lazy loaded, hỗ trợ zoom đa điểm và phím điều hướng |
| 22 | `canvas-confetti` | `1.9.4` | Micro-interaction | Hiệu ứng pháo hoa ăn mừng khi khách đặt hàng thành công tại trang checkout | `frontend/src/app/(storefront)/checkout/page.tsx:20-25` | Tự động tắt khi người dùng bật `prefers-reduced-motion` |
| 23 | `lucide-react` | `1.16.0` | Iconography | Bộ icon vector thể thao, điều hướng, trạng thái đơn hàng | `frontend/src/components/Header.tsx`, `Footer.tsx` | Tree-shakeable, icon sắc nét, đồng bộ phong cách Quiet Court |
| 24 | `pg` / `@types/pg` | `8.23.1` | Database Driver | Kết nối trực tiếp 6 schema PostgreSQL (`identity_db`, `catalog_db`, `order_db`, etc.) | `frontend/src/lib/db.ts:1-63` | [RỦI RO KIẾN TRÚC] Bỏ qua tầng backend; tự tạo pool trong serverless function |
| 25 | `pg-cloudflare` | `1.4.1` | Edge Socket Adapter | Socket shim hỗ trợ driver `pg` chạy được trên môi trường Cloudflare Workers | `frontend/next.config.mjs:35`, `wrangler.jsonc:12` | Bắt buộc khai báo trong `serverExternalPackages` và `alias` của Wrangler |
| 26 | `bcryptjs` / `@types/bcryptjs` | `3.0.3` | Crypto / Auth | Băm mật khẩu (BCrypt 10 rounds) và đối soát trực tiếp mã băm trong database | `frontend/src/lib/auth.ts:2, 76, 87` | Thuần JavaScript, chạy an toàn trên Edge runtime không cần Node C++ binding |
| 27 | `winston` / `@types/winston` | `3.19.0` | Observability | Ghi nhật ký kiểm toán (Audit Trail) có cấu trúc cho sự kiện đăng nhập, đổi mật khẩu | `frontend/src/lib/logger.ts:1-50` | Hỗ trợ log format JSON, phục vụ giám sát và điều tra bảo mật |
| 28 | `jpeg-js` & `pngjs` | `0.4.4` / `7.0.0` | Image Processing | Đọc và kiểm tra buffer metadata, kích thước ảnh khi tải ảnh lên ImageKit CDN | `frontend/src/lib/imagekit.ts:1-40` | Phân tích ảnh nhị phân phía máy chủ trước khi forward sang CDN |
| 29 | `@opennextjs/cloudflare` | `1.20.12` | Build Adapter | Biên dịch ứng dụng Next.js App Router thành định dạng tương thích Cloudflare Workers | `frontend/open-next.config.ts:1-7`, `package.json:7` | Biến Next.js thành worker script, yêu cầu cấu hình `compatibility_flags` |
| 30 | `wrangler` | `4.151.1` | Edge CLI / Tooling | Công cụ dòng lệnh đóng gói, giả lập môi trường Edge và deploy lên Cloudflare Workers | `frontend/wrangler.jsonc:1-18`, `package.json:13` | Cấu hình assets binding, alias module `pg-cloudflare` và observability |


### 2.2. Nguồn dữ liệu đã khảo sát
- Mã nguồn frontend: `frontend/src/app/`, `frontend/src/components/`, `frontend/src/lib/`, `frontend/src/types/`, `frontend/src/middleware.ts`.
- Mã nguồn backend: `backend/src/main/java/com/badminton/` (`api/`, `dto/`, `application/`, `domain/`, `response/`).
- Cấu hình & Manifest: `frontend/package.json`, `frontend/package-lock.json`, `package.json`, `backend/pom.xml`, `pom.xml`, `frontend/next.config.mjs`, `frontend/wrangler.jsonc`, `frontend/.env.example`.
- Tài liệu kỹ thuật & ADR: `docs/adr/0001-architecture-and-stack.md`, `0002-ui-libraries-selection.md`, `docs/rbac-matrix.md`, `docs/ui/claims-to-confirm.md`.
- Lịch sử Git & Agent: 19 commit git từ `4468f7a` đến `6e5e3fd`, nhật ký `.agents/teamwork/worker_m*/handoff.md`.
- Kiểm tra tự động: `npm run lint` (`tsc --noEmit`), `npm run lint:design`, `node tests/unit/test-suite.js`.

### 2.3. Nguồn không có trong dự án
- Không có thư viện `axios`, `@stomp/stompjs`, `sockjs-client`, `zustand`, `pinia` (chỉ xuất hiện trong tài liệu cũ).
- Không có WebSocket server hoặc hook kết nối realtime trong toàn bộ source code.
- Không có thư mục `services/` (dự án đã chuyển từ microservices sang monolith trong thư mục `backend/`).
- Không có thư mục `test/` ở root (thư mục thực tế mang tên `tests/`).

---

## 3. Bảng Bài Học Xếp Theo Mức Độ

| ID | Danh mục | Mức độ | Trạng thái | Tóm tắt |
|:---|:---|:---:|:---:|:---|
| **L01** | `security` | Nghiêm trọng | Đã xảy ra | Lỗ hổng IDOR và lộ thông tin cá nhân trong Tra cứu Bảo hành |
| **L02** | `security` | Nghiêm trọng | Đã xảy ra | Lỗ hổng Insecure Role Fallback (`\|\| 'ADMIN'`) chiếm quyền quản trị |
| **L03** | `api-contract` | Nghiêm trọng | Đã xảy ra | Lệch tên trường xác thực giữa Backend (`accessToken`) và Frontend (`token`) |
| **L04** | `security` | Cao | Đã xảy ra | Lỗ hổng Epoch 0 (`exp: 0`) bỏ qua kiểm tra hết hạn session token |
| **L05** | `security` | Cao | Đã xảy ra | Secret mặc định hardcode và bất nhất biến môi trường giữa Auth và Middleware |
| **L06** | `architecture` | Nghiêm trọng | RỦI RO CHƯA XẢY RA | Frontend tự điều phối Transaction qua 3 database không có cơ chế 2PC/Saga |
| **L07** | `architecture` | Cao | Đã xảy ra | Route handler tự ý chạy lệnh DDL `ALTER TABLE` tại runtime |
| **L08** | `auth-token` | Cao | Đã xảy ra | Frontend tự đúc JWT mạo danh Authorization Server để gọi Backend |
| **L09** | `state-data-fetching` | Cao | Đã xảy ra | Fallback tồn kho giả định còn hàng ở cả 3 chi nhánh trên 8 trang danh mục |
| **L10** | `data-isolation` | Cao | Đã xảy ra | Lỗi cú pháp SQL cross-join giữa hai database dịch vụ riêng biệt |
| **L11** | `tooling-ci` | Trung bình | Đã xảy ra | Sai đường dẫn thư mục kịch bản kiểm thử trong `package.json` (`test` vs `tests`) |
| **L12** | `testing` | Trung bình | Đã xảy ra | Drift giữa Master Test Suite và các chốt chặn xác thực Middleware mới |
| **L13** | `conventions` | Trung bình | Đã xảy ra | Vi phạm quy chuẩn thiết kế Quiet Court diện rộng (768 lỗi linter) |
| **L14** | `conventions` | Trung bình | Đã xảy ra | Bất nhất dữ liệu địa chỉ chi nhánh giữa Footer, Admin Context và Database |
| **L15** | `security` | Trung bình | Đã xảy ra | Tắt xác thực chứng chỉ SSL `rejectUnauthorized: false` trong kết nối PostgreSQL |
| **L16** | `process` | Cao | Đã xảy ra | Drift tài liệu kiến trúc: Tài liệu mô tả Axios, STOMP, Zustand nhưng code không dùng |
| **L17** | `process` | Trung bình | Đã xảy ra | Drift phiên bản Spring Boot giữa ADR 0001 (ghi 4.1.x) và thực tế pom.xml (3.3.4) |
| **L18** | `styling` | Thấp | Đã xảy ra | Lỗi Dark Mode loang màu do thiếu selector `@custom-variant` trên Tailwind v4 |
| **L19** | `routing` | Trung bình | Đã xảy ra | HTTP 404 trong Racket Quiz do giới thiệu slug sản phẩm không có thật trong catalog |
| **L20** | `performance` | Cao | RỦI RO CHƯA XẢY RA | Nguy cơ cạn kiệt Connection Pool PostgreSQL trên Cloudflare Workers Edge |
| **L21** | `security` | Thấp | RỦI RO CHƯA XẢY RA | Cấu hình Wildcard `remotePatterns` mở toàn bộ domain cho Next.js Image |
| **L22** | `realtime` | Cao | RỦI RO CHƯA XẢY RA | Kênh WebSocket quyền hạn `queue/permissions` hoàn toàn không tồn tại trong code |
| **L23** | `api-contract` | Cao | RỦI RO CHƯA XẢY RA | Backend cấu hình `@JsonInclude(NON_NULL)` làm mất trường `data` null |
| **L24** | `auth-token` | Cao | Tốt cần giữ | Không lưu Token trong LocalStorage, sử dụng Cookie httpOnly an toàn |
| **L25** | `permissions-ui` | Cao | Tốt cần giữ | Phân quyền xác thực cưỡng chế tại Server Route và Edge Middleware |
| **L26** | `concurrency` | Cao | Tốt cần giữ | Áp dụng Idempotency-Key và kiểm tra giao dịch kép chống trừ đúp tồn kho |
| **L27** | `audit-trail` | Cao | Tốt cần giữ | Nhật ký kiểm toán toàn diện cho mọi hành động đăng nhập và quản trị |

---

## 4. Chi Tiết Từng Bài Học Kinh Nghiệm

### L01: Lỗ hổng IDOR và lộ thông tin cá nhân trong Tra cứu Bảo hành
- **Triệu chứng**: Người dùng có thể tra cứu đơn hàng và dữ liệu bảo hành chỉ bằng mã đơn, dẫn đến khả năng đoán mã tuần tự để đọc thông tin khách hàng khác.
- **Bằng chứng**: `frontend/src/app/api/warranty/lookup/route.ts:58-95` được vá tại commit `216845e7b`; kiểm chứng tại `tests/unit/challenger-m4-c1-security.js:308`.
- **Nguyên nhân gốc [Xác nhận]**: Thiết kế ban đầu coi `order_code` là định danh công khai và không yêu cầu yếu tố xác thực kép (số điện thoại mua hàng) từ người tra cứu.
- **Hậu quả**: Vi phạm nghiêm trọng quyền riêng tư (PII Leakage), vi phạm luật bảo vệ dữ liệu cá nhân.
- **Quy tắc phòng ngừa**: TUYỆT ĐỐI KHÔNG cung cấp API tra cứu công khai bằng một trường định danh đơn lẻ; BẮT BUỘC xác thực bằng cặp thông tin bí mật kết hợp (ví dụ: `order_code` + `phone_number` hoặc `serial_number`).
- **Cách phát hiện tự động**: Viết adversarial integration test gửi request chỉ có `order_code` và assert kết quả phải trả về HTTP 400/403.
- **Skill liên quan**: `backend-architecture-monolith`, `security-audit`.

### L02: Lỗ hổng Insecure Role Fallback (`|| 'ADMIN'`) chiếm quyền quản trị
- **Triệu chứng**: Route handler quản trị tự động cấp quyền Admin hoặc Staff cho request nếu không trích xuất được phiên đăng nhập.
- **Bằng chứng**: Commit `5d8273ecf9` ghi nhận: *"Eliminate insecure fallback (|| 'ADMIN', || 'STAFF') across all admin API route handlers"*. Từng xuất hiện tại `frontend/src/app/api/admin/inventory/route.ts:15`, `orders/route.ts:18`, `secondhand/route.ts:22`.
- **Nguyên nhân gốc [Xác nhận]**: Lập trình viên sử dụng giá trị mặc định để "tiện cho việc test cục bộ", quên gỡ bỏ trước khi đưa lên production.
- **Hậu quả**: Bất kỳ người dùng nào gửi payload mang `{ "role": "ADMIN" }` đều có thể bypass toàn bộ kiểm tra bảo mật.
- **Quy tắc phòng ngừa**: NGHIÊM CẤM sử dụng toán tử gán mặc định quyền hạn (`|| 'ADMIN'`) trong code xử lý phân quyền; BẮT BUỘC từ chối HTTP 401/403 ngay lập tức nếu danh tính không hợp lệ.
- **Cách phát hiện tự động**: Bổ sung ESLint rule cấm regex `\|\|\s*['"]ADMIN['"]` hoặc test unauthenticated request vào `/api/admin/*` phải trả về 401.
- **Skill liên quan**: `backend-architecture-monolith`, `code-review`.

### L03: Lệch tên trường xác thực giữa Backend và Frontend Login Handler
- **Triệu chứng**: Đăng nhập bằng tài khoản Quản trị viên thành công ở tầng Spring Boot nhưng trên giao diện người dùng chỉ có quyền Khách hàng (`CUSTOMER`).
- **Bằng chứng**: `backend/src/main/java/com/badminton/identity/api/dto/AuthResponse.java:7, 10` khai báo `String accessToken` và `UserInfo user`. Trong khi `frontend/src/app/api/auth/login/route.ts:35, 44` lại truy xuất:
  ```ts
  const userInfo = backendData.data?.userInfo || { ... role: 'CUSTOMER' };
  const token = backendData.data?.token || signSessionToken(userInfo);
  ```
- **Nguyên nhân gốc [Xác nhận]**: Không có hợp đồng Schema tự động đồng bộ (OpenAPI/Swagger Codegen) giữa Backend và Frontend; lập trình viên frontend tự đoán tên trường JSON.
- **Hậu quả**: Frontend luôn rơi vào fallback, tự sinh token phiên giả mạo, người dùng không thể thực hiện thao tác quản trị.
- **Quy tắc phòng ngừa**: MỌI lời gọi API kết nối giữa các dịch vụ PHẢI chia sẻ chung TypeScript types được sinh tự động từ OpenAPI schema của Backend.
- **Cách phát hiện tự động**: Chạy TypeScript type-checking kết hợp với công cụ kiểm tra hợp đồng `openapi-typescript` trong pipeline CI.
- **Skill liên quan**: `api-contract`, `type-safety`.

### L04: Lỗ hổng Epoch 0 (`exp: 0`) bỏ qua kiểm tra hết hạn session token
- **Triệu chứng**: Token hết hạn được truyền số `0` ở trường `exp` nhưng vẫn được hệ thống chấp nhận là token hợp lệ.
- **Bằng chứng**: `tests/unit/challenger-m4-c1-security.js:293` ghi: *"EMPIRICAL BUG CONFIRMED: Token with exp: 0 evaluates to falsy in `if (data.exp && data.exp < Date.now())` and bypasses expiration"*. Đã sửa tại `frontend/src/lib/auth.ts:63` và `frontend/src/middleware.ts:47`.
- **Nguyên nhân gốc [Xác nhận]**: Lập trình viên kiểm tra sự tồn tại của trường số bằng phép thử truthy/falsy trong JavaScript (`if (data.exp ...)`). Vì `0` là falsy, điều kiện kiểm tra hết hạn bị bỏ qua.
- **Hậu quả**: Kẻ tấn công có thể tạo token vĩnh cửu không bao giờ hết hạn nếu chèn `exp: 0`.
- **Quy tắc phòng ngừa**: KIỂM TRA số nguyên và timestamp PHẢI so sánh tường minh với `undefined` và `null` (`data.exp !== undefined && data.exp !== null`), không dùng truthy check.
- **Cách phát hiện tự động**: Unit test bắt buộc kịch bản boundary testing với `exp: 0`, `exp: -1`, `exp: NaN`.
- **Skill liên quan**: `security`, `testing`.

### L05: Secret mặc định hardcode và bất nhất biến môi trường giữa Auth và Middleware
- **Triệu chứng**: Khi không cấu hình biến môi trường `SESSION_SECRET`, hệ thống đăng nhập thành công nhưng toàn bộ các trang nội bộ đều đá văng người dùng ra trang đăng nhập (HTTP 302).
- **Bằng chứng**: `frontend/src/lib/auth.ts:20` khai báo:
  `const SESSION_SECRET = process.env.SESSION_SECRET || '[ĐÃ CHE: secret hardcode tại frontend/src/lib/auth.ts:20]';`  
  nhưng `frontend/src/middleware.ts:4` lại khai báo:  
  `const SESSION_SECRET = process.env.SESSION_SECRET || '';`
- **Nguyên nhân gốc [Xác nhận]**: Một file dùng secret dự phòng hardcode, file kia lại để chuỗi rỗng; cấu hình không được tập trung tại một module config duy nhất.
- **Hậu quả**: Chữ ký HMAC của session token được tạo bằng secret hardcode nhưng middleware xác thực bằng chuỗi rỗng nên luôn trả về `valid: false`.
- **Quy tắc phòng ngừa**: TẬP TRUNG TOÀN BỘ biến môi trường vào một file cấu hình duy nhất (`env.ts`) có thẩm định schema (Zod); NGHIÊM CẤM hardcode secret dự phòng trong source.
- **Cách phát hiện tự động**: ESLint rule cấm truy cập trực tiếp `process.env` ngoài module `env.ts`.
- **Skill liên quan**: `security`, `architecture`.

### L06: Frontend Next.js tự điều phối Transaction phân tán qua 3 database không có 2PC/Saga
- **Triệu chứng**: Xử lý checkout trên serverless function có nguy cơ trừ tồn kho nhưng không tạo được đơn hàng nếu function bị kill giữa chừng.
- **Bằng chứng**: `frontend/src/app/api/checkout/route.ts:196-416` truy vấn tuần tự `secondhand_db`, `inventory_db`, `order_db`, và tự rollback thủ công trong khối `catch` (dòng 380-416).
- **Nguyên nhân gốc [Xác nhận]**: Frontend Next.js kiêm nhiệm vai trò backend monolith, can thiệp trực tiếp vào nhiều schema cơ sở dữ liệu thay vì ủy quyền cho Backend Saga.
- **Hậu quả**: [RỦI RO CHƯA XẢY RA] Khi môi trường Edge bị ngắt kết nối đột ngột hoặc timeout, rollback thủ công không chạy, dẫn đến sai lệch vĩnh viễn giữa kho và đơn hàng.
- **Quy tắc phòng ngừa**: NGHIÊM CẤM thực hiện nghiệp vụ ghi đa database trên tầng Frontend Route Handler; BẮT BUỘC chuyển toàn bộ nghiệp vụ checkout sang Backend Service điều phối bằng Saga Orchestration.
- **Cách phát hiện tự động**: Kiểm tra kiến trúc: lint cấm route handler gọi `withTransaction` hoặc kết nối database ngoài schema được phân công.
- **Skill liên quan**: `backend-architecture-monolith`, `distributed-systems`.

### L07: Route handler tự ý chạy lệnh DDL `ALTER TABLE` tại runtime
- **Triệu chứng**: Route handler API quản trị banners tự chạy các câu lệnh DDL sửa cấu trúc bảng cơ sở dữ liệu.
- **Bằng chứng**: `frontend/src/app/api/admin/banners/route.ts:88-101`:
  ```ts
  await queryDb('catalog_db', `ALTER TABLE banners ADD COLUMN IF NOT EXISTS mobile_image_url TEXT`);
  ```
- **Nguyên nhân gốc [Xác nhận]**: Lập trình viên vá víu tạm thời cơ sở dữ liệu local do chưa áp dụng migration script chính thức (Flyway).
- **Hậu quả**: Gây nghẽn bảng (`AccessExclusiveLock` trong PostgreSQL) khi có nhiều request đồng thời, tiềm ẩn nguy cơ sập hệ thống production.
- **Quy tắc phòng ngừa**: TUYỆT ĐỐI KHÔNG thực thi lệnh DDL (`ALTER`, `CREATE`, `DROP`) trong API runtime; 100% thay đổi cấu trúc bảng PHẢI thông qua công cụ Database Migration (Flyway/Liquibase).
- **Cách phát hiện tự động**: CI static analysis quét và chặn các từ khóa `ALTER TABLE`, `CREATE TABLE` trong toàn bộ thư mục `frontend/src/app/api`.
- **Skill liên quan**: `backend-architecture-monolith`, `database-governance`.

### L08: Frontend tự đúc JWT mạo danh Authorization Server để gọi Backend
- **Triệu chứng**: Frontend route handler tự tạo JWT header, payload và tự ký HMAC để mạo danh quyền hạn gọi Spring Boot.
- **Bằng chứng**: `frontend/src/app/api/admin/banners/route.ts:103-123` (`function generateBackendJwt`).
- **Nguyên nhân gốc [Xác nhận]**: Frontend không nhận được JWT hợp lệ từ người dùng do lỗi bất nhất token, nên lập trình viên tự viết hàm ký JWT ngay tại route handler.
- **Hậu quả**: Phá vỡ mô hình Zero Trust; nếu frontend bị chiếm quyền, kẻ xấu có thể ký JWT với mọi quyền hạn (`ROLE_ADMIN`, `banners:manage`).
- **Quy tắc phòng ngừa**: FRONTEND CHỈ ĐƯỢC PHÉP chuyển tiếp Bearer token do Authorization Server cấp; NGHIÊM CẤM frontend tự giữ private key / shared secret để tự cấp quyền cho chính mình.
- **Cách phát hiện tự động**: Kiểm tra bảo mật: cấm sử dụng module `crypto.createHmac` để tạo JWT bên ngoài Authorization Service.
- **Skill liên quan**: `security`, `auth-token`.

### L09: Fallback tồn kho giả định còn hàng ở cả 3 chi nhánh trên 8 trang danh mục
- **Triệu chứng**: Sản phẩm đã hết hàng trên toàn hệ thống nhưng vẫn hiển thị nhãn còn hàng tại TP.HCM, Hà Nội và Đà Nẵng.
- **Bằng chứng**: `tests/unit/adversarial/m1-1-catalog-stress.js:229` tố cáo: *"BRANCH FILTER INTEGRITY BUG: Products with zero stock were falsely defaulted to in-stock at all branches"*. Mã nguồn thực tế tại 8 file: `day-cuoc/page.tsx:98`, `giay-cau-long/page.tsx:92`, `luoi-cau-long/page.tsx:90`, `phu-kien/page.tsx:90`, `qua-cau-long/page.tsx:90`, `quan-ao/page.tsx:90`, `quan-can/page.tsx:90`, `tui-bao-vot/page.tsx:90`:
  ```ts
  inStockBranches: stockByProduct[p.id] || ['BR_HCM_01', 'BR_HN_01', 'BR_DN_01'],
  ```
- **Nguyên nhân gốc [Xác nhận]**: Lỗi copy-paste code giữa các trang danh mục; khi sửa lỗi tại `vot-cau-long/page.tsx:161` đã không tìm kiếm và sửa triệt để các trang còn lại.
- **Hậu quả**: Khách hàng đặt mua sản phẩm tại chi nhánh không có hàng, gây hủy đơn và khiếu nại dịch vụ.
- **Quy tắc phòng ngừa**: DỮ LIỆU TỒN KHO khi rỗng PHẢI fallback về mảng rỗng `[]`; đóng gói logic trích xuất tồn kho vào một hàm dùng chung duy nhất thay vì lặp lại ở từng trang.
- **Cách phát hiện tự động**: Viết test duyệt toàn bộ các trang danh mục với fixture tồn kho rỗng và assert `inStockBranches.length === 0`.
- **Skill liên quan**: `state-data-fetching`, `clean-code`.

### L10: Lỗi cú pháp SQL cross-join giữa hai database dịch vụ riêng biệt
- **Triệu chứng**: Trang chủ storefront gặp lỗi 500 do truy vấn bảng không tồn tại trong schema.
- **Bằng chứng**: Commit `8d22b82f8` đã sửa câu SQL trong `frontend/src/app/(storefront)/page.tsx:59-70`:
  Ban đầu truy vấn vào `secondhand_db` nhưng lại `JOIN products p ON ... JOIN brands b ON ...` (vốn thuộc `catalog_db`).
- **Nguyên nhân gốc [Xác nhận]**: Lập trình viên quên mất hệ thống áp dụng kiến trúc Database-per-service nên viết SQL join xuyên các cơ sở dữ liệu độc lập.
- **Hậu quả**: Gây sập trang chủ storefront; dữ liệu không hiển thị được.
- **Quy tắc phòng ngừa**: TUYỆT ĐỐI KHÔNG viết câu lệnh SQL join giữa các bảng thuộc các service khác nhau; BẮT BUỘC tách thành các truy vấn đơn lẻ hoặc gọi API tổng hợp (Aggregator API).
- **Cách phát hiện tự động**: Chạy integration test trên database test thật độc lập để phát hiện lỗi bảng không tồn tại.
- **Skill liên quan**: `backend-architecture-monolith`, `database-governance`.

### L11: Sai đường dẫn script kiểm thử trong Manifest `package.json`
- **Triệu chứng**: Lệnh `npm test` thất bại ngay lập tức với lỗi `MODULE_NOT_FOUND`.
- **Bằng chứng**: Root `package.json:6` cấu hình `"test": "node test/test-suite.js"`, trong khi thư mục thực tế trong repo là `tests/unit/test-suite.js`.
- **Nguyên nhân gốc [Xác nhận]**: Đổi tên hoặc tái cấu trúc thư mục từ `test` sang `tests` nhưng không kiểm tra lại script trong manifest.
- **Hậu quả**: CI pipeline bị gãy hoặc kỹ sư mới onboard không thể chạy được bộ kiểm thử tự động.
- **Quy tắc phòng ngừa**: MỌI thay đổi cấu trúc thư mục BẮT BUỘC phải đi kèm bước chạy thử toàn bộ script trong `package.json` trước khi commit.
- **Cách phát hiện tự động**: Bổ sung bước chạy `npm test` bắt buộc trong pre-commit hook (Husky) hoặc CI workflow.
- **Skill liên quan**: `tooling-ci`, `process`.

### L12: Drift giữa Master Test Suite và các chốt chặn xác thực Middleware mới
- **Triệu chứng**: Chạy test suite `tests/unit/test-suite.js` báo lỗi fail 12 test (kết quả 39/51 PASS), trong đó có 3 test fail vì mã HTTP 401.
- **Bằng chứng**: Log chạy test thực tế:
  `[FAIL] C3. Expire Worker R3: /api/inventory/expire: 401 !== 200`  
  `[FAIL] C5. Khắc phục Cartesian Product: /api/admin/orders: 401 !== 200`  
  `[FAIL] C9. Idempotency Key & R7 Re-approval Gate: 401 !== 400`
- **Nguyên nhân gốc [Xác nhận]**: Commit `5d8273e` đã kích hoạt bảo vệ xác thực trên middleware cho các route này, nhưng tác giả không cập nhật lại test runner để gửi kèm token xác thực.
- **Hậu quả**: Bộ kiểm thử không phản ánh đúng trạng thái thực của hệ thống, gây nhiễu báo cáo chất lượng.
- **Quy tắc phòng ngừa**: KHI THÊM CHỐT CHẶN BẢO MẬT (Security Gate), BẮT BUỘC cập nhật toàn bộ test suite liên quan để tương thích với cơ chế xác thực mới.
- **Cách phát hiện tự động**: Bắt buộc 100% test pass trên CI trước khi cho phép merge commit bảo mật.
- **Skill liên quan**: `testing`, `security`.

### L13: Vi phạm quy chuẩn thiết kế Quiet Court diện rộng (768 lỗi linter)
- **Triệu chứng**: Giao diện chứa nhiều chi tiết phô trương, chữ quá đậm hoặc quá nhỏ, vi phạm triết lý tối giản Quiet Court.
- **Bằng chứng**: Kết quả chạy `npm run lint:design` (`node scripts/check-design-rules.js`):
  *Tìm thấy 768 vi phạm trên 62 file* (362 lỗi `font-weight-600+`, 326 lỗi `tiny-text`, 48 lỗi `uppercase`, 30 lỗi `wide-tracking`, 2 lỗi `bg-gradient`).
- **Nguyên nhân gốc [Xác nhận]**: Lập trình viên tự do sử dụng các class Tailwind tùy biến mà không có design tokens chuẩn hóa và không tích hợp linter vào pre-commit.
- **Hậu quả**: Giao diện thiếu tính nhất quán, khó đọc trên màn hình di động, giảm trải nghiệm thương hiệu cao cấp.
- **Quy tắc phòng ngừa**: CHUẨN HÓA toàn bộ Typography và Spacing qua Tailwind design tokens; CẤM sử dụng arbitrary values như `text-[11px]` hoặc `font-bold` ngoài quy chuẩn.
- **Cách phát hiện tự động**: Tích hợp `node scripts/check-design-rules.js --strict` vào bước kiểm tra CI bắt buộc.
- **Skill liên quan**: `modern-web-guidance`, `design-system`.

### L14: Bất nhất thông tin địa chỉ chi nhánh giữa Footer, Admin Context và Database
- **Triệu chứng**: Khách hàng xem ở chân trang thấy một địa chỉ, vào trang chi nhánh thấy địa chỉ khác, dữ liệu admin lại hiển thị địa chỉ thứ ba.
- **Bằng chứng**: `docs/ui/claims-to-confirm.md:54-58` đối chiếu:
  - Footer TP.HCM: `120 Nguyễn Thị Minh Khai, P. Võ Thị Sáu` (`components/Footer.tsx:53`).
  - Admin Context: `15 Lê Duẩn, P. Bến Nghé` (`lib/admin-context.tsx:14`).
  - Database Canonical: `123 Nguyễn Thị Minh Khai, P. Bến Thành, Quận 1` (`identity_db.branches`).
- **Nguyên nhân gốc [Xác nhận]**: Dữ liệu tĩnh bị hardcode phân tán ở nhiều component thay vì tải từ API cơ sở dữ liệu chung.
- **Hậu quả**: Khách hàng đến nhầm địa chỉ cửa hàng, gây mất uy tín thương hiệu.
- **Quy tắc phòng ngừa**: DỮ LIỆU ĐỊA GIỚI VÀ CHI NHÁNH BẮT BUỘC tải động từ một nguồn dữ liệu duy nhất (Single Source of Truth) từ database `identity_db`.
- **Cách phát hiện tự động**: Viết test đối soát giữa dữ liệu hiển thị trên DOM với bảng `branches` trong database.
- **Skill liên quan**: `api-contract`, `clean-code`.

### L15: Tắt xác thực chứng chỉ SSL `rejectUnauthorized: false` trong kết nối PostgreSQL
- **Triệu chứng**: Kết nối database qua mạng không kiểm tra tính hợp lệ của chứng chỉ SSL máy chủ.
- **Bằng chứng**: `frontend/src/lib/db.ts:11`:
  ```ts
  ssl: isLocal ? false : { rejectUnauthorized: false },
  ```
- **Nguyên nhân gốc [Xác nhận]**: Để dễ dàng kết nối tới các dịch vụ DB có chứng chỉ tự ký hoặc pooler mà không cần import CA certificate.
- **Hậu quả**: Dễ bị tấn công nghe lén hoặc chèn dữ liệu Man-in-the-Middle (MITM) trên môi trường production.
- **Quy tắc phòng ngừa**: MÔI TRƯỜNG PRODUCTION BẮT BUỘC bật xác thực SSL đầy đủ (`rejectUnauthorized: true`) và cung cấp chứng chỉ CA gốc tin cậy.
- **Cách phát hiện tự động**: Static code analysis cảnh báo khi phát hiện cờ `rejectUnauthorized: false`.
- **Skill liên quan**: `security`, `infrastructure`.

### L16: Drift tài liệu kiến trúc: Tài liệu mô tả Axios, STOMP, Zustand nhưng code không dùng
- **Triệu chứng**: Kỹ sư đọc tài liệu mong đợi thấy code Axios, WebSocket STOMP và Zustand store, nhưng mở code ra thì hoàn toàn không có.
- **Bằng chứng**: `frontend/package.json:15-48` không hề khai báo các gói này; toàn bộ codebase dùng `fetch` và React Context.
- **Nguyên nhân gốc [Xác nhận]**: Tài liệu kỹ thuật ban đầu được viết dựa trên giả định hoặc thiết kế cũ, không được cập nhật khi đội ngũ quyết định dùng công nghệ khác trong thực tế.
- **Hậu quả**: Gây hiểu lầm nghiêm trọng cho các kỹ sư tiếp quản và các AI Agent hỗ trợ lập trình.
- **Quy tắc phòng ngừa**: TÀI LIỆU KIẾN TRÚC BẮT BUỘC được review và cập nhật đồng bộ với mỗi thay đổi trong `package.json` hoặc PR lớn.
- **Cách phát hiện tự động**: Script kiểm tra định kỳ đối chiếu tên thư viện xuất hiện trong tài liệu markdown với manifest `package.json`.
- **Skill liên quan**: `process`, `documentation-integrity`.

### L17: Drift phiên bản Spring Boot giữa ADR 0001 (ghi 4.1.x) và thực tế pom.xml (3.3.4)
- **Triệu chứng**: Tài liệu kiến trúc ADR 0001 ghi nhận Spring Boot 4.1.x (Spring Framework 7), nhưng pom.xml thực tế chạy Spring Boot 3.3.4.
- **Bằng chứng**: `docs/adr/0001-architecture-and-stack.md:32` vs `backend/pom.xml:10`.
- **Nguyên nhân gốc [Xác nhận]**: Tác giả ADR ghi phiên bản giả định tương lai không có thật (Spring Boot 4.x chưa phát hành) trong khi source code dùng phiên bản thực tế ổn định.
- **Hậu quả**: Gây hoang mang về tính khả thi và phiên bản runtime thực tế của hệ thống.
- **Quy tắc phòng ngừa**: TUYỆT ĐỐI KHÔNG ghi nhận phiên bản giả định chưa phát hành vào tài liệu kiến trúc chính thức; BẮT BUỘC lấy phiên bản từ file build thực tế.
- **Cách phát hiện tự động**: CI checker so khớp phiên bản trong ADR với `pom.xml`.
- **Skill liên quan**: `process`, `documentation-integrity`.

### L18: Lỗi Dark Mode loang màu do thiếu selector `@custom-variant` trên Tailwind v4
- **Triệu chứng**: Khi hệ điều hành của người dùng ở chế độ tối, giao diện storefront bị loang màu bất thường dù người dùng đang chọn chế độ sáng trên web.
- **Bằng chứng**: Commit `8d22b82f8` đã sửa `frontend/src/app/globals.css:2` bằng cách bổ sung:
  ```css
  @custom-variant dark (&:where(.dark, .dark *));
  ```
- **Nguyên nhân gốc [Xác nhận]**: Tailwind v4 thay đổi cơ chế xử lý dark mode so với v3; việc không chỉ định biến thể scoped khiến class tự động ăn theo media query `prefers-color-scheme` của hệ thống.
- **Hậu quả**: Phá vỡ bố cục giao diện, trải nghiệm người dùng bị ảnh hưởng.
- **Quy tắc phòng ngừa**: KHI NÂNG CẤP FRAMEWORK CSS, BẮT BUỘC kiểm tra kỹ migration guide về dark mode strategy và CSS scoping.
- **Cách phát hiện tự động**: Chạy visual regression test trong cả 2 chế độ hệ thống (OS Light / OS Dark).
- **Skill liên quan**: `modern-web-guidance`, `styling`.

### L19: HTTP 404 trong Racket Quiz do giới thiệu slug sản phẩm không có thật trong catalog
- **Triệu chứng**: Người dùng làm bài trắc nghiệm chọn vợt, bấm vào sản phẩm được gợi ý thì nhận trang lỗi 404.
- **Bằng chứng**: `.agents/teamwork/worker_m2_r2/DISPATCH.md:39-42` ghi nhận lỗi slug `'yonex-nanoflare-800-pro'` không có trong `catalog_db`. Đã sửa thành `'yonex-nanoflare-1000z'`.
- **Nguyên nhân gốc [Xác nhận]**: Hardcode slug sản phẩm vào logic trắc nghiệm mà không đối chiếu với seed data trong cơ sở dữ liệu.
- **Hậu quả**: Làm đứt gãy hành trình mua sắm của khách sắm ngay bước chốt đơn.
- **Quy tắc phòng ngừa**: TOÀN BỘ slug hoặc mã tham chiếu sản phẩm trong component BẮT BUỘC phải được kiểm tra tồn tại trong catalog hoặc lấy động từ database.
- **Cách phát hiện tự động**: E2E test tự động click qua toàn bộ các kết quả của quiz và kiểm tra response status phải là 200.
- **Skill liên quan**: `testing`, `routing`.

### L20: [RỦI RO CHƯA XẢY RA] Nguy cơ cạn kiệt Connection Pool PostgreSQL trên Cloudflare Workers Edge
- **Triệu chứng**: Trang web bị treo hoặc trả về lỗi 500 khi có lưu lượng truy cập tăng đột biến.
- **Bằng chứng**: `frontend/src/lib/db.ts:16-28` khởi tạo connection pool riêng (`max: 5`) trong mỗi worker instance trên Cloudflare Workers (`wrangler.jsonc`).
- **Nguyên nhân gốc [Xác nhận kiến trúc]**: Mô hình Serverless Edge nhân bản hàng trăm isolates; mỗi isolate mở 5 connection trực tiếp đến PostgreSQL mà không có proxy trung gian (Hyperdrive/PgBouncer).
- **Hậu quả**: Cơ sở dữ liệu nhanh chóng chạm ngưỡng `max_connections` (thường là 100), từ chối toàn bộ kết nối mới.
- **Quy tắc phòng ngừa**: KHI DEPLOY LÊN EDGE RUNTIME, BẮT BUỘC sử dụng Connection Pooler chuyên dụng (Cloudflare Hyperdrive, Supabase Transaction Pooler, hoặc Prisma Accelerate), không dùng `pg.Pool` trực tiếp.
- **Cách phát hiện tự động**: Load test mô phỏng 200 concurrent requests và giám sát số lượng active connections trên PostgreSQL.
- **Skill liên quan**: `infrastructure`, `performance`.

### L21: [RỦI RO CHƯA XẢY RA] Wildcard `remotePatterns` trong cấu hình Next.js Image
- **Triệu chứng**: Next.js image optimization server có thể bị lợi dụng để tải và tối ưu ảnh từ các domain bất kỳ trên Internet.
- **Bằng chứng**: `frontend/next.config.mjs:28-33`:
  ```js
  remotePatterns: [{ protocol: 'https', hostname: '**' }],
  ```
- **Nguyên nhân gốc [Xác nhận]**: Cấu hình mở rộng để không phải khai báo từng domain CDN.
- **Hậu quả**: Tiềm ẩn rủi ro tấn công từ chối dịch vụ (DoS) bằng cách yêu cầu server tối ưu các file ảnh khổng lồ từ domain lạ, hoặc rủi ro SSRF.
- **Quy tắc phòng ngừa**: GIỚI HẠN chặt chẽ danh sách `hostname` trong `remotePatterns` (chỉ cho phép ImageKit CDN, Supabase Storage hoặc domain nội bộ đã xác định).
- **Cách phát hiện tự động**: Security linter kiểm tra file `next.config.mjs` không chứa wildcard `**` ở trường `hostname`.
- **Skill liên quan**: `security`, `modern-web-guidance`.

### L22: [RỦI RO CHƯA XẢY RA] Kênh WebSocket / Realtime Permissions hoàn toàn không tồn tại trong code
- **Triệu chứng**: Thay đổi quyền hạn nhân viên không có hiệu lực tức thì trên giao diện người dùng nếu không tải lại trang.
- **Bằng chứng**: Lệnh `git grep -i "PERMISSIONS_CHANGED"` và `queue/permissions` trả về 0 kết quả trong toàn bộ repository.
- **Nguyên nhân gốc [Xác nhận]**: Tính năng realtime mới chỉ nằm trong tài liệu hướng dẫn (skill backend) mà chưa từng được triển khai thực tế trên frontend hay backend.
- **Hậu quả**: Giao diện không cập nhật quyền hạn kịp thời khi tài khoản bị giáng chức hoặc thu hồi quyền tại quầy.
- **Quy tắc phòng ngừa**: KHÔNG ĐƯA CÁC YÊU CẦU REALTIME VÀO TÀI LIỆU CHUẨN NẾU CODEBASE CHƯA TRIỂN KHAI; nếu cần realtime, BẮT BUỘC triển khai đầy đủ cả 2 phía (WebSocket/SSE + reconnect handler).
- **Cách phát hiện tự động**: E2E test kiểm tra: khi backend thu hồi quyền, tab frontend đang mở phải tự động đóng tính năng trong vòng 1 giây.
- **Skill liên quan**: `realtime`, `api-contract`.

### L23: [RỦI RO CHƯA XẢY RA] Backend cấu hình `@JsonInclude(NON_NULL)` làm mất trường `data` null
- **Triệu chứng**: Frontend gặp lỗi runtime `TypeError: Cannot read properties of undefined` khi xử lý response lỗi hoặc response không có payload dữ liệu.
- **Bằng chứng**: `backend/src/main/java/com/badminton/common/response/ApiResponse.java:7`:
  `@JsonInclude(JsonInclude.Include.NON_NULL)`
  Trong khi `frontend/src/lib/api.ts:47` trả về thẳng `response.json()`.
- **Nguyên nhân gốc [Xác nhận]**: Jackson serializer loại bỏ hoàn toàn các trường có giá trị `null` khỏi JSON body để tiết kiệm băng thông.
- **Hậu quả**: Code frontend nếu viết theo kiểu `if (res.data.items)` mà không kiểm tra `res.data` sẽ crash ngay lập tức.
- **Quy tắc phòng ngừa**: FRONTEND BẮT BUỘC coi trường `data` trong `ApiResponse<T>` là `data?: T` (optional/nullable) và luôn dùng optional chaining (`res.data?.items`).
- **Cách phát hiện tự động**: TypeScript compiler với cờ `strictNullChecks: true` sẽ bắt buộc kiểm tra null trước khi truy xuất.
- **Skill liên quan**: `type-safety`, `api-contract`.

### L24: [Tốt cần giữ] Không lưu Token trong LocalStorage, sử dụng Cookie httpOnly an toàn
- **Triệu chứng tốt**: Token phiên làm việc không thể bị đọc hoặc đánh cắp bởi các đoạn mã JavaScript độc hại (XSS).
- **Bằng chứng**: `frontend/src/app/api/auth/login/route.ts:52-58, 149-155`:
  ```ts
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  ```
  Tìm kiếm toàn bộ frontend source code xác nhận `localStorage` chỉ dùng lưu giao diện (`smash_admin_density`, `smash_admin_branch`, `search_history`).
- **Lợi ích**: Bảo vệ tuyệt đối phiên đăng nhập của người dùng trước các cuộc tấn công XSS.
- **Quy tắc duy trì**: TIẾP TỤC DUY TRÌ lưu trữ token phiên trong cookie `httpOnly`, `sameSite: lax`; NGHIÊM CẤM đưa token xác thực vào `localStorage`.

### L25: [Tốt cần giữ] Phân quyền xác thực cưỡng chế tại Server Route và Edge Middleware
- **Triệu chứng tốt**: Người dùng không thể vượt qua phân quyền bằng cách can thiệp UI hoặc sửa đổi state phía client.
- **Bằng chứng**: `frontend/src/middleware.ts:110-138` và `frontend/src/lib/rbac.ts:116-118`:
  `// Nghiêm cấm client tự truyền role qua body hoặc URL`  
  `// Vai trò & danh tính PHẢI được trích xuất xác thực từ JWT / Server Session Token`
- **Lợi ích**: Đảm bảo nguyên tắc bảo mật tối thượng: UI chỉ phục vụ trải nghiệm người dùng (UX), tầng biên máy chủ mới là nơi thực thi bảo mật (Security Enforcement).
- **Quy tắc duy trì**: TOÀN BỘ các thao tác nghiệp vụ nhạy cảm BẮT BUỘC phải đối soát vai trò và chi nhánh tại Edge Middleware và Server Route.

### L26: [Tốt cần giữ] Áp dụng Idempotency-Key và kiểm tra giao dịch kép chống trừ đúp tồn kho
- **Triệu chứng tốt**: Khách hàng ấn nút thanh toán nhiều lần hoặc gửi request trùng lặp không làm trừ thêm tồn kho hoặc tạo đơn hàng đúp.
- **Bằng chứng**: `frontend/src/app/api/checkout/route.ts:104-124` và `backend/src/main/java/com/badminton/order/application/OrderService.java:51-56` đều kiểm tra `Idempotency-Key` trước khi khởi tạo đơn hàng.
- **Lợi ích**: Triệt tiêu lỗi trừ trùng tồn kho và giao dịch tài chính sai lệch.
- **Quy tắc duy trì**: MỌI API thanh toán hoặc thay đổi trạng thái tồn kho BẮT BUỘC nhận và xác thực `Idempotency-Key`.

### L27: [Tốt cần giữ] Nhật ký kiểm toán toàn diện cho mọi hành động đăng nhập và quản trị
- **Triệu chứng tốt**: Mọi lần đăng nhập thành công hay thất bại, IP address, user-agent đều được ghi vết chi tiết vào cơ sở dữ liệu.
- **Bằng chứng**: `frontend/src/lib/logger.ts`, `frontend/src/app/api/auth/login/route.ts:79, 99, 130`.
- **Lợi ích**: Phục vụ điều tra an ninh, phát hiện tấn công brute-force và đối soát nội bộ.
- **Quy tắc duy trì**: DUY TRÌ ghi nhật ký kiểm toán (Audit Trail) cho toàn bộ các endpoint xác thực và thay đổi trạng thái nghiệp vụ.

---

## 5. Ma Trận Bất Nhất (Discrepancy Matrix)

| Mục kiểm tra | Bên A (Tài liệu / Cấu hình) | Bên B (Code thực tế / Cơ sở dữ liệu) | Đề xuất thống nhất chuẩn hóa |
|:---|:---|:---|:---|
| **Tech Stack HTTP Client** | Tài liệu cũ nói dùng **Axios** và Interceptor | Code thực tế dùng native **`fetch`** (`lib/api.ts:34`) | Cập nhật tài liệu: Chuẩn hóa 100% sang `fetch` có wrapper |
| **Realtime / WebSocket** | Tài liệu nói dùng **STOMP WebSocket** (`/user/queue/permissions`) | Code thực tế **không hề có WebSocket** (`git grep` = 0) | Gỡ yêu cầu WebSocket khỏi tài liệu cho đến khi có PR triển khai |
| **State Management** | Tài liệu cũ nói dùng **Zustand / Pinia** | Code thực tế dùng **React Context** (`AdminContext`, `CartContext`) | Thống nhất dùng React Context cho trạng thái nhẹ, bổ sung URL state qua `nuqs` |
| **Tên trường Auth Response** | Frontend Login đọc `data.token`, `data.userInfo` | Backend trả về `accessToken`, `user` (`AuthResponse.java:7-10`) | Sửa frontend: Đổi thành `backendData.data?.accessToken` và `backendData.data?.user` |
| **Phiên bản Spring Boot** | `ADR 0001` ghi **Spring Boot 4.1.x** | `backend/pom.xml` cấu hình **Spring Boot 3.3.4** (Java 21) | Sửa `ADR 0001` về phiên bản thực tế Spring Boot 3.3.4 |
| **Thư mục kiểm thử** | `package.json` gọi `node test/test-suite.js` | Thư mục thực tế là `tests/unit/test-suite.js` | Sửa `package.json`: Cập nhật thành `tests/unit/test-suite.js` |
| **Địa chỉ CN TP.HCM** | Footer: `120 Nguyễn Thị Minh Khai, P. Võ Thị Sáu` | Database: `123 Nguyễn Thị Minh Khai, P. Bến Thành, Quận 1` | Đồng bộ toàn bộ frontend theo database `identity_db.branches` |
| **Địa chỉ CN Hà Nội** | Footer: `45 Xuân Thủy` | `admin-context.tsx`: `28 Cầu Giấy` | Lấy dữ liệu động từ API `branches`, xóa bỏ hardcode tĩnh |
| **Thương hiệu đối tác** | Trang chủ có Marquee chữ `MIZUNO` | Database `catalog_db` không có sản phẩm Mizuno nào | Gỡ `MIZUNO` khỏi banner đối tác theo yêu cầu Quiet Court |
| **Thời gian căng vợt** | Trang chi nhánh cam kết *"Lấy ngay 15 phút"* | Năng lực vận hành thực tế không thể đảm bảo 15 phút | Sửa thành: *"Hoàn thành trong ngày theo lịch hẹn"* |
| **Kiểm định vợt cũ** | Storefront quảng cáo *"16 tiêu chuẩn kiểm định"* | Code admin wizard chỉ kiểm tra 5 tiêu chí kỹ thuật chính | Điều chỉnh: *"Quy trình kiểm tra kỹ thuật đa điểm toàn diện"* |

---

## 6. Điều Đã Làm Tốt Cần Giữ
1. **Lưu trữ phiên an toàn**: Triệt để sử dụng cookie `httpOnly`, `sameSite: lax`, không lưu JWT trên `localStorage`.
2. **Kiểm tra quyền phía Server**: Cưỡng chế phân quyền bằng Web Crypto HMAC tại Edge Middleware và Server Route Handlers; không bao giờ tin tưởng client.
3. **Bảo vệ chống trừ tồn kho trùng lặp**: Triển khai `Idempotency-Key` cả ở tầng Frontend Route Handler và Backend Order Service.
4. **Trải nghiệm bảng dữ liệu chuyên nghiệp**: Hỗ trợ chuyển đổi mật độ bảng (Compact vs Normal) trong Admin Portal, lưu preference người dùng mượt mà.
5. **Cơ chế chống hồi quy trực quan**: Triển khai kịch bản kiểm tra linter thiết kế (`check-design-rules.js`) kiểm soát chặt chẽ phong cách Quiet Court.
6. **Kiểm toán nhật ký đầy đủ**: Ghi log chi tiết các hành động đăng nhập, đổi mật khẩu và thao tác quản trị.

---

## 7. Quy Tắc Phòng Ngừa Tổng Hợp (Consolidated Prevention Rules)
*(Mỗi quy tắc là một mệnh lệnh, kiểm chứng được bằng công cụ tự động hoặc quy trình CI)*

1. TUYỆT ĐỐI KHÔNG lưu access token hoặc refresh token trong `localStorage` hay `sessionStorage`.
2. BẮT BUỘC kiểm tra timestamp hết hạn của token bằng phép so sánh tường minh (`exp !== undefined && exp !== null`), không dùng truthy check.
3. NGHIÊM CẤM gán giá trị quyền hạn mặc định dạng bypass (`|| 'ADMIN'`) trong toàn bộ code xử lý phân quyền.
4. TẬP TRUNG TOÀN BỘ biến môi trường vào module `env.ts` có thẩm định schema Zod; cấm truy cập trực tiếp `process.env`.
5. BẮT BUỘC sinh TypeScript types tự động từ OpenAPI schema của Backend để đảm bảo khớp 100% tên trường dữ liệu.
6. FRONTEND CHỈ ĐƯỢC PHÉP chuyển tiếp Bearer token do Authorization Server cấp; cấm frontend tự đúc JWT mạo danh.
7. TUYỆT ĐỐI KHÔNG thực thi lệnh DDL (`ALTER TABLE`, `CREATE TABLE`) trong API route handler runtime.
8. NGHIÊM CẤM frontend tự điều phối transaction phân tán xuyên qua nhiều database; toàn bộ nghiệp vụ checkout phải đưa về Backend Saga.
9. BẮT BUỘC fallback mảng rỗng `[]` khi dữ liệu tồn kho chi nhánh không tồn tại; cấm gán mặc định còn hàng ở tất cả chi nhánh.
10. KHÔNG ĐƯỢC PHÉP viết câu lệnh SQL join xuyên qua các database độc lập trong mô hình Database-per-service.
11. BẮT BUỘC sử dụng Connection Pooler chuyên dụng (Hyperdrive / PgBouncer) khi kết nối PostgreSQL từ Cloudflare Workers.
12. GIỚI HẠN chặt chẽ danh sách domain được phép tải ảnh trong `remotePatterns` của `next.config.mjs`; cấm dùng wildcard `**`.
13. MỌI API tra cứu thông tin cá nhân hoặc đơn hàng BẮT BUỘC phải yêu cầu cặp khóa xác thực kép (chống IDOR).
14. BẮT BUỘC cập nhật test suite đồng bộ ngay trong cùng Pull Request khi bổ sung chốt chặn xác thực middleware mới.
15. MỌI thay đổi cấu trúc thư mục dự án BẮT BUỘC phải kiểm tra và cập nhật lại toàn bộ script trong `package.json`.
16. BẮT BUỘC bật xác thực chứng chỉ SSL đầy đủ (`rejectUnauthorized: true`) trên môi trường production.
17. DỮ LIỆU ĐỊA LÝ, CHI NHÁNH VÀ SẢN PHẨM BẮT BUỘC phải tải động từ cơ sở dữ liệu canonical; cấm hardcode tĩnh phân tán.
18. TUYỆT ĐỐI KHÔNG ghi nhận phiên bản phần mềm giả định hoặc chưa phát hành vào tài liệu kiến trúc chính thức.
19. MỌI API thay đổi trạng thái đơn hàng hoặc trừ kho BẮT BUỘC phải gửi và đối soát header `Idempotency-Key`.
20. BẮT BUỘC chạy `tsc --noEmit` và design rule linter qua pre-commit hook trước khi commit mã nguồn.

---

## 8. Gợi Ý Nhóm Skill Frontend (Chỉ Gợi Ý — Không Tạo File)
Dựa trên các khiếm khuyết đã chứng minh thực tế, khuyến nghị xây dựng 6 skill chuyên biệt cho Frontend trong tương lai:
1. `frontend-api-contract-sync`: Hướng dẫn đồng bộ Schema giữa Spring Boot OpenAPI và Next.js TypeScript types; phát hiện lệch tên trường.
2. `frontend-auth-security`: Quy chuẩn quản lý session cookie `httpOnly`, xác thực token an toàn trên Edge Runtime, chống lỗ hổng falsy epoch.
3. `frontend-resilience-offline`: Hướng dẫn xây dựng cơ chế Retry, Circuit Breaker và Graceful Fallback khi Backend ngoại tuyến mà không vi phạm ranh giới dữ liệu.
4. `frontend-quiet-court-design`: Quy chuẩn typography, spacing, accessible color contrast và kiểm tra linter cho giao diện Quiet Court.
5. `frontend-edge-database-access`: Hướng dẫn kết nối cơ sở dữ liệu từ Cloudflare Workers qua Hyperdrive/Pooler an toàn, chống cạn kiệt connection.
6. `frontend-testing-governance`: Hướng dẫn duy trì tính đồng bộ giữa Test Suite, Route Guards và CI scripts.

---

## 9. Điều Không Xác Minh Được & Câu Hỏi Mở

### 9.1. Điều không xác minh được
1. **Trạng thái thực của WebSocket Server**: Không tìm thấy bất kỳ mã nguồn WebSocket nào ở cả Backend và Frontend, nên không thể xác minh hành vi kết nối lại (reconnect) hoặc rò rỉ bộ nhớ của STOMP client trong thực tế.
2. **Hành vi Connection Pool trên Cloudflare Production thật**: Chưa có tài khoản Cloudflare Workers live kết nối tới PostgreSQL để đo đạc chính xác thời điểm connection pool bị cạn kiệt dưới tải cao.
3. **Ý định ban đầu của việc tự đúc JWT trong Banners Route**: Không có transcript hội thoại giải thích vì sao lập trình viên lại chọn tự sinh JWT bằng `crypto.createHmac` trong `banners/route.ts` thay vì yêu cầu client truyền token từ backend.

### 9.2. Câu hỏi mở cần chủ dự án giải đáp
1. **Kiến trúc đích của Monorepo**: Dự án dự định đi theo hướng **Next.js Fullstack Monolith** (Next.js làm việc trực tiếp với PostgreSQL qua Prisma/Drizzle) hay **Frontend/Backend Tách Biệt** (Next.js chỉ là UI Client thuần túy gọi REST API Spring Boot)?
2. **Quy chuẩn định tuyến cho Admin Portal**: Có nên xóa bỏ hoàn toàn các route cũ `/quan-tri` và `/admin` để gom thống nhất 100% về `/portal/*` nhằm tránh phải duy trì logic redirect phức tạp trong middleware?
3. **Chính sách kiểm định vợt cũ**: Doanh nghiệp áp dụng quy trình kiểm định 16 tiêu chí chi tiết hay chỉ giữ 5 tiêu chí kỹ thuật như hiện tại trong giao diện quản trị?
