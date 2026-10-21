# TEST READY — SmashCourt Viewport & Responsive Verification Suite

## Status: READY FOR MILESTONE VERIFICATION

The automated E2E viewport and responsiveness test harness has been implemented, validated, and is ready for full execution against the SmashCourt web application.

---

## 1. Test Harness Overview

- **Script Path**: `scripts/verify-all-viewports.js`
- **Framework**: Playwright (with automated Windows Google Chrome channel fallback)
- **Scope**: **44 Authoritative Routes** $\times$ **6 Standardized Viewports** = **264 Total Verification Checks**
  - **26 Storefront Customer Routes**: Catalog, PDPs, pre-owned racket inspection, shopping cart, checkout, comparison matrix, branch Google Maps, warranty anti-IDOR lookup, customer profile, careers, 403.
  - **18 Admin Portal Routes**: Executive dashboard, banner CMS, multi-branch inventory matrix, products catalog & taxonomy, orders processing, review moderation, dynamic RBAC role editor, warranty claims, stringing workshop.
- **Authentication**: Headless HMAC-SHA256 signed `smash_session` cookie auto-injected for all 18 `/portal/*` routes (`userId: 'admin-test'`, `role: 'ADMIN'`).
- **Detailed Specifications**: See `TEST_INFRA.md` at project root.

---

## 2. Standardized Viewport Matrix

| Viewport ID | Width $\times$ Height | Target Device Archetype | Breakpoint Expectations |
|---|---|---|---|
| `mobile-320` | $320 \times 640$ | iPhone SE (1st gen) | Ultra-compact single column; 16px page gutter; minimum 44px tap targets; hamburger active. |
| `mobile-360` | $360 \times 800$ | Samsung Galaxy S standard | Mainstream compact mobile; hamburger active; desktop nav hidden. |
| `mobile-390` | $390 \times 844$ | iPhone 14 / iPhone 15 | Modern mainstream iOS device; hamburger active; desktop nav hidden. |
| `tablet-768` | $768 \times 1024$ | iPad Mini / Portrait | Medium portrait tablet; 24px page gutter; hamburger active (< 1024px); desktop nav hidden. |
| `tablet-1024` | $1024 \times 768$ | iPad Pro / Small Laptop | Transition point (>= 1024px); desktop category nav visible; hamburger button hidden. |
| `desktop-1440` | $1440 \times 900$ | Desktop Widescreen | Full desktop layout; 32px page gutter (`max-w-7xl`); multi-column tables and sticky bars. |

---

## 3. Pass / Fail Acceptance Criteria

1. **Zero Horizontal Overflow Invariant**:
   $$\text{document.documentElement.scrollWidth} \le \text{window.innerWidth}$$
   The page root must not produce horizontal scrollbars. If violated, the top 5 offending DOM elements extending outside `clientWidth` are automatically extracted and logged with CSS selectors, tag names, classes, and bounding boxes (`left`, `right`, `width`).
2. **Responsive Navigation State**:
   - For viewports **< 1024px** (`mobile-320`, `mobile-360`, `mobile-390`, `tablet-768`):
     - Desktop category navigation / portal sidebar must be **hidden**.
     - Mobile hamburger menu button must be **visible**.
   - For viewports **>= 1024px** (`tablet-1024`, `desktop-1440`):
     - Desktop category navigation / portal sidebar must be **visible**.
     - Mobile hamburger menu button must be **hidden**.
3. **Execution Exit Code**:
   - `0`: 100% of checks passed cleanly.
   - `1`: Any horizontal overflow or responsive navigation failure detected.

---

## 4. How to Run the Verification Suite

Ensure the Next.js application is running (e.g., `npm run dev` or `npm run build:next && npm run start` on `http://localhost:3000`).

### 4.1 Full Suite Execution (264 Checks)
```bash
node scripts/verify-all-viewports.js
```

### 4.2 Target Single Route Debugging
```bash
# Storefront catalog
node scripts/verify-all-viewports.js --route=/vot-cau-long

# Admin Portal inventory matrix
node scripts/verify-all-viewports.js --route=/portal/inventory
```

### 4.3 Target Single Viewport
```bash
# Test extreme 320px mobile constraint across all 44 routes
node scripts/verify-all-viewports.js --viewport=mobile-320

# Test tablet breakpoint
node scripts/verify-all-viewports.js --viewport=tablet-768
```

### 4.4 Custom Host / Port
```bash
node scripts/verify-all-viewports.js --baseUrl=http://127.0.0.1:3000
```

### 4.5 Immediate Stop on First Failure
```bash
node scripts/verify-all-viewports.js --bail
```

---

## 5. Companion Quality Gate Commands

Along with the viewport test harness, the following commands verify frontend code health:

```powershell
# 1. TypeScript & Type-Check Verification
cd c:\badminton-shop\frontend
npm run lint

# 2. Next.js Production Compilation
cd c:\badminton-shop\frontend
npm run build:next
```
