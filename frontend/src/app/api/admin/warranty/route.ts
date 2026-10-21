import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { resolveActorRole, checkPermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const actorData = await resolveActorRole(request);
    if (!actorData) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để truy cập dữ liệu bảo hành!' }, { status: 401 });
    }
    const canView = await checkPermission(actorData.role, 'warranty:view');
    if (!canView && actorData.role !== 'ADMIN' && actorData.role !== 'BRANCH_MANAGER') {
      return NextResponse.json({ error: 'Forbidden: Bạn không có quyền xem dữ liệu bảo hành (warranty:view)!' }, { status: 403 });
    }

    const claims = await queryDb(
      'warranty_db',
      `SELECT * FROM warranty_claims ORDER BY created_at DESC`
    );
    const events = await queryDb(
      'warranty_db',
      `SELECT * FROM claim_events ORDER BY created_at DESC LIMIT 50`
    );
    const policies = await queryDb(
      'warranty_db',
      `SELECT * FROM warranty_policies ORDER BY id ASC`
    );
    let finalClaims = claims;
    let finalEvents = events;
    let finalPolicies = policies;

    const DEFAULT_POLICIES = [
      { id: 'WP-RACKET-12M', name: 'Bảo hành Vợt Cầu Lông Chính Hãng', duration_months: 12, coverage_type: 'FRAME_CRACK', terms_text: 'Bảo hành lỗi rạn nứt khung do nhà sản xuất (Yonex, Victor, Lining). Không bảo hành do va quẹt kiếm vợt hoặc đan cước vượt mức căng tối đa.' },
      { id: 'WP-SHOES-03M', name: 'Bảo hành Giày Cầu Lông', duration_months: 3, coverage_type: 'SOLE_DETACH', terms_text: 'Bảo hành keo đế và bung chỉ may trong 90 ngày sử dụng.' },
      { id: 'WP-SECONDHAND-01M', name: 'Bảo hành Vợt Cũ Đã Kiểm Định', duration_months: 1, coverage_type: 'FULL_COVERAGE', terms_text: 'Bảo hành 30 ngày đổi cây khác nếu phát sinh lỗi khung ngầm chưa phát hiện trong quá trình kiểm định 16 tiêu chuẩn.' },
    ];

    if (!finalPolicies || finalPolicies.length === 0) {
      finalPolicies = DEFAULT_POLICIES;
    }

    const DEFAULT_CLAIMS: any[] = [
      {
        id: 'CLM-2026-001',
        order_code: 'ORD-2026-089',
        customer_phone: '0901234567',
        serial_number: 'SN-88DP-2026-001',
        product_name: 'Vợt Cầu Lông Yonex Astrox 88D Pro Gen 3',
        policy_snapshot: 'Bảo hành Vợt Cầu Lông Chính Hãng 12 tháng (Lỗi rạn khung)',
        damage_description: 'Nứt góc 2h khi đang phông cầu, không va chạm kiếm vợt',
        images_json: '["/images/products/yonex-astrox-88d-pro.png"]',
        status: 'SUBMITTED',
        branch_id: 'BR_HCM_01',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'CLM-2026-002',
        order_code: 'ORD-2026-074',
        customer_phone: '0912345678',
        serial_number: 'SN-SHOE-Z3-042',
        product_name: 'Giày Cầu Lông Yonex Power Cushion Eclipsion Z3 Men',
        policy_snapshot: 'Bảo hành Giày Cầu Lông 3 tháng (Bung keo đế)',
        damage_description: 'Bung nhẹ mép keo mũi chân trái sau 2 tuần mang',
        images_json: '["/images/categories/cat-giay-cau-long-v2.png"]',
        status: 'INSPECTING',
        assigned_technician: 'Lê Kỹ Thuật (HCM)',
        branch_id: 'BR_HCM_01',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];

    if (!finalClaims || finalClaims.length === 0) {
      try {
        const { API_BASE_URL } = await import('@/lib/api');
        const beRes = await fetch(`${API_BASE_URL}/warranty/claims?size=20`);
        if (beRes.ok) {
          const beData = await beRes.json();
          const beList = beData.data?.content || beData.data || [];
          if (beList.length > 0) {
            finalClaims = beList.map((c: any) => ({
              id: c.id,
              order_code: c.orderCode || 'ORD-UNKNOWN',
              serial_number: c.serialNumber || 'SN-***',
              customer_phone: c.customerPhone || '0901234567',
              product_name: c.productName || 'Vợt Cầu Lông',
              policy_snapshot: c.policySnapshot || 'Chính sách bảo hành tiêu chuẩn',
              damage_description: c.damageDescription || 'Lỗi kỹ thuật',
              images_json: '[]',
              status: c.status || 'SUBMITTED',
              branch_id: c.branchId || 'BR_HCM_01',
              created_at: c.createdAt || new Date().toISOString(),
              updated_at: c.updatedAt || new Date().toISOString(),
            }));
          }
        }
      } catch (e) {
        console.warn('Backend warranty claims fallback error:', e);
      }

      if (!finalClaims || finalClaims.length === 0) {
        finalClaims = DEFAULT_CLAIMS;
      }
    }

    return NextResponse.json({ claims: finalClaims, events: finalEvents, policies: finalPolicies });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Quản trị Chính sách Bảo hành (warranty_policies)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, name, duration_months, coverage_type, terms_text } = body;

    const actorData = await resolveActorRole(request);
    if (!actorData) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để thực hiện thao tác này!' }, { status: 401 });
    }
    const effectiveRole = actorData.role;

    const canManagePolicy = await checkPermission(effectiveRole, 'warranty:manage_policies');
    if (!canManagePolicy && effectiveRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Chỉ Tổng Quản trị viên (ADMIN) mới có quyền quản trị chính sách bảo hành!' },
        { status: 403 }
      );
    }

    if (action === 'CREATE_POLICY') {
      if (!id || !name || !duration_months || !coverage_type) {
        return NextResponse.json({ error: 'Vui lòng nhập đầy đủ mã, tên, thời hạn và loại bảo hành.' }, { status: 400 });
      }

      await queryDb(
        'warranty_db',
        `INSERT INTO warranty_policies (id, name, duration_months, coverage_type, terms_text)
         VALUES ($1, $2, $3, $4, $5)`,
        [id.trim().toUpperCase(), name.trim(), Number(duration_months), coverage_type.trim(), terms_text || '']
      );

      return NextResponse.json({ success: true, message: `Đã tạo chính sách bảo hành "${name}" thành công!` });
    }

    if (action === 'UPDATE_POLICY') {
      if (!id || !name) {
        return NextResponse.json({ error: 'Thiếu thông tin cập nhật chính sách.' }, { status: 400 });
      }

      await queryDb(
        'warranty_db',
        `UPDATE warranty_policies 
         SET name = $1, duration_months = $2, coverage_type = $3, terms_text = $4 
         WHERE id = $5`,
        [name.trim(), Number(duration_months), coverage_type.trim(), terms_text || '', id]
      );

      return NextResponse.json({ success: true, message: `Cập nhật chính sách ${id} thành công!` });
    }

    if (action === 'DELETE_POLICY') {
      if (!id) {
        return NextResponse.json({ error: 'Thiếu mã chính sách cần xóa.' }, { status: 400 });
      }

      await queryDb('warranty_db', `DELETE FROM warranty_policies WHERE id = $1`, [id]);
      return NextResponse.json({ success: true, message: `Đã xóa chính sách bảo hành ${id}.` });
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      claimId, 
      toStatus, 
      actor, 
      notes, 
      resolutionType, 
      rejectionReason,
      assignedTechnician,
      estimatedReturnDate,
      repairCost,
      branchId
    } = body;

    if (!claimId || !toStatus || !actor) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc (claimId, toStatus, actor)' }, { status: 400 });
    }

    const actorData = await resolveActorRole(request);
    if (!actorData) {
      return NextResponse.json({ error: 'Unauthorized: Bạn cần đăng nhập để thực hiện thao tác này!' }, { status: 401 });
    }
    const effectiveRole = actorData.role;

    // Phân quyền vai trò: Phê duyệt đổi mới/sửa chữa hoặc từ chối yêu cầu quyền warranty:decide
    if (toStatus === 'APPROVED' || toStatus === 'REJECTED') {
      const canDecide = await checkPermission(effectiveRole, 'warranty:decide');
      if (!canDecide) {
        return NextResponse.json(
          { error: 'QUY TẮC PHÂN QUYỀN: Nhân viên (STAFF) chỉ được tiếp nhận kiểm định (INSPECTING). Phê duyệt đổi trả hoặc từ chối yêu cầu Branch Manager hoặc Admin!' },
          { status: 403 }
        );
      }
    }

    // Lấy trạng thái hiện tại
    const currentClaims = await queryDb(
      'warranty_db',
      `SELECT * FROM warranty_claims WHERE id = $1`,
      [claimId]
    );

    if (currentClaims.length === 0) {
      return NextResponse.json({ error: 'Không tìm thấy hồ sơ bảo hành' }, { status: 404 });
    }

    const currentClaim = currentClaims[0];
    const fromStatus = currentClaim.status;

    // Ràng buộc máy trạng thái: nếu từ chối, bắt buộc phải có lý do
    if (toStatus === 'REJECTED' && !rejectionReason) {
      return NextResponse.json({ error: 'Từ chối bảo hành bắt buộc phải có lý do chi tiết' }, { status: 400 });
    }

    // Cập nhật trạng thái và các fields vận hành
    await queryDb(
      'warranty_db',
      `UPDATE warranty_claims 
       SET status = $1, 
           resolution_type = COALESCE($2, resolution_type),
           rejection_reason = COALESCE($3, rejection_reason),
           assigned_technician = COALESCE($4, assigned_technician),
           estimated_return_date = COALESCE($5, estimated_return_date),
           repair_cost = COALESCE($6, repair_cost),
           branch_id = COALESCE($7, branch_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8`,
      [
        toStatus, 
        resolutionType || null, 
        rejectionReason || null,
        assignedTechnician || null,
        estimatedReturnDate || null,
        repairCost ? Number(repairCost) : null,
        branchId || null,
        claimId
      ]
    );

    // Ghi nhận sự kiện máy trạng thái vào claim_events (Audit trail R10)
    await queryDb(
      'warranty_db',
      `INSERT INTO claim_events (claim_id, from_status, to_status, actor, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [claimId, fromStatus, toStatus, actor, notes || 'Cập nhật trạng thái qua Admin Portal']
    );

    return NextResponse.json({ success: true, claimId, fromStatus, toStatus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
