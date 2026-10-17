import { NextRequest, NextResponse } from 'next/server';
import { queryDb, withTransaction } from '@/lib/db';
import { resolveActorRole, checkPermission, invalidateRolePermissionCache, normalizePermissionCode } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const actor = await resolveActorRole(request);
    if (!actor) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const canView = await checkPermission(actor.role, 'roles:view');
    const canManage = await checkPermission(actor.role, 'roles:manage');
    if (!canView && !canManage && actor.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền xem ma trận phân quyền hệ thống (roles:view).' }, { status: 403 });
    }

    const roles = await queryDb<any>(
      'identity_db',
      `SELECT r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at,
              COALESCE(json_agg(rp.permission_id) FILTER (WHERE rp.permission_id IS NOT NULL), '[]') as permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       GROUP BY r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at
       ORDER BY r.id ASC`
    );

    const permissions = await queryDb<any>(
      'identity_db',
      `SELECT id, code, module, category, name, description FROM permissions ORDER BY module ASC, id ASC`
    );

    return NextResponse.json({ roles, permissions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi tải danh sách phân quyền' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await resolveActorRole(request);
    if (!actor) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const canManage = await checkPermission(actor.role, 'roles:manage');
    if (!canManage && actor.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Quản trị viên có quyền roles:manage mới được tạo hoặc sửa đổi vai trò.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action;
    const targetRoleId = (body.roleId || body.id || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const name = (body.name || '').trim();
    const description = (body.description || '').trim();
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    // Hỗ trợ Action: UPDATE_PERMISSIONS (hoặc khi chỉ cập nhật quyền)
    if (action === 'UPDATE_PERMISSIONS') {
      if (!targetRoleId) {
        return NextResponse.json({ error: 'Thiếu mã vai trò (roleId)' }, { status: 400 });
      }

      await withTransaction('identity_db', async (client) => {
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [targetRoleId]);
        for (const p of permissions) {
          const normCode = normalizePermissionCode(p);
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [targetRoleId, normCode]
          );
        }
        await client.query('UPDATE roles SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [targetRoleId]);
      });

      invalidateRolePermissionCache(targetRoleId);
      return NextResponse.json({
        success: true,
        message: `Đã lưu cập nhật quyền cho vai trò ${targetRoleId}`,
        roleId: targetRoleId,
        permissions: permissions.map(normalizePermissionCode),
      });
    }

    // Mặc định hoặc action === 'CREATE_ROLE': Tạo vai trò mới
    if (!targetRoleId || !name) {
      return NextResponse.json({ error: 'Mã vai trò và tên vai trò không được để trống' }, { status: 400 });
    }

    await withTransaction('identity_db', async (client) => {
      await client.query(
        `INSERT INTO roles (id, name, description, is_system, created_at, updated_at) 
         VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP`,
        [targetRoleId, name, description]
      );

      if (permissions.length > 0) {
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [targetRoleId]);
        for (const p of permissions) {
          const normCode = normalizePermissionCode(p);
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [targetRoleId, normCode]
          );
        }
      }
    });

    invalidateRolePermissionCache(targetRoleId);

    return NextResponse.json({
      success: true,
      message: `Đã tạo thành công vai trò ${targetRoleId}`,
      role: {
        id: targetRoleId,
        name,
        description,
        is_system: false,
        permissions: permissions.map(normalizePermissionCode),
      },
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý vai trò' }, { status: 500 });
  }
}
