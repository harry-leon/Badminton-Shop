import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

function maskPhone(p: string): string {
  if (!p || p.length < 7) return '***';
  return p.slice(0, 4) + '****' + p.slice(-2);
}

function maskName(n: string): string {
  if (!n) return '***';
  const parts = n.trim().split(' ');
  if (parts.length <= 1) return n[0] + '***';
  return parts[0] + ' *** ' + parts[parts.length - 1];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const phone = (searchParams.get('phone') || searchParams.get('customer_phone'))?.trim();
  const orderCode = (searchParams.get('orderCode') || searchParams.get('order_code'))?.trim();
  const serial = (searchParams.get('serial') || searchParams.get('serial_number'))?.trim();

  let targetOrderCode = orderCode;
  let targetPhone = phone;
  let targetSerial = serial;

  if (q) {
    if (q.startsWith('DH-')) {
      targetOrderCode = q;
    } else if (q.startsWith('SN-') || q.startsWith('SH-')) {
      targetSerial = q;
    } else if (/^[0-9+]{9,15}$/.test(q)) {
      targetPhone = q;
    } else {
      // Từ chối nếu q là SKU danh mục hoặc chuỗi tùy ý để ngăn chặn rà quét PII dữ liệu khách hàng
      return NextResponse.json(
        {
          error: 'Vui lòng cung cấp định dạng hợp lệ: Số điện thoại mua hàng, Số serial vợt (bắt đầu bằng SN-), hoặc Mã đơn hàng (DH-...) kèm số điện thoại.',
        },
        { status: 400 }
      );
    }
  }

  // IDOR Protection: Tra cứu theo mã đơn BẮT BUỘC có số điện thoại đi kèm
  if (targetOrderCode && !targetPhone) {
    return NextResponse.json(
      {
        error: 'QUY TẮC BẢO MẬT (Chống IDOR): Tra cứu theo mã đơn hàng bắt buộc phải cung cấp số điện thoại mua hàng đi kèm để xác minh danh tính!',
      },
      { status: 400 }
    );
  }

  if (!targetPhone && !targetSerial && !targetOrderCode) {
    return NextResponse.json(
      { error: 'Vui lòng cung cấp số điện thoại mua hàng, số serial của vợt, hoặc mã đơn hàng kèm số điện thoại.' },
      { status: 400 }
    );
  }

  try {
    let claims: any[] = [];
    let orders: any[] = [];

    if (targetOrderCode && targetPhone) {
      claims = await queryDb(
        'warranty_db',
        `SELECT * FROM warranty_claims WHERE order_code = $1 AND customer_phone = $2 ORDER BY created_at DESC`,
        [targetOrderCode, targetPhone]
      );

      orders = await queryDb(
        'order_db',
        `SELECT o.id as order_code, o.customer_phone, o.customer_name, o.created_at, ol.sku, ol.product_name_snapshot, ol.warranty_policy_snapshot
         FROM orders o
         JOIN order_lines ol ON o.id = ol.order_id
         WHERE o.id = $1 AND o.customer_phone = $2
         ORDER BY o.created_at DESC`,
        [targetOrderCode, targetPhone]
      );
    } else if (targetPhone) {
      claims = await queryDb(
        'warranty_db',
        `SELECT * FROM warranty_claims WHERE customer_phone = $1 ORDER BY created_at DESC`,
        [targetPhone]
      );

      orders = await queryDb(
        'order_db',
        `SELECT o.id as order_code, o.customer_phone, o.customer_name, o.created_at, ol.sku, ol.product_name_snapshot, ol.warranty_policy_snapshot
         FROM orders o
         JOIN order_lines ol ON o.id = ol.order_id
         WHERE o.customer_phone = $1
         ORDER BY o.created_at DESC`,
        [targetPhone]
      );
    } else if (targetSerial) {
      claims = await queryDb(
        'warranty_db',
        `SELECT * FROM warranty_claims WHERE serial_number = $1 ORDER BY created_at DESC`,
        [targetSerial]
      );

      const claimOrderCodes = claims.map((c) => c.order_code).filter(Boolean);
      if (claimOrderCodes.length > 0) {
        orders = await queryDb(
          'order_db',
          `SELECT o.id as order_code, o.customer_phone, o.customer_name, o.created_at, ol.sku, ol.product_name_snapshot, ol.warranty_policy_snapshot
           FROM orders o
           JOIN order_lines ol ON o.id = ol.order_id
           WHERE o.id = ANY($1)
           ORDER BY o.created_at DESC`,
          [claimOrderCodes]
        );
      } else {
        orders = await queryDb(
          'order_db',
          `SELECT o.id as order_code, o.customer_phone, o.customer_name, o.created_at, ol.sku, ol.product_name_snapshot, ol.warranty_policy_snapshot
           FROM orders o
           JOIN order_lines ol ON o.id = ol.order_id
           WHERE ol.warranty_policy_snapshot LIKE '%' || $1 || '%'
           ORDER BY o.created_at DESC`,
          [targetSerial]
        );
      }

      // Bảo vệ PII người dùng khi tra cứu chỉ bằng số serial (che số điện thoại và tên)
      claims = claims.map((c) => ({
        ...c,
        customer_phone: maskPhone(c.customer_phone),
      }));

      orders = orders.map((o) => ({
        ...o,
        customer_phone: maskPhone(o.customer_phone),
        customer_name: maskName(o.customer_name),
      }));
    }

    return NextResponse.json({
      query: {
        orderCode: targetOrderCode || null,
        phone: targetPhone || null,
        serial: targetSerial || null,
      },
      claims,
      purchasedWarranties: orders,
    });
  } catch (error: any) {
    console.error('Warranty lookup error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi truy vấn cơ sở dữ liệu' }, { status: 500 });
  }
}
