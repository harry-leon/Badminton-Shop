/**
 * HARDENED TEST SUITE: CATALOG 100+ INTEGRITY & IMAGE VERIFICATION
 * 
 * Invariants verified (11 comprehensive checks):
 * 1. Total products in catalog_db >= 100
 * 2. Distinct categories with products >= 9 (expected 10)
 * 3. Categories table contains exactly 10 categories
 * 4. Racket category (cat_racket) contains exactly 10 flagship products (preserving legacy invariants)
 * 5. Total SKUs count >= total products count
 * 6. image_source is populated for 100% of products
 * 7. Provenance hostname of image_url strictly matches image_source (or local path /images/...)
 * 8. NO image URL is shared across different categories (Disjoint Category Partitions)
 * 9. Catalog-wide uniqueness: 100% distinct image URLs across all products (Zero Cloning)
 * 10. All secondhand racquets in cat_secondhand have authentic racquet images (no shoe, grip, or bag slugs)
 * 11. 100% of images return HTTP 200 OK via live GET requests, with valid magic bytes, payload size <= 2.5 MB, and latency < 5s
 */

const { execSync } = require('child_process');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

function queryPg(database, sql) {
  const psqlPath = 'C:\\Users\\htquo\\tools\\pgsql\\bin\\psql.exe';
  const cleanSql = sql.replace(/"/g, '\"');
  const cmd = `"${psqlPath}" -h 127.0.0.1 -p 5432 -U postgres -d ${database} -t -A -c "${cleanSql}"`;
  return execSync(cmd, { encoding: 'utf8', timeout: 8000 }).trim();
}

function verifyMagicBytes(buf) {
  if (!buf || buf.length < 4) return false;
  // PNG: 89 50 4E 47
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true;
  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true;
  // WebP: RIFF .... WEBP
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return true;
  // SVG: <svg or <?xml
  const head = buf.slice(0, 100).toString('utf8');
  if (head.includes('<svg') || head.includes('<?xml')) return true;
  return false;
}

function fetchImageGet(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const startTime = Date.now();
      const isLocal = !url.startsWith('http://') && !url.startsWith('https://');
      if (isLocal) {
        const localPath = path.resolve('c:\\badminton-shop\\frontend\\public', url.replace(/^\//, ''));
        if (fs.existsSync(localPath)) {
          const buf = fs.readFileSync(localPath);
          return resolve({
            url,
            status: 200,
            size: buf.length,
            latency: Date.now() - startTime,
            validMagic: verifyMagicBytes(buf),
            isLocal: true
          });
        }
      }

      const fullUrl = isLocal ? `http://localhost:3000${url}` : url;
      const parsed = new URL(fullUrl);
      const client = parsed.protocol === 'https:' ? https : http;

      const req = client.request(fullUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: timeoutMs
      }, (res) => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          resolve({
            url: fullUrl,
            status: res.statusCode,
            size: buf.length,
            latency: Date.now() - startTime,
            contentType: res.headers['content-type'] || '',
            validMagic: verifyMagicBytes(buf),
            isLocal: false
          });
        });
      });

      req.on('error', e => resolve({ url: fullUrl, status: 0, latency: Date.now() - startTime, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ url: fullUrl, status: 0, latency: Date.now() - startTime, error: 'TIMEOUT' }); });
      req.end();
    } catch (e) {
      resolve({ url, status: 0, latency: 0, error: e.message });
    }
  });
}

