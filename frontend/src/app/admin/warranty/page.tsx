'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Wrench, CheckCircle2, XCircle, Clock, 
  AlertTriangle, History, ArrowRight, UserCheck, RefreshCw 
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
          actor: 'ktv_admin_portal',
          resolutionType,
          rejectionReason: rejectReason,
          notes: `Thao tác phê duyệt trên Admin Portal: chuyển sang ${toStatus}`,
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

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800">
            <ShieldCheck className="w-4 h-4" />
            Warranty Claim Center
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Quản Lý & Kiểm Định Hồ Sơ Bảo Hành
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quy trình tiếp nhận, kiểm định lỗi NSX, phê duyệt đền bù và nhật ký máy trạng thái (RFC 9457 & R10).
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới dữ liệu
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-bold border-b border-slate-200 pb-3">
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
            onClick={() => setFilterStatus(tab.key)}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === tab.key
                ? 'bg-[#0F5132] text-white'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Claims List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredClaims.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-xs text-slate-500">
              Không có hồ sơ nào ở trạng thái này.
            </div>
          ) : (
            filteredClaims.map((claim) => (
              <div key={claim.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-400">ID: {claim.id}</span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{claim.product_name}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                      {claim.status}
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                  <div><strong className="text-slate-800">Đơn hàng:</strong> {claim.order_code}</div>
                  <div><strong className="text-slate-800">Số serial:</strong> {claim.serial_number || 'N/A'}</div>
                  <div><strong className="text-slate-800">SĐT khách:</strong> {claim.customer_phone}</div>
                  <div><strong className="text-slate-800">KTV:</strong> {claim.assigned_technician || 'Chưa gán'}</div>
                </div>

                {/* Damage description */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs mb-3">
                  <span className="font-bold text-slate-800">Mô tả hỏng hóc: </span>
                  <span className="text-slate-700">{claim.damage_description}</span>
                </div>

                {/* Policy Snapshot (R9) */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs mb-4">
                  <span className="font-bold text-emerald-950">Snapshot Chính Sách (R9): </span>
                  <span className="text-emerald-900">{claim.policy_snapshot}</span>
                </div>

                {claim.rejection_reason && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs mb-4">
                    <span className="font-bold text-rose-950">Lý do từ chối: </span>
                    <span className="text-rose-900">{claim.rejection_reason}</span>
                  </div>
                )}

                {/* Action Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
                  {claim.status === 'SUBMITTED' && (
                    <button
                      onClick={() => handleUpdateStatus(claim.id, 'INSPECTING')}
                      className="bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-amber-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <Wrench className="w-3.5 h-3.5" /> Tiếp nhận kiểm định
                    </button>
                  )}

                  {claim.status === 'INSPECTING' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(claim.id, 'APPROVED', 'REPLACE')}
                        className="bg-[#0F5132] text-white font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-900 transition cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Duyệt Đổi Mới (NSX)
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(claim.id, 'APPROVED', 'REPAIR')}
                        className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700 transition cursor-pointer flex items-center gap-1"
                      >
                        <Wrench className="w-3.5 h-3.5" /> Duyệt Sửa Chữa Khung
                      </button>
                      <button
                        onClick={() => {
                          setActiveClaimId(claim.id);
                          setRejectModalOpen(true);
                        }}
                        className="bg-rose-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-rose-700 transition cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Từ chối (Lỗi do khách)
                      </button>
                    </>
                  )}

                  {claim.status === 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(claim.id, 'CLOSED')}
                      className="bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-slate-900 transition cursor-pointer flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Hoàn tất & Trả khách (CLOSED)
                    </button>
                  )}

                  {claim.status === 'REJECTED' && (
                    <button
                      onClick={() => handleUpdateStatus(claim.id, 'CLOSED')}
                      className="bg-slate-600 text-white font-bold px-3 py-1.5 rounded-lg hover:bg-slate-700 transition cursor-pointer flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Trả lại hiện trạng & Đóng
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Audit Log Sidebar (R10) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-fit">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-3 mb-4">
            <History className="w-4 h-4 text-[#0F5132]" />
            Nhật Ký Máy Trạng Thái (Audit Trail R10)
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {events.length === 0 ? (
              <div className="text-xs text-slate-400">Chưa có sự kiện chuyển đổi trạng thái nào.</div>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="text-xs border-l-2 border-emerald-700 pl-3 py-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-mono font-bold text-slate-600">{ev.claim_id}</span>
                    <span>{new Date(ev.created_at).toLocaleTimeString('vi-VN')}</span>
                  </div>
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">{ev.from_status}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-bold">{ev.to_status}</span>
                  </div>
                  <div className="text-slate-600 italic text-[11px]">&quot;{ev.notes}&quot;</div>
                  <div className="text-[10px] text-slate-400">Bởi: {ev.actor}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal Từ chối bảo hành (Bắt buộc lý do R6/Checklist) */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base mb-2">
              <AlertTriangle className="w-5 h-5" />
              Lý Do Từ Chối Bảo Hành (Bắt buộc)
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Theo quy chuẩn hệ thống, từ chối bảo hành cần ghi rõ bằng chứng (vết va chạm đối kháng, căng quá cân lbs quy định, đập vào sân) để đối soát minh bạch với khách hàng.
            </p>

            <textarea
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="VD: Kiểm tra phát hiện vết dập méo do va quẹt với khung vợt khác tại góc 10h, kèm sơn xanh của vợt ngoài."
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4 text-slate-800"
            />

            <div className="flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                disabled={!rejectionReason.trim()}
                onClick={() => {
                  if (activeClaimId && rejectionReason.trim()) {
                    handleUpdateStatus(activeClaimId, 'REJECTED', undefined, rejectionReason.trim());
                    setRejectModalOpen(false);
                    setRejectionReason('');
                  }
                }}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 cursor-pointer disabled:opacity-40"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
