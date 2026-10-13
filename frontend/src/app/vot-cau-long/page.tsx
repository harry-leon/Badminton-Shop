import type { Metadata } from 'next';
import { queryDb } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Vợt Cầu Lông Chính Hãng — Yonex, Lining, Victor | Smash Court',
  description: 'Danh mục vợt cầu lông chính hãng mới 100% bảo hành 12 tháng. Yonex Astrox, Nanoflare, Arcsaber; Lining Axforce, Halbertec; Victor Ryuga, Auraspeed.',
  alternates: {
    canonical: 'http://localhost:3000/vot-cau-long',
  },
};

export const revalidate = 0; // Trực tiếp từ PostgreSQL 18 catalog_db

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  brand: string;
  player_type: string;
  image_url: string;
  price_from: string | number;
}

export default async function RacketCatalogPage() {
  // Lấy dữ liệu sản phẩm trực tiếp từ PostgreSQL catalog_db (Zero-Mock)
  const rows = await queryDb<ProductRow>(
    'catalog_db',
    `SELECT p.id, p.name, p.slug, p.brand_id as brand, p.player_type, 
            p.image_url,
            COALESCE(MIN(s.price), 0) as price_from
     FROM products p
     LEFT JOIN skus s ON p.id = s.product_id
     WHERE p.is_active = true
     GROUP BY p.id
     ORDER BY p.name ASC`
  );

  const products = rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand ? p.brand.toUpperCase() : 'YONEX',
    playerType: p.player_type || 'Công thủ toàn diện',
    priceFrom: parseInt(p.price_from as string, 10),
    imageUrl: p.image_url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800',
  }));

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
            Dữ liệu trực tiếp từ PostgreSQL 18 catalog_db. Cam kết 100% chính hãng, bảo hành khung 12 tháng tại toàn bộ chi nhánh.
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