async function run() {
  console.log('========================================================================');
  console.log(' HARDENED TEST SUITE: CATALOG 100+ & IMAGE AUTHENTICITY VERIFICATION');
  console.log('========================================================================\n');

  // Load all products with metadata
  const psqlPath = 'C:\\Users\\htquo\\tools\\pgsql\\bin\\psql.exe';
  const rawRows = execSync(
    `"${psqlPath}" -h 127.0.0.1 -p 5432 -U postgres -d catalog_db -t -A -F "|||" -c "SELECT id, category_id, brand_id, name, slug, image_url, COALESCE(image_source, '') FROM products ORDER BY category_id, name;"`,
    { encoding: 'utf8' }
  ).trim().split('\n');

  const products = rawRows.map(line => {
    const [id, category_id, brand_id, name, slug, image_url, image_source] = line.split('|||');
    return { id, category_id, brand_id, name, slug, image_url, image_source };
  });

  const productCount = products.length;
  console.log(`[DATA] Successfully loaded ${productCount} products from catalog_db.`);

  // 1. Total products count >= 100
  console.log(`[CHECK 1] Asserting total products in catalog_db >= 100...`);
  assert(productCount >= 100, `Total products must be >= 100, found: ${productCount}`);
  console.log(`  ✓ PASS: Total products = ${productCount} (>= 100)`);

  // 2. Categories count >= 9 (expected 10)
  console.log(`[CHECK 2] Asserting distinct categories with products >= 9...`);
  const distinctCats = new Set(products.map(p => p.category_id));
  assert(distinctCats.size >= 9, `Distinct categories must be >= 9, found: ${distinctCats.size}`);
  console.log(`  ✓ PASS: Distinct categories represented = ${distinctCats.size} (>= 9)`);

  // 3. Category table has all 10 categories
  console.log(`[CHECK 3] Asserting categories table contains all 10 categories...`);
  const allCatsCount = parseInt(queryPg('catalog_db', 'SELECT COUNT(*) FROM categories;'), 10);
  assert.strictEqual(allCatsCount, 10, `Categories table must have 10 categories, found: ${allCatsCount}`);
  console.log(`  ✓ PASS: categories table count = ${allCatsCount} (== 10)`);

  // 4. Racket category has exactly 10 flagship products
  console.log(`[CHECK 4] Asserting cat_racket has exactly 10 flagship racquets (legacy invariant)...`);
  const racketCount = products.filter(p => p.category_id === 'cat_racket').length;
  assert.strictEqual(racketCount, 10, `cat_racket must have exactly 10 flagship products, found: ${racketCount}`);
  console.log(`  ✓ PASS: cat_racket count = ${racketCount} (== 10)`);

  // 5. Check SKUs count >= products count
  console.log(`[CHECK 5] Asserting SKUs count >= products count...`);
  const skuCount = parseInt(queryPg('catalog_db', 'SELECT COUNT(*) FROM skus;'), 10);
  assert(skuCount >= productCount, `SKU count (${skuCount}) must be >= product count (${productCount})`);
  console.log(`  ✓ PASS: SKU count = ${skuCount} (>= ${productCount})`);

  // 6. Check image_source column is populated for 100% of products
  console.log(`[CHECK 6] Asserting image_source is populated for 100% of products...`);
  const missingSource = products.filter(p => !p.image_source || p.image_source.trim() === '');
  assert.strictEqual(missingSource.length, 0, `Found ${missingSource.length} products with missing image_source`);
  console.log(`  ✓ PASS: 100% of products have image_source recorded.`);

  // 7. Check image_source domain strictly matches image_url hostname (for remote URLs)
  console.log(`[CHECK 7] Asserting image_source domain matches image_url hostname...`);
  const domainMismatches = [];
  for (const p of products) {
    if (!p.image_url.startsWith('http://') && !p.image_url.startsWith('https://')) {
      // Local path /images/... is valid
      continue;
    }
    try {
      const urlHost = new URL(p.image_url).hostname.replace(/^www\./, '');
      const srcHost = new URL(p.image_source).hostname.replace(/^www\./, '');
      if (urlHost !== srcHost) {
        domainMismatches.push({
          name: p.name,
          category: p.category_id,
          urlHost,
          srcHost,
          url: p.image_url,
          source: p.image_source
        });
      }
    } catch (e) {
      domainMismatches.push({ name: p.name, error: e.message });
    }
  }

  assert.strictEqual(
    domainMismatches.length,
    0,
    `Found ${domainMismatches.length} products with mismatched image_source domain! (e.g. ${domainMismatches[0]?.name}: urlHost=${domainMismatches[0]?.urlHost} vs srcHost=${domainMismatches[0]?.srcHost})`
  );
  console.log(`  ✓ PASS: 100% of remote products have matching image_source domain.`);

  // 8. Assert NO image URL is shared across different categories
  console.log(`[CHECK 8] Asserting zero cross-category image URL reuse...`);
  const urlCategoryMap = {};
  for (const p of products) {
    if (!urlCategoryMap[p.image_url]) urlCategoryMap[p.image_url] = new Set();
    urlCategoryMap[p.image_url].add(p.category_id);
  }

  const crossCategorySharing = Object.entries(urlCategoryMap).filter(([_, cats]) => cats.size > 1);
  assert.strictEqual(
    crossCategorySharing.length,
    0,
    `Found ${crossCategorySharing.length} image URLs reused across different categories! (e.g. ${crossCategorySharing[0]?.[0]} shared in ${Array.from(crossCategorySharing[0]?.[1] || []).join(', ')})`
  );
  console.log(`  ✓ PASS: Zero image URLs shared across categories.`);

  // 9. Assert catalog-wide image URL uniqueness (zero cloning)
  console.log(`[CHECK 9] Asserting 100% unique image URLs across entire catalog...`);
  const urlProductMap = {};
  for (const p of products) {
    if (!urlProductMap[p.image_url]) urlProductMap[p.image_url] = [];
    urlProductMap[p.image_url].push(p);
  }

  const duplicateUrls = Object.entries(urlProductMap).filter(([_, list]) => list.length > 1);
  assert.strictEqual(
    duplicateUrls.length,
    0,
    `Found ${duplicateUrls.length} duplicate image URLs reused across ${duplicateUrls.reduce((a, [_, l]) => a + l.length, 0)} products!`
  );
  console.log(`  ✓ PASS: 100% of products have distinct image URLs (${Object.keys(urlProductMap).length}/${productCount}).`);

  // 10. Assert secondhand racquets (cat_secondhand) do not have shoe, grip, or bag slugs
  console.log(`[CHECK 10] Asserting secondhand racquets do not have shoe (shb), grip (ac), or bag (ba) slugs...`);
  const secondhandProducts = products.filter(p => p.category_id === 'cat_secondhand');
  const invalidSecondhandSlugs = [];
  for (const p of secondhandProducts) {
    const urlLower = p.image_url.toLowerCase();
    const isShoe = /(shb|shoe|eclipsion|aerus|cascade|65z)/i.test(urlLower);
    const isGrip = /(ac\d|grip|towel|grap)/i.test(urlLower);
    const isBag = /(ba\d|bag|backpack)/i.test(urlLower);
    if (isShoe || isGrip || isBag) {
      invalidSecondhandSlugs.push({
        name: p.name,
        url: p.image_url,
        reason: isShoe ? 'SHOE' : isGrip ? 'GRIP' : 'BAG'
      });
    }
  }

  assert.strictEqual(
    invalidSecondhandSlugs.length,
    0,
    `Found ${invalidSecondhandSlugs.length} secondhand racquets with non-racquet image slugs! (e.g. ${invalidSecondhandSlugs[0]?.name} -> ${invalidSecondhandSlugs[0]?.url})`
  );
  console.log(`  ✓ PASS: All ${secondhandProducts.length} secondhand racquets have genuine racquet images (no shoe/grip/bag slugs).`);

  // 11. Assert 100% of images return HTTP 200 via GET requests with reasonable payload size (<= 2.5MB)
  console.log(`[CHECK 11] Performing live HTTP GET and payload validation for all ${productCount} images...`);
  const concurrency = 4;
  const fetchResults = [];

  for (let i = 0; i < products.length; i += concurrency) {
    const chunk = products.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(p => fetchImageGet(p.image_url, 5000).then(r => ({ ...r, product: p.name })))
    );
    fetchResults.push(...chunkResults);
    process.stdout.write(`  Tested ${fetchResults.length}/${products.length} images...\r`);
  }
  console.log(`\n  Completed live HTTP GET verification.`);

  const failedStatus = fetchResults.filter(r => r.status !== 200);
  assert.strictEqual(
    failedStatus.length,
    0,
    `Found ${failedStatus.length} images failing HTTP 200: ${failedStatus.map(f => `${f.product} (${f.url}): ${f.status} ${f.error || ''}`).join('; ')}`
  );

  const oversizedImages = fetchResults.filter(r => r.size > 2500000);
  assert.strictEqual(
    oversizedImages.length,
    0,
    `Found ${oversizedImages.length} images exceeding 2.5MB threshold: ${oversizedImages.map(o => `${o.product} (${(o.size / 1024 / 1024).toFixed(2)} MB)`).join('; ')}`
  );

  const invalidMagic = fetchResults.filter(r => !r.validMagic);
  assert.strictEqual(
    invalidMagic.length,
    0,
    `Found ${invalidMagic.length} images with invalid magic bytes: ${invalidMagic.map(m => m.product).join('; ')}`
  );

  console.log(`  ✓ PASS: 100% (${fetchResults.length}/${fetchResults.length}) of images returned HTTP 200 OK with payload <= 2.5 MB, response timeout < 5s, and valid magic bytes.`);

  console.log('\n========================================================================');
  console.log(' ALL 11 HARDENED CATALOG VERIFICATION CHECKS PASSED (100%)');
  console.log('========================================================================');
}

run().catch(err => {
  console.error('\n[FATAL ASSERTION FAILURE]:', err.message);
  process.exit(1);
});
