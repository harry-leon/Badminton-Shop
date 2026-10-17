'use client';

import * as React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { 
  Mail, 
  Send, 
  ShoppingBag, 
  MapPin, 
  ShieldCheck, 
  Headphones, 
  ChevronRight, 
  ArrowUp, 
  CheckCircle, 
  Phone 
} from 'lucide-react';

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = React.useState('');
  const [subscribed, setSubscribed] = React.useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      return;
    }
    setSubscribed(true);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto w-full border-t border-line/40">
      {/* ============================================================== */}
      {/* 1. THANH TRÊN: LOGO + ĐĂNG KÝ NHẬN TIN (NỀN TRẮNG SÁNG)       */}
      {/* ============================================================== */}
      <div className="bg-[#FAF9F5] dark:bg-[#121815] border-b border-line/60 py-6">
        <Container className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            {/* Biểu tượng quả cầu lông */}
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img 
                src="/images/logo-shuttlecock-green-transparent.png" 
                alt="SmashCourt Logo" 
                className="w-9 h-9 object-contain"
              />
            </div>
            <div>
              <Link href="/" className="text-[22px] font-black tracking-tight text-ink flex items-center">
                Smash<span className="text-[#0F5132]">Court</span>
              </Link>
              <p className="text-[11.5px] text-muted font-normal">
                Vợt tốt. Trải nghiệm thật.
              </p>
            </div>
          </div>

          {/* Dải phân cách dọc nhẹ trên desktop */}
          <div className="hidden lg:block w-px h-10 bg-line" />

          {/* Khối Đăng ký nhận tin */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="flex items-center gap-3 text-left">
              <div className="w-11 h-11 rounded-2xl bg-[#E8EFEA] dark:bg-emerald-950/40 text-[#0F5132] flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 stroke-[1.8]" />
              </div>
              <div>
                <h4 className="text-[14px] font-bold text-ink leading-snug">
                  Đăng ký nhận tin
                </h4>
                <p className="text-[12px] text-muted font-normal">
                  Nhận ưu đãi mới nhất, đánh giá sản phẩm và tin tức cầu lông.
                </p>
              </div>
            </div>

            {/* Form ô nhập email */}
            <form onSubmit={handleSubscribe} className="relative flex items-center w-full sm:w-[360px] md:w-[400px]">
              <div className="absolute left-3.5 text-muted pointer-events-none">
                <Mail className="w-4 h-4 stroke-[1.8]" />
              </div>
              <input
                type="email"
                required
                placeholder="Nhập email của bạn"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={subscribed}
                className="w-full h-11 pl-10 pr-28 rounded-full bg-surface border border-line text-[13px] text-ink placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-[#0F5132] transition-all shadow-xs"
              />
              <button
                type="submit"
                disabled={subscribed}
                className="absolute right-1 top-1 bottom-1 px-4 rounded-full bg-[#0F5132] hover:bg-[#0c4027] text-white text-[12.5px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-75 shadow-xs"
              >
                <span>{subscribed ? 'Đã đăng ký' : 'Đăng ký'}</span>
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </Container>
      </div>

      {/* ============================================================== */}
      {/* 2. THÂN CHÍNH FOOTER: NỀN XANH RÊU ĐẬM (DEEP FOREST GREEN)    */}
      {/* ============================================================== */}
      <div className="relative bg-[#061C14] text-white py-12 lg:py-16 overflow-hidden">
        {/* Hình mờ quả cầu lông trang trí khổng lồ ở góc phải */}
        <div className="absolute -bottom-16 -right-16 w-96 h-96 pointer-events-none opacity-[0.06] select-none">
          <img 
            src="/images/logo-shuttlecock-white-transparent.png" 
            alt="" 
            className="w-full h-full object-contain"
          />
        </div>

        <Container className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 text-[13.5px]">
          {/* CỘT 1: THƯƠNG HIỆU & SOCIAL (3.5 Cột) */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <img 
                  src="/images/logo-shuttlecock-white-transparent.png" 
                  alt="SmashCourt Logo" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Smash<span className="text-emerald-400">Court</span>
              </span>
            </div>

            <p className="text-emerald-100/75 leading-relaxed text-[12.5px] pr-2">
              Hệ thống bán lẻ thiết bị cầu lông Yonex, Li-Ning, Victor chính hãng và sàn giao dịch vợt cũ kiểm định 16 tiêu chí tại quầy.
            </p>

            <div className="w-12 h-0.5 bg-emerald-700/60" />

            {/* Social Icons tròn nhỏ */}
            <div className="flex items-center gap-2 pt-1">
              {/* Facebook */}
              <a
                href="https://facebook.com/smashcourt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-700/50 hover:bg-emerald-600 hover:text-white text-emerald-200 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Facebook"
              >
                <span className="font-bold text-[13px]">f</span>
              </a>
              {/* YouTube */}
              <a
                href="https://youtube.com/@smashcourt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-700/50 hover:bg-emerald-600 hover:text-white text-emerald-200 flex items-center justify-center transition-all cursor-pointer"
                aria-label="YouTube"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              {/* Instagram */}
              <a
                href="https://instagram.com/smashcourt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-700/50 hover:bg-emerald-600 hover:text-white text-emerald-200 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Instagram"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.79-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* TikTok */}
              <a
                href="https://tiktok.com/@smashcourt"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-700/50 hover:bg-emerald-600 hover:text-white text-emerald-200 flex items-center justify-center transition-all cursor-pointer"
                aria-label="TikTok"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>
            </div>

            {/* Badge Cam kết 100% chính hãng */}
            <div className="pt-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-emerald-950/70 border border-emerald-700/60 hover:border-emerald-500 transition-colors cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                    100% Chính hãng
                  </div>
                  <div className="text-[11px] text-emerald-200/70 truncate">
                    Cam kết hàng thật, bảo hành rõ ràng
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400/60 group-hover:text-emerald-300 shrink-0" />
              </div>
            </div>
          </div>

          {/* CỘT 2: DANH MỤC SẢN PHẨM (3 Cột) */}
          <div className="lg:col-span-3 space-y-3.5">
            <div className="flex items-center gap-2 font-bold text-white text-[14.5px]">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span>Danh mục sản phẩm</span>
            </div>

            <ul className="space-y-2 text-[13px] text-emerald-100/80">
              {[
                { title: 'Vợt cầu lông chính hãng', href: '/vot-cau-long' },
                { title: 'Dây cước đan vợt lấy ngay', href: '/day-cuoc' },
                { title: 'Giày cầu lông tiêu chuẩn', href: '/giay-cau-long' },
                { title: 'Túi & Bao vợt cầu lông', href: '/tui-bao-vot' },
                { title: 'Quấn cán & Phụ kiện dán', href: '/quan-can' },
                { title: 'Vợt cũ đã kiểm định 16 mục', href: '/second-hand' },
              ].map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between py-1 text-emerald-100/80 hover:text-white transition-colors group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">{item.title}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500/60 group-hover:text-emerald-400 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 3: HỆ THỐNG CỬA HÀNG (3.5 Cột) */}
          <div className="lg:col-span-3 space-y-3.5">
            <div className="flex items-center gap-2 font-bold text-white text-[14.5px]">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Hệ thống cửa hàng</span>
            </div>

            <div className="space-y-3 text-[12.5px] text-emerald-100/80">
              {/* TP. HCM */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>TP. Hồ Chí Minh</span>
                </div>
                <p className="text-emerald-200/70 pl-5 leading-relaxed">
                  123 Nguyễn Thị Minh Khai, P. Bến Thành, Quận 1
                </p>
              </div>

              {/* Hà Nội */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Hà Nội</span>
                </div>
                <p className="text-emerald-200/70 pl-5 leading-relaxed">
                  45 Xuân Thủy, P. Dịch Vọng Hậu, Q. Cầu Giấy
                </p>
              </div>

              {/* Đà Nẵng */}
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-semibold text-white">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Đà Nẵng</span>
                </div>
                <p className="text-emerald-200/70 pl-5 leading-relaxed">
                  78 Nguyễn Văn Linh, P. Nam Dương, Q. Hải Châu
                </p>
              </div>

              {/* Hotline */}
              <div className="pt-2 pl-5">
                <a
                  href="tel:19006868"
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold text-[13px] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 fill-current" />
                  <span>Hotline: 1900 6868</span>
                  <span className="text-emerald-200/60 font-normal text-[11.5px]">(Miễn phí)</span>
                </a>
              </div>
            </div>
          </div>

          {/* CỘT 4: CHÍNH SÁCH & HỖ TRỢ (2.5 Cột) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Nhóm 1: Cam kết & Chính sách */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-white text-[14.5px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Cam kết &amp; Chính sách</span>
              </div>

              <ul className="space-y-1.5 text-[12.5px] text-emerald-100/80">
                {[
                  'Bảo hành khung vợt 12 tháng chính hãng',
                  'Đổi mới trong 7 ngày nếu lỗi nhà sản xuất',
                  '16 tiêu chí kiểm định nghiêm ngặt vợt cũ',
                  'Thanh toán chuyển khoản VietQR tự động',
                ].map((policy, pIdx) => (
                  <li key={pIdx} className="flex items-center justify-between py-0.5">
                    <span className="truncate pr-1">{policy}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500/50 shrink-0" />
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full h-px bg-emerald-800/40 my-2" />

            {/* Nhóm 2: Hỗ trợ khách hàng */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-bold text-white text-[14px]">
                <Headphones className="w-4 h-4 text-emerald-400" />
                <span>Hỗ trợ khách hàng</span>
              </div>

              <ul className="space-y-1.5 text-[12.5px]">
                <li>
                  <Link
                    href="/tuyen-dung"
                    className="flex items-center justify-between text-emerald-300 hover:text-white transition-colors group"
                  >
                    <span>Tuyển dụng nhân tài</span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500/60 group-hover:text-emerald-300 shrink-0" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/chi-nhanh"
                    className="flex items-center justify-between text-emerald-300 hover:text-white transition-colors group"
                  >
                    <span>Tìm chi nhánh gần nhất</span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500/60 group-hover:text-emerald-300 shrink-0" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </Container>

        {/* ============================================================== */}
        {/* 3. DÒNG CUỐI BẢN QUYỀN & LÊN ĐẦU TRANG                         */}
        {/* ============================================================== */}
        <Container className="relative z-10 pt-8 mt-10 border-t border-emerald-900/60 flex flex-col md:flex-row items-center justify-between gap-4 text-[12px] text-emerald-200/60">
          <div>
            © 2026 Smash Court. Bản quyền thuộc về hệ thống thiết bị cầu lông chính hãng.
          </div>

          <div className="flex items-center gap-6">
            <Link href="/gioi-thieu" className="hover:text-white transition-colors">
              Điều khoản dịch vụ
            </Link>
            <span className="text-emerald-800">|</span>
            <Link href="/tra-cuu-bao-hanh" className="hover:text-white transition-colors">
              Chính sách bảo mật
            </Link>

            {/* Nút Lên đầu trang dạng pill bo tròn theo ảnh mẫu */}
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white border border-emerald-700/60 transition-all cursor-pointer text-[12px] font-medium shadow-xs active:scale-95 ml-2"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Lên đầu trang</span>
            </button>
          </div>
        </Container>
      </div>
    </footer>
  );
}

export default Footer;
