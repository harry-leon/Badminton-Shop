import type { Metadata } from 'next';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { Container } from '@/components/ui/Container';
import { queryDb } from '@/lib/db';
import { fetchFromApi } from '@/lib/api';
import { 
  ShieldCheck, 
  Award, 
  MapPin, 
  ArrowRight, 
  Zap, 
  CheckCircle2, 
  ChevronRight, 
  Search,
  Sparkles,
  Flame,
  Truck,
  CreditCard,
  RefreshCw,
  Gift,
  ShoppingBag,
  Tag,
  ThumbsUp,
  RotateCcw,
  Package
} from 'lucide-react';
import { ProductCard } from '@/components/ui/ProductCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { HeroBannerCarousel } from '@/components/HeroBannerCarousel';
import { HomeProductTabs } from '@/components/HomeProductTabs';
import { SecondhandSection } from '@/components/SecondhandSection';
import RacketQuiz from '@/components/RacketQuiz';

export const metadata: Metadata = {
  title: 'Smash Court — Hệ thống vợt cầu lông chính hãng & Kiểm định vợt cũ',
  description: 'Hệ thống bán lẻ vợt cầu lông Yonex, Li-Ning, Victor chính hãng và sàn giao dịch vợt cũ kiểm định 16 tiêu chí độc lập tại 3 chi nhánh toàn quốc.',
};

export const revalidate = 60; // Cache 60s trên Edge CDN cho tốc độ phản hồi tức thì

const branchLabels: Record<string, string> = {
  BR_HCM_01: 'Quận 1, TP.HCM',
  BR_HN_01: 'Cầu Giấy, Hà Nội',
  BR_DN_01: 'Hải Châu, Đà Nẵng',
};

interface HomepageApiData {
  banners?: any[];
  heroBanners?: any[];
  promoBanners?: any[];
  categories?: any[];
  products?: any[];
}

const DEFAULT_PROMO_BANNERS = [
  {
    id: 'promo-1-yonex-sale-30',
    badge: 'Ưu đãi tuần này',
    title: 'Vợt Yonex Sale 30%',
    description: 'Tặng combo cước BG65 + Quấn cán miễn phí',
    primaryCtaText: 'Săn ngay',
    primaryCtaLink: '/vot-cau-long?brand=Yonex&sale=true',
    imageUrl: '/images/products/yonex-astrox-88d-pro.png',
  },
  {
    id: 'promo-2-giay-thi-dau-2026',
    badge: 'Bộ sưu tập mới',
    title: 'Giày thi đấu 2026',
    description: 'Đệm Power Cushion + trợ lực khớp gối',
    primaryCtaText: 'Khám phá',
    primaryCtaLink: '/giay-cau-long',
    imageUrl: '/images/categories/cat-giay-cau-long-v2.png',
  },
  {
    id: 'promo-3-san-vot-cu-16-tieu-chi',
    badge: 'Độc quyền SmashCourt',
    title: 'Sàn vợt cũ 16 tiêu chí',
    description: 'Bảo hành kết cấu 30 ngày, tiết kiệm 40%.',
    primaryCtaText: 'Xem kho vợt',
    primaryCtaLink: '/second-hand',
    imageUrl: '/images/products/yonex-nanoflare-800-pro.png',
  },
];

const DEFAULT_CATEGORIES = [
  { id: 'cat_racket', name: 'Vợt Cầu Lông', tag_subtitle: 'Yonex · Victor · Li-Ning', image_url: '/images/categories/cat-vot-cau-long-v2.png', slug: 'vot-cau-long' },
  { id: 'cat_shoes', name: 'Giày Cầu Lông', tag_subtitle: 'Bám sân · Giảm chấn gót', image_url: '/images/categories/cat-giay-cau-long-v2.png', slug: 'giay-cau-long' },
  { id: 'cat_apparel', name: 'Áo Cầu Lông', tag_subtitle: 'Thoáng khí · Thấm mồ hôi', image_url: '/images/categories/cat-ao-cau-long-v2.png', slug: 'quan-ao' },
  { id: 'cat_bag', name: 'Túi & Balo Vợt', tag_subtitle: 'Cách nhiệt · Ngăn giày riêng', image_url: '/images/categories/cat-tui-balo-vot-v2.png', slug: 'tui-bao-vot' },
  { id: 'cat_string', name: 'Dây Cước Đan', tag_subtitle: 'Đan máy điện tử lấy ngay', image_url: '/images/categories/cat-day-cuoc-dan-v2.png', slug: 'day-cuoc' },
  { id: 'cat_grip', name: 'Quấn Cán AC102', tag_subtitle: 'Êm tay · Chống trơn trượt', image_url: '/images/categories/cat-quan-can-ac102-v2.png', slug: 'quan-can' },
];

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'vot-cau-long': '/images/categories/cat-vot-cau-long-v2.png',
  'giay-cau-long': '/images/categories/cat-giay-cau-long-v2.png',
  'quan-ao': '/images/categories/cat-ao-cau-long-v2.png',
  'tui-bao-vot': '/images/categories/cat-tui-balo-vot-v2.png',
  'day-cuoc': '/images/categories/cat-day-cuoc-dan-v2.png',
  'quan-can': '/images/categories/cat-quan-can-ac102-v2.png',
  'qua-cau-long': '/images/products/qua-cau-long-yonex-as50.png',
  'luoi-cau-long': '/images/products/luoi-cau-long-yonex.png',
  'phu-kien': '/images/categories/cat-quan-can-ac102-v2.png',
};

