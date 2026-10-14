#!/usr/bin/env node

/**
 * SMASH COURT E2E TEST RUNNER
 * 
 * Executes 4-tier E2E test track across Playwright, HTTP BFF APIs, and PostgreSQL 18 databases.
 *
 * Usage:
 *   node test/run-e2e.js [options]
 *
 * Options:
 *   --tier <1|2|3|4|all>       Filter by test tier (comma-separated or 'all', default: all)
 *   --milestone <M0|M1|...>    Filter by project milestone (e.g. M0, M1, M2, M3, M4, M5, M_E2E)
 *   --feature <F01|F02|...>    Filter by feature ID (e.g. F01, F05)
 *   --id <TEST_ID>             Filter by specific test ID (e.g. F01-T1-01)
 *   --headless <true|false>    Run browser in headless mode (default: true)
 *   --video <true|false>       Enable video recording (default: false)
 *   --bail                     Stop execution immediately on first failure
 *   --list                     List matched tests without executing
 *   --json                     Output report in JSON format
 *   --help                     Display this help text
 */

const fs = require('fs');
const path = require('path');

// ANSI color helpers
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

// Parse command-line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    tier: null,
    milestone: null,
    feature: null,
    id: null,
    headless: true,
    video: false,
    bail: false,
    list: false,
    json: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--list' || arg === '-l') {
      options.list = true;
    } else if (arg === '--bail' || arg === '-b') {
      options.bail = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg === '--tier' && args[i + 1]) {
      options.tier = args[++i].split(',').map((t) => t.trim());
    } else if (arg === '--milestone' && args[i + 1]) {
      options.milestone = args[++i].toUpperCase().trim();
    } else if (arg === '--feature' && args[i + 1]) {
      options.feature = args[++i].toUpperCase().trim();
    } else if (arg === '--id' && args[i + 1]) {
      options.id = args[++i].trim();
    } else if (arg === '--headless' && args[i + 1]) {
      options.headless = args[++i].toLowerCase() !== 'false';
    } else if (arg === '--video' && args[i + 1]) {
      options.video = args[++i].toLowerCase() === 'true';
    }
  }

  return options;
}

// Discover and load all test suites
function loadTestSuites() {
  const rootDir = path.resolve(__dirname, '..');
  const e2eDir = path.join(rootDir, 'e2e');

  const suiteDirs = [
    path.join(e2eDir, 'tier1-features'),
    path.join(e2eDir, 'tier2-boundary'),
    path.join(e2eDir, 'tier3-combinations'),
    path.join(e2eDir, 'tier4-scenarios'),
  ];

  const allTests = [];

  for (const dir of suiteDirs) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.spec.js'));
    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const mod = require(filePath);
        if (mod && Array.isArray(mod.tests)) {
          for (const t of mod.tests) {
            allTests.push({
              ...t,
              suiteFile: path.relative(rootDir, filePath),
            });
          }
        }
      } catch (err) {
        console.error(`${colors.red}[ERROR] Failed to load spec file ${file}: ${err.message}${colors.reset}`);
      }
    }
  }

  return allTests;
}

// Filter tests based on CLI flags
function filterTests(tests, options) {
  return tests.filter((t) => {
    if (options.tier && !options.tier.includes('all') && !options.tier.includes(String(t.tier))) {
      return false;
    }
    if (options.milestone && (!t.milestone || t.milestone !== options.milestone)) {
      return false;
    }
    if (options.feature && (!t.feature || t.feature !== options.feature)) {
      return false;
    }
    if (options.id && t.id !== options.id) {
      return false;
    }
    return true;
  });
}

