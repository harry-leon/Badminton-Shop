const { Pool } = require('../frontend/node_modules/pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  user: 'postgres',
  password: '',
  database: 'catalog_db'
});

async function main() {
  const res = await pool.query(`
    SELECT p.id, p.name, p.brand_id, p.category_id, p.image_url, p.image_source
    FROM products p
    ORDER BY p.category_id, p.brand_id, p.name;
  `);

  console.log(`TOTAL PRODUCTS IN DB: ${res.rows.length}`);
  
  const violations = [];

  for (const p of res.rows) {
    const url = p.image_url.toLowerCase();
    const source = (p.image_source || '').toLowerCase();
    const name = p.name.toLowerCase();
    const cat = p.category_id;
    const brand = p.brand_id;

    const reasons = [];

    // Check category vs image content
    if (cat === 'cat_secondhand' || cat === 'cat_racket') {
      if (url.includes('shb') || url.includes('shoe')) {
        reasons.push(`Product is a RACKET (${p.name}), but image_url points to a SHOE (${p.image_url})`);
      } else if (url.includes('ac102') || url.includes('ac108') || url.includes('ac402')) {
        reasons.push(`Product is a RACKET (${p.name}), but image_url points to a GRIP (${p.image_url})`);
      }
    } else if (cat === 'cat_apparel') {
      if (url.includes('ac102') || url.includes('ac108')) {
        reasons.push(`Product is APPAREL (${p.name}), but image_url points to a GRIP (${p.image_url})`);
      }
    } else if (cat === 'cat_bag') {
      if (url.includes('ac102') || url.includes('ac402')) {
        reasons.push(`Product is a BAG (${p.name}), but image_url points to a GRIP (${p.image_url})`);
      }
    } else if (cat === 'cat_net') {
      if (url.includes('ac102') || url.includes('ac402')) {
        reasons.push(`Product is a NET (${p.name}), but image_url points to a GRIP (${p.image_url})`);
      } else if (url.includes('ac152') && !name.includes('tensioner') && !name.includes('tăng đơ')) {
        reasons.push(`Product is a NET (${p.name}), but image_url points to a TENSIONER WIRE (${p.image_url})`);
      }
    } else if (cat === 'cat_shoes') {
      if (!url.includes('shb') && !url.includes('shoe')) {
        reasons.push(`Product is a SHOE (${p.name}), but image_url is not a shoe (${p.image_url})`);
      }
    }

    // Check brand vs image source & URL domain
    if (brand !== 'yonex') {
      if (url.includes('yonex.com')) {
        reasons.push(`Brand is '${brand}' with image_source recorded as '${p.image_source}', but image_url actually points to Yonex CDN: ${p.image_url}`);
      }
    }

    if (reasons.length > 0) {
      violations.push({
        id: p.id,
        name: p.name,
        brand: p.brand_id,
        category: p.category_id,
        source: p.image_source,
        url: p.image_url,
        reasons
      });
    }
  }

  console.log(`\n=======================================================`);
  console.log(`AUDIT RESULTS: ${violations.length} INTEGRITY ISSUES FOUND OUT OF ${res.rows.length} PRODUCTS`);
  console.log(`=======================================================\n`);

  violations.slice(0, 5).forEach((v, idx) => {
    console.log(`[${idx + 1}] Category: ${v.category} | Brand: ${v.brand}`);
    console.log(`    Name: "${v.name}"`);
    console.log(`    Image Source (DB): ${v.source}`);
    console.log(`    Image URL: ${v.url}`);
    v.reasons.forEach(r => console.log(`    -> ISSUE: ${r}`));
    console.log('');
  });

  await pool.end();
}

main().catch(console.error);
