# Smash Court E2E Test Infrastructure (TEST_INFRA.md)

## 1. Testing Philosophy & Architecture

The Smash Court E2E Testing Track provides end-to-end, opaque-box, requirement-driven verification across all 30 functional features of the platform.

### Core Principles
1. **Opaque-Box & Requirement-Driven**: Tests treat the application as a black box, deriving expectations strictly from authoritative specifications (`ORIGINAL_REQUEST.md` and `PROJECT.md`). No facade tests, no coupling to internal implementation trivia.
2. **Multi-Layered Verification**:
   - **Storefront & Admin DOM / UX**: Playwright headless browser testing (with `{ channel: 'chrome' }` fallback on Windows host). Validates DOM rendering, computed styles (`font-weight <= 500`), touch targets (`>= 44px`), and responsive gutters (`scrollWidth <= clientWidth` on 360px, 768px, 1440px).
   - **BFF & REST API Layer**: Direct HTTP client testing verifying headers, cookies (`httpOnly; SameSite=Lax`), status codes, payload contracts, and error responses.
   - **Live PostgreSQL 18 Multi-Database State**: Direct SQL queries connecting to the 6 isolated databases (`identity_db`, `catalog_db`, `inventory_db`, `order_db`, `secondhand_db`, `warranty_db`) to guarantee transactional invariants, audit movements, and snapshot immutability.
3. **Progressive Testability**: Tests are tagged by milestone (`M0`, `M1`, `M2`, `M3`, `M4`, `M5`, `M_E2E`). The test runner supports milestone filtering so engineers can verify currently active milestones and completed dependencies without blocking on future planned milestones.
4. **Adversarial Verification**: Includes adversarial test cases targeting PII enumeration (Anti-IDOR), XSS injection in markdown descriptions, open redirect sanitization, concurrent race conditions, and boundary violations.

---

## 2. 4-Tier Test Architecture

The test suite is structured into 4 distinct tiers:

| Tier | Category | Minimum Requirement | Implemented Count | Focus Area |
|------|----------|---------------------|-------------------|------------|
| **Tier 1** | **Feature Coverage** | $\ge 5$ tests per feature | **150 tests** | Isolated happy-path functional behavior for all 30 features (F01–F30). |
| **Tier 2** | **Boundary & Corner Cases** | $\ge 5$ tests per feature | **150 tests** | Extreme values, invalid inputs, edge states, security fences, and error handling for all 30 features (F01–F30). |
| **Tier 3** | **Cross-Feature Combinations** | Multi-feature interactions | **20 tests** | Pairwise and multi-feature interactions across Catalog, Checkout, Auth, Admin, and Warranty. |
| **Tier 4** | **Real-World Scenarios** | Realistic user journeys | **10 tests** | Complete end-to-end customer and administrative multi-step lifecycles. |
| **TOTAL**| | | **330 tests** | Complete full-lifecycle verification track. |

---

## 3. Feature Inventory Coverage Matrix

