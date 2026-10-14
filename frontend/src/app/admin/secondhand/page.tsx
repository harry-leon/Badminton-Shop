'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Sparkles, 
  UserCheck, 
  Check,
  Building2,
  FileText,
  BadgeAlert
} from 'lucide-react';

interface BuybackCase {
  id: string;
  racket_model: string;
  grade: string;
  auth_status: string;
  seller_name: string;
  seller_phone: string;
  base_price_snapshot: number;
  adjusted_price: number;
  adjustment_reason?: string;
  manager_approval_required: boolean;
  status: string;
  created_at: string;
}

interface SecondhandUnit {
  id: string;
  buyback_case_id: string;
  model_name: string;
  serial_number?: string;
  grade: string;
  resale_price: number;
  warranty_days: number;
  condition_notes?: string;
  status: string;
  created_at: string;
}

export default function AdminSecondhandPage() {
  const { selectedBranch, currentRole } = useAdmin();
  const [activeTab, setActiveTab] = useState<'WIZARD' | 'RESALE_APPROVAL'>('WIZARD');
  const [cases, setCases] = useState<BuybackCase[]>([]);
  const [units, setUnits] = useState<SecondhandUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Form states cho Wizard thu mua
  const [sellerName, setSellerName] = useState('Trần Quốc Tuấn');
  const [sellerPhone, setSellerPhone] = useState('0987112233');
  const [sellerIdCard, setSellerIdCard] = useState('079099******');
  const [racketModel, setRacketModel] = useState('Yonex Astrox 88D Pro');
  const [serialNumber, setSerialNumber] = useState('SN-88DP-2026-999');
  const [authStatus, setAuthStatus] = useState<'AUTHENTIC' | 'UNVERIFIED' | 'SUSPECTED_FAKE'>('AUTHENTIC');
  const [grade, setGrade] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [basePrice, setBasePrice] = useState(2400000);
  const [adjustedPrice, setAdjustedPrice] = useState(2400000);
  const [adjustmentReason, setAdjustmentReason] = useState('Khung còn rất đẹp, tặng kèm bao nhung');
  const [submitting, setSubmitting] = useState(false);

  // Checklist kiểm định 5 điểm
  const [checklist, setChecklist] = useState({
    frameNotCracked: true,
    shaftStraight: true,
    grommetIntact: true,
    coneCodeVerified: true,
    tJointSolid: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/secondhand');
      const data = await res.json();
      if (res.ok) {
        setCases(data.cases || []);
        setUnits(data.units || []);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu secondhand:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tính phần trăm điều chỉnh giá
  const priceDiffPercent = Math.round(((adjustedPrice - basePrice) / basePrice) * 100);
  const isOutOfLimit = Math.abs(priceDiffPercent) > 10;
  const isRejected = grade === 'D' || authStatus !== 'AUTHENTIC';

  const handleCompleteBuyback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/secondhand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranch,
          staffId: 'nv_smash_court',
          userRole: currentRole,
          sellerName,
          sellerPhone,
          sellerIdCardMasked: sellerIdCard,
          racketModel,
          serialNumber,
          checklistJson: checklist,
          grade,
          authStatus,
          basePrice,
          adjustedPrice,
          adjustmentReason,
          paymentMethod: 'BANK_TRANSFER',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (data.status === 'REJECTED') {
          setMessage(`Đã lưu biên bản từ chối thu mua hồ sơ ${data.caseId} (R6) vào hệ thống kiểm toán!`);
        } else if (data.status === 'PENDING_MANAGER_APPROVAL') {
          setMessage(`Hồ sơ ${data.caseId} đã được lưu và gửi Quản lý chi nhánh duyệt giá (R5)!`);
        } else {
          setMessage(`Thu mua thành công hồ sơ ${data.caseId}! Đã tạo đơn vị ${data.unitId} chờ Quản lý duyệt mở bán.`);
          setActiveTab('RESALE_APPROVAL');
        }
        await loadData();
      } else {
        alert(data.error || 'Lỗi xử lý thu mua');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveResale = async (unitId: string) => {
    try {
      const res = await fetch('/api/admin/secondhand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          approvedBy: 'ql_chi_nhanh',
          userRole: currentRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Quản lý đã duyệt mở bán unit ${unitId}! Sản phẩm đã hiển thị trực tiếp trên Storefront.`);
        await loadData();
      } else {
        alert(data.error || 'Lỗi duyệt mở bán');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleApproveCase = async (caseId: string) => {
    try {
      const res = await fetch('/api/admin/secondhand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          approvedBy: 'ql_chi_nhanh',
          userRole: currentRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Quản lý chi nhánh đã phê duyệt giá hồ sơ ${caseId} (R5)! Đã tạo unit chờ mở bán.`);
        await loadData();
      } else {
        alert(data.error || 'Lỗi duyệt giá thu mua');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const pendingUnits = units.filter((u) => u.status === 'PENDING_RESALE_APPROVAL');

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E4E3DD]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded bg-[#0F5132]/10 text-[#0F5132] font-medium border border-[#0F5132]/20">
              Chi nhánh: {selectedBranch}
            </span>
            <span className="text-xs text-[#6A726E]">Quy tắc R5 (±10%), R6 (Từ chối Hạng D) & R7 (Duyệt mở bán)</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-[#111613] tracking-tight">
            Thu mua & kiểm định vợt cũ (Second-hand)
          </h1>
          <p className="text-xs text-[#6A726E] mt-0.5">
            Quy trình độc quyền: Kiểm định 5 tiêu chí, tự động tính hạng A/B/C, kiểm soát giá và phê duyệt mở bán an toàn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E3DD] bg-white hover:bg-stone-50 text-xs font-normal text-[#111613] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E4E3DD] text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('WIZARD')}
          className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'WIZARD'
              ? 'border-[#0F5132] text-[#0F5132]'
              : 'border-transparent text-[#6A726E] hover:text-[#111613]'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Wizard kiểm định & thu mua</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('RESALE_APPROVAL')}
          className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'RESALE_APPROVAL'
              ? 'border-[#0F5132] text-[#0F5132]'
              : 'border-transparent text-[#6A726E] hover:text-[#111613]'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Duyệt niêm yết mở bán (R7) ({pendingUnits.length})</span>
        </button>
      </div>

      {/* TAB 1: BUYBACK WIZARD */}
      {activeTab === 'WIZARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white rounded-xl border border-[#E4E3DD] p-5 sm:p-6">
            <form onSubmit={handleCompleteBuyback} className="space-y-6 text-xs">
              {/* Stepper Header */}
              <div className="flex items-center justify-between border-b border-[#E4E3DD] pb-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-medium text-xs">
                    1
                  </span>
                  <span className="font-medium text-[#111613]">Khách hàng</span>
                </div>
                <div className="w-8 h-px bg-[#E4E3DD]" />
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-medium text-xs">
                    2
                  </span>
                  <span className="font-medium text-[#111613]">Vợt & Serial</span>
                </div>
                <div className="w-8 h-px bg-[#E4E3DD]" />
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-medium text-xs">
                    3
                  </span>
                  <span className="font-medium text-[#111613]">Kiểm định 5 điểm</span>
                </div>
                <div className="w-8 h-px bg-[#E4E3DD]" />
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0F5132] text-white flex items-center justify-center font-medium text-xs">
                    4
                  </span>
                  <span className="font-medium text-[#111613]">Định giá</span>
                </div>
              </div>

              {/* Bước 1: Khách hàng */}
              <div>
                <h2 className="text-xs font-medium text-[#111613] mb-2.5">
                  1. Thông tin khách bán lại (Tuân thủ pháp lý ký gửi)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#6A726E] mb-1">Họ tên khách hàng:</label>
                    <input
                      type="text"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      className="w-full p-2 rounded-lg border border-[#E4E3DD] text-[#111613]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6A726E] mb-1">Số điện thoại:</label>
                    <input
                      type="text"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      className="w-full p-2 rounded-lg border border-[#E4E3DD] text-[#111613]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6A726E] mb-1">CCCD (Đã che giấu):</label>
                    <input
                      type="text"
                      value={sellerIdCard}
                      onChange={(e) => setSellerIdCard(e.target.value)}
                      className="w-full p-2 rounded-lg border border-[#E4E3DD] font-mono text-[#111613]"
                    />
                  </div>
                </div>
              </div>

              {/* Bước 2: Model & Serial */}
              <div>
                <h2 className="text-xs font-medium text-[#111613] mb-2.5">
                  2. Thông tin cây vợt & đối soát số serial
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#6A726E] mb-1">Dòng vợt:</label>
                    <input
                      type="text"
                      value={racketModel}
                      onChange={(e) => setRacketModel(e.target.value)}
                      className="w-full p-2 rounded-lg border border-[#E4E3DD] text-[#111613]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6A726E] mb-1">Số Serial nón/thân vợt:</label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="w-full p-2 rounded-lg border border-[#E4E3DD] font-mono text-[#111613]"
                    />
                  </div>
                </div>
              </div>

              {/* Bước 3: Checklist kiểm định 5 điểm */}
              <div>
                <h2 className="text-xs font-medium text-[#111613] mb-2.5">
                  3. Biên bản kiểm định kỹ thuật 5 điểm cốt lõi
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-[#F5F4F0] p-3.5 rounded-lg">
                  <label className="flex items-center gap-2 p-2 rounded bg-white border border-[#E4E3DD] cursor-pointer text-[#111613]">
                    <input
                      type="checkbox"
                      checked={checklist.frameNotCracked}
                      onChange={(e) => setChecklist({ ...checklist, frameNotCracked: e.target.checked })}
                      className="w-4 h-4 text-[#0F5132] rounded"
                    />
                    <span>Khung không rạn nứt / không hàn carbon</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded bg-white border border-[#E4E3DD] cursor-pointer text-[#111613]">
                    <input
                      type="checkbox"
                      checked={checklist.shaftStraight}
                      onChange={(e) => setChecklist({ ...checklist, shaftStraight: e.target.checked })}
                      className="w-4 h-4 text-[#0F5132] rounded"
                    />
                    <span>Đũa vợt thẳng, độ đàn hồi chuẩn</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded bg-white border border-[#E4E3DD] cursor-pointer text-[#111613]">
                    <input
                      type="checkbox"
                      checked={checklist.grommetIntact}
                      onChange={(e) => setChecklist({ ...checklist, grommetIntact: e.target.checked })}
                      className="w-4 h-4 text-[#0F5132] rounded"
                    />
                    <span>Gen cước nguyên vẹn, không lún</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded bg-white border border-[#E4E3DD] cursor-pointer text-[#111613]">
                    <input
                      type="checkbox"
                      checked={checklist.coneCodeVerified}
                      onChange={(e) => setChecklist({ ...checklist, coneCodeVerified: e.target.checked })}
                      className="w-4 h-4 text-[#0F5132] rounded"
                    />
                    <span>Mã nón & logo sắc nét chuẩn hãng</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded bg-white border border-[#E4E3DD] cursor-pointer text-[#111613] sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={checklist.tJointSolid}
                      onChange={(e) => setChecklist({ ...checklist, tJointSolid: e.target.checked })}
                      className="w-4 h-4 text-[#0F5132] rounded"
                    />
                    <span>Khớp chữ T chắc chắn, không lạo xạo khi vung</span>
                  </label>
                </div>
              </div>

              {/* Bước 4: Xếp hạng & Định giá */}
              <div>
                <h2 className="text-xs font-medium text-[#111613] mb-2.5">
                  4. Đánh giá phân cấp & giá đề xuất
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[#6A726E] mb-1">Xác thực nguồn gốc:</label>
                    <select
                      value={authStatus}
                      onChange={(e) => setAuthStatus(e.target.value as any)}
                      className="w-full p-2 rounded-lg border border-[#E4E3DD] bg-white text-[#111613]"
                    >
                      <option value="AUTHENTIC">Chính hãng (AUTHENTIC)</option>
                      <option value="UNVERIFIED">Chưa xác minh nguồn gốc (UNVERIFIED)</option>
                      <option value="SUSPECTED_FAKE">Nghi ngờ hàng nhái (SUSPECTED_FAKE)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#6A726E] mb-1">Phân cấp hiện trạng:</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value as any)}
                      className="w-full p-2 rounded-lg border border-[#E4E3DD] bg-white text-[#111613]"
                    >
                      <option value="A">Hạng A (Như mới 98-99%, xước li ti)</option>
                      <option value="B">Hạng B (Ngoại hình 90-95%, trầy dăm)</option>
                      <option value="C">Hạng C (Ngoại hình 80-85%, tróc sơn)</option>
                      <option value="D">Hạng D (Nứt gãy / Biến dạng — TỪ CHỐI R6)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#6A726E] mb-1">Giá chuẩn theo bảng giá Snapshot (₫):</label>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-[#E4E3DD] font-mono text-[#111613]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#6A726E] mb-1">Giá thu mua thực tế (₫):</label>
                    <input
                      type="number"
                      value={adjustedPrice}
                      onChange={(e) => setAdjustedPrice(parseInt(e.target.value, 10))}
                      className="w-full p-2 rounded-lg border border-[#E4E3DD] font-mono text-[#111613]"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[#6A726E] mb-1">Lý do điều chỉnh / Ghi chú chi tiết:</label>
                  <input
                    type="text"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[#E4E3DD] text-[#111613]"
                  />
                </div>
              </div>

              {/* Cảnh báo quy tắc */}
              {isRejected && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-lg flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span><strong>Quy tắc R6:</strong> Hàng Hạng D hoặc không rõ nguồn gốc bị hệ thống từ chối chi tiền thu mua, lập biên bản lưu vết.</span>
                </div>
              )}

              {isOutOfLimit && !isRejected && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>Quy tắc R5:</strong> Mức điều chỉnh ({priceDiffPercent}%) vượt ngưỡng ±10%. Yêu cầu Quản lý chi nhánh phê duyệt.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#111613] hover:bg-[#0F5132] text-white py-2.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting 
                  ? 'Đang lưu hồ sơ...' 
                  : isRejected 
                    ? 'Lập biên bản từ chối thu mua (REJECTED R6)' 
                    : isOutOfLimit 
                      ? 'Gửi duyệt giá vượt ngưỡng (PENDING_APPROVAL R5)' 
                      : 'Hoàn tất thu mua & Tạo unit chờ mở bán'}
              </button>
            </form>
          </div>

          {/* Right Panel: Recent Buyback Cases */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-[#E4E3DD] p-5">
            <h2 className="text-xs font-medium text-[#111613] mb-3 pb-2 border-b border-[#E4E3DD]">
              Hồ sơ thu mua gần đây ({cases.length})
            </h2>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
              {cases.length === 0 ? (
                <div className="text-xs text-[#6A726E] text-center py-6">Chưa có hồ sơ thu mua nào.</div>
              ) : (
                cases.map((c) => (
                  <div key={c.id} className="border border-[#E4E3DD] bg-stone-50/50 p-2.5 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[#111613]">{c.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        c.status === 'PAID' 
                          ? 'bg-emerald-100 text-emerald-900' 
                          : c.status === 'PENDING_MANAGER_APPROVAL'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-rose-100 text-rose-900'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="font-medium text-[#111613]">{c.racket_model}</div>
                    <div className="flex justify-between text-[#6A726E] text-[11px]">
                      <span>Hạng {c.grade} • {c.seller_name}</span>
                      <span className="font-medium text-[#0F5132] tabular-nums">
                        {parseInt(c.adjusted_price as any, 10).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    {c.status === 'PENDING_MANAGER_APPROVAL' && (
                      <div className="pt-2 mt-1 border-t border-stone-200">
                        {currentRole === 'BRANCH_MANAGER' || currentRole === 'ADMIN' ? (
                          <button
                            type="button"
                            onClick={() => handleApproveCase(c.id)}
                            className="w-full bg-[#0F5132] hover:bg-emerald-900 text-white font-medium py-1 px-2 rounded text-[11px] transition-colors flex items-center justify-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Duyệt giá thu mua (Branch Manager R5)</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-amber-800 italic block text-center">
                            Đang chờ Quản lý chi nhánh duyệt giá (R5)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESALE APPROVAL GATE (R7) */}
      {activeTab === 'RESALE_APPROVAL' && (
        <div className="bg-white rounded-xl border border-[#E4E3DD] p-5">
          <div className="border-b border-[#E4E3DD] pb-3 mb-4">
            <h2 className="text-sm font-medium text-[#111613]">
              Danh sách vợt cũ chờ phê duyệt niêm yết mở bán ({units.length} chiếc)
            </h2>
            <p className="text-xs text-[#6A726E] mt-0.5">
              Quy tắc R7: Vợt thu mua chỉ được xuất hiện trên Storefront khi Quản lý chi nhánh ký duyệt giá bán và chính sách bảo hành.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.length === 0 ? (
              <div className="col-span-full text-center text-xs text-[#6A726E] py-8">
                Hiện không có chiếc vợt cũ nào trong danh sách.
              </div>
            ) : (
              units.map((unit) => {
                const isPending = unit.status === 'PENDING_RESALE_APPROVAL';
                const resalePrice = parseInt(unit.resale_price as any, 10);

                return (
                  <div
                    key={unit.id}
                    className={`border rounded-xl p-4 text-xs flex flex-col justify-between ${
                      isPending ? 'border-amber-300 bg-amber-50/30' : 'border-[#E4E3DD] bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-[#6A726E]">{unit.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          isPending ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                        }`}>
                          {unit.status}
                        </span>
                      </div>

                      <h3 className="font-medium text-[#111613] text-sm mb-1">{unit.model_name}</h3>
                      <div className="text-[#6A726E] space-y-1 mb-3">
                        <div><span className="text-[#111613]">Phân hạng:</span> Hạng {unit.grade}</div>
                        <div><span className="text-[#111613]">Serial:</span> <span className="font-mono">{unit.serial_number || 'N/A'}</span></div>
                        <div><span className="text-[#111613]">Bảo hành:</span> {unit.warranty_days} ngày</div>
                        {unit.condition_notes && (
                          <div className="text-[11px] text-[#6A726E] italic">&ldquo;{unit.condition_notes}&rdquo;</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E4E3DD] flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#6A726E]">Giá niêm yết bán:</div>
                        <div className="text-sm font-medium text-[#0F5132] tabular-nums">
                          {resalePrice.toLocaleString('vi-VN')} ₫
                        </div>
                      </div>

                      {isPending ? (
                        currentRole === 'BRANCH_MANAGER' || currentRole === 'ADMIN' ? (
                          <button
                            type="button"
                            onClick={() => handleApproveResale(unit.id)}
                            className="bg-[#0F5132] hover:bg-emerald-900 text-white font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Duyệt mở bán (R7)</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-amber-800 italic">
                            Chờ Quản lý duyệt mở bán (R7)
                          </span>
                        )
                      ) : (
                        <span className="text-[#0F5132] font-medium text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đang mở bán</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
