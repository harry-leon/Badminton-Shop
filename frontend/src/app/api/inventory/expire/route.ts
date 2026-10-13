import { NextRequest, NextResponse } from 'next/server';
import { queryDb, withTransaction } from '@/lib/db';

async function processExpiredReservations() {
  // 1. Quét các lượt giữ chỗ quá hạn còn ở trạng thái ACTIVE (R3)
  const expiredRows = await queryDb(
    'inventory_db',
    `SELECT * FROM reservations 
     WHERE status = 'ACTIVE' AND expires_at <= CURRENT_TIMESTAMP 
     ORDER BY created_at ASC`
  );

  const releasedReservations: any[] = [];
  let releasedCount = 0;

  for (const reservation of expiredRows) {
    // 2. Cập nhật trạng thái sang RELEASED và nhả reserved kho đúng 1 lần (Idempotent)
    const releaseSuccess = await withTransaction('inventory_db', async (client) => {
      // Atomic status transition gate
      const updateRes = await client.query(
        `UPDATE reservations 
         SET status = 'RELEASED' 
         WHERE id = $1 AND status = 'ACTIVE' 
         RETURNING *`,
        [reservation.id]
      );

      if (updateRes.rows.length === 0) {
        // Đã được xử lý bởi worker khác -> Idempotent no-op
        return false;
      }

      // Nhả tồn kho reserved
      await client.query(
        `UPDATE stock_levels 
         SET reserved = GREATEST(0, reserved - $1), updated_at = CURRENT_TIMESTAMP 
         WHERE branch_id = $2 AND sku = $3`,
        [reservation.quantity, reservation.branch_id, reservation.sku]
      );

      return true;
    });

    if (releaseSuccess) {
      releasedCount++;
      releasedReservations.push({
        id: reservation.id,
        orderId: reservation.order_id,
        sku: reservation.sku,
        quantity: reservation.quantity,
        branchId: reservation.branch_id,
      });

      // 3. Nếu là vợt cũ (Unique Unit): mở lại trạng thái APPROVED_FOR_SALE trong secondhand_db
      if (reservation.sku.startsWith('SH-')) {
        await queryDb(
          'secondhand_db',
          `UPDATE secondhand_units 
           SET status = 'APPROVED_FOR_SALE', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1 AND status = 'RESERVED'`,
          [reservation.sku]
        );
      }

      // 4. Hủy đơn hàng và payments quá hạn trong order_db nếu chưa thanh toán
      await queryDb(
        'order_db',
        `UPDATE orders 
         SET status = 'CANCELLED_EXPIRED', updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND status IN ('PENDING_RESERVATION', 'PENDING_PAYMENT')`,
        [reservation.order_id]
      );

      await queryDb(
        'order_db',
        `UPDATE payments 
         SET status = 'EXPIRED' 
         WHERE order_id = $1 AND status = 'PENDING'`,
        [reservation.order_id]
      );
    }
  }

  return {
    scanned: expiredRows.length,
    releasedCount,
    releasedReservations,
  };
}

export async function POST(request: NextRequest) {
  try {
    const result = await processExpiredReservations();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Lỗi khi giải phóng kho quá hạn:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await processExpiredReservations();
    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
