import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { logAudit } from '@/lib/logger';

/**
 * GET /api/admin/users
 * Lấy danh sách nhân sự và khách hàng (chỉ ADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Tổng Quản trị viên (ADMIN) mới có quyền truy cập danh sách nhân sự.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const roleFilter = searchParams.get('role');
    const branchFilter = searchParams.get('branch_id');

    let query = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, u.branch_id, 
             u.is_active, u.created_at, u.updated_at,
             b.name as branch_name, b.city as branch_city,
             r.name as role_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      LEFT JOIN roles r ON u.role = r.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (roleFilter && roleFilter !== 'ALL') {
      params.push(roleFilter);
      query += ` AND u.role = $${params.length}`;
    }

    if (branchFilter && branchFilter !== 'ALL') {
      params.push(branchFilter);
      query += ` AND u.branch_id = $${params.length}`;
    }

    query += ` ORDER BY u.created_at DESC`;

    const users = await queryDb('identity_db', query, params);
    const roles = await queryDb('identity_db', `SELECT id, name, description FROM roles ORDER BY id ASC`);
    const branches = await queryDb('identity_db', `SELECT id, name, city FROM branches ORDER BY id ASC`);

    return NextResponse.json({
      success: true,
      users,
      roles,
      branches,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi tải danh sách người dùng' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Thao tác CRUD nhân sự & phân bổ chi nhánh (chỉ ADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ ADMIN mới có quyền thực hiện thao tác này.' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // 1. TẠO TÀI KHOẢN MỚI
    if (action === 'CREATE_USER') {
      const { username, email, full_name, phone, role, branch_id, password } = body;

      if (!username || !email || !full_name || !role) {
        return NextResponse.json({ error: 'Vui lòng điền đầy đủ username, email, họ tên và vai trò.' }, { status: 400 });
      }

      // Kiểm tra trùng lặp
      const existing = await queryDb(
        'identity_db',
        `SELECT id FROM users WHERE username = $1 OR email = $2`,
        [username.trim(), email.trim()]
      );
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Username hoặc email đã tồn tại trong hệ thống.' }, { status: 400 });
      }

      const rawPassword = password || 'smash2026';
      const passwordHash = await bcrypt.hash(rawPassword, 10);

      const inserted = await queryDb(
        'identity_db',
        `INSERT INTO users (username, email, password_hash, full_name, phone, role, branch_id, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING id, username, email, full_name, role`,
        [
          username.trim().toLowerCase(),
          email.trim().toLowerCase(),
          passwordHash,
          full_name.trim(),
          phone || null,
          role,
          branch_id && branch_id !== 'ALL' ? branch_id : null,
        ]
      );

      // Nếu có chi nhánh, ghi vào staff_branch_assignments
      if (branch_id && branch_id !== 'ALL') {
        await queryDb(
          'identity_db',
          `INSERT INTO staff_branch_assignments (user_id, branch_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, branch_id) DO NOTHING`,
          [inserted[0].id, branch_id]
        );
      }

      await logAudit({
        level: 'INFO',
        module: 'USERS',
        action: 'USER_CREATE',
        message: `Tạo tài khoản người dùng mới: "${username}" (Vai trò: ${role})`,
        actorId: user.id,
        actorName: user.username || user.email,
        actorRole: user.role,
        details: { username, email, role, branch_id },
      });

      return NextResponse.json({
        success: true,
        message: `Đã tạo tài khoản "${username}" thành công với mật khẩu mặc định: ${rawPassword}`,
        user: inserted[0],
      });
    }

    // 2. CẬP NHẬT THÔNG TIN NHÂN SỰ
    if (action === 'UPDATE_USER') {
      const { user_id, full_name, phone, role, branch_id } = body;
      if (!user_id || !full_name || !role) {
        return NextResponse.json({ error: 'Thiếu thông tin bắt buộc để cập nhật.' }, { status: 400 });
      }

      await queryDb(
        'identity_db',
        `UPDATE users SET
           full_name = $1,
           phone = $2,
           role = $3,
           branch_id = $4,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [
          full_name.trim(),
          phone || null,
          role,
          branch_id && branch_id !== 'ALL' ? branch_id : null,
          user_id,
        ]
      );

      // Cập nhật assignment
      if (branch_id && branch_id !== 'ALL') {
        await queryDb('identity_db', `DELETE FROM staff_branch_assignments WHERE user_id = $1`, [user_id]);
        await queryDb(
          'identity_db',
          `INSERT INTO staff_branch_assignments (user_id, branch_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [user_id, branch_id]
        );
      }

      await logAudit({
        level: 'INFO',
        module: 'USERS',
        action: 'USER_UPDATE',
        message: `Cập nhật thông tin nhân viên: "${full_name}" (Vai trò: ${role})`,
        actorId: user.id,
        actorName: user.username || user.email,
        actorRole: user.role,
        details: { user_id, full_name, role, branch_id },
      });

      return NextResponse.json({
        success: true,
        message: 'Cập nhật thông tin nhân viên thành công!',
      });
    }

    // 3. BẬT / TẮT HOẠT ĐỘNG (TOGGLE ACTIVE)
    if (action === 'TOGGLE_ACTIVE') {
      const { user_id, is_active } = body;
      if (!user_id || is_active === undefined) {
        return NextResponse.json({ error: 'Thiếu user_id hoặc trạng thái.' }, { status: 400 });
      }

      await queryDb(
        'identity_db',
        `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [Boolean(is_active), user_id]
      );

      await logAudit({
        level: is_active ? 'INFO' : 'WARN',
        module: 'USERS',
        action: 'USER_TOGGLE_ACTIVE',
        message: `${is_active ? 'Kích hoạt' : 'Vô hiệu hóa khóa'} tài khoản người dùng ID: ${user_id}`,
        actorId: user.id,
        actorName: user.username || user.email,
        actorRole: user.role,
        details: { user_id, is_active: Boolean(is_active) },
      });

      return NextResponse.json({
        success: true,
        message: `Đã ${is_active ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản thành công.`,
      });
    }

    // 4. RESET MẬT KHẨU
    if (action === 'RESET_PASSWORD') {
      const { user_id, new_password } = body;
      if (!user_id) {
        return NextResponse.json({ error: 'Thiếu user_id.' }, { status: 400 });
      }

      const pwd = new_password || 'smash2026';
      const hash = await bcrypt.hash(pwd, 10);

      await queryDb(
        'identity_db',
        `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [hash, user_id]
      );

      await logAudit({
        level: 'WARN',
        module: 'USERS',
        action: 'USER_RESET_PASSWORD',
        message: `Đặt lại mật khẩu cho người dùng ID: ${user_id}`,
        actorId: user.id,
        actorName: user.username || user.email,
        actorRole: user.role,
        details: { user_id },
      });

      return NextResponse.json({
        success: true,
        message: `Mật khẩu đã được đặt lại thành: ${pwd}`,
      });
    }

    // 5. XÓA TÀI KHOẢN (Chỉ xóa nếu không phải là user hiện tại)
    if (action === 'DELETE_USER') {
      const { user_id } = body;
      if (!user_id) {
        return NextResponse.json({ error: 'Thiếu user_id.' }, { status: 400 });
      }

      if (user.id === user_id) {
        return NextResponse.json({ error: 'Bạn không thể tự xóa tài khoản của chính mình.' }, { status: 400 });
      }

      await queryDb('identity_db', `DELETE FROM users WHERE id = $1`, [user_id]);

      await logAudit({
        level: 'WARN',
        module: 'USERS',
        action: 'USER_DELETE',
        message: `Xóa vĩnh viễn tài khoản người dùng ID: ${user_id}`,
        actorId: user.id,
        actorName: user.username || user.email,
        actorRole: user.role,
        details: { user_id },
      });

      return NextResponse.json({
        success: true,
        message: 'Đã xóa tài khoản thành công.',
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý quản trị người dùng' }, { status: 500 });
  }
}
