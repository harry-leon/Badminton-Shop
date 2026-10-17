/**
 * Custom Assertion Library for Smash Court E2E Tests
 */

const assert = require('assert');

function assertTrue(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed: expected condition to be true');
  }
}

function assertEqual(actual, expected, message) {
  assert.strictEqual(
    actual,
    expected,
    message || `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
  );
}

function assertMatch(actual, regex, message) {
  assertTrue(
    regex.test(String(actual)),
    message || `Expected ${JSON.stringify(actual)} to match pattern ${regex}`
  );
}

function assertNotMatch(actual, regex, message) {
  assertTrue(
    !regex.test(String(actual)),
    message || `Expected ${JSON.stringify(actual)} NOT to match pattern ${regex}`
  );
}

function assertStatus(res, expectedStatus, message) {
  assertEqual(
    res.status,
    expectedStatus,
    message || `Expected HTTP status ${expectedStatus} but received ${res.status}: ${JSON.stringify(res.data || res.text)}`
  );
}

/**
 * Checks for forbidden internal tokens:
 * (Quy tắc R...), Snapshot Immutability, Unique Unit, Design System, Quiet Court
 */
function assertNoInternalTokens(text, contextName = 'Storefront') {
  const forbiddenPatterns = [
    /Quy\s*tắc\s*R\d+/i,
    /Snapshot\s*Immutability/i,
    /Unique\s*Unit/i,
    /Design\s*System/i,
    /Quiet\s*Court/i,
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(text)) {
      const match = text.match(pattern)[0];
      throw new Error(
        `[Security / Polish Violation] Found forbidden internal token "${match}" in ${contextName}`
      );
    }
  }
}

/**
 * Verifies that the page contains 0 <b> and 0 <strong> elements
 */
async function assertNoBoldTags(page, contextName = 'Page') {
  const boldCount = await page.evaluate(() => {
    return document.querySelectorAll('b, strong').length;
  });
  assertEqual(
    boldCount,
    0,
    `[Typography Rule Violation] ${contextName} contains ${boldCount} forbidden <b> or <strong> elements. Expected 0.`
  );
}

/**
 * Verifies that the page has zero horizontal scroll (scrollWidth <= clientWidth)
 */
async function assertNoHorizontalOverflow(page, viewportName = 'Current viewport') {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
    const clientWidth = Math.max(doc.clientWidth, window.innerWidth);
    return {
      scrollWidth,
      clientWidth,
      hasOverflow: scrollWidth > clientWidth,
    };
  });

  assertTrue(
    !overflow.hasOverflow,
    `[Responsive Gutter Violation] Horizontal overflow detected on ${viewportName}: scrollWidth (${overflow.scrollWidth}px) > clientWidth (${overflow.clientWidth}px)`
  );
}

/**
 * Verifies computed font-weight <= maxWeight (default 500)
 */
async function assertComputedFontWeight(page, selector, maxWeight = 500) {
  const result = await page.evaluate(
    ({ sel, max }) => {
      const els = Array.from(document.querySelectorAll(sel));
      const violations = [];
      for (const el of els) {
        const weight = parseInt(window.getComputedStyle(el).fontWeight, 10);
        if (weight > max) {
          violations.push({ text: el.textContent?.slice(0, 30), weight });
        }
      }
      return { total: els.length, violations };
    },
    { sel: selector, max: maxWeight }
  );

  assertTrue(
    result.violations.length === 0,
    `[Typography Rule] Found ${result.violations.length} elements exceeding font-weight ${maxWeight}: ${JSON.stringify(result.violations)}`
  );
}

/**
 * Verifies minimum touch target size (44x44px)
 */
async function assertTouchTarget(page, selector, minSize = 44) {
  const size = await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }, selector);

  assertTrue(size !== null, `Element ${selector} not found for touch target check`);
  assertTrue(
    size.width >= minSize && size.height >= minSize,
    `Touch target for ${selector} is ${size.width}x${size.height}px, smaller than required ${minSize}x${minSize}px`
  );
}

module.exports = {
  assertTrue,
  assertEqual,
  assertMatch,
  assertNotMatch,
  assertStatus,
  assertNoInternalTokens,
  assertNoBoldTags,
  assertNoHorizontalOverflow,
  assertComputedFontWeight,
  assertTouchTarget,
};
