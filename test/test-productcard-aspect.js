const { withPage, VIEWPORTS } = require('../e2e/helpers/browser');
const assert = require('assert');

async function testAspect() {
  console.log('=== VERIFYING PRODUCTCARD 4:5 ASPECT RATIO ===\n');
  await withPage({ viewport: VIEWPORTS.desktop }, async (page) => {
    await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'networkidle' });

    const cardContainers = await page.evaluate(() => {
      // Find all image containers inside product cards
      const containers = Array.from(document.querySelectorAll('div.relative.w-full.aspect-\\[4\\/5\\]'));
      return containers.map((el, idx) => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        const ratio = rect.width > 0 ? rect.height / rect.width : 0;
        return {
          idx,
          className: el.className,
          computedAspectRatio: style.aspectRatio,
          width: rect.width,
          height: rect.height,
          ratio, // expected 1.25 (5/4) for height/width or 0.8 for width/height
          isExpectedRatio: Math.abs(ratio - 1.25) < 0.05
        };
      });
    });

    console.log(`Found ${cardContainers.length} ProductCard 4:5 containers on /vot-cau-long.`);
    console.log('Sample containers:', cardContainers.slice(0, 3));
    
    assert(cardContainers.length > 0, 'Must find at least one ProductCard image container');
    for (const c of cardContainers) {
      assert(c.isExpectedRatio, `Card ${c.idx} ratio (${c.ratio}) differs from 1.25 (4:5 height/width)`);
    }
    console.log('✓ All ProductCard containers strictly adhere to 4:5 aspect ratio!\n');
  });
}

testAspect().catch(err => {
  console.error('Aspect ratio test failed:', err);
  process.exit(1);
});
