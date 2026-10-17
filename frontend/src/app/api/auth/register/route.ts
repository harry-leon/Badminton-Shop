import { NextRequest, NextResponse } from 'next/server';
import { signSessionToken, SESSION_COOKIE_NAME, hashPassword } from '@/lib/auth';
import { queryDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const fullName = (body.full_name || body.name || 'Khách hàng').trim();
    const phone = (body.phone || '').trim();

    // 1. Kiểm tra định dạng số điện thoại Việt Nam (F17-T1-05)
    if (!phone || !/^(0|\+84)[0-9]{8,11}$/.test(phone)) {
      return NextResponse.json(
        { error: 'Số điện thoại không đúng định dạng Việt Nam (tối thiểu 9-11 số).' },
        { status: 400 }
      );
    }

    // 2. Kiểm tra email & mật khẩu
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email không hợp lệ.' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có tối thiểu 6 ký tự.' },
        { status: 400 }
      );
    }

    // 3. Kiểm tra xem user đã tồn tại chưa
    const existing = await queryDb(
      'identity_db',
      `SELECT id FROM users WHERE email = $1 OR phone = $2 LIMIT 1`,
      [email, phone]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Email hoặc số điện thoại này đã được đăng ký.' },
        { status: 400 }
      );
    }

    const username = email.split('@')[0] + '_' + Math.floor(Math.random() * 1000);
    const passwordHash = hashPassword(password);
    const rows = await queryDb<any>(
      'identity_db',
      `INSERT INTO users (username, email, password_hash, full_name, phone, role)
       VALUES ($1, $2, $3, $4, $5, 'CUSTOMER')
       RETURNING id, username, email, full_name, phone, role`,
      [username, email, passwordHash, fullName, phone]
    );

    const newUser = {
      id: rows[0].id,
      username: rows[0].username,
      email: rows[0].email,
      full_name: rows[0].full_name,
      phone: rows[0].phone,
      role: rows[0].role,
      branch_id: null,
    };

    const token = signSessionToken(newUser);
    const response = NextResponse.json({
      success: true,
      message: 'Đăng ký tài khoản thành công',
      user: newUser,
    }, { status: 201 });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi đăng ký tài khoản' }, { status: 500 });
  }
}
