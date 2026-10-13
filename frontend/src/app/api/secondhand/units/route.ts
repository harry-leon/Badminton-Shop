import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

// GET /api/secondhand/units
// R7: Vợt chưa qua duyệt bán lại KHÔNG xuất hiện trên website, KHÔNG có tồn kho khả dụng!
export async function GET() {
  try {
    const units = await queryDb(
      'secondhand_db',
      `SELECT * FROM secondhand_units 
       WHERE status = 'APPROVED_FOR_SALE' 
       ORDER BY created_at DESC`
    );
    return NextResponse.json({ units });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
