'use client';

import React, { useState, useEffect } from 'react';
import { Package, ArrowLeftRight, CheckCircle2, Clock, AlertTriangle, RefreshCw, Send, Download } from 'lucide-react';

interface StockLevel {
  id: string;
  branch_id: string;
  sku: string;
  item_type: string;
  on_hand: number;
  reserved: number;
}

interface StockTransfer {
  id: string;
  from_branch_id: string;
  to_branch_id: string;
  sku: string;
  quantity: number;
  received_quantity: number;
  discrepancy_quantity: number;
  discrepancy_reason?: string;
  status: string;
  created_by: string;
  sent_at?: string;
  received_at?: string;
  created_at: string;
}

interface StockMovement {
  id: string;
  branch_id: string;
  sku: string;
  movement_type: string;
  quantity: number;
  reason: string;
  created_by: string;
  created_at: string;
}

const branchLabels: Record<string, string> = {
  BR_HCM_01: 'Smash Court — Q.1 (HCM)',
  BR_HN_01: 'Smash Court — Cầu Giấy (HN)',
  BR_DN_01: 'Smash Court — Hải Châu (DN)',
};

export default function AdminInventoryPage() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState('ALL');

  // Form tạo điều chuyển
  const [fromBranch, setFromBranch] = useState('BR_HCM_01');
  const [toBranch, setToBranch] = useState('BR_HN_01');
  const [transferSku, setTransferSku] = useState('YONEX-AX99PRO-4UG5');
  const [transferQty, setTransferQty] = useState(2);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const url = selectedBranch === 'ALL' 
        ? '/api/admin/inventory' 
        : `/api/admin/inventory?branchId=${selectedBranch}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setStockLevels(data.stockLevels || []);
        setTransfers(data.transfers || []);
        setMovements(data.movements || []);
      }
    } catch (err) {
      console.error('Lỗi tải dữ liệu kho:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedBranch]);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromBranch === toBranch) {
      alert('Chi nhánh nguồn và đích không thể giống nhau!');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromBranchId: fromBranch,
          toBranchId: toBranch,
          sku: transferSku,
          quantity: transferQty,
          actor: 'manager_hcm',
          actorBranchId: fromBranch,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Tạo phiếu điều chuyển ${data.transferId} thành công!`);
        await loadData();
      } else {
        alert(data.error || 'Lỗi tạo điều chuyển');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatch = async (transferId: string) => {
    if (!confirm('Xác nhận xuất kho thực tế (Hàng sẽ bị trừ kho gửi và chuyển sang IN_TRANSIT)?')) return;
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId, action: 'DISPATCH', actor: 'manager_hcm' }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Đã xuất kho thực tế phiếu ${transferId}!`);
        await loadData();
      } else {
        alert(data.error || 'Lỗi xuất kho');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReceive = async (transferId: string, expectedQty: number) => {
    const receivedStr = prompt(`Nhập số lượng thực nhận tại chi nhánh đích (kỳ vọng: ${expectedQty}):`, `${expectedQty}`);
    if (receivedStr === null) return;
    const receivedQty = parseInt(receivedStr, 10);
    if (isNaN(receivedQty) || receivedQty < 0 || receivedQty > expectedQty) {
      alert('Số lượng không hợp lệ');
      return;
    }

    let discrepancyReason = '';
    if (receivedQty < expectedQty) {
      discrepancyReason = prompt('Nhập lý do chênh lệch/hao hụt hàng:', 'Hao hụt bao bì trầy xước trong vận chuyển') || '';
    }

    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferId,
          action: 'RECEIVE',
          receivedQty,
          discrepancyReason,
          actor: 'manager_dest',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Đã nhập kho phiếu ${transferId} thành công!`);
        await loadData();
      } else {
        alert(data.error || 'Lỗi nhập kho');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-[#0F5132]" />
            Quản Lý Tồn Kho & Điều Chuyển Hàng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dữ liệu trực tiếp từ PostgreSQL 18 inventory_db. Ràng buộc SQL Atomic (R1: On Hand - Reserved ≥ 0) và Sổ cái kế toán Stock Movements.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới tồn kho
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          {message}
        </div>
      )}

      {/* Tồn Kho Bảng Lưới */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>Tồn Kho Theo Chi Nhánh ({stockLevels.length} bản ghi)</span>
          </h2>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Lọc chi nhánh:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-800 focus:outline-none"
            >
              <option value="ALL">Tất cả chi nhánh</option>
              <option value="BR_HCM_01">Quận 1 (HCM)</option>
              <option value="BR_HN_01">Cầu Giấy (HN)</option>
              <option value="BR_DN_01">Hải Châu (ĐN)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-2.5 px-3">Chi Nhánh</th>
                <th className="py-2.5 px-3">Mã SKU</th>
                <th className="py-2.5 px-3 text-center">Loại Item</th>
                <th className="py-2.5 px-3 text-right">Tồn Thực Tế (On Hand)</th>
                <th className="py-2.5 px-3 text-right">Đang Giữ (Reserved)</th>
                <th className="py-2.5 px-3 text-right font-black text-[#0F5132]">Khả Dụng (Available)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockLevels.map((s) => {
                const available = s.on_hand - s.reserved;
                return (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-800">{branchLabels[s.branch_id] || s.branch_id}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{s.sku}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {s.item_type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">{s.on_hand}</td>
                    <td className="py-3 px-3 text-right font-mono text-amber-700 font-bold">{s.reserved}</td>
                    <td className="py-3 px-3 text-right font-mono font-black text-sm text-[#0F5132]">{available}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tạo Phiếu Điều Chuyển & Danh Sách Điều Chuyển */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form Tạo Điều Chuyển */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-fit">
          <h2 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-emerald-800" />
            Tạo Lệnh Điều Chuyển Hàng
          </h2>

          <form onSubmit={handleCreateTransfer} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Kho xuất (Nguồn):</label>
              <select
                value={fromBranch}
                onChange={(e) => setFromBranch(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800"
              >
                <option value="BR_HCM_01">Smash Court — Q.1 (HCM)</option>
                <option value="BR_HN_01">Smash Court — Cầu Giấy (HN)</option>
                <option value="BR_DN_01">Smash Court — Hải Châu (DN)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Kho nhập (Đích):</label>
              <select
                value={toBranch}
                onChange={(e) => setToBranch(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800"
              >
                <option value="BR_HN_01">Smash Court — Cầu Giấy (HN)</option>
                <option value="BR_HCM_01">Smash Court — Q.1 (HCM)</option>
                <option value="BR_DN_01">Smash Court — Hải Châu (DN)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mã SKU điều chuyển:</label>
              <select
                value={transferSku}
                onChange={(e) => setTransferSku(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-800"
              >
                <option value="YONEX-AX99PRO-4UG5">YONEX-AX99PRO-4UG5 (Astrox 99 Pro)</option>
                <option value="YONEX-AX100ZZ-4UG5">YONEX-AX100ZZ-4UG5 (Astrox 100ZZ)</option>
                <option value="YONEX-ARC11PRO-4UG5">YONEX-ARC11PRO-4UG5 (Arcsaber 11 Pro)</option>
                <option value="YONEX-NF700PRO-4UG5">YONEX-NF700PRO-4UG5 (Nanoflare 700 Pro)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Số lượng:</label>
              <input
                type="number"
                min={1}
                max={20}
                value={transferQty}
                onChange={(e) => setTransferQty(parseInt(e.target.value, 10))}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#0F5132] hover:bg-emerald-900 text-white font-bold py-3 rounded-xl transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Đang tạo...' : 'Tạo Lệnh Điều Chuyển'}
            </button>
          </form>
        </div>

        {/* Danh Sách Điều Chuyển & Thao Tác R8 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center justify-between">
              <span>Tiến Độ Điều Chuyển & Xác Nhận Hàng (R8)</span>
              <span className="text-xs font-normal text-slate-400">Trừ tồn lúc xuất thực tế</span>
            </h2>

            <div className="space-y-4">
              {transfers.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">Chưa có lệnh điều chuyển nào.</div>
              ) : (
                transfers.map((trf) => (
                  <div key={trf.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 mb-2 text-xs">
                      <span className="font-mono font-bold text-slate-800">{trf.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        trf.status === 'IN_TRANSIT' ? 'bg-amber-100 text-amber-900' :
                        trf.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-900' :
                        trf.status === 'COMPLETED_WITH_DISCREPANCY' ? 'bg-rose-100 text-rose-900' :
                        'bg-slate-200 text-slate-800'
                      }`}>
                        {trf.status}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                      <div><strong className="text-slate-800">Từ:</strong> {branchLabels[trf.from_branch_id] || trf.from_branch_id}</div>
                      <div><strong className="text-slate-800">Đến:</strong> {branchLabels[trf.to_branch_id] || trf.to_branch_id}</div>
                      <div><strong className="text-slate-800">SKU:</strong> <span className="font-mono">{trf.sku}</span></div>
                      <div><strong className="text-slate-800">Số lượng:</strong> {trf.quantity} cây</div>
                    </div>

                    {trf.discrepancy_reason && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-900 p-2.5 rounded-lg text-xs mb-3">
                        <strong>Chênh lệch ({trf.discrepancy_quantity} cây):</strong> {trf.discrepancy_reason}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2 border-t border-slate-200 text-xs">
                      {trf.status === 'APPROVED' && (
                        <button
                          onClick={() => handleDispatch(trf.id)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Xuất kho thực tế (Trừ tồn gửi)
                        </button>
                      )}

                      {trf.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleReceive(trf.id, trf.quantity)}
                          className="bg-[#0F5132] hover:bg-emerald-900 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" /> Xác nhận nhập kho đích
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
