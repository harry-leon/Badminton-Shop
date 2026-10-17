const { withPage, VIEWPORTS } = require('../../e2e/helpers/browser');

(async () => {
  await withPage({ viewport: VIEWPORTS.desktop }, async (page) => {
    page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('PAGEERROR:', err.message));
    
    await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'networkidle' });
    
    // Select the title link
    const titleLink = page.locator('main h3').first();
    console.log('Title text:', await titleLink.textContent());
    
    // Click parent a
    const link = page.locator('main a:has(h3)').first();
    console.log('Target href:', await link.getAttribute('href'));
    
    await Promise.all([
      page.waitForNavigation({ timeout: 10000 }).catch(e => console.log('Nav error:', e.message)),
      link.click()
    ]);
    
    console.log('URL after click:', page.url());
  });
})();
