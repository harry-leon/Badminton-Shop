/**
 * test/adversarial-m2-c1.js
 * Adversarial Challenger empirical verification suite for Milestone M2:
 * 1. Second-hand detail route (/second-hand/[id]):
 *    - Query secondhand_db for all existing units
 *    - Verify all 16 inspection criteria in DOM for approved units
 *    - Verify scratch callouts render properly across grades
 *    - Verify 404 handling for non-approved, non-existent, and malicious IDs
 * 2. Google Maps embed on /chi-nhanh:
 *    - Check iframe src contains valid embed URL with encoded address for each of the 3 branches
 *    - Verify interactive tab switching updates iframe
 *    - Test responsiveness across mobile, tablet, and desktop viewports
 *    - Verify zero unhandled browser console errors
 * 3. ProductReviews component on /vot-cau-long/[slug]:
 *    - Verify initial display is <= 3 reviews (exactly 3)
 *    - Verify expand toggle ("Xem thêm") expands all reviews
 *    - Verify toggle text changes to "Thu gọn"
 *    - Verify collapse toggle ("Thu gọn") returns count to <= 3
 * 4. Secondhand gallery interaction:
 *    - Interactive thumbnail switching updates active photo and callout
 *    - Lightbox modal open and close
 */

const http = require('http');
const path = require('path');
const { Pool } = require(path.join(__dirname, '../frontend/node_modules/pg'));
const { withPage, VIEWPORTS } = require('../e2e/helpers/browser');

const BASE_URL = 'http://localhost:3000';

function fetchHttp(urlPath) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${BASE_URL}${urlPath}`;
    http.get(fullUrl, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
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
const failures = [];

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${details ? ' — ' + details : ''}`);
    failCount++;
    failures.push({ testName, details });
  }
}

const ALL_16_CRITERIA = [
  'Độ nguyên bản kết cấu carbon',
  'Độ biến dạng vi mô góc 2h - 10h',
  'Khớp chữ T liên kết (T-Joint)',
  'Độ chịu lực vặn xoắn mặt vợt',
  'Mức độ xước nước sơn vành vợt',
  'Độ thẳng trục đũa 360 độ',
  'Độ đàn hồi phục hồi thân đũa',
  'Bề mặt sơn carbon đũa vợt',
  'Khớp nối nón chụp và đũa',
  'Tình trạng lỗ gen bảo vệ cước',
  'Dải gen liên kết góc 12h',
  'Tình trạng cước đan & số cân còn lại',
  'Cốt gỗ cán cầm bên trong',
  'Quấn cốt nguyên bản',
  'Chóp nắp đáy & logo chính hãng',
  'Khắc laser serial nón khớp hồ sơ'
];

const FOUR_CRITERIA_GROUPS = [
  'Khung vợt',
  'Đũa & Thân vợt',
  'Hệ thống gen & Cước',
  'Cán cầm & Nắp đáy'
];

const BRANCH_DATA = [
  {
    id: 'BR_HCM_01',
    name: 'Smash Court — Quận 1',
    address: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1',
    encoded: encodeURIComponent('123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1'),
  },
  {
    id: 'BR_HN_01',
    name: 'Smash Court — Cầu Giấy',
    address: '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy',
    encoded: encodeURIComponent('45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy'),
  },
  {
    id: 'BR_DN_01',
    name: 'Smash Court — Hải Châu',
    address: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu',
    encoded: encodeURIComponent('78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu'),
  },
];

