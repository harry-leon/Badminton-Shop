import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

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

    // R6: Vợt hạng D hoặc UNVERIFIED / SUSPECTED_FAKE KHÔNG được chi tiền thu mua
    if (grade === 'D' || authStatus !== 'AUTHENTIC') {
      return NextResponse.json(
        { error: 'QUY TẮC R6: Vợt Hạng D hoặc nghi ngờ giả mạo/chưa xác minh bị TỪ CHỐI THU MUA và không thể chi tiền!' },
        { status: 400 }
      );
    }

    // R5: Ngưỡng điều chỉnh giá ±10%
    const maxStaffPrice = basePrice * 1.10;
    const minStaffPrice = basePrice * 0.90;
    const isOutOfStaffBounds = adjustedPrice > maxStaffPrice || adjustedPrice < minStaffPrice;

    if (isOutOfStaffBounds && userRole === 'STAFF') {
      return NextResponse.json(
        { error: 'QUY TẮC R5: Nhân viên điều chỉnh giá vượt ngưỡng ±10% bắt buộc phải có Quản lý chi nhánh (BRANCH_MANAGER) duyệt!' },
        { status: 403 }
      );
    }

    const caseId = `BB-20261013-00${Math.floor(Math.random() * 900) + 100}`;
    const requiresManager = isOutOfStaffBounds;

    await queryDb(
      'secondhand_db',
      `INSERT INTO buyback_cases (
        id, branch_id, staff_id, seller_name, seller_phone, seller_id_card_masked,
        racket_model, serial_number, checklist_json, grade, auth_status,
        base_price_snapshot, adjusted_price, adjustment_reason,
        manager_approval_required, status, payment_method, paid_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, CURRENT_TIMESTAMP)`,
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
        requiresManager,
        'PAID',
        paymentMethod || 'BANK_TRANSFER',
      ]
    );

    // Tự động tạo unit chờ duyệt niêm yết bán lại
    const unitId = `SH-20261013-00${Math.floor(Math.random() * 900) + 100}`;
    const resalePrice = Math.round(adjustedPrice * 1.30); // Lợi nhuận gộp định hướng 30%
    const warrantyDays = grade === 'A' ? 60 : 30;

    await queryDb(
      'secondhand_db',
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
        '["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=500"]',
        'PENDING_RESALE_APPROVAL', // Chờ quản lý duyệt niêm yết
      ]
    );

    return NextResponse.json({ success: true, caseId, unitId, status: 'PAID' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Phê duyệt niêm yết bán lại (R7)
export async function PATCH(request: NextRequest) {
  try {
    const { unitId, approvedBy } = await request.json();
    if (!unitId || !approvedBy) {
      return NextResponse.json({ error: 'Thiếu thông tin unitId hoặc người duyệt' }, { status: 400 });
    }

    await queryDb(
      'secondhand_db',
      `UPDATE secondhand_units 
       SET status = 'APPROVED_FOR_SALE',
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [approvedBy, unitId]
    );

    return NextResponse.json({ success: true, unitId, status: 'APPROVED_FOR_SALE' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
