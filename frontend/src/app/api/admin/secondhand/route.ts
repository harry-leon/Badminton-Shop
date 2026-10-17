import { NextRequest, NextResponse } from 'next/server';
import { queryDb, withTransaction } from '@/lib/db';
import { resolveActorRole, checkPermission } from '@/lib/rbac';

function getRacketImageForModel(model: string): string {
  const m = (model || '').toLowerCase();
  if (m.includes('800') || m.includes('nanoflare 800')) return '/images/secondhand/sh-nanoflare-800-pro.png';
  if (m.includes('77') || m.includes('astrox 77')) return '/images/secondhand/sh-astrox-77-pro.png';
  if (m.includes('88d') || m.includes('astrox 88d')) return '/images/secondhand/sh-astrox-88d-pro.png';
  if (m.includes('88s') || m.includes('astrox 88s')) return '/images/products/yonex-astrox-88s-pro.png';
  if (m.includes('100zz')) return '/images/products/yonex-astrox-100zz.png';
  if (m.includes('99') || m.includes('astrox 99')) return '/images/products/yonex-astrox-99-pro.jpg';
  if (m.includes('1000z')) return '/images/products/yonex-nanoflare-1000z.png';
  if (m.includes('arcsaber 11') || m.includes('arc 11')) return '/images/products/yonex-arcsaber-11-pro.png';
  if (m.includes('axforce 80')) return '/images/products/lining-axforce-80.jpg';
  if (m.includes('halbertec 8000')) return '/images/products/lining-halbertec-8000.jpg';
  if (m.includes('ryuga')) return '/images/products/victor-thruster-ryuga-ii.webp';
  if (m.includes('auraspeed 100x')) return '/images/products/victor-auraspeed-100x.webp';
  return '/images/secondhand/sh-astrox-88d-pro.png';
}

