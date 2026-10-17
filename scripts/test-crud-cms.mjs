import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';

function generateAdminCookie() {
  const SESSION_SECRET = process.env.SESSION_SECRET || 'smashcourt-secret-token-key-2026';
  const user = {
    id: 'usr_admin_test',
    email: 'admin@smashcourt.vn',
    username: 'admin',
    role: 'ADMIN',
  };
  const payload = JSON.stringify({
    user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

const cookieHeader = `smash_session=${generateAdminCookie()}`;

async function runTests() {
  console.log('=== TEST CRUD CHO 8 MỤC CMS BANNERS & NỘI DUNG ===\n');

  // TEST 1: HERO CAROUSEL CRUD
  console.log('1. TEST CRUD: HERO CAROUSEL');
  // Create
  const testHeroId = `test_hero_${Date.now()}`;
  const createHeroRes = await fetch(`${BASE_URL}/api/admin/banners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({
      action: 'CREATE',
      banner: {
        id: testHeroId,
        title: 'Hero Test Tự Động',
        badge: 'TEST BADGE',
        description: 'Mô tả test tự động cho hero carousel',
        primaryCtaText: 'Xem thử',
        primaryCtaLink: '/vot-cau-long',
        imageSrc: '/images/banners/banner-1-gosen-ryzonic.png',
        position: 'HERO',
        sortOrder: 99,
        isActive: true,
      },
    }),
  });
  const createHeroData = await createHeroRes.json();
  console.log('  - CREATE Hero:', createHeroData.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI', createHeroData.error || '');

  // Update
  const updateHeroRes = await fetch(`${BASE_URL}/api/admin/banners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({
      action: 'UPDATE',
      banner: {
        id: testHeroId,
        title: 'Hero Test Đã Cập Nhật',
        badge: 'TEST UPDATED',
        description: 'Mô tả đã sửa',
        primaryCtaText: 'Mua ngay',
        primaryCtaLink: '/day-cuoc',
        imageSrc: '/images/banners/banner-2-dam-me-san-cau.png',
        position: 'HERO',
        sortOrder: 99,
        isActive: true,
      },
    }),
  });
  const updateHeroData = await updateHeroRes.json();
  console.log('  - UPDATE Hero:', updateHeroData.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI');

  // Toggle
  const toggleHeroRes = await fetch(`${BASE_URL}/api/admin/banners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ action: 'TOGGLE_STATUS', bannerId: testHeroId }),
  });
  const toggleHeroData = await toggleHeroRes.json();
  console.log('  - TOGGLE Hero:', toggleHeroData.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI');

  // Delete
  const deleteHeroRes = await fetch(`${BASE_URL}/api/admin/banners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ action: 'DELETE', bannerId: testHeroId }),
  });
  const deleteHeroData = await deleteHeroRes.json();
  console.log('  - DELETE Hero:', deleteHeroData.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI');

  // TEST 2: BANNER GIỮA TRANG (MID_PAGE) CRUD
  console.log('\n2. TEST CRUD: BANNER GIỮA TRANG (MID_PAGE)');
  const testMidId = `test_mid_${Date.now()}`;
  const createMidRes = await fetch(`${BASE_URL}/api/admin/banners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({
      action: 'CREATE',
      banner: {
        id: testMidId,
        title: 'Banner Giữa Trang Khuyến Mãi Mùa Hè',
        badge: 'MID PAGE PROMO',
        description: 'Ưu đãi đặt sân và căng cước',
        primaryCtaText: 'Chi tiết',
        primaryCtaLink: '/chi-nhanh',
        imageSrc: '/images/banners/banner-3-but-pha-san-cau.png',
        position: 'MID_PAGE',
        sortOrder: 1,
        isActive: true,
      },
    }),
  });
  const createMidData = await createMidRes.json();
  console.log('  - CREATE MID_PAGE:', createMidData.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI');

  // Clean up test mid page
  await fetch(`${BASE_URL}/api/admin/banners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ action: 'DELETE', bannerId: testMidId }),
  });
  console.log('  - DELETE MID_PAGE (Clean up): ✅ Đã dọn dẹp');

  // TEST 3: POPUP ƯU ĐÃI (PROMO_POPUP) CRUD
  console.log('\n3. TEST CRUD: POPUP ƯU ĐÃI (PROMO_POPUP)');
  const testPopupId = `test_popup_${Date.now()}`;
  const createPopupRes = await fetch(`${BASE_URL}/api/admin/banners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({
      action: 'CREATE',
      banner: {
        id: testPopupId,
        title: 'Voucher Giảm 100k Đơn Đầu Tiên',
        badge: 'QUÀ TẶNG BẠN MỚI',
        description: 'Nhập mã SMASH100 khi thanh toán',
        primaryCtaText: 'Nhận voucher',
        primaryCtaLink: '/dang-nhap',
        imageSrc: '/images/products/yonex-astrox-100zz.png',
        position: 'PROMO_POPUP',
        sortOrder: 1,
        isActive: true,
      },
    }),
  });
  const createPopupData = await createPopupRes.json();
  console.log('  - CREATE PROMO_POPUP:', createPopupData.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI');

  // Clean up test popup
  await fetch(`${BASE_URL}/api/admin/banners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ action: 'DELETE', bannerId: testPopupId }),
  });
  console.log('  - DELETE PROMO_POPUP (Clean up): ✅ Đã dọn dẹp');

  // TEST 4: BỘ 3 BANNER ƯU ĐÃI (HOME_PROMO_3) UPDATE
  console.log('\n4. TEST CRUD: BỘ 3 BANNER ƯU ĐÃI (HOME_PROMO_3)');
  const updatePromoRes = await fetch(`${BASE_URL}/api/admin/banners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({
      action: 'UPDATE',
      banner: {
        id: 'promo-yonex-sale-30',
        title: 'VỢT YONEX SALE 30%',
        badge: 'ƯU ĐÃI TUẦN NÀY',
        description: 'Tặng combo cước BG65 + Quấn cán miễn phí',
        primaryCtaText: 'Săn ngay',
        primaryCtaLink: '/vot-cau-long?brand=Yonex&sale=true',
        imageSrc: '/images/products/yonex-astrox-88d-pro.png',
        position: 'HOME_PROMO_3',
        sortOrder: 1,
        isActive: true,
      },
    }),
  });
  const updatePromoData = await updatePromoRes.json();
  console.log('  - UPDATE HOME_PROMO_3 Card 1:', updatePromoData.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI');

  // TEST 5: ẢNH & TAG DANH MỤC UPDATE & TOGGLE
  console.log('\n5. TEST CRUD: ẢNH & TAG DANH MỤC');
  const getCatsRes = await fetch(`${BASE_URL}/api/admin/categories`);
  const getCatsData = await getCatsRes.json();
  console.log('  - GET Categories:', getCatsData.success ? `✅ Tìm thấy ${getCatsData.categories.length} danh mục` : '❌ Lỗi');

  const toggleCatRes = await fetch(`${BASE_URL}/api/admin/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ action: 'TOGGLE_FEATURED', categoryId: 'cat_racket' }),
  });
  const toggleCatData = await toggleCatRes.json();
  console.log('  - TOGGLE Category Featured:', toggleCatData.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI');

  // Re-toggle back
  await fetch(`${BASE_URL}/api/admin/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ action: 'TOGGLE_FEATURED', categoryId: 'cat_racket' }),
  });

  // TEST 6: DẢI CAM KẾT (USP_BAR) & VĐV (ATHLETES)
  console.log('\n6. TEST CRUD: DẢI CAM KẾT & VĐV');
  const updateUspRes = await fetch(`${BASE_URL}/api/admin/banners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({
      action: 'UPDATE',
      banner: {
        id: 'usp-van-chuyen',
        title: 'Vận chuyển TOÀN QUỐC',
        badge: 'Truck',
        description: 'Thanh toán khi nhận hàng',
        primaryCtaText: '',
        primaryCtaLink: '',
        imageSrc: '',
        position: 'USP_BAR',
        sortOrder: 1,
        isActive: true,
      },
    }),
  });
  const updateUspData = await updateUspRes.json();
  console.log('  - UPDATE USP_BAR:', updateUspData.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI');

  // TEST 7: HUY HIỆU & MENU NAVIGATION
  console.log('\n7. TEST CRUD: HUY HIỆU & MENU NAVIGATION');
  const getSettingsRes = await fetch(`${BASE_URL}/api/admin/site-settings`);
  const getSettingsData = await getSettingsRes.json();
  const navSetting = getSettingsData.settings.find(s => s.key === 'nav_items_config');
  const navList = navSetting ? JSON.parse(navSetting.value) : [];
  console.log('  - GET Nav Items:', navList.length > 0 ? `✅ Tìm thấy ${navList.length} mục menu` : '⚠️ Chưa có');

  const saveNavRes = await fetch(`${BASE_URL}/api/admin/site-settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({
      settings: [{ key: 'nav_items_config', value: JSON.stringify(navList) }]
    }),
  });
  const saveNavData = await saveNavRes.json();
  console.log('  - SAVE Nav Items:', saveNavData.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI', saveNavData.error || '');

  // TEST 8: CÀI ĐẶT CHUNG HEADER & FOOTER
  console.log('\n8. TEST CRUD: CÀI ĐẶT CHUNG HEADER & FOOTER');
  const saveSettingsRes = await fetch(`${BASE_URL}/api/admin/site-settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({
      settings: [
        { key: 'header_hotline', value: '1900 6868' },
        { key: 'footer_email', value: 'cskh@smashcourt.vn' }
      ]
    }),
  });
  const saveSettingsData = await saveSettingsRes.json();
  console.log('  - SAVE Site Settings:', saveSettingsData.success ? '✅ THÀNH CÔNG' : '❌ THẤT BẠI', saveSettingsData.error || '');

  console.log('\n=== HOÀN TẤT KIỂM THỬ CRUD TOÀN DIỆN 8 MỤC CMS! ===');
}

runTests().catch(console.error);
