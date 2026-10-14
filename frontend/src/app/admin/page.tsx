'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/lib/admin-context';
import {
  Boxes,
  ShoppingBag,
  ShieldCheck,
  Wrench,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle2,
  Building2,
  RefreshCw,
  Plus
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { selectedBranch, activeBranchInfo, currentRole } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingPayments: 0,
    inTransitTransfers: 0,
    pendingSecondhandUnits: 0,
    pendingClaims: 0,
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Gọi song song các API quản trị để tổng hợp chỉ số
      const [invRes, orderRes, shRes, warRes] = await Promise.all([
        fetch(`/api/admin/inventory?branchId=${selectedBranch}`).catch(() => null),
        fetch(`/api/admin/orders`).catch(() => null),
        fetch(`/api/admin/secondhand`).catch(() => null),
        fetch(`/api/admin/warranty`).catch(() => null),
      ]);

      const [invData, orderData, shData, warData] = await Promise.all([
        invRes ? invRes.json().catch(() => ({} as any)) : ({} as any),
        orderRes ? orderRes.json().catch(() => ({} as any)) : ({} as any),
        shRes ? shRes.json().catch(() => ({} as any)) : ({} as any),
        warRes ? warRes.json().catch(() => ({} as any)) : ({} as any),
      ]) as [any, any, any, any];

      const transfers = invData.transfers || [];
      const inTransit = transfers.filter((t: any) => t.status === 'IN_TRANSIT').length;

      const orders = orderData.orders || [];
      const branchOrders = selectedBranch === 'ALL' ? orders : orders.filter((o: any) => o.branch_id === selectedBranch);
      const pendingPay = orders.filter((o: any) => o.status === 'PENDING_PAYMENT' || o.status === 'AWAITING_PAYMENT').length;

      const units = shData.units || [];
      const pendingUnits = units.filter((u: any) => u.status === 'PENDING_RESALE_APPROVAL' || u.status === 'INSPECTED').length;

      const claims = warData.claims || [];
      const pendingClaims = claims.filter((c: any) => c.status === 'SUBMITTED' || c.status === 'INSPECTING').length;

      setStats({
        totalOrders: branchOrders.length,
        pendingPayments: pendingPay,
        inTransitTransfers: inTransit,
        pendingSecondhandUnits: pendingUnits,
        pendingClaims,
      });
    } catch (err) {
      console.error('Lỗi tải dữ liệu dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedBranch]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-xl border border-[#E4E3DD] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded bg-[#0F5132]/10 text-[#0F5132] font-medium border border-[#0F5132]/20">
              Chi nhánh: {selectedBranch}
            </span>
            <span className="text-xs text-[#6A726E]">
              Vai trò: <strong className="text-[#111613] font-medium">{currentRole}</strong>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-[#111613] tracking-tight">
            Bảng điều khiển vận hành {activeBranchInfo.name}
          </h1>
          <p className="text-xs text-[#6A726E] mt-0.5">
            {activeBranchInfo.address} — Hệ thống quản trị thời gian thực kết nối PostgreSQL native
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E3DD] bg-white hover:bg-stone-50 text-xs font-normal text-[#111613] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. Key KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Đơn hàng */}
        <Link 
          href="/admin/orders"
          className="bg-white rounded-xl border border-[#E4E3DD] p-4 hover:border-stone-400 transition-colors group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-[#6A726E] mb-2">
              <span>Đơn hàng chi nhánh</span>
              <ShoppingBag className="w-4 h-4 text-[#0F5132]" />
            </div>
            <div className="text-2xl font-medium text-[#111613] tabular-nums">
              {stats.totalOrders}
            </div>
            <div className="text-[11px] text-[#6A726E] mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{stats.pendingPayments} đơn chờ thanh toán QR</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E3DD] flex items-center justify-between text-xs text-[#0F5132] group-hover:translate-x-0.5 transition-transform">
            <span>Chi tiết đơn hàng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Điều chuyển kho */}
        <Link 
          href="/admin/inventory"
          className="bg-white rounded-xl border border-[#E4E3DD] p-4 hover:border-stone-400 transition-colors group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-[#6A726E] mb-2">
              <span>Điều chuyển kho</span>
              <Boxes className="w-4 h-4 text-[#0F5132]" />
            </div>
            <div className="text-2xl font-medium text-[#111613] tabular-nums">
              {stats.inTransitTransfers}
            </div>
            <div className="text-[11px] text-[#6A726E] mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>Đang vận chuyển giữa các kho (R8)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E3DD] flex items-center justify-between text-xs text-[#0F5132] group-hover:translate-x-0.5 transition-transform">
            <span>Xem sổ cái tồn kho</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Vợt cũ chờ duyệt */}
        <Link 
          href="/admin/secondhand"
          className="bg-white rounded-xl border border-[#E4E3DD] p-4 hover:border-stone-400 transition-colors group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-[#6A726E] mb-2">
              <span>Vợt cũ kiểm định</span>
              <ShieldCheck className="w-4 h-4 text-[#0F5132]" />
            </div>
            <div className="text-2xl font-medium text-[#111613] tabular-nums">
              {stats.pendingSecondhandUnits}
            </div>
            <div className="text-[11px] text-[#6A726E] mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Chờ phê duyệt mở bán (R7)</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E3DD] flex items-center justify-between text-xs text-[#0F5132] group-hover:translate-x-0.5 transition-transform">
            <span>Mở wizard thu mua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Bảo hành đang xử lý */}
        <Link 
          href="/admin/warranty"
          className="bg-white rounded-xl border border-[#E4E3DD] p-4 hover:border-stone-400 transition-colors group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-[#6A726E] mb-2">
              <span>Hồ sơ bảo hành</span>
              <Wrench className="w-4 h-4 text-[#0F5132]" />
            </div>
            <div className="text-2xl font-medium text-[#111613] tabular-nums">
              {stats.pendingClaims}
            </div>
            <div className="text-[11px] text-[#6A726E] mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Cần kỹ thuật viên thẩm định</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E3DD] flex items-center justify-between text-xs text-[#0F5132] group-hover:translate-x-0.5 transition-transform">
            <span>Tiếp nhận hồ sơ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* 3. Operational Shortcuts & Rules Guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shortcuts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[#E4E3DD] p-5">
          <h2 className="text-sm font-medium text-[#111613] mb-3">
            Tác vụ vận hành nhanh tại quầy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/admin/secondhand"
              className="p-3.5 rounded-lg border border-[#E4E3DD] hover:bg-stone-50 transition-colors flex items-start gap-3"
            >
              <div className="p-2 rounded-md bg-[#0F5132]/10 text-[#0F5132] shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#111613]">Kiểm định & Thu mua vợt cũ</div>
                <div className="text-[11px] text-[#6A726E] mt-0.5">
                  Kiểm tra 5 điểm, tự động phân hạng A/B/C và tính giá thu mua
                </div>
              </div>
            </Link>

            <Link
              href="/admin/inventory"
              className="p-3.5 rounded-lg border border-[#E4E3DD] hover:bg-stone-50 transition-colors flex items-start gap-3"
            >
              <div className="p-2 rounded-md bg-blue-50 text-blue-700 shrink-0">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#111613]">Tạo phiếu điều chuyển kho</div>
                <div className="text-[11px] text-[#6A726E] mt-0.5">
                  Xuất hàng IN_TRANSIT, ghi nhận chênh lệch khi nhận (R8)
                </div>
              </div>
            </Link>

            <Link
              href="/admin/orders"
              className="p-3.5 rounded-lg border border-[#E4E3DD] hover:bg-stone-50 transition-colors flex items-start gap-3"
            >
              <div className="p-2 rounded-md bg-amber-50 text-amber-700 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#111613]">Đối soát VietQR thủ công</div>
                <div className="text-[11px] text-[#6A726E] mt-0.5">
                  Nhập mã tham chiếu ngân hàng, khóa chống đối soát 2 lần (K8)
                </div>
              </div>
            </Link>

            <Link
              href="/admin/warranty"
              className="p-3.5 rounded-lg border border-[#E4E3DD] hover:bg-stone-50 transition-colors flex items-start gap-3"
            >
              <div className="p-2 rounded-md bg-purple-50 text-purple-700 shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#111613]">Thẩm định & Quyết định bảo hành</div>
                <div className="text-[11px] text-[#6A726E] mt-0.5">
                  Duyệt đổi mới, hàn carbon hoặc từ chối va chạm đối kháng (K10)
                </div>
              </div>
            </Link>
          </div>

          {/* Minimal Metric Progress Chart */}
          <div className="mt-5 pt-4 border-t border-[#E4E3DD]">
            <div className="flex items-center justify-between text-xs text-[#111613] font-medium mb-2">
              <span>Độ sẵn sàng tồn kho hệ thống (3 Chi nhánh)</span>
              <span className="text-[#6A726E] font-normal text-[11px]">Cập nhật tức thời</span>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[11px] text-[#6A726E] mb-1">
                  <span>TP.HCM — Quận 1 (BR_HCM_01)</span>
                  <span className="tabular-nums font-medium text-[#111613]">Tồn sẵn: 140 cây (Reserved: 12)</span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0F5132] rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-[#6A726E] mb-1">
                  <span>Hà Nội — Cầu Giấy (BR_HN_01)</span>
                  <span className="tabular-nums font-medium text-[#111613]">Tồn sẵn: 95 cây (Reserved: 5)</span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0F5132] rounded-full" style={{ width: '65%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-[#6A726E] mb-1">
                  <span>Đà Nẵng — Hải Châu (BR_DN_01)</span>
                  <span className="tabular-nums font-medium text-[#111613]">Tồn sẵn: 60 cây (Reserved: 2)</span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0F5132] rounded-full" style={{ width: '45%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quy tắc Vận hành R1-R10 Quick Reference */}
        <div className="bg-white rounded-xl border border-[#E4E3DD] p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-medium text-[#111613] mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0F5132]" />
              Quy tắc cốt lõi cần nhớ
            </h2>
            <p className="text-[11px] text-[#6A726E] mb-3">
              Các ràng buộc bất biến đã được mã hóa vào cơ sở dữ liệu:
            </p>
            <ul className="space-y-2 text-xs text-[#111613]">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] mt-1.5 shrink-0" />
                <span><strong>R1/R2:</strong> Atomic lock tồn kho, không bao giờ bán âm, vợt cũ là đơn vị duy nhất.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] mt-1.5 shrink-0" />
                <span><strong>R4:</strong> Thao tác đúng chi nhánh làm việc theo quyền hạn.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] mt-1.5 shrink-0" />
                <span><strong>R5:</strong> Điều chỉnh giá thu mua vượt ±10% bắt buộc Quản lý chi nhánh duyệt.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] mt-1.5 shrink-0" />
                <span><strong>R6:</strong> Vợt Hạng D / Nghi hàng giả cấm xuất quỹ chi tiền, lập biên bản lưu vết.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] mt-1.5 shrink-0" />
                <span><strong>R8:</strong> Trừ kho gửi đúng lúc xuất hàng IN_TRANSIT.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] mt-1.5 shrink-0" />
                <span><strong>R10:</strong> Sổ cái stock_movements append-only, đối chiếu chuẩn xác.</span>
              </li>
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E4E3DD] text-[11px] text-[#6A726E]">
            Trạng thái máy chủ: <strong className="text-emerald-700 font-medium">PostgreSQL 18 Native (Active)</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
