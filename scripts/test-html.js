const fs = require('fs');

async function check() {
  const res = await fetch('http://localhost:3000/portal/inventory');
  const html = await res.text();
  fs.writeFileSync('c:/badminton-shop/scripts/inventory-page.html', html, 'utf8');
  console.log('Saved HTML, length:', html.length);
  // Find JS scripts
  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
  console.log('Scripts found:', scripts.length);
  let foundDarkInScripts = false;
  let foundOldInScripts = false;
  for (const s of scripts) {
    const sRes = await fetch('http://localhost:3000' + s);
    const text = await sRes.text();
    if (text.includes('bg-[#111613]')) foundDarkInScripts = true;
    if (text.includes('Quy tắc R1')) {
      console.log('Script with inventory found:', s);
      console.log('Contains bg-[#111613]:', text.includes('bg-[#111613]'));
      console.log('Contains #C8F31D:', text.includes('#C8F31D'));
      console.log('Contains old white header:', text.includes('bg-white p-5 rounded-xl border border-[#E4E3DD]'));
    }
  }
}
check();
