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
    const branchId = searchParams.get('branchId') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('q') || '';

    let query = `SELECT * FROM stringing_orders WHERE 1=1`;
    const params: any[] = [];

    if (branchId && branchId !== 'ALL') {
      params.push(branchId);
      query += ` AND branch_id = $${params.length}`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(order_code) LIKE $${params.length} OR LOWER(customer_name) LIKE $${params.length} OR customer_phone LIKE $${params.length} OR LOWER(racket_model) LIKE $${params.length})`;
    }

    query += ` ORDER BY created_at DESC`;

    const orders = await queryDb('order_db', query, params);
    return NextResponse.json({ orders });
  } catch (err: any) {
    console.error('Error fetching stringing orders:', err);
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
    const { action } = body;

    if (action === 'CREATE_ORDER') {
      const {
        customer_name,
        customer_phone,
        branch_id,
        racket_model,
        string_type,
        tension_lbs,
        knot_type,
        technician_name,
        price,
        notes,
      } = body;

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const orderCode = `STR-${Date.now().toString().slice(-4)}-${randomNum}`;
      const id = `STR_${Date.now()}`;

      await queryDb(
        'order_db',
        `INSERT INTO stringing_orders 
        (id, order_code, customer_name, customer_phone, branch_id, racket_model, string_type, tension_lbs, knot_type, technician_name, price, status, notes, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'RECEIVED', $12, $13)`,
        [
          id,
          orderCode,
          customer_name,
          customer_phone,
          branch_id,
          racket_model,
          string_type,
          tension_lbs,
          knot_type || '4_KNOTS_BWF',
          technician_name || 'Chưa gán',
          price || 120000,
          notes || '',
          user.username || 'staff',
        ]
      );

      return NextResponse.json({ success: true, orderCode, id });
    }

    if (action === 'UPDATE_STATUS') {
      const { id, status, technician_name, notes } = body;
      const completedClause = status === 'COMPLETED' ? ', completed_at = NOW()' : '';

      await queryDb(
        'order_db',
        `UPDATE stringing_orders 
        SET status = $1, technician_name = COALESCE($2, technician_name), notes = COALESCE($3, notes)${completedClause}
        WHERE id = $4`,
        [status, technician_name, notes, id]
      );

      return NextResponse.json({ success: true });
    }

    if (action === 'DELETE_ORDER') {
      const { id } = body;
      await queryDb('order_db', `DELETE FROM stringing_orders WHERE id = $1`, [id]);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
