import type { Metadata } from 'next';
import Link from 'next/link';
import { queryDb } from '@/lib/db';
import ProductCatalogGrid, { ProductItem } from './ProductCatalogGrid';
import { ChevronRight, ShieldCheck } from 'lucide-react';

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
  balance_point: string | number | null;
  stiffness: string | null;
  weights: string | null;
  max_tension: string | number | null;
}

export default async function RacketCatalogPage() {
  // Lấy dữ liệu sản phẩm trực tiếp từ PostgreSQL catalog_db (Zero-Mock)
  const rows = await queryDb<ProductRow>(
    'catalog_db',
    `SELECT p.id, p.name, p.slug, p.brand_id as brand, p.player_type, 
            p.image_url,
            COALESCE(MIN(s.price), 0) as price_from,
            COALESCE(AVG(s.balance_point_mm), 305) as balance_point,
            MIN(s.stiffness) as stiffness,
            STRING_AGG(DISTINCT s.weight, ', ') as weights,
            MAX(s.max_tension_lbs) as max_tension
     FROM products p
     LEFT JOIN skus s ON p.id = s.product_id
     WHERE p.is_active = true
     GROUP BY p.id
     ORDER BY p.name ASC`
  );

  const products: ProductItem[] = rows.map((p) => {
    const brandName = p.brand ? p.brand.charAt(0).toUpperCase() + p.brand.slice(1).toLowerCase() : 'Yonex';
    const normalizedBrand = p.brand ? p.brand.toUpperCase() : 'YONEX';
    const displayBrand = normalizedBrand === 'LINING' ? 'Li-Ning' : normalizedBrand === 'VICTOR' ? 'Victor' : 'Yonex';

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: displayBrand,
      rawBrand: normalizedBrand,
      playerType: p.player_type || 'Công thủ toàn diện',
      priceFrom: parseInt(p.price_from as string, 10),
      imageUrl: p.image_url || '/images/products/yonex-astrox-99-pro.jpg',
      balancePoint: Math.round(Number(p.balance_point || 305)),
      stiffness: p.stiffness || 'Cứng',
      weight: p.weights || '3U, 4U',
      maxTension: p.max_tension ? `${p.max_tension} lbs` : '28 lbs',
    };
  });

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted mb-4 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">Vợt cầu lông chính hãng</span>
        </nav>

        {/* Header trang danh mục theo phong cách Quiet Court */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 mb-8 border-b border-line">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[13px] text-brand font-normal">
              <ShieldCheck className="w-4 h-4" />
              <span>Phân phối chính hãng 100% · Bảo hành khung 12 tháng</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
              Vợt cầu lông chính hãng
            </h1>
            <p className="text-[14px] text-muted leading-relaxed font-normal">
              Bộ sưu tập vợt thi đấu cao cấp từ Yonex, Li-Ning và Victor. Tồn kho thời gian thực tại các chi nhánh, hỗ trợ đan cước lấy ngay và dịch vụ căng vợt điện tử.
            </p>
          </div>

          <div className="text-[13px] text-muted font-normal self-start md:self-auto bg-surface border border-line rounded-full px-4 py-1.5">
            Hiện có <span className="text-ink font-medium">{products.length}</span> mẫu vợt
          </div>
        </div>

        {/* Catalog Grid with Filters */}
        <ProductCatalogGrid initialProducts={products} />
      </div>
    </div>
  );
}
