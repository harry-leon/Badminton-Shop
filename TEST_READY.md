# Smash Court E2E Test Suite Readiness (TEST_READY.md)

**Status**: **READY FOR MILESTONE VERIFICATION**
**Date**: 2026-10-14
**Author**: E2E Test Suite Designer & Writer

---

## 1. Test Runner & Execution Commands

The comprehensive E2E test suite can be run directly from anywhere in the monorepo:

```bash
# Clean execution commands
npm run test:e2e
node test/run-e2e.js
make test-e2e

# Filtered runs by Tier
node test/run-e2e.js --tier 1       # Tier 1 (150 feature coverage tests)
node test/run-e2e.js --tier 2       # Tier 2 (150 boundary tests)
node test/run-e2e.js --tier 3       # Tier 3 (20 cross-feature tests)
node test/run-e2e.js --tier 4       # Tier 4 (10 real-world scenario tests)

# Filtered runs by Milestone
node test/run-e2e.js --milestone M0 # Milestone M0 release blocker verification
node test/run-e2e.js --milestone M1 # Milestone M1 catalog verification

# Filtered runs by Feature
node test/run-e2e.js --feature F04  # Specific feature verification
```

---

## 2. Test Inventory by Tier

| Tier | Category | Number of Tests | Coverage Target |
|------|----------|-----------------|-----------------|
| **Tier 1** | **Feature Coverage** | **150** | 30 features $\times$ 5 isolated happy-path tests |
| **Tier 2** | **Boundary & Corner Cases** | **150** | 30 features $\times$ 5 boundary & edge cases |
| **Tier 3** | **Cross-Feature Combinations** | **20** | Pairwise catalog, checkout, auth, warranty interactions |
| **Tier 4** | **Real-World Scenarios** | **10** | End-to-end customer purchasing and admin workflows |
| **TOTAL** | | **330** | **Complete Full-Platform E2E Verification** |

---

## 3. Directory Layout & Artifacts

```
c:\badminton-shop\
├── package.json                          # Monorepo root package with "test:e2e" script
├── TEST_INFRA.md                         # Infrastructure, philosophy & feature matrix
├── TEST_READY.md                         # Readiness summary & baseline defect log
├── Makefile                              # Updated with test-e2e target
├── test\
│   ├── run-e2e.js                        # Unified test runner CLI (CLI flags, ANSI reports)
│   ├── test-suite.js                     # Master regression test suite (51/51 PASS)
│   └── e2e-report.json                   # Output machine-readable test execution report
└── e2e\
    ├── helpers\
    │   ├── browser.js                    # Playwright with Chrome fallback & viewports
    │   ├── http.js                       # HTTP BFF API client with cookie handling
    │   ├── db.js                         # Direct PostgreSQL multi-database connector
    │   └── assertions.js                 # Custom design rules, typography & anti-IDOR checks
    ├── tier1-features\
    │   ├── f01-f05-storefront-security.spec.js   # 25 tests
    │   ├── f06-f10-ui-quality.spec.js            # 25 tests
    │   ├── f11-f15-catalog-experience.spec.js    # 25 tests
    │   ├── f16-f20-auth-admin-home.spec.js       # 25 tests
    │   ├── f21-f25-pricing-reviews.spec.js       # 25 tests
    │   └── f26-f30-polish-testing.spec.js        # 25 tests
    ├── tier2-boundary\
    │   ├── f01-f05-boundary.spec.js              # 25 tests
    │   ├── f06-f10-boundary.spec.js              # 25 tests
    │   ├── f11-f15-boundary.spec.js              # 25 tests
    │   ├── f16-f20-boundary.spec.js              # 25 tests
    │   ├── f21-f25-boundary.spec.js              # 25 tests
    │   └── f26-f30-boundary.spec.js              # 25 tests
    ├── tier3-combinations\
    │   └── cross-feature-combinations.spec.js    # 20 tests
    └── tier4-scenarios\
        └── real-world-scenarios.spec.js          # 10 tests
```

---

## 4. Discovered Implementation Defects (Escalated to M0/Implementers)

During initial test baseline execution against the current codebase, the following real implementation defects were surfaced:

1. **Anti-IDOR Phone-Only Security Vulnerability**:
   - *Location*: `/frontend/src/app/api/warranty/lookup/route.ts:82`
   - *Observation*: Querying `GET /api/warranty/lookup?phone=0901234567` returns HTTP 200 with customer claims instead of HTTP 400 Bad Request.
   - *Required Fix*: Reject phone-only queries with HTTP 400 and Vietnamese message `Yêu cầu cung cấp đồng thời Mã đơn hàng và Số điện thoại`.

2. **Branch Address Desynchronization**:
   - *Location*: `/frontend/src/app/(storefront)/chi-nhanh/page.tsx`
   - *Observation*: Storefront displays non-canonical addresses `120 Nguyễn Thị Minh Khai` and `88 Nguyễn Văn Linh`.
   - *Required Fix*: Synchronize with database canonical addresses: `123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1` and `78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu`.

3. **Internal Token Leak in Storefront Navigation**:
   - *Location*: `/frontend/src/components/Header.tsx:28`
   - *Observation*: Header contains `<a href="/_design">Design System</a>` visible to public guests.
   - *Required Fix*: Remove Design System link from public Header/Footer; guard `/_design` with noindex and dev/admin restriction.

4. **Forbidden Bold Tags in Product Description**:
   - *Location*: Product detail page description
   - *Observation*: Astrox 99 Pro PDP renders raw `<b>` or `<strong>` elements.
   - *Required Fix*: Convert all `<b>`/`<strong>` to semantic `<span>` with computed `font-weight <= 500`.

5. **Missing `/quan-tri` RBAC Server Guard**:
   - *Location*: `/frontend/src/app/quan-tri`
   - *Observation*: Accessing `/quan-tri` returns 404 instead of redirecting unauthenticated users to `/dang-nhap?redirect=/quan-tri` or serving custom 403 page.
   - *Required Fix*: Implement server-side route guards and custom 403 page.
