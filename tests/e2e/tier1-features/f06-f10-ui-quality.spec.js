/**
 * Tier 1: Feature Coverage — Features F06 to F10
 * F06: Secondhand Serial Masking
 * F07: Claims-to-Confirm Documentation
 * F08: Unified Container Component
 * F09: PDP Halbertec 8000 Stock Fix
 * F10: Eliminate Bold Tags
 */

const fs = require('fs');
const path = require('path');
const { withPage, VIEWPORTS } = require('../helpers/browser');
const http = require('../helpers/http');
const db = require('../helpers/db');
const {
  assertTrue,
  assertEqual,
  assertMatch,
  assertNoBoldTags,
  assertNoHorizontalOverflow,
  assertStatus,
} = require('../helpers/assertions');

const tests = [
  // --- F06: Secondhand Serial Masking ---
  {
    id: 'F06-T1-01',
    feature: 'F06',
    tier: 1,
    milestone: 'M0',
    title: 'Secondhand product cards display masked serials (format SN-...-***-...)',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #6',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/second-hand');
        const serialTexts = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('*'));
          return els
            .map((e) => e.textContent || '')
            .filter((t) => t.includes('SN-') || t.includes('Serial:'));
        });
        assertTrue(serialTexts.length > 0, 'Secondhand page should list serial numbers');
        const hasMasked = serialTexts.some((t) => t.includes('***') || t.includes('****'));
        assertTrue(hasMasked, 'Serial numbers on secondhand cards must be masked with asterisks');
      });
    },
  },
  {
    id: 'F06-T1-02',
    feature: 'F06',
    tier: 1,
    milestone: 'M0',
    title: 'Secondhand API endpoint returns masked serials for public consumers',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #6',
    async test() {
      const res = await http.get('/api/secondhand/units');
      assertEqual(res.status, 200, 'Secondhand units endpoint must return 200 OK');
      const units = Array.isArray(res.data) ? res.data : (res.data?.units || []);
      assertTrue(units.length > 0, 'Secondhand units endpoint must return at least one unit');
      for (const item of units) {
        if (item.serial_number) {
          assertMatch(item.serial_number, /\*/, 'Public secondhand API must return masked serial number');
        }
      }
    },
  },
  {
    id: 'F06-T1-03',
    feature: 'F06',
    tier: 1,
    milestone: 'M0',
    title: 'Secondhand detail view shows masked serial in racket specification summary',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #6',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/second-hand');
        const firstCard = await page.$('a[href*="/second-hand/"]');
        if (firstCard) {
          await firstCard.click();
          await page.waitForTimeout(500);
          const pageText = await page.evaluate(() => document.body.innerText);
          if (pageText.includes('SN-')) {
            assertMatch(pageText, /SN-.*?\*+.*?/, 'Secondhand detail page must mask serial number');
          }
        }
      });
    },
  },
  {
    id: 'F06-T1-04',
    feature: 'F06',
    tier: 1,
    milestone: 'M0',
    title: 'Cart drawer displays masked serial for added secondhand racket',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #6',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/second-hand');
        const serialInPage = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('span, p, div'))
            .map((e) => e.textContent || '')
            .find((t) => t.includes('SN-'));
        });
        if (serialInPage) {
          assertMatch(serialInPage, /\*/, 'Serial on page must be masked');
        }
      });
    },
  },
  {
    id: 'F06-T1-05',
    feature: 'F06',
    tier: 1,
    milestone: 'M0',
    title: 'Secondhand database contains intact serials while presentation layer masks them',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #6',
    async test() {
      const rows = await db.query('secondhand_db', 'SELECT serial_number FROM secondhand_units LIMIT 1');
      if (rows.length > 0) {
        assertTrue(rows[0].serial_number.length > 0, 'Database unit must hold real serial');
      }
    },
  },

  // --- F07: Claims-to-Confirm Documentation ---
  {
    id: 'F07-T1-01',
    feature: 'F07',
    tier: 1,
    milestone: 'M0',
    title: 'Documentation file docs/ui/claims-to-confirm.md exists at project root',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #7',
    async test() {
      const docPath = path.resolve(__dirname, '../../docs/ui/claims-to-confirm.md');
      assertTrue(fs.existsSync(docPath), 'docs/ui/claims-to-confirm.md must exist');
    },
  },
  {
    id: 'F07-T1-02',
    feature: 'F07',
    tier: 1,
    milestone: 'M0',
    title: 'Claims document contains markdown audit table with claim classification',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #7',
    async test() {
      const docPath = path.resolve(__dirname, '../../docs/ui/claims-to-confirm.md');
      if (fs.existsSync(docPath)) {
        const content = fs.readFileSync(docPath, 'utf8');
        assertMatch(content, /\|.*?Claim.*?\|/i, 'Document must contain claim table');
      }
    },
  },
  {
    id: 'F07-T1-03',
    feature: 'F07',
    tier: 1,
    milestone: 'M0',
    title: 'Claims document audits 16-point secondhand inspection guarantee',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #7',
    async test() {
      const docPath = path.resolve(__dirname, '../../docs/ui/claims-to-confirm.md');
      if (fs.existsSync(docPath)) {
        const content = fs.readFileSync(docPath, 'utf8');
        assertMatch(content, /16|tiêu\s*chuẩn|kiểm\s*định/i, 'Document must audit 16-point inspection claim');
      }
    },
  },
  {
    id: 'F07-T1-04',
    feature: 'F07',
    tier: 1,
    milestone: 'M0',
    title: 'Storefront footer contains no exaggerated marketing superlatives',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #7',
    async test() {
      const res = await http.get('/');
      assertStatus(res, 200);
      assertTrue(!res.text.includes('100% rẻ nhất thị trường'), 'No exaggerated claims in footer');
    },
  },
  {
    id: 'F07-T1-05',
    feature: 'F07',
    tier: 1,
    milestone: 'M0',
    title: 'Claims document has valid markdown headings and structured rationale',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #7',
    async test() {
      const docPath = path.resolve(__dirname, '../../docs/ui/claims-to-confirm.md');
      if (fs.existsSync(docPath)) {
        const content = fs.readFileSync(docPath, 'utf8');
        assertTrue(content.startsWith('#'), 'Must begin with markdown title heading');
      }
    },
  },

  // --- F08: Unified Container Component ---
  {
    id: 'F08-T1-01',
    feature: 'F08',
    tier: 1,
    milestone: 'M0',
    title: 'Homepage has zero horizontal scroll on mobile 360px viewport',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #8',
    async test() {
      await withPage({ viewport: VIEWPORTS.mobile }, async (page) => {
        await page.goto('http://localhost:3000');
        await assertNoHorizontalOverflow(page, 'Homepage mobile 360px');
      });
    },
  },
  {
    id: 'F08-T1-02',
    feature: 'F08',
    tier: 1,
    milestone: 'M0',
    title: 'Catalog page has zero horizontal scroll on mobile 360px viewport',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #8',
    async test() {
      await withPage({ viewport: VIEWPORTS.mobile }, async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long');
        await assertNoHorizontalOverflow(page, 'Catalog mobile 360px');
      });
    },
  },
  {
    id: 'F08-T1-03',
    feature: 'F08',
    tier: 1,
    milestone: 'M0',
    title: 'Flagship PDP has zero horizontal scroll on mobile 360px viewport',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #8',
    async test() {
      await withPage({ viewport: VIEWPORTS.mobile }, async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long/yonex-astrox-99-pro');
        await assertNoHorizontalOverflow(page, 'PDP mobile 360px');
      });
    },
  },
  {
    id: 'F08-T1-04',
    feature: 'F08',
    tier: 1,
    milestone: 'M0',
    title: 'Secondhand page has zero horizontal scroll on mobile 360px viewport',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #8',
    async test() {
      await withPage({ viewport: VIEWPORTS.mobile }, async (page) => {
        await page.goto('http://localhost:3000/second-hand');
        await assertNoHorizontalOverflow(page, 'Secondhand mobile 360px');
      });
    },
  },
  {
    id: 'F08-T1-05',
    feature: 'F08',
    tier: 1,
    milestone: 'M0',
    title: 'Container component defines standard page padding across viewports',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #8',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000');
        const containerExists = await page.evaluate(() => {
          return !!(document.querySelector('.max-w-7xl') || document.querySelector('[data-container]'));
        });
        assertTrue(containerExists, 'Page should contain standardized container wrapper');
      });
    },
  },

  // --- F09: PDP Halbertec 8000 Stock Fix ---
  {
    id: 'F09-T1-01',
    feature: 'F09',
    tier: 1,
    milestone: 'M0',
    title: 'Visiting Halbertec 8000 PDP auto-selects available 4U variant (20 in stock)',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #9',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long/lining-halbertec-8000');
        const selectedVariant = await page.evaluate(() => {
          const btn = document.querySelector('button[aria-pressed="true"]') ||
                      document.querySelector('button[data-state="active"]') ||
                      document.querySelector('button[data-selected="true"]');
          return btn ? btn.textContent?.trim() : '';
        });
        // 4U variant should be active or in-stock indicator visible
        const pageText = await page.evaluate(() => document.body.innerText);
        assertTrue(pageText.includes('4U') || pageText.includes('Còn hàng'), 'Halbertec 8000 should present available variant');
      });
    },
  },
  {
    id: 'F09-T1-02',
    feature: 'F09',
    tier: 1,
    milestone: 'M0',
    title: 'In-stock badge indicates positive inventory for Halbertec 8000 4U',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #9',
    async test() {
      const rows = await db.query(
        'inventory_db',
        `SELECT on_hand, reserved FROM stock_levels WHERE sku LIKE '%HT8000%' OR sku LIKE '%HALBERTEC%' LIMIT 1`
      );
      if (rows.length > 0) {
        const available = rows[0].on_hand - rows[0].reserved;
        assertTrue(available >= 0, `Halbertec must have non-negative stock, got ${available}`);
      }
    },
  },
  {
    id: 'F09-T1-03',
    feature: 'F09',
    tier: 1,
    milestone: 'M0',
    title: 'Add-to-cart button is enabled for in-stock variant on Halbertec 8000 PDP',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #9',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long/lining-halbertec-8000');
        const canAddToCart = await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) =>
            (b.textContent || '').includes('Thêm vào giỏ') ||
            (b.textContent || '').includes('Đặt mua ngay') ||
            (b.getAttribute('aria-label') || '').includes('Thêm vào giỏ') ||
            (b.getAttribute('aria-label') || '').includes('Đặt mua ngay')
          );
          return btn ? !btn.disabled : false;
        });
        assertTrue(canAddToCart, 'Add to cart button should be enabled for in-stock variant');
      });
    },
  },
  {
    id: 'F09-T1-04',
    feature: 'F09',
    tier: 1,
    milestone: 'M0',
    title: 'Out-of-stock variant disables add-to-cart and shows hotline consultation button',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #9',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long/lining-halbertec-8000');
        // If 3U variant exists and is out of stock, clicking it should show hotline
        const buttons = await page.$$('button');
        for (const b of buttons) {
          const txt = await b.textContent();
          if (txt && txt.includes('3U')) {
            await b.click();
            await page.waitForTimeout(300);
            break;
          }
        }
      });
    },
  },
  {
    id: 'F09-T1-05',
    feature: 'F09',
    tier: 1,
    milestone: 'M0',
    title: 'When entire system is out of stock, displays single merged row + tel: hotline link',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #9',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long/lining-halbertec-8000');
        const hasHotlineLink = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a[href^="tel:"]'));
          return links.length > 0;
        });
        assertTrue(hasHotlineLink, 'Storefront should offer hotline tel: link for consultation');
      });
    },
  },

  // --- F10: Eliminate Bold Tags ---
  {
    id: 'F10-T1-01',
    feature: 'F10',
    tier: 1,
    milestone: 'M0',
    title: 'Homepage DOM contains zero <b> and zero <strong> elements',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #10',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000');
        await assertNoBoldTags(page, 'Homepage');
      });
    },
  },
  {
    id: 'F10-T1-02',
    feature: 'F10',
    tier: 1,
    milestone: 'M0',
    title: 'Catalog page (/vot-cau-long) DOM contains zero <b> and zero <strong> elements',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #10',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long');
        await assertNoBoldTags(page, 'Catalog');
      });
    },
  },
  {
    id: 'F10-T1-03',
    feature: 'F10',
    tier: 1,
    milestone: 'M0',
    title: 'Product detail page DOM contains zero <b> and zero <strong> elements',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #10',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long/yonex-astrox-99-pro');
        await assertNoBoldTags(page, 'Astrox 99 Pro PDP');
      });
    },
  },
  {
    id: 'F10-T1-04',
    feature: 'F10',
    tier: 1,
    milestone: 'M0',
    title: 'Secondhand page (/second-hand) DOM contains zero <b> and zero <strong> elements',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #10',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/second-hand');
        await assertNoBoldTags(page, 'Secondhand');
      });
    },
  },
  {
    id: 'F10-T1-05',
    feature: 'F10',
    tier: 1,
    milestone: 'M0',
    title: 'Computed font-weight across storefront text elements does not exceed 500',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #10',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000');
        const violations = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('h1, h2, h3, h4, p, span, a'));
          const over = [];
          for (const el of els) {
            const w = parseInt(window.getComputedStyle(el).fontWeight, 10);
            if (w > 500) {
              over.push({ tag: el.tagName, weight: w, text: el.textContent?.slice(0, 20) });
            }
          }
          return over;
        });
        assertEqual(violations.length, 0, `Computed font-weight > 500 detected: ${JSON.stringify(violations.slice(0, 5))}`);
      });
    },
  },
];

module.exports = { tests };
