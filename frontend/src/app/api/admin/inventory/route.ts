import { NextRequest, NextResponse } from 'next/server';
import { queryDb, withTransaction } from '@/lib/db';
import { resolveActorRole, checkPermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const actorData = await resolveActorRole(request);
    if (!actorData) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để truy cập dữ liệu tồn kho!' }, { status: 401 });
    }
    const canView = await checkPermission(actorData.role, 'inventory:view');
    if (!canView && actorData.role !== 'ADMIN' && actorData.role !== 'BRANCH_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Bạn không có quyền xem tồn kho (inventory:view)!' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    let stockQuery = `SELECT * FROM stock_levels`;
    const params: any[] = [];
    if (branchId && branchId !== 'ALL') {
      stockQuery += ` WHERE branch_id = $1`;
      params.push(branchId);
    }
    stockQuery += ` ORDER BY sku ASC`;

    const stockLevels = await queryDb('inventory_db', stockQuery, params);
    const transfers = await queryDb('inventory_db', `SELECT * FROM stock_transfers ORDER BY created_at DESC`);
    const movements = await queryDb('inventory_db', `SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 30`);
    const auditStats = await queryDb('inventory_db', `
      SELECT 
        (SELECT COALESCE(SUM(on_hand), 0) FROM stock_levels) as total_on_hand,
        (SELECT COALESCE(SUM(quantity), 0) FROM stock_movements) as total_movements
    `);

    let finalStockLevels = stockLevels;
    if (!finalStockLevels || finalStockLevels.length === 0) {
      try {
        const { API_BASE_URL } = await import('@/lib/api');
        const bParam = branchId && branchId !== 'ALL' ? `?branchId=${branchId}` : '';
        const invRes = await fetch(`${API_BASE_URL}/inventory/stocks${bParam}`, {
          headers: { 'Content-Type': 'application/json' },
        });
        if (invRes.ok) {
          const invData = await invRes.json();
          finalStockLevels = invData.data || [];
        }
      } catch (fallbackErr) {
        console.error('[AdminInventory] Fallback API error:', fallbackErr);
      }
    }

    return NextResponse.json({
      stockLevels: finalStockLevels,
      transfers,
      movements,
      audit: auditStats[0] || { total_on_hand: 0, total_movements: 0 },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Tạo yêu cầu điều chuyển kho mới (R4 & R8)
export async function POST(request: NextRequest) {
  try {
    const { fromBranchId, toBranchId, sku, quantity, actor, actorBranchId } = await request.json();

    const actorData = await resolveActorRole(request);
    if (!actorData) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để thực hiện thao tác này!' }, { status: 401 });
    }
    const effectiveRole = actorData.role;

    const canCreate = await checkPermission(effectiveRole, 'inventory:transfer_create');
    if (!canCreate) {
      return NextResponse.json(
        { error: 'Tài khoản không có thẩm quyền tạo phiếu điều chuyển kho (inventory:transfer_create)!' },
        { status: 403 }
      );
    }

    // R4: Ràng buộc chi nhánh: Nhân viên và Quản lý chỉ được thao tác tại chi nhánh nguồn được phân công.
    // Quản trị viên (ADMIN) có toàn quyền trên toàn hệ thống (hoặc khi chọn chi nhánh ALL).
    const headerBranch = request.headers.get('x-branch-id');
    const effectiveBranch = headerBranch || actorBranchId;
    const isGlobal = effectiveRole === 'ADMIN';

    if (!isGlobal && effectiveBranch && effectiveBranch !== 'ALL' && effectiveBranch !== fromBranchId) {
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

    const transferId = `TRF-${Date.now()}-${Math.floor(Math.random() * 9000) + 1000}`;

    // R8: Điều chuyển: Hàng chưa trừ kho gửi khi mới tạo DRAFT/APPROVED.
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
    const headerBranch = request.headers.get('x-branch-id');
    const { transferId, action, receivedQty, discrepancyReason, actor, actorBranchId } = await request.json();
    const effectiveBranch = headerBranch || actorBranchId;

    const transferRows = await queryDb('inventory_db', `SELECT * FROM stock_transfers WHERE id = $1`, [transferId]);
    if (transferRows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy phiếu điều chuyển' }, { status: 404 });
    }
    const transfer = transferRows[0];

    const actorData = await resolveActorRole(request);
    if (!actorData) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để thực hiện thao tác này!' }, { status: 401 });
    }
    const effectiveRole = actorData.role;
    const isGlobal = effectiveRole === 'ADMIN';

    if (action === 'DISPATCH') {
      const canDispatch = await checkPermission(effectiveRole, 'inventory:transfer_dispatch');
      if (!canDispatch) {
        return NextResponse.json(
          { error: 'Tài khoản không có thẩm quyền xuất kho điều chuyển (inventory:transfer_dispatch)!' },
          { status: 403 }
        );
      }

      // R4: Nhân viên và Quản lý chỉ được xuất kho điều chuyển tại chi nhánh gửi from_branch_id (ADMIN toàn quyền)
      if (!isGlobal && effectiveBranch && effectiveBranch !== 'ALL' && effectiveBranch !== transfer.from_branch_id) {
        return NextResponse.json(
          { error: 'QUY TẮC R4: Nhân viên chỉ được xuất kho điều chuyển tại chi nhánh được phân công!' },
          { status: 403 }
        );
      }

      // Idempotency / State machine gate
      if (transfer.status !== 'APPROVED') {
        return NextResponse.json(
          { error: `Phiếu điều chuyển đang ở trạng thái ${transfer.status}, không thể xuất kho lặp lại!` },
          { status: 400 }
        );
      }

      // R8 & R10: Atomic Transaction cho toàn bộ thao tác xuất kho
      return await withTransaction('inventory_db', async (client) => {
        const updateResult = await client.query(
          `UPDATE stock_levels 
           SET on_hand = on_hand - $1, updated_at = CURRENT_TIMESTAMP 
           WHERE branch_id = $2 AND sku = $3 AND (on_hand - reserved) >= $1
           RETURNING on_hand, reserved`,
          [transfer.quantity, transfer.from_branch_id, transfer.sku]
        );

        if (updateResult.rows.length === 0) {
          throw new Error('Tồn kho khả dụng tại chi nhánh gửi không đủ để xuất kho!');
        }

        // Ghi sổ cái append-only stock_movements (R10)
        await client.query(
          `INSERT INTO stock_movements (branch_id, sku, movement_type, quantity, reference_id, reason, created_by)
           VALUES ($1, $2, 'TRANSFER_OUT', $3, $4, 'Xuất kho điều chuyển', $5)`,
          [transfer.from_branch_id, transfer.sku, -transfer.quantity, transferId, actor || 'system']
        );

        // Chuyển trạng thái phiếu sang IN_TRANSIT
        await client.query(
          `UPDATE stock_transfers SET status = 'IN_TRANSIT', sent_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [transferId]
        );

        return NextResponse.json({ success: true, status: 'IN_TRANSIT' });
      });
    } else if (action === 'RECEIVE') {
      const canReceive = await checkPermission(effectiveRole, 'inventory:transfer_receive');
      if (!canReceive) {
        return NextResponse.json(
          { error: 'Tài khoản không có thẩm quyền nhận kho điều chuyển (inventory:transfer_receive)!' },
          { status: 403 }
        );
      }

      // R4: Nhân viên và Quản lý chỉ được nhận kho điều chuyển tại chi nhánh đích to_branch_id (ADMIN toàn quyền)
      if (!isGlobal && effectiveBranch && effectiveBranch !== 'ALL' && effectiveBranch !== transfer.to_branch_id) {
        return NextResponse.json(
          { error: 'QUY TẮC R4: Nhân viên chỉ được nhận kho điều chuyển tại chi nhánh đích được phân công!' },
          { status: 403 }
        );
      }

      // Idempotency / State machine gate
      if (transfer.status !== 'IN_TRANSIT') {
        return NextResponse.json(
          { error: `Phiếu điều chuyển đang ở trạng thái ${transfer.status}, chỉ phiếu IN_TRANSIT mới được nhập kho!` },
          { status: 400 }
        );
      }

      const actualReceived = receivedQty !== undefined ? parseInt(receivedQty, 10) : transfer.quantity;
      if (isNaN(actualReceived) || actualReceived < 0 || actualReceived > transfer.quantity) {
        return NextResponse.json({ error: 'Số lượng thực nhận không hợp lệ' }, { status: 400 });
      }

      const discrepancy = transfer.quantity - actualReceived;
      const finalStatus = discrepancy > 0 ? 'COMPLETED_WITH_DISCREPANCY' : 'RECEIVED';

      // R8 & R10: Atomic Transaction cho toàn bộ thao tác nhập kho đích
      return await withTransaction('inventory_db', async (client) => {
        // Cộng kho đích
        await client.query(
          `INSERT INTO stock_levels (branch_id, sku, item_type, on_hand, reserved)
           VALUES ($1, $2, 'STANDARD', $3, 0)
           ON CONFLICT (branch_id, sku)
           DO UPDATE SET on_hand = stock_levels.on_hand + $3, updated_at = CURRENT_TIMESTAMP`,
          [transfer.to_branch_id, transfer.sku, actualReceived]
        );

        // Ghi sổ cái nhập kho đích
        await client.query(
          `INSERT INTO stock_movements (branch_id, sku, movement_type, quantity, reference_id, reason, created_by)
           VALUES ($1, $2, 'TRANSFER_IN', $3, $4, 'Nhập kho từ điều chuyển', $5)`,
          [transfer.to_branch_id, transfer.sku, actualReceived, transferId, actor || 'system']
        );

        // Cập nhật phiếu điều chuyển
        await client.query(
          `UPDATE stock_transfers 
           SET status = $1, received_quantity = $2, discrepancy_quantity = $3, discrepancy_reason = $4, received_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
          [finalStatus, actualReceived, discrepancy, discrepancyReason || null, transferId]
        );

        return NextResponse.json({ success: true, status: finalStatus, actualReceived, discrepancy });
      });
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
