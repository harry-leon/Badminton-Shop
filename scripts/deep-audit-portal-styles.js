const fs = require('fs');
const path = require('path');

const portalDir = 'c:/badminton-shop/frontend/src/app/portal';
const pages = [
  'page.tsx',
  'products/page.tsx',
  'banners/page.tsx',
  'inventory/page.tsx',
  'orders/page.tsx',
  'stringing/page.tsx',
  'secondhand/page.tsx',
  'warranty/page.tsx',
  'reviews/page.tsx',
  'customers/page.tsx',
  'users/page.tsx',
  'branches/page.tsx',
  'reports/page.tsx',
  'roles/page.tsx',
  'logs/page.tsx'
];

for (const p of pages) {
  const full = path.join(portalDir, p);
  if (!fs.existsSync(full)) {
    console.log(`MISSING: ${p}`);
    continue;
  }
  const content = fs.readFileSync(full, 'utf8');
  
  // Check Header
  const headerMatch = content.match(/<div[^>]*className=[\"']([^\"']*(?:bg-\[#111613\]|bg-white)[^\"']*)[\"']/);
  const isDarkHeader = headerMatch ? headerMatch[1].includes('bg-[#111613]') : false;

  // Check Badge inside header
  const hasNeonBadge = /text-\[#C8F31D\]/.test(content);

  // Check KPI cards
  const hasKpi = /grid grid-cols-/.test(content);
  
  // Check Filter Bar
  const hasFilterBar = /Search|Tìm kiếm|Tìm theo|searchQuery|skuSearch/.test(content);

  console.log(`PAGE: ${p}`);
  console.log(`  - Header: ${isDarkHeader ? 'DARK (OK)' : 'LIGHT (NOT OK)'} -> ${headerMatch ? headerMatch[1].slice(0, 60) : 'none'}`);
  console.log(`  - Neon Badge: ${hasNeonBadge ? 'YES' : 'NO'}`);
  console.log(`  - Has KPI: ${hasKpi ? 'YES' : 'NO'}`);
  console.log(`  - Has Filter: ${hasFilterBar ? 'YES' : 'NO'}`);
}
