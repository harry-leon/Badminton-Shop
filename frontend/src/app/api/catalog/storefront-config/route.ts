import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export const revalidate = 0; // Always fresh from PostgreSQL

export async function GET() {
  try {
    // 1. Site Settings
    const settingsRows = await queryDb<any>(
      'catalog_db',
      `SELECT key, value, group_name FROM site_settings`
    );
    const settingsMap: Record<string, string> = {};
    for (const s of settingsRows) {
      settingsMap[s.key] = s.value;
    }

    // 2. Banners by position
    const bannerRows = await queryDb<any>(
      'catalog_db',
      `SELECT id, position, title, badge, description, primary_cta_text, primary_cta_link,
              secondary_cta_text, secondary_cta_link, image_url, product_tag, product_sub,
              product_price, features, sort_order, is_active
       FROM banners
       WHERE is_active = true
       ORDER BY sort_order ASC, created_at DESC`
    );

    const heroBanners = bannerRows.filter(
      (b) => b.position === 'HERO_SLIDER' || b.position === 'HOME_MAIN'
    );
    const promoBanners = bannerRows.filter((b) => b.position === 'HOME_PROMO_3');
    const uspBadges = bannerRows.filter((b) => b.position === 'USP_BAR');
    const athletes = bannerRows.filter((b) => b.position === 'ATHLETES');

    // 3. Featured Categories
    const categories = await queryDb<any>(
      'catalog_db',
      `SELECT id, name, slug, description, image_url, tag_subtitle, sort_order
       FROM categories
       WHERE is_featured = true
       ORDER BY sort_order ASC, name ASC`
    );

    // 4. Product Tags
    const tags = await queryDb<any>(
      'catalog_db',
      `SELECT id, code, name, bg_color, text_color, icon_name
       FROM product_tags
       WHERE is_active = true
       ORDER BY sort_order ASC, name ASC`
    );
    const tagsMap: Record<string, any> = {};
    for (const t of tags) {
      tagsMap[t.code] = t;
    }

    // 5. Navigation Items & Tags Configuration
    let navItems: any[] = [];
    if (settingsMap['nav_items_config']) {
      try {
        navItems = JSON.parse(settingsMap['nav_items_config']);
      } catch (e) {
        navItems = [];
      }
    }

    return NextResponse.json({
      success: true,
      settings: settingsMap,
      navItems,
      heroBanners,
      promoBanners,
      uspBadges,
      athletes,
      categories,
      tags,
      tagsMap,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi tải storefront config' }, { status: 500 });
  }
}
