# ADR 0002: Lựa chọn Thư viện UI và Công nghệ Nền tảng cho Giao diện Quiet Court

## 1. Bối cảnh
Dự án Badminton Shop (Smash Court) đang sử dụng Next.js 16.4.0 (Turbopack, App Router), React 19 và Tailwind CSS v4.  
Theo yêu cầu tái thiết kế toàn diện hệ thống theo phong cách **Quiet Court** (tối giản, sang, thể thao, mobile-first, LCP < 2.5s, CLS < 0.1, INP < 200ms), cần lựa chọn và chuẩn hóa các thư viện UI phục vụ animation, navigation, dialog, toast, carousel và data presentation mà không làm phình kích thước bundle hoặc vi phạm bản quyền.

## 2. Quyết định
Áp dụng nguyên tắc "Build vs Buy" từ Mục 4 của tài liệu thiết kế: ưu tiên các thư viện headless unstyled, có khả năng tùy biến hoàn toàn theo CSS design tokens của dự án, đạt chuẩn WCAG AA và tương thích tốt với React 19.

### Danh mục thư viện chính thức:

1. **`@radix-ui/react-*` + `shadcn/ui` primitives**
   - Phiên bản: Latest (1.1.x - 2.x) | Giấy phép: MIT | Tác động bundle: Cực nhẹ (Tree-shakeable)
   - Lý do: Cung cấp hành vi tiếp cận (A11y), phím bấm bàn phím, focus trap, và ARIA chuẩn WCAG AA cho Dialog, Accordion, Tooltip, Dropdown. Hoàn toàn không ép style sẵn.

2. **`class-variance-authority` (`cva`)**
   - Phiên bản: `0.7.1` | Giấy phép: Apache-2.0 | Kích thước: ~1 KB
   - Lý do: Quản lý biến thể (variants) cho các UI primitives (Button, Badge, SpecBar) theo đúng design tokens của Quiet Court.

3. **`motion` (Framer Motion v12/14)**
   - Phiên bản: `12.4.7` | Giấy phép: MIT | Kích thước: Dynamic import
   - Lý do: Quản lý animation layout (`layoutId`), hiệu ứng hover, drawer spring physics, và hỗ trợ sẵn cơ chế tắt chuyển động `reducedMotion="user"`.

4. **`next-themes`**
   - Phiên bản: `0.4.6` | Giấy phép: MIT | Kích thước: ~2 KB
   - Lý do: Quản lý chế độ Sáng / Tối (Dark mode), lưu preference người dùng trong `localStorage`, chống giật nhấp nháy FOUC khi tải trang.

5. **`sonner`**
   - Phiên bản: `2.0.1` | Giấy phép: MIT | Kích thước: ~4 KB
   - Lý do: Hệ thống thông báo toast hiện đại, có animation mượt, hỗ trợ stack và ARIA `aria-live`, thay thế hoàn toàn các hộp thoại `alert()` thô sơ.

6. **`vaul`**
   - Phiên bản: `1.1.2` | Giấy phép: MIT | Kích thước: ~5 KB
   - Lý do: Drawer / Bottom sheet hỗ trợ cử chỉ vuốt chuẩn iOS cho bộ lọc sản phẩm và giỏ hàng mobile.

7. **`cmdk`**
   - Phiên bản: `1.0.4` | Giấy phép: MIT | Kích thước: ~4 KB
   - Lý do: Hộp thoại tìm kiếm nhanh qua phím tắt ⌘K / Ctrl+K cho sản phẩm, vợt cũ và mã bảo hành.

8. **`nuqs`**
   - Phiên bản: `2.4.0` | Giấy phép: MIT | Kích thước: ~6 KB
   - Lý do: Type-safe URL search params state manager cho bộ lọc danh mục (`?brand=...&playstyle=...`), giúp giữ URL sạch, có thể bookmark và tối ưu SEO.

9. **`@number-flow/react`**
   - Phiên bản: `0.5.5` | Giấy phép: MIT | Kích thước: ~4 KB
   - Lý do: Hiệu ứng chuyển số mượt mà khi thay đổi giá biến thể SKU hoặc cập nhật giỏ hàng.

10. **`embla-carousel-react`**
    - Phiên bản: `8.5.2` | Giấy phép: MIT | Kích thước: ~7 KB
    - Lý do: Carousel nhẹ nhất cho di động, hỗ trợ vuốt chạm cảm ứng mượt mà, không phụ thuộc thư viện ngoài.

11. **`yet-another-react-lightbox`**
    - Phiên bản: `3.21.7` | Giấy phép: MIT | Kích thước: Lazy loaded
    - Lý do: Phóng to soi chi tiết vết xước và số serial trên nón vợt cũ kiểm định mà không phá vỡ bố cục.

12. **`canvas-confetti`**
    - Phiên bản: `1.9.4` | Giấy phép: ISC | Kích thước: ~3 KB
    - Lý do: Hiệu ứng ăn mừng khi đặt hàng thành công, tự động tắt khi người dùng bật `prefers-reduced-motion`.

## 3. Hệ quả
- Đảm bảo 100% các thư viện có giấy phép tự do (MIT / Apache-2.0 / ISC), được duy trì tích cực và không có rủi ro pháp lý.
- Kiểm soát chặt chẽ kích thước bundle bằng dynamic import và React Server Components.
- Giữ vững toàn bộ hợp đồng API, zero-mock database và master test suite 51/51 PASS.
