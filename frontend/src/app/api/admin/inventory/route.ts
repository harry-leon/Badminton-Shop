import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branchId');

  try {
    let stockQuery = `SELECT * FROM stock_levels`;
    const params: any[] = [];
    if (branchId) {
      stockQuery += ` WHERE branch_id = $1`;
      params.push(branchId);
    }
    stockQuery += ` ORDER BY sku ASC`;

    const stockLevels = await queryDb('inventory_db', stockQuery, params);
    const transfers = await queryDb('inventory_db', `SELECT * FROM stock_transfers ORDER BY created_at DESC`);
    const movements = await queryDb('inventory_db', `SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 30`);

    return NextResponse.json({
      stockLevels,
      transfers,
      movements,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Tạo yêu cầu điều chuyển kho mới (R4 & R8)
export async function POST(request: NextRequest) {
  try {
    const { fromBranchId, toBranchId, sku, quantity, actor, actorBranchId } = await request.json();

    // R4: Nhân viên chỉ được thao tác tại chi nhánh được phân công
    if (actorBranchId && actorBranchId !== fromBranchId && actorBranchId !== 'ADMIN') {
      return NextResponse.json(
        { error: 'QUY TẮC R4: Bạn không có quyền thao tác kho tại chi nhánh nguồn!' },
        { status: 403 }
      );
    }

    if (!fromBranchId || !toBranchId || !sku || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Dữ liệu điều chuyển không hợp lệ' }, { status: 400 });
    }

    if (fromBranchId === toBranchId) {
      return NextResponse.json({ error: 'Chi nhánh nguồn và đích không được trùng nhau' }, { status: 400 });
    }

    const transferId = `TRF-20261013-00${Math.floor(Math.random() * 900) + 100}`;

    // R8: Điều chuyển: Hàng chưa trừ kho gửi khi mới tạo DRAFT/APPROVED.
    // Trừ kho gửi ĐÚNG LÚC XUẤT THỰC TẾ (IN_TRANSIT). Khi đó hàng in_transit không bán được.
    await queryDb(
      'inventory_db',
      `INSERT INTO stock_transfers (
        id, from_branch_id, to_branch_id, sku, quantity, status, created_by, created_at
      ) VALUES ($1, $2, $3, $4, $5, 'APPROVED', $6, CURRENT_TIMESTAMP)`,
      [transferId, fromBranchId, toBranchId, sku, quantity, actor || 'ql_chi_nhanh']
    );

    return NextResponse.json({ success: true, transferId, status: 'APPROVED' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Cập nhật trạng thái điều chuyển (Xuất kho -> IN_TRANSIT, Nhận hàng -> RECEIVED/DISCREPANCY)
export async function PATCH(request: NextRequest) {
  try {
    const { transferId, action, receivedQty, discrepancyReason, actor } = await request.json();

    const transferRows = await queryDb('inventory_db', `SELECT * FROM stock_transfers WHERE id = $1`, [transferId]);
    if (transferRows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy phiếu điều chuyển' }, { status: 404 });
    }
    const transfer = transferRows[0];

    if (action === 'DISPATCH') {
      // R8: Xuất thực tế: Trừ tồn kho chi nhánh gửi và ghi sổ cái append-only
      // Atomic conditional deduction
      const updateResult = await queryDb(
        'inventory_db',
        `UPDATE stock_levels 
         SET on_hand = on_hand - $1, updated_at = CURRENT_TIMESTAMP 
         WHERE branch_id = $2 AND sku = $3 AND (on_hand - reserved) >= $1
         RETURNING on_hand, reserved`,
        [transfer.quantity, transfer.from_branch_id, transfer.sku]
      );

      if (updateResult.length === 0) {
        return NextResponse.json({ error: 'Tồn kho khả dụng tại chi nhánh gửi không đủ để xuất kho!' }, { status: 400 });
      }

      // Ghi sổ cái stock_movements
      await queryDb(
        'inventory_db',
        `INSERT INTO stock_movements (branch_id, sku, movement_type, quantity, reference_id, reason, created_by)
         VALUES ($1, $2, 'TRANSFER_OUT', $3, $4, 'Xuất kho điều chuyển', $5)`,
        [transfer.from_branch_id, transfer.sku, -transfer.quantity, transferId, actor || 'system']
      );

      await queryDb(
        'inventory_db',
        `UPDATE stock_transfers SET status = 'IN_TRANSIT', sent_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [transferId]
      );

      return NextResponse.json({ success: true, status: 'IN_TRANSIT' });
    } else if (action === 'RECEIVE') {
      // Nhận hàng: Ghi nhận tồn kho chi nhánh nhận + ghi nhận chênh lệch nếu có
      const actualReceived = receivedQty !== undefined ? parseInt(receivedQty, 10) : transfer.quantity;
      const discrepancy = transfer.quantity - actualReceived;

      // Cộng kho đích
      await queryDb(
        'inventory_db',
        `INSERT INTO stock_levels (branch_id, sku, item_type, on_hand, reserved)
         VALUES ($1, $2, 'STANDARD', $3, 0)
         ON CONFLICT (branch_id, sku)
         DO UPDATE SET on_hand = stock_levels.on_hand + $3, updated_at = CURRENT_TIMESTAMP`,
        [transfer.to_branch_id, transfer.sku, actualReceived]
      );

      // Ghi sổ cái nhập kho đích
      await queryDb(
        'inventory_db',
        `INSERT INTO stock_movements (branch_id, sku, movement_type, quantity, reference_id, reason, created_by)
         VALUES ($1, $2, 'TRANSFER_IN', $3, $4, 'Nhập kho từ điều chuyển', $5)`,
        [transfer.to_branch_id, transfer.sku, actualReceived, transferId, actor || 'system']
      );

      const finalStatus = discrepancy > 0 ? 'COMPLETED_WITH_DISCREPANCY' : 'RECEIVED';
      await queryDb(
        'inventory_db',
        `UPDATE stock_transfers 
         SET status = $1, received_quantity = $2, discrepancy_quantity = $3, discrepancy_reason = $4, received_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [finalStatus, actualReceived, discrepancy, discrepancyReason || null, transferId]
      );

      return NextResponse.json({ success: true, status: finalStatus, actualReceived, discrepancy });
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
