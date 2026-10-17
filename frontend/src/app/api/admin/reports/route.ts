import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const user = token ? verifySessionToken(token) : null;
    if (!user || user.role === 'CUSTOMER') {
      return NextResponse.json({ error: 'Không có quyền truy cập báo cáo' }, { status: 403 });
    }

    // 1. Doanh thu tổng quan & theo trạng thái từ order_db
    const orderStats = await queryDb('order_db', `
      SELECT 
        COUNT(id) as total_orders,
        COALESCE(SUM(CASE WHEN status != 'CANCELLED' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END), 0) as completed_revenue,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) as cancelled_orders,
        COUNT(CASE WHEN status = 'PENDING_PAYMENT' THEN 1 END) as pending_payment_orders
      FROM orders
    `);

    // 2. Doanh thu theo từng chi nhánh
    const branchStats = await queryDb('order_db', `
      SELECT 
        branch_id,
        COUNT(id) as order_count,
        COALESCE(SUM(total_amount), 0) as branch_revenue
      FROM orders
      WHERE status != 'CANCELLED'
      GROUP BY branch_id
      ORDER BY branch_revenue DESC
    `);

    // 3. Doanh thu theo phương thức thanh toán
    const paymentStats = await queryDb('order_db', `
      SELECT 
        payment_method,
        COUNT(id) as payment_count,
        COALESCE(SUM(amount), 0) as method_total
      FROM payments
      WHERE status = 'SUCCESS'
      GROUP BY payment_method
    `);

    // 4. Top sản phẩm bán chạy nhất từ order_lines
    const topProducts = await queryDb('order_db', `
      SELECT 
        sku,
        product_name_snapshot,
        SUM(quantity) as total_sold,
        COALESCE(SUM(subtotal), 0) as total_sales
      FROM order_lines
      GROUP BY sku, product_name_snapshot
      ORDER BY total_sold DESC
      LIMIT 5
    `);

    // 5. Thống kê chi phí bảo hành & hoàn tiền
    let totalRefunds = 0;
    try {
      const refundRes = await queryDb('order_db', `SELECT COALESCE(SUM(amount), 0) as total FROM refunds WHERE status = 'APPROVED'`);
      totalRefunds = parseInt(refundRes[0]?.total || 0, 10);
    } catch {
      totalRefunds = 0;
    }

    let totalWarrantyCost = 0;
    try {
      const warrantyRes = await queryDb('warranty_db', `SELECT COALESCE(SUM(repair_cost), 0) as total FROM warranty_claims WHERE status = 'APPROVED'`);
      totalWarrantyCost = parseInt(warrantyRes[0]?.total || 0, 10);
    } catch {
      totalWarrantyCost = 0;
    }

    return NextResponse.json({
      summary: orderStats[0] || {},
      branchStats: branchStats || [],
      paymentStats: paymentStats || [],
      topProducts: topProducts || [],
      totalRefunds,
      totalWarrantyCost,
    });
  } catch (err: any) {
    console.error('Error fetching admin reports:', err);
    return NextResponse.json({ error: err.message || 'Lỗi server' }, { status: 500 });
  }
}
