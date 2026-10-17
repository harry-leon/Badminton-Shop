import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { queryDb } from '@/lib/db';
import { checkPermission } from '@/lib/rbac';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }
  const user = token ? verifySessionToken(token) : null;

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized: Bạn cần đăng nhập để thực hiện thao tác này.' },
      { status: 401 }
    );
  }

  if (user.role === 'CUSTOMER') {
    return NextResponse.json(
      { error: 'Forbidden: Khách hàng không có quyền kiểm duyệt đánh giá.' },
      { status: 403 }
    );
  }

  const canModerate = await checkPermission(user.role, 'reviews:moderate');
  if (!canModerate && user.role !== 'ADMIN' && user.role !== 'BRANCH_MANAGER') {
    return NextResponse.json(
      { error: 'Forbidden: Bạn không có quyền kiểm duyệt đánh giá (reviews:moderate).' },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = (body.reason || '').trim();

  // F25-T1-03: Bắt buộc cung cấp lý do kiểm duyệt
  if (!reason) {
    return NextResponse.json(
      { error: 'Bắt buộc cung cấp lý do kiểm duyệt ẩn đánh giá.' },
      { status: 400 }
    );
  }

  try {
    await queryDb(
      'catalog_db',
      `UPDATE product_reviews SET status = 'HIDDEN', moderated_by = $1, moderated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [user.full_name || user.username || user.email, id]
    );
  } catch (err: any) {
    console.error('Lỗi cập nhật trạng thái ẩn đánh giá:', err);
  }

  return NextResponse.json({
    success: true,
    message: `Đã ẩn đánh giá ${id}`,
    id,
    reason,
  });
}
