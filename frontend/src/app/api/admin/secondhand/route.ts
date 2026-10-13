import { NextRequest, NextResponse } from 'next/server';
import { queryDb, withTransaction } from '@/lib/db';

export async function GET() {
  try {
    const units = await queryDb(
      'secondhand_db',
      `SELECT * FROM secondhand_units ORDER BY created_at DESC`
    );
    const cases = await queryDb(
      'secondhand_db',
      `SELECT * FROM buyback_cases ORDER BY created_at DESC`
    );
    return NextResponse.json({ units, cases });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Tạo hồ sơ thu mua mới với kiểm tra ngưỡng R5 (±10%) và R6 (Hạng D / Giả mạo)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      branchId,
      staffId,
      userRole,
      sellerName,
      sellerPhone,
      sellerIdCardMasked,
      racketModel,
      serialNumber,
      checklistJson,
      grade,
      authStatus,
      basePrice,
      adjustedPrice,
      adjustmentReason,
      paymentMethod,
    } = body;

    const caseId = `BB-20261013-00${Math.floor(Math.random() * 900) + 100}`;

    // R6: Vợt hạng D hoặc UNVERIFIED / SUSPECTED_FAKE KHÔNG được chi tiền thu mua
    // NHƯNG vẫn lưu vào buyback_cases với trạng thái REJECTED để audit trail
    if (grade === 'D' || authStatus !== 'AUTHENTIC') {
      await queryDb(
        'secondhand_db',
        `INSERT INTO buyback_cases (
          id, branch_id, staff_id, seller_name, seller_phone, seller_id_card_masked,
          racket_model, serial_number, checklist_json, grade, auth_status,
          base_price_snapshot, adjusted_price, adjustment_reason,
          manager_approval_required, status, payment_method, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'REJECTED', NULL, NULL)`,
        [
          caseId,
          branchId,
          staffId,
          sellerName,
          sellerPhone,
          sellerIdCardMasked,
          racketModel,
          serialNumber,
          JSON.stringify(checklistJson || {}),
          grade,
          authStatus,
          basePrice,
          adjustedPrice,
          adjustmentReason || 'Từ chối thu mua do không đạt chuẩn chất lượng / nguồn gốc (R6)',
          false,
        ]
      );

      return NextResponse.json({
        success: true,
        caseId,
        status: 'REJECTED',
        message: 'QUY TẮC R6: Vợt Hạng D hoặc không rõ nguồn gốc bị TỪ CHỐI THU MUA và không thể chi tiền. Biên bản REJECTED đã được lưu vào hệ thống để kiểm toán.',
      });
    }

    // R5: Ngưỡng điều chỉnh giá ±10%
    const maxStaffPrice = basePrice * 1.10;
    const minStaffPrice = basePrice * 0.90;
    const isOutOfStaffBounds = adjustedPrice > maxStaffPrice || adjustedPrice < minStaffPrice;

    // R5: Nếu nhân viên điều chỉnh giá vượt ±10%, lưu hồ sơ trạng thái PENDING_MANAGER_APPROVAL
    if (isOutOfStaffBounds && userRole === 'STAFF') {
      await queryDb(
        'secondhand_db',
        `INSERT INTO buyback_cases (
          id, branch_id, staff_id, seller_name, seller_phone, seller_id_card_masked,
          racket_model, serial_number, checklist_json, grade, auth_status,
          base_price_snapshot, adjusted_price, adjustment_reason,
          manager_approval_required, status, payment_method, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'PENDING_MANAGER_APPROVAL', NULL, NULL)`,
        [
          caseId,
          branchId,
          staffId,
          sellerName,
          sellerPhone,
          sellerIdCardMasked,
          racketModel,
          serialNumber,
          JSON.stringify(checklistJson || {}),
          grade,
          authStatus,
          basePrice,
          adjustedPrice,
          adjustmentReason || 'Mức giá vượt ngưỡng ±10%, chờ Quản lý duyệt',
          true,
        ]
      );

      return NextResponse.json({
        success: true,
        caseId,
        status: 'PENDING_MANAGER_APPROVAL',
        message: 'QUY TẮC R5: Mức giá điều chỉnh vượt ngưỡng ±10%. Hồ sơ đã được lưu ở trạng thái chờ Quản lý chi nhánh (BRANCH_MANAGER) phê duyệt.',
      });
    }

    // Hợp lệ: Giá trong ngưỡng hoặc Quản lý trực tiếp duyệt -> Trạng thái PAID
    const unitId = `SH-20261013-00${Math.floor(Math.random() * 900) + 100}`;
    const resalePrice = Math.round(adjustedPrice * 1.30); // Lợi nhuận gộp định hướng 30%
    const warrantyDays = grade === 'A' ? 60 : 30;

    await withTransaction('secondhand_db', async (client) => {
      await client.query(
        `INSERT INTO buyback_cases (
          id, branch_id, staff_id, seller_name, seller_phone, seller_id_card_masked,
          racket_model, serial_number, checklist_json, grade, auth_status,
          base_price_snapshot, adjusted_price, adjustment_reason,
          manager_approval_required, status, payment_method, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'PAID', $16, CURRENT_TIMESTAMP)`,
        [
          caseId,
          branchId,
          staffId,
          sellerName,
          sellerPhone,
          sellerIdCardMasked,
          racketModel,
          serialNumber,
          JSON.stringify(checklistJson || {}),
          grade,
          authStatus,
          basePrice,
          adjustedPrice,
          adjustmentReason || 'Thu mua theo quy chuẩn',
          isOutOfStaffBounds,
          paymentMethod || 'BANK_TRANSFER',
        ]
      );

      await client.query(
        `INSERT INTO secondhand_units (
          id, buyback_case_id, serial_number, model_name, grade, branch_id,
          resale_price, warranty_days, condition_notes, images_json, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          unitId,
          caseId,
          serialNumber,
          racketModel,
          grade,
          branchId,
          resalePrice,
          warrantyDays,
          `Vợt cũ kiểm định Hạng ${grade}. ${adjustmentReason || ''}`,
          '["/images/secondhand/sh-astrox-88d-pro.png"]',
          'PENDING_RESALE_APPROVAL', // Chờ quản lý duyệt niêm yết
        ]
      );
    });

    return NextResponse.json({ success: true, caseId, unitId, status: 'PAID' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Phê duyệt niêm yết bán lại (R7) và kích hoạt tồn kho item_type = 'UNIQUE' (R2, R10)
export async function PATCH(request: NextRequest) {
  try {
    const { unitId, approvedBy } = await request.json();
    if (!unitId || !approvedBy) {
      return NextResponse.json({ error: 'Thiếu thông tin unitId hoặc người duyệt' }, { status: 400 });
    }

    const unitRows = await queryDb(
      'secondhand_db',
      `SELECT * FROM secondhand_units WHERE id = $1`,
      [unitId]
    );
    if (unitRows.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy vợt cũ' }, { status: 404 });
    }
    const unit = unitRows[0];

    // R7: Chỉ duyệt vợt đang ở trạng thái PENDING_RESALE_APPROVAL (ngăn ngừa duyệt lặp lại gây lệch sổ cái R10)
    if (unit.status !== 'PENDING_RESALE_APPROVAL') {
      return NextResponse.json(
        {
          error: `Không thể phê duyệt mở bán vợt ở trạng thái "${unit.status}". Vợt phải ở trạng thái PENDING_RESALE_APPROVAL!`,
        },
        { status: 400 }
      );
    }

    let secondhandCommitted = false;
    try {
      // Cập nhật trạng thái unit trong secondhand_db bằng withTransaction
      await withTransaction('secondhand_db', async (client) => {
        await client.query(
          `UPDATE secondhand_units 
           SET status = 'APPROVED_FOR_SALE',
               approved_by = $1,
               approved_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND status = 'PENDING_RESALE_APPROVAL'`,
          [approvedBy, unitId]
        );
      });
      secondhandCommitted = true;

      // Thêm tồn kho item_type = 'UNIQUE' vào inventory_db và ghi sổ cái stock_movements bằng withTransaction
      await withTransaction('inventory_db', async (client) => {
        await client.query(
          `INSERT INTO stock_levels (branch_id, sku, item_type, on_hand, reserved, updated_at)
           VALUES ($1, $2, 'UNIQUE', 1, 0, CURRENT_TIMESTAMP)
           ON CONFLICT (branch_id, sku)
           DO UPDATE SET on_hand = 1, item_type = 'UNIQUE', updated_at = CURRENT_TIMESTAMP`,
          [unit.branch_id, unitId]
        );

        await client.query(
          `INSERT INTO stock_movements (branch_id, sku, movement_type, quantity, reference_id, reason, created_by)
           VALUES ($1, $2, 'INBOUND', 1, $3, $4, $5)`,
          [
            unit.branch_id,
            unitId,
            unit.buyback_case_id,
            `Nhập kho vợt cũ Hạng ${unit.grade} (${unit.model_name}) sau khi duyệt mở bán`,
            approvedBy,
          ]
        );
      });

      return NextResponse.json({ success: true, unitId, status: 'APPROVED_FOR_SALE' });
    } catch (err: any) {
      if (secondhandCommitted) {
        // Compensating rollback nếu inventory_db thất bại
        try {
          await queryDb(
            'secondhand_db',
            `UPDATE secondhand_units SET status = 'PENDING_RESALE_APPROVAL', approved_by = NULL, approved_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [unitId]
          );
        } catch (compErr) {
          console.error('Lỗi compensation secondhand_db:', compErr);
        }
      }
      throw err;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
