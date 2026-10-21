import { NextRequest, NextResponse } from 'next/server';
import { queryDb, withTransaction } from '@/lib/db';
import { resolveActorRole, checkPermission, invalidateRolePermissionCache, normalizePermissionCode } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const actor = await resolveActorRole(request);
    if (!actor) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const canView = await checkPermission(actor.role, 'roles:view');
    const canManage = await checkPermission(actor.role, 'roles:manage');
    if (!canView && !canManage && actor.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Không có quyền xem ma trận phân quyền hệ thống (roles:view).' }, { status: 403 });
    }

    const roles = await queryDb<any>(
      'identity_db',
      `SELECT r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at,
              COALESCE(json_agg(rp.permission_id) FILTER (WHERE rp.permission_id IS NOT NULL), '[]') as permissions
       FROM roles r
       LEFT JOIN role_permissions rp ON r.id = rp.role_id
       GROUP BY r.id, r.name, r.description, r.is_system, r.created_at, r.updated_at
       ORDER BY r.id ASC`
    );

    const permissions = await queryDb<any>(
      'identity_db',
      `SELECT id, code, module, category, name, description FROM permissions ORDER BY module ASC, id ASC`
    );

    let finalRoles = roles;
    let finalPermissions = permissions;

    const DEFAULT_ROLES = [
      {
        id: 'ADMIN',
        name: 'Tổng Quản trị viên (Super Admin)',
        description: 'Toàn quyền cấu hình hệ thống, quản lý tài chính, kho vận, nhân sự và phân quyền.',
        is_system: true,
        permissions: [
          'dashboard:view', 'products:view', 'products:manage', 'inventory:view', 'inventory:manage',
          'orders:view', 'orders:process', 'orders:manage', 'customers:view', 'customers:manage',
          'staff:view', 'staff:manage', 'roles:view', 'roles:manage', 'branches:view', 'branches:manage',
          'banners:view', 'banners:manage', 'secondhand:view', 'secondhand:manage', 'warranty:view',
          'warranty:manage', 'recruitment:view', 'recruitment:manage', 'logs:view', 'settings:manage'
        ],
      },
      {
        id: 'BRANCH_MANAGER',
        name: 'Quản lý Chi nhánh',
        description: 'Quản lý vận hành cục bộ tại chi nhánh được giao: tồn kho, đơn hàng, bảo hành, tuyển dụng.',
        is_system: true,
        permissions: [
          'dashboard:view', 'products:view', 'inventory:view', 'inventory:manage', 'orders:view',
          'orders:process', 'customers:view', 'staff:view', 'secondhand:view', 'secondhand:manage',
          'warranty:view', 'warranty:manage', 'recruitment:view', 'recruitment:manage', 'logs:view'
        ],
      },
      {
        id: 'STAFF',
        name: 'Nhân viên Bán hàng & Kỹ thuật',
        description: 'Tiếp nhận đơn hàng, tư vấn sản phẩm, căng cước vợt và xử lý yêu cầu bảo hành tại quầy.',
        is_system: true,
        permissions: [
          'dashboard:view', 'products:view', 'inventory:view', 'orders:view', 'orders:process',
          'secondhand:view', 'warranty:view'
        ],
      },
      {
        id: 'CUSTOMER',
        name: 'Khách hàng',
        description: 'Người dùng mua sắm trực tuyến, theo dõi đơn và gửi hồ sơ bảo hành/ứng tuyển.',
        is_system: true,
        permissions: [],
      },
    ];

    const DEFAULT_PERMISSIONS = [
      { id: 'dashboard:view', code: 'dashboard:view', module: 'DASHBOARD', name: 'Xem Dashboard', description: 'Xem tổng quan báo cáo doanh thu và KPI' },
      { id: 'products:view', code: 'products:view', module: 'PRODUCTS', name: 'Xem sản phẩm', description: 'Xem danh mục và chi tiết sản phẩm' },
      { id: 'products:manage', code: 'products:manage', module: 'PRODUCTS', name: 'Quản lý sản phẩm', description: 'Thêm, sửa, xóa sản phẩm và danh mục' },
      { id: 'inventory:view', code: 'inventory:view', module: 'INVENTORY', name: 'Xem kho hàng', description: 'Tra cứu tồn kho các chi nhánh' },
      { id: 'inventory:manage', code: 'inventory:manage', module: 'INVENTORY', name: 'Quản lý kho hàng', description: 'Nhập xuất kho, luân chuyển và kiểm kê' },
      { id: 'orders:view', code: 'orders:view', module: 'ORDERS', name: 'Xem đơn hàng', description: 'Xem danh sách và chi tiết đơn mua hàng' },
      { id: 'orders:process', code: 'orders:process', module: 'ORDERS', name: 'Xử lý đơn hàng', description: 'Xác nhận, đóng gói và giao vận đơn hàng' },
      { id: 'orders:manage', code: 'orders:manage', module: 'ORDERS', name: 'Hủy/Hoàn tiền đơn', description: 'Toàn quyền điều chỉnh trạng thái đơn' },
      { id: 'customers:view', code: 'customers:view', module: 'CUSTOMERS', name: 'Xem khách hàng', description: 'Tra cứu danh sách hồ sơ khách hàng' },
      { id: 'customers:manage', code: 'customers:manage', module: 'CUSTOMERS', name: 'Quản lý khách hàng', description: 'Khóa/mở tài khoản, cấp điểm thưởng' },
      { id: 'staff:view', code: 'staff:view', module: 'STAFF', name: 'Xem nhân viên', description: 'Tra cứu danh sách nhân sự nội bộ' },
      { id: 'staff:manage', code: 'staff:manage', module: 'STAFF', name: 'Quản trị nhân sự', description: 'Thêm mới, sửa quyền và phân công chi nhánh' },
      { id: 'roles:view', code: 'roles:view', module: 'ROLES', name: 'Xem vai trò', description: 'Xem ma trận phân quyền hệ thống' },
      { id: 'roles:manage', code: 'roles:manage', module: 'ROLES', name: 'Quản trị phân quyền', description: 'Tạo vai trò và phân bổ quyền hạn' },
      { id: 'branches:view', code: 'branches:view', module: 'BRANCHES', name: 'Xem chi nhánh', description: 'Tra cứu mạng lưới showroom chi nhánh' },
      { id: 'branches:manage', code: 'branches:manage', module: 'BRANCHES', name: 'Quản trị chi nhánh', description: 'Tạo mới, sửa và quản lý hoạt động chi nhánh' },
      { id: 'banners:view', code: 'banners:view', module: 'MARKETING', name: 'Xem banner & CMS', description: 'Xem các banner và cài đặt marketing' },
      { id: 'banners:manage', code: 'banners:manage', module: 'MARKETING', name: 'Quản trị banner & CMS', description: 'Đăng tải banner, chỉnh sửa slide' },
      { id: 'secondhand:view', code: 'secondhand:view', module: 'SECONDHAND', name: 'Xem vợt cũ (2nd Hand)', description: 'Tra cứu máy thẩm định và danh mục vợt cũ' },
      { id: 'secondhand:manage', code: 'secondhand:manage', module: 'SECONDHAND', name: 'Quản lý thu cũ đổi mới', description: 'Duyệt thu mua và niêm yết bán vợt cũ' },
      { id: 'warranty:view', code: 'warranty:view', module: 'WARRANTY', name: 'Xem bảo hành', description: 'Tra cứu yêu cầu bảo hành và chính sách' },
      { id: 'warranty:manage', code: 'warranty:manage', module: 'WARRANTY', name: 'Quản lý bảo hành', description: 'Tiếp nhận, xử lý claim bảo hành' },
      { id: 'recruitment:view', code: 'recruitment:view', module: 'RECRUITMENT', name: 'Xem tuyển dụng', description: 'Xem danh sách tin tuyển dụng và hồ sơ ứng tuyển' },
      { id: 'recruitment:manage', code: 'recruitment:manage', module: 'RECRUITMENT', name: 'Quản lý tuyển dụng', description: 'Đăng tin tuyển dụng và cập nhật trạng thái ứng viên' },
      { id: 'logs:view', code: 'logs:view', module: 'AUDIT', name: 'Xem nhật ký kiểm toán', description: 'Tra cứu lịch sử thao tác và audit logs' },
      { id: 'settings:manage', code: 'settings:manage', module: 'SETTINGS', name: 'Cấu hình hệ thống', description: 'Cấu hình cổng thanh toán và thông số shop' },
    ];

    if (!finalRoles || finalRoles.length === 0) {
      finalRoles = DEFAULT_ROLES;
    }
    if (!finalPermissions || finalPermissions.length === 0) {
      finalPermissions = DEFAULT_PERMISSIONS;
    }

    return NextResponse.json({ roles: finalRoles, permissions: finalPermissions });
  } catch (err: any) {
    return NextResponse.json({
      roles: [
        {
          id: 'ADMIN',
          name: 'Tổng Quản trị viên (Super Admin)',
          description: 'Toàn quyền cấu hình hệ thống, quản lý tài chính, kho vận, nhân sự và phân quyền.',
          is_system: true,
          permissions: ['dashboard:view', 'products:view', 'products:manage', 'inventory:view', 'inventory:manage', 'orders:view', 'orders:process', 'orders:manage', 'customers:view', 'customers:manage', 'staff:view', 'staff:manage', 'roles:view', 'roles:manage', 'branches:view', 'branches:manage', 'banners:view', 'banners:manage', 'secondhand:view', 'secondhand:manage', 'warranty:view', 'warranty:manage', 'recruitment:view', 'recruitment:manage', 'logs:view', 'settings:manage'],
        },
        {
          id: 'BRANCH_MANAGER',
          name: 'Quản lý Chi nhánh',
          description: 'Quản lý vận hành cục bộ tại chi nhánh được giao: tồn kho, đơn hàng, bảo hành, tuyển dụng.',
          is_system: true,
          permissions: ['dashboard:view', 'products:view', 'inventory:view', 'inventory:manage', 'orders:view', 'orders:process', 'customers:view', 'staff:view', 'secondhand:view', 'secondhand:manage', 'warranty:view', 'warranty:manage', 'recruitment:view', 'recruitment:manage', 'logs:view'],
        },
        {
          id: 'STAFF',
          name: 'Nhân viên Bán hàng & Kỹ thuật',
          description: 'Tiếp nhận đơn hàng, tư vấn sản phẩm, căng cước vợt và xử lý yêu cầu bảo hành tại quầy.',
          is_system: true,
          permissions: ['dashboard:view', 'products:view', 'inventory:view', 'orders:view', 'orders:process', 'secondhand:view', 'warranty:view'],
        },
        {
          id: 'CUSTOMER',
          name: 'Khách hàng',
          description: 'Người dùng mua sắm trực tuyến, theo dõi đơn và gửi hồ sơ bảo hành/ứng tuyển.',
          is_system: true,
          permissions: [],
        },
      ],
      permissions: [
        { id: 'dashboard:view', code: 'dashboard:view', module: 'DASHBOARD', name: 'Xem Dashboard', description: 'Xem tổng quan báo cáo doanh thu và KPI' },
        { id: 'products:view', code: 'products:view', module: 'PRODUCTS', name: 'Xem sản phẩm', description: 'Xem danh mục và chi tiết sản phẩm' },
        { id: 'inventory:view', code: 'inventory:view', module: 'INVENTORY', name: 'Xem kho hàng', description: 'Tra cứu tồn kho các chi nhánh' },
        { id: 'orders:view', code: 'orders:view', module: 'ORDERS', name: 'Xem đơn hàng', description: 'Xem danh sách và chi tiết đơn mua hàng' },
        { id: 'roles:view', code: 'roles:view', module: 'ROLES', name: 'Xem vai trò', description: 'Xem ma trận phân quyền hệ thống' },
      ],
      warning: err.message,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await resolveActorRole(request);
    if (!actor) {
      return NextResponse.json({ error: 'Yêu cầu đăng nhập quản trị.' }, { status: 401 });
    }

    const canManage = await checkPermission(actor.role, 'roles:manage');
    if (!canManage && actor.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Chỉ Quản trị viên có quyền roles:manage mới được tạo hoặc sửa đổi vai trò.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const action = body.action;
    const targetRoleId = (body.roleId || body.id || '').trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const name = (body.name || '').trim();
    const description = (body.description || '').trim();
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    // Hỗ trợ Action: UPDATE_PERMISSIONS (hoặc khi chỉ cập nhật quyền)
    if (action === 'UPDATE_PERMISSIONS') {
      if (!targetRoleId) {
        return NextResponse.json({ error: 'Thiếu mã vai trò (roleId)' }, { status: 400 });
      }

      await withTransaction('identity_db', async (client) => {
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [targetRoleId]);
        for (const p of permissions) {
          const normCode = normalizePermissionCode(p);
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [targetRoleId, normCode]
          );
        }
        await client.query('UPDATE roles SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [targetRoleId]);
      });

      invalidateRolePermissionCache(targetRoleId);
      return NextResponse.json({
        success: true,
        message: `Đã lưu cập nhật quyền cho vai trò ${targetRoleId}`,
        roleId: targetRoleId,
        permissions: permissions.map(normalizePermissionCode),
      });
    }

    // Mặc định hoặc action === 'CREATE_ROLE': Tạo vai trò mới
    if (!targetRoleId || !name) {
      return NextResponse.json({ error: 'Mã vai trò và tên vai trò không được để trống' }, { status: 400 });
    }

    await withTransaction('identity_db', async (client) => {
      await client.query(
        `INSERT INTO roles (id, name, description, is_system, created_at, updated_at) 
         VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, updated_at = CURRENT_TIMESTAMP`,
        [targetRoleId, name, description]
      );

      if (permissions.length > 0) {
        await client.query('DELETE FROM role_permissions WHERE role_id = $1', [targetRoleId]);
        for (const p of permissions) {
          const normCode = normalizePermissionCode(p);
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [targetRoleId, normCode]
          );
        }
      }
    });

    invalidateRolePermissionCache(targetRoleId);

    return NextResponse.json({
      success: true,
      message: `Đã tạo thành công vai trò ${targetRoleId}`,
      role: {
        id: targetRoleId,
        name,
        description,
        is_system: false,
        permissions: permissions.map(normalizePermissionCode),
      },
    }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý vai trò' }, { status: 500 });
  }
}
