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

    const canView = await checkPermission(actor.role, 'roles:view');
    const canManage = await checkPermission(actor.role, 'roles:manage');
    if (!canView && !canManage && actor.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền xem chi tiết vai trò.' }, { status: 403 });
    }

    const { id } = await params;
    const roleRows = await queryDb<any>(
      'identity_db',
      `SELECT r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at,
              COALESCE(json_agg(rp.permission_id) FILTER (WHERE rp.permission_id IS NOT NULL), '[]') as permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       WHERE r.id = $1
       GROUP BY r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at`,
      [id]
    );

    if (roleRows.length === 0) {
      return NextResponse.json({ error: `Không tìm thấy vai trò ${id}` }, { status: 404 });
    }

    return NextResponse.json({ role: roleRows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi tra cứu vai trò' }, { status: 500 });
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
      return NextResponse.json({ error: 'Chỉ Quản trị viên có quyền roles:manage mới được sửa đổi vai trò.' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { name, description, permissions } = body;

    const existingRows = await queryDb<any>('identity_db', 'SELECT * FROM roles WHERE id = $1', [id]);
    if (existingRows.length === 0) {
      return NextResponse.json({ error: `Không tìm thấy vai trò ${id}` }, { status: 404 });
    }

    await withTransaction('identity_db', async (client) => {
      // Cập nhật thông tin cơ bản nếu có truyền
      if (name !== undefined || description !== undefined) {
        await client.query(
          `UPDATE roles 
           SET name = COALESCE($1, name),
               description = COALESCE($2, description),
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [name ? name.trim() : null, description !== undefined ? description : null, id]
        );
      }

      // Cập nhật danh sách permissions nếu có truyền mảng
      if (Array.isArray(permissions)) {
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [id]);
        for (const p of permissions) {
          const normCode = normalizePermissionCode(p);
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [id, normCode]
          );
        }
        await client.query('UPDATE roles SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [id]);
      }
    });

    // Vô hiệu hóa cache ngay lập tức để áp dụng quyền mới
    invalidateRolePermissionCache(id);

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật thành công vai trò ${id}`,
      roleId: id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi cập nhật vai trò' }, { status: 500 });
  }
}

export async function DELETE(
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
      return NextResponse.json({ error: 'Chỉ Quản trị viên có quyền roles:manage mới được xóa vai trò.' }, { status: 403 });
    }

    const { id } = await params;
    const roleRows = await queryDb<any>('identity_db', 'SELECT id, is_system FROM roles WHERE id = $1', [id]);
    if (roleRows.length === 0) {
      return NextResponse.json({ error: `Không tìm thấy vai trò ${id}` }, { status: 404 });
    }

    if (roleRows[0].is_system) {
      return NextResponse.json(
        { error: `Không thể xóa vai trò hệ thống cốt lõi (${id})!` },
        { status: 400 }
      );
    }

    // Kiểm tra xem có người dùng nào đang giữ role này không
    const userCount = await queryDb<any>('identity_db', 'SELECT count(*) FROM users WHERE role = $1', [id]);
    if (parseInt(userCount[0].count, 10) > 0) {
      return NextResponse.json(
        { error: `Không thể xóa vai trò ${id} vì đang có ${userCount[0].count} tài khoản người dùng được gán vai trò này.` },
        { status: 400 }
      );
    }

    await queryDb('identity_db', 'DELETE FROM roles WHERE id = $1', [id]);
    invalidateRolePermissionCache(id);

    return NextResponse.json({
      success: true,
      message: `Đã xóa thành công vai trò tùy biến ${id}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi xóa vai trò' }, { status: 500 });
  }
}
