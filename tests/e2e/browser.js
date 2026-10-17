/**
 * Playwright Browser Helper for E2E Tests
 * Auto-detects Chrome channel on Windows host and manages viewports & video recording
 */

const path = require('path');
const fs = require('fs');

let playwright;
try {
  playwright = require('playwright');
} catch (err) {
  try {
    playwright = require(path.resolve(__dirname, '../../node_modules/playwright'));
  } catch (_) {
    console.error('Playwright not found in root or relative path');
  }
}

const VIEWPORTS = {
  mobile: { width: 360, height: 800 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
};

async function launchBrowser(options = {}) {
  if (!playwright) {
    throw new Error('Playwright library is not available');
  }

  const { headless = true } = options;
  const { chromium } = playwright;

  try {
    // Attempt standard chromium
    return await chromium.launch({ headless });
  } catch (err) {
    // Fallback to Google Chrome on Windows host
    try {
      return await chromium.launch({ headless, channel: 'chrome' });
    } catch (err2) {
      throw new Error(`Failed to launch browser: ${err2.message}`);
    }
  }
}

async function createContextAndPage(browser, options = {}) {
  const {
    viewport = VIEWPORTS.desktop,
    colorScheme = 'light',
    recordVideo = false,
    videoDir = path.resolve(__dirname, '../videos'),
    ...restOptions
  } = options;

  const contextOptions = {
    viewport,
    colorScheme,
    ...restOptions,
  };

  if (recordVideo) {
    if (!fs.existsSync(videoDir)) {
      fs.mkdirSync(videoDir, { recursive: true });
    }
    contextOptions.recordVideo = {
      dir: videoDir,
      size: viewport,
    };
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  return { context, page };
}

async function withPage(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  const browser = await launchBrowser(options);
  try {
    const { context, page } = await createContextAndPage(browser, options);
    try {
      return await callback(page, context);
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

module.exports = {
  VIEWPORTS,
  launchBrowser,
  createContextAndPage,
  withPage,
};
