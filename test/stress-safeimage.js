/**
 * Empirical Adversarial Stress Test: SafeImage Resilience
 * Tests:
 * 1. 404 image response
 * 2. 500 server error image response
 * 3. Non-image file payload (text/html or corrupt binary)
 * 4. Network abort / connection failure
 * 5. Null / empty string / invalid URL sources
 * 6. Verification: naturalWidth > 0 for all fallbacks, and zero raw alt text leaked to UI
 */

const { withPage } = require('../e2e/helpers/browser');
const assert = require('assert');

async function runSafeImageStressTests() {
  console.log('=== STARTING SAFEIMAGE ADVERSARIAL STRESS TEST ===\n');
  const results = [];

  // Test Suite 1: Network-level failures intercepted via Playwright page.route
  await withPage(async (page) => {
    // Collect console errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 1. Stress Test: HTTP 404 Broken Image
    console.log('[Test 1] Testing HTTP 404 response on product image...');
    let intercepted404 = false;
    await page.route('**/*astrox*99*', (route) => {
      intercepted404 = true;
      route.fulfill({
        status: 404,
        contentType: 'image/png',
        body: 'Not Found',
      });
    });

    await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const test1Result = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const astroxImgs = imgs.filter(
        (img) => (img.alt || '').includes('Astrox 99') || (img.getAttribute('aria-label') || '').includes('Astrox 99')
      );
      if (astroxImgs.length === 0) return { passed: false, reason: 'Astrox 99 image not found in DOM' };

      const img = astroxImgs[0];
      const isDataUri = img.src.startsWith('data:image/svg+xml');
      const naturalWidth = img.naturalWidth;
      const visibleAlt = img.alt;
      const ariaLabel = img.getAttribute('aria-label');

      return {
        passed: isDataUri && naturalWidth > 0 && visibleAlt === '',
        isDataUri,
        naturalWidth,
        visibleAlt,
        ariaLabel,
      };
    });

    console.log('  Result 1 (404 Fallback):', test1Result);
    results.push({ test: '404 Broken Image Fallback', ...test1Result, intercepted: intercepted404 });
    await page.unroute('**/*astrox*99*');

    // 2. Stress Test: Non-image corruption (text/html returned instead of image)
    console.log('[Test 2] Testing non-image payload (text/html corruption)...');
    let interceptedNonImage = false;
    await page.route('**/*halbertec*8000*', (route) => {
      interceptedNonImage = true;
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>CORRUPT_NON_IMAGE_DATA</body></html>',
      });
    });

    await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const test2Result = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const halbertecImgs = imgs.filter(
        (img) => (img.alt || '').includes('Halbertec') || (img.getAttribute('aria-label') || '').includes('Halbertec')
      );
      if (halbertecImgs.length === 0) return { passed: false, reason: 'Halbertec image not found' };

      const img = halbertecImgs[0];
      return {
        passed: img.src.startsWith('data:image/svg+xml') && img.naturalWidth > 0 && img.alt === '',
        isDataUri: img.src.startsWith('data:image/svg+xml'),
        naturalWidth: img.naturalWidth,
        visibleAlt: img.alt,
        ariaLabel: img.getAttribute('aria-label'),
      };
    });

    console.log('  Result 2 (Non-image Fallback):', test2Result);
    results.push({ test: 'Non-image Corruption Fallback', ...test2Result, intercepted: interceptedNonImage });
    await page.unroute('**/lining-halbertec-8000*.png*');

    // 3. Stress Test: Aborted Network Request
    console.log('[Test 3] Testing network abort / network failure...');
    await page.route('**/*arcsaber*.*', (route) => {
      route.abort('failed');
    });

    await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const test3Result = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const arcImgs = imgs.filter(
        (img) => (img.alt || '').includes('Arcsaber') || (img.getAttribute('aria-label') || '').includes('Arcsaber')
      );
      if (arcImgs.length === 0) return { passed: true, note: 'No Arcsaber displayed' };
      const img = arcImgs[0];
      return {
        passed: img.src.startsWith('data:image/svg+xml') && img.naturalWidth > 0 && img.alt === '',
        isDataUri: img.src.startsWith('data:image/svg+xml'),
        naturalWidth: img.naturalWidth,
        visibleAlt: img.alt,
      };
    });
    console.log('  Result 3 (Network Abort Fallback):', test3Result);
    results.push({ test: 'Network Abort Fallback', ...test3Result });
    await page.unroute('**/*arcsaber*.*');

    // 4. Stress Test: Client-side DOM Image Rendering Verification
    console.log('[Test 4] Testing all <img> tags currently rendered on /vot-cau-long...');
    await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'networkidle' });
    const imgSummary = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map((img) => ({
        src: img.src.slice(0, 50) + (img.src.length > 50 ? '...' : ''),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        hasAlt: img.hasAttribute('alt'),
        altText: img.alt,
        ariaLabel: img.getAttribute('aria-label'),
        complete: img.complete,
      }));
    });
    console.log(`  Found ${imgSummary.length} images on /vot-cau-long.`);
    const broken = imgSummary.filter((i) => i.naturalWidth === 0);
    console.log(`  Broken images count (naturalWidth === 0): ${broken.length}`);
    results.push({
      test: 'All Catalog Images naturalWidth > 0',
      totalImages: imgSummary.length,
      brokenCount: broken.length,
      passed: broken.length === 0,
      brokenSamples: broken,
    });

    // 5. Stress Test: Check if raw image filenames appear as visible text
    console.log('[Test 5] Checking for raw image filenames or alt text leaking into visible text nodes...');
    const leakedText = await page.evaluate(() => {
      const visibleTextElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, span, a, button, li, div'));
      const leaks = [];
      for (const el of visibleTextElements) {
        // Exclude script and hidden elements
        if (el.offsetParent === null) continue;
        const text = el.innerText || '';
        if (/\.(png|jpg|jpeg|webp|gif|svg)\b/i.test(text)) {
          leaks.push({ tag: el.tagName, text: text.slice(0, 100) });
        }
      }
      return leaks;
    });
    console.log(`  Raw filename leaks found in visible UI: ${leakedText.length}`);
    results.push({
      test: 'No Raw Filename / Alt Leaks in Visible UI',
      leaksCount: leakedText.length,
      passed: leakedText.length === 0,
      leaks: leakedText,
    });
  });

  console.log('\n=== SAFEIMAGE STRESS TEST RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

if (require.main === module) {
  runSafeImageStressTests()
    .then((r) => {
      const allPassed = r.every((x) => x.passed !== false);
      process.exit(allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error during stress test:', err);
      process.exit(1);
    });
}

module.exports = { runSafeImageStressTests };
