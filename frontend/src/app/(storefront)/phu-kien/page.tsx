import type { Metadata } from 'next';
import Link from 'next/link';
import { queryDb } from '@/lib/db';
import ProductCatalogGrid, { ProductItem } from '../vot-cau-long/ProductCatalogGrid';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Phụ Kiện Cầu Lông — Chì Dán, Kính Bảo Hộ, Chặn Mồ Hôi | Smash Court',
  description: 'Đầy đủ phụ kiện tập luyện và thi đấu cầu lông: chì dán cân đầu vợt, băng chặn mồ hôi cổ tay, tất thể thao đệm dày, kéo cắt cước chuyên dụng.',
};

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AccessoryCatalogPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const rows = await queryDb<any>(
    'catalog_db',
    `SELECT p.id, p.name, p.slug, p.brand_id as brand, p.player_type, p.play_style,
            p.balance_category, p.shaft_stiffness, p.weight_classes, p.max_tension_lbs,
            p.image_url,
            COALESCE(MIN(s.price), 0) as price_from,
            p.image_url as second_image_url
     FROM products p
     LEFT JOIN skus s ON p.id = s.product_id
     WHERE p.is_active = true AND p.category_id = 'cat_accessory'
     GROUP BY p.id
     ORDER BY p.name ASC`
  );

  let categoryCounts: Record<string, number> = {};
  try {
    const countRows = await queryDb<{ category_id: string; count: string }>(
      'catalog_db',
      `SELECT category_id, COUNT(*) as count FROM products WHERE is_active = true GROUP BY category_id`
    );
    countRows.forEach((r) => {
      categoryCounts[r.category_id] = parseInt(r.count, 10);
    });
  } catch {}

  let stockByProduct: Record<string, string[]> = {};
  try {
    const stockRows = await queryDb<{ branch_id: string; sku: string }>(
      'inventory_db',
      `SELECT DISTINCT branch_id, sku FROM stock_levels WHERE (on_hand - reserved) > 0`
    );
    const skuRows = await queryDb<{ id: string; product_id: string }>(
      'catalog_db',
      `SELECT id, product_id FROM skus`
    );
    const skuToProd: Record<string, string> = {};
    skuRows.forEach((s) => {
      skuToProd[s.id] = s.product_id;
    });
    for (const r of stockRows) {
      const prodId = skuToProd[r.sku];
      if (prodId) {
        if (!stockByProduct[prodId]) stockByProduct[prodId] = [];
        if (!stockByProduct[prodId].includes(r.branch_id)) {
          stockByProduct[prodId].push(r.branch_id);
        }
      }
    }
  } catch (e) {
    console.error('Failed to map inventory branches:', e);
  }

  const products: ProductItem[] = rows.map((p) => {
    const normalizedBrand = p.brand ? p.brand.toUpperCase() : 'YONEX';
    const displayBrand = normalizedBrand === 'LINING' ? 'Li-Ning' : normalizedBrand === 'VICTOR' ? 'Victor' : 'Yonex';
    const price = parseInt(p.price_from as string, 10);
    const originalPrice = price > 100000 ? Math.round(price * 1.15) : undefined;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: displayBrand,
      rawBrand: normalizedBrand,
      playerType: p.play_style || p.player_type || 'Phụ kiện bổ trợ',
      playStyle: p.play_style || p.player_type || 'Phụ kiện bổ trợ',
      priceFrom: price,
      originalPrice,
      imageUrl: p.image_url,
      secondImageUrl: p.second_image_url || p.image_url,
      inStockBranches: stockByProduct[p.id] || ['BR_HCM_01', 'BR_HN_01', 'BR_DN_01'],
      rating: 4.9,
    };
  });

  return (
    <div className="py-8 sm:py-12">
      <Container>
        <nav className="text-[13px] text-muted mb-6 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">Phụ kiện cầu lông</span>
        </nav>

        <ProductCatalogGrid
          initialProducts={products}
          initialSearchParams={resolvedSearchParams}
          currentCategory="cat_accessory"
          categoryCounts={categoryCounts}
          basePath="/phu-kien"
        />
      </Container>
    </div>
  );
}
