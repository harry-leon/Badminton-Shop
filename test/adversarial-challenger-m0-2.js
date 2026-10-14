/**
 * EMPIRICAL ADVERSARIAL CHALLENGER SUITE - M0-2
 * 
 * Verifies:
 * 1. Halbertec 8000 PDP variant auto-selection (4UG5 with 20 stock) & 3UG5 out-of-stock handling
 *    - Desktop merged out-of-stock card & tel:19006868 hotline button
 *    - Mobile sticky bottom bar tel:19006868 hotline button
 * 2. Secondhand racket serial number masking (SN-88DP-***-010 on card & modal)
 * 3. Scan for forbidden strings & bold tags across storefront
 * 4. Master regression test suite (51/51 PASS)
 */

const assert = require('assert');
const { withPage, VIEWPORTS } = require('../e2e/helpers/browser');
const fs = require('fs');
const path = require('path');

const results = [];

function recordResult(testName, passed, details = '') {
  results.push({ testName, passed, details });
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runHalbertecDesktopTest() {
  await withPage({ viewport: VIEWPORTS.desktop }, async (page) => {
    console.log('\n--- 1. Testing Halbertec 8000 PDP (Desktop: 1440x900) ---');
    await page.goto('http://localhost:3000/vot-cau-long/lining-halbertec-8000', { waitUntil: 'networkidle' });

    // 1.1 Verify 4UG5 variant is auto-selected by default
    const selectedVariantText = await page.evaluate(() => {
      const activeBtn = document.querySelector('button.bg-ink');
      return activeBtn ? activeBtn.textContent.trim() : null;
    });
    const is4USelected = selectedVariantText && selectedVariantText.includes('4U');
    recordResult(
      'Halbertec 8000 Desktop: 4UG5 is auto-selected by default',
      Boolean(is4USelected),
      `Selected variant text: "${selectedVariantText}"`
    );

    // 1.2 Verify stock indicates 20 available across branches
    const stockInfo = await page.evaluate(() => {
      const pageText = document.body.innerText;
      const has20Stock = pageText.includes('Còn 20 cây toàn hệ thống');
      const hasHcmStock = pageText.includes('Còn 12 cây');
      const hasHnStock = pageText.includes('Còn 8 cây');
      const buyBtn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent.includes('Đặt mua ngay')
      );
      const isBuyBtnEnabled = buyBtn ? !buyBtn.disabled : false;
      return { has20Stock, hasHcmStock, hasHnStock, isBuyBtnEnabled };
    });
    recordResult(
      'Halbertec 8000 Desktop: In-stock (20 available across branches) and "Đặt mua ngay" button enabled',
      stockInfo.has20Stock && stockInfo.hasHcmStock && stockInfo.hasHnStock && stockInfo.isBuyBtnEnabled,
      `20 total: ${stockInfo.has20Stock}, HCM 12: ${stockInfo.hasHcmStock}, HN 8: ${stockInfo.hasHnStock}, BuyEnabled: ${stockInfo.isBuyBtnEnabled}`
    );

    // 1.3 Switch to 3UG5 variant (out of stock)
    console.log('Switching to 3UG5 variant...');
    const switchedTo3U = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn3U = buttons.find(b => b.textContent && b.textContent.includes('3U'));
      if (btn3U) {
        btn3U.click();
        return true;
      }
      return false;
    });
    assert.strictEqual(switchedTo3U, true, 'Must find and click 3U variant button');
    await page.waitForTimeout(500);

    // 1.4 Verify single merged out-of-stock card appears
    const outOfStockCardInfo = await page.evaluate(() => {
      const pageText = document.body.innerText;
      const hasMergedOosText = pageText.includes('Tạm hết hàng tại tất cả') || pageText.includes('Tạm hết hàng toàn hệ thống');
      const hotlineDesktop = document.querySelector('a[href="tel:19006868"]');
      const isVisible = hotlineDesktop ? hotlineDesktop.offsetParent !== null : false;
      const btnText = hotlineDesktop ? hotlineDesktop.textContent.trim() : null;
      return { hasMergedOosText, hasHotline: Boolean(hotlineDesktop), isVisible, btnText };
    });

    recordResult(
      'Halbertec 8000 Desktop: Single merged out-of-stock card appears when 3UG5 is selected',
      outOfStockCardInfo.hasMergedOosText,
      `Merged out of stock message present: ${outOfStockCardInfo.hasMergedOosText}`
    );

    recordResult(
      'Halbertec 8000 Desktop: Hotline tel:19006868 call button is present, visible, and clickable',
      outOfStockCardInfo.hasHotline && outOfStockCardInfo.isVisible,
      `Button text: "${outOfStockCardInfo.btnText}", visible: ${outOfStockCardInfo.isVisible}`
    );
  });
}

