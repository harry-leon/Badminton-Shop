import { NextRequest, NextResponse } from 'next/server';
import { queryDb, withTransaction } from '@/lib/db';

export async function GET() {
  try {
    const orders = await queryDb(
      'order_db',
      `SELECT o.*, 
              COALESCE((
                SELECT json_agg(ol.*)
                FROM order_lines ol
                WHERE ol.order_id = o.id
              ), '[]'::json) as lines,
              COALESCE((
                SELECT json_agg(p.*)
                FROM payments p
                WHERE p.order_id = o.id
              ), '[]'::json) as payments
       FROM orders o
       ORDER BY o.created_at DESC`
    );

    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Đối soát và xác nhận thanh toán VietQR thủ công (P1 Checklist)
export async function POST(request: NextRequest) {
  try {
    const { orderId, transactionRef, confirmedBy } = await request.json();

    if (!orderId || !transactionRef || !confirmedBy) {
      return NextResponse.json(
        { error: 'Thiếu thông tin đối soát bắt buộc (orderId, transactionRef, confirmedBy)' },
        { status: 400 }
      );
    }

    const orderRows = await queryDb('order_db', `SELECT * FROM orders WHERE id = $1`, [orderId]);
    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    // Không thể xác nhận 2 lần (P1 Checklist)
    const paymentRows = await queryDb(
      'order_db',
      `SELECT * FROM payments WHERE order_id = $1 AND status = 'CONFIRMED'`,
      [orderId]
    );

    if (paymentRows.length > 0) {
      return NextResponse.json(
        { error: 'Giao dịch này đã được xác nhận thanh toán trước đó, không thể xác nhận hai lần!' },
        { status: 400 }
      );
    }

    // Cập nhật trạng thái payment và orders trong transaction của order_db
    await withTransaction('order_db', async (client) => {
      await client.query(
        `UPDATE payments 
         SET status = 'CONFIRMED',
             transaction_ref = $1,
             confirmed_by = $2,
             confirmed_at = CURRENT_TIMESTAMP
         WHERE order_id = $3`,
        [transactionRef, confirmedBy, orderId]
      );

      await client.query(
        `UPDATE orders 
         SET status = 'PAID',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [orderId]
      );
    });

    // Cập nhật reservations trong inventory_db sang CONFIRMED để expire worker không quét hủy kho
    try {
      await queryDb(
        'inventory_db',
        `UPDATE reservations SET status = 'CONFIRMED' WHERE order_id = $1 AND status = 'ACTIVE'`,
        [orderId]
      );
    } catch (invErr) {
      console.error('Lỗi cập nhật reservation status sang CONFIRMED:', invErr);
    }

    // Nếu đơn hàng có vợt cũ (Unique Unit), chuyển trạng thái sang SOLD trong secondhand_db
    try {
      const orderLines = await queryDb<any>(
        'order_db',
        `SELECT sku FROM order_lines WHERE order_id = $1`,
        [orderId]
      );
      for (const line of orderLines) {
        if (line.sku && line.sku.startsWith('SH-')) {
          await queryDb(
            'secondhand_db',
            `UPDATE secondhand_units SET status = 'SOLD', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [line.sku]
          );
        }
      }
    } catch (shErr) {
      console.error('Lỗi cập nhật trạng thái SOLD cho secondhand unit:', shErr);
    }

    return NextResponse.json({ success: true, orderId, transactionRef, status: 'PAID' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Cập nhật quy trình xử lý đơn hàng theo vai trò nhân viên / quản lý (R4)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, action, actor, actorRole, branchId } = body;

    if (!orderId || !action) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc (orderId, action)' }, { status: 400 });
    }

    const orderRows = await queryDb<any>('order_db', `SELECT * FROM orders WHERE id = $1`, [orderId]);
    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }
    const order = orderRows[0];

    // R4: Ràng buộc chi nhánh nhân viên
    const headerBranch = request.headers.get('x-branch-id');
    const effectiveBranch = headerBranch || branchId;

    if (actorRole !== 'ADMIN' && effectiveBranch && effectiveBranch !== 'ALL' && effectiveBranch !== order.branch_id) {
      return NextResponse.json(
        { error: 'QUY TẮC R4: Nhân viên chỉ được thao tác đơn hàng tại chi nhánh được phân công!' },
        { status: 403 }
      );
    }

    let nextStatus = order.status;
    if (action === 'CONFIRM') {
      nextStatus = 'CONFIRMED';
    } else if (action === 'PREPARE') {
      nextStatus = 'PREPARING';
    } else if (action === 'HANDOVER') {
      nextStatus = order.fulfillment_type === 'STORE_PICKUP' ? 'READY_FOR_PICKUP' : 'COMPLETED';
    } else if (action === 'COMPLETE') {
      nextStatus = 'COMPLETED';
    } else {
      return NextResponse.json({ error: 'Action không hợp lệ (hỗ trợ: CONFIRM, PREPARE, HANDOVER, COMPLETE)' }, { status: 400 });
    }

    await queryDb(
      'order_db',
      `UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [nextStatus, orderId]
    );

    return NextResponse.json({
      success: true,
      orderId,
      fromStatus: order.status,
      status: nextStatus,
      branchId: order.branch_id,
      action,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

