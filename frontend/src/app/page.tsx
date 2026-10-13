import { ShieldCheck, Award, MapPin, ArrowRight, Zap, CheckCircle2, QrCode } from 'lucide-react';

export default function HomePage() {
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

  const featuredSecondhand = [
    {
      id: 'SH-20261013-0001',
      modelName: 'Yonex Astrox 88D Pro',
      grade: 'A',
      gradeText: 'Như mới 99%',
      branch: 'Quận 1, TP.HCM',
      price: 3100000,
      imageUrl: '/images/secondhand/sh-astrox-88d-pro.png',
      warranty: '60 ngày',
    },
    {
      id: 'SH-20261013-0002',
      modelName: 'Yonex Nanoflare 800 Pro',
      grade: 'B',
      gradeText: 'Ngoại hình 92-95%',
      branch: 'Cầu Giấy, Hà Nội',
      price: 2650000,
      imageUrl: '/images/secondhand/sh-nanoflare-800-pro.png',
      warranty: '30 ngày',
    },
    {
      id: 'SH-20261013-0003',
      modelName: 'Yonex Astrox 77 Pro',
      grade: 'C',
      gradeText: 'Khung nguyên bản 85%',
      branch: 'Hải Châu, Đà Nẵng',
      price: 2100000,
      imageUrl: '/images/secondhand/sh-astrox-77-pro.png',
      warranty: '30 ngày',
    },
  ];

  const flagshipRackets = [
    {
      name: 'Yonex Astrox 100ZZ Kurenai',
      slug: 'yonex-astrox-100zz',
      brand: 'YONEX',
      playerType: 'Tấn công toàn diện',
      priceFrom: 4490000,
      imageUrl: '/images/products/yonex-astrox-100zz.png',
    },
    {
      name: 'Yonex Nanoflare 1000Z',
      slug: 'yonex-nanoflare-1000z',
      brand: 'YONEX',
      playerType: 'Tốc độ phản tạt',
      priceFrom: 4390000,
      imageUrl: '/images/products/yonex-nanoflare-1000z.png',
    },
    {
      name: 'Yonex Arcsaber 11 Pro',
      slug: 'yonex-arcsaber-11-pro',
      brand: 'YONEX',
      playerType: 'Điều cầu kiểm soát',
      priceFrom: 4200000,
      imageUrl: '/images/products/yonex-arcsaber-11-pro.png',
    },
    {
      name: 'Victor Thruster Ryuga II',
      slug: 'victor-thruster-ryuga-ii',
      brand: 'VICTOR',
      playerType: 'Tấn công hủy diệt',
      priceFrom: 3850000,
      imageUrl: '/images/products/victor-thruster-ryuga-ii.webp',
    },
  ];

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
