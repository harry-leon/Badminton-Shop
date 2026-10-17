import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME, signSessionToken } from '@/lib/auth';
import { queryDb } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
    }

    const sessionUser = verifySessionToken(token);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const fullName = (body.full_name || '').trim();
    const phone = (body.phone || '').trim();
    const avatarUrl = body.avatar_url !== undefined ? (body.avatar_url || '').trim() : undefined;

    if (!fullName) {
      return NextResponse.json({ error: 'Họ và tên không được để trống' }, { status: 400 });
    }

    if (phone && !/^(0|\+84)[0-9]{8,11}$/.test(phone)) {
      return NextResponse.json({ error: 'Số điện thoại không đúng định dạng Việt Nam' }, { status: 400 });
    }

    // Check if phone is used by someone else
    if (phone) {
      const existing = await queryDb<any>(
        'identity_db',
        `SELECT id FROM users WHERE phone = $1 AND id != $2 LIMIT 1`,
        [phone, sessionUser.id]
      );
      if (existing.length > 0) {
        return NextResponse.json({ error: 'Số điện thoại này đã được sử dụng bởi tài khoản khác' }, { status: 400 });
      }
    }

    const updates: string[] = ['full_name = $1'];
    const params: any[] = [fullName];

    if (phone) {
      params.push(phone);
      updates.push(`phone = $${params.length}`);
    }

    if (avatarUrl !== undefined) {
      params.push(avatarUrl || null);
      updates.push(`avatar_url = $${params.length}`);
    }

    params.push(sessionUser.id);
    const sql = `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length} RETURNING id, username, email, full_name, phone, role, avatar_url`;

    const rows = await queryDb<any>('identity_db', sql, params);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản người dùng' }, { status: 404 });
    }

    const updatedUser = {
      ...sessionUser,
      full_name: rows[0].full_name,
      phone: rows[0].phone,
      avatar_url: rows[0].avatar_url || null,
    };

    const newToken = signSessionToken(updatedUser);
    const response = NextResponse.json({
      success: true,
      message: 'Cập nhật hồ sơ tài khoản thành công',
      user: updatedUser,
    });

    response.cookies.set(SESSION_COOKIE_NAME, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi cập nhật hồ sơ' }, { status: 500 });
  }
}
