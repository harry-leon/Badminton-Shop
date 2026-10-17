import { NextRequest, NextResponse } from 'next/server';
import { queryDb, withTransaction } from '@/lib/db';
import { resolveActorRole, checkPermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const actor = await resolveActorRole(request);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để truy cập danh sách đơn hàng!' }, { status: 401 });
    }
    const canView = await checkPermission(actor.role, 'orders:view');
    if (!canView && actor.role !== 'ADMIN' && actor.role !== 'BRANCH_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Bạn không có quyền xem đơn hàng (orders:view)!' }, { status: 403 });
    }

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
              ), '[]'::json) as payments,
              COALESCE((
                SELECT json_agg(r.*)
                FROM refunds r
                WHERE r.order_id = o.id
              ), '[]'::json) as refunds
       FROM orders o
       ORDER BY o.created_at DESC`
    );

    const allRefunds = await queryDb(
      'order_db',
      `SELECT r.*, o.customer_name, o.customer_phone, o.branch_id
       FROM refunds r
       LEFT JOIN orders o ON r.order_id = o.id
       ORDER BY r.created_at DESC`
    );

    return NextResponse.json({ orders, refunds: allRefunds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Đối soát VietQR hoặc Xử lý Hoàn tiền (Refunds) & Ghi chú vận hành
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, orderId, transactionRef, confirmedBy } = body;

    const actor = await resolveActorRole(request);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để thực hiện thao tác này!' }, { status: 401 });
    }
    const effectiveRole = actor.role;

    // 1. TẠO YÊU CẦU HOÀN TIỀN
    if (action === 'CREATE_REFUND') {
      const { amount, reason, requested_by } = body;
      if (!orderId || !amount || !reason) {
        return NextResponse.json({ error: 'Thiếu thông tin hoàn tiền bắt buộc (orderId, amount, reason).' }, { status: 400 });
      }

      const res = await queryDb(
        'order_db',
        `INSERT INTO refunds (order_id, amount, reason, requested_by, status)
         VALUES ($1, $2, $3, $4, 'PENDING')
         RETURNING *`,
        [orderId, Number(amount), reason, requested_by || (actor as any)?.username || actor?.userId || 'staff_portal']
      );

      return NextResponse.json({
        success: true,
        message: 'Đã tạo phiếu yêu cầu hoàn tiền thành công!',
        refund: res[0],
      });
    }

    // 2. PHÊ DUYỆT / TỪ CHỐI HOÀN TIỀN
    if (action === 'APPROVE_REFUND' || action === 'REJECT_REFUND') {
      const canRefund = await checkPermission(effectiveRole, 'refunds:manage');
      if (!canRefund && effectiveRole !== 'ADMIN' && effectiveRole !== 'BRANCH_MANAGER') {
        return NextResponse.json({ error: 'Chỉ Quản lý chi nhánh hoặc Admin mới có quyền phê duyệt hoàn tiền!' }, { status: 403 });
      }

      const { refundId, approved_by } = body;
      if (!refundId) {
        return NextResponse.json({ error: 'Thiếu mã phiếu hoàn tiền (refundId).' }, { status: 400 });
      }

      const newStatus = action === 'APPROVE_REFUND' ? 'APPROVED' : 'REJECTED';
      await queryDb(
        'order_db',
        `UPDATE refunds 
         SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP 
         WHERE id = $3`,
        [newStatus, approved_by || (actor as any)?.username || actor?.userId || 'manager_portal', refundId]
      );

      return NextResponse.json({
        success: true,
        message: `Đã ${newStatus === 'APPROVED' ? 'chấp thuận' : 'từ chối'} hoàn tiền thành công!`,
      });
    }

    // 3. CẬP NHẬT GHI CHÚ VẬN HÀNH & PHÂN CÔNG
    if (action === 'UPDATE_OPERATIONS') {
      const { notes, assigned_to, delivered_at } = body;
      await queryDb(
        'order_db',
        `UPDATE orders 
         SET notes = COALESCE($1, notes),
             assigned_to = COALESCE($2, assigned_to),
             delivered_at = COALESCE($3, delivered_at),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [notes || null, assigned_to || null, delivered_at || null, orderId]
      );

      return NextResponse.json({
        success: true,
        message: 'Đã cập nhật thông tin vận hành đơn hàng!',
      });
    }

    // 4. ĐỐI SOÁT VIETQR THỦ CÔNG (Mặc định nếu không có action đặc biệt)
    const canReconcile = await checkPermission(effectiveRole, 'orders:reconcile_vietqr');
    if (!canReconcile) {
      return NextResponse.json(
        { error: 'Tài khoản không có thẩm quyền đối soát thanh toán VietQR (orders:reconcile_vietqr)!' },
        { status: 403 }
      );
    }

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
    const { orderId, action, actor, branchId } = body;

    if (!orderId || !action) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc (orderId, action)' }, { status: 400 });
    }

    const orderRows = await queryDb<any>('order_db', `SELECT * FROM orders WHERE id = $1`, [orderId]);
    if (orderRows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }
    const order = orderRows[0];

    const actorData = await resolveActorRole(request);
    if (!actorData) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để xử lý đơn hàng!' }, { status: 401 });
    }
    const effectiveRole = actorData.role;

    const canProcess = await checkPermission(effectiveRole, 'orders:process');
    if (!canProcess) {
      return NextResponse.json(
        { error: 'Tài khoản không có thẩm quyền xử lý đơn hàng (orders:process)!' },
        { status: 403 }
      );
    }

    // R4: Ràng buộc chi nhánh nhân viên
    const headerBranch = request.headers.get('x-branch-id');
    const effectiveBranch = headerBranch || branchId;
    const isGlobal = effectiveRole === 'ADMIN';

    if (!isGlobal && effectiveBranch && effectiveBranch !== 'ALL' && effectiveBranch !== order.branch_id) {
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
    } else if (action === 'CANCEL') {
      nextStatus = 'CANCELLED';
      // Hoàn trả reservations trong inventory_db nếu chưa hoàn tất
      try {
        await queryDb(
          'inventory_db',
          `UPDATE reservations SET status = 'CANCELLED' WHERE order_id = $1 AND status IN ('ACTIVE', 'CONFIRMED')`,
          [orderId]
        );
      } catch (invErr) {
        console.error('Lỗi hủy reservations:', invErr);
      }
    } else {
      return NextResponse.json({ error: 'Action không hợp lệ (hỗ trợ: CONFIRM, PREPARE, HANDOVER, COMPLETE, CANCEL)' }, { status: 400 });
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

