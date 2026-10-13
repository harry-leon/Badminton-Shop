import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();

  if (!q) {
    return NextResponse.json({ error: 'Vui lòng cung cấp mã đơn, số điện thoại hoặc số serial' }, { status: 400 });
  }

  try {
    const claims = await queryDb(
      'warranty_db',
      `SELECT * FROM warranty_claims 
       WHERE customer_phone = $1 OR order_code = $1 OR serial_number = $1
       ORDER BY created_at DESC`,
      [q]
    );

    // Also search order_db for active orders with warranty policy snapshots
    const orders = await queryDb(
      'order_db',
      `SELECT o.id as order_code, o.customer_phone, o.customer_name, o.created_at, ol.sku, ol.product_name_snapshot, ol.warranty_policy_snapshot
       FROM orders o
       JOIN order_lines ol ON o.id = ol.order_id
       WHERE o.customer_phone = $1 OR o.id = $1
       ORDER BY o.created_at DESC`,
      [q]
    );

    return NextResponse.json({
      query: q,
      claims,
      purchasedWarranties: orders,
    });
  } catch (error: any) {
    console.error('Warranty lookup error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi truy vấn cơ sở dữ liệu' }, { status: 500 });
  }
}
