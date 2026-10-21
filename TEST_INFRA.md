# SmashCourt Viewport & Responsive Test Infrastructure (TEST_INFRA)

## 1. Test Philosophy & Design Principles

The SmashCourt responsiveness test infrastructure is engineered around an **opaque-box, requirement-driven verification methodology** designed to guarantee flawless cross-device presentation across the entire catalog and admin suite.

### Core Principles
1. **Opaque-Box Observability**: The test harness evaluates the application purely through standard browser layout metrics (`window.innerWidth`, `document.documentElement.scrollWidth`, `document.documentElement.clientWidth`, and DOM computed bounding boxes) as rendered by the live browser engine. It does not rely on mocked styling or synthetic CSS parsers.
2. **Total Route Coverage (44 Pages x 6 Viewports = 264 Verification Checks)**: Every accessible storefront page (26 routes) and back-office administrative portal page (18 routes) is visited and tested against 6 standardized viewports, ensuring zero blind spots across screen sizes ranging from 320px to 1440px+.
3. **Strict Zero-Overflow Invariant**: Under modern responsive web design standards (WCAG and Mobile Web Ergonomics), horizontal scrolling is forbidden on standard layouts. Every page at every viewport must strictly satisfy:
   $$\text{document.documentElement.scrollWidth} \le \text{window.innerWidth}$$
4. **Responsive Navigation Integrity**: Navigation controls must cleanly transition between compact and expansive modes at the standard 1024px breakpoint:
   - Viewports **< 1024px**: Desktop navigation bar must be hidden; mobile hamburger drawer toggle button must be visible and interactive.
   - Viewports **>= 1024px**: Desktop navigation bar must be visible; mobile hamburger button must be hidden.
5. **Automated Diagnostic Attribution**: Whenever an overflow violation occurs, the test harness automatically inspects all rendered elements in the DOM tree, computing bounding rectangles (`left`, `right`, `width`) to isolate and report the top 5 offending elements with their CSS selectors, HTML tags, class names, and pixel offsets.

---

## 2. Route Inventory (44 Routes)

The application comprises **44 authoritative routes**: 26 Storefront customer routes and 18 Admin Portal management routes.

### 2.1 Storefront Routes (26 Pages)

| # | Route | Page Path | Component / Feature Scope |
|---|---|---|---|
| 1 | `/` | `src/app/(storefront)/page.tsx` | Hero Carousel, Promo Banners, Product Tabs, Athletes, Blog, Racket Quiz |
| 2 | `/vot-cau-long` | `src/app/(storefront)/vot-cau-long/page.tsx` | Badminton racket catalog, faceted filter drawer (Vaul), product cards |
| 3 | `/vot-cau-long/yonex-astrox-99-pro` | `src/app/(storefront)/vot-cau-long/[slug]/page.tsx` | Racket PDP, 7-angle gallery, sticky order bar, spec table, customer reviews |
| 4 | `/second-hand` | `src/app/(storefront)/second-hand/page.tsx` | Certified pre-owned racket catalog, grade filters, inspection badges |
| 5 | `/second-hand/SH-20261013-0001` | `src/app/(storefront)/second-hand/[id]/page.tsx` | 16-point technical checklist table, scratch inspection gallery, reservation CTA |
| 6 | `/giay-cau-long` | `src/app/(storefront)/giay-cau-long/page.tsx` | Badminton footwear catalog, size & brand filters |
| 7 | `/day-cuoc` | `src/app/(storefront)/day-cuoc/page.tsx` | Racket string catalog, tension & gauge recommendations |
| 8 | `/quan-ao` | `src/app/(storefront)/quan-ao/page.tsx` | Apparel catalog, size charts, material specs |
| 9 | `/quan-can` | `src/app/(storefront)/quan-can/page.tsx` | Grip wraps and maintenance accessories |
| 10 | `/tui-bao-vot` | `src/app/(storefront)/tui-bao-vot/page.tsx` | Racket bags, thermal compartment specs, backpacks |
| 11 | `/qua-cau-long` | `src/app/(storefront)/qua-cau-long/page.tsx` | Shuttlecocks category, speed ratings, flight stability |
| 12 | `/luoi-cau-long` | `src/app/(storefront)/luoi-cau-long/page.tsx` | Court nets, posts, boundary equipment |
| 13 | `/phu-kien` | `src/app/(storefront)/phu-kien/page.tsx` | Lead tape, wristbands, protective eyewear, grommets |
| 14 | `/cart` | `src/app/(storefront)/cart/page.tsx` | Cart table, quantity steppers, coupon input, order total |
| 15 | `/checkout` | `src/app/(storefront)/checkout/page.tsx` | Checkout form, address book selector, VietQR payment breakdown |
| 16 | `/so-sanh` | `src/app/(storefront)/so-sanh/page.tsx` | Multi-racket comparison table, diff highlighting, touch remove actions |
| 17 | `/chi-nhanh` | `src/app/(storefront)/chi-nhanh/page.tsx` | Showroom listings, Google Maps Embed iframes, hotlines |
| 18 | `/tra-cuu-bao-hanh` | `src/app/(storefront)/tra-cuu-bao-hanh/page.tsx` | Strict anti-IDOR warranty lookup (Order Code + Phone number) |
| 19 | `/tai-khoan` | `src/app/(storefront)/tai-khoan/page.tsx` | Customer profile, address book management, order history |
| 20 | `/dang-nhap` | `src/app/(storefront)/dang-nhap/page.tsx` | Dual-mode authentication (Login / Register) with redirect preservation |
| 21 | `/tim-kiem` | `src/app/(storefront)/tim-kiem/page.tsx` | Full-text catalog search results, sorting, price range sliders |
| 22 | `/gioi-thieu` | `src/app/(storefront)/gioi-thieu/page.tsx` | Brand heritage, philosophy, warranty commitments, showroom gallery |
| 23 | `/tuyen-dung` | `src/app/(storefront)/tuyen-dung/page.tsx` | Career openings, department/branch filtering |
| 24 | `/tuyen-dung/smashcourt-quan-1-tuyen-dung-nhan-vien-ban-hang` | `src/app/(storefront)/tuyen-dung/[slug]/page.tsx` | Job specification, JD markdown, online application form |
| 25 | `/account` | `src/app/(storefront)/account/page.tsx` | Account redirect / dashboard profile proxy |
| 26 | `/403` | `src/app/(storefront)/403/page.tsx` | Custom Forbidden 403 error page with return navigation |

