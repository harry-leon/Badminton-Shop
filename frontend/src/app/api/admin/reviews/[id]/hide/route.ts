import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const reason = (body.reason || '').trim();

  // F25-T1-03: Bắt buộc cung cấp lý do kiểm duyệt
  if (!reason) {
    return NextResponse.json(
      { error: 'Bắt buộc cung cấp lý do kiểm duyệt ẩn đánh giá.' },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `Đã ẩn đánh giá ${id}`,
    id,
    reason,
  });
}
