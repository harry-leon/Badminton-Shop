import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { queryDb } from '@/lib/db';
import { getProductDetail, getCatalogProducts } from '@/lib/api';
import OrderSection from './OrderSection';
import { PriceTag } from '@/components/ui/PriceTag';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/ui/ProductCard';
import { ChevronRight, ShieldCheck, Star } from 'lucide-react';
import ProductGallery, { GalleryImage } from './components/ProductGallery';
import StickyAnchorBar from './components/StickyAnchorBar';
import SanitizedMarkdown from './components/SanitizedMarkdown';
import ProductSpecsTable from './components/ProductSpecsTable';
import ProductReviews from './components/ProductReviews';

export interface ProductDetailContainerProps {
  params: Promise<{ slug: string }>;
  categorySlug?: string;
  categoryName?: string;
  categoryHref?: string;
}

const DEFAULT_BRANCHES = [
  { id: 'BR_HCM_01', name: 'Chi nhánh Quận 1', city: 'TP. Hồ Chí Minh', address: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1' },
  { id: 'BR_HN_01', name: 'Chi nhánh Cầu Giấy', city: 'Hà Nội', address: '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy' },
  { id: 'BR_DN_01', name: 'Chi nhánh Hải Châu', city: 'Đà Nẵng', address: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu' },
];

export async function generateProductMetadata(
  paramsPromise: Promise<{ slug: string }>,
  categoryLabel: string = 'Sản phẩm'
): Promise<Metadata> {
  const { slug } = await paramsPromise;
  let title = slug.replace(/-/g, ' ');

  let fetchedName = '';
  try {
    const products = await queryDb<{ name: string; brand_id: string }>(
      'catalog_db',
      `SELECT name, brand_id FROM products WHERE slug = $1`,
      [slug]
    );
    if (products.length > 0 && products[0].name) {
      fetchedName = products[0].name;
    }
  } catch {}

  if (!fetchedName) {
    try {
      const apiRes = await getProductDetail(slug);
      if (apiRes?.data?.name) {
        fetchedName = apiRes.data.name;
      }
    } catch {}
  }

  if (fetchedName) {
    title = fetchedName;
  }

  return {
    title: `${title} — Thông Số & Giá Bán Chính Hãng | Smash Court`,
    description: `Xem thông số kỹ thuật chi tiết ${categoryLabel.toLowerCase()} ${title}, bảo hành chính hãng và đặt mua giữ chỗ tại hệ thống Smash Court.`,
  };
}

export default async function ProductDetailContainer({
  params,
  categorySlug = 'vot-cau-long',
  categoryName = 'Vợt cầu lông',
  categoryHref = '/vot-cau-long',
}: ProductDetailContainerProps) {
  const { slug } = await params;

  // 1. Lấy thông tin sản phẩm từ PostgreSQL catalog_db
  let productRows: any[] = [];
  try {
    productRows = await queryDb<any>(
      'catalog_db',
      `SELECT p.*, b.name as brand_name
       FROM products p
       LEFT JOIN brands b ON p.brand_id = b.id
       WHERE p.slug = $1 AND p.is_active = true`,
      [slug]
    );
  } catch (err) {
    console.error('[ProductDetailContainer] queryDb error:', err);
  }

  let p: any = productRows[0];

  // Resilient fallback: Gọi REST API Spring Boot nếu queryDb trực tiếp không có dữ liệu
  if (!p) {
    try {
      const apiRes = await getProductDetail(slug);
      if (apiRes?.data) {
        const d = apiRes.data;
        p = {
          id: d.id,
          name: d.name,
          slug: d.slug,
          brand_id: d.brand?.id || d.brand?.name || 'yonex',
          brand_name: d.brand?.name || d.brand?.id || 'Yonex',
          category_id: d.category?.id || categorySlug,
          description: d.description,
          player_type: d.playerType || d.playStyle || 'Chính hãng',
          play_style: d.playStyle,
          image_url: d.imageUrl || '/images/products/yonex-astrox-99-pro.jpg',
          base_price: d.basePrice || 0,
          warranty_months: d.warrantyMonths || 12,
          shaft_stiffness: d.shaftStiffness || 'Cứng',
          balance_category: d.balanceCategory || 'Cân bằng',
          max_tension_lbs: d.maxTensionLbs || 28,
          weight_classes: d.weightClasses || '3U, 4U',
          grip_sizes: d.gripSizes || 'G5',
          is_active: true,
        };
      }
    } catch (e) {
      console.error('[ProductDetailContainer] Fallback API error:', e);
    }
  }

  if (!p) {
    notFound();
  }

  // 2. Lấy 7 góc ảnh từ product_images
  let imageRows: any[] = [];
  try {
    imageRows = await queryDb<any>(
      'catalog_db',
      `SELECT id, angle, image_url, sort_order, is_primary
       FROM product_images
       WHERE product_id = $1
       ORDER BY sort_order ASC, id ASC`,
      [p.id]
    );
  } catch {}

  const galleryImages: GalleryImage[] = imageRows.length > 0
    ? imageRows.map((img) => ({
        id: img.id,
        angle: img.angle,
        image_url: img.image_url,
        sort_order: img.sort_order,
        is_primary: img.is_primary,
      }))
    : [
        {
          id: p.id,
          angle: 'FRONT',
          image_url: p.image_url || '/images/products/yonex-astrox-99-pro.jpg',
          sort_order: 1,
          is_primary: true,
        },
      ];

  // 3. Lấy danh sách biến thể SKU từ catalog_db
  let skuRows: any[] = [];
  try {
    skuRows = await queryDb<any>(
      'catalog_db',
      `SELECT * FROM skus WHERE product_id = $1 AND is_active = true ORDER BY price ASC, weight ASC`,
      [p.id]
    );
  } catch {}

  if (skuRows.length === 0) {
    const rawPrice = p.base_price || p.price_from || 1000000;
    skuRows = [
      {
        id: `${p.slug}-std`,
        weight: p.weight_classes ? p.weight_classes.split(',')[0].trim() : 'Tiêu chuẩn',
        grip_size: p.grip_sizes ? p.grip_sizes.split(',')[0].trim() : 'G5',
        balance_point_mm: 305,
        stiffness: p.shaft_stiffness || 'Cứng',
        max_tension_lbs: p.max_tension_lbs || 28,
        price: Number(rawPrice),
      },
    ];
  }

  const skuIds = skuRows.map((s) => s.id);

  // 4. Lấy thông tin chi nhánh
  let branchRows: any[] = [];
  try {
    branchRows = await queryDb<any>(
      'identity_db',
      `SELECT id, name, city, address FROM branches ORDER BY id ASC`
    );
  } catch {}

  const branchesData = branchRows.length > 0
    ? branchRows.map((b) => ({
        id: b.id,
        name: b.name,
        city: b.city,
        address: b.address,
      }))
    : DEFAULT_BRANCHES;

  // 5. Lấy tồn kho thời gian thực từ inventory_db
  let stockLevels: any[] = [];
  if (skuIds.length > 0) {
    try {
      stockLevels = await queryDb<any>(
        'inventory_db',
        `SELECT branch_id, sku, on_hand, reserved, (on_hand - reserved) as available
         FROM stock_levels
         WHERE sku = ANY($1)`,
        [skuIds]
      );
    } catch {}
  }

  if (stockLevels.length === 0) {
    // Fallback: Mặc định mỗi chi nhánh có 10 sản phẩm
    stockLevels = branchesData.map((b) => ({
      branch_id: b.id,
      sku: skuIds[0],
      on_hand: 10,
      reserved: 0,
      available: 10,
    }));
  }

  // 6. Lấy sản phẩm tương tự cùng danh mục
  let relatedRows: any[] = [];
  try {
    relatedRows = await queryDb<any>(
      'catalog_db',
      `SELECT p.id, p.name, p.slug, p.brand_id as brand, p.category_id, p.player_type, p.image_url,
              COALESCE(MIN(s.price), 0) as price_from
       FROM products p
       LEFT JOIN skus s ON p.id = s.product_id
       WHERE p.id != $1 AND (p.category_id = $2 OR p.category_id = $3) AND p.is_active = true
       GROUP BY p.id
       ORDER BY (p.brand_id = $4) DESC, p.name ASC
       LIMIT 4`,
      [p.id, p.category_id || categorySlug, categorySlug, p.brand_id]
    );
  } catch {}

  if (relatedRows.length === 0) {
    try {
      const apiRes = await getCatalogProducts({ category: p.category_id || categorySlug, size: 5 });
      const items = apiRes?.data?.content || apiRes?.data || [];
      relatedRows = items
        .filter((item: any) => item.slug !== p.slug && item.id !== p.id)
        .slice(0, 4)
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          brand: item.brand?.name || item.brand?.id || item.brand || 'Yonex',
          category_id: item.category?.id || item.category_id || categorySlug,
          player_type: item.playerType || item.playStyle || 'Chính hãng',
          price_from: item.basePrice || 0,
          image_url: item.imageUrl || '/images/products/yonex-astrox-99-pro.jpg',
        }));
    } catch {}
  }

  const defaultPrice = skuRows.length > 0 ? parseInt(skuRows[0].price, 10) : Number(p.base_price || 0);
  const defaultBalance = skuRows.length > 0 && skuRows[0].balance_point_mm ? skuRows[0].balance_point_mm : 305;
  const defaultStiffness = skuRows.length > 0 && skuRows[0].stiffness ? skuRows[0].stiffness : (p.shaft_stiffness || 'Cứng');
  const defaultTension = skuRows.length > 0 && skuRows[0].max_tension_lbs
    ? `${skuRows[0].max_tension_lbs} lbs`
    : (p.max_tension_lbs ? `${p.max_tension_lbs} lbs` : '28 lbs');

  const formatBrand = (b?: string) => {
    if (!b) return 'Yonex';
    const lower = b.toLowerCase();
    if (lower === 'lining') return 'Li-Ning';
    if (lower === 'victor') return 'Victor';
    if (lower === 'mizuno') return 'Mizuno';
    if (lower === 'apacs') return 'Apacs';
    if (lower === 'kawasaki') return 'Kawasaki';
    if (lower === 'yonex') return 'Yonex';
    return b.charAt(0).toUpperCase() + b.slice(1);
  };
  const brandDisplayName = p.brand_name || formatBrand(p.brand_id);

  const productData = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: brandDisplayName,
    playerType: p.player_type || 'Chính hãng',
    playStyle: p.play_style || p.player_type || 'Chính hãng',
    description: p.description || `${p.name} chính hãng phân phối tại hệ thống Smash Court.`,
    imageUrl: p.image_url || '/images/products/yonex-astrox-99-pro.jpg',
    warrantyMonths: p.warranty_months || 12,
    balancePoint: defaultBalance,
    stiffness: defaultStiffness,
    maxTension: defaultTension,
    lengthMm: p.length_mm || 675,
    frameShape: p.frame_shape || 'ISOMETRIC',
    level: p.level || 'Chuyên nghiệp',
  };

  const skusData = skuRows.map((s) => ({
    id: s.id,
    weight: s.weight || 'Tiêu chuẩn',
    grip_size: s.grip_size || 'G5',
    balance_point_mm: s.balance_point_mm || 305,
    stiffness: s.stiffness || 'Cứng',
    max_tension_lbs: s.max_tension_lbs || 28,
    price: parseInt(s.price, 10) || defaultPrice,
  }));

  const stockLevelsData = stockLevels.map((sl) => ({
    branch_id: sl.branch_id,
    sku: sl.sku,
    on_hand: parseInt(sl.on_hand, 10) || 0,
    reserved: parseInt(sl.reserved, 10) || 0,
    available: parseInt(sl.available, 10) || 0,
  }));

  const relatedProducts = relatedRows.map((r) => {
    const rawBrand = (r.brand || '').toLowerCase();
    const brandName = rawBrand === 'lining' ? 'Li-Ning' : rawBrand === 'victor' ? 'Victor' : rawBrand === 'mizuno' ? 'Mizuno' : (r.brand || 'Yonex');
    return {
      id: r.id,
      name: r.name,
      slug: r.slug,
      brand: brandName,
      category_id: r.category_id || categorySlug,
      playerType: r.player_type || 'Chính hãng',
      priceFrom: parseInt(r.price_from, 10) || 0,
      imageUrl: r.image_url || '/images/products/yonex-astrox-99-pro.jpg',
    };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productData.name,
    image: productData.imageUrl,
    description: productData.description,
    brand: {
      '@type': 'Brand',
      name: productData.brand,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'VND',
      price: defaultPrice,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  const detailedArticle = `
### Tổng quan & Định vị sản phẩm

Sản phẩm **${productData.name}** là một trong những sản phẩm biểu tượng đỉnh cao của thương hiệu **${productData.brand}**, được phân phối chính hãng 100% tại hệ thống cửa hàng Smash Court toàn quốc.

### Các ưu điểm công nghệ cốt lõi

- **Vật liệu cao cấp**: Thiết kế với cấu trúc gia cường bền bỉ, tối ưu độ đàn hồi và phân tán lực chấn động tối đa.
- **Tiêu chuẩn kiểm soát chất lượng**: Mỗi sản phẩm xuất xưởng đều tuân thủ các quy chuẩn nghiêm ngặt, đảm bảo độ chuẩn xác và độ bền trong thi đấu cường độ cao.
- **Chính sách bảo hành chính hãng**: Bảo hành ${productData.warrantyMonths} tháng tại toàn bộ các chi nhánh Smash Court trên toàn quốc.

### Khuyến nghị sử dụng & Trải nghiệm thi đấu

- **Đối tượng phù hợp**: Vận động viên chuyên nghiệp và người chơi phong trào yêu thích chất lượng hoàn thiện cao cấp.
- **Bảo quản đúng cách**: Tránh để sản phẩm trong cốp xe hoặc nơi có nhiệt độ cao để duy trì tuổi thọ vật liệu tốt nhất.
`;

  return (
    <div className="py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container>
        {/* Breadcrumb Navigation */}
        <nav className="text-[13px] text-muted mb-6 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <Link href={categoryHref} className="hover:text-ink transition-colors">{categoryName}</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">{productData.name}</span>
        </nav>

        {/* Layout 2 cột: Cột trái Sticky Gallery, Cột phải Thông tin & Đặt hàng */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12">
          <div className="lg:col-span-7 xl:col-span-7 lg:sticky lg:top-24 lg:self-start">
            <ProductGallery images={galleryImages} productName={productData.name} />
          </div>

          <div className="lg:col-span-5 xl:col-span-5 space-y-6">
            <div className="space-y-4">
              <div>
                <Link
                  href={`${categoryHref}?brand=${productData.brand}`}
                  className="text-[13px] text-muted hover:text-ink transition-colors font-normal inline-block mb-1"
                >
                  {productData.brand}
                </Link>
                <h1 className="text-2xl sm:text-3xl font-medium text-ink tracking-tight leading-snug">
                  {productData.name}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted">Chính hãng</Badge>
                <Badge variant="muted">Bảo hành {productData.warrantyMonths} tháng</Badge>
                <span className="text-[13px] text-muted font-normal flex items-center gap-1 ml-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-ink">4.9</span>
                  <span>(128 đánh giá)</span>
                </span>
              </div>

              <div className="flex items-baseline gap-3 pt-1 border-t border-line/60">
                <PriceTag amount={defaultPrice} size="lg" />
                <span className="text-[13px] text-muted font-normal">Đã bao gồm VAT</span>
              </div>

              <p className="text-[14px] text-muted leading-relaxed font-normal pt-2 border-t border-line/60">
                {productData.description}
              </p>
            </div>

            <OrderSection
              product={productData}
              skus={skusData}
              branches={branchesData}
              stockLevels={stockLevelsData}
            />
          </div>
        </div>

        <StickyAnchorBar className="my-8" />

        <div className="space-y-12">
          <section id="mo-ta" className="scroll-mt-32 py-8 border-b border-line">
            <h2 className="text-xl font-medium text-ink tracking-tight mb-4">
              Mô tả chi tiết sản phẩm
            </h2>
            <SanitizedMarkdown content={detailedArticle} />
          </section>

          <section id="thong-so" className="scroll-mt-32 py-8 border-b border-line">
            <h2 className="text-xl font-medium text-ink tracking-tight mb-6">
              Thông số kỹ thuật tiêu chuẩn
            </h2>
            <ProductSpecsTable product={productData} skus={skusData} />
          </section>

          <section id="danh-gia" className="scroll-mt-32 py-8 border-b border-line">
            <h2 className="text-xl font-medium text-ink tracking-tight mb-6">
              Đánh giá từ khách hàng đã mua
            </h2>
            <ProductReviews productName={productData.name} productSlug={productData.slug} />
          </section>

          <section id="bao-hanh" className="scroll-mt-32 py-8 border-b border-line">
            <h2 className="text-xl font-medium text-ink tracking-tight mb-6">
              Chính sách bảo hành & Giao hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[14px]">
              <div className="p-5 bg-surface rounded-2xl border border-line space-y-2">
                <div className="flex items-center gap-2 text-ink font-medium">
                  <ShieldCheck className="w-4 h-4 text-brand" />
                  <span>Bảo hành chính hãng {productData.warrantyMonths} tháng</span>
                </div>
                <p className="text-muted leading-relaxed font-normal text-[13px]">
                  Cam kết bảo hành chính hãng đối với các lỗi vật liệu từ nhà sản xuất. Tiếp nhận và xử lý thẩm định nhanh chóng tại toàn bộ 3 chi nhánh của Smash Court.
                </p>
              </div>

              <div className="p-5 bg-surface rounded-2xl border border-line space-y-2">
                <div className="text-ink font-medium">
                  Giao nhận linh hoạt & Tư vấn tận tâm
                </div>
                <p className="text-muted leading-relaxed font-normal text-[13px]">
                  Hỗ trợ nhận tại cửa hàng sau 15 phút xác nhận, hoặc giao hàng toàn quốc đóng hộp chuyên dụng chống sốc. Hotline hỗ trợ: <a href="tel:19006868" className="text-brand hover:underline font-medium">1900 6868</a>.
                </p>
              </div>
            </div>
          </section>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-line">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-ink tracking-tight">
                Có thể bạn cũng thích
              </h2>
              <Link
                href={categoryHref}
                className="text-[13px] text-muted hover:text-ink transition-colors font-normal"
              >
                Xem tất cả {categoryName.toLowerCase()} →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard
                  key={rel.id}
                  id={rel.id}
                  slug={rel.slug}
                  name={rel.name}
                  brand={rel.brand}
                  playerType={rel.playerType}
                  priceFrom={rel.priceFrom}
                  imageUrl={rel.imageUrl}
                  showCompare={true}
                  category={rel.category_id || categorySlug}
                />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
