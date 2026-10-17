import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { getRolePermissions } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }

  const user = verifySessionToken(token);
  if (!user) {
    return NextResponse.json({
      authenticated: false,
      user: null,
    });
  }

  // Fetch updated user details from identity_db to get latest avatar_url
  let freshUser = { ...user };
  try {
    const { queryDb } = await import('@/lib/db');
    const rows = await queryDb<any>(
      'identity_db',
      `SELECT id, username, email, full_name, phone, role, avatar_url, created_at
       FROM users WHERE id = $1 AND is_active = true LIMIT 1`,
      [user.id]
    );
    if (rows.length > 0) {
      freshUser = {
        ...freshUser,
        full_name: rows[0].full_name,
        phone: rows[0].phone,
        avatar_url: rows[0].avatar_url || null,
        created_at: rows[0].created_at,
      };
    }
  } catch (_) {}

  const permissions = await getRolePermissions(user.role);

  return NextResponse.json({
    authenticated: true,
    user: {
      ...freshUser,
      permissions,
    },
  });
}
