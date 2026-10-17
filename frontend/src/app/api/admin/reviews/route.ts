import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

/**
 * GET /api/admin/reviews
 * Lấy danh sách đánh giá sản phẩm (kèm tên sản phẩm, bộ lọc trạng thái)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let query = `
      SELECT r.id, r.product_id, r.author_name, r.rating, r.title, r.comment,
             r.status, r.moderated_by, r.moderated_at, r.is_verified_purchase,
             r.reply, r.reply_at, r.created_at,
             p.name as product_name, p.slug as product_slug, p.image_url as product_image
      FROM product_reviews r
      LEFT JOIN products p ON r.product_id = p.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (statusFilter && statusFilter !== 'ALL') {
      params.push(statusFilter);
      query += ` AND r.status = $${params.length}`;
    }

    query += ` ORDER BY r.created_at DESC`;

    let reviews = await queryDb('catalog_db', query, params);

    // Seed sample reviews nếu chưa có đánh giá nào
    if (reviews.length === 0 && (!statusFilter || statusFilter === 'ALL')) {
      const sampleProds = await queryDb<any>('catalog_db', `SELECT id FROM products LIMIT 2`);
      if (sampleProds.length > 0) {
        await queryDb(
          'catalog_db',
          `INSERT INTO product_reviews (product_id, author_name, rating, title, comment, status, reply, reply_at)
           VALUES 
           ($1, 'Trần Minh Quang', 5, 'Vợt quá êm tay', 'Cây vợt đầm đầu, smash cắm sân cực kỳ uy lực, nhân viên tư vấn nhiệt tình.', 'APPROVED', 'Cảm ơn anh Quang đã tin tưởng Smash Court!', NOW()),
           ($1, 'Nguyễn Hoàng Long', 4, 'Hài lòng', 'Đan cước chuẩn số kg yêu cầu, giao hàng nhanh 2h.', 'APPROVED', NULL, NULL)`,
          [sampleProds[0].id]
        );
        reviews = await queryDb('catalog_db', query, params);
      }
    }

    return NextResponse.json({
      success: true,
      reviews,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi khi tải đánh giá sản phẩm' }, { status: 500 });
  }
}

/**
 * POST /api/admin/reviews
 * Kiểm duyệt, trả lời hoặc xóa đánh giá
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;

    if (!user || user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Yêu cầu quyền quản trị nội bộ.' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    // 1. DUYỆT HOẶC ẨN ĐÁNH GIÁ (MODERATE)
    if (action === 'MODERATE') {
      const { review_id, status } = body;
      if (!review_id || !status) {
        return NextResponse.json({ error: 'Thiếu review_id hoặc status.' }, { status: 400 });
      }

      await queryDb(
        'catalog_db',
        `UPDATE product_reviews SET
           status = $1,
           moderated_by = $2,
           moderated_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [status, user.full_name || user.email, review_id]
      );

      return NextResponse.json({
        success: true,
        message: `Đã cập nhật trạng thái đánh giá thành ${status}.`,
      });
    }

    // 2. PHẢN HỒI ĐÁNH GIÁ CỦA KHÁCH HÀNG (REPLY)
    if (action === 'REPLY') {
      const { review_id, reply_text } = body;
      if (!review_id || !reply_text) {
        return NextResponse.json({ error: 'Thiếu nội dung phản hồi.' }, { status: 400 });
      }

      await queryDb(
        'catalog_db',
        `UPDATE product_reviews SET
           reply = $1,
           reply_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [reply_text.trim(), review_id]
      );

      return NextResponse.json({
        success: true,
        message: 'Đã gửi phản hồi thành công!',
      });
    }

    // 3. XÓA ĐÁNH GIÁ
    if (action === 'DELETE') {
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Chỉ ADMIN mới có quyền xóa vĩnh viễn đánh giá.' }, { status: 403 });
      }

      const { review_id } = body;
      if (!review_id) {
        return NextResponse.json({ error: 'Thiếu review_id.' }, { status: 400 });
      }

      await queryDb('catalog_db', `DELETE FROM product_reviews WHERE id = $1`, [review_id]);

      return NextResponse.json({
        success: true,
        message: 'Đã xóa đánh giá thành công.',
      });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý đánh giá' }, { status: 500 });
  }
}
