import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME, verifyPassword, hashPassword } from '@/lib/auth';
import { queryDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp mật khẩu cũ và mật khẩu mới.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu mới phải có tối thiểu 6 ký tự.' },
        { status: 400 }
      );
    }

    // Xác thực người dùng hiện tại
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const sessionUser = token ? verifySessionToken(token) : null;

    // Nếu không có session, kiểm tra mẫu cũ
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Mật khẩu cũ không chính xác hoặc chưa đăng nhập.' },
        { status: 401 }
      );
    }

    const rows = await queryDb<any>(
      'identity_db',
      `SELECT password_hash FROM users WHERE id = $1`,
      [sessionUser.id]
    );

    if (rows.length === 0 || !verifyPassword(oldPassword, rows[0].password_hash)) {
      return NextResponse.json(
        { error: 'Mật khẩu cũ không chính xác.' },
        { status: 400 }
      );
    }

    await queryDb(
      'identity_db',
      `UPDATE users SET password_hash = $1 WHERE id = $2`,
      [hashPassword(newPassword), sessionUser.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Đổi mật khẩu thành công.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi đổi mật khẩu' }, { status: 500 });
  }
}
