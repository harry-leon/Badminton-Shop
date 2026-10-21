'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Building2, 
  CreditCard, 
  RefreshCw, 
  Award, 
  ShieldAlert, 
  ArrowUpRight,
  PieChart,
  PackageCheck
} from 'lucide-react';
import { toast } from 'sonner';

const branchLabels: Record<string, string> = {
  BR_HCM_01: 'Smash Court — Quận 1 (TP.HCM)',
  BR_HN_01: 'Smash Court — Cầu Giấy (Hà Nội)',
  BR_DN_01: 'Smash Court — Hải Châu (Đà Nẵng)',
};

export default function AdminReportsPage() {
  const { user } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    summary: {},
    branchStats: [],
    paymentStats: [],
    topProducts: [],
    totalRefunds: 0,
    totalWarrantyCost: 0,
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Lỗi khi tải báo cáo');
      setData(json);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const handleRefresh = () => fetchReports();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, []);

  const totalRev = Number(data.summary?.total_revenue) || 0;
  const compRev = Number(data.summary?.completed_revenue) || 0;
  const totalOrders = Number(data.summary?.total_orders) || 0;
  const compOrders = Number(data.summary?.completed_orders) || 0;
  const cancelOrders = Number(data.summary?.cancelled_orders) || 0;

  const completionRate = totalOrders > 0 ? Math.round((compOrders / totalOrders) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top 4 Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-[#E4E3DD] p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#6A726E] flex items-center justify-between">
              <span>Tổng doanh thu ghi nhận</span>
              <DollarSign className="w-4 h-4 text-[#0F5132]" />
            </div>
            <div className="text-2xl font-medium text-[#111613] mt-2 font-mono tabular-nums">
              {new Intl.NumberFormat('vi-VN').format(totalRev)} ₫
            </div>
          </div>
          <div className="text-[11px] text-[#0F5132] mt-3 pt-2.5 border-t border-[#E4E3DD] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Doanh thu thực thu: {new Intl.NumberFormat('vi-VN').format(compRev)} ₫</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E4E3DD] p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#6A726E] flex items-center justify-between">
              <span>Tổng đơn hàng tiếp nhận</span>
              <ShoppingBag className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-medium text-[#111613] mt-2 tabular-nums">
              {totalOrders} đơn
            </div>
          </div>
          <div className="text-[11px] text-[#6A726E] mt-3 pt-2.5 border-t border-[#E4E3DD] flex items-center justify-between">
            <span>Tỷ lệ hoàn thành</span>
            <span className="font-semibold text-emerald-700">{completionRate}%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E4E3DD] p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#6A726E] flex items-center justify-between">
              <span>Tổng tiền hoàn trả (Refunds)</span>
              <ShieldAlert className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-medium text-amber-800 mt-2 font-mono tabular-nums">
              {new Intl.NumberFormat('vi-VN').format(data.totalRefunds || 0)} ₫
            </div>
          </div>
          <div className="text-[11px] text-[#6A726E] mt-3 pt-2.5 border-t border-[#E4E3DD]">
            Chiếm {totalRev > 0 ? ((data.totalRefunds / totalRev) * 100).toFixed(1) : 0}% tổng doanh thu
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E4E3DD] p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs text-[#6A726E] flex items-center justify-between">
              <span>Chi phí bảo hành &amp; sửa chữa</span>
              <ShieldAlert className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-medium text-purple-800 mt-2 font-mono tabular-nums">
              {new Intl.NumberFormat('vi-VN').format(data.totalWarrantyCost || 0)} ₫
            </div>
          </div>
          <div className="text-[11px] text-[#6A726E] mt-3 pt-2.5 border-t border-[#E4E3DD]">
            Hàn carbon &amp; thay thế linh kiện chính hãng
          </div>
        </div>
      </div>

      {/* Grid: Doanh thu theo Chi nhánh & Phương thức Thanh toán */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doanh thu theo chi nhánh */}
        <div className="bg-white rounded-xl border border-[#E4E3DD] p-5">
          <h2 className="text-sm font-medium text-[#111613] mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0F5132]" />
            Doanh số phân bổ theo điểm bán (Chi nhánh)
          </h2>

          <div className="space-y-4">
            {data.branchStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6A726E]">Chưa có dữ liệu đơn hàng</div>
            ) : (
              data.branchStats.map((b: any) => {
                const bRev = Number(b.branch_revenue) || 0;
                const percent = totalRev > 0 ? Math.round((bRev / totalRev) * 100) : 0;
                return (
                  <div key={b.branch_id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-[#111613]">
                          {branchLabels[b.branch_id] || b.branch_id}
                        </span>
                        <span className="text-[#6A726E] ml-2">({b.order_count} đơn)</span>
                      </div>
                      <span className="font-mono font-medium text-[#0F5132]">
                        {new Intl.NumberFormat('vi-VN').format(bRev)} ₫ ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0F5132] rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Doanh thu theo phương thức thanh toán */}
        <div className="bg-white rounded-xl border border-[#E4E3DD] p-5">
          <h2 className="text-sm font-medium text-[#111613] mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0F5132]" />
            Phương thức thanh toán đã đối soát
          </h2>

          <div className="space-y-4">
            {data.paymentStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6A726E]">Chưa có giao dịch thanh toán</div>
            ) : (
              data.paymentStats.map((p: any) => {
                const pTotal = Number(p.method_total) || 0;
                const percent = compRev > 0 ? Math.round((pTotal / compRev) * 100) : 0;
                const isQR = p.payment_method?.includes('VIETQR') || p.payment_method?.includes('QR');
                return (
                  <div key={p.payment_method} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-medium text-[#111613]">
                          {isQR ? '⚡ Chuyển khoản VietQR tự động' : '💵 Tiền mặt / COD khi nhận hàng'}
                        </span>
                        <span className="text-[#6A726E] ml-2">({p.payment_count} giao dịch)</span>
                      </div>
                      <span className="font-mono font-medium text-[#111613]">
                        {new Intl.NumberFormat('vi-VN').format(pTotal)} ₫
                      </span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isQR ? 'bg-emerald-600' : 'bg-stone-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Top 5 Best-Selling Products */}
      <div className="bg-white rounded-xl border border-[#E4E3DD] overflow-hidden">
        <div className="p-4 border-b border-[#E4E3DD]">
          <h2 className="text-sm font-medium text-[#111613] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#0F5132]" />
            Top 5 Sản phẩm bán chạy nhất hệ thống
          </h2>
          <p className="text-[11px] text-[#6A726E] mt-0.5">
            Dựa trên tổng sản lượng và doanh thu tích lũy từ các đơn hàng đã xác nhận
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs border-collapse">
            <thead className="bg-[#F5F4F0] border-b border-[#E4E3DD] text-[#6A726E] font-medium">
              <tr>
                <th className="py-3 px-4">Hạng</th>
                <th className="py-3 px-4">Tên sản phẩm</th>
                <th className="py-3 px-4">Mã SKU</th>
                <th className="py-3 px-4 text-right">Số lượng bán</th>
                <th className="py-3 px-4 text-right">Doanh số thu được</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3DD]">
              {data.topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-[#6A726E]">
                    Chưa có số liệu bán hàng
                  </td>
                </tr>
              ) : (
                data.topProducts.map((p: any, idx: number) => (
                  <tr key={p.sku} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-[#111613]">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-800' :
                        idx === 1 ? 'bg-slate-200 text-slate-800' :
                        idx === 2 ? 'bg-amber-50 text-amber-900' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#111613]">
                      {p.product_name_snapshot}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#6A726E]">
                      {p.sku}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[#111613] tabular-nums">
                      {p.total_sold} cây/chiếc
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[#0F5132] tabular-nums">
                      {new Intl.NumberFormat('vi-VN').format(Number(p.total_sales) || 0)} ₫
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
