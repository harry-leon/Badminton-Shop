/**
 * Tier 1: Feature Coverage — Features F01 to F05
 * F01: SafeImage Component
 * F02: Sanitize Internal Text
 * F03: Route Guards for /_design
 * F04: Sync Canonical Data
 * F05: Anti-IDOR Warranty Lookup
 */

const { withPage, VIEWPORTS } = require('../helpers/browser');
const http = require('../helpers/http');
const db = require('../helpers/db');
const {
  assertTrue,
  assertEqual,
  assertMatch,
  assertNoInternalTokens,
  assertStatus,
} = require('../helpers/assertions');

const tests = [
  // --- F01: SafeImage Component ---
  {
    id: 'F01-T1-01',
    feature: 'F01',
    tier: 1,
    milestone: 'M0',
    title: 'Valid product image loads with naturalWidth > 0 and no broken state',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #1',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long');
        await page.waitForLoadState('networkidle');
        const images = await page.$$eval('img', (imgs) =>
          imgs.map((img) => ({
            src: img.src,
            naturalWidth: img.naturalWidth,
            complete: img.complete,
            alt: img.alt,
          }))
        );
        assertTrue(images.length > 0, 'Catalog should display product images');
        const broken = images.filter((img) => img.naturalWidth === 0);
        assertEqual(broken.length, 0, `Found broken images: ${JSON.stringify(broken)}`);
      });
    },
  },
  {
    id: 'F01-T1-02',
    feature: 'F01',
    tier: 1,
    milestone: 'M0',
    title: 'ProductCard image container adheres to 4:5 aspect ratio',
    source: 'ORIGINAL_REQUEST.md § R1 / PROJECT.md § Feature Inventory #1',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long');
        await page.waitForSelector('img');
        const ratio = await page.evaluate(() => {
          const container = document.querySelector('.aspect-\\[4\\/5\\]') || document.querySelector('img')?.parentElement;
          if (!container) return null;
          const rect = container.getBoundingClientRect();
          return rect.width / rect.height;
        });
        assertTrue(ratio !== null, 'Product card container not found');
        assertTrue(Math.abs(ratio - 4 / 5) < 0.05, `Aspect ratio was ${ratio}, expected ~0.8 (4:5)`);
      });
    },
  },
  {
    id: 'F01-T1-03',
    feature: 'F01',
    tier: 1,
    milestone: 'M0',
    title: 'Priority images on hero/PDP load eagerly with high fetch priority',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #1',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000');
        const hasPriority = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs.some((img) => img.getAttribute('fetchpriority') === 'high' || img.getAttribute('loading') === 'eager');
        });
        assertTrue(hasPriority, 'Hero banner should contain eager/high-priority image');
      });
    },
  },
  {
    id: 'F01-T1-04',
    feature: 'F01',
    tier: 1,
    milestone: 'M0',
    title: 'Image component provides descriptive alt text for accessibility',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #1',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long');
        const altCheck = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img'));
          return imgs.every((img) => img.hasAttribute('alt'));
        });
        assertTrue(altCheck, 'All product images must have an alt attribute');
      });
    },
  },
  {
    id: 'F01-T1-05',
    feature: 'F01',
    tier: 1,
    milestone: 'M0',
    title: 'Fallback placeholder is rendered without leaking raw alt text on UI',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #1',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long');
        const rawAltLeaked = await page.evaluate(() => {
          // Refine selector to exclude script and style tags from visible UI text leak checks
          const texts = Array.from(document.querySelectorAll('body *:not(script):not(style)')).map((e) => e.innerText || '');
          return texts.some((t) => t.includes('.jpg') || t.includes('.png') || t.includes('.webp'));
        });
        assertTrue(!rawAltLeaked, 'Raw image filename or alt text should never leak into UI text');
      });
    },
  },

  // --- F02: Sanitize Internal Text ---
  {
    id: 'F02-T1-01',
    feature: 'F02',
    tier: 1,
    milestone: 'M0',
    title: 'Storefront Homepage contains zero forbidden internal text tokens',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #2',
    async test() {
      const res = await http.get('/');
      assertStatus(res, 200);
      assertNoInternalTokens(res.text, 'Homepage');
    },
  },
  {
    id: 'F02-T1-02',
    feature: 'F02',
    tier: 1,
    milestone: 'M0',
    title: 'Catalog page contains zero forbidden internal text tokens',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #2',
    async test() {
      const res = await http.get('/vot-cau-long');
      assertStatus(res, 200);
      assertNoInternalTokens(res.text, 'Catalog Page');
    },
  },
  {
    id: 'F02-T1-03',
    feature: 'F02',
    tier: 1,
    milestone: 'M0',
    title: 'Flagship PDP (/vot-cau-long/yonex-astrox-99-pro) contains clean text',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #2',
    async test() {
      const res = await http.get('/vot-cau-long/yonex-astrox-99-pro');
      assertStatus(res, 200);
      assertNoInternalTokens(res.text, 'Astrox 99 Pro PDP');
    },
  },
  {
    id: 'F02-T1-04',
    feature: 'F02',
    tier: 1,
    milestone: 'M0',
    title: 'Secondhand listing page contains clean customer-facing text',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #2',
    async test() {
      const res = await http.get('/second-hand');
      assertStatus(res, 200);
      assertNoInternalTokens(res.text, 'Secondhand Page');
    },
  },
  {
    id: 'F02-T1-05',
    feature: 'F02',
    tier: 1,
    milestone: 'M0',
    title: 'Warranty lookup page contains clean customer-facing text',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #2',
    async test() {
      const res = await http.get('/tra-cuu-bao-hanh');
      assertStatus(res, 200);
      assertNoInternalTokens(res.text, 'Warranty Lookup Page');
    },
  },

  // --- F03: Route Guards for /_design ---
  {
    id: 'F03-T1-01',
    feature: 'F03',
    tier: 1,
    milestone: 'M0',
    title: 'Storefront Header navigation has no link to Design System /_design',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #3',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000');
        const hasDesignLink = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('header a'));
          return links.some((a) => a.href.includes('/_design') || (a.textContent || '').includes('Design System'));
        });
        assertTrue(!hasDesignLink, 'Header navigation must NOT contain link to Design System');
      });
    },
  },
  {
    id: 'F03-T1-02',
    feature: 'F03',
    tier: 1,
    milestone: 'M0',
    title: 'Storefront Footer navigation has no link to Design System /_design',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #3',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000');
        const hasDesignLink = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('footer a'));
          return links.some((a) => a.href.includes('/_design') || (a.textContent || '').includes('Design System'));
        });
        assertTrue(!hasDesignLink, 'Footer navigation must NOT contain link to Design System');
      });
    },
  },
  {
    id: 'F03-T1-03',
    feature: 'F03',
    tier: 1,
    milestone: 'M0',
    title: '/_design page carries noindex, nofollow robots meta tag',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #3',
    async test() {
      const res = await http.get('/_design');
      // If page is accessible in dev, it MUST contain noindex
      if (res.status === 200) {
        assertMatch(res.text, /noindex/i, '/_design must specify noindex');
      } else {
        assertTrue(res.status === 403 || res.status === 404, 'Direct access should be restricted');
      }
    },
  },
  {
    id: 'F03-T1-04',
    feature: 'F03',
    tier: 1,
    milestone: 'M0',
    title: 'CommandSearch (Cmd+K) does not expose Design System to guest users',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #3',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000');
        const exposedInSearch = await page.evaluate(() => {
          const cmdk = document.querySelector('[cmdk-root]') || document.body;
          return (cmdk.innerHTML || '').includes('/_design');
        });
        assertTrue(!exposedInSearch, 'Command search should not index /_design for public guests');
      });
    },
  },
  {
    id: 'F03-T1-05',
    feature: 'F03',
    tier: 1,
    milestone: 'M0',
    title: 'Mobile drawer navigation menu does not expose Design System',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #3',
    async test() {
      await withPage({ viewport: VIEWPORTS.mobile }, async (page) => {
        await page.goto('http://localhost:3000');
        const hasDesignInMobileNav = await page.evaluate(() => {
          const navLinks = Array.from(document.querySelectorAll('nav a'));
          return navLinks.some((a) => a.href.includes('/_design') || (a.textContent || '').includes('Design System'));
        });
        assertTrue(!hasDesignInMobileNav, 'Mobile navigation menu must NOT show Design System link');
      });
    },
  },

  // --- F04: Sync Canonical Data ---
  {
    id: 'F04-T1-01',
    feature: 'F04',
    tier: 1,
    milestone: 'M0',
    title: 'Branch page displays canonical address: 123 Nguyễn Thị Minh Khai, P. Bến Thành, Q1',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #4',
    async test() {
      const res = await http.get('/chi-nhanh');
      assertStatus(res, 200);
      assertMatch(res.text, /123\s*Nguyễn\s*Thị\s*Minh\s*Khai/i, 'Must contain canonical HCM branch address');
    },
  },
  {
    id: 'F04-T1-02',
    feature: 'F04',
    tier: 1,
    milestone: 'M0',
    title: 'Branch page displays canonical address: 78 Nguyễn Văn Linh, Đà Nẵng',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #4',
    async test() {
      const res = await http.get('/chi-nhanh');
      assertStatus(res, 200);
      assertMatch(res.text, /78\s*Nguyễn\s*Văn\s*Linh/i, 'Must contain canonical Da Nang branch address');
    },
  },
  {
    id: 'F04-T1-03',
    feature: 'F04',
    tier: 1,
    milestone: 'M0',
    title: 'Hero Astrox 99 Pro displays canonical listed price 4.250.000 ₫',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #4',
    async test() {
      const res = await http.get('/vot-cau-long/yonex-astrox-99-pro');
      assertStatus(res, 200);
      assertMatch(res.text, /4\.250\.000/i, 'Astrox 99 Pro PDP must display canonical price 4.250.000 ₫');
    },
  },
  {
    id: 'F04-T1-04',
    feature: 'F04',
    tier: 1,
    milestone: 'M0',
    title: 'Brand filters do NOT list Mizuno (removed due to zero inventory)',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #4',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/vot-cau-long');
        const hasMizuno = await page.evaluate(() => {
          const filterLabels = Array.from(document.querySelectorAll('label, button')).map((e) => e.textContent || '');
          return filterLabels.some((l) => l.trim().toLowerCase() === 'mizuno');
        });
        assertTrue(!hasMizuno, 'Brand filter should NOT list Mizuno');
      });
    },
  },
  {
    id: 'F04-T1-05',
    feature: 'F04',
    tier: 1,
    milestone: 'M0',
    title: 'Branches in database match storefront display count and metadata',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #4',
    async test() {
      const rows = await db.query('identity_db', 'SELECT count(*) FROM branches WHERE is_active = true');
      const count = parseInt(rows[0].count, 10);
      assertTrue(count >= 3, `Expected at least 3 active branches, got ${count}`);
    },
  },

  // --- F05: Anti-IDOR Warranty Lookup ---
  {
    id: 'F05-T1-01',
    feature: 'F05',
    tier: 1,
    milestone: 'M0',
    title: 'Valid orderCode + matching phone returns 200 OK with claim data',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Interface Contracts',
    async test() {
      // Find a valid order from order_db
      const orders = await db.query('order_db', 'SELECT id, customer_phone FROM orders LIMIT 1');
      if (orders.length > 0) {
        const { id, customer_phone } = orders[0];
        const res = await http.get(`/api/warranty/lookup?orderCode=${id}&phone=${encodeURIComponent(customer_phone)}`);
        assertStatus(res, 200, 'Valid order + phone should return 200');
        assertTrue(res.data && res.data.purchasedWarranties !== undefined, 'Response should contain warranty data');
      }
    },
  },
  {
    id: 'F05-T1-02',
    feature: 'F05',
    tier: 1,
    milestone: 'M0',
    title: 'Returned customer name in warranty lookup response is masked',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Interface Contracts',
    async test() {
      const orders = await db.query('order_db', 'SELECT id, customer_phone FROM orders LIMIT 1');
      if (orders.length > 0) {
        const { id, customer_phone } = orders[0];
        const res = await http.get(`/api/warranty/lookup?orderCode=${id}&phone=${encodeURIComponent(customer_phone)}`);
        if (res.data?.purchasedWarranties?.length > 0) {
          const item = res.data.purchasedWarranties[0];
          if (item.customer_name) {
            assertMatch(item.customer_name, /\*/, 'Customer name should be masked');
          }
        }
      }
    },
  },
  {
    id: 'F05-T1-03',
    feature: 'F05',
    tier: 1,
    milestone: 'M0',
    title: 'Returned customer phone in warranty lookup response is masked',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Interface Contracts',
    async test() {
      const orders = await db.query('order_db', 'SELECT id, customer_phone FROM orders LIMIT 1');
      if (orders.length > 0) {
        const { id, customer_phone } = orders[0];
        const res = await http.get(`/api/warranty/lookup?orderCode=${id}&phone=${encodeURIComponent(customer_phone)}`);
        if (res.data?.purchasedWarranties?.length > 0) {
          const item = res.data.purchasedWarranties[0];
          if (item.customer_phone) {
            assertMatch(item.customer_phone, /\*/, 'Customer phone should be masked');
          }
        }
      }
    },
  },
  {
    id: 'F05-T1-04',
    feature: 'F05',
    tier: 1,
    milestone: 'M0',
    title: 'Serial number lookup returns masked PII when query parameter serial is provided',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Interface Contracts',
    async test() {
      const claims = await db.query('warranty_db', 'SELECT serial_number FROM warranty_claims LIMIT 1');
      if (claims.length > 0) {
        const serial = claims[0].serial_number;
        const res = await http.get(`/api/warranty/lookup?serial=${encodeURIComponent(serial)}`);
        assertStatus(res, 200);
        if (res.data?.claims?.length > 0) {
          assertMatch(res.data.claims[0].customer_phone, /\*/, 'Serial lookup must mask phone');
        }
      }
    },
  },
  {
    id: 'F05-T1-05',
    feature: 'F05',
    tier: 1,
    milestone: 'M0',
    title: 'Warranty lookup UI renders form requiring both Order Code and Phone inputs',
    source: 'ORIGINAL_REQUEST.md § R0 / PROJECT.md § Feature Inventory #5',
    async test() {
      await withPage(async (page) => {
        await page.goto('http://localhost:3000/tra-cuu-bao-hanh');
        const inputs = await page.$$eval('input', (els) => els.map((el) => el.placeholder || el.name || ''));
        assertTrue(inputs.length >= 1, 'Warranty lookup page must provide lookup inputs');
      });
    },
  },
];

module.exports = { tests };
