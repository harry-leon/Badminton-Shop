import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

function maskPhone(p?: string | null): string {
  if (!p) return '***';
  const clean = p.trim();
  if (clean.length < 7) return '***';
  if (clean.length >= 10) {
    return clean.slice(0, 3) + '****' + clean.slice(-3);
  }
  return clean.slice(0, 2) + '****' + clean.slice(-2);
}

function maskName(n?: string | null): string {
  if (!n) return '***';
  const parts = n.trim().split(/\s+/);
  return parts
    .map((w) => {
      if (w.length <= 1) return w + '*';
      if (w.length === 2) return w[0] + '*';
      if (w.length === 3) return w[0] + '**';
      return w.slice(0, 2) + '***';
    })
    .join(' ');
}

function rfc9457Error(
  status: number,
  title: string,
  detail: string,
  type: string = 'https://smashcourt.vn/problems/invalid-lookup-parameters'
) {
  return new NextResponse(
    JSON.stringify({
      type,
      title,
      status,
      detail,
      instance: '/api/warranty/lookup',
      error: detail,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/problem+json',
      },
    }
  );
}



async function executeWarrantyLookup(targetOrderCode?: string | null, targetPhone?: string | null, targetSerial?: string | null) {
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
         WHERE ol.warranty_policy_snapshot LIKE '%Serial: ' || $1 || '%'
            OR ol.warranty_policy_snapshot LIKE '%Serial: ' || $1 || '.%'
         ORDER BY o.created_at DESC`,
        [targetSerial]
      );
    }
  }

  // Che mặt nạ PII người dùng cho toàn bộ phản hồi trả về
  const safeClaims = claims.map((c) => ({
    ...c,
    customer_phone: maskPhone(c.customer_phone),
  }));

  const safeOrders = orders.map((o) => ({
    ...o,
    customer_phone: maskPhone(o.customer_phone),
    customer_name: maskName(o.customer_name),
  }));

  return NextResponse.json({
    query: {
      orderCode: targetOrderCode || null,
      phone: targetPhone ? maskPhone(targetPhone) : null,
      serial: targetSerial || null,
    },
    claims: safeClaims,
    purchasedWarranties: safeOrders,
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const phone = (searchParams.get('phone') || searchParams.get('customer_phone'))?.trim();
  const orderCode = (searchParams.get('orderCode') || searchParams.get('order_code'))?.trim();
  const serial = (searchParams.get('serial') || searchParams.get('serial_number'))?.trim();

  const skuParam = searchParams.get('skuId') || searchParams.get('sku') || searchParams.get('sku_id') || searchParams.get('productId') || searchParams.get('product_id');
  if (skuParam) {
    return rfc9457Error(
      400,
      'Yêu cầu không hợp lệ',
      'Tra cứu bằng mã SKU sản phẩm bị từ chối 400 để ngăn ngừa rò rỉ dữ liệu cá nhân (PII).'
    );
  }

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
      return rfc9457Error(
        400,
        'Yêu cầu không hợp lệ',
        'Vui lòng cung cấp định dạng hợp lệ: Số serial vợt (bắt đầu bằng SN-), hoặc Mã đơn hàng (DH-...) kèm số điện thoại.'
      );
    }
  }

  if (targetSerial && !targetSerial.startsWith('SN-') && !targetSerial.startsWith('SH-')) {
    return rfc9457Error(
      400,
      'Yêu cầu không hợp lệ',
      'Vui lòng cung cấp định dạng hợp lệ: Số serial vợt phải bắt đầu bằng SN- hoặc SH-.'
    );
  }

  // Anti-IDOR: Bắt buộc cung cấp đồng thời Mã đơn hàng + Số điện thoại khi tra cứu theo đơn/SĐT
  if (targetPhone && !targetOrderCode) {
    return rfc9457Error(
      400,
      'Yêu cầu không hợp lệ (Chống IDOR)',
      'Bảo mật tra cứu (Chống IDOR): Yêu cầu cung cấp đồng thời Mã đơn hàng và Số điện thoại để tra cứu bảo hành.'
    );
  }

  if (targetOrderCode && !targetPhone) {
    return rfc9457Error(
      400,
      'Yêu cầu không hợp lệ (Chống IDOR)',
      'Bảo mật tra cứu (Chống IDOR): Tra cứu theo mã đơn hàng bắt buộc phải cung cấp số điện thoại mua hàng đi kèm để xác minh danh tính!'
    );
  }

  if (!targetSerial && !(targetOrderCode && targetPhone)) {
    return rfc9457Error(
      400,
      'Thiếu thông tin tra cứu',
      'Vui lòng cung cấp số serial của vợt, hoặc đồng thời mã đơn hàng và số điện thoại.'
    );
  }

  try {
    return await executeWarrantyLookup(targetOrderCode, targetPhone, targetSerial);
  } catch (error: any) {
    console.error('Warranty lookup error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi truy vấn cơ sở dữ liệu' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { skuId, sku, sku_id, productId, product_id, serialNumber, serial, serial_number, orderCode, order_code, phone, customer_phone, q } = body || {};

    // C8: Tra cứu bằng mã SKU sản phẩm chung bị từ chối 400 để chặn PII Leak
    if (skuId || sku || sku_id || productId || product_id) {
      return rfc9457Error(
        400,
        'Yêu cầu không hợp lệ',
        'Tra cứu bằng mã SKU sản phẩm bị từ chối 400 để ngăn ngừa rò rỉ dữ liệu cá nhân (PII).'
      );
    }

    let targetOrderCode = orderCode || order_code;
    let targetPhone = phone || customer_phone;
    let targetSerial = serialNumber || serial || serial_number;

    if (q) {
      if (q.startsWith('DH-')) {
        targetOrderCode = q;
      } else if (q.startsWith('SN-') || q.startsWith('SH-')) {
        targetSerial = q;
      } else if (/^[0-9+]{9,15}$/.test(q)) {
        targetPhone = q;
      } else {
        return rfc9457Error(
          400,
          'Yêu cầu không hợp lệ',
          'Vui lòng cung cấp định dạng hợp lệ: Số serial vợt (bắt đầu bằng SN-), hoặc Mã đơn hàng (DH-...) kèm số điện thoại.'
        );
      }
    }

    if (targetSerial && !targetSerial.startsWith('SN-') && !targetSerial.startsWith('SH-')) {
      return rfc9457Error(
        400,
        'Yêu cầu không hợp lệ',
        'Vui lòng cung cấp định dạng hợp lệ: Số serial vợt phải bắt đầu bằng SN- hoặc SH-.'
      );
    }

    if (targetPhone && !targetOrderCode) {
      return rfc9457Error(
        400,
        'Yêu cầu không hợp lệ (Chống IDOR)',
        'Bảo mật tra cứu (Chống IDOR): Yêu cầu cung cấp đồng thời Mã đơn hàng và Số điện thoại để tra cứu bảo hành.'
      );
    }

    if (targetOrderCode && !targetPhone) {
      return rfc9457Error(
        400,
        'Yêu cầu không hợp lệ (Chống IDOR)',
        'Bảo mật tra cứu (Chống IDOR): Tra cứu theo mã đơn hàng bắt buộc phải cung cấp số điện thoại mua hàng đi kèm để xác minh danh tính!'
      );
    }

    if (!targetSerial && !(targetOrderCode && targetPhone)) {
      return rfc9457Error(
        400,
        'Thiếu thông tin tra cứu',
        'Vui lòng cung cấp số serial của vợt, hoặc đồng thời mã đơn hàng và số điện thoại.'
      );
    }

    return await executeWarrantyLookup(targetOrderCode, targetPhone, targetSerial);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi xử lý yêu cầu' }, { status: 400 });
  }
}
