import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/admin/recruitment
 * Lấy danh sách tin tuyển dụng và danh sách hồ sơ ứng tuyển theo phân quyền chi nhánh.
 * - ADMIN: xem toàn bộ hoặc lọc theo branch_id bất kỳ.
 * - BRANCH_MANAGER: chỉ được xem dữ liệu của chi nhánh mình phụ trách (user.branch_id).
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;

    if (!user || user.role === 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập tài khoản quản trị nội bộ.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const requestedBranch = searchParams.get('branch_id');

    // Scoping check
    let activeBranchId: string | null = null;
    if (user.role === 'ADMIN') {
      activeBranchId = requestedBranch && requestedBranch !== 'ALL' ? requestedBranch : null;
    } else {
      activeBranchId = user.branch_id || 'BR_HN_01';
      // Ngăn chặn Manager xem chi nhánh khác
      if (requestedBranch && requestedBranch !== 'ALL' && requestedBranch !== activeBranchId) {
        return NextResponse.json(
          { error: `Bạn là Quản lý chi nhánh ${activeBranchId}, không có quyền xem dữ liệu của chi nhánh ${requestedBranch}.` },
          { status: 403 }
        );
      }
    }

    // 1. Lấy danh sách tin tuyển dụng kèm số hồ sơ đã nộp
    let jobsQuery = `
      SELECT j.*,
             b.name as branch_name, b.city as branch_city,
             COUNT(a.id) as applications_count
      FROM job_postings j
      LEFT JOIN branches b ON j.branch_id = b.id
      LEFT JOIN job_applications a ON a.job_id = j.id
      WHERE 1=1
    `;
    const jobsParams: any[] = [];
    if (activeBranchId) {
      jobsParams.push(activeBranchId);
      jobsQuery += ` AND j.branch_id = $${jobsParams.length}`;
    }
    jobsQuery += ` GROUP BY j.id, b.name, b.city ORDER BY j.created_at DESC`;

    const jobs = await queryDb('identity_db', jobsQuery, jobsParams);

    // 2. Lấy danh sách hồ sơ ứng tuyển
    let appsQuery = `
      SELECT a.*,
             j.title as job_title, j.position as job_position,
             b.name as branch_name
      FROM job_applications a
      JOIN job_postings j ON a.job_id = j.id
      JOIN branches b ON a.branch_id = b.id
      WHERE 1=1
    `;
    const appsParams: any[] = [];
    if (activeBranchId) {
      appsParams.push(activeBranchId);
      appsQuery += ` AND a.branch_id = $${appsParams.length}`;
    }
    appsQuery += ` ORDER BY a.created_at DESC`;

    const applications = await queryDb('identity_db', appsQuery, appsParams);

    // 3. Lấy danh sách chi nhánh phục vụ dropdown (chỉ ADMIN mới cần chọn chi nhánh khi tạo)
    const branches = await queryDb('identity_db', `SELECT id, name, city FROM branches WHERE id != 'ALL' ORDER BY id ASC`);

    return NextResponse.json({
      success: true,
      scope: {
        role: user.role,
        branchId: activeBranchId,
      },
      jobs,
      applications,
      branches,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi tải dữ liệu tuyển dụng' }, { status: 500 });
  }
}

/**
 * POST /api/admin/recruitment
 * Các thao tác quản lý:
 * - CREATE_JOB: Tạo tin tuyển dụng mới (Manager chỉ được tạo cho chi nhánh mình)
 * - UPDATE_JOB: Sửa tin tuyển dụng (Manager chỉ được sửa tin thuộc chi nhánh mình)
 * - TOGGLE_JOB_STATUS: Ẩn/Hiện tin tuyển dụng
 * - DELETE_JOB: Xóa tin tuyển dụng
 * - UPDATE_APPLICATION_STATUS: Cập nhật trạng thái hồ sơ ứng viên (NEW, CONTACTED, INTERVIEW, HIRED, REJECTED)
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;

    if (!user || user.role === 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Yêu cầu đăng nhập tài khoản quản trị nội bộ.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // 1. TẠO TIN TUYỂN DỤNG MỚI
    if (action === 'CREATE_JOB') {
      let {
        title,
        branch_id,
        position,
        salary,
        salary_details,
        quantity,
        description,
        requirements,
        benefits,
        work_time,
        image_url,
        is_active,
      } = body;

      // MANAGER SCOPING: Ép buộc branch_id phải là của user
      if (user.role === 'BRANCH_MANAGER') {
        branch_id = user.branch_id;
      } else if (!branch_id) {
        branch_id = 'BR_HN_01';
      }

      if (!title || !position || !salary || !branch_id) {
        return NextResponse.json(
          { error: 'Vui lòng điền các trường bắt buộc: Tiêu đề, Vị trí, Mức lương, Chi nhánh.' },
          { status: 400 }
        );
      }

      // Lấy thông tin chi nhánh
      const branchRows = await queryDb<any>('identity_db', `SELECT name, address, city FROM branches WHERE id = $1`, [branch_id]);
      if (branchRows.length === 0) {
        return NextResponse.json({ error: 'Chi nhánh không tồn tại.' }, { status: 400 });
      }
      const branchInfo = branchRows[0];

      // Tạo slug duy nhất
      const baseSlug = title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      const uniqueSlug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

      const descJson = Array.isArray(description) ? JSON.stringify(description) : JSON.stringify([description || '']);
      const reqJson = Array.isArray(requirements) ? JSON.stringify(requirements) : JSON.stringify([requirements || '']);
      const benJson = Array.isArray(benefits) ? JSON.stringify(benefits) : JSON.stringify([benefits || '']);

      const created = await queryDb<any>(
        'identity_db',
        `INSERT INTO job_postings (
          slug, title, branch_id, branch_unit, location, position, salary, salary_details,
          quantity, description, requirements, benefits, work_time, image_url, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13, $14, $15)
        RETURNING *`,
        [
          uniqueSlug,
          title.trim(),
          branch_id,
          branchInfo.name,
          branchInfo.address,
          position.trim(),
          salary.trim(),
          salary_details || null,
          parseInt(quantity, 10) || 1,
          descJson,
          reqJson,
          benJson,
          work_time || null,
          image_url || '/images/branches/branch-cau-giay.png',
          is_active !== false,
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Đăng tin tuyển dụng thành công!',
        job: created[0],
      });
    }

    // 2. CHỈNH SỬA TIN TUYỂN DỤNG
    if (action === 'UPDATE_JOB') {
      const {
        id,
        title,
        branch_id,
        position,
        salary,
        salary_details,
        quantity,
        description,
        requirements,
        benefits,
        work_time,
        image_url,
        is_active,
      } = body;

      if (!id) {
        return NextResponse.json({ error: 'Thiếu ID tin tuyển dụng.' }, { status: 400 });
      }

      // Kiểm tra quyền trên tin tuyển dụng này
      const currentJob = await queryDb<any>('identity_db', `SELECT * FROM job_postings WHERE id = $1`, [id]);
      if (currentJob.length === 0) {
        return NextResponse.json({ error: 'Không tìm thấy tin tuyển dụng.' }, { status: 404 });
      }

      if (user.role === 'BRANCH_MANAGER' && currentJob[0].branch_id !== user.branch_id) {
        return NextResponse.json(
          { error: 'Bạn chỉ có quyền chỉnh sửa tin tuyển dụng của chi nhánh mình quản lý.' },
          { status: 403 }
        );
      }

      let targetBranchId = currentJob[0].branch_id;
      let branchUnit = currentJob[0].branch_unit;
      let branchLocation = currentJob[0].location;

      if (user.role === 'ADMIN' && branch_id && branch_id !== currentJob[0].branch_id) {
        const bRows = await queryDb<any>('identity_db', `SELECT name, address FROM branches WHERE id = $1`, [branch_id]);
        if (bRows.length > 0) {
          targetBranchId = branch_id;
          branchUnit = bRows[0].name;
          branchLocation = bRows[0].address;
        }
      }

      const descJson = Array.isArray(description) ? JSON.stringify(description) : JSON.stringify([description || '']);
      const reqJson = Array.isArray(requirements) ? JSON.stringify(requirements) : JSON.stringify([requirements || '']);
      const benJson = Array.isArray(benefits) ? JSON.stringify(benefits) : JSON.stringify([benefits || '']);

      const updated = await queryDb<any>(
        'identity_db',
        `UPDATE job_postings SET
          title = $1,
          branch_id = $2,
          branch_unit = $3,
          location = $4,
          position = $5,
          salary = $6,
          salary_details = $7,
          quantity = $8,
          description = $9::jsonb,
          requirements = $10::jsonb,
          benefits = $11::jsonb,
          work_time = $12,
          image_url = $13,
          is_active = $14,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $15
        RETURNING *`,
        [
          title.trim(),
          targetBranchId,
          branchUnit,
          branchLocation,
          position.trim(),
          salary.trim(),
          salary_details || null,
          parseInt(quantity, 10) || 1,
          descJson,
          reqJson,
          benJson,
          work_time || null,
          image_url || currentJob[0].image_url,
          is_active !== false,
          id,
        ]
      );

      return NextResponse.json({
        success: true,
        message: 'Cập nhật tin tuyển dụng thành công!',
        job: updated[0],
      });
    }

    // 3. BẬT / TẮT TRẠNG THÁI TIN
    if (action === 'TOGGLE_JOB_STATUS') {
      const { id, is_active } = body;
      const currentJob = await queryDb<any>('identity_db', `SELECT branch_id FROM job_postings WHERE id = $1`, [id]);
      if (currentJob.length === 0) return NextResponse.json({ error: 'Không tìm thấy tin.' }, { status: 404 });

      if (user.role === 'BRANCH_MANAGER' && currentJob[0].branch_id !== user.branch_id) {
        return NextResponse.json({ error: 'Không có quyền thao tác trên chi nhánh khác.' }, { status: 403 });
      }

      await queryDb('identity_db', `UPDATE job_postings SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [Boolean(is_active), id]);
      return NextResponse.json({ success: true, message: 'Đã thay đổi trạng thái tuyển dụng!' });
    }

    // 4. XÓA TIN TUYỂN DỤNG
    if (action === 'DELETE_JOB') {
      const { id } = body;
      const currentJob = await queryDb<any>('identity_db', `SELECT branch_id FROM job_postings WHERE id = $1`, [id]);
      if (currentJob.length === 0) return NextResponse.json({ error: 'Không tìm thấy tin.' }, { status: 404 });

      if (user.role === 'BRANCH_MANAGER' && currentJob[0].branch_id !== user.branch_id) {
        return NextResponse.json({ error: 'Không có quyền xóa tin của chi nhánh khác.' }, { status: 403 });
      }

      await queryDb('identity_db', `DELETE FROM job_postings WHERE id = $1`, [id]);
      return NextResponse.json({ success: true, message: 'Đã xóa tin tuyển dụng thành công!' });
    }

    // 5. CẬP NHẬT TRẠNG THÁI HỒ SƠ ỨNG VIÊN
    if (action === 'UPDATE_APPLICATION_STATUS') {
      const { application_id, status, notes } = body;
      if (!application_id || !status) {
        return NextResponse.json({ error: 'Thiếu thông tin cập nhật hồ sơ.' }, { status: 400 });
      }

      const currentApp = await queryDb<any>('identity_db', `SELECT branch_id FROM job_applications WHERE id = $1`, [application_id]);
      if (currentApp.length === 0) return NextResponse.json({ error: 'Không tìm thấy hồ sơ.' }, { status: 404 });

      if (user.role === 'BRANCH_MANAGER' && currentApp[0].branch_id !== user.branch_id) {
        return NextResponse.json({ error: 'Không có quyền duyệt hồ sơ của chi nhánh khác.' }, { status: 403 });
      }

      await queryDb(
        'identity_db',
        `UPDATE job_applications SET
          status = $1,
          notes = COALESCE($2, notes),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3`,
        [status, notes || null, application_id]
      );

      return NextResponse.json({ success: true, message: 'Đã cập nhật tiến độ ứng tuyển!' });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý yêu cầu' }, { status: 500 });
  }
}
