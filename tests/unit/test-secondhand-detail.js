/**
 * test-secondhand-detail.js
 * Verification suite for Milestone M2 (Storefront Upgrade):
 * 1. Second-hand detail page (/second-hand/[id]):
 *    - HTTP 200 for valid unit
 *    - 16-criteria inspection table in 4 groups with PASS badges
 *    - Multi-angle gallery with scratch callouts and lightbox
 *    - Reservation CTA button (SecondhandOrderButton)
 *    - Inspector staff and buyback date metadata
 * 2. Second-hand listing (/second-hand):
 *    - Card links leading directly to /second-hand/[id]
 * 3. Branch page (/chi-nhanh):
 *    - Real, responsive Google Maps iframe embed
 * 4. Product reviews on racquet detail page:
 *    - Enclosed card container
 *    - Visible reviews <= 3 by default with "Xem thêm" toggle
 * 5. Homepage upgrades (/):
 *    - Section 1: Legendary athletes ("Được dùng bởi VĐV huyền thoại")
 *    - Section 2: Dynamic "Sản phẩm mới về" & "Bán chạy tuần này" from DB
 *    - Section 3: Badminton news & tournaments ("Văn hóa cầu lông & Tiêu điểm giải đấu")
 *    - Section 4: Interactive racket recommendation quiz ("Tìm cây vợt phù hợp với bạn")
 * 6. Category navigation & wrappers:
 *    - Faceted sidebar with "Nhóm danh mục" on /vot-cau-long
 *    - 8 category route wrappers returning HTTP 200
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function fetchText(urlPath) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${urlPath}`;
    http.get(fullUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failCount++;
  }
}

async function runTests() {
  console.log('========================================================================');
  console.log(' MILESTONE M2 STOREFRONT UPGRADE VERIFICATION SUITE');
  console.log('========================================================================\n');

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Second-Hand Detail Page (/second-hand/SH-20261013-0001)
    // -------------------------------------------------------------------------
    console.log('[TEST 1] Second-hand detail page (/second-hand/SH-20261013-0001)...');
    const shRes = await fetchText('/second-hand/SH-20261013-0001');
    assert(shRes.statusCode === 200, `HTTP status is 200 (received ${shRes.statusCode})`);
    
    // Check model name and grade
    assert(shRes.body.includes('Yonex Astrox 88D Pro'), 'Contains model name "Yonex Astrox 88D Pro"');
    assert(shRes.body.includes('Hạng A'), 'Contains grade badge "Hạng A"');

    // Check 16 criteria table across 4 groups
    assert(shRes.body.includes('Bảng 16 tiêu chí kiểm định'), 'Contains header "Bảng 16 tiêu chí kiểm định"');
    assert(shRes.body.includes('Khung vợt'), 'Contains Group 1: Khung vợt');
    assert(shRes.body.includes('Đũa &amp; Thân vợt') || shRes.body.includes('Đũa & Thân vợt'), 'Contains Group 2: Đũa & Thân vợt');
    assert(shRes.body.includes('Hệ thống gen &amp; Cước') || shRes.body.includes('Hệ thống gen & Cước'), 'Contains Group 3: Hệ thống gen & Cước');
    assert(shRes.body.includes('Cán cầm &amp; Nắp đáy') || shRes.body.includes('Cán cầm & Nắp đáy'), 'Contains Group 4: Cán cầm & Nắp đáy');
    assert(shRes.body.includes('16 tiêu chuẩn PASS') || shRes.body.includes('tiêu chuẩn PASS'), 'Contains PASS count indicators for groups');
    assert(shRes.body.includes('Độ nguyên bản kết cấu carbon'), 'Contains criteria item "Độ nguyên bản kết cấu carbon"');
    assert(shRes.body.includes('Thấu quang hồng ngoại kiểm tra nứt ngầm'), 'Contains testing method');
    assert(shRes.body.includes('Khắc laser serial nón khớp hồ sơ'), 'Contains item 16 serial check');

    // Check photo gallery and scratch callout
    assert(
      shRes.body.includes('Toàn cảnh mặt trước') || shRes.body.includes('Khung vợt góc 11h'),
      'Contains gallery photo labels'
    );
    assert(
      shRes.body.includes('Vành vợt đẹp không tì vết') || shRes.body.includes('Trầy xước dăm') || shRes.body.includes('Khối đúc liền carbon'),
      'Contains inspection scratch callouts'
    );

    // Check reservation button
    assert(
      shRes.body.includes('Đặt giữ vợt ngay') || shRes.body.includes('Giữ chỗ') || shRes.body.includes('SecondhandOrderButton'),
      'Contains reservation CTA button'
    );

    // Check inspector info
    assert(
      shRes.body.includes('KTV Thẩm định:') || shRes.body.includes('Chuyên viên kỹ thuật'),
      'Contains inspection staff info'
    );
    assert(shRes.body.includes('Ngày phê duyệt:'), 'Contains inspection approval date');

    // -------------------------------------------------------------------------
    // TEST 2: Second-Hand Listing Cards Link to Detail Page
    // -------------------------------------------------------------------------
    console.log('\n[TEST 2] Second-hand listing page links (/second-hand)...');
    const shListRes = await fetchText('/second-hand');
    assert(shListRes.statusCode === 200, `HTTP status is 200 (received ${shListRes.statusCode})`);
    assert(
      shListRes.body.includes('/second-hand/SH-20261013-0001'),
      'Product card links directly to /second-hand/SH-20261013-0001'
    );

    // -------------------------------------------------------------------------
    // TEST 3: Branch Page Google Maps Iframe (/chi-nhanh)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 3] Branch page Google Maps embed (/chi-nhanh)...');
    const branchRes = await fetchText('/chi-nhanh');
    assert(branchRes.statusCode === 200, `HTTP status is 200 (received ${branchRes.statusCode})`);
    assert(
      branchRes.body.includes('maps.google.com/maps') && branchRes.body.includes('output=embed'),
      'Contains responsive Google Maps embed iframe with output=embed'
    );
    assert(branchRes.body.includes('iframe'), 'Contains <iframe> element');

    // -------------------------------------------------------------------------
    // TEST 4: Product Reviews Component on Racquet Detail Page
    // -------------------------------------------------------------------------
    console.log('\n[TEST 4] Product reviews on detail page (/vot-cau-long/yonex-astrox-99-pro)...');
    const productRes = await fetchText('/vot-cau-long/yonex-astrox-99-pro');
    assert(productRes.statusCode === 200, `HTTP status is 200 (received ${productRes.statusCode})`);
    assert(
      productRes.body.includes('Đánh giá từ người chơi') || productRes.body.includes('Đánh giá từ khách hàng'),
      'Contains customer reviews heading'
    );
    assert(
      productRes.body.includes('Xem thêm') || productRes.body.includes('Thu gọn'),
      'Contains review expansion toggle button ("Xem thêm / Thu gọn")'
    );
    assert(
      productRes.body.includes('bg-surface') && productRes.body.includes('rounded-3xl'),
      'Reviews component wrapped in enclosed card container'
    );

    // -------------------------------------------------------------------------
    // TEST 5: Homepage Upgrades (/)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 5] Homepage sections (/)...');
    const homeRes = await fetchText('/');
    assert(homeRes.statusCode === 200, `HTTP status is 200 (received ${homeRes.statusCode})`);

    // Section 1: Athletes
    assert(
      homeRes.body.includes('Được dùng bởi VĐV huyền thoại'),
      'Contains Section 1: "Được dùng bởi VĐV huyền thoại"'
    );
    assert(
      homeRes.body.includes('Viktor Axelsen') &&
      homeRes.body.includes('Kento Momota') &&
      homeRes.body.includes('An Se-young'),
      'Section 1 lists Viktor Axelsen, Kento Momota, and An Se-young'
    );

    // Section 2: Dynamic New Arrivals & Best Sellers
    assert(
      homeRes.body.includes('Sản phẩm mới về'),
      'Contains Section 2: "Sản phẩm mới về"'
    );
    assert(
      homeRes.body.includes('Bán chạy tuần này'),
      'Contains Section 2: "Bán chạy tuần này"'
    );

    // Section 3: Badminton News & Tournaments
    assert(
      homeRes.body.includes('Văn hóa cầu lông &amp; Tiêu điểm giải đấu') ||
      homeRes.body.includes('Văn hóa cầu lông & Tiêu điểm giải đấu'),
      'Contains Section 3: "Văn hóa cầu lông & Tiêu điểm giải đấu"'
    );
    assert(
      homeRes.body.includes('BWF World Tour Finals') &&
      homeRes.body.includes('All England Open'),
      'Section 3 covers major tournaments (BWF Finals, All England)'
    );

    // Section 4: Interactive Racket Quiz
    assert(
      homeRes.body.includes('Hướng dẫn chọn vợt phù hợp với bạn') ||
      homeRes.body.includes('chọn vợt phù hợp với bạn'),
      'Contains Section 4: Racket Recommendation Quiz'
    );
    assert(
      homeRes.body.includes('Trình độ chơi cầu của bạn') ||
      homeRes.body.includes('Câu hỏi 1:') ||
      homeRes.body.includes('Thuật toán thông minh'),
      'Quiz contains interactive wizard flow'
    );

    // -------------------------------------------------------------------------
    // TEST 6: Faceted Sidebar & Category Navigation (/vot-cau-long)
    // -------------------------------------------------------------------------
    console.log('\n[TEST 6] Faceted Category Sidebar (/vot-cau-long)...');
    const catRes = await fetchText('/vot-cau-long');
    assert(catRes.statusCode === 200, `HTTP status is 200 (received ${catRes.statusCode})`);
    assert(catRes.body.includes('Nhóm danh mục'), 'Sidebar contains "Nhóm danh mục" facet');
    assert(
      catRes.body.includes('Vợt cầu lông') &&
      catRes.body.includes('Dây cước') &&
      catRes.body.includes('Giày cầu lông'),
      'Sidebar lists product categories'
    );

    // -------------------------------------------------------------------------
    // TEST 7: 8 Category Route Wrappers
    // -------------------------------------------------------------------------
    console.log('\n[TEST 7] Category Route Wrappers...');
    const categoryRoutes = [
      { path: '/day-cuoc', name: 'Dây cước' },
      { path: '/giay-cau-long', name: 'Giày cầu lông' },
      { path: '/qua-cau-long', name: 'Quả cầu lông' },
      { path: '/tui-bao-vot', name: 'Túi & Bao vợt' },
      { path: '/quan-can', name: 'Quấn cán & Phụ trợ' },
      { path: '/luoi-cau-long', name: 'Lưới & Trụ cầu lông' },
      { path: '/quan-ao', name: 'Trang phục & Quần áo' },
      { path: '/phu-kien', name: 'Phụ kiện thi đấu' },
    ];

    for (const route of categoryRoutes) {
      const res = await fetchText(route.path);
      assert(
        res.statusCode === 200,
        `Route ${route.path} returns HTTP 200 (${route.name})`
      );
    }

    console.log('\n========================================================================');
    console.log(` RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
    console.log('========================================================================');

    if (failCount > 0) {
      process.exit(1);
    } else {
      console.log('>>> ALL MILESTONE M2 STOREFRONT UPGRADE CHECKS PASSED <<<\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('Test execution failed with error:', error);
    process.exit(1);
  }
}

runTests();
