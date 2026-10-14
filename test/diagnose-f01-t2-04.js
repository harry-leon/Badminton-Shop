const { withPage } = require('../e2e/helpers/browser');

async function diagnose() {
  await withPage(async (page) => {
    await page.route('**/_next/image*', (route) => {
      route.abort('failed');
    });

    try {
      await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const info = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const fallbackImgs = imgs.filter((img) => img.src.startsWith('data:image/svg+xml'));
        
        const allImgDetails = imgs.map(img => ({
          src: img.src.slice(0, 50),
          isFallback: img.src.startsWith('data:image/svg+xml'),
          alt: img.alt,
          ariaLabel: img.getAttribute('aria-label')
        }));

        const hasExposedAlt = fallbackImgs.some((img) => img.alt && img.alt.trim() !== '');

        const elementsWithRawFilename = [];
        const visibleNodes = Array.from(document.querySelectorAll('body *:not(script):not(style)'));
        for (const el of visibleNodes) {
          const text = el.innerText || '';
          if (/\.(png|jpg|jpeg|webp)\b/i.test(text)) {
            elementsWithRawFilename.push({
              tag: el.tagName,
              class: el.className,
              text: text.slice(0, 100)
            });
          }
        }

        return {
          totalImgs: imgs.length,
          fallbackImgsCount: fallbackImgs.length,
          hasExposedAlt,
          elementsWithRawFilename: elementsWithRawFilename.slice(0, 10),
          allImgDetails: allImgDetails.slice(0, 10)
        };
      });

      console.log('Diagnostic result:', JSON.stringify(info, null, 2));
    } finally {
      await page.unroute('**/_next/image*');
    }
  });
}

diagnose().catch(console.error);
