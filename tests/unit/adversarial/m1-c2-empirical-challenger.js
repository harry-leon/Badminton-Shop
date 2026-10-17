/**
 * EMPIRICAL ADVERSARIAL CHALLENGER TEST SUITE — M1 REVIEWER C2
 * 
 * Verifies Milestone M1:
 * 1. Legacy Invariants & Flagship Invariant (/vot-cau-long: exactly 10 racquets: 6 Yonex, 2 Victor, 2 Li-Ning)
 * 2. Catalog Expansion & 10-Category Breakdown (>= 100 products across 10 categories, all with authentic images)
 * 3. Non-Racket Category Retrieval & Null-Spec Resilience
 * 4. Catalog API (/api/catalog/products) behavior & query parameters
 * 5. Inventory Stock Levels & Rule R10 Invariant: SUM(stock_movements) === SUM(stock_levels)
 * 6. Adversarial Edge Cases & DB Constraint Integrity
 */

const assert = require('assert');
const http = require('http');
const db = require('../../e2e/helpers/db');

const BASE_URL = 'http://localhost:3000';

const results = [];

function record(suite, name, pass, detail = '') {
  results.push({ suite, name, pass, detail });
  const icon = pass ? '✓ PASS' : '✗ FAIL';
  console.log(`[${suite}] ${icon}: ${name} ${detail ? '(' + detail + ')' : ''}`);
}

function fetchJson(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, rawBody: data });
        }
      });
    }).on('error', reject);
  });
}

function fetchHtml(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, html: data });
      });
    }).on('error', reject);
  });
}

