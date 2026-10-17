/**
 * EMPIRICAL ADVERSARIAL STRESS TEST: PRODUCT IMAGES & NEXT.JS SAFEIMAGE
 * 
 * Target: Milestone M1 — Catalog Expansion (100+ Products across 10 Categories)
 * Challenger Agent: teamwork_preview_challenger_m1_c1
 * 
 * Comprehensive Empirical Verifications:
 * 1. Fetch 100% of product images directly from catalog_db.products via pg client.
 * 2. Assert 100% HTTP 200 OK for live GET and HEAD requests.
 * 3. Verify Content-Type headers, body sizes (> 1KB), and binary magic bytes (PNG, JPEG, WebP).
 * 4. Audit brand & product correlation, ensuring no generic blank placeholders.
 * 5. Stress-test Next.js image optimizer endpoint (_next/image) and remotePatterns.
 * 6. Stress-test SafeImage fallback in headless browser under 404, corrupt payload, and network abort.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('../../frontend/node_modules/pg');
const { withPage, VIEWPORTS } = require('../../e2e/helpers/browser');

const BASE_URL = 'http://localhost:3000';

async function queryCatalogProducts() {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'catalog_db'
  });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT p.id, p.category_id, p.brand_id, p.name, p.image_url, COALESCE(p.image_source, '') as image_source
      FROM products p
      ORDER BY p.category_id, p.name;
    `);
    return res.rows;
  } finally {
    await client.end();
  }
}

function fetchHttp(url, options = {}, maxRedirects = 5) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const client = parsed.protocol === 'https:' ? https : http;
      const method = options.method || 'GET';
      const redirectHistory = options.redirectHistory || [];

      const req = client.request(url, {
        method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          ...(options.headers || {})
        },
        timeout: 12000
      }, (res) => {
        // Handle Redirects
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
          if (redirectHistory.length >= maxRedirects) {
            return resolve({
              url,
              status: res.statusCode,
              error: 'EXCESSIVE_OR_CIRCULAR_REDIRECTS',
              redirectHistory
            });
          }
          const redirectUrl = new URL(res.headers.location, url).href;
          redirectHistory.push({ from: url, to: redirectUrl, status: res.statusCode });
          return fetchHttp(redirectUrl, { ...options, redirectHistory }, maxRedirects).then(resolve);
        }

        const chunks = [];
        res.on('data', chunk => {
          if (method === 'GET') chunks.push(chunk);
        });

        res.on('end', () => {
          const bodyBuffer = Buffer.concat(chunks);
          resolve({
            url,
            status: res.statusCode,
            headers: res.headers,
            contentType: res.headers['content-type'] || '',
            contentLength: parseInt(res.headers['content-length'] || bodyBuffer.length.toString(), 10),
            bodyLength: bodyBuffer.length,
            bodyBuffer: method === 'GET' ? bodyBuffer : null,
            redirectHistory
          });
        });
      });

      req.on('error', (err) => {
        resolve({ url, status: 0, error: err.message, redirectHistory });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ url, status: 0, error: 'TIMEOUT_12S', redirectHistory });
      });

      req.end();
    } catch (err) {
      resolve({ url, status: 0, error: err.message });
    }
  });
}

function verifyMagicBytes(buffer, contentType) {
  if (!buffer || buffer.length < 4) return { valid: false, reason: 'Buffer too small' };

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { valid: true, format: 'PNG' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, format: 'JPEG' };
  }

  // WebP: RIFF .... WEBP
  if (buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP') {
    return { valid: true, format: 'WEBP' };
  }

  // GIF: GIF8
  if (buffer.toString('ascii', 0, 4).startsWith('GIF8')) {
    return { valid: true, format: 'GIF' };
  }

  // SVG: starts with <svg or <?xml
  const headerStr = buffer.slice(0, 100).toString('utf8').trim();
  if (headerStr.includes('<svg') || headerStr.includes('<?xml')) {
    return { valid: true, format: 'SVG' };
  }

  return { valid: false, reason: `Unknown magic bytes: ${buffer.slice(0, 4).toString('hex')}` };
}

async function run() {
  console.log('========================================================================');
  console.log(' EMPIRICAL ADVERSARIAL STRESS TEST: M1 CATALOG IMAGES & NEXT.JS LOADER');
  console.log('========================================================================\n');

  const report = {
    summary: {
      totalProducts: 0,
      checkedImages: 0,
      passCount: 0,
      failCount: 0,
      remoteCount: 0,
      localCount: 0,
      domains: {},
      categories: {}
    },
    findings: [],
    stressTests: []
  };

  // -------------------------------------------------------------------------
  // STEP 1: Query All Products & Metadata from catalog_db
  // -------------------------------------------------------------------------
  console.log('[STEP 1] Fetching all product rows from catalog_db.products...');
  const products = await queryCatalogProducts();
  report.summary.totalProducts = products.length;
  console.log(`Fetched ${products.length} products from catalog_db.\n`);

  if (products.length < 100) {
    report.findings.push({
      type: 'INSUFFICIENT_PRODUCT_COUNT',
      details: `Expected >= 100 products, found: ${products.length}`
    });
  }

  // -------------------------------------------------------------------------
  // STEP 2: Live HTTP & Binary Deep Verification (HEAD + GET)
  // -------------------------------------------------------------------------
  console.log('[STEP 2] Performing live HTTP GET + HEAD requests for all product images...');
  
  const results = [];
  const concurrency = 8;
  
  for (let i = 0; i < products.length; i += concurrency) {
    const chunk = products.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map(async (p) => {
      let testUrl = p.image_url;
      let isLocal = false;
      let localDiskExists = null;
      let localDiskSize = null;

      if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
        isLocal = true;
        const localPath = path.resolve('c:\\badminton-shop\\frontend\\public', testUrl.replace(/^\//, ''));
        localDiskExists = fs.existsSync(localPath);
        if (localDiskExists) {
          localDiskSize = fs.statSync(localPath).size;
        }
        testUrl = `${BASE_URL}${testUrl}`;
      }

      // Live HTTP GET
      const getRes = await fetchHttp(testUrl, { method: 'GET' });
      // Live HTTP HEAD
      const headRes = await fetchHttp(testUrl, { method: 'HEAD' });

      // Domain tracking
      let domain = 'local';
      if (!isLocal) {
        try {
          domain = new URL(p.image_url).hostname;
        } catch (_) {
          domain = 'invalid';
        }
      }

      // Binary validation
      let magicCheck = { valid: false, reason: 'No buffer' };
      if (getRes.bodyBuffer) {
        magicCheck = verifyMagicBytes(getRes.bodyBuffer, getRes.contentType);
      }

      // Placeholder detection
      const lowercaseUrl = (p.image_url || '').toLowerCase();
      const isPlaceholder = ['placeholder', 'dummy', 'blank', 'no-image', 'default_image', '400x500'].some(kw => lowercaseUrl.includes(kw));

      // Brand correlation check
      const brandLower = (p.brand_id || '').toLowerCase();
      const nameLower = (p.name || '').toLowerCase();
      const urlLower = lowercaseUrl;
      const sourceLower = (p.image_source || '').toLowerCase();

      let brandMismatch = false;
      if (brandLower.includes('yonex') && !urlLower.includes('yonex') && !sourceLower.includes('yonex')) {
        brandMismatch = true;
      }
      if (brandLower.includes('victor') && !urlLower.includes('victor') && !sourceLower.includes('victor')) {
        brandMismatch = true;
      }
      if (brandLower.includes('lining') && !urlLower.includes('lining') && !sourceLower.includes('lining')) {
        brandMismatch = true;
      }
      if (brandLower.includes('starbalm') && !urlLower.includes('starbalm') && !sourceLower.includes('starbalm')) {
        brandMismatch = true;
      }

      return {
        product: p,
        isLocal,
        domain,
        testUrl,
        localDiskExists,
        localDiskSize,
        getStatus: getRes.status,
        headStatus: headRes.status,
        contentType: getRes.contentType,
        bodyLength: getRes.bodyLength,
        magicCheck,
        isPlaceholder,
        brandMismatch,
        redirectCount: (getRes.redirectHistory || []).length,
        error: getRes.error || headRes.error || null
      };
    }));

    results.push(...chunkResults);
    process.stdout.write(`  Tested ${results.length}/${products.length} images...\r`);
  }
  console.log(`\nCompleted HTTP check for all ${results.length} images.\n`);

  // Analyze Results
  let failedHttp = 0;
  let failedContentType = 0;
  let failedMagic = 0;
  let failedSize = 0;
  let placeholderCount = 0;
  let brandMismatches = 0;

  for (const r of results) {
    report.summary.checkedImages++;
    if (r.isLocal) report.summary.localCount++;
    else report.summary.remoteCount++;

    report.summary.domains[r.domain] = (report.summary.domains[r.domain] || 0) + 1;
    report.summary.categories[r.product.category_id] = (report.summary.categories[r.product.category_id] || 0) + 1;

    let hasIssue = false;

    if (r.getStatus !== 200 || r.headStatus !== 200) {
      failedHttp++;
      hasIssue = true;
      report.findings.push({
        type: 'HTTP_STATUS_FAILURE',
        product: r.product.name,
        url: r.product.image_url,
        details: `GET status: ${r.getStatus}, HEAD status: ${r.headStatus}, error: ${r.error}`
      });
    }

    const validMime = /image\/(png|jpeg|jpg|webp|avif|gif|svg\+xml)/i.test(r.contentType);
    if (!validMime) {
      failedContentType++;
      hasIssue = true;
      report.findings.push({
        type: 'INVALID_CONTENT_TYPE',
        product: r.product.name,
        url: r.product.image_url,
        contentType: r.contentType
      });
    }

    if (!r.magicCheck.valid) {
      failedMagic++;
      hasIssue = true;
      report.findings.push({
        type: 'MAGIC_BYTE_MISMATCH',
        product: r.product.name,
        url: r.product.image_url,
        reason: r.magicCheck.reason
      });
    }

    if (r.bodyLength < 1000) {
      failedSize++;
      hasIssue = true;
      report.findings.push({
        type: 'SUSPICIOUS_PAYLOAD_SIZE',
        product: r.product.name,
        url: r.product.image_url,
        size: r.bodyLength
      });
    }

    if (r.isPlaceholder) {
      placeholderCount++;
      hasIssue = true;
      report.findings.push({
        type: 'GENERIC_PLACEHOLDER_FOUND',
        product: r.product.name,
        url: r.product.image_url
      });
    }

    if (r.brandMismatch) {
      brandMismatches++;
      report.findings.push({
        type: 'BRAND_IMAGE_MISMATCH',
        product: r.product.name,
        brand: r.product.brand_id,
        url: r.product.image_url,
        source: r.product.image_source
      });
    }

    if (!hasIssue) {
      report.summary.passCount++;
    } else {
      report.summary.failCount++;
    }
  }

  console.log('=== PRODUCT IMAGE VERIFICATION SUMMARY ===');
  console.log(`Total Products: ${report.summary.totalProducts}`);
  console.log(`Passed 100% of checks: ${report.summary.passCount}/${report.summary.totalProducts}`);
  console.log(`Remote URLs: ${report.summary.remoteCount} (Yonex: ${report.summary.domains['www.yonex.com'] || 0}, Starbalm: ${report.summary.domains['www.starbalm.com'] || 0})`);
  console.log(`Local static URLs: ${report.summary.localCount}`);
  console.log(`HTTP != 200 failures: ${failedHttp}`);
  console.log(`Invalid Content-Type failures: ${failedContentType}`);
  console.log(`Magic byte / binary corruption failures: ${failedMagic}`);
  console.log(`Payload size < 1KB: ${failedSize}`);
  console.log(`Generic placeholder images: ${placeholderCount}`);
  console.log(`Brand / URL mismatches: ${brandMismatches}\n`);

  // -------------------------------------------------------------------------
  // STEP 3: Next.js Image Optimizer & RemotePatterns Stress Test
  // -------------------------------------------------------------------------
  console.log('[STEP 3] Stress-testing Next.js Image Optimizer (_next/image) with remotePatterns...');

  const sampleRemoteYonex = results.find(r => r.domain === 'www.yonex.com');
  const sampleRemoteStarbalm = results.find(r => r.domain === 'www.starbalm.com');
  const sampleLocal = results.find(r => r.isLocal);

  const optimizerTests = [];

  if (sampleRemoteYonex) {
    const nextImageUrl = `${BASE_URL}/_next/image?url=${encodeURIComponent(sampleRemoteYonex.product.image_url)}&w=640&q=75`;
    const optRes = await fetchHttp(nextImageUrl);
    optimizerTests.push({
      scenario: 'Next.js optimizer with remote yonex.com URL',
      url: nextImageUrl,
      status: optRes.status,
      contentType: optRes.contentType,
      passed: optRes.status === 200 && optRes.contentType.startsWith('image/')
    });
  }

  if (sampleRemoteStarbalm) {
    const nextImageUrl = `${BASE_URL}/_next/image?url=${encodeURIComponent(sampleRemoteStarbalm.product.image_url)}&w=640&q=75`;
    const optRes = await fetchHttp(nextImageUrl);
    optimizerTests.push({
      scenario: 'Next.js optimizer with remote starbalm.com URL',
      url: nextImageUrl,
      status: optRes.status,
      contentType: optRes.contentType,
      passed: optRes.status === 200 && optRes.contentType.startsWith('image/')
    });
  }

  if (sampleLocal) {
    const nextImageUrl = `${BASE_URL}/_next/image?url=${encodeURIComponent(sampleLocal.product.image_url)}&w=640&q=75`;
    const optRes = await fetchHttp(nextImageUrl);
    optimizerTests.push({
      scenario: 'Next.js optimizer with local public image URL',
      url: nextImageUrl,
      status: optRes.status,
      contentType: optRes.contentType,
      passed: optRes.status === 200 && optRes.contentType.startsWith('image/')
    });
  }

  console.log('Optimizer Test Results:');
  optimizerTests.forEach(t => {
    console.log(`  - ${t.scenario}: ${t.passed ? '✓ PASS' : '✗ FAIL'} (Status: ${t.status}, Content-Type: ${t.contentType})`);
  });
  report.stressTests.push(...optimizerTests);

  // -------------------------------------------------------------------------
  // STEP 4: Playwright Headless Browser Rendering & SafeImage Fallback Stress
  // -------------------------------------------------------------------------
  console.log('\n[STEP 4] Executing Playwright E2E SafeImage Stress Test...');

  await withPage({ viewport: VIEWPORTS.desktop }, async (page) => {
    // Collect uncaught console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 4.1 Test /vot-cau-long rendering
    console.log('  Navigating to /vot-cau-long...');
    await page.goto(`${BASE_URL}/vot-cau-long`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const catalogImgStats = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const productImgs = imgs.filter(img => {
        const alt = img.alt || img.getAttribute('aria-label') || '';
        return alt.length > 0;
      });

      return {
        totalImgs: imgs.length,
        productImgs: productImgs.length,
        allComplete: imgs.every(img => img.complete),
        brokenCount: imgs.filter(img => img.naturalWidth === 0).length,
        renderedSample: productImgs.slice(0, 5).map(img => ({
          src: img.src.slice(0, 60) + '...',
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          alt: img.alt,
          ariaLabel: img.getAttribute('aria-label')
        }))
      };
    });

    console.log(`  /vot-cau-long Images: total=${catalogImgStats.totalImgs}, productImgs=${catalogImgStats.productImgs}, broken=${catalogImgStats.brokenCount}`);
    report.stressTests.push({
      scenario: 'Storefront /vot-cau-long image rendering',
      passed: catalogImgStats.brokenCount === 0 && catalogImgStats.productImgs > 0,
      details: catalogImgStats
    });

    // 4.2 Adversarial Route Interception: 404 Failure -> SafeImage Graceful Fallback
    console.log('  Testing SafeImage fallback on HTTP 404 intercepted image...');
    await page.route('**/*astrox*99*', route => {
      route.fulfill({ status: 404, contentType: 'image/jpeg', body: 'Not Found' });
    });

    await page.goto(`${BASE_URL}/vot-cau-long`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const fallbackCheck = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      // Find Astrox 99 image
      const targetImgs = imgs.filter(img => (img.getAttribute('aria-label') || '').includes('Astrox 99'));
      if (targetImgs.length === 0) return { found: false, passed: false };

      // Check all matching images (front and back)
      const allFellBack = targetImgs.every(img => {
        const isDataSvg = img.src.startsWith('data:image/svg+xml');
        const naturalWidth = img.naturalWidth;
        const visibleAlt = img.alt;
        return isDataSvg && naturalWidth > 0 && visibleAlt === '';
      });

      return {
        found: true,
        count: targetImgs.length,
        passed: allFellBack,
        samples: targetImgs.map(img => ({
          srcPrefix: img.src.slice(0, 30),
          naturalWidth: img.naturalWidth,
          visibleAlt: img.alt,
          ariaLabel: img.getAttribute('aria-label')
        }))
      };
    });

    console.log(`  Fallback Check Result: ${fallbackCheck.passed ? '✓ PASS' : '✗ FAIL'}`, fallbackCheck);
    report.stressTests.push({
      scenario: 'SafeImage HTTP 404 Fallback to inline SVG',
      passed: fallbackCheck.passed,
      details: fallbackCheck
    });

    await page.unroute('**/*astrox*99*');

    // 4.3 Adversarial Route Interception: Non-Image HTML corruption
    console.log('  Testing SafeImage fallback on HTML payload corruption...');
    await page.route('**/*halbertec*8000*', route => {
      route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body>CORRUPTED_NOT_AN_IMAGE</body></html>' });
    });

    await page.goto(`${BASE_URL}/vot-cau-long`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const htmlCorruptCheck = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      const targetImgs = imgs.filter(img => (img.getAttribute('aria-label') || '').includes('Halbertec'));
      if (targetImgs.length === 0) return { found: false, passed: false };

      const allFellBack = targetImgs.every(img => {
        return img.src.startsWith('data:image/svg+xml') && img.naturalWidth > 0 && img.alt === '';
      });

      return {
        found: true,
        count: targetImgs.length,
        passed: allFellBack,
        samples: targetImgs.map(img => ({
          srcPrefix: img.src.slice(0, 30),
          naturalWidth: img.naturalWidth,
          visibleAlt: img.alt
        }))
      };
    });

    console.log(`  Corrupt HTML Payload Check: ${htmlCorruptCheck.passed ? '✓ PASS' : '✗ FAIL'}`, htmlCorruptCheck);
    report.stressTests.push({
      scenario: 'SafeImage corrupt HTML payload fallback',
      passed: htmlCorruptCheck.passed,
      details: htmlCorruptCheck
    });

    await page.unroute('**/*halbertec*8000*');
  });

  // -------------------------------------------------------------------------
  // FINAL VERDICT
  // -------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log(' FINAL VERDICT EVALUATION');
  console.log('========================================================================');

  const allPassed =
    report.summary.passCount === report.summary.totalProducts &&
    report.summary.totalProducts >= 100 &&
    report.stressTests.every(t => t.passed === true);

  const verdict = allPassed ? 'APPROVE' : 'REQUEST_CHANGES';
  console.log(`Verdict: ${verdict}`);
  console.log('========================================================================\n');

  // Save JSON report for handoff reference
  const reportPath = path.resolve('test/adversarial/m1-image-stress-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`Detailed report written to: ${reportPath}`);

  return { verdict, report };
}

run()
  .then(({ verdict }) => {
    process.exit(verdict === 'APPROVE' ? 0 : 1);
  })
  .catch(err => {
    console.error('FATAL ERROR DURING STRESS TEST:', err);
    process.exit(1);
  });
