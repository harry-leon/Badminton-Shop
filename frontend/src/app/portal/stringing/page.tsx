'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { 
  Wrench, 
  Plus, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Phone, 
  User, 
  Printer, 
  X, 
  ChevronRight,
  Sparkles,
  Building2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface StringingOrder {
  id: string;
  order_code: string;
  customer_name: string;
  customer_phone: string;
  branch_id: string;
  racket_model: string;
  string_type: string;
  tension_lbs: number;
  knot_type: string;
  technician_name: string;
  price: number;
  status: 'RECEIVED' | 'STRINGING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  created_by: string;
  completed_at?: string;
  created_at: string;
}

const COMMON_STRINGS = [
  { name: 'Yonex BG65 (Bền bỉ, phổ thông)', price: 110000 },
  { name: 'Yonex BG65Ti (Trợ lực, tiếng nổ vang)', price: 130000 },
  { name: 'Yonex Nanogy 98 (Kiểm soát cao cấp)', price: 160000 },
  { name: 'Yonex Exbolt 63 (Độ nảy cực nhanh, 0.63mm)', price: 170000 },
  { name: 'Yonex Exbolt 65 (Cân bằng độ bền & nảy)', price: 170000 },
  { name: 'Yonex Aerobite (Cước lai cắt cầu bén)', price: 190000 },
  { name: 'Victor VBS-66 Nano (Nảy tốt, âm thanh đanh)', price: 130000 },
  { name: 'Lining No.1 (Được tin dùng thi đấu)', price: 130000 },
];

