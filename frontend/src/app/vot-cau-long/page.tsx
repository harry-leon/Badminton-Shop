import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vợt Cầu Lông Chính Hãng — Yonex, Lining, Victor | Smash Court',
  description: 'Danh mục vợt cầu lông chính hãng mới 100% bảo hành 12 tháng. Yonex Astrox, Nanoflare, Arcsaber; Lining Axforce, Halbertec; Victor Ryuga, Auraspeed.',
  alternates: {
    canonical: 'http://localhost:3000/vot-cau-long',
  },
};

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  playerType: string;
  priceFrom: number;
  imageUrl: string;
}

export default async function RacketCatalogPage() {
  // Lấy dữ liệu sản phẩm từ API Catalog
  let products: ProductItem[] = [];
  try {
    const res = await fetch('http://localhost:8080/api/v1/catalog/products', {
      next: { revalidate: 60 },
      headers: { 'X-Correlation-Id': crypto.randomUUID() },
    });
    if (res.ok) {
      products = await res.json();
    }
  } catch {
    // Fallback sang danh sách dự phòng khi backend đang khởi động
    products = [
      { id: '1', name: 'Yonex Astrox 99 Pro Cherry Sunburst', slug: 'yonex-astrox-99-pro', brand: 'Yonex', playerType: 'Tấn công uy lực', priceFrom: 4250000, imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800' },
      { id: '2', name: 'Yonex Astrox 100ZZ Kurenai', slug: 'yonex-astrox-100zz', brand: 'Yonex', playerType: 'Tấn công toàn diện', priceFrom: 4490000, imageUrl: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=800' },
      { id: '3', name: 'Yonex Astrox 88D Pro Gen 3', slug: 'yonex-astrox-88d-pro', brand: 'Yonex', playerType: 'Tấn công cầu sau', priceFrom: 4150000, imageUrl: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800' },
      { id: '4', name: 'Yonex Nanoflare 1000Z Lightning Yellow', slug: 'yonex-nanoflare-1000z', brand: 'Yonex', playerType: 'Tốc độ phản tạt', priceFrom: 4390000, imageUrl: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=800' },
      { id: '5', name: 'Yonex Arcsaber 11 Pro Grayish Pearl', slug: 'yonex-arcsaber-11-pro', brand: 'Yonex', playerType: 'Điều cầu kiểm soát', priceFrom: 4200000, imageUrl: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800' },
      { id: '6', name: 'Lining Axforce 80 Chen Long', slug: 'lining-axforce-80', brand: 'Lining', playerType: 'Tấn công uy lực', priceFrom: 3950000, imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800' },
      { id: '7', name: 'Lining Halbertec 8000 Yuta Watanabe', slug: 'lining-halbertec-8000', brand: 'Lining', playerType: 'Công thủ toàn diện', priceFrom: 4100000, imageUrl: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?w=800' },
      { id: '8', name: 'Victor Thruster Ryuga II Lee Zii Jia', slug: 'victor-thruster-ryuga-ii', brand: 'Victor', playerType: 'Tấn công hủy diệt', priceFrom: 3850000, imageUrl: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=800' },
      { id: '9', name: 'Victor Auraspeed 100X Mohammad Ahsan', slug: 'victor-auraspeed-100x', brand: 'Victor', playerType: 'Tốc độ phản tạt', priceFrom: 3750000, imageUrl: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800' },
    ];
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-6 flex items-center gap-2">
        <a href="/" className="hover:underline">Trang chủ</a>
        <span>/</span>
        <span className="font-semibold text-slate-800">Vợt cầu lông</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-950 tracking-tight">Vợt Cầu Lông Chính Hãng</h1>
          <p className="text-slate-600 text-sm mt-1">
            Hiển thị các dòng vợt thi đấu cao cấp, cam kết bảo hành khung chính hãng 12 tháng tại toàn bộ chi nhánh.
          </p>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Tìm thấy <span className="font-bold text-emerald-900">{products.length}</span> sản phẩm
        </div>
      </div>

      {/* Grid sản phẩm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <a
            key={product.id}
            href={`/vot-cau-long/${product.slug}`}
            className="group bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-emerald-600 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-4 relative">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 bg-[#0F5132] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  {product.brand}
                </span>
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                {product.playerType}
              </div>
              <h2 className="font-bold text-sm text-slate-900 group-hover:text-emerald-800 transition-colors line-clamp-2">
                {product.name}
              </h2>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block">Giá từ</span>
                <span className="text-base font-extrabold text-emerald-900">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.priceFrom)}
                </span>
              </div>
              <span className="text-xs font-semibold text-[#0F5132] group-hover:translate-x-1 transition-transform">
                Xem chi tiết →
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
