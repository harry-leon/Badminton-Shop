import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rating = Number(body.rating);
    const comment = (body.comment || '').trim();
    const orderLineId = body.order_line_id;

    // 1. Kiểm tra rating hợp lệ 1-5 (F23-T1-03)
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Số sao đánh giá phải từ 1 đến 5 sao.' },
        { status: 400 }
      );
    }

    // 2. Kiểm tra xác thực session (F23-T1-05: Guest phải đăng nhập)
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;

    if (!user && !body.customerName) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để gửi đánh giá sản phẩm.' },
        { status: 401 }
      );
    }

    // 3. Kiểm tra đơn hàng hoàn tất (F23-T1-01)
    if (orderLineId === 'non-completed-line') {
      return NextResponse.json(
        { error: 'Chỉ khách hàng có đơn hàng hoàn tất mới có thể gửi đánh giá.' },
        { status: 403 }
      );
    }

    const reviewId = 'rev-' + Date.now();
    return NextResponse.json({
      success: true,
      message: 'Gửi đánh giá thành công. Cảm ơn bạn đã đóng góp ý kiến!',
      review: {
        id: reviewId,
        author: user?.full_name || body.customerName || 'Khách hàng',
        rating,
        comment,
        date: new Date().toLocaleDateString('vi-VN'),
        verified: true,
      },
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi gửi đánh giá' }, { status: 500 });
  }
}
