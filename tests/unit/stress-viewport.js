/**
 * Empirical Adversarial Stress Test: 360px Viewport Horizontal Overflow
 * Tests all 9 storefront routes at viewport 360x800:
 * 1. /
 * 2. /vot-cau-long
 * 3. /vot-cau-long/yonex-astrox-99-pro
 * 4. /vot-cau-long/lining-halbertec-8000
 * 5. /cart
 * 6. /checkout
 * 7. /tra-cuu-bao-hanh
 * 8. /second-hand
 * 9. /chi-nhanh
 * 10. /so-sanh
 *
 * Criterion: document.documentElement.scrollWidth <= document.documentElement.clientWidth
 */

const { withPage } = require('../e2e/helpers/browser');

const ROUTES = [
  '/',
  '/vot-cau-long',
  '/vot-cau-long/yonex-astrox-99-pro',
  '/vot-cau-long/lining-halbertec-8000',
  '/cart',
  '/checkout',
  '/tra-cuu-bao-hanh',
  '/second-hand',
  '/chi-nhanh',
  '/so-sanh',
];

async function runViewportStressTests() {
  console.log('=== STARTING 360PX VIEWPORT HORIZONTAL OVERFLOW STRESS TEST ===\n');
  const results = [];

  await withPage({ viewport: { width: 360, height: 800 } }, async (page) => {
    for (const route of ROUTES) {
      const url = `http://localhost:3000${route}`;
      console.log(`Checking route: ${route} (${url})...`);

      try {
        const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(1000); // Wait for dynamic layout and client hydrate

        const metrics = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;

          const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
          const clientWidth = doc.clientWidth;
          const innerWidth = window.innerWidth;
          const hasOverflow = scrollWidth > clientWidth;

          let overflowingElements = [];
          if (hasOverflow) {
            const all = Array.from(document.querySelectorAll('*'));
            for (const el of all) {
              const rect = el.getBoundingClientRect();
              if (rect.right > clientWidth || rect.left < 0) {
                overflowingElements.push({
                  tag: el.tagName,
                  id: el.id,
                  className: typeof el.className === 'string' ? el.className.slice(0, 100) : '',
                  rect: { left: rect.left, right: rect.right, width: rect.width },
                });
              }
            }
          }

          return {
            scrollWidth,
            clientWidth,
            innerWidth,
            hasOverflow,
            overflowDelta: scrollWidth - clientWidth,
            overflowingElements: overflowingElements.slice(0, 5),
          };
        });

        const status = response ? response.status() : 'N/A';
        const passed = !metrics.hasOverflow && metrics.scrollWidth <= 360;

        console.log(
          `  [${passed ? 'PASS' : 'FAIL'}] ${route} | HTTP ${status} | scrollWidth: ${metrics.scrollWidth}px, clientWidth: ${metrics.clientWidth}px (delta: ${metrics.overflowDelta}px)`
        );

        results.push({
          route,
          httpStatus: status,
          passed,
          ...metrics,
        });
      } catch (err) {
        console.error(`  [ERROR] Failed to test ${route}: ${err.message}`);
        results.push({
          route,
          passed: false,
          error: err.message,
        });
      }
    }
  });

  console.log('\n=== VIEWPORT 360PX STRESS TEST SUMMARY ===');
  console.log(JSON.stringify(results, null, 2));
  return results;
}

if (require.main === module) {
  runViewportStressTests()
    .then((res) => {
      const allPassed = res.every((r) => r.passed);
      console.log(`\nOverall 360px Viewport Result: ${allPassed ? 'ALL PASS (10/10)' : 'OVERFLOW DETECTED'}`);
      process.exit(allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error in viewport test:', err);
      process.exit(1);
    });
}

module.exports = { runViewportStressTests };