export async function GET(request: NextRequest) {
  try {
    const actorData = await resolveActorRole(request);
    if (!actorData) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để truy cập dữ liệu vợt cũ!' }, { status: 401 });
    }
    const canView = await checkPermission(actorData.role, 'secondhand:view');
    if (!canView && actorData.role !== 'ADMIN' && actorData.role !== 'BRANCH_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Bạn không có quyền xem dữ liệu vợt cũ (secondhand:view)!' }, { status: 403 });
    }

    const units = await queryDb(
      'secondhand_db',
      `SELECT * FROM secondhand_units ORDER BY created_at DESC`
    );
    const cases = await queryDb(
      'secondhand_db',
      `SELECT * FROM buyback_cases ORDER BY created_at DESC`
    );
    const priceTables = await queryDb(
      'secondhand_db',
      `SELECT * FROM buyback_price_tables ORDER BY model_name ASC, grade ASC`
    );
    return NextResponse.json({ units, cases, priceTables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleApproveResale(unitId: string, approvedBy: string, effectiveRole: string) {
  if (!unitId || !approvedBy) {
    return NextResponse.json({ error: 'Thiếu thông tin unitId hoặc người duyệt' }, { status: 400 });
  }

  const unitRows = await queryDb<any>(
    'secondhand_db',
    `SELECT * FROM secondhand_units WHERE id = $1`,
    [unitId]
  );
  if (unitRows.length === 0) {
    return NextResponse.json({ error: 'Không tìm thấy vợt cũ' }, { status: 404 });
  }
  const unit = unitRows[0];

  // R7 & C9: Chỉ duyệt vợt đang ở trạng thái PENDING_RESALE_APPROVAL (ngăn ngừa duyệt lặp lại gây lệch sổ cái R10)
  if (unit.status !== 'PENDING_RESALE_APPROVAL') {
    return NextResponse.json(
      {
        error: `Không thể phê duyệt mở bán vợt ở trạng thái "${unit.status}". Vợt phải ở trạng thái PENDING_RESALE_APPROVAL!`,
      },
      { status: 400 }
    );
  }

  // R7: Phê duyệt niêm yết mở bán yêu cầu quyền secondhand:approve_resale
  const canApproveResale = await checkPermission(effectiveRole, 'secondhand:approve_resale');
  if (!canApproveResale) {
    return NextResponse.json(
      { error: 'QUY TẮC R7: Nhân viên (STAFF) không có thẩm quyền phê duyệt niêm yết mở bán vợt cũ! Yêu cầu Branch Manager hoặc Admin.' },
      { status: 403 }
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
}

// POST: Tạo hồ sơ thu mua mới với kiểm tra ngưỡng R5 (±10%) và R6 (Hạng D / Giả mạo)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      branchId,
      staffId,
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
      action,
      approvedBy,
      unitId: inputUnitId,
    } = body;

    const actor = await resolveActorRole(request);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để thực hiện thao tác này!' }, { status: 401 });
    }
    const effectiveRole = actor.role;

    // C9 & R7: Phê duyệt mở bán lại vợt cũ qua POST
    if (action === 'APPROVE_FOR_SALE' || action === 'APPROVE_RESALE') {
      const targetUnitId = inputUnitId || body?.unitId;
      const approver = approvedBy || staffId || actor.userId;
      return await handleApproveResale(targetUnitId, approver, effectiveRole);
    }

    // CRUD BẢNG GIÁ THU MUA CHUẨN (buyback_price_tables)
    if (action === 'CREATE_PRICE_RULE') {
      const { model_name, grade: ruleGrade, base_price, is_active } = body;
      if (!model_name || !ruleGrade || !base_price) {
        return NextResponse.json({ error: 'Thiếu thông tin model, phân hạng hoặc giá sàn.' }, { status: 400 });
      }
      await queryDb(
        'secondhand_db',
        `INSERT INTO buyback_price_tables (model_name, grade, base_price, is_active)
         VALUES ($1, $2, $3, $4)`,
        [model_name.trim(), ruleGrade.trim().toUpperCase(), Number(base_price), is_active !== false]
      );
      return NextResponse.json({ success: true, message: `Đã thêm quy tắc giá sàn cho "${model_name}" (Hạng ${ruleGrade})` });
    }

    if (action === 'UPDATE_PRICE_RULE') {
      const { ruleId, base_price, is_active } = body;
      if (!ruleId || !base_price) {
        return NextResponse.json({ error: 'Thiếu ID quy tắc hoặc giá sàn.' }, { status: 400 });
      }
      await queryDb(
        'secondhand_db',
        `UPDATE buyback_price_tables 
         SET base_price = $1, is_active = $2
         WHERE id = $3`,
        [Number(base_price), is_active !== false, ruleId]
      );
      return NextResponse.json({ success: true, message: 'Đã cập nhật quy tắc giá thu mua thành công!' });
    }

    if (action === 'DELETE_PRICE_RULE') {
      const { ruleId } = body;
      if (!ruleId) {
        return NextResponse.json({ error: 'Thiếu ruleId cần xóa.' }, { status: 400 });
      }
      await queryDb('secondhand_db', `DELETE FROM buyback_price_tables WHERE id = $1`, [ruleId]);
      return NextResponse.json({ success: true, message: 'Đã xóa quy tắc giá thu mua.' });
    }

    const headerBranch = request.headers.get('x-branch-id');
    const isGlobalAdmin = effectiveRole === 'ADMIN';
    if (!isGlobalAdmin && headerBranch && headerBranch !== 'ALL' && headerBranch !== branchId) {
      return NextResponse.json(
        { error: 'QUY TẮC R4: Nhân viên chỉ được lập hồ sơ thu mua tại chi nhánh được phân công!' },
        { status: 403 }
      );
    }

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

    // R5: Nếu không có quyền phê duyệt giá (secondhand:approve_price) mà điều chỉnh vượt ±10%, chuyển sang PENDING_MANAGER_APPROVAL
    const canApprovePrice = await checkPermission(effectiveRole, 'secondhand:approve_price');
    if (isOutOfStaffBounds && !canApprovePrice) {
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
          JSON.stringify([getRacketImageForModel(racketModel)]),
          'PENDING_RESALE_APPROVAL', // Chờ quản lý duyệt niêm yết
        ]
      );
    });

    return NextResponse.json({ success: true, caseId, unitId, status: 'PAID' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: Phê duyệt giá thu mua vượt ngưỡng (R5) hoặc Phê duyệt niêm yết bán lại (R7) và kích hoạt tồn kho item_type = 'UNIQUE' (R2, R10)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { unitId, caseId, action, approvedBy } = body;

    const actor = await resolveActorRole(request);
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để thực hiện thao tác này!' }, { status: 401 });
    }
    const effectiveRole = actor.role;

    // Case 1: Phê duyệt hồ sơ thu mua vượt ngưỡng R5 (PENDING_MANAGER_APPROVAL -> PAID)
    if (caseId || action === 'APPROVE_CASE') {
      const targetCaseId = caseId;
      if (!targetCaseId || !approvedBy) {
        return NextResponse.json({ error: 'Thiếu thông tin caseId hoặc người duyệt' }, { status: 400 });
      }

      // R5: Kiểm tra quyền secondhand:approve_price trong dynamic RBAC
      const canApprovePrice = await checkPermission(effectiveRole, 'secondhand:approve_price');
      if (!canApprovePrice) {
        return NextResponse.json(
          { error: 'QUY TẮC R5: Nhân viên (STAFF) không có thẩm quyền phê duyệt mức giá vượt ngưỡng ±10%! Yêu cầu Branch Manager hoặc Admin.' },
          { status: 403 }
        );
      }

      const caseRows = await queryDb<any>('secondhand_db', `SELECT * FROM buyback_cases WHERE id = $1`, [targetCaseId]);
      if (caseRows.length === 0) {
        return NextResponse.json({ error: 'Không tìm thấy hồ sơ thu mua' }, { status: 404 });
      }
      const bCase = caseRows[0];
      if (bCase.status !== 'PENDING_MANAGER_APPROVAL') {
        return NextResponse.json(
          { error: `Hồ sơ ${targetCaseId} đang ở trạng thái "${bCase.status}", không thể phê duyệt lặp lại!` },
          { status: 400 }
        );
      }

      const newUnitId = `SH-20261013-00${Math.floor(Math.random() * 900) + 100}`;
      const resalePrice = Math.round(bCase.adjusted_price * 1.30);
      const warrantyDays = bCase.grade === 'A' ? 60 : 30;

      await withTransaction('secondhand_db', async (client) => {
        await client.query(
          `UPDATE buyback_cases 
           SET status = 'PAID',
               manager_approval_required = false,
               payment_method = 'BANK_TRANSFER',
               paid_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [targetCaseId]
        );

        await client.query(
          `INSERT INTO secondhand_units (
            id, buyback_case_id, serial_number, model_name, grade, branch_id,
            resale_price, warranty_days, condition_notes, images_json, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PENDING_RESALE_APPROVAL')`,
          [
            newUnitId,
            targetCaseId,
            bCase.serial_number,
            bCase.racket_model,
            bCase.grade,
            bCase.branch_id,
            resalePrice,
            warrantyDays,
            `Vợt cũ kiểm định Hạng ${bCase.grade} sau khi Quản lý duyệt giá. ${bCase.adjustment_reason || ''}`,
            JSON.stringify([getRacketImageForModel(bCase.racket_model)]),
          ]
        );
      });

      return NextResponse.json({
        success: true,
        caseId: targetCaseId,
        unitId: newUnitId,
        status: 'PAID',
        message: 'QUY TẮC R5: Quản lý chi nhánh đã phê duyệt giá thu mua thành công. Đã tạo unit chờ duyệt mở bán.'
      });
    }

    // Case 2: Phê duyệt niêm yết mở bán (R7 & C9)
    return await handleApproveResale(unitId, approvedBy || actor.userId, effectiveRole);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
