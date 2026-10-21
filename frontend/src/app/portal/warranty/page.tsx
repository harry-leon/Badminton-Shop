'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAdmin } from '@/lib/admin-context';
import { 
  ShieldCheck, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  History, 
  ArrowRight, 
  UserCheck, 
  RefreshCw,
  FileText,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  User,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface Claim {
  id: string;
  order_code: string;
  customer_phone: string;
  serial_number: string;
  product_name: string;
  policy_snapshot: string;
  damage_description: string;
  images_json: string;
  status: 'SUBMITTED' | 'INSPECTING' | 'APPROVED' | 'REJECTED' | 'RESOLVED' | 'CLOSED';
  rejection_reason?: string;
  resolution_type?: string;
  assigned_technician?: string;
  estimated_return_date?: string;
  repair_cost?: number;
  branch_id?: string;
  created_at: string;
  updated_at: string;
}

interface ClaimEvent {
  id: string;
  claim_id: string;
  from_status: string;
  to_status: string;
  actor: string;
  notes: string;
  created_at: string;
}

interface WarrantyPolicy {
  id: string;
  name: string;
  duration_months: number;
  coverage_type: string;
  terms_text: string;
}

function AdminWarrantyPageContent() {
  const { selectedBranch, currentRole, user } = useAdmin();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'CLAIMS' | 'POLICIES'>(() => {
    if (urlTab === 'POLICIES') return 'POLICIES';
    return 'CLAIMS';
  });

  useEffect(() => {
    if (urlTab === 'POLICIES') {
      setActiveTab('POLICIES');
    } else if (urlTab === 'CLAIMS' || !urlTab) {
      setActiveTab('CLAIMS');
    }
  }, [urlTab]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [events, setEvents] = useState<ClaimEvent[]>([]);
  const [policies, setPolicies] = useState<WarrantyPolicy[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  // Modal Decision / Reject
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [activeClaim, setActiveClaim] = useState<Claim | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [resolutionType, setResolutionType] = useState('REPLACEMENT');
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignedTech, setAssignedTech] = useState('');
  const [estReturnDate, setEstReturnDate] = useState('');
  const [repairCost, setRepairCost] = useState('0');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Policy Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [policyId, setPolicyId] = useState('');
  const [policyName, setPolicyName] = useState('');
  const [policyDuration, setPolicyDuration] = useState('12');
  const [policyCoverage, setPolicyCoverage] = useState('FRAME_DEFECT');
  const [policyTerms, setPolicyTerms] = useState('');
  const [editingPolicy, setEditingPolicy] = useState<WarrantyPolicy | null>(null);
  const [submittingPolicy, setSubmittingPolicy] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/warranty');
      const data = await res.json();
      if (res.ok) {
        setClaims(data.claims || []);
        setEvents(data.events || []);
        setPolicies(data.policies || []);
      } else {
        toast.error(data.error || 'Lỗi khi tải dữ liệu bảo hành');
      }
    } catch (err: any) {
      toast.error(err.message);
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

  const handleUpdateStatus = async (
    claimId: string, 
    toStatus: string, 
    resolution?: string,
    rejectReason?: string
  ) => {
    try {
      const res = await fetch('/api/admin/warranty', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          toStatus,
          actor: user?.username || 'ktv_staff_portal',
          resolutionType: resolution,
          rejectionReason: rejectReason,
          notes: `Thao tác thẩm định bảo hành: chuyển sang ${toStatus}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Cập nhật hồ sơ ${claimId} sang ${toStatus} thành công!`);
        await loadData();
      } else {
        toast.error(data.error || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClaim) return;
    setSubmittingDecision(true);
    try {
      const res = await fetch('/api/admin/warranty', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId: activeClaim.id,
          toStatus: decisionStatus,
          actor: user?.username || 'manager_portal',
          resolutionType: decisionStatus === 'APPROVED' ? resolutionType : undefined,
          rejectionReason: decisionStatus === 'REJECTED' ? rejectionReason : undefined,
          assignedTechnician: assignedTech || undefined,
          estimatedReturnDate: estReturnDate || undefined,
          repairCost: repairCost ? Number(repairCost) : 0,
          branchId: selectedBranch !== 'ALL' ? selectedBranch : undefined,
          notes: `Phán quyết bảo hành: ${decisionStatus} - KTV: ${assignedTech || 'Chưa gán'}`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi phán quyết bảo hành');
      toast.success('Đã lưu kết quả giám định và phán quyết bảo hành!');
      setDecisionModalOpen(false);
      setActiveClaim(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPolicy(true);
    try {
      const action = editingPolicy ? 'UPDATE_POLICY' : 'CREATE_POLICY';
      const res = await fetch('/api/admin/warranty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          id: policyId,
          name: policyName,
          duration_months: Number(policyDuration),
          coverage_type: policyCoverage,
          terms_text: policyTerms,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu chính sách thất bại');
      toast.success(data.message);
      setIsPolicyModalOpen(false);
      setEditingPolicy(null);
      setPolicyId('');
      setPolicyName('');
      setPolicyDuration('12');
      setPolicyCoverage('FRAME_DEFECT');
      setPolicyTerms('');
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingPolicy(false);
    }
  };

  const handleDeletePolicy = async (pId: string) => {
    if (!confirm(`Bạn có chắc muốn xóa chính sách bảo hành ${pId}?`)) return;
    try {
      const res = await fetch('/api/admin/warranty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_POLICY', id: pId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa thất bại');
      toast.success(data.message);
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredClaims = claims.filter(
    (c) => filterStatus === 'ALL' || c.status === filterStatus
  );

  return (
    <div className="space-y-6">
      {/* On-page Tab Navigation Strip for Mobile/Tablet */}
      <div className="flex items-center gap-1.5 border-b border-[#E4E3DD] overflow-x-auto no-scrollbar pb-1">
        <Link
          href="/portal/warranty?tab=CLAIMS"
          className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap touch-target-hit inline-flex items-center gap-1.5 ${
            activeTab === 'CLAIMS'
              ? 'bg-white border-t border-x border-[#E4E3DD] text-[#0F5132] font-semibold'
              : 'text-[#6A726E] hover:text-[#111613]'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Hồ sơ bảo hành ({claims.length})</span>
        </Link>
        <Link
          href="/portal/warranty?tab=POLICIES"
          className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap touch-target-hit inline-flex items-center gap-1.5 ${
            activeTab === 'POLICIES'
              ? 'bg-white border-t border-x border-[#E4E3DD] text-[#0F5132] font-semibold'
              : 'text-[#6A726E] hover:text-[#111613]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Chính sách bảo hành</span>
        </Link>
      </div>

      {activeTab === 'POLICIES' ? (
        /* TAB CHÍNH SÁCH BẢO HÀNH (POLICIES) */
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-black/10 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#0F5132]" />
              <h2 className="text-sm font-semibold text-gray-900">Danh mục Gói &amp; Chính sách Bảo hành Điện tử</h2>
            </div>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => {
                  setEditingPolicy(null);
                  setPolicyId('');
                  setPolicyName('');
                  setPolicyDuration('12');
                  setPolicyCoverage('FRAME_DEFECT');
                  setPolicyTerms('');
                  setIsPolicyModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#0F5132] hover:bg-[#0c4128] text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm chính sách mới</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {policies.map((p) => (
              <div key={p.id} className="bg-white rounded-xl border border-black/10 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-[#0F5132] bg-emerald-50 px-2 py-0.5 rounded">
                      {p.id}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {p.duration_months} tháng
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mt-2">{p.name}</h3>
                  <div className="text-[11px] text-gray-500 font-mono mt-0.5">Phạm vi: {p.coverage_type}</div>
                  <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-light leading-relaxed">
                    {p.terms_text}
                  </p>
                </div>

                {user?.role === 'ADMIN' && (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setEditingPolicy(p);
                        setPolicyId(p.id);
                        setPolicyName(p.name);
                        setPolicyDuration(String(p.duration_months));
                        setPolicyCoverage(p.coverage_type);
                        setPolicyTerms(p.terms_text);
                        setIsPolicyModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                      title="Sửa chính sách"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePolicy(p.id)}
                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                      title="Xóa chính sách"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* TAB DANH SÁCH HỒ SƠ YÊU CẦU */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 rounded-xl border border-black/10 shadow-xs">
              {['ALL', 'SUBMITTED', 'INSPECTING', 'APPROVED', 'REJECTED', 'RESOLVED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    filterStatus === st ? 'bg-[#0F5132] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {st === 'ALL' ? 'Tất cả trạng thái' : st}
                </button>
              ))}
            </div>

            {/* Claims Cards */}
            <div className="space-y-3">
              {filteredClaims.length === 0 ? (
                <div className="bg-white rounded-xl border border-black/10 p-12 text-center text-xs text-gray-400">
                  Không tìm thấy hồ sơ bảo hành nào phù hợp bộ lọc.
                </div>
              ) : (
                filteredClaims.map((claim) => (
                  <div
                    key={claim.id}
                    className="bg-white rounded-xl border border-black/10 p-4 shadow-xs space-y-3 hover:border-black/20 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-gray-900">{claim.id}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            claim.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            claim.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                            claim.status === 'INSPECTING' ? 'bg-blue-100 text-blue-800' :
                            claim.status === 'RESOLVED' ? 'bg-purple-100 text-purple-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {claim.status}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-gray-900 mt-1">{claim.product_name}</h3>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          Số serial: <span className="text-gray-800 font-medium">{claim.serial_number}</span> | Đơn: <span className="text-gray-800">{claim.order_code}</span>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-gray-400">
                        {new Date(claim.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-lg text-xs space-y-1.5 border border-stone-100">
                      <div><strong className="text-gray-900">Mô tả tổn hại:</strong> <span className="text-gray-700">{claim.damage_description}</span></div>
                      <div><strong className="text-gray-900">Khách hàng:</strong> <span className="font-mono">{claim.customer_phone}</span></div>
                      {claim.assigned_technician && (
                        <div><strong className="text-gray-900">Kỹ thuật viên phụ trách:</strong> <span className="text-[#0F5132] font-medium">{claim.assigned_technician}</span></div>
                      )}
                      {claim.estimated_return_date && (
                        <div><strong className="text-gray-900">Ngày hẹn trả:</strong> <span className="font-mono">{new Date(claim.estimated_return_date).toLocaleDateString('vi-VN')}</span></div>
                      )}
                      {claim.resolution_type && (
                        <div><strong className="text-gray-900">Phương án giải quyết:</strong> <span className="font-semibold text-emerald-700">{claim.resolution_type}</span></div>
                      )}
                      {claim.rejection_reason && (
                        <div className="text-red-600"><strong className="text-red-700">Lý do từ chối:</strong> {claim.rejection_reason}</div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100">
                      {claim.status === 'SUBMITTED' && (
                        <button
                          onClick={() => handleUpdateStatus(claim.id, 'INSPECTING')}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Tiếp nhận giám định (INSPECTING)</span>
                        </button>
                      )}

                      {claim.status === 'INSPECTING' && (
                        <button
                          onClick={() => {
                            setActiveClaim(claim);
                            setDecisionStatus('APPROVED');
                            setAssignedTech(claim.assigned_technician || '');
                            setEstReturnDate(claim.estimated_return_date || '');
                            setRepairCost(String(claim.repair_cost || 0));
                            setDecisionModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Phán quyết kết quả (Duyệt/Từ chối)</span>
                        </button>
                      )}

                      {claim.status === 'APPROVED' && (
                        <button
                          onClick={() => handleUpdateStatus(claim.id, 'RESOLVED')}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã trả khách (RESOLVED)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Trail Sidebar (1 col) */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-black/10 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <History className="w-4 h-4 text-[#0F5132]" />
                <h3 className="text-sm font-semibold text-gray-900">Nhật ký Giám định &amp; Audit Log</h3>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {events.length === 0 ? (
                  <div className="text-center text-xs text-gray-400 py-8">Chưa có sự kiện nào.</div>
                ) : (
                  events.map((ev) => (
                    <div key={ev.id} className="text-xs p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-1">
                      <div className="flex items-center justify-between text-gray-500 text-[10px]">
                        <span className="font-mono font-medium text-gray-700">{ev.claim_id}</span>
                        <span>{new Date(ev.created_at).toLocaleString('vi-VN')}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-gray-800 text-[11px]">
                        <span>{ev.from_status}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="text-[#0F5132]">{ev.to_status}</span>
                      </div>
                      <div className="text-gray-600 text-[11px]">{ev.notes}</div>
                      <div className="text-[10px] text-gray-400">Thao tác: {ev.actor}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Phán Quyết Bảo Hành */}
      {decisionModalOpen && activeClaim && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#0F5132]" />
                <h3 className="text-sm font-semibold text-gray-900">Phán quyết Kết quả Giám định Bảo hành</h3>
              </div>
              <button onClick={() => setDecisionModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSaveDecision} className="space-y-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-lg space-y-1 border border-gray-100">
                <div><strong className="text-gray-900">Sản phẩm:</strong> {activeClaim.product_name}</div>
                <div><strong className="text-gray-900">Số serial:</strong> <span className="font-mono">{activeClaim.serial_number}</span></div>
                <div><strong className="text-gray-900">Mô tả tổn hại:</strong> {activeClaim.damage_description}</div>
              </div>

              {/* Lựa chọn Quyết định */}
              <div>
                <label className="block text-gray-700 font-medium mb-1">Kết quả phán quyết *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDecisionStatus('APPROVED')}
                    className={`py-2 px-3 rounded-lg border font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      decisionStatus === 'APPROVED' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#0F5132]" />
                    <span>Chấp thuận bảo hành</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionStatus('REJECTED')}
                    className={`py-2 px-3 rounded-lg border font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      decisionStatus === 'REJECTED' ? 'bg-red-50 border-red-500 text-red-800' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Từ chối có biên bản</span>
                  </button>
                </div>
              </div>

              {decisionStatus === 'APPROVED' ? (
                <>
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Phương án xử lý (Resolution) *</label>
                    <select
                      value={resolutionType}
                      onChange={(e) => setResolutionType(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-black"
                    >
                      <option value="REPLACEMENT">Đổi khung mới 100% (Theo chính sách hãng)</option>
                      <option value="REPAIR">Hàn Carbon phục hồi cấu trúc chịu lực</option>
                      <option value="PARTIAL_REFUND">Hỗ trợ trợ giá đổi dòng tương đương</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Kỹ thuật viên phụ trách</label>
                      <input
                        type="text"
                        value={assignedTech}
                        onChange={(e) => setAssignedTech(e.target.value)}
                        placeholder="VD: KTV Võ Tuấn Kiệt"
                        className="w-full p-2 border border-gray-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-1">Ngày hẹn trả dự kiến</label>
                      <input
                        type="date"
                        value={estReturnDate}
                        onChange={(e) => setEstReturnDate(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Chi phí phát sinh (nếu có, ₫)</label>
                    <input
                      type="number"
                      value={repairCost}
                      onChange={(e) => setRepairCost(e.target.value)}
                      className="w-full p-2 border border-gray-200 rounded-lg font-mono"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Lý do từ chối chi tiết (Bắt buộc) *</label>
                  <textarea
                    required
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="VD: Vợt bị va đập góc 3h gây gãy ngoại lực, không phải nứt tự nhiên do lỗi cấu trúc vật liệu..."
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingDecision}
                  className="px-4 py-2 bg-[#0F5132] hover:bg-[#0c4128] text-white rounded-lg font-medium cursor-pointer"
                >
                  {submittingDecision ? 'Đang lưu...' : 'Lưu phán quyết'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo/Sửa Chính Sách */}
      {isPolicyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0F5132]" />
                <h3 className="text-sm font-semibold text-gray-900">
                  {editingPolicy ? 'Chỉnh sửa Chính sách' : 'Thêm Chính sách Bảo hành'}
                </h3>
              </div>
              <button onClick={() => setIsPolicyModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Mã chính sách (ID) *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingPolicy}
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value.toUpperCase())}
                  placeholder="VD: POL_NEW_24M"
                  className="w-full p-2 border border-gray-200 rounded-lg font-mono disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Tên chính sách *</label>
                <input
                  type="text"
                  required
                  value={policyName}
                  onChange={(e) => setPolicyName(e.target.value)}
                  placeholder="VD: Bảo hành khung vợt cao cấp 24 tháng"
                  className="w-full p-2 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Thời hạn (tháng) *</label>
                  <input
                    type="number"
                    required
                    value={policyDuration}
                    onChange={(e) => setPolicyDuration(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Loại bảo hành *</label>
                  <select
                    value={policyCoverage}
                    onChange={(e) => setPolicyCoverage(e.target.value)}
                    className="w-full p-2 border border-gray-200 rounded-lg"
                  >
                    <option value="FRAME_DEFECT">Lỗi nứt gãy khung</option>
                    <option value="STRUCTURAL_INTEGRITY">Kết cấu chịu lực</option>
                    <option value="ACCESSORY">Phụ kiện &amp; Chi tiết</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Điều khoản &amp; Cam kết *</label>
                <textarea
                  required
                  rows={3}
                  value={policyTerms}
                  onChange={(e) => setPolicyTerms(e.target.value)}
                  placeholder="Nội dung điều khoản bảo hành cam kết với khách mua..."
                  className="w-full p-2 border border-gray-200 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPolicyModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 font-medium hover:bg-gray-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingPolicy}
                  className="px-4 py-2 bg-[#0F5132] hover:bg-[#0c4128] text-white rounded-lg font-medium cursor-pointer"
                >
                  {submittingPolicy ? 'Đang lưu...' : 'Lưu chính sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminWarrantyPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Đang tải quản lý bảo hành...</div>}>
      <AdminWarrantyPageContent />
    </React.Suspense>
  );
}
