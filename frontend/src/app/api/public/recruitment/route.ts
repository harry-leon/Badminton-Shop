import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export const revalidate = 0; // Luôn lấy dữ liệu tuyển dụng mới nhất

/**
 * GET /api/public/recruitment
 * Lấy danh sách tin tuyển dụng công khai cho trang Storefront
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const jobRows = await queryDb<any>(
        'identity_db',
        `SELECT j.*, b.name as branch_name, b.city as branch_city, b.address as branch_address
         FROM job_postings j
         LEFT JOIN branches b ON j.branch_id = b.id
         WHERE j.slug = $1 AND j.is_active = true`,
        [slug]
      );

      if (jobRows.length === 0) {
        return NextResponse.json({ error: 'Không tìm thấy tin tuyển dụng.' }, { status: 404 });
      }

      const job = jobRows[0];

      // Lấy thêm các tin tuyển dụng liên quan khác
      const otherJobs = await queryDb<any>(
        'identity_db',
        `SELECT id, slug, title, branch_unit, location, position, salary, created_at, image_url
         FROM job_postings
         WHERE id != $1 AND is_active = true
         ORDER BY created_at DESC LIMIT 3`,
        [job.id]
      );

      return NextResponse.json({ success: true, job, otherJobs });
    }

    // Danh sách toàn bộ tin đang kích hoạt
    const jobs = await queryDb<any>(
      'identity_db',
      `SELECT j.*, b.name as branch_name, b.city as branch_city
       FROM job_postings j
       LEFT JOIN branches b ON j.branch_id = b.id
       WHERE j.is_active = true
       ORDER BY j.created_at DESC`
    );

    return NextResponse.json({ success: true, jobs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi tải tin tuyển dụng' }, { status: 500 });
  }
}

/**
 * POST /api/public/recruitment
 * Ứng viên gửi hồ sơ trực tuyến từ trang chi tiết tin tuyển dụng
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { job_id, full_name, phone, email, intro, cv_url } = body;

    if (!job_id || !full_name || !phone || !email) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ: Họ tên, Số điện thoại và Email liên hệ.' },
        { status: 400 }
      );
    }

    // Lấy branch_id của tin tuyển dụng để chuyển hồ sơ về đúng chi nhánh
    const jobRows = await queryDb<any>('identity_db', `SELECT branch_id, title FROM job_postings WHERE id = $1`, [job_id]);
    if (jobRows.length === 0) {
      return NextResponse.json({ error: 'Tin tuyển dụng không tồn tại hoặc đã hết hạn.' }, { status: 404 });
    }
    const branchId = jobRows[0].branch_id;

    const created = await queryDb<any>(
      'identity_db',
      `INSERT INTO job_applications (
        job_id, branch_id, full_name, phone, email, intro, cv_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'NEW')
      RETURNING *`,
      [job_id, branchId, full_name.trim(), phone.trim(), email.trim(), intro || null, cv_url || null]
    );

    return NextResponse.json({
      success: true,
      message: 'Nộp hồ sơ ứng tuyển thành công! Bộ phận nhân sự sẽ liên hệ với bạn trong thời gian sớm nhất.',
      application: created[0],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi gửi hồ sơ ứng tuyển' }, { status: 500 });
  }
}
