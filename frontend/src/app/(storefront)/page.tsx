import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { queryDb } from '@/lib/db';
import { ShieldCheck, Award, MapPin, ArrowRight, Zap, CheckCircle2, ChevronRight, HelpCircle, PhoneCall, Search } from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const metadata: Metadata = {
  title: 'Smash Court — Hệ thống vợt cầu lông chính hãng & Kiểm định vợt cũ',
  description: 'Hệ thống bán lẻ vợt cầu lông Yonex, Li-Ning, Victor chính hãng và sàn giao dịch vợt cũ kiểm định 16 tiêu chí độc lập tại 3 chi nhánh toàn quốc.',
};

export const revalidate = 0; // Luôn kết nối trực tiếp PostgreSQL 18 Zero-Mock

const branchLabels: Record<string, string> = {
  BR_HCM_01: 'Quận 1, TP.HCM',
  BR_HN_01: 'Cầu Giấy, Hà Nội',
  BR_DN_01: 'Hải Châu, Đà Nẵng',
};

export default async function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsStore',
    name: 'Smash Court — Hệ thống cầu lông chính hãng & Sàn kiểm định vợt cũ',
    description: 'Chuyên cung cấp vợt cầu lông Yonex, Li-Ning, Victor chính hãng và sàn giao dịch vợt cũ second-hand có kiểm định 16 tiêu chuẩn độc lập.',
    currenciesAccepted: 'VND',
    paymentAccepted: 'Cash, Bank Transfer, VietQR',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'TP. Hồ Chí Minh',
      addressCountry: 'VN',
    },
    branch: [
      {
        '@type': 'Store',
        name: 'Smash Court Quận 1',
        address: '120 Nguyễn Thị Minh Khai, P. Võ Thị Sáu, Quận 1, TP.HCM',
      },
      {
        '@type': 'Store',
        name: 'Smash Court Cầu Giấy',
        address: '45 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy, Hà Nội',
      },
      {
        '@type': 'Store',
        name: 'Smash Court Hải Châu',
        address: '88 Nguyễn Văn Linh, Nam Dương, Hải Châu, Đà Nẵng',
      },
    ],
  };

  // 1. Lấy vợt cũ đã duyệt mở bán (R7: APPROVED_FOR_SALE) trực tiếp từ secondhand_db
  let secondhandRackets: any[] = [];
  try {
    const shRows = await queryDb<any>(
      'secondhand_db',
      `SELECT id, serial_number, model_name, grade, resale_price, images_json, branch_id, condition_notes
       FROM secondhand_units
       WHERE status = 'APPROVED_FOR_SALE'
       ORDER BY created_at DESC
       LIMIT 3`
    );
    secondhandRackets = shRows.map((r) => {
      let images: string[] = [];
      try {
        images = JSON.parse(r.images_json || '[]');
      } catch {
        images = ['/images/secondhand/sh-nanoflare-800-pro.png'];
      }
      const imgUrl = images[0] || '/images/secondhand/sh-nanoflare-800-pro.png';
      return {
        id: r.id,
        serial: r.serial_number,
        name: r.model_name,
        slug: r.id,
        brand: 'Yonex',
        grade: r.grade,
        playerType: 'Độc bản đã kiểm định',
        price: Number(r.resale_price),
        imageUrl: imgUrl,
        branch: branchLabels[r.branch_id] || r.branch_id,
      };
    });
  } catch (err) {
    console.error('Lỗi khi tải vợt cũ từ secondhand_db:', err);
  }

  // 2. Lấy 4 mẫu vợt mới nổi bật trực tiếp từ catalog_db (Zero-Mock)
  let flagshipProducts: any[] = [];
  try {
    const prodRows = await queryDb<any>(
      'catalog_db',
      `SELECT p.id, p.name, p.slug, p.brand_id as brand, p.player_type, p.image_url,
              COALESCE(MIN(s.price), 0) as price_from
       FROM products p
       LEFT JOIN skus s ON p.id = s.product_id
       WHERE p.is_active = true
       GROUP BY p.id
       ORDER BY p.name ASC
       LIMIT 4`
    );
    flagshipProducts = prodRows.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      playerType: p.player_type,
      imageUrl: p.image_url,
      priceFrom: Number(p.price_from),
    }));
  } catch (err) {
    console.error('Lỗi khi tải vợt mới từ catalog_db:', err);
  }

  return (
    <div className="bg-bg text-ink min-h-screen">
      {/* Schema.org SportsStore JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. HERO SECTION (Phương án A: Nền sáng ngà #F5F4F0) */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-24 border-b border-line bg-surface/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Cột chữ */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-line text-[13px] text-muted font-normal select-none">
                <span className="w-2 h-2 rounded-full bg-brand" />
                <span>Hệ thống cầu lông chính hãng toàn quốc</span>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-ink leading-[1.12]">
                  Vợt chính hãng, nhận tại cửa hàng gần bạn.
                </h1>
                <p className="text-[16px] sm:text-[18px] text-muted leading-relaxed max-w-xl font-normal">
                  Phân phối chính thức Yonex, Li-Ning, Victor. Sàn vợt cũ kiểm định 16 tiêu chí tại quầy với tình trạng minh bạch từng chiếc.
                </p>
              </div>

              {/* Nút hành động */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/vot-cau-long"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-full bg-ink text-bg text-[15px] font-medium hover:opacity-90 transition-opacity"
                >
                  Xem vợt mới
                </Link>
                <Link
                  href="/second-hand"
                  className="inline-flex items-center justify-center h-12 px-7 rounded-full border border-line bg-surface text-ink text-[15px] font-medium hover:bg-bg transition-colors"
                >
                  Vợt cũ đã kiểm định
                </Link>
              </div>

              {/* Tóm tắt nhanh */}
              <div className="pt-4 border-t border-line/80 flex flex-wrap items-center gap-6 text-[13px] text-muted font-normal">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                  Bảo hành khung 12 tháng
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                  Đổi trả 7 ngày
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-brand shrink-0" />
                  3 chi nhánh nhận hàng ngay
                </span>
              </div>
            </div>

            {/* Cột ảnh vợt Hero lớn */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full aspect-square max-w-md sm:max-w-lg rounded-3xl bg-[#EFECE6] dark:bg-surface p-8 flex items-center justify-center overflow-hidden border border-line">
                <Image
                  src="/images/products/yonex-astrox-99-pro.jpg"
                  alt="Yonex Astrox 99 Pro Flagship Racket"
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 450px"
                  className="object-contain mix-blend-multiply dark:mix-blend-normal p-6"
                />
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-surface/90 backdrop-blur-sm rounded-xl border border-line flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-ink">Yonex Astrox 99 Pro</div>
                    <div className="text-[12px] text-muted">Dòng vợt thiên công thi đấu</div>
                  </div>
                  <span className="text-[14px] font-medium text-ink">3.950.000 ₫</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. DẢI TIN CẬY (TRUST STRIP) */}
      <section className="py-10 border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center text-brand shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[14px] font-medium text-ink">100% Chính hãng</div>
                <div className="text-[13px] text-muted leading-relaxed">Phân phối Yonex, Victor, Li-Ning</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center text-brand shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[14px] font-medium text-ink">Kiểm định tại quầy</div>
                <div className="text-[13px] text-muted leading-relaxed">16 tiêu chí cho vợt cũ độc bản</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center text-brand shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[14px] font-medium text-ink">3 Chi nhánh toàn quốc</div>
                <div className="text-[13px] text-muted leading-relaxed">Hà Nội, Đà Nẵng, TP.HCM</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-bg flex items-center justify-center text-brand shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-[14px] font-medium text-ink">Bảo hành điện tử</div>
                <div className="text-[13px] text-muted leading-relaxed">Tra cứu minh bạch theo số điện thoại</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CHỌN VỢT THEO LỐI CHƠI (PLAYSTYLE SELECTOR) */}
      <section className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-1">
              <span className="text-[13px] font-medium text-brand">Định hình phong cách</span>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
                Chọn vợt phù hợp với lối đánh của bạn
              </h2>
            </div>
            <Link
              href="/vot-cau-long"
              className="text-[14px] font-medium text-ink hover:underline inline-flex items-center gap-1"
            >
              <span>Xem tất cả mẫu vợt</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/vot-cau-long?playstyle=THIÊN+CÔNG"
              className="group p-6 sm:p-8 rounded-2xl bg-surface border border-line hover:border-ink/30 transition-all flex flex-col justify-between space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[13px] text-muted font-normal">Head Heavy · Đũa cứng</span>
                <h3 className="text-xl font-medium text-ink group-hover:text-brand transition-colors">
                  Thiên công uy lực
                </h3>
                <p className="text-[14px] text-muted leading-relaxed font-normal">
                  Đầu vợt đầm, thân cứng trợ lực cho các cú đập cầu cắm sân và tấn công dồn ép từ cuối sân.
                </p>
              </div>
              <div className="flex items-center justify-between text-[13px] text-ink font-medium pt-4 border-t border-line">
                <span>Khám phá dòng thiên công</span>
                <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/vot-cau-long?playstyle=CÂN+BẰNG"
              className="group p-6 sm:p-8 rounded-2xl bg-surface border border-line hover:border-ink/30 transition-all flex flex-col justify-between space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[13px] text-muted font-normal">Even Balance · Linh hoạt</span>
                <h3 className="text-xl font-medium text-ink group-hover:text-brand transition-colors">
                  Công thủ toàn diện
                </h3>
                <p className="text-[14px] text-muted leading-relaxed font-normal">
                  Cân bằng trọng lượng hoàn hảo, dễ thuần, linh hoạt chuyển đổi giữa gài lưới và ve cầu thoát hiểm.
                </p>
              </div>
              <div className="flex items-center justify-between text-[13px] text-ink font-medium pt-4 border-t border-line">
                <span>Khám phá dòng cân bằng</span>
                <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/vot-cau-long?playstyle=THIÊN+THỦ"
              className="group p-6 sm:p-8 rounded-2xl bg-surface border border-line hover:border-ink/30 transition-all flex flex-col justify-between space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[13px] text-muted font-normal">Head Light · Tốc độ cao</span>
                <h3 className="text-xl font-medium text-ink group-hover:text-brand transition-colors">
                  Phản tạt tốc độ
                </h3>
                <p className="text-[14px] text-muted leading-relaxed font-normal">
                  Đầu nhẹ, thân đũa siêu đàn hồi, tối ưu tốc độ vung vợt trong các pha đôi công chớp nhoáng trên lưới.
                </p>
              </div>
              <div className="flex items-center justify-between text-[13px] text-ink font-medium pt-4 border-t border-line">
                <span>Khám phá dòng thiên thủ</span>
                <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. HÀNG MỚI VỀ (NEW ARRIVALS CAROUSEL) */}
      <section className="py-16 sm:py-20 border-b border-line bg-surface/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-1">
              <span className="text-[13px] font-medium text-brand">Bộ sưu tập nổi bật</span>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
                Các mẫu vợt thi đấu được săn đón
              </h2>
            </div>
            <Link
              href="/vot-cau-long"
              className="text-[14px] font-medium text-ink hover:underline inline-flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {flagshipProducts.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                slug={p.slug}
                name={p.name}
                brand={p.brand}
                playerType={p.playerType}
                priceFrom={p.priceFrom}
                imageUrl={p.imageUrl}
                badgeText={p.brand}
                specSummary={p.playerType}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 5. THƯƠNG HIỆU MARQUEE */}
      <section className="py-8 border-b border-line bg-bg overflow-hidden select-none">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-around gap-8 text-[15px] sm:text-[18px] font-medium text-muted">
          <span className="hover:text-ink transition-colors">YONEX</span>
          <span>•</span>
          <span className="hover:text-ink transition-colors">LI-NING</span>
          <span>•</span>
          <span className="hover:text-ink transition-colors">VICTOR</span>
          <span>•</span>
          <span className="hover:text-ink transition-colors">MIZUNO</span>
        </div>
      </section>

      {/* 6. VỢT CŨ ĐÃ KIỂM ĐỊNH (SECOND-HAND SECTION) */}
      <section className="py-16 sm:py-24 border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[13px] font-medium text-brand">Quy trình minh bạch</span>
            <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-ink">
              Vợt cũ có kiểm định chất lượng tại quầy
            </h2>
            <p className="text-[16px] text-muted leading-relaxed font-normal">
              Mỗi cây vợt thu mua đều được kỹ thuật viên kiểm định 16 tiêu chí, chụp rõ từng vết xước và dán tem bảo hành riêng từng chiếc.
            </p>
          </div>

          {/* 3 Bước kiểm định */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-line space-y-3">
              <div className="w-8 h-8 rounded-full bg-bg border border-line flex items-center justify-center text-[13px] font-medium text-ink">
                1
              </div>
              <h4 className="text-[16px] font-medium text-ink">Thu mua tại quầy</h4>
              <p className="text-[14px] text-muted leading-relaxed font-normal">
                Kiểm tra hóa đơn gốc, đối chiếu mã nón serial với cơ sở dữ liệu phân phối chính hãng.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line space-y-3">
              <div className="w-8 h-8 rounded-full bg-bg border border-line flex items-center justify-center text-[13px] font-medium text-ink">
                2
              </div>
              <h4 className="text-[16px] font-medium text-ink">Kiểm định 16 tiêu chí</h4>
              <p className="text-[14px] text-muted leading-relaxed font-normal">
                Rà soát vết nứt ngầm khung, độ biến dạng đũa vợt, độ mòn gen cước và phân hạng A/B/C minh bạch.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-line space-y-3">
              <div className="w-8 h-8 rounded-full bg-bg border border-line flex items-center justify-center text-[13px] font-medium text-ink">
                3
              </div>
              <h4 className="text-[16px] font-medium text-ink">Bảo hành độc bản</h4>
              <p className="text-[14px] text-muted leading-relaxed font-normal">
                Mỗi cây vợt là độc nhất (Unique Unit), cấp mã niêm phong riêng và lưu snapshot điều kiện bảo hành.
              </p>
            </div>
          </div>

          {/* Danh sách vợt cũ vừa lên sàn */}
          <div className="space-y-6 pt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-ink">Mẫu vợt vừa được kiểm định mở bán</h3>
              <Link href="/second-hand" className="text-[14px] font-medium text-ink hover:underline">
                Xem sàn vợt cũ →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {secondhandRackets.map((r) => (
                <ProductCard
                  key={r.id}
                  id={r.id}
                  slug={r.slug}
                  name={r.name}
                  brand={r.brand}
                  playerType={r.playerType}
                  priceFrom={r.price}
                  imageUrl={r.imageUrl}
                  isSecondHand
                  grade={r.grade}
                  specSummary={`Serial: ${r.serial}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. HỆ THỐNG CỬA HÀNG & GIỜ MỞ CỬA */}
      <section className="py-16 sm:py-20 border-b border-line bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-xl space-y-2">
            <span className="text-[13px] font-medium text-brand">Hệ thống chi nhánh</span>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
              Trực tiếp trải nghiệm và nhận vợt tại cửa hàng
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-bg border border-line space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[16px] font-medium text-ink">Chi nhánh Quận 1</h4>
                <Badge variant="brand">TP. Hồ Chí Minh</Badge>
              </div>
              <p className="text-[14px] text-muted font-normal leading-relaxed">
                120 Nguyễn Thị Minh Khai, P. Võ Thị Sáu, Quận 1
              </p>
              <div className="text-[13px] text-muted font-normal pt-2 border-t border-line">
                Mở cửa: 08:30 – 21:30 hàng ngày
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-bg border border-line space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[16px] font-medium text-ink">Chi nhánh Cầu Giấy</h4>
                <Badge variant="brand">Hà Nội</Badge>
              </div>
              <p className="text-[14px] text-muted font-normal leading-relaxed">
                45 Xuân Thủy, Dịch Vọng Hậu, Cầu Giấy
              </p>
              <div className="text-[13px] text-muted font-normal pt-2 border-t border-line">
                Mở cửa: 08:30 – 21:30 hàng ngày
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-bg border border-line space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[16px] font-medium text-ink">Chi nhánh Hải Châu</h4>
                <Badge variant="brand">Đà Nẵng</Badge>
              </div>
              <p className="text-[14px] text-muted font-normal leading-relaxed">
                88 Nguyễn Văn Linh, Nam Dương, Hải Châu
              </p>
              <div className="text-[13px] text-muted font-normal pt-2 border-t border-line">
                Mở cửa: 08:30 – 21:30 hàng ngày
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TRA CỨU BẢO HÀNH NHANH (FAST LOOKUP WIDGET) */}
      <section className="py-16 sm:py-20 border-b border-line bg-surface/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="space-y-2">
            <span className="text-[13px] font-medium text-brand">Hậu mãi chu đáo</span>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
              Tra cứu tiến độ bảo hành điện tử
            </h2>
            <p className="text-[15px] text-muted font-normal max-w-lg mx-auto">
              Nhập số điện thoại mua hàng để kiểm tra thời hạn bảo hành khung vợt và tiến độ xử lý khiếu nại.
            </p>
          </div>

          <form
            action="/tra-cuu-bao-hanh"
            method="GET"
            className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto"
          >
            <input
              type="text"
              name="phone"
              placeholder="Nhập số điện thoại mua hàng..."
              className="w-full h-12 px-5 rounded-full bg-surface border border-line text-[14px] text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink"
              required
            />
            <button
              type="submit"
              className="w-full sm:w-auto h-12 px-7 rounded-full bg-ink text-bg text-[14px] font-medium hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
            >
              Tra cứu
            </button>
          </form>
        </div>
      </section>

      {/* 9. CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION) */}
      <section className="py-16 sm:py-20 border-b border-line">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[13px] font-medium text-brand">Giải đáp thắc mắc</span>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
              Câu hỏi thường gặp
            </h2>
          </div>

          <div className="space-y-3">
            <details className="p-5 rounded-2xl bg-surface border border-line group">
              <summary className="font-medium text-ink text-[15px] cursor-pointer flex justify-between items-center list-none select-none">
                <span>Chính sách bảo hành vợt mới áp dụng như thế nào?</span>
                <ChevronRight className="w-4 h-4 text-muted group-open:rotate-90 transition-transform" />
              </summary>
              <p className="pt-3 text-[14px] text-muted leading-relaxed font-normal border-t border-line/60 mt-3">
                Toàn bộ vợt mới 100% được bảo hành chính hãng khung vợt 12 tháng nếu phát sinh lỗi do nhà sản xuất (nứt tự nhiên, lỗi carbon). Lỗi va chạm đối kháng trên sân sẽ được hỗ trợ hàn carbon hoặc trợ giá đổi cây mới.
              </p>
            </details>

            <details className="p-5 rounded-2xl bg-surface border border-line group">
              <summary className="font-medium text-ink text-[15px] cursor-pointer flex justify-between items-center list-none select-none">
                <span>Vợt cũ kiểm định Hạng A, B, C khác nhau thế nào?</span>
                <ChevronRight className="w-4 h-4 text-muted group-open:rotate-90 transition-transform" />
              </summary>
              <p className="pt-3 text-[14px] text-muted leading-relaxed font-normal border-t border-line/60 mt-3">
                Hạng A là vợt đẹp 98-99%, hầu như không xước xát. Hạng B có trầy sơn nhẹ nhưng khung vợt nguyên bản 100%. Hạng C có vết đấu kiếm nông đã được kỹ thuật viên thử tải đạt chuẩn thi đấu. Cả 3 hạng đều được bảo hành kết cấu 3 tháng.
              </p>
            </details>

            <details className="p-5 rounded-2xl bg-surface border border-line group">
              <summary className="font-medium text-ink text-[15px] cursor-pointer flex justify-between items-center list-none select-none">
                <span>Tôi có thể đến cửa hàng căng cước và nhận vợt ngay không?</span>
                <ChevronRight className="w-4 h-4 text-muted group-open:rotate-90 transition-transform" />
              </summary>
              <p className="pt-3 text-[14px] text-muted leading-relaxed font-normal border-t border-line/60 mt-3">
                Có. Bạn có thể chọn hình thức nhận tại 1 trong 3 chi nhánh. Kỹ thuật viên sẽ đo lực căng cước bằng máy điện tử chuẩn xác và hoàn tất trong vòng 30 phút.
              </p>
            </details>

            <details className="p-5 rounded-2xl bg-surface border border-line group">
              <summary className="font-medium text-ink text-[15px] cursor-pointer flex justify-between items-center list-none select-none">
                <span>Làm sao để biết tình trạng tồn kho trên website có chính xác không?</span>
                <ChevronRight className="w-4 h-4 text-muted group-open:rotate-90 transition-transform" />
              </summary>
              <p className="pt-3 text-[14px] text-muted leading-relaxed font-normal border-t border-line/60 mt-3">
                Dữ liệu tồn kho được đồng bộ thời gian thực với hệ thống kho chi nhánh. Khi bạn tạo đơn thanh toán VietQR, hệ thống sẽ tự động giữ hàng ngay lập tức để không ai có thể mua trùng.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* 10. KÊU GỌI CUỐI TRANG (FINAL CTA) */}
      <section className="py-16 sm:py-24 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-ink">
            Sẵn sàng nâng tầm trận cầu của bạn?
          </h2>
          <p className="text-[16px] text-muted font-normal leading-relaxed">
            Khám phá ngay các mẫu vợt chất lượng cao với chính sách bảo hành an tâm tuyệt đối.
          </p>
          <div className="pt-2">
            <Link
              href="/vot-cau-long"
              className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-ink text-bg text-[15px] font-medium hover:opacity-90 transition-opacity"
            >
              Khám phá bộ sưu tập vợt
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