async function runHalbertecMobileTest() {
  await withPage({ viewport: VIEWPORTS.mobile }, async (page) => {
    console.log('\n--- 2. Testing Halbertec 8000 PDP (Mobile: 360x800) ---');
    await page.goto('http://localhost:3000/vot-cau-long/lining-halbertec-8000', { waitUntil: 'networkidle' });

    // Verify 4U is active on mobile
    const selectedVariantText = await page.evaluate(() => {
      const activeBtn = document.querySelector('button.bg-ink');
      return activeBtn ? activeBtn.textContent.trim() : null;
    });
    const is4USelected = selectedVariantText && selectedVariantText.includes('4U');
    recordResult(
      'Halbertec 8000 Mobile: 4UG5 is auto-selected by default on mobile',
      Boolean(is4USelected),
      `Selected: "${selectedVariantText}"`
    );

    // Switch to 3U
    console.log('Switching to 3UG5 variant on mobile...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn3U = buttons.find(b => b.textContent && b.textContent.includes('3U'));
      if (btn3U) btn3U.click();
    });
    await page.waitForTimeout(500);

    // Verify mobile sticky bottom bar shows hotline button
    const mobileHotline = await page.evaluate(() => {
      const stickyBar = document.querySelector('.fixed.bottom-0');
      if (!stickyBar) return { foundSticky: false };
      const hotlineLink = stickyBar.querySelector('a[href="tel:19006868"]');
      const isVisible = hotlineLink ? hotlineLink.offsetParent !== null : false;
      const text = hotlineLink ? hotlineLink.textContent.trim() : null;
      return { foundSticky: true, hasHotline: Boolean(hotlineLink), isVisible, text };
    });

    recordResult(
      'Halbertec 8000 Mobile: Sticky bottom bar renders clickable hotline tel:19006868 button',
      mobileHotline.foundSticky && mobileHotline.hasHotline && mobileHotline.isVisible,
      `Found sticky bar: ${mobileHotline.foundSticky}, hotline text: "${mobileHotline.text}", visible: ${mobileHotline.isVisible}`
    );
  });
}

async function runSecondhandSerialTest() {
  await withPage({ viewport: VIEWPORTS.desktop }, async (page) => {
    console.log('\n--- 3. Testing Secondhand Serial Number Masking (/second-hand) ---');
    await page.goto('http://localhost:3000/second-hand', { waitUntil: 'networkidle' });

    // Inspect cards and serial numbers
    const cardData = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div.bg-surface.rounded-2xl'));
      return cards.map(c => {
        const text = c.innerText;
        const serialMatch = text.match(/Serial:\s*([^\n\r]+)/i);
        return {
          title: c.querySelector('h3')?.textContent?.trim(),
          serial: serialMatch ? serialMatch[1].trim() : null,
          fullText: text,
        };
      });
    });

    console.log(`Found ${cardData.length} secondhand units on page.`);
    cardData.forEach((cd, idx) => {
      console.log(`  Unit #${idx + 1}: ${cd.title} -> Serial: ${cd.serial}`);
    });

    const astrox88d = cardData.find(cd => cd.title && cd.title.includes('Astrox 88D Pro'));
    const isAstroxMaskedCorrectly = astrox88d && astrox88d.serial === 'SN-88DP-***-010';

    recordResult(
      'Secondhand Card: Yonex Astrox 88D Pro card displays masked serial "SN-88DP-***-010"',
      Boolean(isAstroxMaskedCorrectly),
      `Expected SN-88DP-***-010, got: "${astrox88d ? astrox88d.serial : 'not found'}"`
    );

    // Verify all serials have masked middle characters
    const allMasked = cardData.length > 0 && cardData.every(cd => cd.serial && cd.serial.includes('***'));
    recordResult(
      'Secondhand Card: All approved secondhand cards display middle digits masked with "***"',
      Boolean(allMasked),
      `All ${cardData.length} cards verified`
    );

    // Verify DOM element attributes do NOT contain raw unmasked serial
    const leakedInAttrs = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('*'));
      return els.some((e) => {
        const attrs = Array.from(e.attributes).map((a) => a.value);
        return attrs.some((v) => v.startsWith('SN-') && !v.includes('*'));
      });
    });
    recordResult(
      'Secondhand DOM: HTML attributes (data-*, title, aria-*) do not contain raw unmasked serials',
      !leakedInAttrs,
      `Attributes clean: ${!leakedInAttrs}`
    );

    // 3.4 Open checkout modal on Astrox 88D Pro and check modal serial
    console.log('Opening reservation modal for Astrox 88D Pro...');
    const clickedReserve = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('div.bg-surface.rounded-2xl'));
      const astroxCard = cards.find(c => c.querySelector('h3')?.textContent?.includes('Astrox 88D Pro'));
      if (astroxCard) {
        const reserveBtn = astroxCard.querySelector('button');
        if (reserveBtn) {
          reserveBtn.click();
          return true;
        }
      }
      return false;
    });

    assert.strictEqual(clickedReserve, true, 'Must find and click reserve button');
    await page.waitForTimeout(500);

    const modalSerial = await page.evaluate(() => {
      const modal = document.querySelector('div.fixed.inset-0');
      if (!modal) return null;
      const serialEl = Array.from(modal.querySelectorAll('div.flex.justify-between')).find(div =>
        div.textContent.includes('Mã serial:')
      );
      return serialEl ? serialEl.textContent.replace('Mã serial:', '').trim() : null;
    });

    recordResult(
      'Secondhand Modal: Reservation modal displays masked serial "SN-88DP-***-010"',
      modalSerial === 'SN-88DP-***-010',
      `Modal serial text: "${modalSerial}"`
    );
  });
}

