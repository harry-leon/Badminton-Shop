import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET() {
  try {
    const claims = await queryDb(
      'warranty_db',
      `SELECT * FROM warranty_claims ORDER BY created_at DESC`
    );
    const events = await queryDb(
      'warranty_db',
      `SELECT * FROM claim_events ORDER BY created_at DESC LIMIT 50`
    );
    return NextResponse.json({ claims, events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { claimId, toStatus, actor, notes, resolutionType, rejectionReason } = body;

    if (!claimId || !toStatus || !actor) {
      return NextResponse.json({ error: 'Thiếu thông tin bắt buộc (claimId, toStatus, actor)' }, { status: 400 });
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

    // Cập nhật trạng thái
    await queryDb(
      'warranty_db',
      `UPDATE warranty_claims 
       SET status = $1, 
           resolution_type = COALESCE($2, resolution_type),
           rejection_reason = COALESCE($3, rejection_reason),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [toStatus, resolutionType || null, rejectionReason || null, claimId]
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
