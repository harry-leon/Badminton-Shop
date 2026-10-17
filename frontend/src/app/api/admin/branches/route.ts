import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/admin/branches
 * Lấy danh sách chi nhánh kèm số lượng nhân viên và thống kê sơ bộ
 */
export async function GET(request: NextRequest) {
  try {
    const branches = await queryDb(
      'identity_db',
      `SELECT b.id, b.name, b.city, b.address, b.created_at,
              COUNT(u.id) as staff_count
       FROM branches b
       LEFT JOIN users u ON u.branch_id = b.id AND u.is_active = true
       GROUP BY b.id, b.name, b.city, b.address, b.created_at
       ORDER BY b.id ASC`
    );

    return NextResponse.json({
      success: true,
      branches,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi tải danh sách chi nhánh' }, { status: 500 });
  }
}

/**
 * POST /api/admin/branches
 * Thao tác CRUD chi nhánh (chỉ ADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Tổng Quản trị viên (ADMIN) mới có quyền quản lý hệ thống chi nhánh.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // 1. TẠO CHI NHÁNH MỚI
    if (action === 'CREATE_BRANCH') {
      const { id, name, city, address } = body;
      if (!id || !name || !city || !address) {
        return NextResponse.json({ error: 'Vui lòng nhập đầy đủ mã, tên, thành phố và địa chỉ chi nhánh.' }, { status: 400 });
      }

      const cleanId = id.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');

      const existing = await queryDb('identity_db', `SELECT id FROM branches WHERE id = $1`, [cleanId]);
      if (existing.length > 0) {
        return NextResponse.json({ error: `Mã chi nhánh ${cleanId} đã tồn tại.` }, { status: 400 });
      }

      await queryDb(
        'identity_db',
        `INSERT INTO branches (id, name, city, address) VALUES ($1, $2, $3, $4)`,
        [cleanId, name.trim(), city.trim(), address.trim()]
      );

      return NextResponse.json({
        success: true,
        message: `Đã khởi tạo chi nhánh "${name}" (${cleanId}) thành công!`,
      });
    }

    // 2. CẬP NHẬT CHI NHÁNH
    if (action === 'UPDATE_BRANCH') {
      const { branch_id, name, city, address } = body;
      if (!branch_id || !name || !city || !address) {
        return NextResponse.json({ error: 'Thiếu thông tin bắt buộc để cập nhật.' }, { status: 400 });
      }

      await queryDb(
        'identity_db',
        `UPDATE branches SET name = $1, city = $2, address = $3 WHERE id = $4`,
        [name.trim(), city.trim(), address.trim(), branch_id]
      );

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật thông tin chi nhánh ${branch_id} thành công!`,
      });
    }

    // 3. XÓA CHI NHÁNH (Nếu không có nhân sự phụ thuộc)
    if (action === 'DELETE_BRANCH') {
      const { branch_id } = body;
      if (!branch_id) {
        return NextResponse.json({ error: 'Thiếu mã chi nhánh cần xóa.' }, { status: 400 });
      }

      if (branch_id === 'ALL') {
        return NextResponse.json({ error: 'Không thể xóa chi nhánh mặc định "Toàn quốc" (ALL).' }, { status: 400 });
      }

      const staffCount = await queryDb(
        'identity_db',
        `SELECT COUNT(id) as count FROM users WHERE branch_id = $1`,
        [branch_id]
      );
      if (staffCount.length > 0 && Number(staffCount[0].count) > 0) {
        return NextResponse.json(
          { error: `Không thể xóa chi nhánh vì vẫn còn ${staffCount[0].count} nhân sự trực thuộc. Hãy điều chuyển nhân sự trước.` },
          { status: 400 }
        );
      }

      await queryDb('identity_db', `DELETE FROM branches WHERE id = $1`, [branch_id]);

      return NextResponse.json({
        success: true,
        message: `Đã xóa chi nhánh ${branch_id} thành công.`,
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý quản trị chi nhánh' }, { status: 500 });
  }
}
