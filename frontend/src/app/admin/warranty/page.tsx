'use client';

import React, { useState, useEffect } from 'react';
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
  FileText
} from 'lucide-react';

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

export default function AdminWarrantyPage() {
  const { selectedBranch, currentRole } = useAdmin();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [events, setEvents] = useState<ClaimEvent[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/warranty');
      const data = await res.json();
      if (res.ok) {
        setClaims(data.claims || []);
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu bảo hành:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (
    claimId: string, 
    toStatus: string, 
    resolutionType?: string,
    rejectReason?: string
  ) => {
    try {
      const res = await fetch('/api/admin/warranty', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          toStatus,
          actor: currentRole === 'STAFF' ? 'ktv_staff_portal' : 'manager_admin_portal',
          actorRole: currentRole,
          resolutionType,
          rejectionReason: rejectReason,
          notes: `Thao tác thẩm định bảo hành: chuyển sang ${toStatus}`,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Cập nhật hồ sơ ${claimId} sang ${toStatus} thành công!`);
        setTimeout(() => setActionSuccess(''), 4000);
        await loadData();
      } else {
        alert(data.error || 'Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredClaims = filterStatus === 'ALL' 
    ? claims 
    : claims.filter((c) => c.status === filterStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-900 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-700" />
            Mới tiếp nhận
          </span>
        );
      case 'INSPECTING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 border border-amber-200">
            <Wrench className="w-3 h-3 text-amber-700" />
            Đang kiểm định
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            Đã duyệt bảo hành
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-rose-100 text-rose-900 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-700" />
            Từ chối bảo hành
          </span>
        );
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-800">
            <UserCheck className="w-3 h-3 text-stone-600" />
            Đã hoàn tất & Đóng
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E4E3DD]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded bg-[#0F5132]/10 text-[#0F5132] font-medium border border-[#0F5132]/20">
              Chi nhánh: {selectedBranch}
            </span>
            <span className="text-xs text-[#6A726E]">Kịch bản K9, K10 & Nhật ký kiểm toán R10</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-[#111613] tracking-tight">
            Quản lý & thẩm định hồ sơ bảo hành
          </h1>
          <p className="text-xs text-[#6A726E] mt-0.5">
            Quy trình tiếp nhận, kiểm định lỗi NSX, phê duyệt đền bù và ghi nhật ký máy trạng thái không thể đảo ngược.
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

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs border-b border-[#E4E3DD] pb-3">
        {[
          { key: 'ALL', label: `Tất cả (${claims.length})` },
          { key: 'SUBMITTED', label: `Mới tiếp nhận (${claims.filter(c => c.status === 'SUBMITTED').length})` },
          { key: 'INSPECTING', label: `Đang kiểm định (${claims.filter(c => c.status === 'INSPECTING').length})` },
          { key: 'APPROVED', label: `Đã duyệt (${claims.filter(c => c.status === 'APPROVED').length})` },
          { key: 'REJECTED', label: `Bị từ chối (${claims.filter(c => c.status === 'REJECTED').length})` },
          { key: 'CLOSED', label: `Đã đóng (${claims.filter(c => c.status === 'CLOSED').length})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              filterStatus === tab.key
                ? 'bg-[#0F5132] text-white font-medium'
                : 'bg-white text-[#6A726E] hover:bg-stone-50 border border-[#E4E3DD]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Claims List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredClaims.length === 0 ? (
            <div className="bg-white border border-[#E4E3DD] rounded-xl p-8 text-center text-xs text-[#6A726E]">
              Không có hồ sơ nào ở trạng thái này.
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div key={claim.id} className="bg-white border border-[#E4E3DD] rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E3DD] pb-3">
                  <div>
                    <span className="text-[11px] font-mono text-[#6A726E]">ID: {claim.id}</span>
                    <h3 className="text-sm font-medium text-[#111613] mt-0.5">{claim.product_name}</h3>
                  </div>
                  <div>
                    {getStatusBadge(claim.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#6A726E]">
                  <div><span className="text-[#111613]">Mã đơn:</span> <span className="font-mono">{claim.order_code}</span></div>
                  <div><span className="text-[#111613]">Serial:</span> <span className="font-mono">{claim.serial_number || 'N/A'}</span></div>
                  <div><span className="text-[#111613]">SĐT khách:</span> {claim.customer_phone}</div>
                  <div><span className="text-[#111613]">Kỹ thuật viên:</span> {claim.assigned_technician || 'Chưa gán'}</div>
                </div>

                {/* Damage description */}
                <div className="bg-[#F5F4F0] border border-[#E4E3DD] rounded-lg p-3 text-xs">
                  <span className="font-medium text-[#111613]">Mô tả hỏng hóc: </span>
                  <span className="text-[#6A726E]">{claim.damage_description}</span>
                </div>

                {/* Policy Snapshot (R9) */}
                <div className="bg-[#0F5132]/5 border border-[#0F5132]/20 rounded-lg p-3 text-xs">
                  <span className="font-medium text-[#0F5132]">Chính sách bảo hành Snapshot (R9): </span>
                  <span className="text-[#0F5132]">{claim.policy_snapshot}</span>
                </div>

                {claim.rejection_reason && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs">
                    <span className="font-medium text-rose-950">Lý do từ chối: </span>
                    <span className="text-rose-900">{claim.rejection_reason}</span>
                  </div>
                )}

                {/* Action Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#E4E3DD] text-xs">
                  {claim.status === 'SUBMITTED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(claim.id, 'INSPECTING')}
                      className="bg-amber-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Tiếp nhận kiểm định</span>
                    </button>
                  )}

                  {claim.status === 'INSPECTING' && (
                    currentRole === 'BRANCH_MANAGER' || currentRole === 'ADMIN' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(claim.id, 'APPROVED', 'REPLACE')}
                          className="bg-[#0F5132] text-white font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Duyệt đổi mới (Lỗi NSX)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(claim.id, 'APPROVED', 'REPAIR')}
                          className="bg-blue-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Duyệt sửa chữa khung</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveClaimId(claim.id);
                            setRejectModalOpen(true);
                          }}
                          className="bg-rose-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Từ chối (Va đập đối kháng - K10)</span>
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-amber-800 italic">
                        Đang kiểm định — Chờ Quản lý chi nhánh (BRANCH_MANAGER) duyệt phương án hoặc từ chối
                      </span>
                    )
                  )}

                  {claim.status === 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(claim.id, 'CLOSED')}
                      className="bg-[#111613] text-white font-medium px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Hoàn tất & Trả khách (CLOSED)</span>
                    </button>
                  )}

                  {claim.status === 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(claim.id, 'CLOSED')}
                      className="bg-stone-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-stone-700 transition-colors flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Trả lại hiện trạng & Đóng</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Audit Log Sidebar (R10) */}
        <div className="bg-white border border-[#E4E3DD] rounded-xl p-5 shadow-xs h-fit space-y-4">
          <div className="flex items-center gap-2 text-xs font-medium text-[#111613] border-b border-[#E4E3DD] pb-3">
            <History className="w-4 h-4 text-[#0F5132]" />
            <span>Nhật ký máy trạng thái (Audit Trail R10)</span>
          </div>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="text-xs text-[#6A726E]">Chưa có sự kiện chuyển đổi trạng thái nào.</div>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="text-xs border-l-2 border-[#0F5132] pl-3 py-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#6A726E]">
                    <span className="font-mono text-[#111613]">{ev.claim_id}</span>
                    <span>{new Date(ev.created_at).toLocaleTimeString('vi-VN')}</span>
                  </div>
                  <div className="text-[#111613] flex items-center gap-1">
                    <span className="bg-stone-100 px-1.5 py-0.5 rounded text-[10px]">{ev.from_status}</span>
                    <ArrowRight className="w-3 h-3 text-[#6A726E]" />
                    <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-medium">{ev.to_status}</span>
                  </div>
                  <div className="text-[#6A726E] italic text-[11px]">&ldquo;{ev.notes}&rdquo;</div>
                  <div className="text-[10px] text-[#6A726E]">Bởi: {ev.actor}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Từ chối bảo hành (Bắt buộc lý do R6/K10) */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl border border-[#E4E3DD]">
            <div className="flex items-center gap-2 text-rose-700 font-medium text-base mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Lý do từ chối bảo hành (Bắt buộc)</span>
            </div>
            <p className="text-xs text-[#6A726E] mb-4">
              Theo quy chuẩn hệ thống và kịch bản K10, từ chối bảo hành cần ghi rõ bằng chứng (vết va chạm đối kháng, căng quá cân lbs quy định, đập vào sân) để đối soát minh bạch với khách hàng.
            </p>

            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="VD: Kiểm tra phát hiện vết dập méo do va quẹt với khung vợt khác tại góc 10h, kèm sơn xanh của vợt ngoài."
              className="w-full text-xs p-3 border border-[#E4E3DD] rounded-lg focus:outline-none focus:border-rose-500 mb-4 text-[#111613]"
            />

            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-[#E4E3DD] rounded-lg text-[#6A726E] hover:bg-stone-50"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!rejectionReason.trim()}
                onClick={() => {
                  if (activeClaimId && rejectionReason.trim()) {
                    handleUpdateStatus(activeClaimId, 'REJECTED', undefined, rejectionReason.trim());
                    setRejectModalOpen(false);
                    setRejectionReason('');
                  }
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-40 font-medium"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