// Main execution routine
async function main() {
  const options = parseArgs();

  if (options.help) {
    console.log(`
${colors.bold}${colors.cyan}SMASH COURT E2E TEST RUNNER${colors.reset}
Usage: node test/run-e2e.js [options]

Options:
  --tier <1|2|3|4|all>       Filter by test tier (e.g. --tier 1,2 or --tier all)
  --milestone <M0|M1|...>    Filter by milestone (e.g. --milestone M0)
  --feature <F01|F02|...>    Filter by feature (e.g. --feature F01)
  --id <TEST_ID>             Filter by specific test ID (e.g. --id F01-T1-01)
  --headless <true|false>    Headless browser mode (default: true)
  --video <true|false>       Enable video recording (default: false)
  --bail                     Stop immediately on first test failure
  --list                     List matching tests without executing
  --json                     Output JSON report
  --help                     Show help message
`);
    process.exit(0);
  }

  const allTests = loadTestSuites();
  const selectedTests = filterTests(allTests, options);

  if (options.list) {
    console.log(`${colors.cyan}Found ${selectedTests.length} tests matching criteria:${colors.reset}\n`);
    for (const t of selectedTests) {
      console.log(`  [Tier ${t.tier}] [${t.id}] ${t.title} (${t.milestone || 'N/A'})`);
    }
    process.exit(0);
  }

  console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   SMASH COURT — 4-TIER E2E TEST SUITE RUNNER${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.gray}Total test inventory: ${allTests.length} tests${colors.reset}`);
  console.log(`${colors.gray}Selected for run:     ${selectedTests.length} tests${colors.reset}`);
  if (options.tier) console.log(`${colors.gray}Tier filter:          ${options.tier.join(', ')}${colors.reset}`);
  if (options.milestone) console.log(`${colors.gray}Milestone filter:     ${options.milestone}${colors.reset}`);
  if (options.feature) console.log(`${colors.gray}Feature filter:       ${options.feature}${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}------------------------------------------------------------------------${colors.reset}\n`);

  const results = {
    total: selectedTests.length,
    passed: 0,
    failed: 0,
    skipped: 0,
    startTime: new Date().toISOString(),
    tests: [],
    tierSummary: {
      1: { total: 0, passed: 0, failed: 0 },
      2: { total: 0, passed: 0, failed: 0 },
      3: { total: 0, passed: 0, failed: 0 },
      4: { total: 0, passed: 0, failed: 0 },
    },
  };

  const startTime = Date.now();

  for (let i = 0; i < selectedTests.length; i++) {
    const t = selectedTests[i];
    const testNum = `[${i + 1}/${selectedTests.length}]`;
    const tierKey = t.tier || 1;
    if (!results.tierSummary[tierKey]) {
      results.tierSummary[tierKey] = { total: 0, passed: 0, failed: 0 };
    }
    results.tierSummary[tierKey].total++;

    const tStart = Date.now();
    try {
      if (typeof t.test === 'function') {
        await t.test();
      }
      const duration = Date.now() - tStart;
      results.passed++;
      results.tierSummary[tierKey].passed++;

      results.tests.push({
        id: t.id,
        feature: t.feature,
        tier: t.tier,
        milestone: t.milestone,
        title: t.title,
        status: 'PASS',
        durationMs: duration,
      });

      console.log(
        `${colors.green}✓ PASS${colors.reset} ${colors.gray}${testNum}${colors.reset} ${colors.bold}[${t.id}]${colors.reset} ${t.title} ${colors.gray}(${duration}ms)${colors.reset}`
      );
    } catch (err) {
      const duration = Date.now() - tStart;
      results.failed++;
      results.tierSummary[tierKey].failed++;

      results.tests.push({
        id: t.id,
        feature: t.feature,
        tier: t.tier,
        milestone: t.milestone,
        title: t.title,
        status: 'FAIL',
        durationMs: duration,
        error: err.message,
      });

      console.error(
        `${colors.red}✗ FAIL${colors.reset} ${colors.gray}${testNum}${colors.reset} ${colors.bold}[${t.id}]${colors.reset} ${t.title}`
      );
      console.error(`       ${colors.red}Error: ${err.message}${colors.reset}`);

      if (options.bail) {
        console.log(`\n${colors.yellow}[BAIL] Execution stopped on first test failure.${colors.reset}`);
        break;
      }
    }
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  results.endTime = new Date().toISOString();
  results.durationSeconds = parseFloat(totalDuration);

  // Write report to disk
  const reportPath = path.resolve(__dirname, 'e2e-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');

  // Summary Table Output
  console.log(`\n${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`${colors.bold}                    E2E TEST EXECUTION SUMMARY${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}`);
  console.log(`  Tier 1 (Feature Coverage):       ${results.tierSummary[1].passed}/${results.tierSummary[1].total} passed`);
  console.log(`  Tier 2 (Boundary & Corner):      ${results.tierSummary[2].passed}/${results.tierSummary[2].total} passed`);
  console.log(`  Tier 3 (Cross-Feature Combos):   ${results.tierSummary[3].passed}/${results.tierSummary[3].total} passed`);
  console.log(`  Tier 4 (Real-World Scenarios):   ${results.tierSummary[4].passed}/${results.tierSummary[4].total} passed`);
  console.log(`${colors.bold}${colors.cyan}------------------------------------------------------------------------${colors.reset}`);
  const passRate = results.total > 0 ? ((results.passed / results.total) * 100).toFixed(1) : '0.0';
  console.log(`  ${colors.bold}TOTAL:${colors.reset} ${results.passed}/${results.total} PASSED (${passRate}%) in ${totalDuration}s`);
  console.log(`  Report artifact: ${reportPath}`);
  console.log(`${colors.bold}${colors.cyan}========================================================================${colors.reset}\n`);

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(`[FATAL] E2E runner crash: ${err.stack || err.message}`);
  process.exit(1);
});