| Feature ID | Feature Name | Milestone | Tier 1 Tests | Tier 2 Tests | Spec File |
|------------|--------------|-----------|--------------|--------------|-----------|
| **F01** | `SafeImage` Component | M0 | F01-T1-01..05 (5) | F01-T2-01..05 (5) | `e2e/tier1-features/f01-f05-storefront-security.spec.js` |
| **F02** | Sanitize Internal Text | M0 | F02-T1-01..05 (5) | F02-T2-01..05 (5) | `e2e/tier1-features/f01-f05-storefront-security.spec.js` |
| **F03** | Route Guards for `/_design` | M0 | F03-T1-01..05 (5) | F03-T2-01..05 (5) | `e2e/tier1-features/f01-f05-storefront-security.spec.js` |
| **F04** | Sync Canonical Data | M0 | F04-T1-01..05 (5) | F04-T2-01..05 (5) | `e2e/tier1-features/f01-f05-storefront-security.spec.js` |
| **F05** | Anti-IDOR Warranty Lookup | M0 | F05-T1-01..05 (5) | F05-T2-01..05 (5) | `e2e/tier1-features/f01-f05-storefront-security.spec.js` |
| **F06** | Secondhand Serial Masking | M0 | F06-T1-01..05 (5) | F06-T2-01..05 (5) | `e2e/tier1-features/f06-f10-ui-quality.spec.js` |
| **F07** | Claims-to-Confirm Documentation | M0 | F07-T1-01..05 (5) | F07-T2-01..05 (5) | `e2e/tier1-features/f06-f10-ui-quality.spec.js` |
| **F08** | Unified `Container` Component | M0 | F08-T1-01..05 (5) | F08-T2-01..05 (5) | `e2e/tier1-features/f06-f10-ui-quality.spec.js` |
| **F09** | PDP Halbertec 8000 Stock Fix | M0 | F09-T1-01..05 (5) | F09-T2-01..05 (5) | `e2e/tier1-features/f06-f10-ui-quality.spec.js` |
| **F10** | Eliminate Bold Tags | M0 | F10-T1-01..05 (5) | F10-T2-01..05 (5) | `e2e/tier1-features/f06-f10-ui-quality.spec.js` |
| **F11** | `product_images` Schema & Seed | M1 | F11-T1-01..05 (5) | F11-T2-01..05 (5) | `e2e/tier1-features/f11-f15-catalog-experience.spec.js` |
| **F12** | Racket Attributes & Markdown | M1 | F12-T1-01..05 (5) | F12-T2-01..05 (5) | `e2e/tier1-features/f11-f15-catalog-experience.spec.js` |
| **F13** | Redesigned `ProductCard` | M1 | F13-T1-01..05 (5) | F13-T2-01..05 (5) | `e2e/tier1-features/f11-f15-catalog-experience.spec.js` |
| **F14** | Redesigned Sticky PDP Layout | M1 | F14-T1-01..05 (5) | F14-T2-01..05 (5) | `e2e/tier1-features/f11-f15-catalog-experience.spec.js` |
| **F15** | Left Faceted Filter & Vaul Sheet | M1 | F15-T1-01..05 (5) | F15-T2-01..05 (5) | `e2e/tier1-features/f11-f15-catalog-experience.spec.js` |
| **F16** | BFF Cookie RESTful Auth | M2 | F16-T1-01..05 (5) | F16-T2-01..05 (5) | `e2e/tier1-features/f16-f20-auth-admin-home.spec.js` |
| **F17** | Customer Profile & Address Book | M2 | F17-T1-01..05 (5) | F17-T2-01..05 (5) | `e2e/tier1-features/f16-f20-auth-admin-home.spec.js` |
| **F18** | RBAC 4 Roles & Admin Area | M2 | F18-T1-01..05 (5) | F18-T2-01..05 (5) | `e2e/tier1-features/f16-f20-auth-admin-home.spec.js` |
| **F19** | Hero Banner Carousel | M3 | F19-T1-01..05 (5) | F19-T2-01..05 (5) | `e2e/tier1-features/f16-f20-auth-admin-home.spec.js` |
| **F20** | Homepage Light-Dark Visual Rhythm | M3 | F20-T1-01..05 (5) | F20-T2-01..05 (5) | `e2e/tier1-features/f16-f20-auth-admin-home.spec.js` |
| **F21** | Promotional Pricing (`sale_prices`) | M3 | F21-T1-01..05 (5) | F21-T2-01..05 (5) | `e2e/tier1-features/f21-f25-pricing-reviews.spec.js` |
| **F22** | Reviews & Rating Stats Schemas | M4 | F22-T1-01..05 (5) | F22-T2-01..05 (5) | `e2e/tier1-features/f21-f25-pricing-reviews.spec.js` |
| **F23** | Review Verification & Eligibility | M4 | F23-T1-01..05 (5) | F23-T2-01..05 (5) | `e2e/tier1-features/f21-f25-pricing-reviews.spec.js` |
| **F24** | PDP Review UI & Lightbox | M4 | F24-T1-01..05 (5) | F24-T2-01..05 (5) | `e2e/tier1-features/f21-f25-pricing-reviews.spec.js` |
| **F25** | Review Moderation | M4 | F25-T1-01..05 (5) | F25-T2-01..05 (5) | `e2e/tier1-features/f21-f25-pricing-reviews.spec.js` |
| **F26** | Used Racquets Revamp | M5 | F26-T1-01..05 (5) | F26-T2-01..05 (5) | `e2e/tier1-features/f26-f30-polish-testing.spec.js` |
| **F27** | Branch Real Maps & Storefront Photos | M5 | F27-T1-01..05 (5) | F27-T2-01..05 (5) | `e2e/tier1-features/f26-f30-polish-testing.spec.js` |
| **F28** | Product Comparison Page | M5 | F28-T1-01..05 (5) | F28-T2-01..05 (5) | `e2e/tier1-features/f26-f30-polish-testing.spec.js` |
| **F29** | Comprehensive Responsive & Dark Mode | M5 | F29-T1-01..05 (5) | F29-T2-01..05 (5) | `e2e/tier1-features/f26-f30-polish-testing.spec.js` |
| **F30** | Playwright E2E Suite & Video Capture | M_E2E | F30-T1-01..05 (5) | F30-T2-01..05 (5) | `e2e/tier1-features/f26-f30-polish-testing.spec.js` |

