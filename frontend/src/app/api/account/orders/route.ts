import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderCode = (searchParams.get('orderCode') || searchParams.get('order_code'))?.trim();
  let phone = (searchParams.get('phone') || searchParams.get('customer_phone') || searchParams.get('q'))?.trim();

  // Chống IDOR: Nếu có orderCode mà không có phone
  if (orderCode && (!phone || !/^[0-9+]{9,15}$/.test(phone))) {
    return NextResponse.json(
      { error: 'Bảo mật tra cứu (Chống IDOR): Tra cứu theo mã đơn hàng bắt buộc phải cung cấp số điện thoại mua hàng đi kèm!' },
      { status: 400 }
    );
  }

  // Nếu không có phone qua query string, thử lấy từ cookie session
  if (!phone) {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const user = verifySessionToken(token);
      if (user && user.phone) {
        phone = user.phone;
      }
    }
  }

  if (!phone || !/^[0-9+]{9,15}$/.test(phone)) {
    return NextResponse.json(
      { error: 'Vui lòng cung cấp số điện thoại hợp lệ (tối thiểu 9 số).' },
      { status: 400 }
    );
  }

  try {
    // 1. Lấy danh sách đơn hàng từ order_db
    let orderQuery = `SELECT o.id, o.customer_name, o.customer_phone, o.shipping_address, o.fulfillment_type,
              o.branch_id, o.pickup_code, o.payment_method, o.total_amount, o.status, o.created_at,
              COALESCE((
                SELECT json_agg(json_build_object(
                  'id', ol.id,
                  'sku', ol.sku,
                  'name', ol.product_name_snapshot,
                  'unit_price', ol.unit_price_snapshot,
                  'quantity', ol.quantity,
                  'subtotal', ol.subtotal,
                  'policy', ol.warranty_policy_snapshot
                ))
                FROM order_lines ol
                WHERE ol.order_id = o.id
              ), '[]'::json) as lines
       FROM orders o
       WHERE o.customer_phone = $1`;
    const orderParams: any[] = [phone];
    if (orderCode) {
      orderParams.push(orderCode);
      orderQuery += ` AND o.id = $${orderParams.length}`;
    }
    orderQuery += ` ORDER BY o.created_at DESC`;

    const orders = await queryDb('order_db', orderQuery, orderParams);

    // 2. Lấy danh sách yêu cầu bảo hành từ warranty_db
    let claimQuery = `SELECT id, order_code, customer_phone, serial_number, product_name, policy_snapshot,
              damage_description, status, rejection_reason, resolution_type, created_at, updated_at
       FROM warranty_claims
       WHERE customer_phone = $1`;
    const claimParams: any[] = [phone];
    if (orderCode) {
      claimParams.push(orderCode);
      claimQuery += ` AND order_code = $${claimParams.length}`;
    }
    claimQuery += ` ORDER BY created_at DESC`;

    const claims = await queryDb('warranty_db', claimQuery, claimParams);

    return NextResponse.json({
      success: true,
      phone,
      orders,
      claims,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
