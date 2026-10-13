import type { Metadata } from 'next';
import { queryDb } from '@/lib/db';
import { ShieldCheck, Award, MapPin, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Smash Court — Hệ thống cầu lông chính hãng & Sàn kiểm định vợt cũ',
  description: 'Chuyên cung cấp vợt cầu lông Yonex, Lining, Victor chính hãng và sàn giao dịch vợt cũ second-hand có kiểm định 16 tiêu chuẩn độc lập tại 3 chi nhánh toàn quốc.',
};

export const revalidate = 0; // Trực tiếp từ PostgreSQL 18 Zero-Mock

const branchLabels: Record<string, string> = {
  BR_HCM_01: 'Quận 1, TP.HCM',
  BR_HN_01: 'Cầu Giấy, Hà Nội',
  BR_DN_01: 'Hải Châu, Đà Nẵng',
};

export default async function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsStore',
    name: 'Smash Court — Hệ thống cầu lông chính hãng & Kiểm định vợt cũ',
    description: 'Chuyên cung cấp vợt cầu lông Yonex, Lining, Victor chính hãng và sàn giao dịch vợt cũ second-hand có kiểm định 16 tiêu chuẩn độc lập.',
    currenciesAccepted: 'VND',
    paymentAccepted: 'Cash, Bank Transfer, VietQR',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'TP. Hồ Chí Minh',
      addressCountry: 'VN',
    },
  };

  // 1. Lấy vợt cũ đã duyệt mở bán (R7: APPROVED_FOR_SALE) trực tiếp từ secondhand_db
  const secondhandRows = await queryDb<any>(
    'secondhand_db',
    `SELECT id, model_name, grade, branch_id, resale_price, warranty_days, condition_notes, images_json
     FROM secondhand_units
     WHERE status = 'APPROVED_FOR_SALE'
     ORDER BY created_at DESC
     LIMIT 3`
  );

  const featuredSecondhand = secondhandRows.map((unit) => {
    let images: string[] = [];
    try {
      images = JSON.parse(unit.images_json || '[]');
    } catch {
      images = ['/images/secondhand/sh-nanoflare-800-pro.png'];
    }
    const imageUrl = images[0] || '/images/secondhand/sh-nanoflare-800-pro.png';
    const gradeText = unit.grade === 'A' ? 'Như mới 98-99%' : unit.grade === 'B' ? 'Ngoại hình 92-95%' : 'Khung nguyên bản 85%';
    return {
      id: unit.id,
      modelName: unit.model_name,
      grade: unit.grade,
      gradeText,
      branch: branchLabels[unit.branch_id] || unit.branch_id,
      price: parseInt(unit.resale_price, 10),
      imageUrl,
      warranty: `${unit.warranty_days} ngày`,
    };
  });

  // 2. Lấy 4 mẫu vợt mới flagship từ catalog_db
  const catalogRows = await queryDb<any>(
    'catalog_db',
    `SELECT p.id, p.name, p.slug, p.player_type, p.image_url, b.name as brand_name,
            COALESCE(MIN(s.price), 0) as price_from
     FROM products p
     LEFT JOIN brands b ON p.brand_id = b.id
     LEFT JOIN skus s ON p.id = s.product_id
     WHERE p.is_active = true
     GROUP BY p.id, b.name
     ORDER BY p.name ASC
     LIMIT 4`
  );

  const flagshipRackets = catalogRows.map((r) => ({
    name: r.name,
    slug: r.slug,
    brand: r.brand_name || 'YONEX',
    playerType: r.player_type || 'Công thủ toàn diện',
    priceFrom: parseInt(r.price_from, 10),
    imageUrl: r.image_url || '/images/products/yonex-astrox-99-pro.jpg',
  }));

  return (
    <div className="min-h-screen bg-[#F7F7F2]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="bg-[#0F5132] text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-b border-emerald-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(#C8F31D_1px,transparent_1px)] [background-size:28px_28px] opacity-10"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
          <div className="space-y-5 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-[#C8F31D]/15 text-[#C8F31D] text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider border border-[#C8F31D]/30 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#C8F31D]" /> Kiểm Định Độc Lập • Minh Bạch Tuyệt Đối
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
              Sức Mạnh Trên Sân, <br />
              <span className="text-[#C8F31D]">Uy Tín</span> Tại Quầy.
            </h1>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              Hệ thống bán lẻ vợt cầu lông chính hãng và sàn giao dịch vợt cũ kiểm định chuẩn quốc tế. Tồn kho thời gian thực tại 3 chi nhánh TP.HCM, Hà Nội và Đà Nẵng, bảo vệ khách hàng khỏi nguy cơ hàng giả và nứt gãy ngầm.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <a
                href="/second-hand"
                className="bg-[#C8F31D] text-[#0B1210] font-black px-6 py-3.5 rounded-2xl shadow-md hover:bg-lime-400 transition-all hover:scale-105 inline-flex items-center gap-2 text-sm cursor-pointer"
              >
                Khám Phá Sàn Vợt Cũ <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/vot-cau-long"
                className="bg-white/10 text-white font-bold px-6 py-3.5 rounded-2xl border border-white/20 hover:bg-white/20 transition-all inline-flex items-center gap-2 text-sm cursor-pointer"
              >
                Xem Vợt Mới 100%
              </a>
            </div>
          </div>

          {/* Quick System Highlights Card */}
          <div className="w-full lg:w-96 p-6 sm:p-8 rounded-3xl bg-white/10 backdrop-blur-md border border-white/15 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <span className="text-base font-black text-white">Đặc Quyền Smash Court</span>
              <span className="text-xs text-[#C8F31D] font-bold">3 Chi Nhánh</span>
            </div>
            <div className="space-y-3.5 text-xs text-emerald-100">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C8F31D] shrink-0 mt-0.5" />
                <span><strong>Khóa kho nguyên tử R1:</strong> Không bán vượt tồn kho dưới tải tranh chấp cao.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C8F31D] shrink-0 mt-0.5" />
                <span><strong>Đơn vị độc bản R2:</strong> Mỗi chiếc vợt cũ chỉ có đúng 1 sản phẩm tại chi nhánh.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C8F31D] shrink-0 mt-0.5" />
                <span><strong>Thanh toán VietQR động:</strong> Tự động sinh QR và giải phóng sau 30 phút.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#C8F31D] shrink-0 mt-0.5" />
                <span><strong>Bảo hành bất biến R9:</strong> Snapshot đầy đủ chính sách vào từng dòng đơn hàng.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Second-hand Section */}
      <section className="max-w-7xl mx-auto py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-stone-200">
          <div>
            <div className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#0F5132]" /> Tiết Kiệm & An Tâm
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#1A2420] tracking-tight">
              Sàn Vợt Cũ Kiểm Định Mới Về
            </h2>
          </div>
          <a
            href="/second-hand"
            className="text-xs sm:text-sm font-black text-[#0F5132] hover:text-emerald-700 flex items-center gap-1 group self-start sm:self-auto"
          >
            Xem tất cả vợt cũ <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {featuredSecondhand.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-emerald-600/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="relative h-64 bg-linear-to-b from-stone-50 via-white to-emerald-50/25 flex items-center justify-center p-6 border-b border-stone-100">
                  <img
                    src={item.imageUrl}
                    alt={item.modelName}
                    className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="bg-[#0F5132] text-[#C8F31D] text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
                      Hạng {item.grade}
                    </span>
                    <span className="bg-stone-900/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      {item.id}
                    </span>
                  </div>
                </div>

                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-1 text-xs text-stone-500">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{item.branch}</span>
                  </div>
                  <h3 className="font-black text-base text-stone-900 group-hover:text-[#0F5132] transition-colors">
                    {item.modelName}
                  </h3>
                  <p className="text-xs text-stone-500">{item.gradeText} • Bảo hành {item.warranty}</p>
                </div>
              </div>

              <div className="p-5 pt-0">
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold block uppercase">Giá niêm yết</span>
                    <span className="text-lg font-black text-[#0F5132]">
                      {item.price.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                  <a
                    href="/second-hand"
                    className="bg-[#0F5132] hover:bg-[#16794C] text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all"
                  >
                    Xem Chi Tiết
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Flagship Rackets Showcase */}
      <section className="bg-stone-100/70 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 border-y border-stone-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-stone-200">
            <div>
              <div className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#0F5132]" /> Hàng Đầu Thế Giới
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#1A2420] tracking-tight">
                Vợt Mới 100% Phổ Biến Nhất
              </h2>
            </div>
            <a
              href="/vot-cau-long"
              className="text-xs sm:text-sm font-black text-[#0F5132] hover:text-emerald-700 flex items-center gap-1 group self-start sm:self-auto"
            >
              Xem toàn bộ danh mục <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {flagshipRackets.map((p) => (
              <a
                key={p.slug}
                href={`/vot-cau-long/${p.slug}`}
                className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:shadow-xl hover:border-emerald-600/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="aspect-square bg-linear-to-b from-stone-50 via-white to-emerald-50/20 rounded-2xl overflow-hidden mb-4 relative flex items-center justify-center p-4 border border-stone-100">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-[#0F5132] text-[#C8F31D] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {p.brand}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1">
                    {p.playerType}
                  </div>
                  <h3 className="font-black text-sm text-stone-900 group-hover:text-[#0F5132] transition-colors line-clamp-2 leading-snug">
                    {p.name}
                  </h3>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold block uppercase">Giá từ</span>
                    <span className="text-base font-black text-[#0F5132]">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.priceFrom)}
                    </span>
                  </div>
                  <span className="text-xs font-black text-[#0F5132] group-hover:translate-x-1 transition-transform">
                    Chi tiết →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