function maskSerialNumber(serial?: string | null): string {
  if (!serial) return 'Khớp hồ sơ';
  const parts = serial.trim().split('-');
  if (parts.length >= 4) {
    const prefix = parts.slice(0, parts.length - 2).join('-');
    const suffix = parts[parts.length - 1];
    return `${prefix}-***-${suffix}`;
  }
  if (parts.length === 3) {
    return `${parts[0]}-***-${parts[2]}`;
  }
  if (serial.length > 8) {
    return serial.slice(0, 4) + '-***-' + serial.slice(-3);
  }
  return serial;
}

function renderUspIcon(badgeName?: string) {
  const k = (badgeName || '').toLowerCase();
  if (k.includes('truck') || k.includes('ship') || k.includes('vận chuyển') || k.includes('giao')) return <Truck className="w-8 h-8 stroke-[1.6]" />;
  if (k.includes('thumb') || k.includes('chất lượng') || k.includes('bảo đảm')) return <ThumbsUp className="w-8 h-8 stroke-[1.6]" />;
  if (k.includes('card') || k.includes('credit') || k.includes('thanh toán')) return <CreditCard className="w-8 h-8 stroke-[1.6]" />;
  if (k.includes('rotate') || k.includes('đổi') || k.includes('trả') || k.includes('ccw')) return <RotateCcw className="w-8 h-8 stroke-[1.6]" />;
  if (k.includes('shield') || k.includes('bảo hành')) return <ShieldCheck className="w-8 h-8 stroke-[1.6]" />;
  if (k.includes('award') || k.includes('chính hãng')) return <Award className="w-8 h-8 stroke-[1.6]" />;
  return <Sparkles className="w-8 h-8 stroke-[1.6]" />;
}

