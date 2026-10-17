import { NextRequest, NextResponse } from 'next/server';
import { queryDb, withTransaction } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;
    if (!user || user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');

    let query = `
      SELECT po.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', pol.id,
              'sku', pol.sku,
              'ordered_qty', pol.ordered_qty,
              'received_qty', pol.received_qty,
              'unit_cost', pol.unit_cost
            )
          ) FILTER (WHERE pol.id IS NOT NULL), '[]'
        ) as lines
      FROM purchase_orders po
      LEFT JOIN purchase_order_lines pol ON po.id = pol.po_id
    `;

    const params: any[] = [];
    if (branchId && branchId !== 'ALL') {
      params.push(branchId);
      query += ` WHERE po.branch_id = $1`;
    }

    query += ` GROUP BY po.id ORDER BY po.created_at DESC`;

    const orders = await queryDb('inventory_db', query, params);
    return NextResponse.json({ purchaseOrders: orders });
  } catch (err: any) {
    console.error('Error fetching purchase orders:', err);
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

    // 1. Tạo đơn nhập kho mới (DRAFT)
    if (action === 'CREATE_PO') {
      const { branch_id, supplier_name, notes, items } = body;
      if (!branch_id || !supplier_name || !items || items.length === 0) {
        return NextResponse.json({ error: 'Thông tin phiếu nhập không đầy đủ' }, { status: 400 });
      }

      const poId = `PO_${Date.now()}`;
      let totalItems = 0;
      let totalCost = 0;

      items.forEach((it: any) => {
        totalItems += parseInt(it.ordered_qty, 10) || 0;
        totalCost += (parseInt(it.ordered_qty, 10) || 0) * (parseInt(it.unit_cost, 10) || 0);
      });

      await withTransaction('inventory_db', async (client) => {
        await client.query(
          `INSERT INTO purchase_orders (id, branch_id, supplier_name, total_items, total_cost, status, notes, created_by)
           VALUES ($1, $2, $3, $4, $5, 'DRAFT', $6, $7)`,
          [poId, branch_id, supplier_name, totalItems, totalCost, notes || '', user.username || 'staff']
        );

        for (const item of items) {
          await client.query(
            `INSERT INTO purchase_order_lines (po_id, sku, ordered_qty, unit_cost)
             VALUES ($1, $2, $3, $4)`,
            [poId, item.sku, parseInt(item.ordered_qty, 10), parseInt(item.unit_cost, 10)]
          );
        }
      });

      return NextResponse.json({ success: true, poId });
    }

    // 2. Phê duyệt đơn nhập kho (DRAFT -> APPROVED)
    if (action === 'APPROVE_PO') {
      const { poId } = body;
      await queryDb(
        'inventory_db',
        `UPDATE purchase_orders SET status = 'APPROVED', approved_by = $1 WHERE id = $2 AND status = 'DRAFT'`,
        [user.username || 'manager', poId]
      );
      return NextResponse.json({ success: true });
    }

    // 3. Nhận hàng vào kho (APPROVED -> RECEIVED) + Cập nhật tồn kho & Sổ cái R10
    if (action === 'RECEIVE_PO') {
      const { poId } = body;

      await withTransaction('inventory_db', async (client) => {
        // Lấy thông tin PO
        const poRes = await client.query(`SELECT * FROM purchase_orders WHERE id = $1 FOR UPDATE`, [poId]);
        if (poRes.rows.length === 0) throw new Error('Không tìm thấy phiếu nhập kho');
        const po = poRes.rows[0];
        if (po.status === 'RECEIVED') throw new Error('Phiếu nhập này đã được nhận hàng trước đó');

        // Lấy danh sách lines
        const linesRes = await client.query(`SELECT * FROM purchase_order_lines WHERE po_id = $1`, [poId]);
        const lines = linesRes.rows;

        // Cập nhật từng SKU vào stock_levels và ghi sổ cái stock_movements
        for (const line of lines) {
          const qty = line.ordered_qty;
          const sku = line.sku;

          // 1. Tăng tồn kho thực tế
          const stockCheck = await client.query(
            `SELECT id, on_hand FROM stock_levels WHERE branch_id = $1 AND sku = $2 FOR UPDATE`,
            [po.branch_id, sku]
          );

          if (stockCheck.rows.length > 0) {
            await client.query(
              `UPDATE stock_levels SET on_hand = on_hand + $1 WHERE id = $2`,
              [qty, stockCheck.rows[0].id]
            );
          } else {
            await client.query(
              `INSERT INTO stock_levels (branch_id, sku, item_type, on_hand, reserved)
               VALUES ($1, $2, 'RACKET', $3, 0)`,
              [po.branch_id, sku, qty]
            );
          }

          // 2. Cập nhật received_qty trong line
          await client.query(
            `UPDATE purchase_order_lines SET received_qty = $1 WHERE id = $2`,
            [qty, line.id]
          );

          // 3. Ghi sổ cái bất biến R10 (stock_movements)
          await client.query(
            `INSERT INTO stock_movements (id, branch_id, sku, movement_type, quantity, reason, created_by)
             VALUES (gen_random_uuid(), $1, $2, 'PURCHASE_RECEIPT', $3, $4, $5)`,
            [
              po.branch_id,
              sku,
              qty,
              `Nhập kho từ NCC: ${po.supplier_name} theo phiếu ${po.id}`,
              user.username || 'staff',
            ]
          );
        }

        // Cập nhật trạng thái PO thành RECEIVED
        await client.query(
          `UPDATE purchase_orders SET status = 'RECEIVED', received_at = NOW() WHERE id = $1`,
          [poId]
        );
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    console.error('Error handling purchase orders action:', err);
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
