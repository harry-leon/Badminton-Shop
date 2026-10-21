/**
 * Utility to generate category-aware detail URLs for products.
 * Prevents 404 routing when products are clicked across storefront, cards, or search.
 */

export interface ProductUrlInput {
  slug: string;
  category?: string | { slug?: string; id?: string; name?: string };
  category_id?: string;
  categoryId?: string;
}

export function getProductDetailUrl(product: ProductUrlInput | string | null | undefined): string {
  if (!product) return '/vot-cau-long';
  const slug = typeof product === 'string' ? product : product.slug;
  if (!slug) return '/vot-cau-long';
  if (slug.startsWith('/')) return slug;

  let cat = '';
  if (typeof product !== 'string') {
    if (typeof product.category === 'object' && product.category !== null) {
      cat = product.category.slug || product.category.id || product.category.name || '';
    } else {
      cat = product.category || product.category_id || product.categoryId || '';
    }
  }

  const normalizedCat = cat.toLowerCase().trim();
  const lowerSlug = slug.toLowerCase().trim();

  // 1. Check explicit category id / slug / keyword
  if (
    normalizedCat === 'cat_shoes' ||
    normalizedCat === 'giay-cau-long' ||
    normalizedCat === 'shoes' ||
    normalizedCat.includes('giay') ||
    normalizedCat.includes('giày')
  ) {
    return `/giay-cau-long/${slug}`;
  }
  if (
    normalizedCat === 'cat_apparel' ||
    normalizedCat === 'quan-ao' ||
    normalizedCat === 'ao' ||
    normalizedCat === 'quan' ||
    normalizedCat === 'apparel' ||
    normalizedCat.includes('quần') ||
    normalizedCat.includes('áo') ||
    normalizedCat.includes('váy')
  ) {
    return `/quan-ao/${slug}`;
  }
  if (
    normalizedCat === 'cat_string' ||
    normalizedCat === 'day-cuoc' ||
    normalizedCat === 'string' ||
    normalizedCat === 'strings' ||
    normalizedCat.includes('cuoc') ||
    normalizedCat.includes('cước')
  ) {
    return `/day-cuoc/${slug}`;
  }
  if (
    normalizedCat === 'cat_accessories' ||
    normalizedCat === 'cat_accessory' ||
    normalizedCat === 'phu-kien' ||
    normalizedCat === 'accessories' ||
    normalizedCat.includes('phụ kiện')
  ) {
    return `/phu-kien/${slug}`;
  }
  if (
    normalizedCat === 'cat_shuttle' ||
    normalizedCat === 'qua-cau-long' ||
    normalizedCat === 'shuttle' ||
    normalizedCat.includes('quả cầu') ||
    normalizedCat.includes('ống cầu')
  ) {
    return `/qua-cau-long/${slug}`;
  }
  if (
    normalizedCat === 'cat_bag' ||
    normalizedCat === 'tui-bao-vot' ||
    normalizedCat === 'bag' ||
    normalizedCat.includes('túi') ||
    normalizedCat.includes('balo')
  ) {
    return `/tui-bao-vot/${slug}`;
  }
  if (
    normalizedCat === 'cat_grip' ||
    normalizedCat === 'quan-can' ||
    normalizedCat === 'grip' ||
    normalizedCat.includes('quấn cán') ||
    normalizedCat.includes('cuốn cán')
  ) {
    return `/quan-can/${slug}`;
  }
  if (
    normalizedCat === 'cat_net' ||
    normalizedCat === 'luoi-cau-long' ||
    normalizedCat === 'net' ||
    normalizedCat.includes('lưới')
  ) {
    return `/luoi-cau-long/${slug}`;
  }
  if (
    normalizedCat === 'cat_secondhand' ||
    normalizedCat === 'second-hand' ||
    normalizedCat.includes('vợt cũ') ||
    normalizedCat.includes('kiểm định')
  ) {
    return `/second-hand/${slug}`;
  }
  if (
    normalizedCat === 'cat_racket' ||
    normalizedCat === 'vot-cau-long' ||
    normalizedCat === 'racket' ||
    normalizedCat.includes('vợt')
  ) {
    return `/vot-cau-long/${slug}`;
  }

  // 2. Fallback: Infer from slug prefixes
  if (lowerSlug.startsWith('giay-')) return `/giay-cau-long/${slug}`;
  if (
    lowerSlug.startsWith('ao-') ||
    lowerSlug.startsWith('quan-ao-') ||
    lowerSlug.startsWith('quan-cau-long-') ||
    lowerSlug.startsWith('quan-') ||
    lowerSlug.startsWith('vay-')
  ) {
    return `/quan-ao/${slug}`;
  }
  if (lowerSlug.startsWith('day-cuoc-') || lowerSlug.startsWith('cuoc-')) {
    return `/day-cuoc/${slug}`;
  }
  if (
    lowerSlug.startsWith('qua-cau-') ||
    lowerSlug.startsWith('trai-cau-') ||
    lowerSlug.startsWith('ong-cau-') ||
    lowerSlug.startsWith('hop-cau-')
  ) {
    return `/qua-cau-long/${slug}`;
  }
  if (
    lowerSlug.startsWith('tui-') ||
    lowerSlug.startsWith('bao-vot-') ||
    lowerSlug.startsWith('balo-')
  ) {
    return `/tui-bao-vot/${slug}`;
  }
  if (lowerSlug.startsWith('quan-can-') || lowerSlug.startsWith('cuon-can-')) {
    return `/quan-can/${slug}`;
  }
  if (lowerSlug.startsWith('luoi-')) return `/luoi-cau-long/${slug}`;
  if (
    lowerSlug.startsWith('phu-kien-') ||
    lowerSlug.startsWith('binh-nuoc-') ||
    lowerSlug.startsWith('keo-') ||
    lowerSlug.startsWith('bang-co-')
  ) {
    return `/phu-kien/${slug}`;
  }
  if (
    lowerSlug.startsWith('sh-') ||
    lowerSlug.startsWith('sh_') ||
    lowerSlug.startsWith('vot-cu-')
  ) {
    return `/second-hand/${slug}`;
  }

  // Default route is racket
  return `/vot-cau-long/${slug}`;
}
