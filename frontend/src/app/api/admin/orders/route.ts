import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET() {
  try {
    const orders = await queryDb(
      'order_db',
      `SELECT o.*, 
              COALESCE(json_agg(ol.*) FILTER (WHERE ol.id IS NOT NULL), '[]') as lines,
              COALESCE(json_agg(p.*) FILTER (WHERE p.id IS NOT NULL), '[]') as payments
       FROM orders o
       LEFT JOIN order_lines ol ON o.id = ol.order_id
       LEFT JOIN payments p ON o.id = p.order_id
       GROUP BY o.id
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

    // Cập nhật trạng thái payment
    await queryDb(
      'order_db',
      `UPDATE payments 
       SET status = 'CONFIRMED',
           transaction_ref = $1,
           confirmed_by = $2,
           confirmed_at = CURRENT_TIMESTAMP
       WHERE order_id = $3`,
      [transactionRef, confirmedBy, orderId]
    );

    // Cập nhật trạng thái đơn hàng sang PAID hoặc PREPARING
    await queryDb(
      'order_db',
      `UPDATE orders 
       SET status = 'PAID',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId]
    );

    return NextResponse.json({ success: true, orderId, transactionRef, status: 'PAID' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
