#!/usr/bin/env node

/**
 * SMASH COURT E2E VIEWPORT & RESPONSIVE VERIFICATION HARNESS
 *
 * Verifies all 44 routes (26 Storefront + 18 Admin Portal) across 6 standardized viewports
 * (320px, 360px, 390px, 768px, 1024px, 1440px) asserting:
 * 1. Zero horizontal overflow: document.documentElement.scrollWidth <= window.innerWidth
 * 2. Responsive navigation behavior:
 *    - Viewports < 1024px: Desktop nav is hidden, Mobile hamburger drawer button is visible.
 *    - Viewports >= 1024px: Desktop nav is visible, Mobile hamburger drawer button is hidden.
 * 3. Automatic HMAC-SHA256 session cookie injection for all /portal/* routes.
 * 4. DOM overflow diagnosis pinpointing top 5 offending elements with bounding rectangles.
 *
 * Usage:
 *   node scripts/verify-all-viewports.js [options]
 *
 * Options:
 *   --route=<route>         Filter by route (e.g. --route=/vot-cau-long or --route=/portal/orders)
 *   --viewport=<name>       Filter by viewport (e.g. --viewport=mobile-320)
 *   --baseUrl=<url>         Base URL (default: http://localhost:3000)
 *   --bail                  Stop execution immediately on first failure
 *   --help, -h              Show this help message
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ANSI formatting helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

// Playwright loader with fallback
let playwright;
try {
  playwright = require('playwright');
} catch (err) {
  try {
    playwright = require(path.resolve(__dirname, '../node_modules/playwright'));
  } catch (_) {
    try {
      playwright = require(path.resolve(__dirname, '../frontend/node_modules/playwright'));
    } catch (_2) {
      console.error(`${colors.red}[FATAL] Playwright is not installed or accessible.${colors.reset}`);
      process.exit(1);
    }
  }
}

// 6 Standardized Viewports
const VIEWPORTS = {
  'mobile-320': { name: 'mobile-320', width: 320, height: 640, label: 'iPhone SE (1st gen)' },
  'mobile-360': { name: 'mobile-360', width: 360, height: 800, label: 'Galaxy S standard' },
  'mobile-390': { name: 'mobile-390', width: 390, height: 844, label: 'iPhone 14/15' },
  'tablet-768': { name: 'tablet-768', width: 768, height: 1024, label: 'iPad Mini / Portrait' },
  'tablet-1024': { name: 'tablet-1024', width: 1024, height: 768, label: 'iPad Pro / Small Laptop' },
  'desktop-1440': { name: 'desktop-1440', width: 1440, height: 900, label: 'Desktop widescreen' },
};

// 44 Authoritative Routes (26 Storefront + 18 Admin Portal)
const STOREFRONT_ROUTES = [
  '/',
  '/vot-cau-long',
  '/vot-cau-long/yonex-astrox-99-pro',
  '/second-hand',
  '/second-hand/SH-20261013-0001',
  '/giay-cau-long',
  '/day-cuoc',
  '/quan-ao',
  '/quan-can',
  '/tui-bao-vot',
  '/qua-cau-long',
  '/luoi-cau-long',
  '/phu-kien',
  '/cart',
  '/checkout',
  '/so-sanh',
  '/chi-nhanh',
  '/tra-cuu-bao-hanh',
  '/tai-khoan',
  '/dang-nhap',
  '/tim-kiem',
  '/gioi-thieu',
  '/tuyen-dung',
  '/tuyen-dung/smashcourt-quan-1-tuyen-dung-nhan-vien-ban-hang',
  '/account',
  '/403',
];

const ADMIN_PORTAL_ROUTES = [
  '/portal',
  '/portal/banners',
  '/portal/branches',
  '/portal/customers',
  '/portal/inventory',
  '/portal/logs',
  '/portal/orders',
  '/portal/products',
  '/portal/products/tags',
  '/portal/products/taxonomy',
  '/portal/recruitment',
  '/portal/reports',
  '/portal/reviews',
  '/portal/roles',
  '/portal/secondhand',
  '/portal/stringing',
  '/portal/users',
  '/portal/warranty',
];

const ALL_ROUTES = [
  ...STOREFRONT_ROUTES.map((r) => ({ route: r, type: 'Storefront' })),
  ...ADMIN_PORTAL_ROUTES.map((r) => ({ route: r, type: 'Admin Portal' })),
];

// CLI Arguments Parser
function parseCliArgs() {
  const args = process.argv.slice(2);
  const options = {
    route: null,
    viewport: null,
    baseUrl: 'http://localhost:3000',
    bail: false,
    headless: true,
    help: false,
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--bail' || arg === '-b') {
      options.bail = true;
    } else if (arg.startsWith('--route=')) {
      options.route = arg.split('=')[1].trim();
    } else if (arg.startsWith('--viewport=')) {
      options.viewport = arg.split('=')[1].trim();
    } else if (arg.startsWith('--baseUrl=')) {
      options.baseUrl = arg.split('=')[1].trim().replace(/\/+$/, '');
    } else if (arg.startsWith('--headless=')) {
      options.headless = arg.split('=')[1].trim().toLowerCase() !== 'false';
    }
  }

  return options;
}

// Generate signed HMAC-SHA256 session token for Admin Portal
function generateAdminSessionToken() {
  const secret = process.env.SESSION_SECRET || 'smashcourt-default-session-secret-key-prod-2026';
  const payload = JSON.stringify({
    user: {
      id: 'admin-test',
      userId: 'admin-test',
      username: 'admin-test',
      email: 'admin@smashcourt.vn',
      full_name: 'Test Administrator',
      name: 'Test Administrator',
      role: 'ADMIN',
      branch_id: 'BR_HCM_01',
    },
    userId: 'admin-test',
    role: 'ADMIN',
    name: 'Test Administrator',
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

// Launch Playwright browser with Chrome channel fallback
async function launchBrowser(headless = true) {
  const { chromium } = playwright;
  try {
    return await chromium.launch({ headless });
  } catch (err1) {
    try {
      return await chromium.launch({ headless, channel: 'chrome' });
    } catch (err2) {
      try {
        return await chromium.launch({ headless, channel: 'msedge' });
      } catch (err3) {
        throw new Error(`Failed to launch browser (chromium, chrome, msedge all failed): ${err3.message}`);
      }
    }
  }
}

// Evaluate layout metrics, horizontal overflow, and responsive navigation inside page
async function evaluatePageLayout(page, routeType, viewportWidth) {
  return await page.evaluate(
    ({ routeType, viewportWidth }) => {
      const doc = document.documentElement;
      const body = document.body;

      const scrollWidth = Math.max(doc ? doc.scrollWidth : 0, body ? body.scrollWidth : 0);
      const clientWidth = doc ? doc.clientWidth : window.innerWidth;
      const innerWidth = window.innerWidth;

      // Pass/Fail Criterion 1: Zero horizontal overflow
      // scrollWidth <= innerWidth
      const hasOverflow = scrollWidth > innerWidth;
      const overflowDelta = scrollWidth - innerWidth;

      // Diagnostic: Find top offending elements extending outside viewport
      let offendingElements = [];
      if (hasOverflow) {
        const all = Array.from(document.querySelectorAll('*'));
        for (const el of all) {
          // Ignore script, style, link, meta
          if (['SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT'].includes(el.tagName)) continue;

          const rect = el.getBoundingClientRect();
          // Element extends beyond right boundary or before left boundary
          const overflowRight = rect.right - clientWidth;
          const overflowLeft = -rect.left;
          const overflowSelf = rect.width - clientWidth;

          if (overflowRight > 0.5 || overflowLeft > 0.5 || overflowSelf > 0.5) {
            let selector = el.tagName.toLowerCase();
            if (el.id) {
              selector += `#${el.id}`;
            } else if (typeof el.className === 'string' && el.className.trim()) {
              const classes = el.className
                .trim()
                .split(/\s+/)
                .filter((c) => c && !c.includes(':') && !c.includes('[') && !c.includes('/'))
                .slice(0, 3);
              if (classes.length) {
                selector += `.${classes.join('.')}`;
              }
            }

            offendingElements.push({
              tag: el.tagName,
              id: el.id || '',
              className: typeof el.className === 'string' ? el.className.slice(0, 120) : '',
              selector,
              rect: {
                left: Math.round(rect.left * 10) / 10,
                right: Math.round(rect.right * 10) / 10,
                width: Math.round(rect.width * 10) / 10,
              },
              maxOverflow: Math.max(overflowRight, overflowLeft, overflowSelf),
            });
          }
        }

        // Sort by greatest overflow descending, deduplicate by selector/rect
        offendingElements.sort((a, b) => b.maxOverflow - a.maxOverflow);
        const seen = new Set();
        offendingElements = offendingElements.filter((item) => {
          const key = `${item.selector}-${item.rect.width}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }

      // Pass/Fail Criterion 2: Responsive Navigation Behavior
      // On Storefront:
      //   - Desktop navigation bar is <nav> (e.g. category links: /vot-cau-long, etc.)
      //   - Mobile hamburger button is <button> containing menu icon (svg.lucide-menu)
      // On Admin Portal:
      //   - Desktop navigation is <aside> sidebar
      //   - Mobile hamburger button is <button> in header containing menu icon
      let navStatus = {
        applicable: false,
        desktopNavVisible: null,
        mobileHamburgerVisible: null,
        passed: true,
        reason: '',
      };

      const isStorefront = routeType === 'Storefront';
      const isPortal = routeType === 'Admin Portal';

      function isElementVisible(el) {
        if (!el) return false;
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
          return false;
        }
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }

      if (isStorefront) {
        // Desktop nav bar: <nav> inside or sibling of header containing category links
        const navEl =
          document.querySelector('header + nav') ||
          document.querySelector('header nav') ||
          document.querySelector('nav.bg-surface') ||
          document.querySelector('nav a[href="/vot-cau-long"]')?.closest('nav');

        // Mobile hamburger button: in header, button containing menu icon
        const hamburgerBtn =
          document.querySelector('header button:has(svg.lucide-menu)') ||
          document.querySelector('header button svg.lucide-menu')?.closest('button') ||
          document.querySelector('button[aria-label*="menu" i]') ||
          document.querySelector('[data-mobile-menu-trigger]');

        if (navEl || hamburgerBtn) {
          navStatus.applicable = true;
          navStatus.desktopNavVisible = isElementVisible(navEl);
          navStatus.mobileHamburgerVisible = isElementVisible(hamburgerBtn);

          if (viewportWidth < 1024) {
            // Viewport < 1024px: Desktop nav MUST be hidden, Hamburger MUST be visible
            if (navStatus.desktopNavVisible) {
              navStatus.passed = false;
              navStatus.reason = `Desktop category navigation is visible on viewport < 1024px (${viewportWidth}px)`;
            } else if (!navStatus.mobileHamburgerVisible) {
              navStatus.passed = false;
              navStatus.reason = `Mobile hamburger button is hidden on viewport < 1024px (${viewportWidth}px)`;
            }
          } else {
            // Viewport >= 1024px: Desktop nav MUST be visible, Hamburger MUST be hidden
            if (!navStatus.desktopNavVisible) {
              navStatus.passed = false;
              navStatus.reason = `Desktop category navigation is hidden on viewport >= 1024px (${viewportWidth}px)`;
            } else if (navStatus.mobileHamburgerVisible) {
              navStatus.passed = false;
              navStatus.reason = `Mobile hamburger button is visible on viewport >= 1024px (${viewportWidth}px)`;
            }
          }
        }
      } else if (isPortal) {
        // Portal Desktop Sidebar: <aside>
        const asideEl = document.querySelector('aside');
        // Portal Mobile Hamburger: button with menu icon in portal header
        const hamburgerBtn =
          document.querySelector('header button:has(svg.lucide-menu)') ||
          document.querySelector('header button svg.lucide-menu')?.closest('button');

        if (asideEl || hamburgerBtn) {
          navStatus.applicable = true;
          navStatus.desktopNavVisible = isElementVisible(asideEl);
          navStatus.mobileHamburgerVisible = isElementVisible(hamburgerBtn);

          if (viewportWidth < 1024) {
            // Viewport < 1024px: Portal sidebar MUST be hidden, hamburger MUST be visible
            if (navStatus.desktopNavVisible) {
              navStatus.passed = false;
              navStatus.reason = `Portal sidebar <aside> is visible on viewport < 1024px (${viewportWidth}px)`;
            } else if (!navStatus.mobileHamburgerVisible) {
              navStatus.passed = false;
              navStatus.reason = `Portal mobile hamburger button is hidden on viewport < 1024px (${viewportWidth}px)`;
            }
          } else {
            // Viewport >= 1024px: Portal sidebar MUST be visible, hamburger MUST be hidden
            if (!navStatus.desktopNavVisible) {
              navStatus.passed = false;
              navStatus.reason = `Portal sidebar <aside> is hidden on viewport >= 1024px (${viewportWidth}px)`;
            } else if (navStatus.mobileHamburgerVisible) {
              navStatus.passed = false;
              navStatus.reason = `Portal mobile hamburger button is visible on viewport >= 1024px (${viewportWidth}px)`;
            }
          }
        }
      }

      return {
        scrollWidth,
        clientWidth,
        innerWidth,
        hasOverflow,
        overflowDelta,
        offendingElements: offendingElements.slice(0, 5),
        navStatus,
      };
    },
    { routeType, viewportWidth }
  );
}

// Main Runner Routine
async function run() {
  const options = parseCliArgs();

  if (options.help) {
    console.log(`
${colors.bold}${colors.cyan}SMASH COURT VIEWPORT & RESPONSIVE VERIFICATION HARNESS${colors.reset}
Usage: node scripts/verify-all-viewports.js [options]

Options:
  --route=<route>       Filter single route (e.g. --route=/vot-cau-long)
  --viewport=<name>     Filter single viewport (e.g. --viewport=mobile-320)
  --baseUrl=<url>       Base URL (default: http://localhost:3000)
  --bail                Stop on first failure
  --headless=<bool>     Run headless browser (default: true)
  --help, -h            Show this help message

Available Viewports:
  mobile-320   (320x640)   - iPhone SE 1st gen
  mobile-360   (360x800)   - Galaxy S standard
  mobile-390   (390x844)   - iPhone 14/15
  tablet-768   (768x1024)  - iPad Mini / Portrait
  tablet-1024  (1024x768)  - iPad Pro / Small Laptop
  desktop-1440 (1440x900)  - Desktop widescreen
`);
    process.exit(0);
  }

  // Determine target routes and viewports
  let targetRoutes = ALL_ROUTES;
  if (options.route) {
    targetRoutes = targetRoutes.filter((r) => r.route === options.route || r.route.startsWith(options.route));
    if (targetRoutes.length === 0) {
      console.error(`${colors.red}[ERROR] No route matched filter '${options.route}'${colors.reset}`);
      process.exit(1);
    }
  }

  let targetViewports = Object.values(VIEWPORTS);
  if (options.viewport) {
    const matched = VIEWPORTS[options.viewport];
    if (!matched) {
      console.error(`${colors.red}[ERROR] Unknown viewport '${options.viewport}'. Choose from: ${Object.keys(VIEWPORTS).join(', ')}${colors.reset}`);
      process.exit(1);
    }
    targetViewports = [matched];
  }

  const totalChecks = targetRoutes.length * targetViewports.length;

  console.log(`\n${colors.bold}${colors.cyan}================================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   SMASH COURT — 44 ROUTES x 6 VIEWPORTS E2E RESPONSIVENESS VERIFIER${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================================${colors.reset}`);
  console.log(`${colors.gray}Base URL:         ${options.baseUrl}${colors.reset}`);
  console.log(`${colors.gray}Target Routes:    ${targetRoutes.length} (Storefront: ${targetRoutes.filter((r) => r.type === 'Storefront').length}, Portal: ${targetRoutes.filter((r) => r.type === 'Admin Portal').length})${colors.reset}`);
  console.log(`${colors.gray}Target Viewports: ${targetViewports.map((v) => `${v.name} (${v.width}x${v.height})`).join(', ')}${colors.reset}`);
  console.log(`${colors.gray}Total Checks:     ${totalChecks} automated tests${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}--------------------------------------------------------------------------------${colors.reset}\n`);

  const browser = await launchBrowser(options.headless);
  const sessionToken = generateAdminSessionToken();
  const urlObj = new URL(options.baseUrl);

  const results = {
    total: totalChecks,
    passed: 0,
    failed: 0,
    failures: [],
    startTime: Date.now(),
  };

  let checkIndex = 0;

  try {
    for (const vp of targetViewports) {
      console.log(`\n${colors.bold}${colors.magenta}▶ VIEWPORT: ${vp.name.toUpperCase()} (${vp.width}x${vp.height} — ${vp.label})${colors.reset}`);
      console.log(`${colors.gray}--------------------------------------------------------------------------------${colors.reset}`);

      // Create a fresh browser context per viewport to guarantee clean state
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: 'light',
        deviceScaleFactor: 1,
      });

      // Pre-seed HMAC session cookie for admin portal routes
      await context.addCookies([
        {
          name: 'smash_session',
          value: sessionToken,
          domain: urlObj.hostname,
          path: '/',
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);

      const page = await context.newPage();

      for (const routeItem of targetRoutes) {
        checkIndex++;
        const { route, type } = routeItem;
        const targetUrl = `${options.baseUrl}${route}`;
        const prefix = `[${checkIndex}/${totalChecks}]`;

        try {
          const response = await page.goto(targetUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 20000,
          });

          // Wait 600ms for layout stabilization, carousel mounts, and client-side fonts
          await page.waitForTimeout(600);

          const metrics = await evaluatePageLayout(page, type, vp.width);
          const httpStatus = response ? response.status() : 'N/A';

          const overflowPass = !metrics.hasOverflow && metrics.scrollWidth <= vp.width;
          const navPass = !metrics.navStatus.applicable || metrics.navStatus.passed;
          const overallPass = overflowPass && navPass;

          if (overallPass) {
            results.passed++;
            console.log(
              `  ${colors.green}✓ PASS${colors.reset} ${colors.gray}${prefix}${colors.reset} [${vp.name}] ${colors.bold}${route}${colors.reset} ${colors.gray}(HTTP ${httpStatus}, scrollWidth: ${metrics.scrollWidth}px)${colors.reset}`
            );
          } else {
            results.failed++;
            const failureDetail = {
              route,
              type,
              viewport: vp.name,
              viewportDimensions: `${vp.width}x${vp.height}`,
              httpStatus,
              scrollWidth: metrics.scrollWidth,
              innerWidth: metrics.innerWidth,
              overflowDelta: metrics.overflowDelta,
              offendingElements: metrics.offendingElements,
              navStatus: metrics.navStatus,
            };
            results.failures.push(failureDetail);

            console.error(
              `  ${colors.red}✗ FAIL${colors.reset} ${colors.gray}${prefix}${colors.reset} [${vp.name}] ${colors.bold}${route}${colors.reset} ${colors.gray}(HTTP ${httpStatus})${colors.reset}`
            );

            if (!overflowPass) {
              console.error(
                `       ${colors.red}→ Overflow: scrollWidth ${metrics.scrollWidth}px > innerWidth ${vp.width}px (exceeds by +${metrics.overflowDelta}px)${colors.reset}`
              );
              if (metrics.offendingElements.length > 0) {
                console.error(`       ${colors.yellow}Top offending DOM elements:${colors.reset}`);
                metrics.offendingElements.forEach((el, idx) => {
                  console.error(
                    `         ${idx + 1}. <${el.tag}> selector="${el.selector}" width=${el.rect.width}px right=${el.rect.right}px`
                  );
                });
              }
            }

            if (!navPass) {
              console.error(`       ${colors.red}→ Navigation: ${metrics.navStatus.reason}${colors.reset}`);
            }

            if (options.bail) {
              console.log(`\n${colors.yellow}[BAIL] Stopping on first failure.${colors.reset}`);
              await context.close();
              await browser.close();
              printSummary(results);
              process.exit(1);
            }
          }
        } catch (err) {
          results.failed++;
          const failureDetail = {
            route,
            type,
            viewport: vp.name,
            viewportDimensions: `${vp.width}x${vp.height}`,
            error: err.message,
          };
          results.failures.push(failureDetail);

          console.error(
            `  ${colors.red}✗ ERROR${colors.reset} ${colors.gray}${prefix}${colors.reset} [${vp.name}] ${colors.bold}${route}${colors.reset}: ${err.message}`
          );

          if (options.bail) {
            console.log(`\n${colors.yellow}[BAIL] Stopping on first error.${colors.reset}`);
            await context.close();
            await browser.close();
            printSummary(results);
            process.exit(1);
          }
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  printSummary(results);

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Print formatted execution summary
function printSummary(results) {
  const elapsedSec = ((Date.now() - results.startTime) / 1000).toFixed(1);
  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : '0.0';

  console.log(`\n${colors.bold}${colors.cyan}================================================================================${colors.reset}`);
  console.log(`${colors.bold}                    VIEWPORT VERIFICATION SUMMARY REPORT${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}================================================================================${colors.reset}`);
  console.log(`  Total Checks:    ${results.total}`);
  console.log(`  Passed Checks:   ${colors.green}${results.passed}${colors.reset}`);
  console.log(`  Failed Checks:   ${results.failed > 0 ? colors.red : colors.green}${results.failed}${colors.reset}`);
  console.log(`  Pass Rate:       ${results.failed === 0 ? colors.green : colors.yellow}${passRate}%${colors.reset}`);
  console.log(`  Execution Time:  ${elapsedSec}s`);
  console.log(`${colors.bold}${colors.cyan}--------------------------------------------------------------------------------${colors.reset}`);

  if (results.failures.length > 0) {
    console.log(`\n${colors.bold}${colors.red}FAILURES BREAKDOWN (${results.failures.length}):${colors.reset}`);
    results.failures.forEach((f, idx) => {
      console.log(`  ${idx + 1}. [${f.viewport}] ${f.route} (${f.type})`);
      if (f.overflowDelta) {
        console.log(`     Overflow: +${f.overflowDelta}px (scrollWidth: ${f.scrollWidth}px vs ${f.viewportDimensions})`);
      }
      if (f.navStatus && !f.navStatus.passed) {
        console.log(`     Navigation: ${f.navStatus.reason}`);
      }
      if (f.error) {
        console.log(`     Error: ${f.error}`);
      }
    });
    console.log('');
  } else {
    console.log(`\n  ${colors.bold}${colors.green}🎉 ALL 44 ROUTES PASSED ACROSS ALL 6 VIEWPORTS WITH ZERO HORIZONTAL OVERFLOW!${colors.reset}\n`);
  }
}

// Execute runner
run().catch((err) => {
  console.error(`\n${colors.bold}${colors.red}[FATAL RUNNER CRASH]${colors.reset} ${err.stack || err.message}`);
  process.exit(1);
});
