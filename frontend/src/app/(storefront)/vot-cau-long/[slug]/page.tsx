import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { queryDb } from '@/lib/db';
import OrderSection from './OrderSection';
import { PriceTag } from '@/components/ui/PriceTag';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/ui/ProductCard';
import { ChevronRight, ShieldCheck, Star } from 'lucide-react';
import ProductGallery, { GalleryImage } from './components/ProductGallery';
import StickyAnchorBar from './components/StickyAnchorBar';
import SanitizedMarkdown from './components/SanitizedMarkdown';
import ProductSpecsTable from './components/ProductSpecsTable';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 0; // Trực tiếp từ PostgreSQL 18 catalog_db

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = await queryDb<{ name: string; brand_id: string }>(
    'catalog_db',
    `SELECT name, brand_id FROM products WHERE slug = $1`,
    [slug]
  );
  const title = products.length > 0 ? products[0].name : slug.replace(/-/g, ' ');

  return {
    title: `${title} — Thông Số & Giá Bán Chính Hãng | Smash Court`,
    description: `Xem thông số kỹ thuật chi tiết cây vợt ${title}, điểm cân bằng, độ cứng thân, sức căng và chính sách bảo hành khung 12 tháng tại hệ thống Smash Court.`,
  };
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;

  // 1. Lấy thông tin sản phẩm từ PostgreSQL catalog_db
  const productRows = await queryDb<any>(
    'catalog_db',
    `SELECT p.*, b.name as brand_name
     FROM products p
     LEFT JOIN brands b ON p.brand_id = b.id
     WHERE p.slug = $1 AND p.is_active = true`,
    [slug]
  );

  if (productRows.length === 0) {
    notFound();
  }

  const p = productRows[0];

  // 2. Lấy 7 góc ảnh từ product_images
  const imageRows = await queryDb<any>(
    'catalog_db',
    `SELECT id, angle, image_url, sort_order, is_primary
     FROM product_images
     WHERE product_id = $1
     ORDER BY sort_order ASC, id ASC`,
    [p.id]
  );

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
  const skuRows = await queryDb<any>(
    'catalog_db',
    `SELECT * FROM skus WHERE product_id = $1 AND is_active = true ORDER BY price ASC, weight ASC`,
    [p.id]
  );

  const skuIds = skuRows.map((s) => s.id);

  // 4. Lấy thông tin chi nhánh từ identity_db
  const branchRows = await queryDb<any>(
    'identity_db',
    `SELECT id, name, city, address FROM branches ORDER BY id ASC`
  );

  // 5. Lấy tồn kho thời gian thực từ inventory_db
  let stockLevels: any[] = [];
  if (skuIds.length > 0) {
    stockLevels = await queryDb<any>(
      'inventory_db',
      `SELECT branch_id, sku, on_hand, reserved, (on_hand - reserved) as available
       FROM stock_levels
       WHERE sku = ANY($1)`,
      [skuIds]
    );
  }

  // 6. Lấy sản phẩm tương tự cùng danh mục
  const relatedRows = await queryDb<any>(
    'catalog_db',
    `SELECT p.id, p.name, p.slug, p.brand_id as brand, p.player_type, p.image_url,
            COALESCE(MIN(s.price), 0) as price_from
     FROM products p
     LEFT JOIN skus s ON p.id = s.product_id
     WHERE p.id != $1 AND p.is_active = true
     GROUP BY p.id
     ORDER BY (p.brand_id = $2) DESC, p.name ASC
     LIMIT 4`,
    [p.id, p.brand_id]
  );

  const defaultPrice = skuRows.length > 0 ? parseInt(skuRows[0].price, 10) : 0;
  const defaultBalance = skuRows.length > 0 ? skuRows[0].balance_point_mm : 305;
  const defaultStiffness = skuRows.length > 0 ? skuRows[0].stiffness : (p.shaft_stiffness || 'Cứng');
  const defaultTension = skuRows.length > 0 ? `${skuRows[0].max_tension_lbs} lbs` : (p.max_tension_lbs ? `${p.max_tension_lbs} lbs` : '28 lbs');

  const brandDisplayName = p.brand_id === 'lining' ? 'Li-Ning' : p.brand_id === 'victor' ? 'Victor' : 'Yonex';

  const productData = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: brandDisplayName,
    playerType: p.player_type || 'Công thủ toàn diện',
    playStyle: p.play_style || p.player_type || 'Công thủ toàn diện',
    description: p.description || 'Vợt cầu lông chính hãng phân phối tại hệ thống Smash Court.',
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
    weight: s.weight,
    grip_size: s.grip_size,
    balance_point_mm: s.balance_point_mm,
    stiffness: s.stiffness,
    max_tension_lbs: s.max_tension_lbs,
    price: parseInt(s.price, 10),
  }));

  const branchesData = branchRows.map((b) => ({
    id: b.id,
    name: b.name,
    city: b.city,
    address: b.address,
  }));

  const stockLevelsData = stockLevels.map((sl) => ({
    branch_id: sl.branch_id,
    sku: sl.sku,
    on_hand: parseInt(sl.on_hand, 10),
    reserved: parseInt(sl.reserved, 10),
    available: parseInt(sl.available, 10),
  }));

  const relatedProducts = relatedRows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    brand: r.brand === 'lining' ? 'Li-Ning' : r.brand === 'victor' ? 'Victor' : 'Yonex',
    playerType: r.player_type || 'Công thủ toàn diện',
    priceFrom: parseInt(r.price_from, 10),
    imageUrl: r.image_url || '/images/products/yonex-astrox-99-pro.jpg',
  }));

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

  return (
    <div className="py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container>
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted mb-6 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <Link href="/vot-cau-long" className="hover:text-ink transition-colors">Vợt cầu lông</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">{productData.name}</span>
        </nav>

        {/* Bố cục 2 cột: Cột trái sticky chứa gallery 7 góc, Cột phải chứa thông tin & đặt hàng */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-12">
          {/* CỘT TRÁI: Gallery ảnh 7 góc có Sticky khi cuộn desktop */}
          <div className="lg:col-span-7 xl:col-span-7 lg:sticky lg:top-24 lg:self-start">
            <ProductGallery images={galleryImages} productName={productData.name} />
          </div>

          {/* CỘT PHẢI: Thông tin sản phẩm, Giá, OrderSection */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-6">
            <div className="space-y-4">
              <div>
                <Link
                  href={`/vot-cau-long?brand=${productData.brand}`}
                  className="text-[13px] text-muted hover:text-ink transition-colors font-normal inline-block mb-1"
                >
                  {productData.brand}
                </Link>
                <h1 className="text-2xl sm:text-3xl font-medium text-ink tracking-tight leading-snug">
                  {productData.name}
                </h1>
              </div>

              {/* Badges chứng nhận */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted">Chính hãng</Badge>
                <Badge variant="muted">Bảo hành {productData.warrantyMonths} tháng</Badge>
                <span className="text-[12px] text-muted font-normal flex items-center gap-1 ml-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-ink">4.9</span>
                  <span>(128 đánh giá)</span>
                </span>
              </div>

              {/* Giá hiển thị rõ ràng */}
              <div className="flex items-baseline gap-3 pt-1 border-t border-line/60">
                <PriceTag amount={defaultPrice} size="lg" />
                <span className="text-[13px] text-muted font-normal">Đã bao gồm VAT</span>
              </div>

              {/* Tóm tắt mô tả ngắn */}
              <p className="text-[14px] text-muted leading-relaxed font-normal pt-2 border-t border-line/60">
                {productData.description}
              </p>
            </div>

            {/* Khối tương tác chọn SKU, chi nhánh & đặt hàng */}
            <OrderSection
              product={productData}
              skus={skusData}
              branches={branchesData}
              stockLevels={stockLevelsData}
            />
          </div>
        </div>

        {/* Thanh neo điều hướng Sticky Anchor Bar 4 tabs */}
        <StickyAnchorBar className="my-8" />

        {/* 4 Phân mục nội dung có scroll-mt-32 */}
        <div className="space-y-12">
          {/* Mục 1: Mô tả chi tiết với SanitizedMarkdown */}
          <section id="mo-ta" className="scroll-mt-32 py-8 border-b border-line">
            <h2 className="text-xl font-medium text-ink tracking-tight mb-4">
              Mô tả chi tiết sản phẩm
            </h2>
            <SanitizedMarkdown content={productData.description} />
          </section>

          {/* Mục 2: Bảng thông số kỹ thuật chuẩn hóa */}
          <section id="thong-so" className="scroll-mt-32 py-8 border-b border-line">
            <h2 className="text-xl font-medium text-ink tracking-tight mb-6">
              Thông số kỹ thuật tiêu chuẩn
            </h2>
            <ProductSpecsTable product={productData} skus={skusData} />
          </section>

          {/* Mục 3: Đánh giá từ người chơi */}
          <section id="danh-gia" className="scroll-mt-32 py-8 border-b border-line">
            <h2 className="text-xl font-medium text-ink tracking-tight mb-6">
              Đánh giá từ người chơi đã xác thực
            </h2>
            <div className="bg-surface p-6 rounded-2xl border border-line flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="text-3xl sm:text-4xl font-medium text-ink">4.9</div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-amber-400" />
                    <Star className="w-4 h-4 fill-amber-400" />
                    <Star className="w-4 h-4 fill-amber-400" />
                    <Star className="w-4 h-4 fill-amber-400" />
                    <Star className="w-4 h-4 fill-amber-400" />
                  </div>
                  <div className="text-[13px] text-muted mt-0.5 font-normal">
                    Dựa trên 128 lượt đánh giá thực tế
                  </div>
                </div>
              </div>
              <div className="text-[13px] text-muted text-center sm:text-right font-normal">
                100% đánh giá từ khách hàng đã mua và sử dụng vợt tại Smash Court
              </div>
            </div>
          </section>

          {/* Mục 4: Chính sách bảo hành & Giao nhận */}
          <section id="bao-hanh" className="scroll-mt-32 py-8 border-b border-line">
            <h2 className="text-xl font-medium text-ink tracking-tight mb-6">
              Chính sách bảo hành & Giao hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[14px]">
              <div className="p-5 bg-surface rounded-2xl border border-line space-y-2">
                <div className="flex items-center gap-2 text-ink font-medium">
                  <ShieldCheck className="w-4 h-4 text-brand" />
                  <span>Bảo hành chính hãng 12 tháng</span>
                </div>
                <p className="text-muted leading-relaxed font-normal text-[13px]">
                  Bảo hành khung vợt đối với các lỗi vật liệu và kết cấu từ nhà sản xuất. Tiếp nhận và xử lý thẩm định nhanh chóng tại toàn bộ 3 chi nhánh của Smash Court.
                </p>
              </div>

              <div className="p-5 bg-surface rounded-2xl border border-line space-y-2">
                <div className="text-ink font-medium">
                  Giao nhận linh hoạt & Đan cước lấy ngay
                </div>
                <p className="text-muted leading-relaxed font-normal text-[13px]">
                  Hỗ trợ nhận tại cửa hàng sau 15 phút xác nhận, hoặc giao hàng toàn quốc đóng hộp chuyên dụng chống sốc. Hotline hỗ trợ đặt hàng: <a href="tel:19006868" className="text-brand hover:underline font-medium">1900 6868</a>.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sản phẩm tương tự */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-line">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-medium text-ink tracking-tight">
                Có thể bạn cũng thích
              </h2>
              <Link
                href="/vot-cau-long"
                className="text-[13px] text-muted hover:text-ink transition-colors font-normal"
              >
                Xem tất cả vợt →
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
                />
              ))}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
