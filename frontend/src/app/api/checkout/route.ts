import { NextRequest, NextResponse } from 'next/server';
import { queryDb, withTransaction } from '@/lib/db';
import { createOrderApi } from '@/lib/api';
import crypto from 'crypto';

function crc16_ccitt(str: string): string {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function generateVietQRPayload(bin: string, account: string, amount: number, memo: string): string {
  const f38_00 = '0010A000000727';
  const f38_01_val = `0006${bin}01${account.length.toString().padStart(2, '0')}${account}`;
  const f38_01 = `01${f38_01_val.length.toString().padStart(2, '0')}${f38_01_val}`;
  const f38_val = f38_00 + f38_01;
  const f38 = `38${f38_val.length.toString().padStart(2, '0')}${f38_val}`;

  const amountStr = amount.toString();
  const f54 = `54${amountStr.length.toString().padStart(2, '0')}${amountStr}`;

  // Clean memo
  const cleanMemo = memo.replace(/[^A-Za-z0-9]/g, '');
  const f62_08 = `08${cleanMemo.length.toString().padStart(2, '0')}${cleanMemo}`;
  const f62 = `62${f62_08.length.toString().padStart(2, '0')}${f62_08}`;

  const raw = `000201010212${f38}520460115303704${f54}5802VN${f62}6304`;
  const crc = crc16_ccitt(raw);
  return raw + crc;
}

export async function POST(request: NextRequest) {
  let reservedItems: Array<{ sku: string; branchId: string; quantity: number; isUnique: boolean }> = [];
  let secondhandReserved: string[] = [];
  let inventoryCommitted = false;
  let orderId: string = '';

  try {
    const body = await request.json();
    const {
      customerId,
      customerName,
      customerPhone,
      shippingAddress,
      fulfillmentType = 'DELIVERY', // DELIVERY or STORE_PICKUP
      branchId = 'BR_HCM_01',
      paymentMethod = 'VIETQR', // COD or VIETQR
      items,
      idempotencyKey,
    } = body;

    // 0. Delegate to Spring Boot Backend API if configured / reachable
    try {
      if (customerName && customerPhone && items && Array.isArray(items) && items.length > 0) {
        const backendOrder = await createOrderApi({
          customerId,
          customerName,
          customerPhone,
          shippingAddress,
          fulfillmentType,
          branchId,
          paymentMethod,
          idempotencyKey,
          items,
          lines: items.map((i: any) => ({
            sku: i.sku || i.id,
            quantity: i.quantity || 1,
          })),
        }, idempotencyKey);

        if (backendOrder && (backendOrder.data || backendOrder.id || backendOrder.orderId)) {
          const o = backendOrder.data || backendOrder;
          return NextResponse.json({
            success: true,
            orderId: o.id || o.orderId,
            totalAmount: o.totalAmount,
            status: o.status || 'CONFIRMED',
            pickupCode: o.pickupCode,
            vietqr: o.vietqr || (o.vietqrUrl ? {
              payload: o.vietqrPayload,
              qrUrl: o.vietqrUrl,
              bankName: 'MB Bank (Quân Đội)',
              accountNumber: '9999888877',
              accountName: 'BADMINTON SHOP',
              amount: o.totalAmount,
              transferContent: o.id || o.orderId,
            } : null),
          });
        }
      }
    } catch {
      // Backend not running / fallback to local DB transaction below
    }

    // 0. Upfront Idempotency Check
    if (idempotencyKey) {
      const existingOrders = await queryDb<any>(
        'order_db',
        `SELECT * FROM orders WHERE idempotency_key = $1`,
        [idempotencyKey]
      );
      if (existingOrders.length > 0) {
        const existingOrder = existingOrders[0];
        const payments = await queryDb<any>(
          'order_db',
          `SELECT * FROM payments WHERE order_id = $1`,
          [existingOrder.id]
        );
        const p = payments[0];
        return NextResponse.json({
          success: true,
          orderId: existingOrder.id,
          totalAmount: parseInt(existingOrder.total_amount, 10),
          status: existingOrder.status,
          pickupCode: existingOrder.pickup_code,
          vietqr: p?.vietqr_payload ? {
            payload: p.vietqr_payload,
            qrUrl: `https://img.vietqr.io/image/970422-9999888877-compact2.png?amount=${existingOrder.total_amount}&addInfo=${encodeURIComponent(existingOrder.id)}&accountName=BADMINTON%20SHOP`,
            bankName: 'MB Bank (Quân Đội)',
            accountNumber: '9999888877',
            accountName: 'BADMINTON SHOP',
            amount: parseInt(existingOrder.total_amount, 10),
            transferContent: existingOrder.id,
          } : null,
        });
      }
    }

    // 1. Validation
    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp họ tên và số điện thoại người nhận' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Đơn hàng phải chứa ít nhất 1 sản phẩm' },
        { status: 400 }
      );
    }

    const effectiveCustomerId = customerId || crypto.randomUUID();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    orderId = `DH-${dateStr}-${randSuffix}`;

    // Thời gian hết hạn giữ chỗ: QR = 30 phút, COD = 12 giờ (R3)
    const expiryMinutes = paymentMethod === 'VIETQR' ? 30 : 12 * 60;
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

    const pickupCode = fulfillmentType === 'STORE_PICKUP' ? `PK-${Math.floor(1000 + Math.random() * 9000)}` : null;

    // 2. Tra cứu snapshot giá và chính sách bảo hành (R9)
    const lineSnapshots: Array<{
      sku: string;
      branchId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
      warrantySnapshot: string;
      isUnique: boolean;
    }> = [];

    let totalAmount = 0;

    for (const item of items) {
      const { sku, quantity = 1 } = item;
      const qty = parseInt(quantity, 10);
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ error: `Số lượng không hợp lệ cho SKU: ${sku}` }, { status: 400 });
      }

      if (sku.startsWith('SH-')) {
        // Vợt cũ (Unique Unit - R2)
        if (qty > 1) {
          return NextResponse.json(
            { error: `QUY TẮC R2: Vợt cũ (${sku}) là đơn vị duy nhất, số lượng giữ chỗ tối đa là 1!` },
            { status: 400 }
          );
        }

        // C2: Khóa nguyên tử trạng thái RESERVED cho vợt cũ trong secondhand_db
        const unitRows = await queryDb(
          'secondhand_db',
          `UPDATE secondhand_units 
           SET status = 'RESERVED', updated_at = CURRENT_TIMESTAMP 
           WHERE id = $1 AND status = 'APPROVED_FOR_SALE' 
           RETURNING *`,
          [sku]
        );

        if (unitRows.length === 0) {
          throw new Error(`Vợt cũ ${sku} hiện không có sẵn hoặc đã được người khác đặt mua!`);
        }

        const unit = unitRows[0];
        secondhandReserved.push(sku);

        const unitPrice = parseInt(unit.resale_price, 10);
        const subtotal = unitPrice * qty;
        totalAmount += subtotal;

        lineSnapshots.push({
          sku,
          branchId: unit.branch_id, // C7: Đơn vị duy nhất nằm tại chi nhánh sở tại của nó
          productName: `[Cũ Hạng ${unit.grade}] ${unit.model_name}`,
          unitPrice,
          quantity: qty,
          subtotal,
          warrantySnapshot: `Chính sách bảo hành kết cấu khung vợt cũ ${unit.warranty_days} ngày. Serial: ${unit.serial_number || 'N/A'}.`,
          isUnique: true,
        });
      } else {
        // Vợt mới tiêu chuẩn (SKU - catalog_db)
        const skuRows = await queryDb(
          'catalog_db',
          `SELECT s.*, p.name as product_name, p.warranty_months 
           FROM skus s 
           JOIN products p ON s.product_id = p.id 
           WHERE s.id = $1 AND s.is_active = true`,
          [sku]
        );

        if (skuRows.length === 0) {
          return NextResponse.json({ error: `Không tìm thấy thông tin sản phẩm cho mã SKU: ${sku}` }, { status: 400 });
        }

        const s = skuRows[0];
        const unitPrice = parseInt(s.price, 10);
        const subtotal = unitPrice * qty;
        totalAmount += subtotal;

        lineSnapshots.push({
          sku,
          branchId: item.branchId || branchId,
          productName: `${s.product_name} (${s.weight}-${s.grip_size})`,
          unitPrice,
          quantity: qty,
          subtotal,
          warrantySnapshot: `Chính sách POL_NEW_12M: Bảo hành khung vợt mới ${s.warranty_months || 12} tháng. 1 đổi 1 hoặc sửa chữa khung nếu nứt gãy tự nhiên do lỗi vật liệu NSX. Cước tối đa ${s.max_tension_lbs || 28}lbs.`,
          isUnique: false,
        });
      }
    }

    // 3. Khóa tồn kho nguyên tử bằng Transaction (R1 & R2)
    // Sắp xếp items theo branchId và sku để đảm bảo thứ tự khóa nhất quán (chống Deadlock - C1)
    await withTransaction('inventory_db', async (client) => {
      const sortedLines = [...lineSnapshots].sort((a, b) =>
        (a.branchId + a.sku).localeCompare(b.branchId + b.sku)
      );

      for (let i = 0; i < sortedLines.length; i++) {
        const line = sortedLines[i];
        const res = await client.query(
          `UPDATE stock_levels 
           SET reserved = reserved + $1, updated_at = CURRENT_TIMESTAMP 
           WHERE branch_id = $2 AND sku = $3 AND (on_hand - reserved) >= $1
           RETURNING on_hand, reserved, item_type`,
          [line.quantity, line.branchId, line.sku]
        );

        if (res.rows.length === 0) {
          throw new Error(`Sản phẩm ${line.sku} tại chi nhánh ${line.branchId} đã hết hàng hoặc không đủ tồn kho khả dụng!`);
        }

        reservedItems.push({
          sku: line.sku,
          branchId: line.branchId,
          quantity: line.quantity,
          isUnique: line.isUnique,
        });

        // Tạo bản ghi reservations (R3)
        const resKey = idempotencyKey ? `${idempotencyKey}-${line.sku}-${i}` : `RES-${orderId}-${line.sku}-${i}`;
        await client.query(
          `INSERT INTO reservations (idempotency_key, order_id, branch_id, sku, quantity, status, expires_at)
           VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6)`,
          [resKey, orderId, line.branchId, line.sku, line.quantity, expiresAt]
        );
      }
    });
    inventoryCommitted = true;

    // 5. Tạo đơn hàng và snapshot bất biến trong order_db (R9)
    await withTransaction('order_db', async (client) => {
      // Đơn hàng orders
      await client.query(
        `INSERT INTO orders (
          id, customer_id, customer_name, customer_phone, shipping_address,
          fulfillment_type, branch_id, pickup_code, payment_method,
          total_amount, status, idempotency_key
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          orderId,
          effectiveCustomerId,
          customerName,
          customerPhone,
          shippingAddress || (fulfillmentType === 'STORE_PICKUP' ? 'Nhận tại quầy chi nhánh' : 'Giao hàng tận nơi'),
          fulfillmentType,
          branchId,
          pickupCode,
          paymentMethod,
          totalAmount,
          paymentMethod === 'VIETQR' ? 'PENDING_RESERVATION' : 'CONFIRMED',
          idempotencyKey || `IDEM-${orderId}`,
        ]
      );

      // Dòng đơn order_lines (Snapshot bất biến R9)
      for (const line of lineSnapshots) {
        await client.query(
          `INSERT INTO order_lines (
            order_id, sku, product_name_snapshot, unit_price_snapshot,
            quantity, subtotal, warranty_policy_snapshot
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            orderId,
            line.sku,
            line.productName,
            line.unitPrice,
            line.quantity,
            line.subtotal,
            line.warrantySnapshot,
          ]
        );
      }

      // Tạo bản ghi payments
      if (paymentMethod === 'VIETQR') {
        const payload = generateVietQRPayload('970422', '9999888877', totalAmount, orderId);
        await client.query(
          `INSERT INTO payments (order_id, payment_method, amount, status, vietqr_payload)
           VALUES ($1, 'VIETQR', $2, 'PENDING', $3)`,
          [orderId, totalAmount, payload]
        );
      } else {
        await client.query(
          `INSERT INTO payments (order_id, payment_method, amount, status)
           VALUES ($1, 'COD', $2, 'PENDING')`,
          [orderId, totalAmount]
        );
      }
    });

    // 6. Trả về kết quả
    const vietqrData = paymentMethod === 'VIETQR' ? {
      payload: generateVietQRPayload('970422', '9999888877', totalAmount, orderId),
      qrUrl: `https://img.vietqr.io/image/970422-9999888877-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(orderId)}&accountName=BADMINTON%20SHOP`,
      bankName: 'MB Bank (Quân Đội)',
      accountNumber: '9999888877',
      accountName: 'BADMINTON SHOP',
      amount: totalAmount,
      transferContent: orderId,
    } : null;

    return NextResponse.json({
      success: true,
      orderId,
      totalAmount,
      status: paymentMethod === 'VIETQR' ? 'PENDING_RESERVATION' : 'CONFIRMED',
      pickupCode,
      expiresAt: expiresAt.toISOString(),
      vietqr: vietqrData,
    });
  } catch (error: any) {
    // 1. Rollback secondhand units nếu đã chuyển sang RESERVED
    if (secondhandReserved.length > 0) {
      try {
        for (const sku of secondhandReserved) {
          await queryDb(
            'secondhand_db',
            `UPDATE secondhand_units SET status = 'APPROVED_FOR_SALE', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'RESERVED'`,
            [sku]
          );
        }
      } catch (shErr) {
        console.error('Lỗi rollback secondhand_units:', shErr);
      }
    }

    // 2. Compensation rollback cho inventory_db CHỈ KHI inventory transaction ĐÃ COMMIT thành công nhưng các bước sau bị lỗi
    // (Nếu inventory transaction tự nó throw error thì PostgreSQL đã tự ROLLBACK toàn bộ, không được giảm trừ thêm lần nữa)
    if (inventoryCommitted && reservedItems.length > 0) {
      try {
        await withTransaction('inventory_db', async (client) => {
          for (const item of reservedItems) {
            await client.query(
              `UPDATE stock_levels 
               SET reserved = GREATEST(0, reserved - $1), updated_at = CURRENT_TIMESTAMP 
               WHERE branch_id = $2 AND sku = $3`,
              [item.quantity, item.branchId, item.sku]
            );
            await client.query(
              `DELETE FROM reservations WHERE order_id = $1 AND sku = $2`,
              [orderId, item.sku]
            );
          }
        });
      } catch (rollbackErr) {
        console.error('Lỗi rollback kho bãi:', rollbackErr);
      }
    }

    return NextResponse.json({ error: error.message || 'Lỗi xử lý đặt hàng' }, { status: 400 });
  }
}