### 2.2 Admin Portal Routes (18 Pages)

| # | Route | Page Path | Component / Feature Scope |
|---|---|---|---|
| 27 | `/portal` | `src/app/portal/page.tsx` | Operational KPIs, revenue charts, recent orders quick actions |
| 28 | `/portal/banners` | `src/app/portal/banners/page.tsx` | Banner CMS table, preview drawer, scheduling modal |
| 29 | `/portal/branches` | `src/app/portal/branches/page.tsx` | Branch management, hotline, operating hours editor |
| 30 | `/portal/customers` | `src/app/portal/customers/page.tsx` | Customer list table, purchase volume, search filters |
| 31 | `/portal/inventory` | `src/app/portal/inventory/page.tsx` | Multi-branch stock matrix, SKU transfer requests |
| 32 | `/portal/logs` | `src/app/portal/logs/page.tsx` | System audit log table, IP tracking, event filters, pagination |
| 33 | `/portal/orders` | `src/app/portal/orders/page.tsx` | Orders data table, order status pipeline, fulfillment actions |
| 34 | `/portal/products` | `src/app/portal/products/page.tsx` | Products data table, SKU pricing modal, image asset manager |
| 35 | `/portal/products/tags` | `src/app/portal/products/tags/page.tsx` | Product badges, tag colors, promotion flags |
| 36 | `/portal/products/taxonomy` | `src/app/portal/products/taxonomy/page.tsx` | Hierarchical category tree, brand taxonomy |
| 37 | `/portal/recruitment` | `src/app/portal/recruitment/page.tsx` | Candidate applications table, recruitment pipeline status |
| 38 | `/portal/reports` | `src/app/portal/reports/page.tsx` | Sales reports, category breakdown, export CSV |
| 39 | `/portal/reviews` | `src/app/portal/reviews/page.tsx` | Review moderation data table, reply threads, hide violation |
| 40 | `/portal/roles` | `src/app/portal/roles/page.tsx` | Dynamic RBAC role editor, permission matrix |
| 41 | `/portal/secondhand` | `src/app/portal/secondhand/page.tsx` | Pre-owned racket intake table, grading, buyback price rules |
| 42 | `/portal/stringing` | `src/app/portal/stringing/page.tsx` | Racket stringing queue, machine calibration, tension log |
| 43 | `/portal/users` | `src/app/portal/users/page.tsx` | Internal staff accounts table, role assignment, status toggles |
| 44 | `/portal/warranty` | `src/app/portal/warranty/page.tsx` | Warranty claim validation table, serial number verification |

---

## 3. Viewport Definitions

The verification harness enforces testing against six distinct device profiles spanning the entire responsive spectrum:

| Viewport Name | Resolution ($W \times H$) | Target Device Profile | Key Responsive Characteristics |
|---|---|---|---|
| `mobile-320` | $320 \times 640$ | iPhone SE (1st gen), small Androids | Extreme constraint; single-column grids; compact padding (16px gutter); minimum touch hit targets (44px). |
| `mobile-360` | $360 \times 800$ | Samsung Galaxy S standard | Mainstream compact mobile; standard 16px page gutter; hamburger drawer active. |
| `mobile-390` | $390 \times 844$ | iPhone 14 / iPhone 15 | Modern mainstream iOS mobile; high DPI; safe-area insets. |
| `tablet-768` | $768 \times 1024$ | iPad Mini / iPad Portrait | Tablet portrait; 24px gutter; hamburger drawer active (< 1024px); 2-column card layouts. |
| `tablet-1024` | $1024 \times 768$ | iPad Pro / Small Laptop / Landscape | Transition to desktop breakpoint; desktop category navigation visible (>= 1024px); 3-column grids. |
| `desktop-1440` | $1440 \times 900$ | Desktop Widescreen / MacBook Pro | Full desktop; 32px gutter (`max-w-7xl`); multi-column tables and sidebars. |

---

## 4. Pass / Fail Acceptance Criteria

Every test execution across the 264 combinations evaluates two core invariants:

### 4.1 Zero Horizontal Overflow Criterion
$$\Delta_{\text{overflow}} = \text{document.documentElement.scrollWidth} - \text{window.innerWidth}$$
- **PASS**: $\Delta_{\text{overflow}} \le 0$ (and $\text{document.documentElement.scrollWidth} \le \text{window.innerWidth}$).
- **FAIL**: $\Delta_{\text{overflow}} > 0$.
  - In the event of a failure, the runner queries the DOM for all elements whose bounding client rect satisfies:
    $$\text{rect.right} > \text{clientWidth} \quad \text{or} \quad \text{rect.left} < 0$$
  - The top 5 widest offenders are logged with their selector, tag, class list, and bounding rectangle (`{ left, right, width }`).

### 4.2 Header Responsive Navigation Criterion
For all storefront pages containing the primary header:
- **When Viewport Width < 1024px** (`mobile-320`, `mobile-360`, `mobile-390`, `tablet-768`):
  1. Desktop Category Navigation (`nav` element) must be **hidden** (`display: none` or not visible).
  2. Mobile Hamburger Toggle Button (`button` with Menu icon) must be **visible**.
- **When Viewport Width >= 1024px** (`tablet-1024`, `desktop-1440`):
  1. Desktop Category Navigation (`nav` element) must be **visible**.
  2. Mobile Hamburger Toggle Button must be **hidden**.

---

## 5. Authentication Architecture for Admin Portal

The 18 Admin Portal routes (`/portal/*`) are protected by Next.js Edge Middleware requiring a valid HMAC-SHA256 signed session cookie named `smash_session`.

### 5.1 Cookie Format & Signature
- **Cookie Name**: `smash_session`
- **Secret Key**: `process.env.SESSION_SECRET || 'smashcourt-default-session-secret-key-prod-2026'`
- **Payload Structure**:
  ```json
  {
    "user": {
      "id": "admin-test",
      "userId": "admin-test",
      "username": "admin-test",
      "email": "admin@smashcourt.vn",
      "full_name": "Test Administrator",
      "name": "Test Administrator",
      "role": "ADMIN",
      "branch_id": "BR_HCM_01"
    },
    "userId": "admin-test",
    "role": "ADMIN",
    "name": "Test Administrator",
    "exp": 1792454400000
  }
  ```
- **Signing Algorithm**:
  $$\text{encodedPayload} = \text{Base64Url}(\text{JSON.stringify}(\text{payload}))$$
  $$\text{signature} = \text{HMAC-SHA256}(\text{encodedPayload}, \text{SESSION\_SECRET}).\text{digest}(\text{'base64url'})$$
  $$\text{token} = \text{encodedPayload} \mathbin{\Vert} \text{'.' } \mathbin{\Vert} \text{signature}$$

### 5.2 Browser Context Injection
Before navigating to any `/portal/*` route, the Playwright browser context injects this signed cookie:
```javascript
await context.addCookies([
  {
    name: 'smash_session',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  },
]);
```
This bypasses login redirects (HTTP 302 to `/dang-nhap`) and grants headless test access directly to all administrative data views.

---

## 6. Test Runner CLI Usage

The automated runner is located at `scripts/verify-all-viewports.js`.

### 6.1 Full Test Suite Run (All 44 Routes x 6 Viewports = 264 Checks)
```bash
node scripts/verify-all-viewports.js
```

### 6.2 Targeted Single-Route Run
```bash
node scripts/verify-all-viewports.js --route=/vot-cau-long
```

### 6.3 Targeted Single-Viewport Run
```bash
node scripts/verify-all-viewports.js --viewport=mobile-320
```

### 6.4 Custom Base URL Run
```bash
node scripts/verify-all-viewports.js --baseUrl=http://127.0.0.1:3000
```

### 6.5 Combined Filtering
```bash
node scripts/verify-all-viewports.js --route=/portal/inventory --viewport=tablet-768
```

### 6.6 Process Exit Code
- **`0`**: All executed checks passed (zero horizontal overflow + correct navigation states).
- **`1`**: One or more checks failed.
