/**
 * tests/unit/test-m3-storefront.js
 * Verification Test Suite for Milestone 3: Storefront Dynamic Rendering & Aggregator API Integration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passed = 0;
let total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('========================================================================');
console.log(' VERIFICATION SUITE: MILESTONE 3 STOREFRONT DYNAMIC RENDERING');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// TEST GROUP 1: HeroBannerCarousel.tsx Component Architecture & Contracts
// ---------------------------------------------------------------------------
console.log('[TEST GROUP 1] HeroBannerCarousel.tsx Architecture & Requirements');

const heroCarouselPath = path.resolve(__dirname, '../../frontend/src/components/HeroBannerCarousel.tsx');
assert(fs.existsSync(heroCarouselPath), 'frontend/src/components/HeroBannerCarousel.tsx exists');

const heroCarouselContent = fs.readFileSync(heroCarouselPath, 'utf-8');

// Check export signature
assert(
  heroCarouselContent.includes('export function HeroBannerCarousel(') &&
  heroCarouselContent.includes('banners') &&
  heroCarouselContent.includes('autoplayInterval = 6000'),
  'Exports HeroBannerCarousel with props { banners, autoplayInterval = 6000 }: HeroBannerCarouselProps'
);

// Check Embla Carousel hook
assert(
  heroCarouselContent.includes("from 'embla-carousel-react'") &&
  heroCarouselContent.includes('useEmblaCarousel({ loop: true })'),
  'Uses embla-carousel-react with { loop: true } configuration'
);

// Check touch/swipe support via Embla viewport ref
assert(
  heroCarouselContent.includes('ref={emblaRef}'),
  'Embla ref is attached to the viewport container for touch/swipe support'
);

// Check Autoplay with pause on hover & reduced-motion awareness
assert(
  heroCarouselContent.includes("window.matchMedia('(prefers-reduced-motion: reduce)')"),
  'Detects and respects prefers-reduced-motion media query to disable autoplay'
);

assert(
  heroCarouselContent.includes('onMouseEnter') &&
  heroCarouselContent.includes('onMouseLeave') &&
  heroCarouselContent.includes('isHovered'),
  'Pauses autoplay on mouse enter and resumes on mouse leave'
);

// Check navigation chevrons and pagination dots
assert(
  heroCarouselContent.includes('scrollPrev') &&
  heroCarouselContent.includes('scrollNext') &&
  heroCarouselContent.includes('ChevronLeft') &&
  heroCarouselContent.includes('ChevronRight'),
  'Renders navigation chevron buttons (previous and next)'
);

assert(
  heroCarouselContent.includes('scrollSnaps') &&
  heroCarouselContent.includes('selectedIndex') &&
  heroCarouselContent.includes('scrollTo(index)'),
  'Renders dynamic pagination dots with active slide indicators'
);

// Check Real DOM SEO text rendering
assert(
  heroCarouselContent.includes('<h2') &&
  heroCarouselContent.includes('{slide.title}') &&
  heroCarouselContent.includes('{slide.description}') &&
  heroCarouselContent.includes('{slide.badge}') &&
  heroCarouselContent.includes('{slide.primaryCtaText'),
  'Renders semantic real DOM SEO text: title (h2), description (p), badge (span), primary and secondary CTAs'
);

// Check Responsive image support (desktop and mobile)
assert(
  heroCarouselContent.includes('slide.mobileImageUrl') &&
  heroCarouselContent.includes('slide.mobileImageSrc') &&
  heroCarouselContent.includes('block sm:hidden') &&
  heroCarouselContent.includes('hidden sm:block'),
  'Renders responsive images: mobile image on <sm viewports and desktop image on >=sm viewports'
);

// Check Resilient Fallback to default hero banners
assert(
  heroCarouselContent.includes('DEFAULT_HERO_BANNERS') &&
  heroCarouselContent.includes('banners && Array.isArray(banners) && banners.length > 0'),
  'Smoothly falls back to DEFAULT_HERO_BANNERS if banners prop is null, undefined, or empty'
);

// ---------------------------------------------------------------------------
// TEST GROUP 2: Storefront page.tsx Aggregator Integration & Fallbacks
// ---------------------------------------------------------------------------
console.log('\n[TEST GROUP 2] Storefront page.tsx Spring Boot Aggregator & Fallbacks');

const pagePath = path.resolve(__dirname, '../../frontend/src/app/(storefront)/page.tsx');
assert(fs.existsSync(pagePath), 'frontend/src/app/(storefront)/page.tsx exists');

const pageContent = fs.readFileSync(pagePath, 'utf-8');

// Check Aggregator API call via fetchFromApi
assert(
  pageContent.includes("from '@/lib/api'") &&
  pageContent.includes("fetchFromApi") &&
  pageContent.includes("'/public/homepage'"),
  'Integrates with Spring Boot Aggregator API: calls fetchFromApi(\'/public/homepage\')'
);

// Check try/catch resilient fallback
assert(
  pageContent.includes('try {') &&
  pageContent.includes("'/public/homepage'") &&
  pageContent.includes('catch (apiErr)'),
  'Wraps Aggregator API call in resilient try/catch block with fallback logging'
);

// Check HeroBannerCarousel receives heroBanners
assert(
  pageContent.includes('<HeroBannerCarousel banners={heroBanners} />'),
  'Passes active hero banners into <HeroBannerCarousel banners={heroBanners} />'
);

// Check dynamic promo banners in Promo 3 section
assert(
  pageContent.includes('activePromoBanners') &&
  pageContent.includes('activePromoBanners.slice(0, 3).map('),
  'Renders promo banners dynamically from activePromoBanners in Promo 3 section'
);

// Check dynamic categories in Category section
assert(
  pageContent.includes('activeCategories') &&
  pageContent.includes('activeCategories.slice(0, 6).map('),
  'Renders featured categories dynamically from activeCategories in Category section'
);

// ---------------------------------------------------------------------------
// TEST GROUP 3: Quiet Court Design Rules Compliance
// ---------------------------------------------------------------------------
console.log('\n[TEST GROUP 3] Quiet Court Design Rules Compliance on Owned Files');

const FORBIDDEN_RULES = [
  { name: 'font-weight-600+', regex: /\bfont-(semibold|bold|extrabold|black)\b/g },
  { name: 'uppercase-class', regex: /\buppercase\b/g },
  { name: 'wide-tracking', regex: /\btracking-(wide|wider|widest)\b/g },
  { name: 'tiny-text', regex: /\btext-\[(8|9|10|11|12)px\]/g },
  { name: 'text-transparent', regex: /\btext-transparent\b/g },
  { name: 'bg-gradient', regex: /\bbg-gradient-[a-z0-9-]+\b/g },
];

function countViolations(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let count = 0;
  lines.forEach((line) => {
    if (line.includes('design-rule-ignore:')) return;
    for (const rule of FORBIDDEN_RULES) {
      rule.regex.lastIndex = 0;
      if (rule.regex.test(line)) {
        count++;
      }
    }
  });
  return count;
}

const heroCarouselViolations = countViolations(heroCarouselPath);
assert(
  heroCarouselViolations === 0,
  `HeroBannerCarousel.tsx has 0 Quiet Court design violations (got ${heroCarouselViolations})`
);

const pageViolations = countViolations(pagePath);
assert(
  pageViolations === 0,
  `frontend/src/app/(storefront)/page.tsx has 0 Quiet Court design violations (got ${pageViolations})`
);

// ---------------------------------------------------------------------------
// TEST GROUP 4: TypeScript Compiler Validation
// ---------------------------------------------------------------------------
console.log('\n[TEST GROUP 4] TypeScript Compilation Check');

try {
  const frontendDir = path.resolve(__dirname, '../../frontend');
  execSync('node node_modules/typescript/bin/tsc --noEmit', {
    cwd: frontendDir,
    stdio: 'pipe',
  });
  assert(true, 'frontend tsc --noEmit compiled with 0 errors');
} catch (err) {
  console.error(err.stdout ? err.stdout.toString() : err.message);
  assert(false, 'frontend tsc --noEmit compilation failed');
}

// ---------------------------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------------------------
console.log('\n========================================================================');
console.log(` RESULTS: ${passed}/${total} CHECKS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
console.log('========================================================================\n');

if (passed !== total) {
  process.exit(1);
}