async function runAdversarialM2Suite() {
  console.log('========================================================================');
  console.log(' EMPIRICAL ADVERSARIAL CHALLENGER SUITE — MILESTONE M2');
  console.log(' Testing: Second-Hand Detail, Reviews Component, and Branch Maps Embed');
  console.log('========================================================================\n');

  // =========================================================================
  // SECTION 1: Database Query & Second-Hand Detail Routes (/second-hand/[id])
  // =========================================================================
  console.log('--- [SECTION 1: Second-Hand Detail & 16 Criteria Inspection] ---');

  const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: '',
    database: 'secondhand_db'
  });

  let dbUnits = [];
  try {
    const res = await pool.query('SELECT * FROM secondhand_units ORDER BY id');
    dbUnits = res.rows;
    console.log(`Queried secondhand_db: found ${dbUnits.length} total units in database:`);
    for (const u of dbUnits) {
      console.log(`  - ${u.id}: ${u.model_name} (Grade ${u.grade}, status: ${u.status})`);
    }
  } catch (err) {
    assert(false, 'Database connection to secondhand_db', err.message);
  } finally {
    await pool.end();
  }

  assert(dbUnits.length >= 2, 'secondhand_db contains units for testing', `Count: ${dbUnits.length}`);

  // Test every unit in database
  for (const unit of dbUnits) {
    console.log(`\nTesting unit ${unit.id} (${unit.model_name}, status: ${unit.status})...`);
    const res = await fetchHttp(`/second-hand/${unit.id}`);

    if (unit.status === 'APPROVED_FOR_SALE') {
      assert(res.statusCode === 200, `Approved unit ${unit.id} returns HTTP 200`, `Got: ${res.statusCode}`);
      assert(res.body.includes(unit.model_name), `Unit ${unit.id} page contains model name "${unit.model_name}"`);
      assert(res.body.includes(`Hạng ${unit.grade}`), `Unit ${unit.id} page contains grade "Hạng ${unit.grade}"`);

      // 1. Assert all 16 criteria are present in DOM (accounting for HTML escaping of & as &amp;)
      let missingCriteria = [];
      for (const criterion of ALL_16_CRITERIA) {
        const criterionEncoded = criterion.replace('&', '&amp;');
        if (!res.body.includes(criterion) && !res.body.includes(criterionEncoded)) {
          missingCriteria.push(criterion);
        }
      }
      assert(
        missingCriteria.length === 0,
        `Unit ${unit.id} contains ALL 16 inspection criteria in DOM`,
        missingCriteria.length > 0 ? `Missing: ${missingCriteria.join(', ')}` : ''
      );

      // 2. Assert 4 criteria groups are present
      let missingGroups = [];
      for (const group of FOUR_CRITERIA_GROUPS) {
        const groupEncoded = group.replace('&', '&amp;');
        if (!res.body.includes(group) && !res.body.includes(groupEncoded)) {
          missingGroups.push(group);
        }
      }
      assert(
        missingGroups.length === 0,
        `Unit ${unit.id} contains all 4 inspection groups in DOM`,
        missingGroups.length > 0 ? `Missing: ${missingGroups.join(', ')}` : ''
      );

      // 3. Assert scratch callouts render
      if (unit.grade === 'A') {
        assert(
          res.body.includes('Vành vợt đẹp không tì vết') || res.body.includes('Khối đúc liền carbon'),
          `Unit ${unit.id} (Grade A) renders Grade A inspection callout without crash`
        );
      } else if (unit.grade === 'B') {
        assert(
          res.body.includes('Trầy xước dăm 1.2mm') || res.body.includes('Khối đúc liền carbon'),
          `Unit ${unit.id} (Grade B) renders Grade B inspection callout without crash`
        );
      }

      // 4. Assert reservation button exists
      assert(
        res.body.includes('Đặt giữ vợt ngay') || res.body.includes('Giữ chỗ') || res.body.includes('SecondhandOrderButton'),
        `Unit ${unit.id} contains reservation CTA button`
      );

      // 5. Assert serial number masking
      assert(
        res.body.includes('***') || res.body.includes('Mã serial nón vợt:'),
        `Unit ${unit.id} displays masked serial number`
      );
    } else {
      // Unit is NOT APPROVED_FOR_SALE (e.g. PENDING_RESALE_APPROVAL)
      assert(
        res.statusCode === 404,
        `Non-approved unit ${unit.id} (${unit.status}) returns HTTP 404 (notFound)`,
        `Got: ${res.statusCode}`
      );
    }
  }

  // Test non-existent IDs and negative edge cases
  console.log('\nTesting non-existent and adversarial IDs for 404 handling...');
  const negativeCases = [
    { id: 'SH-20261013-0004', desc: 'Unseeded unit 0004' },
    { id: 'SH-20261013-0005', desc: 'Unseeded unit 0005' },
    { id: 'SH-INVALID-9999', desc: 'Invalid ID format' },
    { id: 'SH-00000000-0000', desc: 'Non-existent zero ID' },
    { id: 'random-string-not-found', desc: 'Arbitrary string ID' },
    { id: "SH-20261013-0001' OR '1'='1", desc: 'SQL injection string in URL' },
  ];

  for (const c of negativeCases) {
    const res = await fetchHttp(`/second-hand/${encodeURIComponent(c.id)}`);
    assert(
      res.statusCode === 404,
      `Non-existent ID ${c.id} (${c.desc}) returns HTTP 404`,
      `Received: ${res.statusCode}`
    );
  }

  // =========================================================================
  // SECTION 2: Google Maps Embed on /chi-nhanh
  // =========================================================================
  console.log('\n--- [SECTION 2: Google Maps Embed on /chi-nhanh] ---');

  // Verify static HTTP SSR markup
  const branchRes = await fetchHttp('/chi-nhanh');
  assert(branchRes.statusCode === 200, 'Page /chi-nhanh returns HTTP 200', `Got: ${branchRes.statusCode}`);
  assert(branchRes.body.includes('<iframe'), 'Page /chi-nhanh contains <iframe> in SSR HTML');
  assert(
    branchRes.body.includes('https://maps.google.com/maps?q='),
    'Iframe src contains Google Maps search query URL'
  );
  assert(
    branchRes.body.includes('output=embed'),
    'Iframe src contains output=embed parameter for keyless embed'
  );

  // In-browser verification with Playwright
  console.log('\nLaunching Playwright browser to test /chi-nhanh map interactions and responsiveness...');
  const appConsoleErrors = [];
  const pageErrors = [];

  await withPage({ viewport: VIEWPORTS.desktop }, async (page) => {
    page.on('console', (msg) => {
      const loc = msg.location() || {};
      const url = loc.url || '';
      // Exclude 3rd party google maps internal logs and favicon 404
      if (url.includes('favicon.ico') || url.includes('google.com') || url.includes('gstatic.com') || url.includes('googleapis.com')) {
        return;
      }
      if (msg.type() === 'error') {
        appConsoleErrors.push(`${msg.text()} (${url}:${loc.lineNumber})`);
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto(`${BASE_URL}/chi-nhanh`, { waitUntil: 'domcontentloaded' });

    // Verify initial active branch (BR_HCM_01)
    let iframeSrc = await page.locator('iframe').getAttribute('src');
    assert(
      iframeSrc && iframeSrc.includes(BRANCH_DATA[0].encoded),
      `Default iframe src contains encoded address for BR_HCM_01 (${BRANCH_DATA[0].name})`,
      `src: ${iframeSrc}`
    );

    // Click branch card for BR_HN_01 (Smash Court — Cầu Giấy, index 1)
    console.log('Clicking branch card for Smash Court — Cầu Giấy...');
    const branchCards = page.locator('.lg\\:col-span-5 > div.p-4, .lg\\:col-span-5 > div.sm\\:p-5');
    await branchCards.nth(1).click();
    await page.waitForTimeout(500);

    iframeSrc = await page.locator('iframe').getAttribute('src');
    assert(
      iframeSrc && iframeSrc.includes(BRANCH_DATA[1].encoded),
      `Switched iframe src contains encoded address for BR_HN_01 (${BRANCH_DATA[1].name})`,
      `src: ${iframeSrc}`
    );

    // Click branch card for BR_DN_01 (Smash Court — Hải Châu, index 2)
    console.log('Clicking branch card for Smash Court — Hải Châu...');
    await branchCards.nth(2).click();
    await page.waitForTimeout(500);

    iframeSrc = await page.locator('iframe').getAttribute('src');
    assert(
      iframeSrc && iframeSrc.includes(BRANCH_DATA[2].encoded),
      `Switched iframe src contains encoded address for BR_DN_01 (${BRANCH_DATA[2].name})`,
      `src: ${iframeSrc}`
    );

    // Click back to BR_HCM_01 (Smash Court — Quận 1, index 0)
    console.log('Clicking branch card back to Smash Court — Quận 1...');
    await branchCards.nth(0).click();
    await page.waitForTimeout(500);

    iframeSrc = await page.locator('iframe').getAttribute('src');
    assert(
      iframeSrc && iframeSrc.includes(BRANCH_DATA[0].encoded),
      `Switched back iframe src contains encoded address for BR_HCM_01 (${BRANCH_DATA[0].name})`,
      `src: ${iframeSrc}`
    );

    // Responsiveness tests across viewports
    console.log('Testing iframe responsiveness across viewports...');
    for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(300);
      const box = await page.locator('iframe').boundingBox();
      assert(
        box && box.width > 250 && box.height > 200,
        `Iframe renders with positive responsive dimensions in ${vpName} (${vp.width}x${vp.height})`,
        `Dimensions: ${box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'null'}`
      );
    }
  });

  assert(
    pageErrors.length === 0,
    'Zero unhandled page errors on /chi-nhanh',
    pageErrors.length > 0 ? `Errors: ${pageErrors.join('; ')}` : ''
  );

  assert(
    appConsoleErrors.length === 0,
    'Zero application console errors on /chi-nhanh',
    appConsoleErrors.length > 0 ? `Errors: ${appConsoleErrors.join('; ')}` : ''
  );

  // =========================================================================
  // SECTION 3: ProductReviews Component
  // =========================================================================
  console.log('\n--- [SECTION 3: ProductReviews Component (<= 3 Initial, Expand/Collapse Toggle)] ---');

  await withPage({ viewport: VIEWPORTS.desktop }, async (page) => {
    await page.goto(`${BASE_URL}/vot-cau-long/yonex-astrox-99-pro`, { waitUntil: 'domcontentloaded' });

    // Wait for reviews section
    const reviewsHeading = page.locator('text=Nhận xét từ khách hàng');
    await reviewsHeading.scrollIntoViewIfNeeded();

    // 1. Verify initial display is <= 3 reviews
    const reviewCards = page.locator('.space-y-4 > .bg-bg\\/50');
    const initialCount = await reviewCards.count();
    assert(
      initialCount <= 3 && initialCount === 3,
      `Initial visible reviews count is <= 3 (expected 3, found ${initialCount})`
    );

    // 2. Check expand button
    const toggleButton = page.locator('button:has-text("Xem thêm")');
    const hasExpandBtn = await toggleButton.isVisible();
    assert(hasExpandBtn, 'Expand toggle button ("Xem thêm") is visible initially');

    // 3. Test expand toggle ("Xem thêm") -> assert expands all reviews and toggle changes to "Thu gọn"
    console.log('Clicking "Xem thêm" button...');
    await toggleButton.click();
    await page.waitForTimeout(300);

    const expandedCount = await reviewCards.count();
    assert(
      expandedCount > 3 && expandedCount === 5,
      `Expanded visible reviews count displays all reviews (expected 5, found ${expandedCount})`
    );

    const collapseButton = page.locator('button:has-text("Thu gọn")');
    const hasCollapseBtn = await collapseButton.isVisible();
    assert(hasCollapseBtn, 'Toggle button text changes to "Thu gọn" when expanded');

    // 4. Test collapse toggle ("Thu gọn") -> assert collapses back to <= 3 reviews
    console.log('Clicking "Thu gọn" button...');
    await collapseButton.click();
    await page.waitForTimeout(300);

    const collapsedCount = await reviewCards.count();
    assert(
      collapsedCount === 3,
      `Collapsing reviews restores visible count to 3 (found ${collapsedCount})`
    );

    const reExpandBtn = page.locator('button:has-text("Xem thêm")');
    assert(
      await reExpandBtn.isVisible(),
      'Toggle button text reverts back to "Xem thêm" after collapse'
    );
  });

  // =========================================================================
  // SECTION 4: Secondhand Gallery & Scratch Callout Interaction
  // =========================================================================
  console.log('\n--- [SECTION 4: Secondhand Gallery & Lightbox Interaction] ---');

  await withPage({ viewport: VIEWPORTS.desktop }, async (page) => {
    await page.goto(`${BASE_URL}/second-hand/SH-20261013-0001`, { waitUntil: 'domcontentloaded' });

    // Check thumbnail buttons
    const thumbnails = page.locator('button:has-text("Khung vợt"), button:has-text("Toàn cảnh"), button:has-text("Khớp chữ T")');
    const thumbCount = await thumbnails.count();
    assert(thumbCount >= 3, `Found ${thumbCount} interactive photo thumbnails in gallery`);

    // Click "Khung vợt góc 11h" thumbnail
    console.log('Clicking "Khung vợt góc 11h" thumbnail...');
    const frameThumb = page.locator('button:has-text("Khung vợt góc 11h")').first();
    if (await frameThumb.isVisible()) {
      await frameThumb.click();
      await page.waitForTimeout(300);
      const calloutText = page.locator('text=Ghi nhận kiểm định vi mô:');
      assert(await calloutText.isVisible(), 'Scratch callout appears upon selecting inspection angle');
    }

    // Click "Phóng to" button
    console.log('Testing Lightbox modal open...');
    const zoomBtn = page.locator('button:has-text("Phóng to")').first();
    await zoomBtn.click();
    await page.waitForTimeout(300);

    const closeBtn = page.locator('button[aria-label="Đóng ảnh phóng to"]');
    assert(await closeBtn.isVisible(), 'Lightbox modal opened and displays close button');

    console.log('Testing Lightbox modal close...');
    await closeBtn.click();
    await page.waitForTimeout(300);
    assert(!(await closeBtn.isVisible()), 'Lightbox modal closed cleanly upon clicking close button');
  });

  // =========================================================================
  // FINAL VERDICT SUMMARY
  // =========================================================================
  console.log('\n========================================================================');
  console.log(` RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('========================================================================');

  if (failures.length > 0) {
    console.error('\nFAILURE DETAILS:');
    for (const f of failures) {
      console.error(`  - ${f.testName}: ${f.details}`);
    }
    console.log('\nVERDICT: REQUEST_CHANGES');
    process.exit(1);
  } else {
    console.log('\nVERDICT: APPROVE — ALL ADVERSARIAL STRESS TESTS PASSED CLEANLY');
    process.exit(0);
  }
}

runAdversarialM2Suite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
