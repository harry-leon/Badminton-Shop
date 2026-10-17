import { NextRequest, NextResponse } from 'next/server';
import { queryDb, withTransaction } from '@/lib/db';
import { resolveActorRole, checkPermission, invalidateRolePermissionCache, normalizePermissionCode } from '@/lib/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await resolveActorRole(request);
    if (!actor) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const { id } = await params;
    const rows = await queryDb<{ permission_id: string }>(
      'identity_db',
      `SELECT permission_id FROM role_permissions WHERE role_id = $1 ORDER BY permission_id ASC`,
      [id]
    );

    return NextResponse.json({
      roleId: id,
      permissions: rows.map((r) => r.permission_id),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi tra cứu quyền' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await resolveActorRole(request);
    if (!actor) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const canManage = await checkPermission(actor.role, 'roles:manage');
    if (!canManage && actor.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Quản trị viên có quyền roles:manage mới được sửa đổi quyền vai trò.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    const existingRows = await queryDb<any>('identity_db', 'SELECT id FROM roles WHERE id = $1', [id]);
    if (existingRows.length === 0) {
      return NextResponse.json({ error: `Không tìm thấy vai trò ${id}` }, { status: 404 });
    }

    await withTransaction('identity_db', async (client) => {
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
      for (const p of permissions) {
        const normCode = normalizePermissionCode(p);
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [id, normCode]
        );
      }
      await client.query('UPDATE roles SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
    });

    // Invalidate cache ngay lập tức để quyền có hiệu lực trong mili-giây
    invalidateRolePermissionCache(id);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật phân quyền cho vai trò ${id} thành công`,
      roleId: id,
      permissions: permissions.map(normalizePermissionCode),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi cập nhật phân quyền' }, { status: 500 });
  }
}
