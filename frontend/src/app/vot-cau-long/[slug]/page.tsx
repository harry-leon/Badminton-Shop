import type { Metadata } from 'next';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/-/g, ' ').toUpperCase();
  return {
    title: `${title} — Thông Số Kỹ Thuật & Giá Bán | Smash Court`,
    description: `Xem thông số chi tiết cây vợt ${title}, điểm cân bằng, độ cứng thân, sức căng tối đa và chính sách bảo hành 12 tháng tại hệ thống Smash Court.`,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  // Chi tiết sản phẩm mẫu động
  const product = {
    name: slug === 'yonex-astrox-99-pro' 
      ? 'Yonex Astrox 99 Pro Cherry Sunburst'
      : slug.replace(/-/g, ' ').toUpperCase(),
    brand: 'Yonex',
    category: 'Vợt cầu lông',
    price: 4250000,
    warrantyMonths: 12,
    playerType: 'Tấn công uy lực (Smash cắm sâu)',
    description: 'Yonex Astrox 99 Pro được trang bị công nghệ Rotational Generator System kết hợp vật liệu mới VOLUME CUT RESIN trong toàn bộ khung vợt, tối đa hóa lực truyền và độ phục hồi sau mỗi cú vung vợt.',
    imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1000',
    specs: {
      balancePointMm: 308, // Nặng đầu
      stiffness: 'Cứng',
      weight: '4U (83g)',
      gripSize: 'G5',
      maxTension: '28 lbs (12.7 kg)',
      origin: 'Nhật Bản (Made in Japan)',
    },
    branches: [
      { id: 'BR_HCM_01', name: 'Chi nhánh Quận 1, TP.HCM', stock: 'Còn hàng (8 chiếc)' },
      { id: 'BR_HN_01', name: 'Chi nhánh Cầu Giấy, Hà Nội', stock: 'Còn hàng (5 chiếc)' },
      { id: 'BR_DN_01', name: 'Chi nhánh Hải Châu, Đà Nẵng', stock: 'Còn ít (2 chiếc)' },
    ],
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.imageUrl,
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: product.brand,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'VND',
      price: product.price,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-6 flex items-center gap-2">
        <a href="/" className="hover:underline">Trang chủ</a>
        <span>/</span>
        <a href="/vot-cau-long" className="hover:underline">Vợt cầu lông</a>
        <span>/</span>
        <span className="font-semibold text-slate-800">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Cột ảnh sản phẩm */}
        <div>
          <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-4 left-4 bg-[#0F5132] text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
              Chính hãng 100%
            </span>
            <span className="absolute top-4 right-4 bg-emerald-800/90 text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full">
              Bảo hành {product.warrantyMonths} tháng
            </span>
          </div>
        </div>

        {/* Cột thông tin chi tiết */}
        <div className="space-y-6">
          <div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">
              {product.brand} • {product.playerType}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight leading-snug">
              {product.name}
            </h1>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-black text-[#0F5132]">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
              </span>
              <span className="text-xs text-slate-500">Đã bao gồm VAT</span>
            </div>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">
            {product.description}
          </p>

          {/* Thanh trực quan thông số vợt (Spec Bars) */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Thông số kỹ thuật thi đấu
            </h2>

            {/* Điểm cân bằng */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Điểm cân bằng</span>
                <span className="font-bold text-emerald-800">{product.specs.balancePointMm} mm (Nặng đầu - Tấn công)</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#0F5132] h-full rounded-full" style={{ width: '85%' }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Nhẹ đầu (285mm)</span>
                <span>Cân bằng (295mm)</span>
                <span>Nặng đầu (308mm)</span>
              </div>
            </div>

            {/* Độ cứng thân */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Độ cứng đũa vợt</span>
                <span className="font-bold text-emerald-800">{product.specs.stiffness}</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#16794C] h-full rounded-full" style={{ width: '80%' }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Dẻo</span>
                <span>Trung bình</span>
                <span>Cứng</span>
              </div>
            </div>

            {/* Chi tiết phụ */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-600 border-t border-slate-200">
              <div>Trọng lượng / Cán: <strong className="text-slate-900">{product.specs.weight} - {product.specs.gripSize}</strong></div>
              <div>Căng tối đa: <strong className="text-slate-900">{product.specs.maxTension}</strong></div>
              <div>Xuất xứ: <strong className="text-slate-900">{product.specs.origin}</strong></div>
              <div>Phân loại: <strong className="text-slate-900">Vợt mới chính hãng</strong></div>
            </div>
          </div>

          {/* Tồn kho chi nhánh thời gian thực */}
          <div className="border border-emerald-900/10 rounded-xl p-4 bg-emerald-50/50">
            <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-wide mb-3">
              Tồn kho thực tế tại các chi nhánh
            </h2>
            <div className="space-y-2 text-xs">
              {product.branches.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-1 border-b border-emerald-900/5 last:border-0">
                  <span className="text-slate-700 font-medium">{b.name}</span>
                  <span className="font-bold text-emerald-800">{b.stock}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Nút đặt hàng CTA */}
          <div className="flex gap-4 pt-2">
            <button
              className="flex-1 bg-[#C8F31D] text-[#0B1210] font-extrabold py-4 rounded-xl shadow-md hover:bg-lime-400 transition-all text-base tracking-wide"
            >
              Thêm vào giỏ hàng
            </button>
            <button
              className="px-6 py-4 border border-[#0F5132] text-[#0F5132] font-bold rounded-xl hover:bg-emerald-50 transition-all text-sm"
            >
              Nhận tại cửa hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
