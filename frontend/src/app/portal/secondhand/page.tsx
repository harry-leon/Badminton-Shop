'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  BadgeAlert,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

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

interface BuybackPriceRule {
  id: string;
  model_name: string;
  grade: string;
  base_price: number;
  is_active: boolean;
}

function AdminSecondhandPageContent() {
  const { selectedBranch, currentRole, user } = useAdmin();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'WIZARD' | 'RESALE_APPROVAL' | 'PRICE_TABLES'>(() => {
    if (urlTab === 'RESALE_APPROVAL' || urlTab === 'PRICE_TABLES') return urlTab;
    return 'WIZARD';
  });

  useEffect(() => {
    if (urlTab === 'RESALE_APPROVAL' || urlTab === 'PRICE_TABLES') {
      setActiveTab(urlTab);
    } else if (urlTab === 'WIZARD' || !urlTab) {
      setActiveTab('WIZARD');
    }
  }, [urlTab]);
  const [cases, setCases] = useState<BuybackCase[]>([]);
  const [units, setUnits] = useState<SecondhandUnit[]>([]);
  const [priceTables, setPriceTables] = useState<BuybackPriceRule[]>([]);
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

  // Price Tables state
  const [priceSearch, setPriceSearch] = useState('');
  const [priceGradeFilter, setPriceGradeFilter] = useState('ALL');
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [ruleModel, setRuleModel] = useState('');
  const [ruleGrade, setRuleGrade] = useState('A');
  const [ruleBasePrice, setRuleBasePrice] = useState('2000000');
  const [editingRule, setEditingRule] = useState<BuybackPriceRule | null>(null);
  const [submittingRule, setSubmittingRule] = useState(false);

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
        setPriceTables(data.priceTables || []);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu secondhand:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, []);

  // Tự động cập nhật giá sàn khi chọn model hoặc phân hạng từ priceTables
  useEffect(() => {
    if (priceTables.length > 0) {
      const matched = priceTables.find(
        (p) => p.model_name.toLowerCase() === racketModel.toLowerCase() && p.grade === grade && p.is_active
      );
      if (matched) {
        setBasePrice(Number(matched.base_price));
        setAdjustedPrice(Number(matched.base_price));
      }
    }
  }, [racketModel, grade, priceTables]);

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
          branchId: selectedBranch === 'ALL' ? 'BR_HCM_01' : selectedBranch,
          staffId: user?.username || 'staff_hcm_1',
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
        if (data.status === 'PAID') {
          toast.success(`Hồ sơ thu mua ${data.caseId} thành công! Đã tạo mã vợt cũ ${data.unitId}`);
        } else if (data.status === 'PENDING_MANAGER_APPROVAL') {
          toast.warning(`Hồ sơ ${data.caseId} cần Quản lý chi nhánh phê duyệt giá lệch >10%`);
        } else if (data.status === 'REJECTED') {
          toast.error(`Đã ghi nhận từ chối thu mua hồ sơ ${data.caseId} (Hạng D / Nghi hàng nhái)`);
        }
        await loadData();
      } else {
        toast.error(data.error || 'Lỗi khi tạo hồ sơ thu mua');
      }
    } catch (err: any) {
      toast.error(err.message);
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
          action: 'APPROVE_RESALE',
          approvedBy: user?.username || 'manager_hcm',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Đã phê duyệt mở bán niêm yết vợt ${unitId} thành công!`);
        await loadData();
      } else {
        toast.error(data.error || 'Lỗi phê duyệt mở bán');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSavePriceRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingRule(true);
    try {
      const action = editingRule ? 'UPDATE_PRICE_RULE' : 'CREATE_PRICE_RULE';
      const res = await fetch('/api/admin/secondhand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ruleId: editingRule?.id,
          model_name: ruleModel,
          grade: ruleGrade,
          base_price: Number(ruleBasePrice),
          is_active: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu quy tắc');
      toast.success(data.message);
      setIsPriceModalOpen(false);
      setEditingRule(null);
      setRuleModel('');
      setRuleGrade('A');
      setRuleBasePrice('2000000');
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingRule(false);
    }
  };

  const handleDeletePriceRule = async (ruleId: string) => {
    if (!confirm('Bạn có chắc muốn xóa quy tắc giá thu mua này?')) return;
    try {
      const res = await fetch('/api/admin/secondhand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_PRICE_RULE', ruleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa thất bại');
      toast.success(data.message);
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const pendingUnits = units.filter((u) => u.status === 'PENDING_RESALE_APPROVAL');

  const filteredPriceRules = priceTables.filter((p) => {
    const matchSearch = p.model_name.toLowerCase().includes(priceSearch.toLowerCase());
    const matchGrade = priceGradeFilter === 'ALL' || p.grade === priceGradeFilter;
    return matchSearch && matchGrade;
  });

  return (
    <div className="space-y-6">
      {/* TAB 3: BẢNG GIÁ THU MUA CHUẨN (PRICE_TABLES) */}
      {activeTab === 'PRICE_TABLES' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-black/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={priceSearch}
                onChange={(e) => setPriceSearch(e.target.value)}
                placeholder="Tìm kiếm dòng vợt thu mua (Yonex, Lining, Victor...)"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-black"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={priceGradeFilter}
                onChange={(e) => setPriceGradeFilter(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:border-black"
              >
                <option value="ALL">Tất cả phân hạng (A/B/C)</option>
                <option value="A">Hạng A (Như mới 95-99%)</option>
                <option value="B">Hạng B (Trầy nhẹ 90-95%)</option>
                <option value="C">Hạng C (Tróc sơn 80-90%)</option>
              </select>

              {(user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER') && (
                <button
                  onClick={() => {
                    setEditingRule(null);
                    setRuleModel('');
                    setRuleGrade('A');
                    setRuleBasePrice('2000000');
                    setIsPriceModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#0F5132] hover:bg-[#0c4128] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm quy tắc giá</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F5] text-gray-500 font-medium border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">DÒNG VỢT (MODEL)</th>
                  <th className="py-3 px-4">PHÂN HẠNG</th>
                  <th className="py-3 px-4">GIÁ SÀN THU MUA CHUẨN</th>
                  <th className="py-3 px-4">BIÊN ĐỘ CHO PHÉP (±10%)</th>
                  <th className="py-3 px-4">TRẠNG THÁI</th>
                  <th className="py-3 px-4 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredPriceRules.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      Không tìm thấy quy tắc giá thu mua nào.
                    </td>
                  </tr>
                ) : (
                  filteredPriceRules.map((rule) => {
                    const price = Number(rule.base_price);
                    const minBound = Math.round(price * 0.9);
                    const maxBound = Math.round(price * 1.1);

                    return (
                      <tr key={rule.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-3 px-4 font-medium text-gray-900">
                          {rule.model_name}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                            rule.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                            rule.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            Hạng {rule.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#0F5132] text-sm tabular-nums">
                          {price.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-[11px] tabular-nums font-mono">
                          {minBound.toLocaleString('vi-VN')} ₫ – {maxBound.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-700 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đang áp dụng</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {(user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER') && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingRule(rule);
                                  setRuleModel(rule.model_name);
                                  setRuleGrade(rule.grade);
                                  setRuleBasePrice(String(rule.base_price));
                                  setIsPriceModalOpen(true);
                                }}
                                className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                                title="Sửa giá sàn"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {user?.role === 'ADMIN' && (
                                <button
                                  onClick={() => handleDeletePriceRule(rule.id)}
                                  className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                                  title="Xóa quy tắc"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 1: BUYBACK WIZARD */}
      {activeTab === 'WIZARD' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 bg-white rounded-xl border border-black/10 p-5 sm:p-6 shadow-xs">
            <form onSubmit={handleCompleteBuyback} className="space-y-6 text-xs">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900">Biên bản Kiểm định 5 Điểm BWF</span>
                <span className="text-[11px] text-gray-400">Chi nhánh: {selectedBranch}</span>
              </div>

              {/* Thông tin người bán */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Tên người bán *</label>
                  <input
                    type="text"
                    required
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Số điện thoại *</label>
                  <input
                    type="text"
                    required
                    value={sellerPhone}
                    onChange={(e) => setSellerPhone(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg font-mono text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">CCCD (Đã che 6 số) *</label>
                  <input
                    type="text"
                    required
                    value={sellerIdCard}
                    onChange={(e) => setSellerIdCard(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg font-mono text-gray-900"
                  />
                </div>
              </div>

              {/* Thông tin cây vợt */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Model vợt thu mua *</label>
                  <select
                    value={racketModel}
                    onChange={(e) => setRacketModel(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-gray-900"
                  >
                    <option value="Yonex Astrox 88D Pro">Yonex Astrox 88D Pro</option>
                    <option value="Yonex Astrox 99 Pro">Yonex Astrox 99 Pro</option>
                    <option value="Yonex Astrox 100ZZ">Yonex Astrox 100ZZ</option>
                    <option value="Yonex Arcsaber 11 Pro">Yonex Arcsaber 11 Pro</option>
                    <option value="Lining Axforce 80">Lining Axforce 80</option>
                    <option value="Victor Thruster Ryuga II">Victor Thruster Ryuga II</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Số serial khắc nón/đũa *</label>
                  <input
                    type="text"
                    required
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg font-mono text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Thẩm định chính hãng *</label>
                  <select
                    value={authStatus}
                    onChange={(e) => setAuthStatus(e.target.value as any)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-gray-900"
                  >
                    <option value="AUTHENTIC">Chính hãng 100%</option>
                    <option value="UNVERIFIED">Chưa kiểm chứng</option>
                    <option value="SUSPECTED_FAKE">Nghi hàng nhái (Từ chối R6)</option>
                  </select>
                </div>
              </div>

              {/* Checklist 5 điểm */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                <span className="font-semibold text-gray-900 block mb-1">Checklist 5 Tiêu chí An toàn Khung:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.frameNotCracked}
                      onChange={(e) => setChecklist({ ...checklist, frameNotCracked: e.target.checked })}
                      className="rounded text-[#0F5132]"
                    />
                    <span>1. Khung chịu lực nguyên vẹn, không có vết nứt</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.shaftStraight}
                      onChange={(e) => setChecklist({ ...checklist, shaftStraight: e.target.checked })}
                      className="rounded text-[#0F5132]"
                    />
                    <span>2. Thân vợt (Shaft) thẳng tuyệt đối, đàn hồi tốt</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.grommetIntact}
                      onChange={(e) => setChecklist({ ...checklist, grommetIntact: e.target.checked })}
                      className="rounded text-[#0F5132]"
                    />
                    <span>3. Gen cước (Grommets) không bị lún hoặc rách</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.coneCodeVerified}
                      onChange={(e) => setChecklist({ ...checklist, coneCodeVerified: e.target.checked })}
                      className="rounded text-[#0F5132]"
                    />
                    <span>4. Mã khắc laser chóp nón sắc nét chuẩn hãng</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checklist.tJointSolid}
                      onChange={(e) => setChecklist({ ...checklist, tJointSolid: e.target.checked })}
                      className="rounded text-[#0F5132]"
                    />
                    <span>5. Khớp chữ T (T-Joint) đặc vững chắc, không rơ</span>
                  </label>
                </div>
              </div>

              {/* Phân hạng & Giá */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Phân hạng ngoại quan *</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                    className="w-full p-2 border border-gray-200 rounded-lg text-gray-900 font-medium"
                  >
                    <option value="A">Hạng A (Như mới 95-99%)</option>
                    <option value="B">Hạng B (Trầy xước nhẹ 90-95%)</option>
                    <option value="C">Hạng C (Tróc sơn quẹt sân 80-90%)</option>
                    <option value="D">Hạng D (Hư kết cấu - Chặn R6)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Giá sàn chuẩn hệ thống (₫)</label>
                  <input
                    type="number"
                    disabled
                    value={basePrice}
                    className="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg font-mono text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Giá đề xuất chi trả (₫) *</label>
                  <input
                    type="number"
                    required
                    value={adjustedPrice}
                    onChange={(e) => setAdjustedPrice(Number(e.target.value))}
                    className="w-full p-2 border border-gray-200 rounded-lg font-mono font-semibold text-gray-900"
                  />
                </div>
              </div>

              {/* Cảnh báo biên độ */}
              {isOutOfLimit && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Quy tắc R5:</strong> Mức giá điều chỉnh ({priceDiffPercent > 0 ? `+${priceDiffPercent}` : priceDiffPercent}%) lệch quá ±10% so với giá sàn. Yêu cầu Quản lý chi nhánh phê duyệt trước khi giải ngân.
                  </span>
                </div>
              )}

              {isRejected && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-xs flex items-center gap-2">
                  <BadgeAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    <strong>Quy tắc R6:</strong> Vợt Hạng D hoặc không thể chứng thực chính hãng. Hệ thống sẽ ghi nhận từ chối và cấm xuất tiền.
                  </span>
                </div>
              )}

              <div>
                <label className="block text-gray-700 font-medium mb-1">Lý do điều chỉnh / Ghi chú kiểm định</label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="Ghi nhận hiện trạng, số lần đan cước, phụ kiện kèm theo..."
                  className="w-full p-2 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#0F5132] hover:bg-[#0c4128] text-white rounded-lg font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#C8F31D]" />
                <span>{submitting ? 'Đang xử lý...' : 'Hoàn tất Kiểm định &amp; Lập Hồ sơ Thu mua'}</span>
              </button>
            </form>
          </div>

          {/* Cột Lịch sử hồ sơ thu mua gần đây (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-black/10 p-5 shadow-xs space-y-4">
            <h3 className="font-semibold text-sm text-gray-900 border-b border-gray-100 pb-2">
              Hồ sơ thu mua gần đây
            </h3>
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
              {cases.slice(0, 10).map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-gray-900">{c.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      c.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                      c.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="font-medium text-gray-800">{c.racket_model} (Hạng {c.grade})</div>
                  <div className="flex justify-between text-gray-500 text-[11px]">
                    <span>Khách: {c.seller_name}</span>
                    <span className="font-semibold text-[#0F5132]">
                      {Number(c.adjusted_price).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESALE APPROVAL (R7) */}
      {activeTab === 'RESALE_APPROVAL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {units.map((unit) => {
              const isPending = unit.status === 'PENDING_RESALE_APPROVAL';

              return (
                <div
                  key={unit.id}
                  className="bg-white rounded-xl border border-black/10 p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-gray-900">{unit.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {unit.status}
                      </span>
                    </div>

                    <h3 className="font-semibold text-gray-900 text-sm mt-2">{unit.model_name}</h3>
                    <div className="text-gray-500 space-y-1 mt-1 text-xs">
                      <div>Phân hạng: <strong className="text-gray-900">Hạng {unit.grade}</strong></div>
                      <div>Serial: <span className="font-mono text-gray-700">{unit.serial_number || 'N/A'}</span></div>
                      <div>Bảo hành cam kết: <strong className="text-gray-900">{unit.warranty_days} ngày</strong></div>
                      {unit.condition_notes && (
                        <div className="text-[11px] text-gray-500 italic mt-1 bg-gray-50 p-2 rounded">
                          &ldquo;{unit.condition_notes}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-gray-400">Giá niêm yết bán:</div>
                      <div className="text-sm font-semibold text-[#0F5132]">
                        {Number(unit.resale_price).toLocaleString('vi-VN')} ₫
                      </div>
                    </div>

                    {isPending ? (
                      (user?.role === 'BRANCH_MANAGER' || user?.role === 'ADMIN') ? (
                        <button
                          onClick={() => handleApproveResale(unit.id)}
                          className="px-3 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Duyệt mở bán (R7)</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-amber-700 italic">
                          Chờ Quản lý duyệt mở bán
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đang niêm yết</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Thêm/Sửa Quy tắc Giá */}
      {isPriceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#0F5132]" />
                <h3 className="text-sm font-semibold text-gray-900">
                  {editingRule ? 'Sửa Giá Sàn Thu Mua' : 'Thêm Quy Tắc Giá Sàn'}
                </h3>
              </div>
              <button onClick={() => setIsPriceModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSavePriceRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Tên Model Vợt *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingRule}
                  value={ruleModel}
                  onChange={(e) => setRuleModel(e.target.value)}
                  placeholder="VD: Yonex Astrox 100ZZ"
                  className="w-full p-2 border border-gray-200 rounded-lg disabled:bg-gray-100 font-medium text-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Phân hạng (Grade) *</label>
                <select
                  disabled={!!editingRule}
                  value={ruleGrade}
                  onChange={(e) => setRuleGrade(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg disabled:bg-gray-100 text-gray-900"
                >
                  <option value="A">Hạng A (Như mới 95-99%)</option>
                  <option value="B">Hạng B (Trầy nhẹ 90-95%)</option>
                  <option value="C">Hạng C (Tróc sơn 80-90%)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Giá sàn thu mua chuẩn (₫) *</label>
                <input
                  type="number"
                  required
                  value={ruleBasePrice}
                  onChange={(e) => setRuleBasePrice(e.target.value)}
                  placeholder="VD: 2500000"
                  className="w-full p-2 border border-gray-200 rounded-lg font-semibold text-gray-900"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Biên độ cho phép tự động: ±10% ({Math.round(Number(ruleBasePrice) * 0.9).toLocaleString('vi-VN')} ₫ – {Math.round(Number(ruleBasePrice) * 1.1).toLocaleString('vi-VN')} ₫)
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPriceModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingRule}
                  className="px-4 py-2 bg-[#0F5132] hover:bg-[#0c4128] text-white rounded-lg font-medium cursor-pointer"
                >
                  {submittingRule ? 'Đang lưu...' : 'Lưu quy tắc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSecondhandPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Đang tải sàn vợt cũ...</div>}>
      <AdminSecondhandPageContent />
    </React.Suspense>
  );
}
