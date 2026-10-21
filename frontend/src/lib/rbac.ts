import { NextRequest } from 'next/server';
import { queryDb } from './db';
import { verifySessionToken, SESSION_COOKIE_NAME } from './auth';

// In-memory cache với TTL 30s để tối ưu hiệu năng truy vấn, lưu trên globalThis để chia sẻ xuyên suốt các route handler trong Node process
declare global {
  var __smashPermissionCache: Map<string, { permissions: Set<string>; expiresAt: number }> | undefined;
}

const permissionCache: Map<string, { permissions: Set<string>; expiresAt: number }> =
  globalThis.__smashPermissionCache || new Map();
globalThis.__smashPermissionCache = permissionCache;

/**
 * Xóa cache phân quyền cho một vai trò cụ thể hoặc toàn bộ hệ thống
 */
export function invalidateRolePermissionCache(roleId?: string): void {
  const cache = globalThis.__smashPermissionCache || permissionCache;
  if (roleId) {
    cache.delete(roleId);
  } else {
    cache.clear();
  }
}

/**
 * Chuẩn hóa mã quyền hạn (hỗ trợ cả dấu chấm '.' và hai chấm ':')
 */
export function normalizePermissionCode(code: string): string {
  if (!code) return '';
  return code.trim().replace('.', ':');
}

/**
 * Lấy danh sách mã quyền hạn của một vai trò từ database (hoặc in-memory cache)
 */
export async function getRolePermissions(roleId: string): Promise<string[]> {
  if (!roleId) return [];

  const now = Date.now();
  const cache = globalThis.__smashPermissionCache || permissionCache;
  const cached = cache.get(roleId);
  if (cached && cached.expiresAt > now) {
    return Array.from(cached.permissions);
  }

  try {
    const rows = await queryDb<{ code: string; id: string }>(
      'identity_db',
      `SELECT p.code, p.id 
       FROM role_permissions rp
       JOIN permissions p ON rp.permission_id = p.id
       WHERE rp.role_id = $1`,
      [roleId]
    );

    const permSet = new Set<string>();
    for (const r of rows) {
      if (r.code) permSet.add(normalizePermissionCode(r.code));
      if (r.id) permSet.add(normalizePermissionCode(r.id));
    }

    // Default Fallback nếu DB trống
    if (permSet.size === 0) {
      const DEFAULT_ROLE_PERMS: Record<string, string[]> = {
        ADMIN: [
          'dashboard:view', 'products:view', 'products:manage', 'inventory:view', 'inventory:manage',
          'orders:view', 'orders:process', 'orders:manage', 'customers:view', 'customers:manage',
          'staff:view', 'staff:manage', 'roles:view', 'roles:manage', 'branches:view', 'branches:manage',
          'banners:view', 'banners:manage', 'secondhand:view', 'secondhand:manage', 'warranty:view',
          'warranty:manage', 'recruitment:view', 'recruitment:manage', 'logs:view', 'settings:manage'
        ],
        BRANCH_MANAGER: [
          'dashboard:view', 'products:view', 'inventory:view', 'inventory:manage', 'orders:view',
          'orders:process', 'customers:view', 'staff:view', 'secondhand:view', 'secondhand:manage',
          'warranty:view', 'warranty:manage', 'recruitment:view', 'recruitment:manage', 'logs:view'
        ],
        STAFF: [
          'dashboard:view', 'products:view', 'inventory:view', 'orders:view', 'orders:process',
          'secondhand:view', 'warranty:view'
        ],
        CUSTOMER: [],
      };

      const defaults = DEFAULT_ROLE_PERMS[roleId] || [];
      defaults.forEach(p => permSet.add(normalizePermissionCode(p)));
    }

    cache.set(roleId, {
      permissions: permSet,
      expiresAt: now + 30000, // 30 giây TTL
    });

    return Array.from(permSet);
  } catch (error) {
    console.error(`Lỗi khi lấy quyền cho vai trò ${roleId}:`, error);
    const FALLBACK_DEFAULTS: Record<string, string[]> = {
      ADMIN: [
        'dashboard:view', 'products:view', 'products:manage', 'inventory:view', 'inventory:manage',
        'orders:view', 'orders:process', 'orders:manage', 'customers:view', 'customers:manage',
        'staff:view', 'staff:manage', 'roles:view', 'roles:manage', 'branches:view', 'branches:manage',
        'banners:view', 'banners:manage', 'secondhand:view', 'secondhand:manage', 'warranty:view',
        'warranty:manage', 'recruitment:view', 'recruitment:manage', 'logs:view', 'settings:manage'
      ],
      BRANCH_MANAGER: [
        'dashboard:view', 'products:view', 'inventory:view', 'inventory:manage', 'orders:view',
        'orders:process', 'customers:view', 'staff:view', 'secondhand:view', 'secondhand:manage',
        'warranty:view', 'warranty:manage', 'recruitment:view', 'recruitment:manage', 'logs:view'
      ],
      STAFF: [
        'dashboard:view', 'products:view', 'inventory:view', 'orders:view', 'orders:process',
        'secondhand:view', 'warranty:view'
      ],
    };
    return (FALLBACK_DEFAULTS[roleId] || []).map(normalizePermissionCode);
  }
}

/**
 * Kiểm tra xem vai trò có quyền thực hiện hành động cụ thể hay không
 */
export async function checkPermission(roleId: string, permissionCode: string): Promise<boolean> {
  if (!roleId || !permissionCode) return false;

  const normalized = normalizePermissionCode(permissionCode);
  const perms = await getRolePermissions(roleId);

  return perms.includes(normalized);
}

/**
 * Trích xuất định danh và vai trò của actor từ session cookie hoặc payload fallback
 */
export async function resolveActorRole(
  request: NextRequest,
  bodyRole?: string
): Promise<{ role: string; userId?: string; branchId?: string | null } | null> {
  try {
    let token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    }
    if (token) {
      const user = verifySessionToken(token);
      if (user && user.role) {
        return {
          role: user.role,
          userId: user.id,
          branchId: user.branch_id || null,
        };
      }
    }
  } catch (err) {
    console.warn('Lỗi phân giải session cookie trong resolveActorRole:', err);
  }

  // Nghiêm cấm client tự truyền role qua body hoặc URL
  // Vai trò & danh tính PHẢI được trích xuất xác thực từ JWT / Server Session Token
  return null;
}