---

## 4. Test Runner Commands & Usage

The unified runner is located at `test/run-e2e.js` and wired to npm and make scripts:

```bash
# Run all 330 E2E tests
node test/run-e2e.js
npm run test:e2e
make test-e2e

# Run by Tier
node test/run-e2e.js --tier 1       # Tier 1 only (150 feature coverage tests)
node test/run-e2e.js --tier 2       # Tier 2 only (150 boundary tests)
node test/run-e2e.js --tier 3       # Tier 3 only (20 cross-feature combo tests)
node test/run-e2e.js --tier 4       # Tier 4 only (10 real-world scenario tests)
node test/run-e2e.js --tier 1,2     # Tiers 1 and 2

# Run by Milestone
node test/run-e2e.js --milestone M0    # All M0 release blocker tests
node test/run-e2e.js --milestone M1    # All M1 catalog upgrade tests
node test/run-e2e.js --milestone M2    # All M2 auth and admin tests

# Run by Feature
node test/run-e2e.js --feature F04     # Feature 4 tests (T1 + T2)
node test/run-e2e.js --id F05-T2-01    # Run single test by ID

# Options & Debugging
node test/run-e2e.js --list            # List matched tests without executing
node test/run-e2e.js --bail            # Stop immediately on first failure
node test/run-e2e.js --video true      # Capture video recordings to e2e/videos/
node test/run-e2e.js --headless false  # Run with visible Chrome browser
```

---

## 5. Test Case Structure & Format

Every test case adheres to the project standard specification schema:

```javascript
{
  id: 'F05-T2-01',                                                  // Unique Test ID: [Feature]-[Tier]-[Number]
  feature: 'F05',                                                   // Feature code (F01..F30)
  tier: 2,                                                          // Tier level (1, 2, 3, 4)
  milestone: 'M0',                                                  // Milestone tag
  title: 'Anti-IDOR Gate: Request with ONLY phone returns 400',     // Descriptive behavior statement
  source: 'ORIGINAL_REQUEST.md § Acceptance Criteria #65',          // Authoritative requirements citation
  async test() {                                                    // Test implementation
    const res = await http.get('/api/warranty/lookup?phone=0901234567');
    assertStatus(res, 400, 'Lookup with ONLY phone must return 400 Bad Request');
  }
}
```

---

## 6. Coverage Thresholds & Quality Gates

1. **Milestone Progressive Gate**: Each milestone must achieve 100% PASS on its assigned feature tests before being marked complete.
2. **Regression Protection**: Running `npm test` (`test/test-suite.js`) must maintain 100% PASS (51/51 tests).
3. **M_FINAL Readiness Gate**: 100% PASS across all 330 tests in Tiers 1–4, zero horizontal scroll, zero bold tags, and zero leaked internal tokens.
