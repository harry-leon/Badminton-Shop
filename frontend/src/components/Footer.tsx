import * as React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface text-ink py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-[14px]">
        {/* Cột 1: Thương hiệu */}
        <div className="space-y-3">
          <Link href="/" className="inline-block text-xl font-medium tracking-tight text-ink">
            Smash<span className="text-brand">Court</span>
          </Link>
          <p className="text-muted leading-relaxed font-normal">
            Hệ thống bán lẻ vợt cầu lông chính hãng và sàn giao dịch vợt cũ có kiểm định chất lượng độc lập tại quầy.
          </p>
          <div className="text-[13px] text-muted font-normal pt-2">
            Mở cửa hàng ngày: 08:30 – 21:30
          </div>
        </div>

        {/* Cột 2: Sản phẩm */}
        <div className="space-y-3">
          <h4 className="font-medium text-ink text-[14px]">Sản phẩm & Dịch vụ</h4>
          <ul className="space-y-2 text-muted font-normal">
            <li>
              <Link href="/vot-cau-long" className="hover:text-ink transition-colors">
                Vợt mới chính hãng
              </Link>
            </li>
            <li>
              <Link href="/second-hand" className="hover:text-ink transition-colors">
                Vợt cũ đã kiểm định (Hạng A/B/C)
              </Link>
            </li>
            <li>
              <Link href="/tra-cuu-bao-hanh" className="hover:text-ink transition-colors">
                Tra cứu bảo hành điện tử
              </Link>
            </li>
            <li>
              <Link href="/_design" className="hover:text-ink transition-colors">
                Thư viện thiết kế (Quiet Court)
              </Link>
            </li>
          </ul>
        </div>

        {/* Cột 3: Chi nhánh */}
        <div className="space-y-3">
          <h4 className="font-medium text-ink text-[14px]">Hệ thống cửa hàng</h4>
          <ul className="space-y-2 text-muted font-normal text-[13px]">
            <li>
              <span className="text-ink font-medium">TP. Hồ Chí Minh:</span> 120 Nguyễn Thị Minh Khai, P. Võ Thị Sáu, Quận 1
            </li>
            <li>
              <span className="text-ink font-medium">Hà Nội:</span> 45 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy
            </li>
            <li>
              <span className="text-ink font-medium">Đà Nẵng:</span> 88 Nguyễn Văn Linh, Nam Dương, Hải Châu
            </li>
            <li className="pt-1 text-ink font-medium">
              Hotline: 1900 6868 (Miễn phí)
            </li>
          </ul>
        </div>

        {/* Cột 4: Chính sách */}
        <div className="space-y-3">
          <h4 className="font-medium text-ink text-[14px]">Cam kết từ Smash Court</h4>
          <ul className="space-y-2 text-muted font-normal text-[13px]">
            <li>Bảo hành khung vợt 12 tháng chính hãng</li>
            <li>Đổi trả miễn phí trong 7 ngày nếu lỗi nhà sản xuất</li>
            <li>16 tiêu chí kiểm định nghiêm ngặt cho vợt cũ</li>
            <li>Thanh toán chuyển khoản VietQR tự động khớp đơn</li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-muted font-normal">
        <div>© 2026 Smash Court. Bản quyền thuộc về hệ thống cửa hàng cầu lông chính hãng.</div>
        <div className="flex gap-4">
          <span>Điều khoản dịch vụ</span>
          <span>•</span>
          <span>Chính sách bảo mật</span>
        </div>
      </div>
    </footer>
  );
}
