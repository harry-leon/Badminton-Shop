import { NextRequest, NextResponse } from 'next/server';
import { findUserByIdentifier, verifyPassword, signSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { logAudit } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  try {
    const body = await request.json().catch(() => ({}));
    const identifier = (body.email || body.username || body.identifier || body.phone || '') as string;
    const password = (body.password || '') as string;

    if (!identifier.trim() || !password) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ thông tin tài khoản và mật khẩu.' },
        { status: 400 }
      );
    }

    const userWithHash = await findUserByIdentifier(identifier);
    if (!userWithHash) {
      await logAudit({
        level: 'WARN',
        module: 'AUTH',
        action: 'LOGIN_FAILED',
        message: `Đăng nhập thất bại: Không tìm thấy tài khoản "${identifier}"`,
        actorName: identifier,
        actorRole: 'ANONYMOUS',
        ipAddress,
        userAgent,
        details: { reason: 'User not found' },
      });

      return NextResponse.json(
        { error: 'Tài khoản hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, userWithHash.password_hash);
    if (!isValid) {
      await logAudit({
        level: 'WARN',
        module: 'AUTH',
        action: 'LOGIN_FAILED',
        message: `Đăng nhập thất bại: Sai mật khẩu cho tài khoản "${userWithHash.username}"`,
        actorId: userWithHash.id,
        actorName: userWithHash.username,
        actorRole: userWithHash.role,
        ipAddress,
        userAgent,
        details: { reason: 'Invalid password' },
      });

      return NextResponse.json(
        { error: 'Tài khoản hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    const authUser = {
      id: userWithHash.id,
      username: userWithHash.username,
      email: userWithHash.email,
      full_name: userWithHash.full_name,
      phone: userWithHash.phone,
      role: userWithHash.role,
      branch_id: userWithHash.branch_id,
    };

    const token = signSessionToken(authUser);

    await logAudit({
      level: 'INFO',
      module: 'AUTH',
      action: 'LOGIN_SUCCESS',
      message: `Người dùng "${authUser.username}" (${authUser.role}) đăng nhập thành công`,
      actorId: authUser.id,
      actorName: authUser.username,
      actorRole: authUser.role,
      ipAddress,
      userAgent,
      details: { branch_id: authUser.branch_id },
    });

    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: authUser,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 ngày
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi xử lý đăng nhập' }, { status: 500 });
  }
}
