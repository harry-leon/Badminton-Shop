'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Sparkles, UserCheck } from 'lucide-react';

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

  // Kiểm tra % điều chỉnh giá
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
          branchId: 'BR_HCM_01',
          staffId: 'nv_le_van_b',
          userRole: 'STAFF',
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
          setMessage(`Thu mua thành công hồ sơ ${data.caseId}! Đã tạo đơn vị ${data.unitId} chờ Quản lý duyệt bán.`);
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
          approvedBy: 'ql_nguyen_van_a',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Quản lý đã duyệt mở bán unit ${unitId}! Sản phẩm đã xuất hiện trên website storefront (/second-hand).`);
        await loadData();
      } else {
        alert(data.error || 'Lỗi duyệt mở bán');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const pendingUnits = units.filter((u) => u.status === 'PENDING_RESALE_APPROVAL');

  return (
    <div className="space-y-8">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#0F5132]" />
            Nghiệp Vụ Thu Mua & Phê Duyệt Vợt Cũ (Second-Hand)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quy trình độc quyền tại quầy: Kiểm định 5 tiêu chí, phân cấp A/B/C/D, kiểm soát giá ±10% (R5), loại trừ Hạng D (R6) và duyệt mở bán (R7).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('WIZARD')}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'WIZARD' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Wizard Thu Mua Tại Quầy
            </button>
            <button
              onClick={() => setActiveTab('RESALE_APPROVAL')}
              className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'RESALE_APPROVAL' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Duyệt Bán Lại ({pendingUnits.length})
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          {message}
        </div>
      )}

      {/* TAB 1: WIZARD THU MUA */}
      {activeTab === 'WIZARD' && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <form onSubmit={handleCompleteBuyback} className="space-y-6 text-xs">
              {/* Bước 1: Khách hàng */}
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                  1. Thông Tin Khách Bán Lại (Tuân thủ pháp lý ký gửi)
                </h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Họ tên khách hàng:</label>
                    <input
                      type="text"
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số điện thoại:</label>
                    <input
                      type="text"
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CCCD (Masked):</label>
                    <input
                      type="text"
                      value={sellerIdCard}
                      onChange={(e) => setSellerIdCard(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Bước 2: Model & Serial */}
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                  2. Thông Tin Cây Vợt & Đối Soát Serial
                </h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dòng vợt:</label>
                    <input
                      type="text"
                      value={racketModel}
                      onChange={(e) => setRacketModel(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số Serial (Trên thân/nón vợt):</label>
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Bước 3: Checklist kiểm định 5 điểm */}
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                  3. Biên Bản Kiểm Định Kỹ Thuật (Checklist 5 Điểm)
                </h2>
                <div className="grid sm:grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={checklist.frameNotCracked}
                      onChange={(e) => setChecklist({ ...checklist, frameNotCracked: e.target.checked })}
                      className="w-4 h-4 text-[#0F5132] rounded"
                    />
                    <span>Khung không rạn nứt / không hàn carbon</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={checklist.shaftStraight}
                      onChange={(e) => setChecklist({ ...checklist, shaftStraight: e.target.checked })}
                      className="w-4 h-4 text-[#0F5132] rounded"
                    />
                    <span>Đũa vợt thẳng, độ đàn hồi chuẩn</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={checklist.grommetIntact}
                      onChange={(e) => setChecklist({ ...checklist, grommetIntact: e.target.checked })}
                      className="w-4 h-4 text-[#0F5132] rounded"
                    />
                    <span>Gen cước nguyên vẹn, không lún sâu</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="checkbox"
                      checked={checklist.coneCodeVerified}
                      onChange={(e) => setChecklist({ ...checklist, coneCodeVerified: e.target.checked })}
                      className="w-4 h-4 text-[#0F5132] rounded"
                    />
                    <span>Mã nón (Cone code) & Logo sắc nét</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 sm:col-span-2">
                    <input
                      type="checkbox"
                      checked={checklist.tJointSolid}
                      onChange={(e) => setChecklist({ ...checklist, tJointSolid: e.target.checked })}
                      className="w-4 h-4 text-[#0F5132] rounded"
                    />
                    <span>Khớp chữ T nguyên bản, không kêu lạo xạo khi vung</span>
                  </label>
                </div>
              </div>

              {/* Bước 4: Xếp hạng & Định giá */}
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                  4. Đánh Giá Phân Cấp & Giá Đề Xuất
                </h2>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Xác thực nguồn gốc:</label>
                    <select
                      value={authStatus}
                      onChange={(e) => setAuthStatus(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                    >
                      <option value="AUTHENTIC">Chính hãng (AUTHENTIC)</option>
                      <option value="UNVERIFIED">Chưa xác minh nguồn gốc (UNVERIFIED)</option>
                      <option value="SUSPECTED_FAKE">Nghi ngờ hàng nhái (SUSPECTED_FAKE)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phân cấp hiện trạng:</label>
                    <select
                      value={grade}
                      onChange={(e) => setGrade(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
                    >
                      <option value="A">Hạng A (Như mới 98-99%, xước li ti)</option>
                      <option value="B">Hạng B (Ngoại hình 90-95%, trầy dăm)</option>
                      <option value="C">Hạng C (Ngoại hình 80-85%, tróc sơn nhiều)</option>
                      <option value="D">Hạng D (Nứt gãy / Biến dạng — TỪ CHỐI R6)</option>
                    </select>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Giá chuẩn theo bảng giá Snapshot (VND):</label>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(parseInt(e.target.value, 10))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Giá thu mua thực tế (VND):</label>
                    <input
                      type="number"
                      value={adjustedPrice}
                      onChange={(e) => setAdjustedPrice(parseInt(e.target.value, 10))}
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block font-bold text-slate-700 mb-1">Lý do điều chỉnh / Ghi chú tình trạng:</label>
                  <input
                    type="text"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Cảnh báo quy tắc nghiệp vụ */}
              {isRejected && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span><strong>QUY TẮC R6:</strong> Hàng Hạng D hoặc không rõ nguồn gốc bị hệ thống từ chối chi tiền thu mua.</span>
                </div>
              )}

              {isOutOfLimit && !isRejected && (
                <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span><strong>QUY TẮC R5:</strong> Mức điều chỉnh ({priceDiffPercent}%) vượt ngưỡng ±10%. Yêu cầu Branch Manager phê duyệt.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#0F5132] hover:bg-emerald-900 text-white font-bold py-3.5 rounded-xl transition cursor-pointer disabled:opacity-50 text-sm flex items-center justify-center gap-2"
              >
                {submitting 
                  ? 'Đang lưu hồ sơ...' 
                  : isRejected 
                    ? 'Lập Biên Bản Từ Chối Thu Mua (REJECTED R6)' 
                    : isOutOfLimit 
                      ? 'Gửi Duyệt Giá Vượt Ngưỡng (PENDING_APPROVAL R5)' 
                      : 'Hoàn Tất Thu Mua & Tạo Unit Chờ Mở Bán'}
              </button>
            </form>
          </div>

          {/* Cột Lịch Sử Thu Mua Gần Nhất */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-sm font-extrabold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                Hồ Sơ Thu Mua Gần Đây ({cases.length})
              </h2>

              <div className="space-y-3">
                {cases.map((c) => (
                  <div key={c.id} className="border border-slate-100 bg-slate-50/60 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-700">{c.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'PAID' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900">{c.racket_model}</div>
                    <div className="flex justify-between text-slate-500 text-[11px]">
                      <span>Hạng {c.grade} • {c.seller_name}</span>
                      <span className="font-bold text-[#0F5132]">
                        {parseInt(c.adjusted_price as any, 10).toLocaleString('vi-VN')}₫
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ DUYỆT BÁN LẠI (R7) */}
      {activeTab === 'RESALE_APPROVAL' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Danh Sách Vợt Cũ Chờ Quản Lý Phê Duyệt Niêm Yết Mở Bán ({units.length} chiếc)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Quy tắc R7: Vợt thu mua chỉ được xuất hiện trên Storefront khi Branch Manager ký duyệt giá bán và chính sách bảo hành.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {units.map((unit) => {
              const isPending = unit.status === 'PENDING_RESALE_APPROVAL';
              const resalePrice = parseInt(unit.resale_price as any, 10);

              return (
                <div
                  key={unit.id}
                  className={`border rounded-2xl p-5 text-xs flex flex-col justify-between ${
                    isPending ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono font-bold text-slate-500">{unit.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isPending ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {unit.status}
                      </span>
                    </div>

                    <h3 className="font-black text-slate-900 text-sm mb-1">{unit.model_name}</h3>
                    <div className="text-slate-600 space-y-1 mb-3">
                      <div><strong className="text-slate-800">Cấp hạng:</strong> Hạng {unit.grade}</div>
                      <div><strong className="text-slate-800">Serial:</strong> {unit.serial_number || 'N/A'}</div>
                      <div><strong className="text-slate-800">Bảo hành cam kết:</strong> {unit.warranty_days} ngày</div>
                      <div className="italic text-slate-500 text-[11px]">&quot;{unit.condition_notes}&quot;</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Giá niêm yết bán:</div>
                      <div className="text-base font-black text-[#0F5132]">
                        {resalePrice.toLocaleString('vi-VN')}₫
                      </div>
                    </div>

                    {isPending ? (
                      <button
                        onClick={() => handleApproveResale(unit.id)}
                        className="bg-[#0F5132] hover:bg-emerald-900 text-white font-bold px-3 py-2 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Duyệt Mở Bán
                      </button>
                    ) : (
                      <span className="text-emerald-700 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Đang hiển thị web
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
