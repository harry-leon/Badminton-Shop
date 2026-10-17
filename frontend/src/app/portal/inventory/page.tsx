'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdmin, useTableDensity } from '@/lib/admin-context';
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

interface PurchaseOrder {
  id: string;
  branch_id: string;
  supplier_name: string;
  total_items: number;
  total_cost: number;
  status: 'DRAFT' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  notes?: string;
  created_by: string;
  approved_by?: string;
  received_at?: string;
  created_at: string;
  lines?: Array<{
    id: string;
    sku: string;
    ordered_qty: number;
    received_qty: number;
    unit_cost: number;
  }>;
}

const branchLabels: Record<string, string> = {
  BR_HCM_01: 'Smash Court — Quận 1 (TP.HCM)',
  BR_HN_01: 'Smash Court — Cầu Giấy (Hà Nội)',
  BR_DN_01: 'Smash Court — Hải Châu (Đà Nẵng)',
};

function AdminInventoryPageContent() {
  const { selectedBranch, setSelectedBranch, density, branches, currentRole } = useAdmin();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'STOCK' | 'TRANSFERS' | 'MOVEMENTS' | 'PURCHASE_ORDERS'>(() => {
    if (urlTab === 'TRANSFERS' || urlTab === 'MOVEMENTS' || urlTab === 'PURCHASE_ORDERS') return urlTab;
    return 'STOCK';
  });

  useEffect(() => {
    if (urlTab === 'TRANSFERS' || urlTab === 'MOVEMENTS' || urlTab === 'PURCHASE_ORDERS') {
      setActiveTab(urlTab);
    } else if (urlTab === 'STOCK' || !urlTab) {
      setActiveTab('STOCK');
    }
  }, [urlTab]);
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [audit, setAudit] = useState<{ total_on_hand: number; total_movements: number }>({ total_on_hand: 0, total_movements: 0 });
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

  // Form tạo Đơn nhập kho (Purchase Order)
  const [createPoOpen, setCreatePoOpen] = useState(false);
  const [poSupplier, setPoSupplier] = useState('Yonex Vietnam Official');
  const [poSku, setPoSku] = useState('YONEX-AX99PRO-4UG5');
  const [poQty, setPoQty] = useState(10);
  const [poUnitCost, setPoUnitCost] = useState(3100000);
  const [poNotes, setPoNotes] = useState('');
  const [submittingPo, setSubmittingPo] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const url = selectedBranch === 'ALL' 
        ? '/api/admin/inventory' 
        : `/api/admin/inventory?branchId=${selectedBranch}`;
      const [res, poRes] = await Promise.all([
        fetch(url),
        fetch(`/api/admin/purchase-orders?branchId=${selectedBranch}`).catch(() => null)
      ]);
      const data = await res.json();
      if (res.ok) {
        setStockLevels(data.stockLevels || []);
        setTransfers(data.transfers || []);
        setMovements(data.movements || []);
        if (data.audit) {
          setAudit({
            total_on_hand: parseInt(data.audit.total_on_hand, 10) || 0,
            total_movements: parseInt(data.audit.total_movements, 10) || 0,
          });
        }
      }
      if (poRes && poRes.ok) {
        const poData = await poRes.json();
        setPurchaseOrders(poData.purchaseOrders || []);
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
    const handleRefresh = () => loadData();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
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
        headers: {
          'Content-Type': 'application/json',
          'X-Branch-Id': selectedBranch,
        },
        body: JSON.stringify({
          fromBranchId: fromBranch,
          toBranchId: toBranch,
          sku: transferSku,
          quantity: transferQty,
          actor: 'manager_portal',
          actorBranchId: selectedBranch,
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
        headers: {
          'Content-Type': 'application/json',
          'X-Branch-Id': selectedBranch,
        },
        body: JSON.stringify({
          transferId,
          action: 'DISPATCH',
          actor: 'manager_portal',
          actorBranchId: selectedBranch,
        }),
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
        headers: {
          'Content-Type': 'application/json',
          'X-Branch-Id': selectedBranch,
        },
        body: JSON.stringify({
          transferId,
          action: 'RECEIVE',
          receivedQty,
          discrepancyReason,
          actor: 'manager_dest',
          actorBranchId: selectedBranch,
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

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPo(true);
    try {
      const res = await fetch('/api/admin/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_PO',
          branch_id: selectedBranch === 'ALL' ? 'BR_HCM_01' : selectedBranch,
          supplier_name: poSupplier,
          notes: poNotes,
          items: [
            {
              sku: poSku,
              ordered_qty: poQty,
              unit_cost: poUnitCost,
            }
          ]
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo phiếu nhập kho');
      setMessage(`Đã tạo thành công phiếu nhập kho NCC: ${data.poId}`);
      setCreatePoOpen(false);
      setPoNotes('');
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingPo(false);
    }
  };

  const handleApprovePO = async (poId: string) => {
    if (!confirm(`Xác nhận phê duyệt đơn đặt hàng nhập kho ${poId}?`)) return;
    try {
      const res = await fetch('/api/admin/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE_PO', poId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi duyệt');
      setMessage(`Đã phê duyệt thành công phiếu ${poId}`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReceivePO = async (poId: string) => {
    if (!confirm(`Xác nhận thực nhận hàng từ NCC và tăng tồn kho cho phiếu ${poId}?`)) return;
    try {
      const res = await fetch('/api/admin/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RECEIVE_PO', poId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi nhận hàng');
      setMessage(`Nhập kho thành công! Đã tăng tồn kho thực tế và ghi sổ cái R10 cho phiếu ${poId}`);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Chi nhánh', 'Mã SKU', 'Phân loại', 'Tồn thực tế (On Hand)', 'Đang giữ (Reserved)', 'Khả dụng (Available)'];
    const rows = filteredStock.map(s => [
      s.branch_id,
      s.sku,
      s.item_type,
      s.on_hand,
      s.reserved,
      s.on_hand - s.reserved
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ton-kho-${selectedBranch}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStock = stockLevels.filter(s => {
    const matchSku = s.sku.toLowerCase().includes(skuSearch.toLowerCase());
    const matchType = itemTypeFilter === 'ALL' || s.item_type === itemTypeFilter;
    return matchSku && matchType;
  });

  const { cellPadding } = useTableDensity();

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0" />
          <span>{message}</span>
        </div>
      )}

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

            <div className="flex items-center gap-3">
              <div className="text-xs text-[#6A726E]">
                Hiển thị <strong className="text-[#111613] font-medium">{filteredStock.length}</strong> SKU
              </div>

              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-[#111613] text-xs font-medium border border-[#E4E3DD] shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-stone-600" />
                <span>Xuất CSV</span>
              </button>
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
          <div className="p-4 border-b border-[#E4E3DD] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-[#111613] flex items-center gap-2">
                <History className="w-4 h-4 text-[#0F5132]" />
                Sổ cái nhật ký biến động kho (stock_movements)
              </h2>
              <p className="text-[11px] text-[#6A726E] mt-0.5">
                Bất biến append-only theo quy tắc R10. Không có bất kỳ lệnh DELETE hay UPDATE nào được thực thi trên bảng này.
              </p>
            </div>

            {audit.total_movements > 0 && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-950 px-3 py-1.5 rounded-lg text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0" />
                <span>
                  Kiểm toán R10: Sổ cái ({audit.total_movements} cây) = Tồn kho thực ({audit.total_on_hand} cây)
                  {audit.total_movements === audit.total_on_hand ? (
                    <span className="ml-1.5 font-medium text-[#0F5132]">(KHỚP 100%)</span>
                  ) : (
                    <span className="ml-1.5 font-medium text-rose-600">(LỆCH KHO)</span>
                  )}
                </span>
              </div>
            )}
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

      {/* TAB 4: PURCHASE ORDERS (NHẬP KHO TỪ NCC) */}
      {activeTab === 'PURCHASE_ORDERS' && (
        <div className="bg-white rounded-xl border border-[#E4E3DD] overflow-hidden space-y-4">
          <div className="p-4 border-b border-[#E4E3DD] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-[#111613] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F5132]" />
                Đơn đặt hàng nhập kho từ Nhà Cung Cấp (Purchase Orders)
              </h2>
              <p className="text-[11px] text-[#6A726E] mt-0.5">
                Quy trình: Tạo đơn (DRAFT) → Quản lý duyệt (APPROVED) → Nhận hàng tăng tồn kho &amp; ghi sổ cái R10 (RECEIVED)
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreatePoOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0F5132]/90 text-white text-xs font-medium self-start sm:self-auto shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo phiếu nhập mới</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F5F4F0] border-b border-[#E4E3DD] text-[#6A726E] font-medium">
                <tr>
                  <th className="py-2.5 px-3.5">Mã PO</th>
                  <th className="py-2.5 px-3.5">Chi nhánh nhận</th>
                  <th className="py-2.5 px-3.5">Nhà cung cấp</th>
                  <th className="py-2.5 px-3.5 text-right">Tổng sản lượng</th>
                  <th className="py-2.5 px-3.5 text-right">Tổng giá trị</th>
                  <th className="py-2.5 px-3.5">Trạng thái</th>
                  <th className="py-2.5 px-3.5">Người tạo / Duyệt</th>
                  <th className="py-2.5 px-3.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E3DD]">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#6A726E]">
                      Chưa có phiếu đặt hàng nhập kho nào tại chi nhánh này.
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-medium text-[#111613]">
                        {po.id}
                      </td>
                      <td className="py-2.5 px-3.5 font-medium text-[#111613]">
                        {po.branch_id}
                      </td>
                      <td className="py-2.5 px-3.5 text-[#111613]">
                        {po.supplier_name}
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-medium text-[#111613] tabular-nums">
                        {po.total_items} cây/chiếc
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-medium text-[#0F5132] tabular-nums">
                        {new Intl.NumberFormat('vi-VN').format(po.total_cost)} ₫
                      </td>
                      <td className="py-2.5 px-3.5">
                        {po.status === 'DRAFT' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Chờ duyệt (Draft)
                          </span>
                        )}
                        {po.status === 'APPROVED' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            Đã duyệt - Chờ nhận hàng
                          </span>
                        )}
                        {po.status === 'RECEIVED' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                            Đã nhập kho (R10)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3.5 text-[#6A726E]">
                        <div>{po.created_by}</div>
                        {po.approved_by && <div className="text-[10px] text-blue-600">Duyệt: {po.approved_by}</div>}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {po.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => handleApprovePO(po.id)}
                              className="px-2.5 py-1 rounded bg-[#0F5132]/10 hover:bg-[#0F5132]/20 text-[#0F5132] text-[11px] font-medium transition-colors"
                            >
                              Duyệt đơn
                            </button>
                          )}
                          {po.status === 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleReceivePO(po.id)}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors shadow-sm"
                            >
                              Nhận hàng vào kho
                            </button>
                          )}
                          {po.status === 'RECEIVED' && (
                            <span className="text-[11px] text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Hoàn tất
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tạo Phiếu Nhập Kho NCC */}
      {createPoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E4E3DD] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E3DD]">
              <h2 className="text-base font-medium text-[#111613] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F5132]" />
                Tạo phiếu đặt hàng nhập kho (PO)
              </h2>
              <button
                type="button"
                onClick={() => setCreatePoOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#111613] mb-1">
                  Nhà cung cấp / Phân phối chính hãng *
                </label>
                <select
                  value={poSupplier}
                  onChange={(e) => setPoSupplier(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E4E3DD] text-xs bg-white text-[#111613] focus:outline-none"
                >
                  <option value="Yonex Vietnam Official (Sunrise Sports)">Yonex Vietnam Official (Sunrise Sports)</option>
                  <option value="Victor Rackets Co. LTD">Victor Rackets Co. LTD</option>
                  <option value="Li-Ning Badminton Distributor">Li-Ning Badminton Distributor</option>
                  <option value="Mizuno Sports Vietnam">Mizuno Sports Vietnam</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111613] mb-1">
                  Mã SKU sản phẩm nhập *
                </label>
                <input
                  type="text"
                  required
                  value={poSku}
                  onChange={(e) => setPoSku(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs font-mono focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#111613] mb-1">
                    Số lượng nhập *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={poQty}
                    onChange={(e) => setPoQty(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111613] mb-1">
                    Đơn giá vốn (₫) *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={poUnitCost}
                    onChange={(e) => setPoUnitCost(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs font-mono focus:outline-none focus:border-[#0F5132]"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-stone-50 border border-[#E4E3DD] text-xs flex justify-between">
                <span className="text-[#6A726E]">Tổng giá trị đơn nhập:</span>
                <span className="font-bold font-mono text-[#0F5132]">
                  {new Intl.NumberFormat('vi-VN').format(poQty * poUnitCost)} ₫
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111613] mb-1">
                  Ghi chú lô hàng
                </label>
                <textarea
                  rows={2}
                  placeholder="Lô hàng thi đấu số hóa đơn GTGT, kiểm tra tem chống giả..."
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              <div className="pt-3 border-t border-[#E4E3DD] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreatePoOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingPo}
                  className="px-4 py-1.5 rounded-lg bg-[#0F5132] text-white text-xs font-medium hover:bg-[#0F5132]/90 disabled:opacity-50"
                >
                  {submittingPo ? 'Đang tạo...' : 'Xác nhận tạo đơn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInventoryPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Đang tải quản lý kho...</div>}>
      <AdminInventoryPageContent />
    </React.Suspense>
  );
}