export default async function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsStore',
    name: 'Smash Court — Hệ thống cầu lông chính hãng & Sàn kiểm định vợt cũ',
    description: 'Chuyên cung cấp vợt cầu lông Yonex, Li-Ning, Victor chính hãng và sàn giao dịch vợt cũ second-hand có kiểm định 16 tiêu chuẩn độc lập.',
    currenciesAccepted: 'VND',
    paymentAccepted: 'Cash, Bank Transfer, VietQR',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'TP. Hồ Chí Minh',
      addressCountry: 'VN',
    },
    branch: [
      {
        '@type': 'Store',
        name: 'Smash Court Quận 1',
        address: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1',
      },
      {
        '@type': 'Store',
        name: 'Smash Court Cầu Giấy',
        address: '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy',
      },
      {
        '@type': 'Store',
        name: 'Smash Court Hải Châu',
        address: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu',
      },
    ],
  };

  // Tải song song toàn bộ dữ liệu (Database + Spring Boot Aggregator API)
  const [shRes, sRes, tagRes, apiRes, catRes, bannerRes] = await Promise.allSettled([
    queryDb<any>(
      'secondhand_db',
      `SELECT id, serial_number, model_name, grade, resale_price, images_json, branch_id, condition_notes
       FROM secondhand_units
       WHERE status = 'APPROVED_FOR_SALE'
       ORDER BY created_at DESC
       LIMIT 3`
    ),
    queryDb<any>('catalog_db', `SELECT key, value FROM site_settings`),
    queryDb<any>('catalog_db', `SELECT code, name, bg_color, text_color FROM product_tags WHERE is_active = true`),
    fetchFromApi<{
      success?: boolean;
      data?: HomepageApiData;
    }>('/public/homepage'),
    queryDb<any>(
      'catalog_db',
      `SELECT id, name, slug, image_url, tag_subtitle, sort_order
       FROM categories
       WHERE is_featured = true
       ORDER BY sort_order ASC, name ASC`
    ),
    queryDb<any>(
      'catalog_db',
      `SELECT id, position, title, badge, description, primary_cta_text, primary_cta_link,
              secondary_cta_text, secondary_cta_link, image_url, mobile_image_url, product_tag, product_sub,
              sort_order
       FROM banners
       WHERE is_active = true
       ORDER BY sort_order ASC, created_at DESC`
    ),
  ]);

  // 1. Vợt cũ
  let secondhandRackets: any[] = [];
  if (shRes.status === 'fulfilled' && Array.isArray(shRes.value)) {
    secondhandRackets = shRes.value.map((r) => {
      let images: string[] = [];
      try {
        images = JSON.parse(r.images_json || '[]');
      } catch {
        images = ['/images/secondhand/sh-nanoflare-800-pro.png'];
      }
      const imgUrl = images[0] || '/images/secondhand/sh-nanoflare-800-pro.png';
      return {
        id: r.id,
        serial: maskSerialNumber(r.serial_number),
        name: r.model_name,
        slug: r.id,
        brand: 'Yonex',
        grade: r.grade,
        playerType: 'Độc bản đã kiểm định',
        price: Number(r.resale_price),
        imageUrl: imgUrl,
        branch: branchLabels[r.branch_id] || r.branch_id,
      };
    });
  }

  // 2. Cài đặt giao diện (Site Settings)
  let siteSettings: Record<string, string> = {
    hotline: '1900 6868',
    business_hours: '08:30 – 21:30 hàng ngày',
    address_hcm: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1',
    address_hn: '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy',
    address_dn: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu',
    announcement_bar: 'Ưu đãi tuần này: Giảm tới 30% toàn bộ vợt chính hãng & Tặng gói cước căng máy BWF',
  };
  if (sRes.status === 'fulfilled' && Array.isArray(sRes.value)) {
    sRes.value.forEach((r) => { siteSettings[r.key] = r.value; });
  }

  // 3. Product Tags
  let tagsMap: Record<string, { code: string; name: string; bg_color: string; text_color: string }> = {};
  if (tagRes.status === 'fulfilled' && Array.isArray(tagRes.value)) {
    tagRes.value.forEach((t) => { tagsMap[t.code] = t; });
  }

  // 0. Dữ liệu từ Spring Boot Aggregator API: GET /api/v1/public/homepage
  let apiHeroBanners: any[] = [];
  let apiPromoBanners: any[] = [];
  let apiCategories: any[] = [];
  let apiProducts: any[] = [];

  if (apiRes.status === 'fulfilled' && apiRes.value?.data) {
    const data = apiRes.value.data;
    if (Array.isArray(data.heroBanners) && data.heroBanners.length > 0) apiHeroBanners = data.heroBanners;
    if (Array.isArray(data.promoBanners) && data.promoBanners.length > 0) apiPromoBanners = data.promoBanners;
    if (Array.isArray(data.categories) && data.categories.length > 0) apiCategories = data.categories;
    if (Array.isArray(data.products) && data.products.length > 0) apiProducts = data.products;
  }

  // 4. Danh mục nổi bật (Featured Categories)
  let featuredCategories: any[] = [];
  if (catRes.status === 'fulfilled' && Array.isArray(catRes.value)) {
    featuredCategories = catRes.value;
  }

  // 5. Banners
  let uspBadges: any[] = [];
  let promoBanners: any[] = [];
  let athleteBanners: any[] = [];
  let dbHeroBanners: any[] = [];
  if (bannerRes.status === 'fulfilled' && Array.isArray(bannerRes.value)) {
    const bannerRows = bannerRes.value;
    uspBadges = bannerRows.filter((b) => b.position === 'USP_BAR');
    promoBanners = bannerRows.filter((b) => b.position === 'HOME_PROMO_3');
    athleteBanners = bannerRows.filter((b) => b.position === 'ATHLETES');
    dbHeroBanners = bannerRows
      .filter((b) => b.position === 'HERO' || b.position === 'HERO_SLIDER')
      .map((b) => ({
        id: b.id,
        badge: b.badge,
        title: b.title,
        description: b.description,
        primaryCtaText: b.primary_cta_text,
        primaryCtaLink: b.primary_cta_link,
        secondaryCtaText: b.secondary_cta_text,
        secondaryCtaLink: b.secondary_cta_link,
        imageUrl: b.image_url,
        imageSrc: b.image_url,
        mobileImageUrl: b.mobile_image_url || b.image_url,
        mobileImageSrc: b.mobile_image_url || b.image_url,
        imageAlt: b.title,
        productTag: b.product_tag,
        productSub: b.product_sub,
        sortOrder: b.sort_order,
      }));
  }

  // Tổng hợp dữ liệu hiển thị với cơ chế fallback kiên cường (Resilient Fallback)
  const heroBanners = apiHeroBanners.length > 0 ? apiHeroBanners : dbHeroBanners;
  const activePromoBanners = apiPromoBanners.length > 0
    ? apiPromoBanners
    : (promoBanners.length > 0 ? promoBanners : DEFAULT_PROMO_BANNERS);

  let activeCategories: any[] = [];
  if (apiCategories.length > 0) {
    activeCategories = apiCategories.map((cat) => ({
      id: cat.id || cat.slug,
      name: cat.name,
      slug: cat.slug,
      image_url: cat.imageUrl || cat.image_url || CATEGORY_IMAGE_MAP[cat.slug] || '/images/categories/cat-vot-cau-long-v2.png',
      tag_subtitle: cat.tagSubtitle || cat.tag_subtitle || cat.description || 'Chính hãng',
    }));
  } else if (featuredCategories.length > 0) {
    activeCategories = featuredCategories;
  } else {
    activeCategories = DEFAULT_CATEGORIES;
  }

  // 6. Lấy danh sách Sản phẩm mới về (New Arrivals) kèm Tags từ catalog_db
  let newArrivals: any[] = [];
  try {
    const newRows = await queryDb<any>(
      'catalog_db',
      `SELECT p.id, p.name, p.slug, p.brand_id as brand, p.category_id, p.image_url, p.tags,
              COALESCE(MIN(s.price), 0) as price_from,
              COALESCE(MAX(s.price), 0) as price_to
       FROM products p
       LEFT JOIN skus s ON p.id = s.product_id
       WHERE p.is_active = true
       GROUP BY p.id
       ORDER BY p.created_at DESC
       LIMIT 60`
    );
    newArrivals = newRows.map((p) => {
      const rawTags: string[] = Array.isArray(p.tags) ? p.tags : [];
      const mappedTags = rawTags.map((tc) => tagsMap[tc] || { code: tc, name: tc });
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand ? (p.brand.toUpperCase() === 'LINING' ? 'Li-Ning' : p.brand.toUpperCase() === 'VICTOR' ? 'Victor' : 'Yonex') : 'Yonex',
        category: p.category_id || 'cat_racket',
        imageUrl: p.image_url,
        priceFrom: Number(p.price_from),
        originalPrice: Number(p.price_to) > Number(p.price_from) ? Number(p.price_to) : (Number(p.price_from) > 100000 ? Math.round(Number(p.price_from) * 1.15) : undefined),
        tags: mappedTags,
      };
    });
  } catch (err) {
    console.error('Lỗi khi tải sản phẩm mới từ catalog_db:', err);
  }

  // 7. Lấy danh sách Bán chạy tuần này (Best-Sellers) kèm Tags
  let bestSellers: any[] = [];
  try {
    let topSkus: string[] = [];
    try {
      const soldRows = await queryDb<{ sku: string; sold: string }>(
        'order_db',
        `SELECT sku, SUM(quantity) as sold
         FROM order_lines
         GROUP BY sku
         ORDER BY sold DESC
         LIMIT 20`
      );
      topSkus = soldRows.map((r) => r.sku);
    } catch {}

    const bsRows = await queryDb<any>(
      'catalog_db',
      `SELECT p.id, p.name, p.slug, p.brand_id as brand, p.category_id, p.player_type, p.image_url, p.tags,
              COALESCE(MIN(s.price), 0) as price_from,
              COALESCE(MAX(s.price), 0) as price_to
       FROM products p
       LEFT JOIN skus s ON p.id = s.product_id
       WHERE p.is_active = true
       GROUP BY p.id
       ORDER BY (p.id IN (SELECT product_id FROM skus WHERE id = ANY($1::text[]))) DESC, p.created_at ASC
       LIMIT 50`,
      [topSkus.length > 0 ? topSkus : ['none']]
    );
    bestSellers = bsRows.map((p) => {
      const rawTags: string[] = Array.isArray(p.tags) ? p.tags : [];
      const mappedTags = rawTags.map((tc) => tagsMap[tc] || { code: tc, name: tc });
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        brand: p.brand ? (p.brand.toUpperCase() === 'LINING' ? 'Li-Ning' : p.brand.toUpperCase() === 'VICTOR' ? 'Victor' : 'Yonex') : 'Yonex',
        category: p.category_id || 'cat_racket',
        playerType: p.player_type || 'Bán chạy',
        imageUrl: p.image_url,
        priceFrom: Number(p.price_from),
        originalPrice: Number(p.price_to) > Number(p.price_from) ? Number(p.price_to) : (Number(p.price_from) > 100000 ? Math.round(Number(p.price_from) * 1.15) : undefined),
        tags: mappedTags,
      };
    });
  } catch (err) {
    console.error('Lỗi khi tải sản phẩm bán chạy:', err);
  }

  // Fallback từ Aggregator API nếu database chưa có hoặc đang chạy trên Cloudflare không có direct DB
  if (newArrivals.length === 0 && apiProducts.length > 0) {
    newArrivals = apiProducts.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      brand: p.brand?.name || 'Yonex',
      category: p.category?.slug || 'cat_racket',
      imageUrl: p.imageUrl || '/images/products/yonex-astrox-88d-pro.png',
      priceFrom: Number(p.basePrice || 0),
      originalPrice: Number(p.basePrice || 0) * 1.15,
      tags: [],
    }));
  }
  if (bestSellers.length === 0 && newArrivals.length > 0) {
    bestSellers = [...newArrivals].reverse();
  }

  // Danh sách VĐV đại diện (Ưu tiên đọc từ PostgreSQL banners vị trí ATHLETES)
  const legendaryAthletes = athleteBanners.length > 0
    ? athleteBanners.map((b) => ({
        name: b.title,
        title: b.badge || 'Đại diện thương hiệu',
        racketName: b.product_tag || 'Vợt thi đấu đỉnh cao',
        racketSlug: b.primary_cta_link || 'vot-cau-long',
        imageUrl: b.image_url || '/images/products/yonex-astrox-100zz.png',
        quote: b.description || '',
        badge: b.product_sub || b.badge || 'Huyền thoại',
      }))
    : [
        {
          name: 'Viktor Axelsen',
          title: 'Đương kim vô địch Olympic & Vô địch thế giới',
          racketName: 'Yonex Astrox 100ZZ',
          racketSlug: 'yonex-astrox-100zz',
          imageUrl: '/images/products/yonex-astrox-100zz.png',
          quote: 'Vũ khí mang lại lực smash cắm sân hủy diệt và khả năng kiểm soát thế trận áp đảo ở mọi giải đấu lớn.',
          badge: 'Huyền thoại Đơn nam BWF',
        },
        {
          name: 'Kento Momota',
          title: 'Huyền thoại 2 lần Vô địch thế giới',
          racketName: 'Yonex Astrox 99 Pro',
          racketSlug: 'yonex-astrox-99-pro',
          imageUrl: '/images/products/yonex-astrox-99-pro.jpg',
          quote: 'Khả năng giữ quả cầu lâu hơn trên mặt vợt để kiến tạo những góc đánh bất ngờ và hiểm hóc nhất.',
          badge: '2 Lần Vô địch thế giới',
        },
        {
          name: 'An Se-young',
          title: 'Đương kim vô địch Olympic Paris 2024',
          racketName: 'Yonex Arcsaber 11 Pro',
          racketSlug: 'yonex-arcsaber-11-pro',
          imageUrl: '/images/products/yonex-arcsaber-11-pro.png',
          quote: 'Sự chính xác tuyệt đối trong từng pha điều cầu phản tạt và khả năng chống vặn xoắn bền bỉ.',
          badge: 'Huy chương Vàng Paris 2024',
        },
      ];

  // Danh sách bài viết tin tức & cẩm nang cầu lông
  const newsArticles = [
    {
      id: 1,
      title: 'Tiêu điểm BWF World Tour Finals: Đấu trường đỉnh cao của 8 tay vợt xuất sắc nhất',
      summary: 'Phân tích chiến thuật thi đấu, sự trở lại của các tên tuổi lớn và trang thiết bị thi đấu được các tuyển thủ tin dùng trong mùa giải.',
      tag: 'BWF World Tour',
      date: '14/10/2026',
      readTime: '5 phút đọc',
      badgeColor: 'brand',
    },
    {
      id: 2,
      title: 'Huyền thoại giải đấu All England Open: Hơn 120 năm lịch sử và vũ khí của nhà vô địch',
      summary: 'Hành trình hơn một thế kỷ của giải đấu danh giá bậc nhất thế giới, nơi chứng kiến sự thăng hoa của các dòng vợt Astrox và Arcsaber.',
      tag: 'All England',
      date: '12/10/2026',
      readTime: '6 phút đọc',
      badgeColor: 'brand',
    },
    {
      id: 3,
      title: 'Khí thế rực lửa tại thánh địa Istora Senayan — Indonesia Open: Thử thách áp lực lớn nhất',
      summary: 'Khám phá bầu không khí cuồng nhiệt không nơi nào sánh được tại Jakarta và bí quyết các tuyển thủ giữ vững tâm lý thi đấu đỉnh cao.',
      tag: 'Indonesia Open',
      date: '08/10/2026',
      readTime: '4 phút đọc',
      badgeColor: 'brand',
    },
    {
      id: 4,
      title: 'Cẩm nang chọn mức cân căng cước chuẩn xác: Bảo vệ cổ tay và tối ưu điểm ngọt',
      summary: 'Hướng dẫn chi tiết từ chuyên gia kỹ thuật Smash Court về mối quan hệ giữa lực cổ tay, loại dây cước và số cân lbs phù hợp cho từng trình độ.',
      tag: 'Cẩm nang kỹ thuật',
      date: '05/10/2026',
      readTime: '7 phút đọc',
      badgeColor: 'brand',
    },
  ];

  return (
    <div className="bg-bg text-ink min-h-screen">
      {/* Schema.org SportsStore JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. HERO BANNER CAROUSEL */}
      <HeroBannerCarousel banners={heroBanners} />

      {/* 2. DẢI CAM KẾT VÀNG (USP BAR - DYNAMIC TỪ POSTGRESQL) */}
      <section className="py-5 border-b border-line bg-surface">
        <Container>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {(uspBadges && uspBadges.length > 0
              ? uspBadges.slice(0, 4)
              : [
                  { id: 'u1', badge: 'truck', title: 'Vận chuyển TOÀN QUỐC', description: 'Thanh toán khi nhận hàng' },
                  { id: 'u2', badge: 'thumbs-up', title: 'Bảo đảm chất lượng', description: 'Sản phẩm chính hãng 100%' },
                  { id: 'u3', badge: 'credit-card', title: 'Tiến hành THANH TOÁN', description: 'Nhiều phương thức VietQR, COD' },
                  { id: 'u4', badge: 'rotate-ccw', title: 'Đổi sản phẩm mới', description: 'Miễn phí nếu phát sinh lỗi' },
                ]
            ).map((usp: any) => (
              <div key={usp.id} className="flex items-center gap-3.5 px-4 py-3 rounded-2xl bg-surface border border-line shadow-2xs">
                <div className="shrink-0 text-brand">
                  {renderUspIcon(usp.badge)}
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="text-[13px] text-ink font-medium leading-tight line-clamp-1">
                    {usp.title}
                  </div>
                  <div className="text-[13px] text-muted leading-tight line-clamp-1">
                    {usp.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 2.0. KHỐI SẢN PHẨM MỚI (SHOPVNB STYLE) */}
      <section className="py-10 border-b border-line bg-surface/40">
        <Container className="space-y-6">
          {/* Tiêu đề Sản phẩm mới căn giữa */}
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
              Sản phẩm mới
            </h2>
            <div className="w-20 h-1 bg-brand rounded-full mt-2.5" />
          </div>

          {/* Component Tabs & Sản phẩm có viền thương hiệu */}
          <HomeProductTabs products={newArrivals} />
        </Container>
      </section>

      {/* 2.1. BỘ 3 BANNER SALE OFF (THIẾT KẾ MỚI CHUẨN THEO ẢNH) */}
      {/* 2. SALE OFF / PROMO 3 BANNERS SECTION (THEO ẢNH CHỤP CHÍNH XÁC) */}
      <section className="py-14 sm:py-18 bg-[#FAF8F3] dark:bg-[#121a16] border-b border-[#ECE8DE] dark:border-line">
        <Container className="space-y-10">
          {/* Tiêu đề Ưu đãi tuần này / SALE OFF căn giữa theo ảnh */}
          <div className="flex flex-col items-center justify-center text-center space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-10 sm:w-14 h-[1px] bg-[#11382B]/25 dark:bg-emerald-500/30" />
              <span className="text-[13px] font-medium text-[#11382B] dark:text-emerald-400">
                ƯU ĐÃI TUẦN NÀY
              </span>
              <span className="w-10 sm:w-14 h-[1px] bg-[#11382B]/25 dark:bg-emerald-500/30" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-[#112F25] dark:text-zinc-100">
              SALE OFF
            </h2>
            <div className="w-14 h-1 bg-[#11382B] dark:bg-emerald-500 rounded-full mt-0.5" />
          </div>

          {/* 3 Thẻ Sale Off hiển thị động từ activePromoBanners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activePromoBanners.slice(0, 3).map((promo: any, index: number) => {
              const badgeText = promo.badge || (index === 0 ? 'Ưu đãi tuần này' : index === 1 ? 'Bộ sưu tập mới' : 'Độc quyền SmashCourt');
              const titleText = promo.title || 'Ưu đãi đặc biệt';
              const descText = promo.description || 'Ưu đãi số lượng có hạn';
              const ctaText = promo.primaryCtaText || promo.primary_cta_text || (index === 0 ? 'Săn ngay' : index === 1 ? 'Khám phá' : 'Xem kho vợt');
              const ctaLink = promo.primaryCtaLink || promo.primary_cta_link || (index === 0 ? '/vot-cau-long?brand=Yonex&sale=true' : index === 1 ? '/giay-cau-long' : '/second-hand');
              const imgSrc = promo.imageUrl || promo.imageSrc || promo.image_url || (index === 0 ? '/images/products/yonex-astrox-88d-pro.png' : index === 1 ? '/images/categories/cat-giay-cau-long-v2.png' : '/images/products/yonex-nanoflare-800-pro.png');

              return (
                <div
                  key={promo.id || `promo-${index}`}
                  className="bg-white dark:bg-surface border border-[#ECE8DE] dark:border-line rounded-3xl p-6 sm:p-7 flex items-center justify-between shadow-2xs hover:shadow-md transition-all group"
                >
                  <div className="space-y-2.5 z-10 max-w-[62%]">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11382B] text-white text-[13px] font-medium">
                      {index === 0 ? (
                        <Flame className="w-3.5 h-3.5 text-[#4EBA86] fill-[#4EBA86]" />
                      ) : index === 1 ? (
                        <Gift className="w-3.5 h-3.5 text-[#4EBA86]" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-[#4EBA86]" />
                      )}
                      <span>{badgeText}</span>
                    </span>
                    <h3 className="text-[18px] sm:text-[19px] font-medium tracking-tight text-[#112F25] dark:text-zinc-100 leading-snug">
                      {titleText}
                    </h3>
                    <p className="text-[13px] text-[#556960] dark:text-zinc-400 leading-relaxed font-normal">
                      {descText}
                    </p>
                    <div className="pt-2">
                      <Link
                        href={ctaLink}
                        className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#11382B] hover:bg-[#184E3D] text-white text-[13px] font-medium transition-all shadow-xs cursor-pointer group-hover:gap-2.5"
                      >
                        <span>{ctaText}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                  <div className="w-28 sm:w-32 h-44 sm:h-48 relative shrink-0 group-hover:scale-105 transition-transform duration-300 select-none flex items-center justify-center">
                    <SafeImage
                      src={imgSrc}
                      alt={titleText}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 2.2. KHỐI SẢN PHẨM CẦU LÔNG (SHOPVNB STYLE) */}
      <section className="py-12 sm:py-16 border-b border-line bg-surface/40">
        <Container className="space-y-8">
          {/* Tiêu đề Sản phẩm cầu lông căn giữa */}
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
              Sản phẩm cầu lông
            </h2>
            <div className="w-24 h-1 bg-brand rounded-full mt-2.5" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {activeCategories.slice(0, 6).map((cat: any) => {
              const href = cat.slug
                ? (cat.slug.startsWith('/') ? cat.slug : `/${cat.slug}`)
                : cat.id === 'cat_racket' ? '/vot-cau-long'
                : cat.id === 'cat_shoes' ? '/giay-cau-long'
                : cat.id === 'cat_apparel' ? '/quan-ao'
                : cat.id === 'cat_bag' ? '/tui-bao-vot'
                : cat.id === 'cat_string' ? '/day-cuoc'
                : cat.id === 'cat_grip' ? '/quan-can'
                : '/vot-cau-long';

              return (
                <Link
                  key={cat.id}
                  href={href}
                  className="group relative bg-surface border border-line hover:border-emerald-600/60 rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-center overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 block shadow-xs"
                >
                  <div className="aspect-square w-full relative mb-2.5 rounded-xl sm:rounded-2xl overflow-hidden bg-[#eef5f1] dark:bg-emerald-950/20">
                    <SafeImage
                      src={cat.image_url || CATEGORY_IMAGE_MAP[cat.slug] || '/images/categories/cat-vot-cau-long-v2.png'}
                      alt={cat.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="font-medium text-[13px] sm:text-[14px] text-ink group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {cat.name}
                  </div>
                  <div className="text-[13px] text-muted mt-0.5 line-clamp-1">
                    {cat.tag_subtitle || 'Chính hãng'}
                  </div>
                </Link>
              );
            })}
          </div>

        </Container>
      </section>



      {/* 4. CHỌN VỢT THEO LỐI CHƠI (PLAYSTYLE SELECTOR) */}
      <section className="py-16 sm:py-20 border-b border-line">
        <Container className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="space-y-1">
              <span className="text-[13px] font-medium text-brand">Định hình phong cách</span>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
                Chọn vợt phù hợp với lối đánh của bạn
              </h2>
            </div>
            <Link
              href="/vot-cau-long"
              className="text-[14px] font-medium text-ink hover:underline inline-flex items-center gap-1"
            >
              <span>Xem tất cả mẫu vợt</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/vot-cau-long?playstyle=THIÊN+CÔNG"
              className="group p-6 sm:p-8 rounded-2xl bg-surface border border-line hover:border-ink/30 transition-all flex flex-col justify-between space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[13px] text-muted font-normal">Head Heavy · Đũa cứng</span>
                <h3 className="text-xl font-medium text-ink group-hover:text-brand transition-colors">
                  Thiên công uy lực
                </h3>
                <p className="text-[14px] text-muted leading-relaxed font-normal">
                  Đầu vợt đầm, thân cứng trợ lực cho các cú đập cầu cắm sân và tấn công dồn ép từ cuối sân.
                </p>
              </div>
              <div className="flex items-center justify-between text-[13px] text-ink font-medium pt-4 border-t border-line">
                <span>Khám phá dòng thiên công</span>
                <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/vot-cau-long?playstyle=CÂN+BẰNG"
              className="group p-6 sm:p-8 rounded-2xl bg-surface border border-line hover:border-ink/30 transition-all flex flex-col justify-between space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[13px] text-muted font-normal">Even Balance · Linh hoạt</span>
                <h3 className="text-xl font-medium text-ink group-hover:text-brand transition-colors">
                  Công thủ toàn diện
                </h3>
                <p className="text-[14px] text-muted leading-relaxed font-normal">
                  Cân bằng trọng lượng hoàn hảo, dễ thuần, linh hoạt chuyển đổi giữa gài lưới và ve cầu thoát hiểm.
                </p>
              </div>
              <div className="flex items-center justify-between text-[13px] text-ink font-medium pt-4 border-t border-line">
                <span>Khám phá dòng cân bằng</span>
                <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/vot-cau-long?playstyle=THIÊN+THỦ"
              className="group p-6 sm:p-8 rounded-2xl bg-surface border border-line hover:border-ink/30 transition-all flex flex-col justify-between space-y-8"
            >
              <div className="space-y-2">
                <span className="text-[13px] text-muted font-normal">Head Light · Tốc độ cao</span>
                <h3 className="text-xl font-medium text-ink group-hover:text-brand transition-colors">
                  Phản tạt tốc độ
                </h3>
                <p className="text-[14px] text-muted leading-relaxed font-normal">
                  Đầu nhẹ, thân đũa siêu đàn hồi, tối ưu tốc độ vung vợt trong các pha đôi công chớp nhoáng trên lưới.
                </p>
              </div>
              <div className="flex items-center justify-between text-[13px] text-ink font-medium pt-4 border-t border-line">
                <span>Khám phá dòng thiên thủ</span>
                <ChevronRight className="w-4 h-4 text-muted group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </Container>
      </section>

      {/* 5. SECTION 2 MỚI: DYNAMIC "SẢN PHẨM MỚI VỀ" & "BÁN CHẠY TUẦN NÀY" */}
      <section className="py-16 sm:py-20 border-b border-line bg-surface/50">
        <Container className="space-y-12">


          {/* Tiểu mục 2.2: Bán chạy tuần này (ShopVNB style đồng bộ với Sản phẩm mới) */}
          <div className="space-y-6 pt-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-600 dark:text-amber-400 mb-1">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>Xu hướng đặt mua cao nhất</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
                Bán chạy tuần này
              </h2>
              <div className="w-20 h-1 bg-brand rounded-full mt-2.5" />
            </div>

            <HomeProductTabs products={bestSellers} initialTab="all" badgeText="Bán chạy" />
          </div>
        </Container>
      </section>

      {/* 6. THƯƠNG HIỆU MARQUEE CHẠY NGANG VÔ TẬN */}
      <section className="py-7 border-b border-line bg-surface/60 overflow-hidden select-none relative group">
        {/* Lớp che mờ hai đầu trái/phải tạo chiều sâu (Fade Mask) */}
        {/* design-rule-ignore: marquee edge fade */}<div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-bg via-bg/80 to-transparent z-10 pointer-events-none" />
        {/* design-rule-ignore: marquee edge fade */}<div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-bg via-bg/80 to-transparent z-10 pointer-events-none" />

        {/* Thanh cuộn chạy ngang liên tục */}
        <div className="animate-marquee items-center gap-10 sm:gap-16 text-[15px] sm:text-[18px] font-medium text-muted">
          {/* Nhóm 1 */}
          <div className="flex items-center gap-10 sm:gap-16 shrink-0">
            <Link href="/vot-cau-long?brand=Yonex" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>YONEX</span>
            </Link>
            <span className="text-line text-sm">•</span>
            <Link href="/vot-cau-long?brand=Li-Ning" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>LI-NING</span>
            </Link>
            <span className="text-line text-sm">•</span>
            <Link href="/vot-cau-long?brand=Victor" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>VICTOR</span>
            </Link>
            <span className="text-line text-sm">•</span>
            <Link href="/giay-cau-long?brand=Mizuno" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>MIZUNO</span>
            </Link>
            <span className="text-line text-sm">•</span>
            <Link href="/vot-cau-long?brand=Apacs" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>APACS</span>
            </Link>
            <span className="text-line text-sm">•</span>
            <Link href="/giay-cau-long" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>KAWASAKI</span>
            </Link>
            <span className="text-line text-sm">•</span>
            <Link href="/day-cuoc" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>GOSEN</span>
            </Link>
            <span className="text-line text-sm">•</span>
          </div>

          {/* Nhóm 2 (Duplicate nhân bản để lặp vô tận liền mạch) */}
          <div className="flex items-center gap-10 sm:gap-16 shrink-0" aria-hidden="true">
            <Link href="/vot-cau-long?brand=Yonex" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>YONEX</span>
            </Link>
            <span className="text-line text-sm">•</span>
            <Link href="/vot-cau-long?brand=Li-Ning" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>LI-NING</span>
            </Link>
            <span className="text-line text-sm">•</span>
            <Link href="/vot-cau-long?brand=Victor" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>VICTOR</span>
            </Link>
            <span className="text-line text-sm">•</span>
            <Link href="/giay-cau-long?brand=Mizuno" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>MIZUNO</span>
            </Link>
            <span className="text-line text-sm">•</span>
            <Link href="/vot-cau-long?brand=Apacs" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>APACS</span>
            </Link>
            <span className="text-line text-sm">•</span>
            <Link href="/giay-cau-long" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>KAWASAKI</span>
            </Link>
            <span className="text-line text-sm">•</span>
            <Link href="/day-cuoc" className="hover:text-brand transition-colors flex items-center gap-2">
              <span>GOSEN</span>
            </Link>
            <span className="text-line text-sm">•</span>
          </div>
        </div>
      </section>

      {/* 7. VỢT CŨ ĐÃ KIỂM ĐỊNH (SECOND-HAND SECTION - THEO THIẾT KẾ MỚI) */}
      <SecondhandSection />



      {/* 9. SECTION 4 MỚI: MINI QUIZ HƯỚNG DẪN CHỌN VỢT */}
      <section className="py-16 sm:py-20 border-b border-line">
        <Container>
          <RacketQuiz />
        </Container>
      </section>

      {/* 10. HỆ THỐNG CỬA HÀNG & GIỜ MỞ CỬA */}
      <section className="py-16 sm:py-20 border-b border-line bg-surface">
        <Container className="space-y-8">
          <div className="max-w-xl space-y-2">
            <span className="text-[13px] font-medium text-brand">Hệ thống chi nhánh</span>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
              Trực tiếp trải nghiệm và nhận vợt tại cửa hàng
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-bg border border-line space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[16px] font-medium text-ink">Chi nhánh Quận 1</h4>
                <Badge variant="brand">TP. Hồ Chí Minh</Badge>
              </div>
              <p className="text-[14px] text-muted font-normal leading-relaxed">
                {siteSettings.address_hcm || '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1'}
              </p>
              <div className="text-[13px] text-muted font-normal pt-2 border-t border-line">
                Mở cửa: {siteSettings.business_hours || '08:30 – 21:30 hàng ngày'}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-bg border border-line space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[16px] font-medium text-ink">Chi nhánh Cầu Giấy</h4>
                <Badge variant="brand">Hà Nội</Badge>
              </div>
              <p className="text-[14px] text-muted font-normal leading-relaxed">
                {siteSettings.address_hn || '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy'}
              </p>
              <div className="text-[13px] text-muted font-normal pt-2 border-t border-line">
                Mở cửa: {siteSettings.business_hours || '08:30 – 21:30 hàng ngày'}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-bg border border-line space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[16px] font-medium text-ink">Chi nhánh Hải Châu</h4>
                <Badge variant="brand">Đà Nẵng</Badge>
              </div>
              <p className="text-[14px] text-muted font-normal leading-relaxed">
                {siteSettings.address_dn || '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu'}
              </p>
              <div className="text-[13px] text-muted font-normal pt-2 border-t border-line">
                Mở cửa: {siteSettings.business_hours || '08:30 – 21:30 hàng ngày'}
              </div>
            </div>
          </div>
        </Container>
      </section>



      {/* 12. CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION) */}
      <section className="py-16 sm:py-20 border-b border-line">
        <Container className="max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[13px] font-medium text-brand">Giải đáp thắc mắc</span>
            <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
              Câu hỏi thường gặp
            </h2>
          </div>

          <div className="space-y-3">
            <details className="p-5 rounded-2xl bg-surface border border-line group">
              <summary className="font-medium text-ink text-[15px] cursor-pointer flex justify-between items-center list-none select-none">
                <span>Chính sách bảo hành vợt mới áp dụng như thế nào?</span>
                <ChevronRight className="w-4 h-4 text-muted group-open:rotate-90 transition-transform" />
              </summary>
              <p className="pt-3 text-[14px] text-muted leading-relaxed font-normal border-t border-line/60 mt-3">
                Toàn bộ vợt mới 100% được bảo hành chính hãng khung vợt 12 tháng nếu phát sinh lỗi do nhà sản xuất (nứt tự nhiên, lỗi carbon). Lỗi va chạm đối kháng trên sân sẽ được hỗ trợ hàn carbon hoặc trợ giá đổi cây mới.
              </p>
            </details>

            <details className="p-5 rounded-2xl bg-surface border border-line group">
              <summary className="font-medium text-ink text-[15px] cursor-pointer flex justify-between items-center list-none select-none">
                <span>Vợt cũ kiểm định Hạng A, B, C khác nhau thế nào?</span>
                <ChevronRight className="w-4 h-4 text-muted group-open:rotate-90 transition-transform" />
              </summary>
              <p className="pt-3 text-[14px] text-muted leading-relaxed font-normal border-t border-line/60 mt-3">
                Hạng A là vợt đẹp 98-99%, hầu như không xước xát. Hạng B có trầy sơn nhẹ nhưng khung vợt nguyên bản 100%. Hạng C có vết đấu kiếm nông đã được kỹ thuật viên thử tải đạt chuẩn thi đấu. Cả 3 hạng đều được bảo hành kết cấu 3 tháng.
              </p>
            </details>

            <details className="p-5 rounded-2xl bg-surface border border-line group">
              <summary className="font-medium text-ink text-[15px] cursor-pointer flex justify-between items-center list-none select-none">
                <span>Tôi có thể đến cửa hàng căng cước và nhận vợt ngay không?</span>
                <ChevronRight className="w-4 h-4 text-muted group-open:rotate-90 transition-transform" />
              </summary>
              <p className="pt-3 text-[14px] text-muted leading-relaxed font-normal border-t border-line/60 mt-3">
                Có. Bạn có thể chọn hình thức nhận tại 1 trong 3 chi nhánh. Kỹ thuật viên sẽ đo lực căng cước bằng máy điện tử chuẩn xác và hoàn tất trong vòng 30 phút.
              </p>
            </details>

            <details className="p-5 rounded-2xl bg-surface border border-line group">
              <summary className="font-medium text-ink text-[15px] cursor-pointer flex justify-between items-center list-none select-none">
                <span>Làm sao để biết tình trạng tồn kho trên website có chính xác không?</span>
                <ChevronRight className="w-4 h-4 text-muted group-open:rotate-90 transition-transform" />
              </summary>
              <p className="pt-3 text-[14px] text-muted leading-relaxed font-normal border-t border-line/60 mt-3">
                Dữ liệu tồn kho được đồng bộ thời gian thực với hệ thống kho chi nhánh. Khi bạn tạo đơn thanh toán VietQR, hệ thống sẽ tự động giữ hàng ngay lập tức để không ai có thể mua trùng.
              </p>
            </details>
          </div>
        </Container>
      </section>

      {/* 13. KÊU GỌI CUỐI TRANG (FINAL CTA) */}
      <section className="py-16 sm:py-24 text-center">
        <Container className="max-w-2xl text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-ink">
            Sẵn sàng nâng tầm trận cầu của bạn?
          </h2>
          <p className="text-[16px] text-muted font-normal leading-relaxed">
            Khám phá ngay các mẫu vợt chất lượng cao với chính sách bảo hành an tâm tuyệt đối.
          </p>
          <div className="pt-2">
            <Link
              href="/vot-cau-long"
              className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-ink text-bg text-[15px] font-medium hover:opacity-90 transition-opacity"
            >
              Khám phá bộ sưu tập vợt
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
