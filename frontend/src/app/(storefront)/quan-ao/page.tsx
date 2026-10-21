import type { Metadata } from 'next';
import Link from 'next/link';
import { queryDb } from '@/lib/db';
import { getCatalogProducts } from '@/lib/api';
import ProductCatalogGrid, { ProductItem } from '../vot-cau-long/ProductCatalogGrid';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Quần Áo Thể Thao Cầu Lông — Áo Đấu Yonex, Li-Ning, Victor | Smash Court',
  description: 'Quần áo cầu lông vải thun lạnh co giãn 4 chiều, công nghệ thoát ẩm Very Cool: Áo đấu tuyển Yonex All England, Lining Tour, Victor Team.',
};

export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ApparelCatalogPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  let rows: any[] = [];
  try {
    rows = await queryDb<any>(
      'catalog_db',
      `SELECT p.id, p.name, p.slug, p.brand_id as brand, p.player_type, p.play_style,
              p.balance_category, p.shaft_stiffness, p.weight_classes, p.max_tension_lbs,
              p.image_url,
              COALESCE(MIN(s.price), 0) as price_from,
              p.image_url as second_image_url
       FROM products p
       LEFT JOIN skus s ON p.id = s.product_id
       WHERE p.is_active = true AND p.category_id = 'cat_apparel'
       GROUP BY p.id
       ORDER BY p.name ASC`
    );
  } catch (err) {
    console.error('[ApparelCatalogPage] queryDb error:', err);
  }

  if (!rows || rows.length === 0) {
    try {
      const apiRes = await getCatalogProducts({ category: 'cat_apparel', size: 50 });
      const items = apiRes?.data?.content || apiRes?.data || [];
      rows = items.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand?.id || p.brand?.name || 'yonex',
        player_type: p.playerType || p.playStyle || 'Thi đấu chuyên nghiệp',
        play_style: p.playStyle || null,
        image_url: p.imageUrl || '/images/categories/cat-ao-cau-long-v2.png',
        price_from: p.basePrice || 0,
        second_image_url: p.imageUrl || null,
      }));
    } catch (e) {
      console.error('[ApparelCatalogPage] Fallback API error:', e);
    }
  }

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
    const originalPrice = price > 300000 ? Math.round(price * 1.15) : undefined;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: displayBrand,
      rawBrand: normalizedBrand,
      playerType: p.play_style || p.player_type || 'Thoát ẩm Very Cool',
      playStyle: p.play_style || p.player_type || 'Thoát ẩm Very Cool',
      priceFrom: price,
      originalPrice,
      imageUrl: p.image_url,
      secondImageUrl: p.second_image_url || p.image_url,
      inStockBranches: stockByProduct[p.id] || ['BR_HCM_01', 'BR_HN_01', 'BR_DN_01'],
      rating: 4.8,
    };
  });

  return (
    <div className="py-8 sm:py-12">
      <Container>
        <nav className="text-[13px] text-muted mb-6 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">Quần áo thể thao</span>
        </nav>

        <ProductCatalogGrid
          initialProducts={products}
          initialSearchParams={resolvedSearchParams}
          currentCategory="cat_apparel"
          categoryCounts={categoryCounts}
          basePath="/quan-ao"
        />
      </Container>
    </div>
  );
}
