import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export async function GET() {
  try {
    const categories = await queryDb(
      'catalog_db',
      `SELECT id, name, slug, description, image_url, tag_subtitle, sort_order, is_featured
       FROM categories
       ORDER BY sort_order ASC, name ASC`
    );
    return NextResponse.json({ success: true, categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi tải danh mục' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = verifySessionToken(token);
  const isAllowed =
    user &&
    (user.role === 'ADMIN' ||
      user.role === 'BRANCH_MANAGER' ||
      (await checkPermission(user.role, 'catalog:manage')));

  if (!user || !isAllowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, category, categoryId } = body;

    // 1. UPDATE CATEGORY SHOWCASE
    if (action === 'UPDATE' && category) {
      await queryDb(
        'catalog_db',
        `UPDATE categories SET
           name = $1,
           slug = $2,
           description = $3,
           image_url = $4,
           tag_subtitle = $5,
           sort_order = $6,
           is_featured = $7
         WHERE id = $8`,
        [
          category.name,
          category.slug,
          category.description || '',
          category.image_url || '',
          category.tag_subtitle || '',
          Number(category.sort_order || 0),
          Boolean(category.is_featured),
          category.id,
        ]
      );

      const categories = await queryDb(
        'catalog_db',
        `SELECT id, name, slug, description, image_url, tag_subtitle, sort_order, is_featured
         FROM categories
         ORDER BY sort_order ASC, name ASC`
      );
      return NextResponse.json({ success: true, categories });
    }

    // 2. TOGGLE FEATURED
    if (action === 'TOGGLE_FEATURED' && categoryId) {
      await queryDb(
        'catalog_db',
        `UPDATE categories SET is_featured = NOT is_featured WHERE id = $1`,
        [categoryId]
      );
      const categories = await queryDb(
        'catalog_db',
        `SELECT id, name, slug, description, image_url, tag_subtitle, sort_order, is_featured
         FROM categories
         ORDER BY sort_order ASC, name ASC`
      );
      return NextResponse.json({ success: true, categories });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý danh mục' }, { status: 500 });
  }
}
