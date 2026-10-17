import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { queryDb } from './db';

export type UserRole = 'ADMIN' | 'BRANCH_MANAGER' | 'STAFF' | 'CUSTOMER' | string;

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
  branch_id?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
}

const SESSION_COOKIE_NAME = 'smash_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'smashcourt-secret-token-key-2026';

export { SESSION_COOKIE_NAME };

/**
 * Tạo token phiên làm việc có chữ ký HMAC-SHA256
 */
export function signSessionToken(user: AuthUser): string {
  const payload = JSON.stringify({
    user,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 ngày
  });
  const encodedPayload = Buffer.from(payload, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

/**
 * Xác thực và giải mã token phiên làm việc
 */
export function verifySessionToken(token: string): AuthUser | null {
  if (!token || !token.includes('.')) return null;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const jsonStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const data = JSON.parse(jsonStr);
    if (data.exp !== undefined && data.exp !== null && data.exp < Date.now()) {
      return null; // Hết hạn
    }
    return data.user as AuthUser;
  } catch {
    return null;
  }
}

/**
 * Băm mật khẩu sử dụng BCrypt (10 rounds)
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/**
 * Kiểm tra mật khẩu: Đối soát trực tiếp với mã băm BCrypt từ cơ sở dữ liệu
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;

  try {
    if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
      if (bcrypt.compareSync(password, storedHash)) return true;
    }
  } catch (_) {}

  // Hash SHA-256 đối soát phụ nếu có
  try {
    const sha = crypto.createHash('sha256').update(password).digest('hex');
    if (storedHash === sha) return true;
  } catch (_) {}

  return false;
}

/**
 * Tìm kiếm user trong identity_db theo email, username hoặc số điện thoại
 */
export async function findUserByIdentifier(identifier: string): Promise<(AuthUser & { password_hash: string }) | null> {
  const clean = identifier.trim().toLowerCase();
  const rows = await queryDb<any>(
    'identity_db',
    `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, u.password_hash, u.is_active,
            u.avatar_url, sba.branch_id
     FROM users u
     LEFT JOIN staff_branch_assignments sba ON u.id = sba.user_id
     WHERE (LOWER(u.email) = $1 OR LOWER(u.username) = $1 OR u.phone = $1)
       AND u.is_active = true
     LIMIT 1`,
    [clean]
  );

  if (rows.length === 0) return null;
  const row = rows[0];
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    full_name: row.full_name,
    phone: row.phone,
    role: row.role as UserRole,
    branch_id: row.branch_id || null,
    avatar_url: row.avatar_url || null,
    password_hash: row.password_hash,
  };
}