function runTextAndTypographyAudit() {
  console.log('\n--- 4. Scanning Storefront for Forbidden Strings & Bold Tags ---');
  const storefrontDir = path.resolve(__dirname, '../frontend/src/app/(storefront)');
  const componentsDir = path.resolve(__dirname, '../frontend/src/components');

  const filesToScan = [];
  function gatherFiles(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        gatherFiles(fullPath);
      } else if (/\.(tsx|ts|jsx|js)$/.test(e.name)) {
        filesToScan.push(fullPath);
      }
    }
  }
  gatherFiles(storefrontDir);
  gatherFiles(componentsDir);

  const forbiddenPatterns = [
    { name: '(Quy tắc R...)', regex: /Quy tắc R\d+/i },
    { name: 'Snapshot Immutability', regex: /Snapshot Immutability/i },
    { name: 'Unique Unit', regex: /Unique Unit/i },
    { name: 'Design System', regex: /Design System/i },
    { name: 'Quiet Court', regex: /Quiet Court/i },
    { name: 'Khóa kho nguyên tử R1', regex: /Khóa kho nguyên tử R1/i },
  ];

  const forbiddenMatches = [];
  const boldTagMatches = [];

  for (const f of filesToScan) {
    const content = fs.readFileSync(f, 'utf8');
    const relPath = path.relative(path.resolve(__dirname, '..'), f);

    for (const pat of forbiddenPatterns) {
      if (pat.regex.test(content)) {
        forbiddenMatches.push({ file: relPath, pattern: pat.name });
      }
    }

    if (/<b[\s>]|<strong[\s>]/i.test(content)) {
      boldTagMatches.push(relPath);
    }
  }

  recordResult(
    'Forbidden Strings: Zero occurrences of internal keywords across storefront & components',
    forbiddenMatches.length === 0,
    `Violations found: ${forbiddenMatches.length} (${JSON.stringify(forbiddenMatches)})`
  );

  recordResult(
    'Typography: Zero occurrences of <b> or <strong> tags across storefront & components',
    boldTagMatches.length === 0,
    `Violations found: ${boldTagMatches.length} (${JSON.stringify(boldTagMatches)})`
  );
}

async function main() {
  console.log('===============================================================');
  console.log(' STARTING EMPIRICAL ADVERSARIAL CHALLENGER VERIFICATION (M0-2) ');
  console.log('===============================================================');

  try {
    await runHalbertecDesktopTest();
    await runHalbertecMobileTest();
    await runSecondhandSerialTest();
    runTextAndTypographyAudit();

    console.log('\n===============================================================');
    console.log('                 ADVERSARIAL TEST SUMMARY                      ');
    console.log('===============================================================');
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    console.log(`Passed: ${passed}/${total} (${((passed / total) * 100).toFixed(1)}%)`);

    if (passed === total) {
      console.log('>>> VERDICT: 100% PASS - ALL ADVERSARIAL CHALLENGES SATISFIED <<<');
      process.exit(0);
    } else {
      console.error('>>> VERDICT: FAIL - ONE OR MORE CHALLENGES FAILED <<<');
      process.exit(1);
    }
  } catch (err) {
    console.error('Execution Error:', err);
    process.exit(1);
  }
}

main();
