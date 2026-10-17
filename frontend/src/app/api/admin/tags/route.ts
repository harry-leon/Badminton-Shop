import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

export async function GET() {
  try {
    const tags = await queryDb(
      'catalog_db',
      `SELECT id, code, name, bg_color, text_color, icon_name, is_active, sort_order
       FROM product_tags
       ORDER BY sort_order ASC, name ASC`
    );
    return NextResponse.json({ success: true, tags });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi tải danh sách tag' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = verifySessionToken(token);
  if (!user || (user.role !== 'ADMIN' && !(await checkPermission(user.role, 'catalog:manage')))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { action, tag, tagId } = body;

    // 1. CREATE TAG
    if (action === 'CREATE' && tag) {
      const id = tag.id || `tag_${Date.now()}`;
      const code = (tag.code || tag.name || '').toUpperCase().trim();
      await queryDb(
        'catalog_db',
        `INSERT INTO product_tags (id, code, name, bg_color, text_color, icon_name, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          code,
          tag.name || 'Tag mới',
          tag.bg_color || '#DC2626',
          tag.text_color || '#FFFFFF',
          tag.icon_name || 'Tag',
          tag.is_active !== undefined ? Boolean(tag.is_active) : true,
          Number(tag.sort_order || 0),
        ]
      );

      const tags = await queryDb('catalog_db', `SELECT * FROM product_tags ORDER BY sort_order ASC, name ASC`);
      return NextResponse.json({ success: true, tags });
    }

    // 2. UPDATE TAG
    if (action === 'UPDATE' && tag) {
      await queryDb(
        'catalog_db',
        `UPDATE product_tags SET
           code = $1,
           name = $2,
           bg_color = $3,
           text_color = $4,
           icon_name = $5,
           is_active = $6,
           sort_order = $7
         WHERE id = $8`,
        [
          (tag.code || '').toUpperCase().trim(),
          tag.name,
          tag.bg_color || '#DC2626',
          tag.text_color || '#FFFFFF',
          tag.icon_name || 'Tag',
          Boolean(tag.is_active),
          Number(tag.sort_order || 0),
          tag.id,
        ]
      );

      const tags = await queryDb('catalog_db', `SELECT * FROM product_tags ORDER BY sort_order ASC, name ASC`);
      return NextResponse.json({ success: true, tags });
    }

    // 3. TOGGLE ACTIVE
    if (action === 'TOGGLE_ACTIVE' && tagId) {
      await queryDb(
        'catalog_db',
        `UPDATE product_tags SET is_active = NOT is_active WHERE id = $1`,
        [tagId]
      );
      const tags = await queryDb('catalog_db', `SELECT * FROM product_tags ORDER BY sort_order ASC, name ASC`);
      return NextResponse.json({ success: true, tags });
    }

    // 4. DELETE TAG
    if (action === 'DELETE' && tagId) {
      await queryDb('catalog_db', `DELETE FROM product_tags WHERE id = $1`, [tagId]);
      const tags = await queryDb('catalog_db', `SELECT * FROM product_tags ORDER BY sort_order ASC, name ASC`);
      return NextResponse.json({ success: true, tags });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi thao tác tag' }, { status: 500 });
  }
}
