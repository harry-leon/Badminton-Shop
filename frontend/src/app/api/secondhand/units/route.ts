import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

function maskSerialNumber(serial?: string | null): string {
  if (!serial) return 'SN-***';
  const parts = serial.trim().split('-');
  if (parts.length >= 4) {
    const prefix = parts.slice(0, parts.length - 2).join('-');
    const suffix = parts[parts.length - 1];
    return `${prefix}-***-${suffix}`;
  }
  if (parts.length === 3) {
    return `${parts[0]}-***-${parts[2]}`;
  }
  if (serial.length > 8) {
    return serial.slice(0, 4) + '-***-' + serial.slice(-3);
  }
  return serial;
}

// GET /api/secondhand/units
// R7: Vợt chưa qua duyệt bán lại KHÔNG xuất hiện trên website, KHÔNG có tồn kho khả dụng!
export async function GET() {
  try {
    const units = await queryDb<any>(
      'secondhand_db',
      `SELECT * FROM secondhand_units 
       WHERE status = 'APPROVED_FOR_SALE' 
       ORDER BY created_at DESC`
    );
    const maskedUnits = (units || []).map((u: any) => ({
      ...u,
      serial_number: maskSerialNumber(u.serial_number),
    }));
    return NextResponse.json({ units: maskedUnits });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
