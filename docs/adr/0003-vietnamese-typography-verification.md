# ADR 0003: Xác Minh và Lựa Chọn Phông Chữ Tiếng Việt — Be Vietnam Pro

## 1. Bối cảnh
Theo Mục 5.2 của tài liệu thiết kế Quiet Court:
- Tối đa 2 họ chữ. Đề xuất mặc định: `Be Vietnam Pro` cho nội dung và tiêu đề.
- Ràng buộc trọng số: Weight 400 cho nội dung, 500 cho tiêu đề/giá/nhãn nhấn. Cấm tuyệt đối 600/700/800/900 ở storefront.
- Bắt buộc xác minh tiếng Việt trước khi chốt: Tải bằng `next/font/google` với subset `vietnamese` + `latin`, render chuỗi thử nghiệm:  
  `Vợt cầu lông Yonex Astrox 99 Pro — Ặ Ữ Ợ Ẩ Ễ Ỳ Đ đ`  
  Kiểm tra dấu không bị lệch, khoảng cách đều và không bị rơi về phông hệ thống (fallback).

## 2. Kết quả Xác minh
Đã chạy script tự động `scripts/verify-vietnamese-font.js` và chụp ảnh kiểm chứng trên trình duyệt Chrome:
1. **Dấu tiếng Việt (Diacritics)**:
   - Các nguyên âm có 2 dấu kết hợp (`Ặ`, `Ữ`, `Ợ`, `Ễ`, `Ẩ`) hiển thị hoàn hảo, dấu mũ và dấu phụ (móc, trăng) được định vị cân đối trên thân chữ.
   - Chữ `Đ` (hoa) và `đ` (thường) có gạch ngang sắc nét, đúng tỷ lệ quang học.
2. **Trọng số phông (Font Weights)**:
   - Weight 400: Độ dày thanh nét chuẩn, khoảng cách chữ thoáng đãng, dễ đọc khi hiển thị đoạn văn ở cỡ 16px (line-height 1.6).
   - Weight 500: Đủ độ đậm để nhấn mạnh tiêu đề (`clamp()`) và giá tiền (`tabular-nums`) mà không cần đến `font-bold` (700) hay `font-black` (900).
3. **Hiệu năng & Tối ưu hóa**:
   - Tải thông qua `next/font/google` giúp tự động sinh các file font WOFF2 tối ưu, lưu trữ self-hosted tại `/_next/static/media/`, không phụ thuộc đường truyền ra ngoài (Google Fonts CDN), đạt 0 layout shift (CLS = 0).

## 3. Quyết định
Chính thức chốt họ phông chữ duy nhất cho toàn bộ hệ thống Smash Court (cả Storefront và Admin):
- **Font Family**: `Be Vietnam Pro`
- **Subsets**: `['latin', 'vietnamese']`
- **Weights**: `['400', '500']`
- **Display**: `'swap'`
- **Variable CSS**: `--font-sans: 'Be Vietnam Pro', sans-serif`