async function runEmpiricalVerification() {
  console.log('========================================================================');
  console.log('   CHALLENGER M1-C2: EMPIRICAL VERIFICATION & ADVERSARIAL HARNESS');
  console.log('========================================================================\n');

  // ---------------------------------------------------------------------------
  // SECTION 1: LEGACY INVARIANTS & FLAGSHIP RACKET VIEW (/vot-cau-long)
  // ---------------------------------------------------------------------------
  console.log('=== SECTION 1: Legacy Invariants & Flagship Racket View ===');
  try {
    const racketRows = await db.query(
      'catalog_db',
      `SELECT p.id, p.name, p.brand_id, p.category_id, p.is_active
       FROM products p
       WHERE p.is_active = true AND p.category_id = 'cat_racket'
       ORDER BY p.brand_id, p.name;`
    );

    record('Flagship-DB', 'cat_racket product count is exactly 10', racketRows.length === 10, `Found: ${racketRows.length}`);

    const brandCounts = racketRows.reduce((acc, r) => {
      acc[r.brand_id] = (acc[r.brand_id] || 0) + 1;
      return acc;
    }, {});

    record('Flagship-DB', 'Yonex racquets in cat_racket === 6', brandCounts['yonex'] === 6, `Count: ${brandCounts['yonex']}`);
    record('Flagship-DB', 'Victor racquets in cat_racket === 2', brandCounts['victor'] === 2, `Count: ${brandCounts['victor']}`);
    record('Flagship-DB', 'Li-Ning racquets in cat_racket === 2', brandCounts['lining'] === 2, `Count: ${brandCounts['lining']}`);

    // Verify live HTTP /vot-cau-long response
    const htmlRes = await fetchHtml('/vot-cau-long');
    record('Flagship-HTTP', 'GET /vot-cau-long returns HTTP 200', htmlRes.status === 200, `Status: ${htmlRes.status}`);

    const cardCount = (htmlRes.html.match(/data-rating/g) || []).length;
    record('Flagship-HTTP', 'GET /vot-cau-long renders exactly 10 product cards', cardCount === 10, `Cards rendered: ${cardCount}`);

    // Verify non-racket products do NOT appear on /vot-cau-long
    const nonRacketCheck = ['Power Cushion', 'Aerus Z2', 'AC102EX', 'Exbolt', 'BG66', 'Mavis 350', 'AS-50'];
    const leakedItems = nonRacketCheck.filter(item => htmlRes.html.includes(item));
    record('Flagship-HTTP', 'Zero non-racket products leak into /vot-cau-long', leakedItems.length === 0, leakedItems.length > 0 ? `Leaked: ${leakedItems.join(', ')}` : 'Clean isolation');

  } catch (err) {
    record('Flagship', 'Flagship verification failed with error', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SECTION 2: CATALOG EXPANSION (106 PRODUCTS ACROSS 10 CATEGORIES)
  // ---------------------------------------------------------------------------
  console.log('\n=== SECTION 2: Catalog Expansion & 10-Category Breakdown ===');
  try {
    const totalProd = await db.query('catalog_db', 'SELECT COUNT(*) as count FROM products;');
    const totalCount = parseInt(totalProd[0].count, 10);
    record('Catalog-DB', 'Total products count in catalog_db >= 100', totalCount >= 100, `Count: ${totalCount}`);

    const allCats = await db.query('catalog_db', 'SELECT id, name, slug FROM categories ORDER BY id;');
    record('Catalog-DB', 'Categories table contains exactly 10 categories', allCats.length === 10, `Count: ${allCats.length}`);

    const catDistribution = await db.query(
      'catalog_db',
      `SELECT c.id, c.name, COUNT(p.id) as p_count, COUNT(s.id) as sku_count,
              MIN(s.price) as min_p, MAX(s.price) as max_p
       FROM categories c
       LEFT JOIN products p ON c.id = p.category_id
       LEFT JOIN skus s ON p.id = s.product_id
       GROUP BY c.id, c.name
       ORDER BY c.id;`
    );

    let allCategoriesPopulated = true;
    for (const cat of catDistribution) {
      const pCount = parseInt(cat.p_count, 10);
      const skuCount = parseInt(cat.sku_count, 10);
      const minP = parseInt(cat.min_p || 0, 10);
      const maxP = parseInt(cat.max_p || 0, 10);
      const isValid = pCount >= 10 && skuCount >= pCount && minP > 0 && maxP >= minP;
      if (!isValid) allCategoriesPopulated = false;
      record(
        'Category-Audit',
        `Category [${cat.id}] "${cat.name}" has valid products & SKUs`,
        isValid,
        `Products: ${pCount}, SKUs: ${skuCount}, Price range: ${minP.toLocaleString()} - ${maxP.toLocaleString()} VND`
      );
    }
    record('Catalog-DB', 'All 10 categories have >= 10 products with valid pricing', allCategoriesPopulated);

    // Orphaned products check
    const orphaned = await db.query(
      'catalog_db',
      `SELECT p.id, p.name FROM products p LEFT JOIN skus s ON p.id = s.product_id WHERE s.id IS NULL;`
    );
    record('Catalog-DB', 'Zero orphaned products without SKUs', orphaned.length === 0, `Orphaned: ${orphaned.length}`);

    // Image and source audit
    const missingImg = await db.query(
      'catalog_db',
      `SELECT COUNT(*) as count FROM products WHERE image_url IS NULL OR TRIM(image_url) = '' OR image_source IS NULL OR TRIM(image_source) = '';`
    );
    const missingImgCount = parseInt(missingImg[0].count, 10);
    record('Catalog-DB', '100% of products have non-null image_url and image_source', missingImgCount === 0, `Missing: ${missingImgCount}`);

  } catch (err) {
    record('Catalog', 'Catalog audit failed with error', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SECTION 3: NON-RACKET CATEGORY RETRIEVAL & NULL-SPEC SAFETY
  // ---------------------------------------------------------------------------
  console.log('\n=== SECTION 3: Non-Racket Category Retrieval & Spec Null-Safety ===');
  try {
    const categories = [
      'cat_racket', 'cat_string', 'cat_grip', 'cat_shoes', 'cat_shuttle',
      'cat_bag', 'cat_net', 'cat_apparel', 'cat_accessory', 'cat_secondhand'
    ];

    for (const catId of categories) {
      const rows = await db.query(
        'catalog_db',
        `SELECT p.id, p.name, p.slug, p.brand_id, p.category_id,
                p.balance_category, p.shaft_stiffness, p.weight_classes, p.max_tension_lbs,
                COALESCE(MIN(s.price), 0) as price_from,
                json_agg(json_build_object(
                  'id', s.id,
                  'weight', s.weight,
                  'size', s.size,
                  'color', s.color,
                  'variant_name', s.variant_name,
                  'price', s.price
                )) as skus
         FROM products p
         JOIN skus s ON p.id = s.product_id
         WHERE p.category_id = $1
         GROUP BY p.id
         ORDER BY p.name ASC;`,
        [catId]
      );

      const pass = rows.length >= 10;
      record(
        'Category-Query',
        `SQL retrieval for category "${catId}"`,
        pass,
        `Retrieved ${rows.length} products with SKUs without syntax or type errors`
      );
    }

    // Spec null-safety validation on non-racket items
    const nonRacketNullSpecCheck = await db.query(
      'catalog_db',
      `SELECT p.category_id, COUNT(s.id) as total_skus,
              COUNT(s.weight) as with_weight,
              COUNT(s.balance_point_mm) as with_balance,
              COUNT(s.stiffness) as with_stiffness
       FROM products p
       JOIN skus s ON p.id = s.product_id
       WHERE p.category_id != 'cat_racket' AND p.category_id != 'cat_secondhand'
       GROUP BY p.category_id;`
    );

    let nullableProperlyApplied = true;
    for (const r of nonRacketNullSpecCheck) {
      const total = parseInt(r.total_skus, 10);
      const withWeight = parseInt(r.with_weight, 10);
      const withBalance = parseInt(r.with_balance, 10);
      // Non-racket products (shoes, strings, bags, etc.) should have NULL for balance_point_mm
      if (withBalance > 0) nullableProperlyApplied = false;
    }
    record(
      'Spec-Safety',
      'Non-racket SKUs correctly leave racket-specific columns NULL (DROP NOT NULL migration verified)',
      nullableProperlyApplied,
      'Verified zero balance_point_mm populated on non-racket goods'
    );

    // Verify shoes have sizes
    const shoeSizes = await db.query(
      'catalog_db',
      `SELECT COUNT(*) as count FROM skus s JOIN products p ON s.product_id = p.id WHERE p.category_id = 'cat_shoes' AND s.size IS NOT NULL;`
    );
    const shoeSizeCount = parseInt(shoeSizes[0].count, 10);
    record('Spec-Safety', 'Shoes SKUs have size variant populated', shoeSizeCount > 0, `Populated shoe sizes: ${shoeSizeCount}`);

    // Verify apparel has sizes
    const apparelSizes = await db.query(
      'catalog_db',
      `SELECT COUNT(*) as count FROM skus s JOIN products p ON s.product_id = p.id WHERE p.category_id = 'cat_apparel' AND s.size IS NOT NULL;`
    );
    const apparelSizeCount = parseInt(apparelSizes[0].count, 10);
    record('Spec-Safety', 'Apparel SKUs have size variant populated', apparelSizeCount > 0, `Populated apparel sizes: ${apparelSizeCount}`);

  } catch (err) {
    record('Spec-Safety', 'Category query failed with error', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SECTION 4: CATALOG API (/api/catalog/products) EMPIRICAL AUDIT
  // ---------------------------------------------------------------------------
  console.log('\n=== SECTION 4: Catalog API (/api/catalog/products) Empirical Audit ===');
  try {
    // 4.1 Base API call
    const baseApi = await fetchJson('/api/catalog/products');
    record('API-Audit', 'GET /api/catalog/products returns HTTP 200', baseApi.status === 200, `Status: ${baseApi.status}`);
    record('API-Audit', 'GET /api/catalog/products returns all active products', baseApi.body?.products?.length === 106, `Products returned: ${baseApi.body?.products?.length}`);

    // 4.2 Brand filter
    const brandApi = await fetchJson('/api/catalog/products?brand=yonex');
    const allYonex = brandApi.body?.products?.every(p => p.brand.toLowerCase() === 'yonex');
    record('API-Audit', 'GET /api/catalog/products?brand=yonex filters correctly', allYonex && brandApi.body?.products?.length > 0, `Returned ${brandApi.body?.products?.length} Yonex items`);

    // 4.3 Price filter
    const priceApi = await fetchJson('/api/catalog/products?minPrice=2000000&maxPrice=3000000');
    const priceValid = priceApi.body?.products?.every(p => p.priceFrom >= 2000000 && p.priceFrom <= 3000000);
    record('API-Audit', 'GET /api/catalog/products?minPrice=2000000&maxPrice=3000000 filters correctly', priceValid && priceApi.body?.products?.length > 0, `Returned ${priceApi.body?.products?.length} items in budget`);

    // 4.4 Category filter empirical test
    const categoryApi = await fetchJson('/api/catalog/products?category=cat_shoes');
    const categoryFiltered = categoryApi.body?.products?.every(p => p.category_id === 'cat_shoes');
    const categoryHandled = categoryApi.body?.products?.length === 12; // 12 shoes products
    record(
      'API-Audit',
      'GET /api/catalog/products?category=cat_shoes filters exclusively to shoes',
      categoryFiltered && categoryHandled,
      `Observed: Returned ${categoryApi.body?.products?.length} products (Expected 12 shoes). Category query parameter not yet parsed in route.ts.`
    );

    // 4.5 Limit parameter empirical test
    const limitApi = await fetchJson('/api/catalog/products?limit=5');
    const limitHandled = limitApi.body?.products?.length === 5;
    record(
      'API-Audit',
      'GET /api/catalog/products?limit=5 respects limit',
      limitHandled,
      `Observed: Returned ${limitApi.body?.products?.length} products (Expected 5). Limit parameter not yet parsed in route.ts.`
    );

  } catch (err) {
    record('API-Audit', 'API audit failed with error', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SECTION 5: INVENTORY STOCK LEVELS & RULE R10 INVARIANT
  // ---------------------------------------------------------------------------
  console.log('\n=== SECTION 5: Inventory Stock Levels & Rule R10 Invariant ===');
  try {
    const movResult = await db.query('inventory_db', 'SELECT SUM(quantity) as sum_movements FROM stock_movements;');
    const stockResult = await db.query('inventory_db', 'SELECT SUM(on_hand) as sum_on_hand, SUM(reserved) as sum_reserved FROM stock_levels;');

    const sumMovements = parseInt(movResult[0].sum_movements, 10);
    const sumOnHand = parseInt(stockResult[0].sum_on_hand, 10);
    const sumReserved = parseInt(stockResult[0].sum_reserved, 10);

    const r10Invariant = sumMovements === sumOnHand;
    record(
      'Rule-R10',
      'SUM(stock_movements) === SUM(stock_levels.on_hand) (Audit Trail Invariant)',
      r10Invariant,
      `stock_movements: ${sumMovements}, stock_levels.on_hand: ${sumOnHand}`
    );

    const reservedValid = sumReserved <= sumOnHand;
    record(
      'Inventory-Safety',
      'SUM(reserved) <= SUM(on_hand)',
      reservedValid,
      `reserved: ${sumReserved}, on_hand: ${sumOnHand}`
    );

    // Check individual rows: on_hand >= 0 and reserved <= on_hand
    const violationRows = await db.query(
      'inventory_db',
      'SELECT id, branch_id, sku, on_hand, reserved FROM stock_levels WHERE on_hand < 0 OR reserved < 0 OR reserved > on_hand;'
    );
    record(
      'Inventory-Safety',
      'Zero stock_levels rows violate on_hand >= 0 or reserved <= on_hand',
      violationRows.length === 0,
      `Violations: ${violationRows.length}`
    );

    // Check unique second-hand units: on_hand <= 1
    const uniqueViolations = await db.query(
      'inventory_db',
      "SELECT id, branch_id, sku, on_hand FROM stock_levels WHERE item_type = 'UNIQUE' AND on_hand > 1;"
    );
    record(
      'Inventory-Safety',
      'Zero UNIQUE item_type stock_levels rows have on_hand > 1',
      uniqueViolations.length === 0,
      `Unique violations: ${uniqueViolations.length}`
    );

  } catch (err) {
    record('Inventory', 'Inventory check failed with error', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SECTION 6: EDGE CASES & CONSTRAINT RESILIENCE
  // ---------------------------------------------------------------------------
  console.log('\n=== SECTION 6: Adversarial Edge Cases & DB Constraint Integrity ===');
  try {
    // 6.1 Non-existent category query
    const ghostCat = await db.query(
      'catalog_db',
      `SELECT COUNT(*) as count FROM products WHERE category_id = 'cat_ghost_non_existent';`
    );
    record('Edge-Cases', 'Non-existent category returns clean 0 rows without error', parseInt(ghostCat[0].count, 10) === 0);

    // 6.2 Price bounds sanity
    const badPrices = await db.query(
      'catalog_db',
      `SELECT COUNT(*) as count FROM skus WHERE price <= 0 OR price > 100000000;`
    );
    record('Edge-Cases', 'Zero SKUs with zero, negative or unrealistic price (>100M VND)', parseInt(badPrices[0].count, 10) === 0);

    // 6.3 Foreign key integrity
    const badFkBrands = await db.query(
      'catalog_db',
      `SELECT COUNT(*) as count FROM products p LEFT JOIN brands b ON p.brand_id = b.id WHERE b.id IS NULL;`
    );
    record('Edge-Cases', 'Zero products with broken brand_id foreign key', parseInt(badFkBrands[0].count, 10) === 0);

    const badFkCats = await db.query(
      'catalog_db',
      `SELECT COUNT(*) as count FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE c.id IS NULL;`
    );
    record('Edge-Cases', 'Zero products with broken category_id foreign key', parseInt(badFkCats[0].count, 10) === 0);

  } catch (err) {
    record('Edge-Cases', 'Edge cases failed with error', false, err.message);
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n========================================================================');
  console.log('                    CHALLENGER VERIFICATION SUMMARY');
  console.log('========================================================================');
  const total = results.length;
  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  console.log(`Total checks: ${total}`);
  console.log(`Passed:       ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed:       ${failed}`);
  console.log('========================================================================\n');

  if (failed > 0) {
    console.log('FAILED CHECKS:');
    results.filter(r => !r.pass).forEach(r => {
      console.log(`- [${r.suite}] ${r.name}: ${r.detail}`);
    });
  }

  return { total, passed, failed, results };
}

runEmpiricalVerification().catch(console.error);
