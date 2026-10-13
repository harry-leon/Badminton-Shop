import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { queryDb } from '@/lib/db';
import OrderSection from './OrderSection';

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
    imageUrl: p.image_url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1000',
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
    <div className="max-w-7xl mx-auto py-10 px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-6 flex items-center gap-2">
        <a href="/" className="hover:underline">Trang chủ</a>
        <span>/</span>
        <a href="/vot-cau-long" className="hover:underline">Vợt cầu lông</a>
        <span>/</span>
        <span className="font-semibold text-slate-800">{productData.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Cột ảnh sản phẩm */}
        <div>
          <div className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border border-slate-200 shadow-sm relative">
            <img
              src={productData.imageUrl}
              alt={productData.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-4 left-4 bg-[#0F5132] text-white text-xs font-bold px-3 py-1 rounded-full uppercase shadow-sm">
              Chính hãng 100%
            </span>
            <span className="absolute top-4 right-4 bg-emerald-800/90 text-emerald-100 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
              Bảo hành {productData.warrantyMonths} tháng
            </span>
          </div>

          {/* Thanh trực quan thông số vợt (Spec Bars) */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 mt-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Thông số kỹ thuật thi đấu
            </h2>

            {/* Điểm cân bằng */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Điểm cân bằng</span>
                <span className="font-bold text-emerald-800">{defaultBalance} mm</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#0F5132] h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(20, ((defaultBalance - 280) / 40) * 100))}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Nhẹ đầu (285mm)</span>
                <span>Cân bằng (295mm)</span>
                <span>Nặng đầu (308mm)</span>
              </div>
            </div>

            {/* Độ cứng thân */}
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                <span>Độ cứng đũa vợt</span>
                <span className="font-bold text-emerald-800">{defaultStiffness}</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="bg-[#16794C] h-full rounded-full" style={{ width: '80%' }}></div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Dẻo</span>
                <span>Trung bình</span>
                <span>Cứng</span>
              </div>
            </div>

            {/* Chi tiết phụ */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-600 border-t border-slate-200">
              <div>Sức căng tối đa: <strong className="text-slate-900">{defaultTension}</strong></div>
              <div>Bảo hành NSX: <strong className="text-slate-900">{productData.warrantyMonths} tháng</strong></div>
              <div>Thương hiệu: <strong className="text-slate-900">{productData.brand}</strong></div>
              <div>Lối chơi: <strong className="text-slate-900">{productData.playerType}</strong></div>
            </div>
          </div>
        </div>

        {/* Cột thông tin chi tiết & Đặt mua */}
        <div className="space-y-6">
          <div>
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest mb-1">
              {productData.brand} • {productData.playerType}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight leading-snug">
              {productData.name}
            </h1>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-black text-[#0F5132]">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(defaultPrice)}
              </span>
              <span className="text-xs text-slate-500">Đã bao gồm VAT</span>
            </div>
          </div>

          <p className="text-slate-600 text-sm leading-relaxed">
            {productData.description}
          </p>

          {/* Interactive Order Section (Client Component: Chọn SKU, Chi nhánh, Đặt mua & VietQR) */}
          <OrderSection
            product={productData}
            skus={skusData}
            branches={branchesData}
            stockLevels={stockLevelsData}
          />
        </div>
      </div>
    </div>
  );
}
