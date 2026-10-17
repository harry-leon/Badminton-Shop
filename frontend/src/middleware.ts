import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE_NAME = 'smash_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'smashcourt-secret-token-key-2026';

function base64UrlToUint8Array(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  const binary = atob(pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Edge-compatible HMAC-SHA256 signature verification via Web Crypto API
async function verifyTokenEdge(token: string): Promise<{ valid: boolean; user?: any }> {
  try {
    if (!token || !token.includes('.')) return { valid: false };
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return { valid: false };

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(SESSION_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBytes = base64UrlToUint8Array(signature);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as any,
      enc.encode(encodedPayload)
    );

    if (!isValid) return { valid: false };

    const payloadBytes = base64UrlToUint8Array(encodedPayload);
    const jsonStr = new TextDecoder().decode(payloadBytes);
    const data = JSON.parse(jsonStr);

    if (data.exp !== undefined && data.exp !== null && data.exp < Date.now()) {
      return { valid: false };
    }

    return { valid: true, user: data.user };
  } catch {
    return { valid: false };
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPortalRoute = pathname.startsWith('/portal');
  const isAdminRoute = pathname.startsWith('/admin');
  const isQuanTriRoute = pathname.startsWith('/quan-tri');
  const isAccountRoute = pathname.startsWith('/tai-khoan');

  // Nếu không thuộc các route được bảo vệ, cho phép đi tiếp
  if (!isPortalRoute && !isAdminRoute && !isQuanTriRoute && !isAccountRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 1. Không có cookie session -> Trả về HTTP 302 Redirect về /dang-nhap
  if (!token) {
    const redirectTarget = isQuanTriRoute || isAdminRoute ? '/portal/inventory' : pathname;
    const loginUrl = new URL('/dang-nhap', request.url);
    loginUrl.searchParams.set('redirect', redirectTarget);
    return NextResponse.redirect(loginUrl, 302);
  }

  // 2. Xác thực token phiên
  const authResult = await verifyTokenEdge(token);
  if (!authResult.valid || !authResult.user) {
    const redirectTarget = isQuanTriRoute || isAdminRoute ? '/portal/inventory' : pathname;
    const loginUrl = new URL('/dang-nhap', request.url);
    loginUrl.searchParams.set('redirect', redirectTarget);
    return NextResponse.redirect(loginUrl, 302);
  }

  const user = authResult.user;

  // 3. Xử lý route cũ /quan-tri hoặc /admin -> tự động chuyển hướng sang /portal tương ứng
  if (isQuanTriRoute || isAdminRoute) {
    if (user.role === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/403', request.url), 302);
    }
    const targetPath = isAdminRoute ? pathname.replace(/^\/admin/, '/portal') : '/portal/inventory';
    return NextResponse.redirect(new URL(targetPath, request.url), 302);
  }

  // 4. Đối với khu vực /portal/*: Chặn người dùng vai trò CUSTOMER -> HTTP 302 về /403
  if (isPortalRoute) {
    if (user.role === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/403', request.url), 302);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/portal/:path*', '/admin/:path*', '/quan-tri/:path*', '/tai-khoan/:path*'],
};
