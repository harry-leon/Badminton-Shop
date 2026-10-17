/**
 * EMPIRICAL CHALLENGER VERIFICATION SUITE — M0 R2-2
 * 
 * Adversarially challenges:
 * 1. PDP Halbertec 8000:
 *    - 4UG5 auto-selected by default with 20 available across branches.
 *    - Switch to 3UG5 (out of stock): single merged out-of-stock card appears.
 *    - Hotline tel:19006868 button present and clickable on desktop and mobile sticky bars.
 * 2. Secondhand serial numbers:
 *    - /api/secondhand/units direct HTTP payload inspection: all units have masked serials.
 *    - /second-hand cards and modal: display masked serials (SN-88DP-***-010).
 *    - No unmasked serial leaks in HTML/attributes.
 * 3. Storefront text & typography:
 *    - Zero matches for forbidden strings: (Quy tắc R...), Snapshot Immutability, Unique Unit,
 *      Design System, Quiet Court, Khóa kho nguyên tử R1.
 *    - Zero matches for <b> or <strong> tags.
 */

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { withPage, VIEWPORTS } = require('../e2e/helpers/browser');

const testResults = [];

function record(name, pass, detail = '') {
  testResults.push({ name, pass, detail });
  console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} ${detail ? '— ' + detail : ''}`);
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function verifySecondhandApi() {
  console.log('\n=== 1. Direct API Inspection: /api/secondhand/units ===');
  const res = await fetchJson('http://localhost:3000/api/secondhand/units');
  assert.strictEqual(res.status, 200, 'API must return HTTP 200');
  assert(res.body && Array.isArray(res.body.units), 'API response must contain units array');
  
  const units = res.body.units;
  record('API /api/secondhand/units returns 200 with units array', true, `Units count: ${units.length}`);

  let allMasked = true;
  let rawLeakFound = false;

  for (const u of units) {
    const serial = u.serial_number;
    const isMasked = typeof serial === 'string' && serial.includes('***');
    if (!isMasked) allMasked = false;

    // Check if raw serial leaked anywhere else in JSON object
    const serialized = JSON.stringify(u);
    // Raw serial format: SN-88DP-2025-010 or SN-NF800P-2024-088
    if (/SN-[A-Z0-9]+-\d{4}-\d+/i.test(serialized)) {
      rawLeakFound = true;
    }
  }

  record(
    'API Secondhand: Every unit in payload has masked serial_number with "***"',
    allMasked,
    units.map(u => `${u.id}: ${u.serial_number}`).join(', ')
  );

  record(
    'API Secondhand: Zero raw serial number leaks anywhere in JSON payload',
    !rawLeakFound,
    `Leak detected: ${rawLeakFound}`
  );
}

async function verifySecondhandUI() {
  console.log('\n=== 2. Secondhand UI Inspection: /second-hand ===');
  await withPage({ viewport: VIEWPORTS.desktop }, async (page) => {
    await page.goto('http://localhost:3000/second-hand', { waitUntil: 'networkidle' });

    // 2.1 Cards inspection
    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div.bg-surface.rounded-2xl'));
      return cards.map(c => {
        const text = c.innerText;
        const serialMatch = text.match(/Serial:\s*([^\n\r]+)/i);
        return {
          title: c.querySelector('h3')?.textContent?.trim(),
          serial: serialMatch ? serialMatch[1].trim() : null,
        };
      });
    });

    const astrox = cardData.find(c => c.title && c.title.includes('Astrox 88D Pro'));
    const astroxSerial = astrox ? astrox.serial : null;
    record(
      'UI Secondhand Card: Yonex Astrox 88D Pro displays masked serial "SN-88DP-***-010"',
      astroxSerial === 'SN-88DP-***-010',
      `Actual: "${astroxSerial}"`
    );

    const allCardsMasked = cardData.length > 0 && cardData.every(c => c.serial && c.serial.includes('***'));
    record(
      'UI Secondhand Cards: All approved secondhand cards display masked serials',
      allCardsMasked,
      `Verified ${cardData.length} cards`
    );

    // 2.2 Modal inspection
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div.bg-surface.rounded-2xl'));
      const astroxCard = cards.find(c => c.querySelector('h3')?.textContent?.includes('Astrox 88D Pro'));
      if (astroxCard) {
        const btn = astroxCard.querySelector('button');
        if (btn) btn.click();
      }
    });

    await page.waitForTimeout(500);

    const modalSerial = await page.evaluate(() => {
      const modal = document.querySelector('div.fixed.inset-0');
      if (!modal) return null;
      const serialRow = Array.from(modal.querySelectorAll('div.flex.justify-between')).find(div =>
        div.textContent.includes('Mã serial:')
      );
      return serialRow ? serialRow.textContent.replace('Mã serial:', '').trim() : null;
    });

    record(
      'UI Secondhand Modal: Reservation modal displays masked serial "SN-88DP-***-010"',
      modalSerial === 'SN-88DP-***-010',
      `Actual: "${modalSerial}"`
    );

    // 2.3 Check full DOM for unmasked serials
    const hasRawLeakInDom = await page.evaluate(() => {
      const fullHtml = document.documentElement.outerHTML;
      return /SN-[A-Z0-9]+-\d{4}-\d+/i.test(fullHtml);
    });

    record(
      'UI Secondhand DOM: Zero raw unmasked serial numbers present in HTML or attributes',
      !hasRawLeakInDom,
      `Leak in DOM: ${hasRawLeakInDom}`
    );
  });
}

async function verifyHalbertec8000PDP() {
  console.log('\n=== 3. PDP Halbertec 8000 Inspection ===');

  // Desktop
  await withPage({ viewport: VIEWPORTS.desktop }, async (page) => {
    await page.goto('http://localhost:3000/vot-cau-long/lining-halbertec-8000', { waitUntil: 'networkidle' });

    // 3.1 Verify 4UG5 variant is auto-selected by default
    const activeVariantText = await page.evaluate(() => {
      const btn = document.querySelector('button.bg-ink');
      return btn ? btn.textContent.trim() : null;
    });
    const is4USelected = activeVariantText && activeVariantText.includes('4U');
    record(
      'PDP Halbertec 8000 Desktop: 4UG5 variant is auto-selected by default',
      Boolean(is4USelected),
      `Active variant button: "${activeVariantText}"`
    );

    // 3.2 Verify stock indicates 20 available across branches
    const stockInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        has20Total: text.includes('Còn 20 cây toàn hệ thống'),
        hasHcm12: text.includes('Còn 12 cây'),
        hasHn8: text.includes('Còn 8 cây'),
      };
    });
    record(
      'PDP Halbertec 8000 Desktop: Stock displays 20 available across branches (12 HCM, 8 HN)',
      stockInfo.has20Total && stockInfo.hasHcm12 && stockInfo.hasHn8,
      `20 Total: ${stockInfo.has20Total}, 12 HCM: ${stockInfo.hasHcm12}, 8 HN: ${stockInfo.hasHn8}`
    );

    // 3.3 Verify buy button is enabled for 4UG5
    const buyButtonState = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const buyBtn = btns.find(b => b.textContent.includes('Đặt mua ngay'));
      return { exists: Boolean(buyBtn), disabled: buyBtn ? buyBtn.disabled : true };
    });
    record(
      'PDP Halbertec 8000 Desktop: "Đặt mua ngay" button is active and enabled for 4UG5',
      buyButtonState.exists && !buyButtonState.disabled,
      `Button exists: ${buyButtonState.exists}, disabled: ${buyButtonState.disabled}`
    );

    // 3.4 Switch to 3UG5 variant (out of stock)
    console.log('Switching to 3UG5 variant on Desktop...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn3U = btns.find(b => b.textContent && b.textContent.includes('3U'));
      if (btn3U) btn3U.click();
    });
    await page.waitForTimeout(600);

    // 3.5 Verify single merged out-of-stock card appears and separate branch rows disappear
    const oosCardState = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasMergedOos = text.includes('Tạm hết hàng tại tất cả 3 chi nhánh');
      const hasPreorderSupport = text.includes('Hỗ trợ đặt trước');
      // Branch separate stock cards should NOT appear
      const hasSeparateHcm = text.includes('Còn 12 cây');
      const hasSeparateHn = text.includes('Còn 8 cây');
      return {
        hasMergedOos,
        hasPreorderSupport,
        hasSeparateBranchRows: hasSeparateHcm || hasSeparateHn,
      };
    });

    record(
      'PDP Halbertec 8000 Desktop: Single merged out-of-stock card appears for 3UG5',
      oosCardState.hasMergedOos && oosCardState.hasPreorderSupport && !oosCardState.hasSeparateBranchRows,
      `Merged OOS: ${oosCardState.hasMergedOos}, Preorder: ${oosCardState.hasPreorderSupport}, Separate rows hidden: ${!oosCardState.hasSeparateBranchRows}`
    );

    // 3.6 Verify desktop hotline button tel:19006868 is visible and clickable
    const desktopHotline = await page.evaluate(() => {
      const link = document.querySelector('a[href="tel:19006868"]');
      if (!link) return { exists: false };
      const rect = link.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && link.offsetParent !== null;
      return {
        exists: true,
        isVisible,
        text: link.textContent.trim(),
        href: link.getAttribute('href'),
      };
    });

    record(
      'PDP Halbertec 8000 Desktop: Hotline tel:19006868 button is present, visible, and clickable',
      desktopHotline.exists && desktopHotline.isVisible && desktopHotline.href === 'tel:19006868',
      `Button text: "${desktopHotline.text}", href: "${desktopHotline.href}", visible: ${desktopHotline.isVisible}`
    );
  });

  // Mobile
  await withPage({ viewport: VIEWPORTS.mobile }, async (page) => {
    await page.goto('http://localhost:3000/vot-cau-long/lining-halbertec-8000', { waitUntil: 'networkidle' });

    // 3.7 Mobile: 4UG5 auto-selected by default
    const activeVariantText = await page.evaluate(() => {
      const btn = document.querySelector('button.bg-ink');
      return btn ? btn.textContent.trim() : null;
    });
    record(
      'PDP Halbertec 8000 Mobile: 4UG5 variant is auto-selected by default on mobile',
      Boolean(activeVariantText && activeVariantText.includes('4U')),
      `Active button: "${activeVariantText}"`
    );

    // 3.8 Switch to 3UG5 on mobile
    console.log('Switching to 3UG5 variant on Mobile...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn3U = btns.find(b => b.textContent && b.textContent.includes('3U'));
      if (btn3U) btn3U.click();
    });
    await page.waitForTimeout(600);

    // 3.9 Mobile sticky bottom bar shows clickable hotline tel:19006868 button
    const mobileStickyHotline = await page.evaluate(() => {
      const stickyBar = document.querySelector('.fixed.bottom-0');
      if (!stickyBar) return { foundSticky: false };
      const link = stickyBar.querySelector('a[href="tel:19006868"]');
      if (!link) return { foundSticky: true, hasLink: false };
      const rect = link.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && link.offsetParent !== null;
      return {
        foundSticky: true,
        hasLink: true,
        isVisible,
        text: link.textContent.trim(),
        href: link.getAttribute('href'),
      };
    });

    record(
      'PDP Halbertec 8000 Mobile: Sticky bottom bar renders visible & clickable hotline tel:19006868 button',
      mobileStickyHotline.foundSticky && mobileStickyHotline.hasLink && mobileStickyHotline.isVisible,
      `Sticky bar found: ${mobileStickyHotline.foundSticky}, button text: "${mobileStickyHotline.text}", visible: ${mobileStickyHotline.isVisible}`
    );
  });
}

function verifyForbiddenStringsAndTypography() {
  console.log('\n=== 4. Scanning Storefront for Forbidden Strings & Bold Tags ===');

  const storefrontDir = path.resolve(__dirname, '../frontend/src/app/(storefront)');
  const componentsDir = path.resolve(__dirname, '../frontend/src/components');

  const files = [];
  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        scan(full);
      } else if (/\.(tsx|ts|jsx|js)$/.test(e.name)) {
        files.push(full);
      }
    }
  }
  scan(storefrontDir);
  scan(componentsDir);

  const patterns = [
    { name: '(Quy tắc R...)', regex: /Quy tắc R\d+/i },
    { name: 'Snapshot Immutability', regex: /Snapshot Immutability/i },
    { name: 'Unique Unit', regex: /Unique Unit/i },
    { name: 'Design System', regex: /Design System/i },
    { name: 'Quiet Court', regex: /Quiet Court/i },
    { name: 'Khóa kho nguyên tử R1', regex: /Khóa kho nguyên tử R1/i },
  ];

  const stringViolations = [];
  const boldTagViolations = [];

  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8');
    const rel = path.relative(path.resolve(__dirname, '..'), f);

    for (const p of patterns) {
      if (p.regex.test(content)) {
        stringViolations.push({ file: rel, pattern: p.name });
      }
    }

    if (/<b[\s>]|<strong[\s>]/i.test(content)) {
      boldTagViolations.push(rel);
    }
  }

  record(
    'Storefront Forbidden Strings: 0 occurrences of (Quy tắc R...), Snapshot Immutability, Unique Unit, Design System, Quiet Court, Khóa kho nguyên tử R1',
    stringViolations.length === 0,
    `Found ${stringViolations.length} violations: ${JSON.stringify(stringViolations)}`
  );

  record(
    'Storefront Typography: 0 occurrences of <b> or <strong> tags across storefront and components',
    boldTagViolations.length === 0,
    `Found ${boldTagViolations.length} violations: ${JSON.stringify(boldTagViolations)}`
  );
}

async function main() {
  console.log('===============================================================');
  console.log('   EMPIRICAL ADVERSARIAL CHALLENGER SUITE (M0 R2-2) EXECUTION  ');
  console.log('===============================================================');

  try {
    await verifySecondhandApi();
    await verifySecondhandUI();
    await verifyHalbertec8000PDP();
    verifyForbiddenStringsAndTypography();

    console.log('\n===============================================================');
    console.log('                 CHALLENGER VERIFICATION RESULTS               ');
    console.log('===============================================================');
    const total = testResults.length;
    const passed = testResults.filter(r => r.pass).length;
    const failed = total - passed;

    console.log(`TOTAL TESTS: ${total}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log(`SUCCESS RATE: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n>>> EMPIRICAL VERDICT: APPROVE (ALL CHALLENGES PASSED) <<<');
      process.exit(0);
    } else {
      console.error('\n>>> EMPIRICAL VERDICT: REQUEST_CHANGES (CHALLENGES FAILED) <<<');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal Test Execution Error:', err);
    process.exit(1);
  }
}

main();
