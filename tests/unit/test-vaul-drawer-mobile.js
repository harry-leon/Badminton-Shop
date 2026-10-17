const { withPage } = require('../e2e/helpers/browser');

(async () => {
  await withPage({ viewport: { width: 375, height: 812 } }, async (page) => {
    await page.goto('http://localhost:3000/vot-cau-long', { waitUntil: 'networkidle' });
    console.log('Page loaded');
    const trigger = await page.$('button[aria-label="Mở bộ lọc"]');
    console.log('Trigger found:', !!trigger);
    if (!trigger) return;
    
    await trigger.click();
    console.log('Clicked trigger');
    await page.waitForTimeout(1000);
    
    const info = await page.evaluate(() => {
      const allDivs = Array.from(document.querySelectorAll('div, [role="dialog"]'));
      const drawerDiv = allDivs.find(d => d.hasAttribute('vaul-drawer') || d.hasAttribute('data-vaul-drawer') || d.getAttribute('role') === 'dialog');
      const allButtons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim());
      const grabHandle = document.querySelector('.cursor-grab');
      const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, value: i.value, visible: i.offsetWidth > 0 }));
      
      return {
        foundDrawer: !!drawerDiv,
        drawerAttributes: drawerDiv ? Array.from(drawerDiv.attributes).map(a => `${a.name}="${a.value}"`) : [],
        hasGrabHandle: !!grabHandle,
        allButtons,
        inputs: inputs.slice(0, 10),
      };
    });
    console.log('Info after click:', JSON.stringify(info, null, 2));
  });
})();
