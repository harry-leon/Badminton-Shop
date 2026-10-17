const fs = require('fs');
const path = require('path');

const foundHrefs = new Set();
function walk(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    if (f.name === 'node_modules' || f.name === '.next') continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.tsx') || f.name.endsWith('.ts')) {
      const code = fs.readFileSync(p, 'utf8');
      const matches = code.matchAll(/href=["'](\/[^"'#?]+)["']/g);
      for (const m of matches) {
        foundHrefs.add(m[1]);
      }
    }
  }
}
walk('frontend/src');

function getAppRoutes(dir, base = '') {
  let routes = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) {
      let segment = f.name;
      if (segment.startsWith('(') && segment.endsWith(')')) {
        routes.push(...getAppRoutes(p, base));
      } else {
        routes.push(...getAppRoutes(p, base + '/' + segment));
      }
    } else if (f.name === 'page.tsx' || f.name === 'page.jsx') {
      routes.push(base === '' ? '/' : base);
    }
  }
  return routes;
}

const existingRoutes = getAppRoutes('frontend/src/app');
console.log('Existing routes count:', existingRoutes.length);
console.log('Existing routes:', existingRoutes.sort());

const missing = [];
for (const h of Array.from(foundHrefs).sort()) {
  const isFound = existingRoutes.some(r => {
    if (r === h) return true;
    const rRegex = new RegExp('^' + r.replace(/\[\w+\]/g, '[^/]+') + '$');
    return rRegex.test(h);
  });
  if (!isFound) {
    missing.push(h);
  }
}

console.log('\n--- POTENTIALLY MISSING ROUTES IN HREF ---');
console.log(missing);
