'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { 
  Boxes, 
  ArrowLeftRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  Send, 
  Download,
  Search,
  Filter,
  FileSpreadsheet,
  Building2,
  Plus,
  ShieldCheck,
  History
} from 'lucide-react';

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
  BR_HCM_01: 'Smash Court — Quận 1 (TP.HCM)',
  BR_HN_01: 'Smash Court — Cầu Giấy (Hà Nội)',
  BR_DN_01: 'Smash Court — Hải Châu (Đà Nẵng)',
};

export default function AdminInventoryPage() {
  const { selectedBranch, setSelectedBranch, density, branches } = useAdmin();
  const [activeTab, setActiveTab] = useState<'STOCK' | 'TRANSFERS' | 'MOVEMENTS'>('STOCK');
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [skuSearch, setSkuSearch] = useState('');
  const [itemTypeFilter, setItemTypeFilter] = useState('ALL');

  // Form tạo điều chuyển
  const [fromBranch, setFromBranch] = useState(selectedBranch);
  const [toBranch, setToBranch] = useState(selectedBranch === 'BR_HCM_01' ? 'BR_HN_01' : 'BR_HCM_01');
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
    setFromBranch(selectedBranch);
  }, [selectedBranch]);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fromBranch === toBranch) {
      alert('Chi nhánh nguồn và đích không thể trùng nhau!');
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
          actor: 'manager_portal',
          actorBranchId: fromBranch,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Tạo phiếu điều chuyển ${data.transferId} thành công!`);
        await loadData();
        setActiveTab('TRANSFERS');
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
    if (!confirm('Xác nhận xuất kho thực tế (Hàng sẽ bị trừ khỏi kho gửi và chuyển sang trạng thái IN_TRANSIT theo quy tắc R8)?')) return;
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transferId, action: 'DISPATCH', actor: 'manager_portal' }),
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
      alert('Số lượng nhập không hợp lệ');
      return;
    }

    let discrepancyReason = '';
    if (receivedQty < expectedQty) {
      discrepancyReason = prompt('Nhập lý do chênh lệch/hao hụt hàng hóa:', 'Hao hụt trầy xước bao bì trong vận chuyển') || '';
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
        setMessage(`Đã xác nhận nhập kho phiếu ${transferId} thành công!`);
        await loadData();
      } else {
        alert(data.error || 'Lỗi nhập kho');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredStock = stockLevels.filter(s => {
    const matchSku = s.sku.toLowerCase().includes(skuSearch.toLowerCase());
    const matchType = itemTypeFilter === 'ALL' || s.item_type === itemTypeFilter;
    return matchSku && matchType;
  });

  const cellPadding = density === 'compact' ? 'py-1.5 px-3' : 'py-2.5 px-3.5';

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E4E3DD]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded bg-[#0F5132]/10 text-[#0F5132] font-medium border border-[#0F5132]/20">
              Chi nhánh: {selectedBranch}
            </span>
            <span className="text-xs text-[#6A726E]">Quy tắc R1, R8 & Sổ cái R10</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-[#111613] tracking-tight">
            Quản lý tồn kho & điều chuyển hàng
          </h1>
          <p className="text-xs text-[#6A726E] mt-0.5">
            Dữ liệu trực tiếp từ PostgreSQL inventory_db. Đảm bảo Atomic lock không âm kho và lưu vết append-only.
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

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E4E3DD] text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'STOCK'
              ? 'border-[#0F5132] text-[#0F5132]'
              : 'border-transparent text-[#6A726E] hover:text-[#111613]'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Tồn kho thực tế ({stockLevels.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TRANSFERS')}
          className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'TRANSFERS'
              ? 'border-[#0F5132] text-[#0F5132]'
              : 'border-transparent text-[#6A726E] hover:text-[#111613]'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>Lệnh điều chuyển ({transfers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('MOVEMENTS')}
          className={`flex items-center gap-2 pb-2.5 px-3 border-b-2 transition-colors ${
            activeTab === 'MOVEMENTS'
              ? 'border-[#0F5132] text-[#0F5132]'
              : 'border-transparent text-[#6A726E] hover:text-[#111613]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Sổ cái xuất nhập (R10) ({movements.length})</span>
        </button>
      </div>

      {/* TAB 1: STOCK LEVELS */}
      {activeTab === 'STOCK' && (
        <div className="bg-white rounded-xl border border-[#E4E3DD] overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-3 sm:p-4 border-b border-[#E4E3DD] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative w-full max-w-xs">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo mã SKU..."
                  value={skuSearch}
                  onChange={(e) => setSkuSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              <select
                value={itemTypeFilter}
                onChange={(e) => setItemTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#E4E3DD] text-xs bg-white text-[#111613]"
              >
                <option value="ALL">Tất cả loại item</option>
                <option value="STANDARD">Hàng mới (STANDARD)</option>
                <option value="UNIQUE">Vợt cũ (UNIQUE)</option>
              </select>
            </div>

            <div className="text-xs text-[#6A726E]">
              Hiển thị <strong className="text-[#111613] font-medium">{filteredStock.length}</strong> SKU
            </div>
          </div>

          {/* DataTable */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F5F4F0] sticky top-0 z-10 border-b border-[#E4E3DD] text-[#6A726E] font-medium">
                <tr>
                  <th className="py-2.5 px-3.5">Chi nhánh</th>
                  <th className="py-2.5 px-3.5">Mã SKU</th>
                  <th className="py-2.5 px-3.5 text-center">Phân loại</th>
                  <th className="py-2.5 px-3.5 text-right">Tồn thực (On Hand)</th>
                  <th className="py-2.5 px-3.5 text-right">Đang giữ (Reserved)</th>
                  <th className="py-2.5 px-3.5 text-right font-medium text-[#0F5132]">Khả dụng (Available)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E3DD]">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#6A726E] text-xs">
                      Không tìm thấy bản ghi tồn kho nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((s) => {
                    const available = s.on_hand - s.reserved;
                    return (
                      <tr key={s.id} className="hover:bg-stone-50 transition-colors">
                        <td className={`${cellPadding} font-medium text-[#111613]`}>
                          {branchLabels[s.branch_id] || s.branch_id}
                        </td>
                        <td className={`${cellPadding} font-mono text-[#111613]`}>
                          {s.sku}
                        </td>
                        <td className={`${cellPadding} text-center`}>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-normal ${
                            s.item_type === 'UNIQUE' 
                              ? 'bg-amber-100 text-amber-900 border border-amber-200' 
                              : 'bg-stone-100 text-stone-700'
                          }`}>
                            {s.item_type}
                          </span>
                        </td>
                        <td className={`${cellPadding} text-right font-mono tabular-nums text-[#111613]`}>
                          {s.on_hand}
                        </td>
                        <td className={`${cellPadding} text-right font-mono tabular-nums text-amber-700`}>
                          {s.reserved}
                        </td>
                        <td className={`${cellPadding} text-right font-mono tabular-nums font-medium text-[#0F5132]`}>
                          <span className={available > 0 ? 'text-[#0F5132]' : 'text-stone-400'}>
                            {available}
                          </span>
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

      {/* TAB 2: TRANSFERS & DISPATCH */}
      {activeTab === 'TRANSFERS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Transfer Form */}
          <div className="bg-white rounded-xl border border-[#E4E3DD] p-5 h-fit">
            <h2 className="text-sm font-medium text-[#111613] mb-3 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-[#0F5132]" />
              Tạo lệnh điều chuyển hàng
            </h2>

            <form onSubmit={handleCreateTransfer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#6A726E] mb-1">Kho xuất (Nguồn):</label>
                <select
                  value={fromBranch}
                  onChange={(e) => setFromBranch(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#E4E3DD] bg-white text-[#111613]"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#6A726E] mb-1">Kho nhập (Đích):</label>
                <select
                  value={toBranch}
                  onChange={(e) => setToBranch(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#E4E3DD] bg-white text-[#111613]"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#6A726E] mb-1">Mã SKU điều chuyển:</label>
                <select
                  value={transferSku}
                  onChange={(e) => setTransferSku(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[#E4E3DD] bg-white font-mono text-[#111613]"
                >
                  <option value="YONEX-AX99PRO-4UG5">YONEX-AX99PRO-4UG5 (Astrox 99 Pro)</option>
                  <option value="YONEX-AX100ZZ-4UG5">YONEX-AX100ZZ-4UG5 (Astrox 100ZZ)</option>
                  <option value="YONEX-ARC11PRO-4UG5">YONEX-ARC11PRO-4UG5 (Arcsaber 11 Pro)</option>
                  <option value="YONEX-NF700PRO-4UG5">YONEX-NF700PRO-4UG5 (Nanoflare 700 Pro)</option>
                </select>
              </div>

              <div>
                <label className="block text-[#6A726E] mb-1">Số lượng cây:</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={transferQty}
                  onChange={(e) => setTransferQty(parseInt(e.target.value, 10))}
                  className="w-full p-2 rounded-lg border border-[#E4E3DD] text-[#111613]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#111613] hover:bg-[#0F5132] text-white py-2.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? 'Đang tạo lệnh...' : 'Tạo phiếu điều chuyển'}
              </button>
            </form>
          </div>

          {/* Transfers List */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[#E4E3DD] p-5">
            <h2 className="text-sm font-medium text-[#111613] mb-3 flex items-center justify-between">
              <span>Danh sách điều chuyển & Xác nhận hàng (R8)</span>
              <span className="text-[11px] text-[#6A726E] font-normal">Trừ tồn lúc xuất thực tế</span>
            </h2>

            <div className="space-y-3">
              {transfers.length === 0 ? (
                <div className="text-xs text-[#6A726E] text-center py-8">
                  Chưa có lệnh điều chuyển nào trong hệ thống.
                </div>
              ) : (
                transfers.map((trf) => (
                  <div key={trf.id} className="border border-[#E4E3DD] rounded-lg p-3.5 bg-stone-50/50">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E3DD] pb-2 mb-2 text-xs">
                      <span className="font-mono text-[#111613]">{trf.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-normal ${
                        trf.status === 'IN_TRANSIT' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                        trf.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' :
                        trf.status === 'COMPLETED_WITH_DISCREPANCY' ? 'bg-rose-100 text-rose-900 border border-rose-200' :
                        'bg-stone-200 text-stone-800'
                      }`}>
                        {trf.status}
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2 text-xs text-[#6A726E] mb-3">
                      <div><span className="text-[#111613]">Từ:</span> {branchLabels[trf.from_branch_id] || trf.from_branch_id}</div>
                      <div><span className="text-[#111613]">Đến:</span> {branchLabels[trf.to_branch_id] || trf.to_branch_id}</div>
                      <div><span className="text-[#111613]">SKU:</span> <span className="font-mono">{trf.sku}</span></div>
                      <div><span className="text-[#111613]">Số lượng:</span> <strong className="text-[#111613]">{trf.quantity}</strong> cây</div>
                    </div>

                    {trf.discrepancy_reason && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-900 p-2.5 rounded text-xs mb-3">
                        <strong>Ghi nhận chênh lệch ({trf.discrepancy_quantity} cây):</strong> {trf.discrepancy_reason}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-[#E4E3DD] text-xs">
                      {trf.status === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() => handleDispatch(trf.id)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Xuất kho thực tế (Trừ tồn gửi)</span>
                        </button>
                      )}

                      {trf.status === 'IN_TRANSIT' && (
                        <button
                          type="button"
                          onClick={() => handleReceive(trf.id, trf.quantity)}
                          className="bg-[#0F5132] hover:bg-emerald-900 text-white font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Xác nhận nhập kho đích</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK MOVEMENTS (APPEND-ONLY LEDGER R10) */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-white rounded-xl border border-[#E4E3DD] overflow-hidden">
          <div className="p-4 border-b border-[#E4E3DD] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-[#111613] flex items-center gap-2">
                <History className="w-4 h-4 text-[#0F5132]" />
                Sổ cái nhật ký biến động kho (stock_movements)
              </h2>
              <p className="text-[11px] text-[#6A726E] mt-0.5">
                Bất biến append-only theo quy tắc R10. Không có bất kỳ lệnh DELETE hay UPDATE nào được thực thi trên bảng này.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F5F4F0] sticky top-0 z-10 border-b border-[#E4E3DD] text-[#6A726E] font-medium">
                <tr>
                  <th className="py-2.5 px-3.5">Thời gian</th>
                  <th className="py-2.5 px-3.5">Chi nhánh</th>
                  <th className="py-2.5 px-3.5">Mã SKU</th>
                  <th className="py-2.5 px-3.5">Loại dịch chuyển</th>
                  <th className="py-2.5 px-3.5 text-right">Số lượng</th>
                  <th className="py-2.5 px-3.5">Lý do ghi nhận</th>
                  <th className="py-2.5 px-3.5">Người thực hiện</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E3DD]">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#6A726E]">
                      Chưa có ghi nhận biến động kho nào.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => (
                    <tr key={m.id} className="hover:bg-stone-50 transition-colors">
                      <td className={`${cellPadding} text-[#6A726E] whitespace-nowrap`}>
                        {new Date(m.created_at).toLocaleString('vi-VN')}
                      </td>
                      <td className={`${cellPadding} font-medium text-[#111613]`}>
                        {m.branch_id}
                      </td>
                      <td className={`${cellPadding} font-mono text-[#111613]`}>
                        {m.sku}
                      </td>
                      <td className={`${cellPadding}`}>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-700">
                          {m.movement_type}
                        </span>
                      </td>
                      <td className={`${cellPadding} text-right font-mono tabular-nums font-medium ${
                        m.quantity > 0 ? 'text-[#0F5132]' : 'text-rose-700'
                      }`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className={`${cellPadding} text-[#6A726E]`}>
                        {m.reason}
                      </td>
                      <td className={`${cellPadding} text-[#111613]`}>
                        {m.created_by}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
