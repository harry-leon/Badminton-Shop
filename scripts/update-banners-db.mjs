import pg from '../frontend/node_modules/pg/lib/index.js';
const { Pool } = pg;

const pool = new Pool({
  host: process.env.PG_HOST || '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: process.env.PG_PASSWORD || '',
  database: 'catalog_db'
});

async function run() {
  await pool.query(`
    UPDATE banners SET image_url = '/images/banners/banner-1-gosen-ryzonic.png', mobile_image_url = '/images/banners/banner-1-gosen-ryzonic.png' WHERE id = 'banner-1-gosen-ryzonic';
    UPDATE banners SET image_url = '/images/banners/banner-2-dam-me-san-cau.png', mobile_image_url = '/images/banners/banner-2-dam-me-san-cau.png' WHERE id = 'banner-2-dam-me-san-cau';
    UPDATE banners SET image_url = '/images/banners/banner-3-but-pha-san-cau.png', mobile_image_url = '/images/banners/banner-3-but-pha-san-cau.png' WHERE id = 'banner-3-but-pha-san-cau';
    UPDATE banners SET image_url = '/images/banners/banner-4-rise-smash-repeat.png', mobile_image_url = '/images/banners/banner-4-rise-smash-repeat.png' WHERE id = 'banner-4-rise-smash-repeat';

    UPDATE banners SET 
      image_url = '/images/products/yonex-astrox-88d-pro.png',
      badge = 'ƯU ĐÃI TUẦN NÀY',
      title = 'VỢT YONEX SALE 30%',
      description = 'Tặng combo cước BG65 + Quấn cán miễn phí',
      primary_cta_text = 'Săn ngay',
      primary_cta_link = '/vot-cau-long?brand=Yonex&sale=true'
    WHERE id = 'promo-yonex-sale-30' OR id = 'promo-1-yonex-sale-30';

    UPDATE banners SET 
      image_url = '/images/categories/cat-giay-cau-long-v2.png',
      badge = 'BỘ SƯU TẬP MỚI',
      title = 'GIÀY THI ĐẤU 2026',
      description = 'Đệm Power Cushion + trợ lực khớp gối',
      primary_cta_text = 'Khám phá',
      primary_cta_link = '/giay-cau-long'
    WHERE id = 'promo-giay-2026' OR id = 'promo-2-giay-thi-dau-2026';

    UPDATE banners SET 
      image_url = '/images/products/yonex-nanoflare-800-pro.png',
      badge = 'ĐỘC QUYỀN SMASHCOURT',
      title = 'SÀN VỢT CŨ 16 TIÊU CHÍ',
      description = 'Bảo hành kết cấu 30 ngày, tiết kiệm 40%.',
      primary_cta_text = 'Xem kho vợt',
      primary_cta_link = '/second-hand'
    WHERE id = 'promo-vot-cu-16-tc' OR id = 'promo-3-san-vot-cu-16-tieu-chi';
  `);
  const res = await pool.query('SELECT id, position, title, badge, image_url FROM banners WHERE position IN (\'HOME_PROMO_3\', \'HERO_SLIDER\')');
  console.log('Database updated successfully:', res.rows);
  await pool.end();
}

run().catch(err => {
  console.error('Update error:', err);
  pool.end();
});
