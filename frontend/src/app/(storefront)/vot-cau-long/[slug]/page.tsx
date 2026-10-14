import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { queryDb } from '@/lib/db';
import OrderSection from './OrderSection';
import { SpecBar } from '@/components/ui/SpecBar';
import { PriceTag } from '@/components/ui/PriceTag';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/ui/ProductCard';
import { ChevronRight, ShieldCheck, ChevronDown } from 'lucide-react';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 0; // Trực tiếp từ PostgreSQL 18

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

  // 1. Lấy thông tin sản phẩm từ PostgreSQL catalog_db (Zero-Mock)
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

  // 2. Lấy danh sách biến thể SKU từ catalog_db
  const skuRows = await queryDb<any>(
    'catalog_db',
    `SELECT * FROM skus WHERE product_id = $1 AND is_active = true ORDER BY price ASC, weight ASC`,
    [p.id]
  );

  const skuIds = skuRows.map((s) => s.id);

  // 3. Lấy thông tin chi nhánh từ identity_db
  const branchRows = await queryDb<any>(
    'identity_db',
    `SELECT id, name, city, address FROM branches ORDER BY id ASC`
  );

  // 4. Lấy tồn kho thời gian thực từ inventory_db
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

  // 5. Lấy sản phẩm tương tự cùng danh mục
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
  const defaultStiffness = skuRows.length > 0 ? skuRows[0].stiffness : 'Cứng';
  const defaultTension = skuRows.length > 0 ? `${skuRows[0].max_tension_lbs} lbs` : '28 lbs';

  const brandDisplayName = p.brand_id === 'lining' ? 'Li-Ning' : p.brand_id === 'victor' ? 'Victor' : 'Yonex';

  const productData = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: brandDisplayName,
    playerType: p.player_type || 'Công thủ toàn diện',
    description: p.description || 'Vợt cầu lông cao cấp chính hãng phân phối tại hệ thống Smash Court.',
    imageUrl: p.image_url || '/images/products/yonex-astrox-99-pro.jpg',
    warrantyMonths: p.warranty_months || 12,
    balancePoint: defaultBalance,
    stiffness: defaultStiffness,
    maxTension: defaultTension,
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

  // Tính % thanh SpecBar cho điểm cân bằng: 280mm (0%) -> 315mm (100%)
  const balancePercentage = Math.min(100, Math.max(10, ((defaultBalance - 280) / 35) * 100));
  
  // Tính % thanh SpecBar cho độ cứng: Dẻo (25%), Trung bình (50%), Cứng (75%), Rất cứng (100%)
  const stiffnessPercentage =
    defaultStiffness === 'Rất cứng'
      ? 100
      : defaultStiffness === 'Cứng'
      ? 75
      : defaultStiffness === 'Trung bình'
      ? 50
      : 25;

  return (
    <div className="py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted mb-6 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <Link href="/vot-cau-long" className="hover:text-ink transition-colors">Vợt cầu lông</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">{productData.name}</span>
        </nav>

        {/* Bố cục 2 cột Quiet Court */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* CỘT TRÁI: Ảnh lớn & Bảng SpecBar trực quan (6 cols on lg) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Gallery Frame */}
            <div className="relative aspect-square bg-[#EFECE6] dark:bg-[#18201C] rounded-2xl overflow-hidden p-6 sm:p-10 flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image
                  src={productData.imageUrl}
                  alt={productData.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-contain mix-blend-multiply dark:mix-blend-normal p-4"
                />
              </div>

              {/* Badges trang nhã */}
              <div className="absolute top-4 left-4">
                <Badge variant="muted">Chính hãng</Badge>
              </div>
              <div className="absolute top-4 right-4">
                <Badge variant="muted">Bảo hành 12 tháng</Badge>
              </div>
            </div>

            {/* Bảng thông số SpecBar thanh mảnh 4px */}
            <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-line space-y-5">
              <div className="text-[15px] font-medium text-ink pb-3 border-b border-line flex items-center justify-between">
                <span>Thông số thi đấu</span>
                <span className="text-[13px] text-muted font-normal">{productData.playerType}</span>
              </div>

              {/* 1. Điểm cân bằng */}
              <SpecBar
                label="Điểm cân bằng"
                valueText={`${defaultBalance} mm (${defaultBalance >= 305 ? 'Nặng đầu' : defaultBalance >= 295 ? 'Cân bằng' : 'Nhẹ đầu'})`}
                percentage={balancePercentage}
                leftLabel="Nhẹ đầu (285 mm)"
                rightLabel="Nặng đầu (315 mm)"
              />

              {/* 2. Độ cứng thân đũa */}
              <SpecBar
                label="Độ cứng thân đũa"
                valueText={defaultStiffness}
                percentage={stiffnessPercentage}
                leftLabel="Dẻo (Trợ lực)"
                rightLabel="Cứng (Chính xác)"
              />

              {/* Lưới thông số phụ 4 ô */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-line text-[13px]">
                <div className="p-3 bg-bg rounded-xl">
                  <span className="text-muted block text-[13px] mb-0.5">Sức căng tối đa</span>
                  <span className="text-ink font-medium">{defaultTension}</span>
                </div>
                <div className="p-3 bg-bg rounded-xl">
                  <span className="text-muted block text-[13px] mb-0.5">Bảo hành khung</span>
                  <span className="text-ink font-medium">12 tháng chính hãng</span>
                </div>
                <div className="p-3 bg-bg rounded-xl">
                  <span className="text-muted block text-[13px] mb-0.5">Thương hiệu</span>
                  <span className="text-ink font-medium">{productData.brand}</span>
                </div>
                <div className="p-3 bg-bg rounded-xl">
                  <span className="text-muted block text-[13px] mb-0.5">Lối chơi phù hợp</span>
                  <span className="text-ink font-medium">{productData.playerType}</span>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: Thông tin, Chọn SKU, Chi nhánh & Mua hàng (6 cols on lg) */}
          <div className="lg:col-span-6 space-y-6">
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

              {/* Giá hiển thị một lần duy nhất */}
              <div className="flex items-baseline gap-3 pt-1">
                <PriceTag amount={defaultPrice} size="lg" />
                <span className="text-[13px] text-muted font-normal">Đã bao gồm VAT</span>
              </div>

              {/* Mô tả ngắn gọn 1-2 câu */}
              <p className="text-[14px] text-muted leading-relaxed font-normal pt-2 border-t border-line">
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

            {/* Accordion chi tiết 4 mục */}
            <div className="divide-y divide-line border-t border-b border-line text-[14px]">
              {/* Mục 1: Thông số kỹ thuật đầy đủ */}
              <details className="group py-4 cursor-pointer">
                <summary className="flex items-center justify-between font-medium text-ink list-none select-none">
                  <span>Thông số kỹ thuật chi tiết</span>
                  <ChevronDown className="w-4 h-4 text-muted group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pt-3 text-[13px] text-muted space-y-2 leading-relaxed">
                  <div className="flex justify-between py-1 border-b border-line/60">
                    <span>Vật liệu khung:</span>
                    <span className="text-ink">High Resilient Modulus Graphite + Nano Fortify TR</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line/60">
                    <span>Đường kính thân đũa:</span>
                    <span className="text-ink">6.8 mm Slim Shaft</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-line/60">
                    <span>Chiều dài tổng thể:</span>
                    <span className="text-ink">675 mm (Tiêu chuẩn BWF)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Nơi sản xuất:</span>
                    <span className="text-ink">Nhật Bản / Đài Loan (Phân phối chính hãng)</span>
                  </div>
                </div>
              </details>

              {/* Mục 2: Cảm giác đánh & Lối chơi */}
              <details className="group py-4 cursor-pointer">
                <summary className="flex items-center justify-between font-medium text-ink list-none select-none">
                  <span>Đặc tính công nghệ & Lối chơi</span>
                  <ChevronDown className="w-4 h-4 text-muted group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pt-3 text-[13px] text-muted space-y-2 leading-relaxed">
                  <p>
                    Vợt được tối ưu cho lối chơi {productData.playerType.toLowerCase()}, mang lại khả năng trợ lực và kiểm soát đường cầu chính xác. Khung vợt thiết kế khí động học giúp vung vợt thanh thoát và phục hồi hình dạng nhanh sau từng cú đập.
                  </p>
                </div>
              </details>

              {/* Mục 3: Chính sách bảo hành */}
              <details className="group py-4 cursor-pointer">
                <summary className="flex items-center justify-between font-medium text-ink list-none select-none">
                  <span>Chính sách bảo hành và đổi trả</span>
                  <ChevronDown className="w-4 h-4 text-muted group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pt-3 text-[13px] text-muted space-y-2 leading-relaxed">
                  <p>
                    Bảo hành khung vợt 12 tháng chính hãng đối với các lỗi do nhà sản xuất (nứt ngầm, lỗi kết cấu carbon). Hỗ trợ tiếp nhận bảo hành điện tử nhanh chóng tại toàn bộ 3 chi nhánh của Smash Court.
                  </p>
                  <p>
                    Thời gian xử lý thẩm định và phản hồi trong vòng 3 đến 5 ngày làm việc.
                  </p>
                </div>
              </details>

              {/* Mục 4: Giao hàng & Nhận tại cửa hàng */}
              <details className="group py-4 cursor-pointer">
                <summary className="flex items-center justify-between font-medium text-ink list-none select-none">
                  <span>Giao hàng và nhận tại cửa hàng</span>
                  <ChevronDown className="w-4 h-4 text-muted group-open:rotate-180 transition-transform" />
                </summary>
                <div className="pt-3 text-[13px] text-muted space-y-2 leading-relaxed">
                  <p>
                    <strong>Nhận tại cửa hàng:</strong> Sẵn sàng tại chi nhánh còn hàng sau 15 phút xác nhận. Khách hàng được kiểm tra trực tiếp và hỗ trợ đan cước theo yêu cầu.
                  </p>
                  <p>
                    <strong>Giao hàng toàn quốc:</strong> Đóng gói ống bọc chuyên dụng chống va đập, bảo hiểm hàng hóa 100%. Giao nhanh 1–2 ngày tại các thành phố lớn.
                  </p>
                </div>
              </details>
            </div>
          </div>
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
      </div>
    </div>
  );
}
