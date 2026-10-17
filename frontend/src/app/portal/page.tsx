'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin, useTableDensity } from '@/lib/admin-context';
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
  Plus,
  Store
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { selectedBranch, activeBranchInfo, currentRole } = useAdmin();
  const { density, cellPadding, headerPadding, fontSize, isCompact } = useTableDensity();
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingPayments: 0,
    inTransitTransfers: 0,
    pendingSecondhandUnits: 0,
    pendingClaims: 0,
  });
  const [branchStockSummary, setBranchStockSummary] = useState<Record<string, { onHand: number; reserved: number }>>({
    BR_HCM_01: { onHand: 0, reserved: 0 },
    BR_HN_01: { onHand: 0, reserved: 0 },
    BR_DN_01: { onHand: 0, reserved: 0 },
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Gọi song song các API quản trị để tổng hợp chỉ số
      const [invRes, orderRes, shRes, warRes] = await Promise.all([
        fetch(`/api/admin/inventory?branchId=ALL`).catch(() => null),
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

      // Tính toán tồn kho thực tế từng chi nhánh
      const stockLevels = invData.stockLevels || [];
      const branchMap: Record<string, { onHand: number; reserved: number }> = {
        BR_HCM_01: { onHand: 0, reserved: 0 },
        BR_HN_01: { onHand: 0, reserved: 0 },
        BR_DN_01: { onHand: 0, reserved: 0 },
      };
      stockLevels.forEach((s: any) => {
        if (branchMap[s.branch_id]) {
          branchMap[s.branch_id].onHand += parseInt(s.on_hand, 10) || 0;
          branchMap[s.branch_id].reserved += parseInt(s.reserved, 10) || 0;
        }
      });
      setBranchStockSummary(branchMap);
      setRecentOrders(branchOrders.slice(0, 6));

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
    const handlePortalRefresh = () => loadDashboardData();
    window.addEventListener('portal-refresh', handlePortalRefresh);
    return () => window.removeEventListener('portal-refresh', handlePortalRefresh);
  }, [selectedBranch]);

  return (
    <div className="space-y-6">

      {/* 2. Key KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Đơn hàng */}
        <Link 
          href="/portal/orders"
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
          href="/portal/inventory"
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
          href="/portal/secondhand"
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
          href="/portal/warranty"
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
              href="/portal/secondhand"
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
              href="/portal/inventory"
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
              href="/portal/orders"
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
              href="/portal/warranty"
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

            <Link
              href="/portal/stringing"
              className="p-3.5 rounded-lg border border-[#E4E3DD] hover:bg-stone-50 transition-colors flex items-start gap-3"
            >
              <div className="p-2 rounded-md bg-emerald-50 text-[#0F5132] shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#111613]">Tiếp nhận căng cước BWF</div>
                <div className="text-[11px] text-[#6A726E] mt-0.5">
                  Lấy ngay 15 phút, đan 4 nút máy điện tử Yonex Precision 9.0
                </div>
              </div>
            </Link>

            <Link
              href="/portal/reports"
              className="p-3.5 rounded-lg border border-[#E4E3DD] hover:bg-stone-50 transition-colors flex items-start gap-3"
            >
              <div className="p-2 rounded-md bg-stone-100 text-[#111613] shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#111613]">Báo cáo & Phân tích doanh số</div>
                <div className="text-[11px] text-[#6A726E] mt-0.5">
                  Đối soát dòng tiền 3 chi nhánh, top sản phẩm bán chạy nhất
                </div>
              </div>
            </Link>

            <Link
              href="/portal/banners"
              className="p-3.5 rounded-lg border border-[#E4E3DD] hover:bg-stone-50 transition-colors flex items-start gap-3"
            >
              <div className="p-2 rounded-md bg-emerald-50 text-[#0F5132] shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#111613]">Storefront CMS &amp; Banners</div>
                <div className="text-[11px] text-[#6A726E] mt-0.5">
                  Tùy chỉnh trực quan 5 tabs: Banner Hero, Sale Off, Danh mục &amp; Cam kết
                </div>
              </div>
            </Link>

            <Link
              href="/portal/logs"
              className="p-3.5 rounded-lg border border-[#E4E3DD] hover:bg-stone-50 transition-colors flex items-start gap-3"
            >
              <div className="p-2 rounded-md bg-blue-50 text-blue-700 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-medium text-[#111613]">Nhật ký hệ thống (Audit Logs)</div>
                <div className="text-[11px] text-[#6A726E] mt-0.5">
                  Tra cứu Winston Logger, an ninh đăng nhập &amp; kiểm toán nhân sự
                </div>
              </div>
            </Link>
          </div>

          {/* Realtime Metric Progress Chart */}
          <div className="mt-5 pt-4 border-t border-[#E4E3DD]">
            <div className="flex items-center justify-between text-xs text-[#111613] font-medium mb-2">
              <span>Độ sẵn sàng tồn kho hệ thống (3 Chi nhánh)</span>
              <span className="text-[#0F5132] font-medium text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132] animate-pulse" />
                Dữ liệu PostgreSQL Realtime
              </span>
            </div>
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-[11px] text-[#6A726E] mb-1">
                  <span>TP.HCM — Quận 1 (BR_HCM_01)</span>
                  <span className="tabular-nums font-medium text-[#111613]">
                    Tồn sẵn: {branchStockSummary.BR_HCM_01.onHand} cây (Đang giữ: {branchStockSummary.BR_HCM_01.reserved})
                  </span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0F5132] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, (branchStockSummary.BR_HCM_01.onHand / 150) * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-[#6A726E] mb-1">
                  <span>Hà Nội — Cầu Giấy (BR_HN_01)</span>
                  <span className="tabular-nums font-medium text-[#111613]">
                    Tồn sẵn: {branchStockSummary.BR_HN_01.onHand} cây (Đang giữ: {branchStockSummary.BR_HN_01.reserved})
                  </span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0F5132] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, (branchStockSummary.BR_HN_01.onHand / 150) * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-[#6A726E] mb-1">
                  <span>Đà Nẵng — Hải Châu (BR_DN_01)</span>
                  <span className="tabular-nums font-medium text-[#111613]">
                    Tồn sẵn: {branchStockSummary.BR_DN_01.onHand} cây (Đang giữ: {branchStockSummary.BR_DN_01.reserved})
                  </span>
                </div>
                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0F5132] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(10, (branchStockSummary.BR_DN_01.onHand / 150) * 100))}%` }}
                  />
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

      {/* 4. Live Data Table: Recent Orders responding to Table Density */}
      <div className="bg-white rounded-xl border border-[#E4E3DD] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#E4E3DD] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-[#111613] flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#0F5132]" />
              Giao dịch đơn hàng gần đây ({selectedBranch === 'ALL' ? 'Toàn bộ chi nhánh' : activeBranchInfo.name})
            </h2>
            <p className="text-[11px] text-[#6A726E] mt-0.5 flex items-center gap-2">
              <span>Mật độ bảng đang chọn:</span>
              <span className={`inline-flex items-center px-1.5 py-0.2 rounded font-medium text-[10px] ${
                isCompact ? 'bg-[#0F5132]/10 text-[#0F5132]' : 'bg-stone-200 text-[#111613]'
              }`}>
                {isCompact ? 'Đặc (Compact — 28px/hàng)' : 'Chuẩn (Normal — 48px/hàng)'}
              </span>
            </p>
          </div>
          <Link
            href="/portal/orders"
            className="text-xs text-[#0F5132] hover:underline flex items-center gap-1 font-medium"
          >
            <span>Tất cả đơn hàng</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF9F5] text-[#6A726E] font-medium border-b border-[#E4E3DD]">
              <tr>
                <th className={`${headerPadding} ${fontSize}`}>MÃ ĐƠN</th>
                <th className={`${headerPadding} ${fontSize}`}>KHÁCH HÀNG</th>
                <th className={`${headerPadding} ${fontSize}`}>CHI NHÁNH</th>
                <th className={`${headerPadding} ${fontSize}`}>TỔNG TIỀN</th>
                <th className={`${headerPadding} ${fontSize}`}>TRẠNG THÁI</th>
                <th className={`${headerPadding} ${fontSize} text-right`}>NGÀY TẠO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3DD] text-[#111613]">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`${cellPadding} text-center text-[#6A726E]`}>
                    Chưa có đơn hàng nào tại chi nhánh được chọn.
                  </td>
                </tr>
              ) : (
                recentOrders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className={`${cellPadding} font-mono font-medium text-[#111613]`}>
                      {ord.id}
                    </td>
                    <td className={`${cellPadding}`}>
                      <div className="font-medium text-[#111613]">{ord.customer_name || 'Khách vãng lai'}</div>
                      <div className="text-[10px] text-[#6A726E]">{ord.customer_phone || '---'}</div>
                    </td>
                    <td className={`${cellPadding}`}>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-[#6A726E]">
                        {ord.branch_id || 'ALL'}
                      </span>
                    </td>
                    <td className={`${cellPadding} font-medium text-[#0F5132] tabular-nums`}>
                      {Number(ord.total_amount || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td className={`${cellPadding}`}>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        ord.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        ord.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                        ord.status === 'PREPARING' ? 'bg-indigo-100 text-indigo-800' :
                        ord.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.status}
                      </span>
                    </td>
                    <td className={`${cellPadding} text-right text-[11px] text-[#6A726E] whitespace-nowrap`}>
                      {new Date(ord.created_at || Date.now()).toLocaleDateString('vi-VN')}
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
