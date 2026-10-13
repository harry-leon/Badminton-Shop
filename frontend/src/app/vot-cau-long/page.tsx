import type { Metadata } from 'next';
import { queryDb } from '@/lib/db';
import ProductCatalogGrid, { ProductItem } from './ProductCatalogGrid';
import { ShieldCheck, Sparkles } from 'lucide-react';

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

  const products: ProductItem[] = rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand ? p.brand.toUpperCase() : 'YONEX',
    playerType: p.player_type || 'Công thủ toàn diện',
    priceFrom: parseInt(p.price_from as string, 10),
    imageUrl: p.image_url || '/images/products/yonex-astrox-99-pro.jpg',
  }));

  return (
    <div className="min-h-screen bg-[#F7F7F2]">
      {/* Header Banner */}
      <section className="bg-[#0F5132] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-emerald-900/30">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="text-xs text-emerald-200/70 mb-4 flex items-center gap-2">
            <a href="/" className="hover:underline hover:text-white">Trang chủ</a>
            <span>/</span>
            <span className="font-bold text-white">Vợt cầu lông chính hãng</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-[#C8F31D]/15 text-[#C8F31D] text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-[#C8F31D]/30">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Chính Hãng Phân Phối
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                Bộ Sưu Tập Vợt Cầu Lông Đỉnh Cao
              </h1>
              <p className="text-emerald-100/80 text-sm leading-relaxed">
                Đầy đủ các dòng vợt thi đấu cao cấp nhất từ Yonex, Li-Ning, Victor. Dữ liệu kho thời gian thực kết nối trực tiếp PostgreSQL 18. Bảo hành khung 12 tháng tại 3 chi nhánh toàn quốc.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 border border-white/15 self-start md:self-auto text-xs space-y-1">
              <div className="text-emerald-200">Sẵn sàng phục vụ:</div>
              <div className="text-[#C8F31D] font-black text-sm">{products.length} Mẫu Vợt Flagship</div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Grid with Filters */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ProductCatalogGrid initialProducts={products} />
      </main>
    </div>
  );
}