export default function AdminStringingPage() {
  const { selectedBranch, activeBranchInfo } = useAdmin();
  const [orders, setOrders] = useState<StringingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal Create
  const [createOpen, setCreateOpen] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [racketModel, setRacketModel] = useState('');
  const [stringType, setStringType] = useState(COMMON_STRINGS[1].name);
  const [tensionLbs, setTensionLbs] = useState('25.5');
  const [knotType, setKnotType] = useState('4_KNOTS_BWF');
  const [techName, setTechName] = useState('Trần Kỹ Thuật');
  const [price, setPrice] = useState('130000');
  const [notes, setNotes] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Modal Status Update
  const [updatingOrder, setUpdatingOrder] = useState<StringingOrder | null>(null);
  const [newStatus, setNewStatus] = useState<string>('READY');
  const [updateTech, setUpdateTech] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // Print Receipt Modal
  const [printOrder, setPrintOrder] = useState<StringingOrder | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const b = selectedBranch !== 'ALL' ? `&branchId=${selectedBranch}` : '';
      const s = statusFilter !== 'ALL' ? `&status=${statusFilter}` : '';
      const q = searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`/api/admin/stringing?${b}${s}${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi tải phiếu đan cước');
      setOrders(data.orders || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const handleRefresh = () => fetchOrders();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, [selectedBranch, statusFilter, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);
    try {
      const res = await fetch('/api/admin/stringing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_ORDER',
          customer_name: custName,
          customer_phone: custPhone,
          branch_id: selectedBranch === 'ALL' ? 'BR_HCM_01' : selectedBranch,
          racket_model: racketModel,
          string_type: stringType,
          tension_lbs: parseFloat(tensionLbs),
          knot_type: knotType,
          technician_name: techName,
          price: parseInt(price, 10),
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo phiếu');
      toast.success(`Đã tạo phiếu tiếp nhận căng cước: ${data.orderCode}`);
      setCreateOpen(false);
      resetCreateForm();
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingCreate(false);
    }
  };

  const resetCreateForm = () => {
    setCustName('');
    setCustPhone('');
    setRacketModel('');
    setNotes('');
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingOrder) return;
    setSubmittingUpdate(true);
    try {
      const res = await fetch('/api/admin/stringing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          id: updatingOrder.id,
          status: newStatus,
          technician_name: updateTech,
          notes: updateNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật');
      toast.success('Cập nhật trạng thái phiếu đan cước thành công');
      setUpdatingOrder(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingUpdate(false);
    }
  };

  const handleStringChange = (name: string) => {
    setStringType(name);
    const found = COMMON_STRINGS.find((s) => s.name === name);
    if (found) {
      setPrice(found.price.toString());
    }
  };

  // KPI metrics
  const activeCount = orders.filter((o) => o.status === 'RECEIVED' || o.status === 'STRINGING').length;
  const readyCount = orders.filter((o) => o.status === 'READY').length;
  const todayRevenue = orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((sum, o) => sum + (Number(o.price) || 0), 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E4E3DD] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#6A726E]">Đang đan trên máy</div>
            <div className="text-2xl font-medium text-amber-700 mt-1 tabular-nums">
              {activeCount}
            </div>
            <div className="text-[11px] text-[#6A726E] mt-0.5">Cần giao đúng hẹn cho khách</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E4E3DD] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#6A726E]">Sẵn sàng bàn giao</div>
            <div className="text-2xl font-medium text-[#0F5132] mt-1 tabular-nums">
              {readyCount}
            </div>
            <div className="text-[11px] text-[#6A726E] mt-0.5">Đã căng xong, chờ khách nhận</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E4E3DD] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#6A726E]">Doanh thu dịch vụ cước</div>
            <div className="text-2xl font-medium text-[#111613] mt-1 tabular-nums">
              {new Intl.NumberFormat('vi-VN').format(todayRevenue)} ₫
            </div>
            <div className="text-[11px] text-[#6A726E] mt-0.5">Tổng tiền cước &amp; công đan</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-[#111613] flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-xl border border-[#E4E3DD] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã phiếu, tên khách, số điện thoại, dòng vợt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 min-h-[42px] rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 sm:flex-initial px-2.5 py-2 min-h-[42px] rounded-lg border border-[#E4E3DD] text-xs bg-white text-[#111613] focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="RECEIVED">Tiếp nhận mới</option>
            <option value="STRINGING">Đang căng máy</option>
            <option value="READY">Đã xong - Chờ khách</option>
            <option value="COMPLETED">Đã bàn giao</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tiếp nhận vợt</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E4E3DD] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs border-collapse">
            <thead className="bg-[#F5F4F0] border-b border-[#E4E3DD] text-[#6A726E] font-medium">
              <tr>
                <th className="py-3 px-4">Mã phiếu</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Dòng vợt</th>
                <th className="py-3 px-4">Dây cước &amp; Số lbs</th>
                <th className="py-3 px-4">Kiểu đan</th>
                <th className="py-3 px-4">Kỹ thuật viên</th>
                <th className="py-3 px-4 text-right">Giá tiền</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3DD]">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#6A726E]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-stone-400" />
                    Đang tải danh sách phiếu đan cước...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#6A726E]">
                    Không có phiếu đan cước nào tại chi nhánh này.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[#111613]">
                      {o.order_code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#111613]">{o.customer_name}</div>
                      <div className="text-[11px] text-[#6A726E] font-mono">{o.customer_phone}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#111613]">
                      {o.racket_model}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#111613]">{o.string_type}</div>
                      <div className="text-[11px] font-mono font-medium text-amber-700">
                        {o.tension_lbs} lbs ({((o.tension_lbs) * 0.453592).toFixed(1)} kg)
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-700">
                        {o.knot_type === '4_KNOTS_BWF' ? '4 nút BWF chuẩn' : '2 nút Yonex'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#111613]">
                      {o.technician_name || 'Chưa phân công'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-[#0F5132] tabular-nums">
                      {new Intl.NumberFormat('vi-VN').format(o.price)} ₫
                    </td>
                    <td className="py-3 px-4">
                      {o.status === 'RECEIVED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          Tiếp nhận mới
                        </span>
                      )}
                      {o.status === 'STRINGING' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Đang đan trên máy
                        </span>
                      )}
                      {o.status === 'READY' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                          Sẵn sàng lấy
                        </span>
                      )}
                      {o.status === 'COMPLETED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-600">
                          Đã trả khách
                        </span>
                      )}
                      {o.status === 'CANCELLED' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700">
                          Đã hủy
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setUpdatingOrder(o);
                            setNewStatus(o.status);
                            setUpdateTech(o.technician_name);
                            setUpdateNotes(o.notes || '');
                          }}
                          className="min-h-[36px] px-2.5 py-1.5 touch-target-hit inline-flex items-center justify-center rounded bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          Cập nhật
                        </button>
                        <button
                          type="button"
                          onClick={() => setPrintOrder(o)}
                          className="min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1 rounded hover:bg-stone-100 text-stone-600 cursor-pointer"
                          title="In phiếu tiếp nhận"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tiếp nhận Vợt Mới */}
      {createOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E4E3DD] max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E3DD]">
              <h2 className="text-base font-medium text-[#111613] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#0F5132]" />
                Tạo phiếu tiếp nhận căng cước vợt tại quầy
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#111613] mb-1">
                    Tên khách hàng *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111613] mb-1">
                    Số điện thoại nhận SMS *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0912345678"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111613] mb-1">
                  Dòng vợt khách gửi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Yonex Astrox 99 Pro, Victor Thruster..."
                  value={racketModel}
                  onChange={(e) => setRacketModel(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#111613] mb-1">
                    Loại dây cước *
                  </label>
                  <select
                    value={stringType}
                    onChange={(e) => handleStringChange(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E4E3DD] text-xs bg-white text-[#111613] focus:outline-none"
                  >
                    {COMMON_STRINGS.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111613] mb-1">
                    Số ký căng (lbs) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="18"
                    max="35"
                    required
                    value={tensionLbs}
                    onChange={(e) => setTensionLbs(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#111613] mb-1">
                    Kiểu đan cước
                  </label>
                  <select
                    value={knotType}
                    onChange={(e) => setKnotType(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E4E3DD] text-xs bg-white text-[#111613] focus:outline-none"
                  >
                    <option value="4_KNOTS_BWF">4 nút tiêu chuẩn BWF (Khuyên dùng)</option>
                    <option value="2_KNOTS">2 nút truyền thống Yonex</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#111613] mb-1">
                    Kỹ thuật viên đứng máy
                  </label>
                  <input
                    type="text"
                    value={techName}
                    onChange={(e) => setTechName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111613] mb-1">
                  Giá tiền dịch vụ (₫)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs font-mono focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111613] mb-1">
                  Ghi chú tình trạng vợt ban đầu
                </label>
                <textarea
                  rows={2}
                  placeholder="Khung có vết xước nhẹ, gen góc 10h hơi mòn, v.v..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              <div className="pt-3 border-t border-[#E4E3DD] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-4 py-1.5 rounded-lg bg-[#0F5132] text-white text-xs font-medium hover:bg-[#0F5132]/90 disabled:opacity-50"
                >
                  {submittingCreate ? 'Đang tạo phiếu...' : 'Xác nhận tạo phiếu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cập nhật Tiến độ & KTV */}
      {updatingOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E4E3DD] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E3DD]">
              <div>
                <h2 className="text-base font-medium text-[#111613]">
                  Cập nhật tiến độ: {updatingOrder.order_code}
                </h2>
                <div className="text-xs text-[#6A726E] mt-0.5">
                  {updatingOrder.customer_name} — {updatingOrder.racket_model}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUpdatingOrder(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#111613] mb-1">
                  Trạng thái thực hiện *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#E4E3DD] text-xs bg-white text-[#111613] focus:outline-none"
                >
                  <option value="RECEIVED">1. Tiếp nhận mới (Chờ xếp máy)</option>
                  <option value="STRINGING">2. Đang căng máy điện tử</option>
                  <option value="READY">3. Đã căng xong — Sẵn sàng trả khách</option>
                  <option value="COMPLETED">4. Đã bàn giao cho khách (Hoàn tất)</option>
                  <option value="CANCELLED">Hủy phiếu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111613] mb-1">
                  Kỹ thuật viên thực hiện
                </label>
                <input
                  type="text"
                  value={updateTech}
                  onChange={(e) => setUpdateTech(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111613] mb-1">
                  Ghi chú bổ sung
                </label>
                <textarea
                  rows={2}
                  value={updateNotes}
                  onChange={(e) => setUpdateNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              <div className="pt-3 border-t border-[#E4E3DD] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUpdatingOrder(null)}
                  className="px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs hover:bg-stone-50"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingUpdate}
                  className="px-4 py-1.5 rounded-lg bg-[#0F5132] text-white text-xs font-medium hover:bg-[#0F5132]/90 disabled:opacity-50"
                >
                  {submittingUpdate ? 'Đang lưu...' : 'Lưu cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal In Phiếu Nhận Đan Cước */}
      {printOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E4E3DD] max-w-sm w-full p-6 shadow-xl space-y-4 text-[#111613]">
            <div className="text-center pb-3 border-b border-dashed border-[#E4E3DD]">
              <div className="font-bold text-base tracking-tight uppercase">Smash Court Badminton</div>
              <div className="text-[11px] text-[#6A726E]">Hệ thống thiết bị cầu lông &amp; Căng cước BWF</div>
              <div className="text-[12px] font-mono font-medium mt-1">PHIẾU TIẾP NHẬN CĂNG CƯỚC</div>
              <div className="text-xs font-mono text-[#0F5132] font-semibold">{printOrder.order_code}</div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6A726E]">Khách hàng:</span>
                <span className="font-medium">{printOrder.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A726E]">Điện thoại:</span>
                <span className="font-mono">{printOrder.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A726E]">Dòng vợt:</span>
                <span className="font-medium text-right">{printOrder.racket_model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A726E]">Loại cước:</span>
                <span className="font-medium text-right">{printOrder.string_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A726E]">Mức căng:</span>
                <span className="font-bold text-amber-700">{printOrder.tension_lbs} lbs ({((printOrder.tension_lbs) * 0.453592).toFixed(1)} kg)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A726E]">Phương pháp:</span>
                <span>{printOrder.knot_type === '4_KNOTS_BWF' ? '4 nút BWF' : '2 nút Yonex'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A726E]">KTV thực hiện:</span>
                <span>{printOrder.technician_name}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#E4E3DD]">
                <span className="font-medium">Tổng thanh toán:</span>
                <span className="font-bold text-[#0F5132] font-mono text-sm">
                  {new Intl.NumberFormat('vi-VN').format(printOrder.price)} ₫
                </span>
              </div>
            </div>

            <div className="pt-2 text-[10px] text-center text-[#6A726E] border-t border-dashed border-[#E4E3DD] leading-relaxed">
              * Quý khách vui lòng mang theo phiếu này hoặc đọc SĐT khi nhận lại vợt. Bảo hành bung nút 3 ngày.
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintOrder(null)}
                className="px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs hover:bg-stone-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setPrintOrder(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#111613] text-white text-xs font-medium hover:bg-black flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In phiếu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
