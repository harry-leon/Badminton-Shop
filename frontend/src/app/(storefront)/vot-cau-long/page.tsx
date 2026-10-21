import type { Metadata } from 'next';
import Link from 'next/link';
import { queryDb } from '@/lib/db';
import { getCatalogProducts } from '@/lib/api';
import ProductCatalogGrid, { ProductItem } from './ProductCatalogGrid';
import { ChevronRight, ShieldCheck } from 'lucide-react';
import { Container } from '@/components/ui/Container';

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
  play_style: string | null;
  balance_category: string | null;
  shaft_stiffness: string | null;
  weight_classes: string | null;
  max_tension_lbs: number | null;
  image_url: string;
  second_image_url: string | null;
  price_from: string | number;
  balance_point: string | number | null;
  sku_stiffness: string | null;
  sku_weights: string | null;
  sku_max_tension: string | number | null;
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RacketCatalogPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  // 1. Lấy dữ liệu sản phẩm kèm ảnh phụ góc BACK từ catalog_db
  let rows: ProductRow[] = [];
  try {
    rows = await queryDb<ProductRow>(
      'catalog_db',
      `SELECT p.id, p.name, p.slug, p.brand_id as brand, p.player_type, p.play_style,
              p.balance_category, p.shaft_stiffness, p.weight_classes, p.max_tension_lbs,
              p.image_url,
              COALESCE(MIN(s.price), 0) as price_from,
              COALESCE(AVG(s.balance_point_mm), 305) as balance_point,
              MIN(s.stiffness) as sku_stiffness,
              STRING_AGG(DISTINCT s.weight, ', ') as sku_weights,
              MAX(s.max_tension_lbs) as sku_max_tension,
              COALESCE(
                (SELECT pi.image_url 
                 FROM product_images pi 
                 WHERE pi.product_id = p.id AND pi.angle = 'BACK' 
                 LIMIT 1),
                p.image_url
              ) as second_image_url
       FROM products p
       LEFT JOIN skus s ON p.id = s.product_id
       WHERE p.is_active = true AND p.category_id = 'cat_racket'
       GROUP BY p.id
       ORDER BY p.name ASC`
    );
  } catch (err) {
    console.error('[RacketCatalogPage] queryDb error:', err);
  }

  // Resilient fallback: nếu queryDb trả về rỗng trên Cloudflare Workers Edge, gọi REST API từ Backend
  if (!rows || rows.length === 0) {
    try {
      const apiRes = await getCatalogProducts({ category: 'cat_racket', size: 50 });
      const items = apiRes?.data?.content || apiRes?.data || [];
      rows = items.map((p: any) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand?.id || p.brand?.name || p.brand || 'yonex',
        player_type: p.playerType || p.playStyle || 'Công thủ toàn diện',
        play_style: p.playStyle || null,
        balance_category: p.balanceCategory || null,
        shaft_stiffness: p.shaftStiffness || 'Cứng',
        weight_classes: p.weightClasses || '3U, 4U',
        max_tension_lbs: p.maxTensionLbs || 28,
        image_url: p.imageUrl || '/images/products/yonex-astrox-99-pro.jpg',
        second_image_url: null,
        price_from: p.basePrice || 0,
        balance_point: 305,
        sku_stiffness: p.shaftStiffness || 'Cứng',
        sku_weights: p.weightClasses || '3U, 4U',
        sku_max_tension: p.maxTensionLbs || 28,
      }));
    } catch (e) {
      console.error('[RacketCatalogPage] Fallback API error:', e);
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

  // 2. Lấy danh sách tồn kho theo chi nhánh từ inventory_db
  let stockByProduct: Record<string, string[]> = {};
  try {
    const stockRows = await queryDb<{ branch_id: string; product_id: string }>(
      'inventory_db',
      `SELECT DISTINCT sl.branch_id, s.product_id
       FROM stock_levels sl
       JOIN dblink('dbname=catalog_db port=5432 user=postgres', 'SELECT id, product_id FROM skus') 
            AS s(id varchar, product_id uuid) ON sl.sku = s.id
       WHERE (sl.on_hand - sl.reserved) > 0`
    );
    for (const r of stockRows) {
      if (!stockByProduct[r.product_id]) stockByProduct[r.product_id] = [];
      if (!stockByProduct[r.product_id].includes(r.branch_id)) {
        stockByProduct[r.product_id].push(r.branch_id);
      }
    }
  } catch {
    // Fallback nếu dblink không kích hoạt: query riêng và map
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
  }

  const products: ProductItem[] = rows.map((p) => {
    const brandName = p.brand ? p.brand.charAt(0).toUpperCase() + p.brand.slice(1).toLowerCase() : 'Yonex';
    const normalizedBrand = p.brand ? p.brand.toUpperCase() : 'YONEX';
    const displayBrand = normalizedBrand === 'LINING' ? 'Li-Ning' : normalizedBrand === 'VICTOR' ? 'Victor' : 'Yonex';

    const price = parseInt(p.price_from as string, 10);
    // Sản phẩm có giá niêm yết ban đầu để tính % giảm giá và hiển thị giá gốc gạch ngang
    const discountMap: Record<string, number> = {
      'lining-halbertec-8000': 4400000,
      'yonex-astrox-100zz': 4800000,
      'yonex-arcsaber-11-pro': 4300000,
      'victor-thruster-ryuga-ii': 4100000,
    };
    const originalPrice = discountMap[p.slug] || undefined;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: displayBrand,
      rawBrand: normalizedBrand,
      playerType: p.play_style || p.player_type || 'Công thủ toàn diện',
      playStyle: p.play_style || p.player_type || 'Công thủ toàn diện',
      priceFrom: price,
      originalPrice,
      imageUrl: p.image_url || '/images/products/yonex-astrox-99-pro.jpg',
      secondImageUrl: p.second_image_url && p.second_image_url !== p.image_url
        ? p.second_image_url
        : `${p.image_url || '/images/products/yonex-astrox-99-pro.jpg'}?angle=back`,
      balancePoint: Math.round(Number(p.balance_point || 305)),
      balanceCategory: p.balance_category || (Number(p.balance_point) >= 305 ? 'Nặng đầu' : 'Cân bằng'),
      stiffness: p.shaft_stiffness || p.sku_stiffness || 'Cứng',
      weight: p.weight_classes || p.sku_weights || '3U, 4U',
      maxTension: p.max_tension_lbs ? `${p.max_tension_lbs} lbs` : (p.sku_max_tension ? `${p.sku_max_tension} lbs` : '28 lbs'),
      inStockBranches: stockByProduct[p.id] || [],
      rating: p.slug === 'yonex-astrox-99-pro' ? 4.9 : 4.8,
      salesCount: p.slug === 'yonex-astrox-99-pro' ? 142 : p.slug === 'yonex-astrox-100zz' ? 128 : p.slug === 'yonex-arcsaber-11-pro' ? 95 : 36,
      isBestSeller: ['yonex-astrox-99-pro', 'yonex-astrox-100zz', 'yonex-arcsaber-11-pro', 'lining-axforce-80'].includes(p.slug),
    };
  });

  return (
    <div className="py-8 sm:py-12">
      <Container>
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted mb-6 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">Vợt cầu lông chính hãng</span>
        </nav>

        {/* Catalog Grid with 280px left sidebar and Mobile Vaul Bottom Sheet */}
        <ProductCatalogGrid
          initialProducts={products}
          initialSearchParams={resolvedSearchParams}
          currentCategory="cat_racket"
          categoryCounts={categoryCounts}
          basePath="/vot-cau-long"
        />
      </Container>
    </div>
  );
}
