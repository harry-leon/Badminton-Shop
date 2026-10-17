import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;
    if (!user || user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q') || '';

    // 1. Lấy danh sách khách hàng từ identity_db
    let query = `
      SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role, u.is_active, u.created_at, u.updated_at
      FROM users u
      WHERE u.role = 'CUSTOMER'
    `;
    const params: any[] = [];

    if (search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(u.full_name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length} OR u.phone LIKE $${params.length})`;
    }

    query += ` ORDER BY u.created_at DESC`;

    const customers = await queryDb('identity_db', query, params);

    // 2. Lấy thống kê đơn hàng từ order_db
    let orderStatsQuery = `
      SELECT customer_phone, COUNT(id) as total_orders, COALESCE(SUM(total_amount), 0) as total_spent
      FROM orders
      WHERE status != 'CANCELLED'
      GROUP BY customer_phone
    `;
    let orderStats: any[] = [];
    try {
      orderStats = await queryDb('order_db', orderStatsQuery);
    } catch {
      orderStats = [];
    }

    const statsMap: Record<string, { total_orders: number; total_spent: number }> = {};
    orderStats.forEach((s) => {
      if (s.customer_phone) {
        statsMap[s.customer_phone] = {
          total_orders: parseInt(s.total_orders, 10),
          total_spent: parseInt(s.total_spent, 10),
        };
      }
    });

    const enrichedCustomers = customers.map((c) => {
      const stat = (c.phone && statsMap[c.phone]) ? statsMap[c.phone] : { total_orders: 0, total_spent: 0 };
      let tier = 'STANDARD';
      if (stat.total_spent >= 20000000) tier = 'DIAMOND';
      else if (stat.total_spent >= 10000000) tier = 'GOLD';
      else if (stat.total_spent >= 3000000) tier = 'SILVER';

      return {
        ...c,
        total_orders: stat.total_orders,
        total_spent: stat.total_spent,
        tier,
      };
    });

    return NextResponse.json({ customers: enrichedCustomers });
  } catch (err: any) {
    console.error('Error fetching customers:', err);
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;
    if (!user || user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Không có quyền thực hiện' }, { status: 403 });
    }

    const body = await req.json();
    const { action, userId, is_active, full_name, phone } = body;

    if (action === 'TOGGLE_STATUS') {
      await queryDb('identity_db', `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2`, [is_active, userId]);
      return NextResponse.json({ success: true });
    }

    if (action === 'UPDATE_CUSTOMER') {
      await queryDb(
        'identity_db',
        `UPDATE users SET full_name = $1, phone = $2, updated_at = NOW() WHERE id = $3`,
        [full_name, phone, userId]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi xử lý' }, { status: 500 });
  }
}
