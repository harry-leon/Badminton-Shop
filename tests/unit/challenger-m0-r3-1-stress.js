/**
 * Challenger M0 R3-1 Adversarial Stress Test Suite
 * 
 * Verifies Milestone M0 Iteration 3 fixes:
 * 1. SafeImage 4:5 aspect ratio & error fallback without alt text leaks
 * 2. 360px viewport overflow across 10 storefront routes
 * 3. Warranty lookup API RFC 9457 & PII masking under adversarial inputs
 * 4. Secondhand units API serial masking
 * 5. Secondhand page raw HTML serial masking (RSC payload & DOM)
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Auto-load Playwright
let playwright;
try {
  playwright = require('playwright');
} catch {
  try {
    playwright = require(path.resolve(__dirname, '../node_modules/playwright'));
  } catch (err) {
    console.error('Playwright could not be loaded:', err);
  }
}

// Helper: Query PostgreSQL
function queryPg(database, sql) {
  const psqlPath = 'C:\\Users\\htquo\\tools\\pgsql\\bin\\psql.exe';
  const cleanSql = sql.replace(/"/g, '\"');
  const cmd = `"${psqlPath}" -h 127.0.0.1 -p 5432 -U postgres -d ${database} -t -A -c "${cleanSql}"`;
  return execSync(cmd, { encoding: 'utf8', timeout: 5000 }).trim();
}

// Helper: HTTP GET request returning status, headers, body
function fetchHttp(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${urlPath}`, { timeout: 10000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json,
        });
      });
    }).on('error', reject);
  });
}

// Test runner state
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

async function test(name, fn) {
  totalTests++;
  process.stdout.write(`[TEST ${totalTests}] ${name} ... `);
  try {
    await fn();
    passedTests++;
    console.log('PASSED');
  } catch (err) {
    failedTests++;
    console.log(`FAILED: ${err.message}`);
    failures.push({ name, error: err.message, stack: err.stack });
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runAll() {
  console.log('========================================================================');
  console.log('   CHALLENGER M0 R3-1 ADVERSARIAL STRESS TEST HARNESS');
  console.log('========================================================================\n');

  // Launch browser for Playwright tests
  let browser = null;
  if (playwright) {
    const { chromium } = playwright;
    try {
      browser = await chromium.launch({ headless: true });
    } catch {
      browser = await chromium.launch({ headless: true, channel: 'chrome' });
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 1: SafeImage & ProductCard Stress Testing
  // -------------------------------------------------------------------------
  console.log('--- SECTION 1: SafeImage & ProductCard Stress Testing ---');

  await test('ProductCard component has aspect-[4/5] class in source code', async () => {
    const productCardCode = fs.readFileSync(path.resolve(__dirname, '../frontend/src/components/ui/ProductCard.tsx'), 'utf8');
    assert(productCardCode.includes('aspect-[4/5]'), 'ProductCard.tsx must explicitly include aspect-[4/5]');
  });

  await test('SafeImage component defaults to 400x500 (4:5) when no dimensions provided', async () => {
    const safeImageCode = fs.readFileSync(path.resolve(__dirname, '../frontend/src/components/ui/SafeImage.tsx'), 'utf8');
    assert(safeImageCode.includes('defaultWidth = !fill && !width ? 400 : width'), 'defaultWidth must be 400');
    assert(safeImageCode.includes('defaultHeight = !fill && !height ? 500 : height'), 'defaultHeight must be 500');
    assert(safeImageCode.includes('viewBox="0 0 400 500"'), 'SVG fallback viewBox must be 0 0 400 500');
  });

  if (browser) {
    await test('ProductCard aspect ratio in browser DOM matches 4:5 (1.25) on /vot-cau-long', async () => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      try {
        await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'domcontentloaded' });
        await page.waitForSelector('.aspect-\\[4\\/5\\]', { timeout: 8000 });
        const boxes = await page.$$eval('.aspect-\\[4\\/5\\]', (elements) =>
          elements.map((el) => {
            const rect = el.getBoundingClientRect();
            return { width: rect.width, height: rect.height, ratio: rect.height / rect.width };
          })
        );
        assert(boxes.length > 0, 'Must have rendered at least one aspect-[4/5] container');
        for (const box of boxes) {
          const diff = Math.abs(box.ratio - 1.25);
          assert(diff < 0.05, `Expected aspect ratio ~1.25 (4:5), but got ${box.ratio.toFixed(3)} (${box.width}x${box.height})`);
        }
      } finally {
        await page.close();
      }
    });

    await test('SafeImage error boundary fallback renders SVG and never leaks alt text into visible text', async () => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      try {
        // Intercept both Next.js image optimizer and direct image assets
        await page.route('**/_next/image*', (route) => {
          route.abort('failed');
        });
        await page.route('**/*.{png,jpg,jpeg,webp,svg}', (route) => {
          if (route.request().url().startsWith('data:image/svg+xml')) {
            route.continue();
          } else {
            route.abort('failed');
          }
        });

        await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'domcontentloaded' });
        // Wait for SafeImage fallback to activate
        await page.waitForSelector('img[src^="data:image/svg+xml"]', { timeout: 8000 });

        // Evaluate all fallback images
        const checkResults = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img[src^="data:image/svg+xml"]'));
          const bodyText = document.body.innerText;
          return {
            count: imgs.length,
            emptyAltCount: imgs.filter(img => img.getAttribute('alt') === '').length,
            hasAriaLabel: imgs.every(img => img.hasAttribute('aria-label') && img.getAttribute('aria-label').length > 0),
          };
        });

        assert(checkResults.count > 0, 'At least one SafeImage fallback should have triggered');
        assert(checkResults.emptyAltCount === checkResults.count, 'All fallback images must have alt="" to prevent browser alt leak');
        assert(checkResults.hasAriaLabel, 'All fallback images must retain aria-label for accessibility');
      } finally {
        await page.close();
      }
    });
  }

  // -------------------------------------------------------------------------
  // SECTION 2: 360px Viewport Overflow Across 10 Storefront Routes
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 2: 360px Viewport Horizontal Overflow ---');

  const storefrontRoutes = [
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

  if (browser) {
    for (const route of storefrontRoutes) {
      await test(`Route "${route}" has zero horizontal overflow on 360x800 viewport`, async () => {
        const page = await browser.newPage({ viewport: { width: 360, height: 800 } });
        try {
          await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(async () => {
            await page.waitForLoadState('domcontentloaded');
          });

          // Wait a tick for responsive layout calculations
          await page.waitForTimeout(500);

          const metrics = await page.evaluate(() => {
            const doc = document.documentElement;
            const body = document.body;
            const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
            const clientWidth = doc.clientWidth;
            
            // Find offending elements if any
            let offending = [];
            if (scrollWidth > clientWidth) {
              const allElements = Array.from(document.querySelectorAll('*'));
              for (const el of allElements) {
                const rect = el.getBoundingClientRect();
                if (rect.right > clientWidth + 1) {
                  offending.push({
                    tag: el.tagName,
                    id: el.id,
                    className: (el.className || '').toString().slice(0, 50),
                    right: rect.right,
                    width: rect.width,
                  });
                }
              }
            }

            return { scrollWidth, clientWidth, offending: offending.slice(0, 5) };
          });

          assert(
            metrics.scrollWidth <= metrics.clientWidth,
            `Overflow detected on ${route}: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}. Offending elements: ${JSON.stringify(metrics.offending)}`
          );
        } finally {
          await page.close();
        }
      });
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 3: /api/warranty/lookup Adversarial Stress Testing
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 3: /api/warranty/lookup RFC 9457 & Anti-IDOR ---');

  await test('Rejects phone-only query (?phone=0901234567) with 400 and RFC 9457', async () => {
    const res = await fetchHttp('/api/warranty/lookup?phone=0901234567');
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.headers['content-type'] && res.headers['content-type'].includes('application/problem+json'), 'Must be application/problem+json');
    assert(res.json, 'Response body must be valid JSON');
    assert(res.json.type && res.json.type.includes('problems'), 'RFC 9457 type must be present');
    assert(res.json.title && res.json.title.includes('Chống IDOR'), 'RFC 9457 title must mention Anti-IDOR');
    assert(res.json.status === 400, 'RFC 9457 status must be 400');
    assert(res.json.detail && res.json.detail.includes('Mã đơn hàng và Số điện thoại'), 'RFC 9457 detail must explain requirement');
  });

  await test('Rejects customer_phone alias (?customer_phone=0901234567) with 400 and RFC 9457', async () => {
    const res = await fetchHttp('/api/warranty/lookup?customer_phone=0901234567');
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.headers['content-type'] && res.headers['content-type'].includes('application/problem+json'), 'Must be application/problem+json');
    assert(res.json && res.json.status === 400, 'RFC 9457 status must be 400');
  });

  await test('Rejects orderCode-only query (?orderCode=DH-20261013-0001) with 400 and RFC 9457', async () => {
    const res = await fetchHttp('/api/warranty/lookup?orderCode=DH-20261013-0001');
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.headers['content-type'] && res.headers['content-type'].includes('application/problem+json'), 'Must be application/problem+json');
    assert(res.json && res.json.title.includes('Chống IDOR'), 'Title must mention Anti-IDOR');
    assert(res.json && res.json.detail.includes('số điện thoại mua hàng đi kèm'), 'Detail must mention phone requirement');
  });

  await test('Rejects order_code alias (?order_code=DH-20261013-0001) with 400 and RFC 9457', async () => {
    const res = await fetchHttp('/api/warranty/lookup?order_code=DH-20261013-0001');
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.headers['content-type'] && res.headers['content-type'].includes('application/problem+json'), 'Must be application/problem+json');
  });

  await test('Rejects empty query with 400 and RFC 9457', async () => {
    const res = await fetchHttp('/api/warranty/lookup');
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.headers['content-type'] && res.headers['content-type'].includes('application/problem+json'), 'Must be application/problem+json');
    assert(res.json && res.json.title.includes('Thiếu thông tin tra cứu'), 'Title must note missing info');
  });

  await test('Rejects arbitrary search string (?q=invalid-search-term) with 400 and RFC 9457', async () => {
    const res = await fetchHttp('/api/warranty/lookup?q=invalid-search-term');
    assert(res.status === 400, `Expected 400, got ${res.status}`);
    assert(res.headers['content-type'] && res.headers['content-type'].includes('application/problem+json'), 'Must be application/problem+json');
  });

  await test('Handles SQL injection probes safely without 500 or SQL error leaks', async () => {
    const probes = [
      '/api/warranty/lookup?orderCode=%27%20OR%201=1--&phone=0901234567',
      '/api/warranty/lookup?serial=%27%20UNION%20SELECT%20*%20FROM%20users--',
      '/api/warranty/lookup?q=%27%20OR%20%271%27=%271',
    ];
    for (const probe of probes) {
      const res = await fetchHttp(probe);
      assert(res.status === 200 || res.status === 400, `Expected 200 or 400, got ${res.status} for ${probe}`);
      assert(!res.body.includes('syntax error'), `SQL error leaked for ${probe}`);
      assert(!res.body.includes('pg_'), `Postgres internals leaked for ${probe}`);
    }
  });

  await test('Valid lookup masks customer PII (phone, name) and query phone', async () => {
    // Seed order DH-20261013-0001 with customer phone 0901234567
    const res = await fetchHttp('/api/warranty/lookup?orderCode=DH-20261013-0001&phone=0901234567');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.json, 'Response must be valid JSON');
    assert(res.json.query.phone === '090****567', `Expected query phone masked as '090****567', got '${res.json.query.phone}'`);

    // Verify unmasked raw phone 0901234567 is NOT present anywhere in JSON response
    assert(!res.body.includes('0901234567'), 'Raw customer phone 0901234567 must not appear in response');

    // Check customer_name masking if orders returned
    if (res.json.purchasedWarranties && res.json.purchasedWarranties.length > 0) {
      for (const item of res.json.purchasedWarranties) {
        assert(item.customer_phone.includes('****'), `Purchased warranty customer_phone must be masked: ${item.customer_phone}`);
        assert(item.customer_name.includes('*'), `Purchased warranty customer_name must be masked: ${item.customer_name}`);
      }
    }
  });

  // -------------------------------------------------------------------------
  // SECTION 4: /api/secondhand/units Serial Masking
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 4: /api/secondhand/units Serial Masking ---');

  await test('All units in /api/secondhand/units have masked serial numbers', async () => {
    const rawDbSerials = queryPg('secondhand_db', "SELECT serial_number FROM secondhand_units WHERE status = 'APPROVED_FOR_SALE';");
    const dbSerialsList = rawDbSerials.split('\n').map(s => s.trim()).filter(Boolean);
    assert(dbSerialsList.length > 0, 'Database should contain approved secondhand units');

    const res = await fetchHttp('/api/secondhand/units');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.json && Array.isArray(res.json.units), 'API response must contain units array');

    for (const unit of res.json.units) {
      assert(unit.serial_number, 'Unit must have serial_number property');
      assert(unit.serial_number.includes('***'), `Unit ${unit.id} serial number must be masked: got '${unit.serial_number}'`);
    }

    // Adversarial check: verify that NO raw DB serial number appears anywhere in the API response string!
    for (const rawSerial of dbSerialsList) {
      assert(!res.body.includes(rawSerial), `Raw database serial '${rawSerial}' leaked into /api/secondhand/units JSON!`);
    }
  });

  // -------------------------------------------------------------------------
  // SECTION 5: /second-hand Raw HTML & RSC Flight Payload Serial Masking
  // -------------------------------------------------------------------------
  console.log('\n--- SECTION 5: /second-hand Raw HTML & RSC Payload Serial Masking ---');

  await test('Zero raw unmasked serial numbers exist anywhere in /second-hand raw HTML or script tags', async () => {
    const allDbSerials = queryPg('secondhand_db', 'SELECT serial_number FROM secondhand_units;');
    const allSerialsList = allDbSerials.split('\n').map(s => s.trim()).filter(Boolean);
    assert(allSerialsList.length > 0, 'Database should contain secondhand units');

    const res = await fetchHttp('/second-hand');
    assert(res.status === 200, `Expected 200, got ${res.status}`);

    for (const rawSerial of allSerialsList) {
      const occurrences = (res.body.match(new RegExp(rawSerial.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'g')) || []).length;
      assert(
        occurrences === 0,
        `CRITICAL SECURITY LEAK: Raw serial '${rawSerial}' found ${occurrences} time(s) in /second-hand HTML / RSC flight payload!`
      );
    }

    // Verify masked versions are present
    assert(res.body.includes('SN-88DP-***-010') || res.body.includes('-***-'), 'Masked serials must be present in HTML');
  });

  if (browser) {
    await browser.close();
  }

  // -------------------------------------------------------------------------
  // SUMMARY REPORT
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('   STRESS TEST EXECUTION SUMMARY');
  console.log('========================================================================');
  console.log(`  Total tests:   ${totalTests}`);
  console.log(`  Passed tests:  ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
  console.log(`  Failed tests:  ${failedTests}`);
  if (failedTests > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  - [FAIL] ${f.name}: ${f.error}`);
    }
  }
  console.log('========================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAll().catch((err) => {
  console.error('Fatal stress test error:', err);
  process.exit(1);
});
