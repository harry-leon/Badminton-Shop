import pg from '../frontend/node_modules/pg/lib/index.js';

async function checkAll() {
  const catPool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/catalog_db' });
  const idPool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/identity_db' });

  console.log('=== 1. HERO CAROUSEL ===');
  const heroRes = await catPool.query(`SELECT id, position, title, is_active, image_url FROM banners WHERE position IN ('HERO', 'HERO_SLIDER', 'HOME_MAIN') ORDER BY sort_order ASC`);
  console.log('Count:', heroRes.rows.length);
  heroRes.rows.forEach(r => console.log('  -', r.id, '|', r.title, '|', r.image_url));

  console.log('\n=== 2. BANNER GIỮA TRANG (MID_PAGE) ===');
  const midRes = await catPool.query(`SELECT id, position, title, is_active FROM banners WHERE position = 'MID_PAGE'`);
  console.log('Count:', midRes.rows.length);

  console.log('\n=== 3. POPUP ƯU ĐÃI (PROMO_POPUP) ===');
  const popupRes = await catPool.query(`SELECT id, position, title, is_active FROM banners WHERE position = 'PROMO_POPUP'`);
  console.log('Count:', popupRes.rows.length);

  console.log('\n=== 4. BỘ 3 BANNER ƯU ĐÃI (HOME_PROMO_3) ===');
  const promoRes = await catPool.query(`SELECT id, position, title, badge, image_url, primary_cta_text FROM banners WHERE position = 'HOME_PROMO_3' ORDER BY sort_order ASC`);
  console.log('Count:', promoRes.rows.length);
  promoRes.rows.forEach(r => console.log('  -', r.id, '|', r.badge, '|', r.title, '|', r.image_url));

  console.log('\n=== 5. ẢNH & TAG DANH MỤC ===');
  const catRes = await catPool.query(`SELECT id, name, slug, tag_subtitle, is_featured, image_url FROM categories ORDER BY sort_order ASC`);
  console.log('Count:', catRes.rows.length);
  catRes.rows.forEach(r => console.log('  -', r.id, '|', r.name, '| Tag:', r.tag_subtitle, '| Featured:', r.is_featured, '| Img:', r.image_url));

  console.log('\n=== 6. DẢI CAM KẾT & VĐV ===');
  const uspRes = await catPool.query(`SELECT id, position, title, badge, description FROM banners WHERE position IN ('USP_BAR', 'ATHLETES') ORDER BY position, sort_order`);
  console.log('Count:', uspRes.rows.length);
  uspRes.rows.forEach(r => console.log('  -', r.position, '|', r.title, '| Badge:', r.badge));

  console.log('\n=== 7. HUY HIỆU & MENU NAVIGATION ===');
  const navRes = await catPool.query(`SELECT value FROM site_settings WHERE key = 'nav_items_config'`);
  if (navRes.rows.length > 0 && navRes.rows[0].value) {
    const navItems = JSON.parse(navRes.rows[0].value);
    console.log('Count:', navItems.length);
    navItems.forEach(item => console.log('  -', item.label, '| Link:', item.href, '| Badge:', item.badge_text, '| Active:', item.is_active));
  } else {
    console.log('Chưa có nav_items_config trong site_settings');
  }

  console.log('\n=== 8. CÀI ĐẶT CHUNG HEADER & FOOTER ===');
  const setRes = await catPool.query(`SELECT key, value FROM site_settings WHERE key != 'nav_items_config' ORDER BY group_name, key`);
  console.log('Count:', setRes.rows.length);
  setRes.rows.forEach(r => console.log('  -', r.key, ':', r.value));

  await catPool.end();
  await idPool.end();
}

checkAll().catch(console.error);
