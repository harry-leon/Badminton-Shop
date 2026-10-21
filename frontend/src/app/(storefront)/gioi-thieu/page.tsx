import * as React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Award, 
  Users2, 
  Flame, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  Store,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { BRANCH_LIST } from '@/lib/branches-data';

export const metadata = {
  title: 'Giới thiệu về Hệ thống Cửa hàng Cầu lông SmashCourt',
  description: 'Tìm hiểu về SmashCourt - Hệ thống cửa hàng cầu lông chính hãng và sàn vợt cũ kiểm định 16 tiêu chí hàng đầu Việt Nam.',
};

export default function GioiThieuPage() {
  const branchCount = BRANCH_LIST.length;

  return (
    <div className="bg-bg min-h-screen py-8">
      <Container>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-muted mb-6">
          <Link href="/" className="hover:text-brand transition-colors">
            Trang chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-ink font-medium">Giới thiệu</span>
        </nav>

        {/* 2-Column Layout: Sidebar (Left) + Main Content (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ========================================================= */}
          {/* SIDEBAR TRÁI (ShopVNB Style: Danh mục tin & Bài xem nhiều) */}
          {/* ========================================================= */}
          <aside className="lg:col-span-3 order-2 lg:order-1 space-y-6">
            
            {/* Box 1: Danh mục thông tin */}
            <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs">
              <h3 className="font-bold text-ink text-[15px] uppercase tracking-wide pb-3 border-b-2 border-brand flex items-center gap-2">
                <span>DANH MỤC THÔNG TIN</span>
              </h3>
              <ul className="mt-3 space-y-1 text-[13px]">
                <li>
                  <Link 
                    href="/gioi-thieu" 
                    className="flex items-center justify-between text-brand font-semibold py-2.5 min-h-[44px] hover:translate-x-1 transition-transform touch-target-hit"
                  >
                    <span>Giới thiệu SmashCourt</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/tuyen-dung" 
                    className="flex items-center justify-between text-muted hover:text-brand py-2.5 min-h-[44px] hover:translate-x-1 transition-transform touch-target-hit"
                  >
                    <span>Cơ hội việc làm (Tuyển dụng)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-950/80 dark:text-red-300">
                      HOT
                    </span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/chi-nhanh" 
                    className="flex items-center justify-between text-muted hover:text-brand py-2.5 min-h-[44px] hover:translate-x-1 transition-transform touch-target-hit"
                  >
                    <span>Hệ thống chi nhánh toàn quốc</span>
                    <span className="text-[11px] text-muted">({branchCount})</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/tra-cuu-bao-hanh" 
                    className="flex items-center justify-between text-muted hover:text-brand py-2.5 min-h-[44px] hover:translate-x-1 transition-transform touch-target-hit"
                  >
                    <span>Tra cứu bảo hành điện tử</span>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/second-hand" 
                    className="flex items-center justify-between text-muted hover:text-brand py-2.5 min-h-[44px] hover:translate-x-1 transition-transform touch-target-hit"
                  >
                    <span>Quy chuẩn 16 tiêu chí vợt cũ</span>
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Box 2: Bài viết / Thông báo quan trọng */}
            <div className="bg-surface border border-line rounded-2xl p-5 shadow-xs">
              <h3 className="font-bold text-ink text-[14px] uppercase tracking-wide pb-3 border-b border-line flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                <span>BÀI VIẾT NỔI BẬT</span>
              </h3>
              <div className="mt-3 space-y-3.5 text-[13px]">
                <Link href="/second-hand" className="group block space-y-1">
                  <h4 className="font-medium text-ink group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                    Quy trình kiểm định nứt ngầm và đo sụt gen vợt cầu lông cũ tại SmashCourt
                  </h4>
                  <div className="text-[11px] text-muted flex items-center gap-2">
                    <Clock className="w-3 h-3" /> 15/10/2026
                  </div>
                </Link>

                <div className="border-t border-line/60 pt-3">
                  <Link href="/day-cuoc" className="group block space-y-1">
                    <h4 className="font-medium text-ink group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                      Đặc quyền đan vợt 4 nút theo tiêu chuẩn quốc tế Yonex lấy ngay sau 20 phút
                    </h4>
                    <div className="text-[11px] text-muted flex items-center gap-2">
                      <Clock className="w-3 h-3" /> 14/10/2026
                    </div>
                  </Link>
                </div>

                <div className="border-t border-line/60 pt-3">
                  <Link href="/tuyen-dung" className="group block space-y-1">
                    <h4 className="font-medium text-ink group-hover:text-brand transition-colors line-clamp-2 leading-snug">
                      SmashCourt tuyển dụng Nhân viên đan vợt và Quản lý cửa hàng tháng 10/2026
                    </h4>
                    <div className="text-[11px] text-muted flex items-center gap-2">
                      <Clock className="w-3 h-3" /> 12/10/2026
                    </div>
                  </Link>
                </div>
              </div>
            </div>

            {/* Box 3: Hotline & Hỗ trợ nhượng quyền */}
            <div className="bg-gradient-to-br from-brand/10 via-brand/5 to-transparent border border-brand/30 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center mb-3">
                <Store className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-ink text-[14px]">Hợp tác &amp; Nhượng quyền</h4>
              <p className="text-[12px] text-muted mt-1 leading-relaxed">
                Muốn cùng SmashCourt mở rộng hệ thống showroom cầu lông tại tỉnh thành của bạn?
              </p>
              <div className="mt-3 pt-3 border-t border-brand/20 space-y-2 text-[12px]">
                <div className="flex items-center gap-2 text-ink font-semibold">
                  <Phone className="w-3.5 h-3.5 text-brand" />
                  <span>Hotline: 0988 123 456</span>
                </div>
                <div className="flex items-center gap-2 text-muted">
                  <Mail className="w-3.5 h-3.5 text-brand" />
                  <span>franchise@smashcourt.vn</span>
                </div>
              </div>
            </div>

          </aside>

          {/* ========================================================= */}
          {/* CỘT NỘI DUNG CHÍNH (Right - Ảnh 3 ShopVNB Style) */}
          {/* ========================================================= */}
          <main className="lg:col-span-9 order-1 lg:order-2 bg-surface border border-line rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
            
            {/* Tiêu đề bài viết */}
            <div className="border-b border-line pb-6 space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-brand/10 text-brand border border-brand/20">
                <Building2 className="w-3.5 h-3.5" />
                Về Chúng Tôi
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
                Giới thiệu về Hệ thống Cửa hàng Cầu lông SmashCourt
              </h1>
              <p className="text-[13px] text-muted">
                Cập nhật lần cuối: Tháng 10/2026 · Hệ thống bán lẻ thể thao chuyên nghiệp
              </p>
            </div>

            {/* Đoạn mở đầu giới thiệu */}
            <div className="prose dark:prose-invert max-w-none text-[14px] sm:text-[15px] leading-relaxed text-ink/90 space-y-4 font-normal">
              <p className="font-medium text-ink text-[16px] leading-relaxed border-l-4 border-brand pl-4 py-1 bg-bg/50 rounded-r-xl">
                <strong>SmashCourt</strong> là hệ thống cửa hàng chuyên cung cấp dụng cụ thể thao cầu lông chính hãng hàng đầu tại Việt Nam. Khởi nguồn từ niềm đam mê cháy bỏng với bộ môn cầu lông, chúng tôi không ngừng nỗ lực để trở thành người bạn đồng hành tin cậy của cộng đồng lông thủ trên khắp cả nước.
              </p>

              <p>
                Với sứ mệnh <em>&ldquo;Nâng tầm trải nghiệm cầu lông Việt Nam&rdquo;</em>, SmashCourt luôn đặt chất lượng sản phẩm và sự hài lòng của khách hàng lên hàng đầu. Toàn bộ các dòng vợt, giày, phụ kiện, quần áo thể thao tại SmashCourt đều được nhập khẩu chính ngạch từ các thương hiệu số 1 thế giới như <strong>Yonex, Victor, Li-Ning, Mizuno, Lining, Apacs</strong>.
              </p>
            </div>

            {/* Khối 4 Giá trị cốt lõi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-bg border border-line space-y-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-ink text-[14px]">100% Chính Hãng Cam Kết</h3>
                <p className="text-[13px] text-muted leading-relaxed">
                  Đền bù gấp 10 lần giá trị nếu phát hiện hàng giả, hàng nhái. Bảo hành điện tử minh bạch qua số điện thoại mua hàng.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-bg border border-line space-y-2">
                <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-ink text-[14px]">Sàn Vợt Cũ 16 Tiêu Chí</h3>
                <p className="text-[13px] text-muted leading-relaxed">
                  Mô hình kiểm định vợt cũ độc quyền tại quầy: soi nứt ngầm vi chấn, kiểm tra sụp gen đũa vợt, mã khắc laser chính hãng.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-bg border border-line space-y-2">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-ink text-[14px]">Đan Cước Chuẩn Quốc Tế</h3>
                <p className="text-[13px] text-muted leading-relaxed">
                  Đội ngũ thợ đan vợt được đào tạo chuẩn 4 nút Yonex, máy đan điện tử công nghệ cao căn chỉnh cân chính xác từng pound.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-bg border border-line space-y-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Users2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-ink text-[14px]">Tư Vấn Chuyên Sâu Theo Lối Đánh</h3>
                <p className="text-[13px] text-muted leading-relaxed">
                  Đội ngũ nhân viên am hiểu kỹ thuật thi đấu, tư vấn chính xác theo lực cổ tay và lối chơi (tấn công, công thủ toàn diện, phản tạt).
                </p>
              </div>
            </div>

            {/* Quá trình hình thành và phát triển */}
            <div className="space-y-4 pt-4 border-t border-line">
              <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand" />
                Lịch Sử Hình Thành &amp; Tầm Nhìn
              </h2>
              <div className="space-y-3 text-[14px] leading-relaxed text-ink/80">
                <p>
                  Khởi đầu từ năm 2018 với một cửa hàng đan vợt và bán lẻ phụ kiện nhỏ tại Quận 1, TP. Hồ Chí Minh, SmashCourt đã nhanh chóng nhận được sự tin yêu của cộng đồng lông thủ phong trào và vận động viên bán chuyên nhờ kỹ thuật đan dây chuẩn xác và tinh thần phục vụ tận tâm.
                </p>
                <p>
                  Đến năm 2026, SmashCourt đã phát triển mạng lưới với nhiều chi nhánh tại các thành phố trọng điểm như TP. Hồ Chí Minh, Hà Nội, Đà Nẵng, Cần Thơ, Hải Phòng. Mỗi showroom SmashCourt được thiết kế theo tiêu chuẩn hiện đại, có không gian thử vợt, máy đo độ căng cước và khu vực trải nghiệm giày chuyên nghiệp.
                </p>
              </div>
            </div>

            {/* Mạng lưới chi nhánh trên toàn quốc */}
            <div className="space-y-4 pt-4 border-t border-line">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-brand" />
                    Hệ Thống Showroom SmashCourt
                  </h2>
                  <p className="text-[13px] text-muted">
                    Hiện diện tại các trục đường thể thao thuận tiện, mở cửa từ 08:30 đến 21:30 mỗi ngày
                  </p>
                </div>
                <Link
                  href="/chi-nhanh"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-[13px] font-semibold hover:bg-brand/90 transition-colors shrink-0"
                >
                  <span>Xem bản đồ chi tiết</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Grid các showroom tiêu biểu */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {BRANCH_LIST.map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl bg-bg border border-line hover:border-brand/40 transition-colors space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-ink text-[14px]">{b.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold">
                        {b.hours}
                      </span>
                    </div>
                    <div className="text-[13px] text-muted flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                      <span>{b.address}</span>
                    </div>
                    <div className="text-[13px] text-muted flex items-center gap-2 pt-1">
                      <Phone className="w-3.5 h-3.5 text-brand shrink-0" />
                      <a href={`tel:${b.phone}`} className="hover:text-brand font-medium">
                        {b.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Thông tin liên hệ và Ban điều hành */}
            <div className="bg-bg/80 border border-line rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-ink text-[15px]">Thông Tin Doanh Nghiệp</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] text-muted">
                <div>
                  <span className="font-semibold text-ink">Công ty:</span> CÔNG TY TNHH THỂ THAO SMASHCOURT VIỆT NAM
                </div>
                <div>
                  <span className="font-semibold text-ink">Mã số thuế:</span> 0318999888 do Sở KH&amp;ĐT TP.HCM cấp
                </div>
                <div>
                  <span className="font-semibold text-ink">Trụ sở:</span> 123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM
                </div>
                <div>
                  <span className="font-semibold text-ink">Email liên hệ:</span> cskh@smashcourt.vn
                </div>
              </div>
            </div>

            {/* Nút điều hướng chân trang */}
            <div className="pt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line">
              <Link 
                href="/tuyen-dung" 
                className="inline-flex items-center gap-2 text-brand font-semibold text-[14px] hover:underline"
              >
                <span>Gia nhập đội ngũ SmashCourt (Tuyển dụng)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link 
                href="/" 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink text-bg text-[13px] font-semibold hover:opacity-90 transition-opacity"
              >
                <span>Khám phá sản phẩm ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </main>

        </div>
      </Container>
    </div>
  );
}
