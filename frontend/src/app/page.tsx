export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsStore',
    name: 'Smash Court — Hệ thống cầu lông chính hãng',
    description: 'Chuyên cung cấp vợt cầu lông Yonex, Lining, Victor chính hãng và thu mua vợt second-hand có kiểm định',
    currenciesAccepted: 'VND',
    paymentAccepted: 'Cash, Bank Transfer',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'TP. Hồ Chí Minh',
      addressCountry: 'VN',
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#0F5132] to-[#16794C] text-white py-16 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 bg-[#C8F31D]/20 text-[#C8F31D] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Kiểm định nghiêm ngặt • Cấp hạng A/B/C
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Sức Mạnh Trên Sân, <br/>
              <span className="text-[#C8F31D]">Uy Tín</span> Tuyệt Đối Tại Quầy.
            </h1>
            <p className="text-emerald-100/80 text-base">
              Cam kết 100% hàng chính hãng. Mỗi cây vợt cũ thu mua đều được nhân viên kiểm định qua checklist đa điểm, lưu trữ ảnh và bảo hành kết cấu khung độc lập.
            </p>
            <div className="pt-2 flex gap-4">
              <a
                href="/second-hand"
                className="bg-[#C8F31D] text-[#0B1210] font-bold px-6 py-3 rounded-lg shadow-md hover:bg-lime-400 transition-all hover:scale-105 inline-block text-sm"
              >
                Khám phá Vợt Cũ Kiểm Định
              </a>
              <a
                href="/vot-cau-long"
                className="border border-white/30 text-white font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-all inline-block text-sm"
              >
                Xem Vợt Mới
              </a>
            </div>
          </div>

          <div className="w-full md:w-96 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-white flex items-center justify-between">
              <span>Đặc quyền chuỗi cửa hàng</span>
              <span className="text-xs text-[#C8F31D] font-normal">3 Chi nhánh</span>
            </h2>
            <div className="space-y-3 text-xs text-emerald-100/90">
              <div className="flex gap-2">
                <span className="text-[#C8F31D] font-bold">✓</span>
                <span>Tồn kho thời gian thực từng chi nhánh (TP.HCM, HN, ĐN)</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#C8F31D] font-bold">✓</span>
                <span>Nhận tại cửa hàng bằng mã lấy hàng (Pickup Code)</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#C8F31D] font-bold">✓</span>
                <span>Chống bán vượt tồn kho đa luồng tranh chấp đồng thời</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#C8F31D] font-bold">✓</span>
                <span>Truy vết phân tán toàn trình với Correlation ID</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Second-hand Category Preview */}
      <section className="max-w-7xl mx-auto py-12 px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-emerald-950">Vợt Second-Hand Mới Về</h2>
            <p className="text-sm text-emerald-800/60">Mỗi chiếc là một sản phẩm duy nhất — số lượng 1 chiếc</p>
          </div>
          <a href="/second-hand" className="text-sm font-semibold text-[#0F5132] hover:underline">
            Xem tất cả →
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="absolute top-4 right-4 bg-emerald-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Hạng A
            </div>
            <div className="text-xs font-semibold text-emerald-700 uppercase mb-1">Yonex Astrox 99 Pro</div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Astrox 99 Pro 4U Cherry Sunburst</h3>
            <div className="text-sm text-slate-500 mb-4">Chi nhánh: Q.1, TP.HCM • Khung như mới 99%</div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block">Giá thanh lý</span>
                <span className="text-lg font-extrabold text-emerald-900">2.850.000 ₫</span>
              </div>
              <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded">
                Duy nhất 1 chiếc
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Hạng B
            </div>
            <div className="text-xs font-semibold text-emerald-700 uppercase mb-1">Lining Axforce 80</div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Axforce 80 Chen Long 3U</h3>
            <div className="text-sm text-slate-500 mb-4">Chi nhánh: Cầu Giấy, HN • Trầy nhẹ sơn đũa</div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block">Giá thanh lý</span>
                <span className="text-lg font-extrabold text-emerald-900">2.100.000 ₫</span>
              </div>
              <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded">
                Duy nhất 1 chiếc
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow relative">
            <div className="absolute top-4 right-4 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              Hạng C
            </div>
            <div className="text-xs font-semibold text-emerald-700 uppercase mb-1">Victor Thruster K</div>
            <h3 className="font-bold text-lg text-slate-900 mb-2">Thruster K BXR 4U</h3>
            <div className="text-sm text-slate-500 mb-4">Chi nhánh: Hải Châu, ĐN • Khung bền tốt</div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block">Giá thanh lý</span>
                <span className="text-lg font-extrabold text-emerald-900">1.450.000 ₫</span>
              </div>
              <span className="text-xs font-semibold bg-amber-50 text-amber-700 px-2 py-1 rounded">
                Duy nhất 1 chiếc
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
