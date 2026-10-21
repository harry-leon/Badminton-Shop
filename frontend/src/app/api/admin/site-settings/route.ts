import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';
import { logAudit } from '@/lib/logger';

export async function GET() {
  try {
    const settings = await queryDb(
      'catalog_db',
      `SELECT key, value, group_name, description, updated_at, updated_by
       FROM site_settings
       ORDER BY group_name ASC, key ASC`
    );
    let finalSettings = settings;
    if (!finalSettings || finalSettings.length === 0) {
      finalSettings = [
        { key: 'hotline', value: '1900 6868', group_name: 'GENERAL' },
        { key: 'support_email', value: 'support@smashcourt.vn', group_name: 'GENERAL' },
        { key: 'brand_statement', value: 'Smash Court — Hệ thống vợt & phụ kiện cầu lông chính hãng hàng đầu Việt Nam', group_name: 'STOREFRONT' },
        { key: 'nav_items_config', value: JSON.stringify([
          { id: 'nav-1', href: '/vot-cau-long', label: 'VỢT CẦU LÔNG', badge_text: 'HOT', badge_type: 'badge' },
          { id: 'nav-2', href: '/second-hand', label: 'VỢT CŨ KIỂM ĐỊNH', badge_text: '16 TIÊU CHÍ', badge_type: 'pill' },
          { id: 'nav-3', href: '/giay-cau-long', label: 'GIÀY CẦU LÔNG', badge_text: 'SALE', badge_type: 'badge' },
          { id: 'nav-4', href: '/chi-nhanh', label: 'HỆ THỐNG CỬA HÀNG', badge_text: '', badge_type: 'badge' },
        ]), group_name: 'STOREFRONT' },
      ];
    }
    return NextResponse.json({ success: true, settings: finalSettings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi tải cài đặt trang' }, { status: 500 });
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
    const { settings } = body; // Array of { key: string, value: string } or object

    const updatedKeys: string[] = [];

    if (Array.isArray(settings)) {
      for (const item of settings) {
        if (item.key && item.value !== undefined) {
          await queryDb(
            'catalog_db',
            `INSERT INTO site_settings (key, value, group_name, description, updated_at, updated_by)
             VALUES ($1, $2, 'GENERAL', '', CURRENT_TIMESTAMP, $3)
             ON CONFLICT (key) DO UPDATE SET
               value = EXCLUDED.value,
               updated_at = CURRENT_TIMESTAMP,
               updated_by = EXCLUDED.updated_by`,
            [item.key, item.value, user.email]
          );
          updatedKeys.push(item.key);
        }
      }
    } else if (typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        await queryDb(
          'catalog_db',
          `UPDATE site_settings SET value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE key = $3`,
          [String(value), user.email, key]
        );
        updatedKeys.push(key);
      }
    }

    await logAudit({
      level: 'INFO',
      module: 'SETTINGS',
      action: 'SITE_SETTINGS_UPDATE',
      message: `Cập nhật cấu hình giao diện hệ thống: ${updatedKeys.join(', ')}`,
      actorId: user.id,
      actorName: user.username || user.email,
      actorRole: user.role,
      details: { keys: updatedKeys },
    });

    const updated = await queryDb('catalog_db', `SELECT * FROM site_settings ORDER BY group_name ASC, key ASC`);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi lưu cài đặt' }, { status: 500 });
  }
}
