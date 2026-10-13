import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { queryDb } from '@/lib/db';
import OrderSection from './OrderSection';
import { ShieldCheck, Award, Zap, Activity } from 'lucide-react';

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 0; // Trực tiếp từ PostgreSQL 18

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = await queryDb<{ name: string }>(
    'catalog_db',
    `SELECT name FROM products WHERE slug = $1`,
    [slug]
  );
  const title = products.length > 0 ? products[0].name : slug.replace(/-/g, ' ').toUpperCase();

  return {
    title: `${title} — Thông Số Kỹ Thuật & Giá Bán | Smash Court`,
    description: `Xem thông số chi tiết cây vợt ${title}, điểm cân bằng, độ cứng thân, sức căng tối đa và chính sách bảo hành chính hãng tại hệ thống Smash Court.`,
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

  const defaultPrice = skuRows.length > 0 ? parseInt(skuRows[0].price, 10) : 0;
  const defaultBalance = skuRows.length > 0 ? skuRows[0].balance_point_mm : 305;
  const defaultStiffness = skuRows.length > 0 ? skuRows[0].stiffness : 'Cứng';
  const defaultTension = skuRows.length > 0 ? `${skuRows[0].max_tension_lbs} lbs` : '28 lbs';

  const productData = {
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand_name || p.brand_id?.toUpperCase() || 'YONEX',
    playerType: p.player_type || 'Công thủ toàn diện',
    description: p.description || 'Vợt cầu lông cao cấp chính hãng phân phối tại hệ thống Smash Court.',
    imageUrl: p.image_url || '/images/products/yonex-astrox-99-pro.jpg',
    warrantyMonths: p.warranty_months || 12,
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
    <div className="min-h-screen bg-[#F7F7F2] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="text-xs text-stone-500 mb-6 flex items-center gap-2">
          <a href="/" className="hover:underline hover:text-stone-800">Trang chủ</a>
          <span>/</span>
          <a href="/vot-cau-long" className="hover:underline hover:text-stone-800">Vợt cầu lông</a>
          <span>/</span>
          <span className="font-bold text-stone-800">{productData.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Cột Trái: Ảnh & Bảng SpecBars (7 cols on lg) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Gallery Frame */}
            <div className="aspect-square bg-linear-to-b from-stone-50 via-white to-emerald-50/25 rounded-3xl overflow-hidden border border-stone-200/90 shadow-sm relative flex items-center justify-center p-8 group">
              <img
                src={productData.imageUrl}
                alt={productData.name}
                className="max-h-full max-w-full object-contain filter drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-4 left-4 bg-[#0F5132] text-[#C8F31D] text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xs border border-[#C8F31D]/30">
                Chính hãng 100%
              </span>
              <span className="absolute top-4 right-4 bg-emerald-900/90 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                Bảo hành {productData.warrantyMonths} tháng
              </span>
            </div>

            {/* Bảng SpecBars trực quan */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-black text-stone-900 uppercase tracking-wide">
                  <Activity className="w-4 h-4 text-[#0F5132]" /> Thông số kỹ thuật thi đấu
                </div>
                <span className="text-[11px] text-stone-400 font-semibold">Chuẩn Quốc Tế</span>
              </div>

              {/* 1. Điểm cân bằng */}
              <div>
                <div className="flex justify-between text-xs font-bold text-stone-800 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    Điểm cân bằng: <span className="text-emerald-800 font-extrabold">{defaultBalance} mm</span>
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium">
                    {defaultBalance >= 305 ? 'Nặng đầu (Smash)' : defaultBalance >= 295 ? 'Cân bằng' : 'Nhẹ đầu (Thủ)'}
                  </span>
                </div>
                <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200">
                  <div
                    className="bg-linear-to-r from-emerald-600 to-[#0F5132] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(20, ((defaultBalance - 280) / 35) * 100))}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-semibold">
                  <span>Nhẹ đầu (285mm)</span>
                  <span>Cân bằng (295mm)</span>
                  <span>Nặng đầu (308mm+)</span>
                </div>
              </div>

              {/* 2. Độ cứng thân đũa */}
              <div>
                <div className="flex justify-between text-xs font-bold text-stone-800 mb-1.5">
                  <span>Độ cứng thân đũa:</span>
                  <span className="text-emerald-800 font-extrabold">{defaultStiffness}</span>
                </div>
                <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden p-0.5 border border-stone-200">
                  <div
                    className="bg-linear-to-r from-teal-500 to-[#0F5132] h-full rounded-full transition-all duration-500"
                    style={{
                      width:
                        defaultStiffness === 'Rất cứng'
                          ? '95%'
                          : defaultStiffness === 'Cứng'
                          ? '75%'
                          : defaultStiffness === 'Trung bình'
                          ? '50%'
                          : '30%',
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-semibold">
                  <span>Dẻo (Trợ lực)</span>
                  <span>Trung bình</span>
                  <span>Cứng (Chính xác)</span>
                  <span>Siêu cứng</span>
                </div>
              </div>

              {/* Thông số phụ */}
              <div className="grid grid-cols-2 gap-3 pt-3 text-xs text-stone-600 border-t border-stone-100">
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  <span className="text-stone-400 block text-[10px]">Sức căng tối đa:</span>
                  <strong className="text-stone-900 font-bold">{defaultTension}</strong>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  <span className="text-stone-400 block text-[10px]">Chính sách bảo hành:</span>
                  <strong className="text-stone-900 font-bold">{productData.warrantyMonths} Tháng chính hãng</strong>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  <span className="text-stone-400 block text-[10px]">Thương hiệu:</span>
                  <strong className="text-stone-900 font-bold">{productData.brand}</strong>
                </div>
                <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  <span className="text-stone-400 block text-[10px]">Định hình lối chơi:</span>
                  <strong className="text-stone-900 font-bold">{productData.playerType}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Cột Phải: Thông tin chi tiết & Form Đặt Mua Thời Gian Thực (6 cols on lg) */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-xs space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-widest bg-emerald-50 px-2.5 py-1 rounded-lg mb-2">
                  <Zap className="w-3.5 h-3.5 text-[#0F5132]" />
                  {productData.brand} • {productData.playerType}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#1A2420] tracking-tight leading-snug">
                  {productData.name}
                </h1>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-3xl font-black text-[#0F5132]">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(defaultPrice)}
                  </span>
                  <span className="text-xs text-stone-400 font-medium">Đã bao gồm thuế VAT</span>
                </div>
              </div>

              <p className="text-stone-600 text-sm leading-relaxed border-t border-stone-100 pt-4">
                {productData.description}
              </p>

              {/* Order Section with Real-Time Stock & VietQR */}
              <OrderSection
                product={productData}
                skus={skusData}
                branches={branchesData}
                stockLevels={stockLevelsData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
