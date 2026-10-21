'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAdmin, useTableDensity } from '@/lib/admin-context';
import { 
  ShoppingBag, 
  QrCode, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  User, 
  Search,
  Filter,
  Check,
  Building2,
  Copy,
  Send,
  XCircle,
  RotateCcw,
  DollarSign,
  AlertCircle,
  Save,
  MessageSquare,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { safeFetchJson } from '@/lib/portal-fetch';

interface OrderLine {
  id: string;
  sku: string;
  product_name_snapshot: string;
  unit_price_snapshot: number;
  quantity: number;
  subtotal: number;
  warranty_policy_snapshot: string;
}

interface Payment {
  id: string;
  order_id: string;
  payment_method: string;
  amount: number;
  status: string;
  vietqr_payload?: string;
  transaction_ref?: string;
  confirmed_by?: string;
  confirmed_at?: string;
}

interface RefundItem {
  id: string;
  order_id: string;
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
  branch_id?: string;
}

interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address?: string;
  fulfillment_type: string;
  branch_id: string;
  pickup_code?: string;
  payment_method: string;
  total_amount: number;
  status: string;
  created_at: string;
  notes?: string;
  assigned_to?: string;
  delivered_at?: string;
  lines: OrderLine[];
  payments: Payment[];
  refunds?: RefundItem[];
}

function AdminOrdersPageContent() {
  const { selectedBranch, currentRole, user } = useAdmin();
  const { density, cellPadding, headerPadding, fontSize } = useTableDensity();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'REFUNDS'>(() => {
    if (urlTab === 'REFUNDS') return 'REFUNDS';
    return 'ORDERS';
  });

  useEffect(() => {
    if (urlTab === 'REFUNDS') {
      setActiveTab('REFUNDS');
    } else if (urlTab === 'ORDERS' || !urlTab) {
      setActiveTab('ORDERS');
    }
  }, [urlTab]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reconcileRef, setReconcileRef] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Ghi chú nội bộ & KTV phụ trách
  const [orderNotes, setOrderNotes] = useState('');
  const [assignedStaff, setAssignedStaff] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Modal Hoàn tiền (Refund)
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  // Modal In Hóa đơn / Phiếu xuất kho
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // In-memory tab caching
  const loadedTabs = React.useRef<{
    ORDERS?: boolean;
    REFUNDS?: boolean;
  }>({});

  const loadOrders = async (force = false) => {
    if (!force && loadedTabs.current[activeTab]) return;
    setLoading(true);
    try {
      const res = await safeFetchJson<{ orders: Order[]; refunds: RefundItem[] }>('/api/admin/orders');
      if (res.success && res.data) {
        setOrders(res.data.orders || []);
        setRefunds(res.data.refunds || []);
        loadedTabs.current.ORDERS = true;
        loadedTabs.current.REFUNDS = true;
      } else {
        toast.error(res.error || 'Lỗi khi tải dữ liệu đơn hàng');
      }
    } catch (err: any) {
      toast.error(err.message || 'Lỗi kết nối đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [activeTab]);

  useEffect(() => {
    const handleRefresh = () => {
      loadedTabs.current = {};
      loadOrders(true);
    };
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, [activeTab]);

  useEffect(() => {
    if (selectedOrder) {
      setOrderNotes(selectedOrder.notes || '');
      setAssignedStaff(selectedOrder.assigned_to || '');
    }
  }, [selectedOrder]);

  const handleOrderStatusAction = async (action: string) => {
    if (!selectedOrder) return;
    setUpdatingStatus(true);
    setActionMessage('');
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Branch-Id': selectedBranch,
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          action,
          actor: user?.username || 'staff_portal',
          branchId: selectedBranch,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Cập nhật đơn hàng ${selectedOrder.id} sang trạng thái ${data.status} thành công!`);
        await loadOrders();
        // Cập nhật selectedOrder
        setSelectedOrder(prev => prev ? { ...prev, status: data.status } : null);
      } else {
        toast.error(data.error || 'Lỗi cập nhật trạng thái đơn hàng');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReconcile = async () => {
    if (!selectedOrder || !reconcileRef.trim()) return;
    setReconciling(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Branch-Id': selectedBranch,
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          transactionRef: reconcileRef.trim(),
          confirmedBy: user?.username || 'admin_long',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Đã đối soát khớp tiền thành công cho đơn hàng ${selectedOrder.id}!`);
        setReconcileRef('');
        await loadOrders();
      } else {
        toast.error(data.error || 'Lỗi khi đối soát VietQR');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setReconciling(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    setSavingNotes(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_OPERATIONS',
          orderId: selectedOrder.id,
          notes: orderNotes,
          assigned_to: assignedStaff,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cập nhật ghi chú thất bại');
      toast.success(data.message);
      setSelectedOrder(prev => prev ? { ...prev, notes: orderNotes, assigned_to: assignedStaff } : null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCreateRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !refundAmount || !refundReason) return;
    setSubmittingRefund(true);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_REFUND',
          orderId: selectedOrder.id,
          amount: Number(refundAmount),
          reason: refundReason,
          requested_by: user?.username || 'staff_portal',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo phiếu hoàn tiền thất bại');
      toast.success(data.message);
      setRefundModalOpen(false);
      setRefundAmount('');
      setRefundReason('');
      await loadOrders();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleModerateRefund = async (refundId: string, approve: boolean) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: approve ? 'APPROVE_REFUND' : 'REJECT_REFUND',
          refundId,
          approved_by: user?.username || 'manager_portal',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xử lý hoàn tiền thất bại');
      toast.success(data.message);
      await loadOrders();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Lọc đơn hàng
  const filteredOrders = orders.filter((o) => {
    const matchSearch = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_phone.includes(searchQuery);
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchBranch = selectedBranch === 'ALL' || o.branch_id === selectedBranch;
    return matchSearch && matchStatus && matchBranch;
  });

  return (
    <div className="space-y-6">
      {/* On-page Tab Navigation Strip for Mobile/Tablet */}
      <div className="flex items-center gap-1.5 border-b border-[#E4E3DD] overflow-x-auto no-scrollbar pb-1">
        <Link
          href="/portal/orders?tab=ORDERS"
          className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap touch-target-hit inline-flex items-center gap-1.5 ${
            activeTab === 'ORDERS'
              ? 'bg-white border-t border-x border-[#E4E3DD] text-[#0F5132] font-semibold'
              : 'text-[#6A726E] hover:text-[#111613]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Danh sách đơn hàng</span>
        </Link>
        <Link
          href="/portal/orders?tab=REFUNDS"
          className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors whitespace-nowrap touch-target-hit inline-flex items-center gap-1.5 ${
            activeTab === 'REFUNDS'
              ? 'bg-white border-t border-x border-[#E4E3DD] text-[#0F5132] font-semibold'
              : 'text-[#6A726E] hover:text-[#111613]'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Yêu cầu hoàn tiền ({refunds.length})</span>
        </Link>
      </div>

      {activeTab === 'REFUNDS' ? (
        /* TAB HOÀN TIỀN (REFUNDS) */
        <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#0F5132]" />
              <h2 className="text-sm font-semibold text-gray-900">Danh sách Yêu cầu Hoàn tiền (Refunds)</h2>
            </div>
            <span className="text-xs text-gray-500 font-mono">Tổng: {refunds.length} phiếu</span>
          </div>

          {refunds.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-500">
              Chưa có yêu cầu hoàn tiền nào trong hệ thống.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-[#FAF9F5] text-gray-500 font-medium border-b border-gray-100">
                  <tr>
                    <th className={`${headerPadding} ${fontSize}`}>MÃ ĐƠN / NGÀY TẠO</th>
                    <th className={`${headerPadding} ${fontSize}`}>KHÁCH HÀNG</th>
                    <th className={`${headerPadding} ${fontSize}`}>CHI NHÁNH</th>
                    <th className={`${headerPadding} ${fontSize}`}>SỐ TIỀN HOÀN</th>
                    <th className={`${headerPadding} ${fontSize}`}>LÝ DO</th>
                    <th className={`${headerPadding} ${fontSize}`}>TRẠNG THÁI</th>
                    <th className={`${headerPadding} ${fontSize} text-right`}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {refunds.map((ref) => (
                    <tr key={ref.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className={`${cellPadding} ${fontSize}`}>
                        <div className="font-mono font-medium text-gray-900">{ref.order_id}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(ref.created_at).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className={`${cellPadding} ${fontSize}`}>
                        <div className="font-medium text-gray-900">{ref.customer_name || 'Khách vãng lai'}</div>
                        <div className="text-[11px] text-gray-500">{ref.customer_phone || '---'}</div>
                      </td>
                      <td className={`${cellPadding} ${fontSize}`}>
                        <span className="font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                          {ref.branch_id || 'ALL'}
                        </span>
                      </td>
                      <td className={`${cellPadding} ${fontSize} font-semibold text-[#0F5132]`}>
                        {Number(ref.amount).toLocaleString('vi-VN')} ₫
                      </td>
                      <td className={`${cellPadding} ${fontSize} max-w-xs truncate text-gray-600`}>
                        {ref.reason}
                      </td>
                      <td className={`${cellPadding} ${fontSize}`}>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          ref.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          ref.status === 'REJECTED' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {ref.status === 'APPROVED' && 'ĐÃ DUYỆT HOÀN'}
                          {ref.status === 'REJECTED' && 'BỊ TỪ CHỐI'}
                          {ref.status === 'PENDING' && 'CHỜ PHÊ DUYỆT'}
                        </span>
                      </td>
                      <td className={`${cellPadding} ${fontSize} text-right`}>
                        {ref.status === 'PENDING' && (user?.role === 'ADMIN' || user?.role === 'BRANCH_MANAGER') ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleModerateRefund(ref.id, true)}
                              className="min-h-[36px] px-3 py-1.5 rounded bg-[#0F5132] hover:bg-[#0c4128] text-white text-[11px] font-medium transition-colors cursor-pointer touch-target-hit inline-flex items-center justify-center"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleModerateRefund(ref.id, false)}
                              className="min-h-[36px] px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-medium transition-colors cursor-pointer touch-target-hit inline-flex items-center justify-center"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">
                            {ref.approved_by ? `Bởi ${ref.approved_by}` : '---'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* TAB DANH SÁCH ĐƠN HÀNG */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main List Table (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-3 rounded-xl border border-black/10 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã đơn, tên khách, SĐT..."
                  className="w-full pl-8 pr-3 py-2 min-h-[42px] rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 min-h-[42px] bg-white text-gray-700 focus:outline-none focus:border-black"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="PENDING_RESERVATION">Giữ chỗ kho</option>
                  <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                  <option value="PAID">Đã thanh toán (PAID)</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="PREPARING">Đang soạn hàng</option>
                  <option value="READY_FOR_PICKUP">Chờ nhận tại quầy</option>
                  <option value="COMPLETED">Hoàn tất</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left">
                  <thead className="bg-[#FAF9F5] text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className={`${headerPadding} ${fontSize}`}>MÃ ĐƠN</th>
                      <th className={`${headerPadding} ${fontSize}`}>KHÁCH HÀNG</th>
                      <th className={`${headerPadding} ${fontSize}`}>CHI NHÁNH</th>
                      <th className={`${headerPadding} ${fontSize}`}>TỔNG TIỀN</th>
                      <th className={`${headerPadding} ${fontSize}`}>TRẠNG THÁI</th>
                      <th className={`${headerPadding} ${fontSize}`}>THANH TOÁN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className={`${cellPadding} text-center text-gray-400`}>
                          Không tìm thấy đơn hàng nào khớp bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const isSelected = selectedOrder?.id === order.id;
                        const isPaid = order.payments?.some(p => p.status === 'CONFIRMED') || order.status === 'PAID';

                        return (
                          <tr
                            key={order.id}
                            onClick={() => setSelectedOrder(order)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? 'bg-emerald-50/60 font-medium' : 'hover:bg-gray-50/60'
                            }`}
                          >
                            <td className={`${cellPadding} ${fontSize} font-mono text-gray-900 font-medium`}>
                              {order.id}
                              <div className="text-[10px] text-gray-400 font-normal">
                                {new Date(order.created_at).toLocaleDateString('vi-VN')}
                              </div>
                            </td>
                            <td className={`${cellPadding} ${fontSize}`}>
                              <div className="text-gray-900 font-medium">{order.customer_name}</div>
                              <div className="text-[11px] text-gray-500">{order.customer_phone}</div>
                            </td>
                            <td className={`${cellPadding} ${fontSize}`}>
                              <span className="font-mono text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                                {order.branch_id}
                              </span>
                            </td>
                            <td className={`${cellPadding} ${fontSize} font-semibold text-[#0F5132]`}>
                              {parseInt(order.total_amount as any, 10).toLocaleString('vi-VN')} ₫
                            </td>
                            <td className={`${cellPadding} ${fontSize}`}>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                order.status === 'PAID' ? 'bg-blue-100 text-blue-800' :
                                order.status === 'PREPARING' ? 'bg-indigo-100 text-indigo-800' :
                                order.status === 'READY_FOR_PICKUP' ? 'bg-purple-100 text-purple-800' :
                                order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className={`${cellPadding} ${fontSize}`}>
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Đã thanh toán</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-700">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Chờ chuyển khoản</span>
                                </span>
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
          </div>

          {/* Detail Side Panel (1 col) */}
          <div className="space-y-4">
            {selectedOrder ? (
              <div className="bg-white rounded-xl border border-black/10 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Chi tiết Đơn hàng</h2>
                    <p className="text-xs font-mono text-gray-500">{selectedOrder.id}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-mono font-medium">
                    {selectedOrder.branch_id}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="text-xs space-y-1.5 text-gray-600 bg-gray-50/70 p-3 rounded-lg border border-gray-100">
                  <div><strong className="text-gray-900">Khách hàng:</strong> {selectedOrder.customer_name}</div>
                  <div><strong className="text-gray-900">Số điện thoại:</strong> {selectedOrder.customer_phone}</div>
                  <div><strong className="text-gray-900">Hình thức:</strong> {selectedOrder.fulfillment_type === 'DELIVERY' ? 'Giao hàng tận nơi' : 'Nhận tại quầy'}</div>
                  {selectedOrder.shipping_address && (
                    <div><strong className="text-gray-900">Địa chỉ:</strong> {selectedOrder.shipping_address}</div>
                  )}
                  {selectedOrder.pickup_code && (
                    <div><strong className="text-gray-900">Mã lấy hàng:</strong> <span className="font-mono text-[#0F5132] font-semibold">{selectedOrder.pickup_code}</span></div>
                  )}
                </div>

                {/* Order Lines */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-900 mb-2">Sản phẩm trong đơn:</h3>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {selectedOrder.lines.map((line) => (
                      <div key={line.id} className="p-2 rounded bg-stone-50 border border-stone-100 text-xs">
                        <div className="font-medium text-gray-900">{line.product_name_snapshot}</div>
                        <div className="flex justify-between text-gray-500 mt-1 text-[11px]">
                          <span>SL: {line.quantity}</span>
                          <span className="font-medium text-gray-900">
                            {Number(line.subtotal).toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-900 mt-3 pt-2 border-t border-gray-100">
                    <span>Tổng tiền:</span>
                    <span className="text-[#0F5132] text-sm">
                      {Number(selectedOrder.total_amount).toLocaleString('vi-VN')} ₫
                    </span>
                  </div>
                </div>

                {/* Operations & Notes Block */}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                    <MessageSquare className="w-3.5 h-3.5 text-[#0F5132]" />
                    <span>Ghi chú vận hành &amp; Phân công:</span>
                  </div>
                  <input
                    type="text"
                    value={assignedStaff}
                    onChange={(e) => setAssignedStaff(e.target.value)}
                    placeholder="Nhân viên phụ trách đóng gói/giao..."
                    className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-black"
                  />
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Ghi chú nội bộ đơn hàng (khách hẹn giờ, yêu cầu quấn cán...)"
                    className="w-full text-xs p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-black"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingNotes ? 'Đang lưu...' : 'Lưu ghi chú nội bộ'}</span>
                  </button>
                </div>

                {/* VietQR Reconciliation */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900 mb-2">
                    <QrCode className="w-3.5 h-3.5 text-[#0F5132]" />
                    <span>Đối soát VietQR (K8)</span>
                  </div>

                  {selectedOrder.payments?.[0]?.status === 'CONFIRMED' || selectedOrder.status === 'PAID' ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-xs text-emerald-900">
                      <div className="flex items-center gap-1 font-medium text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-[#0F5132]" />
                        <span>Đã xác nhận thanh toán thành công</span>
                      </div>
                      {selectedOrder.payments?.[0]?.transaction_ref && (
                        <div className="mt-1 font-mono text-[11px] text-gray-600">
                          Ref: {selectedOrder.payments[0].transaction_ref}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={reconcileRef}
                        onChange={(e) => setReconcileRef(e.target.value)}
                        placeholder="Mã giao dịch ngân hàng (Ref)..."
                        className="w-full text-xs p-2 rounded-lg border border-gray-200 font-mono focus:outline-none focus:border-black"
                      />
                      <button
                        onClick={handleReconcile}
                        disabled={reconciling || !reconcileRef.trim()}
                        className="w-full py-2 bg-[#111613] hover:bg-[#0F5132] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {reconciling ? 'Đang đối soát...' : 'Xác nhận đã khớp số dư (Chuyển PAID)'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Order Workflow Actions */}
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-900">
                    <span>Xử lý tiến độ</span>
                    <span className="text-[10px] text-gray-400 font-normal">Quy tắc R4</span>
                  </div>

                  {(selectedOrder.status === 'PENDING_RESERVATION' || selectedOrder.status === 'PENDING_PAYMENT') && (
                    <button
                      onClick={() => handleOrderStatusAction('CONFIRM')}
                      disabled={updatingStatus}
                      className="w-full py-2 bg-[#0F5132] hover:bg-[#0c4128] text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Xác nhận đơn hàng (CONFIRM)</span>
                    </button>
                  )}

                  {(selectedOrder.status === 'PAID' || selectedOrder.status === 'CONFIRMED') && (
                    <button
                      onClick={() => handleOrderStatusAction('PREPARE')}
                      disabled={updatingStatus}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Bắt đầu đóng gói (PREPARE)</span>
                    </button>
                  )}

                  {selectedOrder.status === 'PREPARING' && (
                    <button
                      onClick={() => handleOrderStatusAction('HANDOVER')}
                      disabled={updatingStatus}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{selectedOrder.fulfillment_type === 'STORE_PICKUP' ? 'Sẵn sàng tại quầy (READY_FOR_PICKUP)' : 'Bàn giao vận chuyển'}</span>
                    </button>
                  )}

                  {selectedOrder.status === 'READY_FOR_PICKUP' && (
                    <button
                      onClick={() => handleOrderStatusAction('COMPLETE')}
                      disabled={updatingStatus}
                      className="w-full py-2 bg-[#111613] hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C8F31D]" />
                      <span>Đã giao khách tại quầy (COMPLETE)</span>
                    </button>
                  )}

                  {/* Nút Tạo Phiếu Hoàn Tiền */}
                  <button
                    onClick={() => {
                      setRefundAmount(String(selectedOrder.total_amount));
                      setRefundModalOpen(true);
                    }}
                    className="w-full py-2 bg-white hover:bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Lập phiếu hoàn tiền (Refund)</span>
                  </button>

                  {/* Nút In Phiếu Xuất Kho / Hóa Đơn */}
                  <button
                    onClick={() => setPrintModalOpen(true)}
                    className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-stone-600" />
                    <span>In phiếu giao hàng / Hóa đơn</span>
                  </button>

                  {/* Hủy đơn */}
                  {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                    <button
                      onClick={() => {
                        if (confirm(`Bạn có chắc chắn muốn hủy đơn hàng ${selectedOrder.id}?`)) {
                          handleOrderStatusAction('CANCEL');
                        }
                      }}
                      className="w-full py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Hủy đơn hàng (CANCEL)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-black/10 p-8 text-center text-xs text-gray-400">
                Chọn một đơn hàng từ bảng bên trái để xem chi tiết
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Lập Phiếu Hoàn Tiền */}
      {refundModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-black/10 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-gray-900">Tạo Phiếu Hoàn Tiền</h3>
              </div>
              <button
                onClick={() => setRefundModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRefund} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Mã đơn hàng</label>
                <input
                  type="text"
                  value={selectedOrder.id}
                  disabled
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-gray-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Số tiền hoàn (₫) *</label>
                <input
                  type="number"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  max={selectedOrder.total_amount}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-1">Lý do hoàn tiền *</label>
                <textarea
                  required
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="VD: Khách trả hàng do sai mẫu mã, sản phẩm không vừa tay..."
                  className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={submittingRefund}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium cursor-pointer"
                >
                  {submittingRefund ? 'Đang tạo...' : 'Xác nhận tạo phiếu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal In Hóa Đơn / Phiếu Giao Hàng */}
      {printModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E4E3DD] max-w-md w-full p-6 shadow-xl space-y-4 text-[#111613]">
            <div className="text-center pb-3 border-b border-dashed border-[#E4E3DD]">
              <div className="font-bold text-base tracking-tight uppercase">Smash Court Badminton</div>
              <div className="text-[11px] text-[#6A726E]">Hệ thống thiết bị cầu lông Yonex, Victor, Li-Ning chính hãng</div>
              <div className="text-[12px] font-mono font-medium mt-1">PHIẾU XUẤT KHO &amp; GIAO HÀNG</div>
              <div className="text-xs font-mono text-[#0F5132] font-semibold">{selectedOrder.id}</div>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6A726E]">Khách hàng:</span>
                <span className="font-medium">{selectedOrder.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A726E]">Số điện thoại:</span>
                <span className="font-mono">{selectedOrder.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A726E]">Chi nhánh xuất:</span>
                <span className="font-medium">{selectedOrder.branch_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6A726E]">Hình thức:</span>
                <span>{selectedOrder.fulfillment_type === 'DELIVERY' ? 'Giao hàng tận nơi' : 'Nhận tại quầy'}</span>
              </div>
              {selectedOrder.shipping_address && (
                <div className="flex justify-between">
                  <span className="text-[#6A726E]">Địa chỉ nhận:</span>
                  <span className="text-right max-w-[200px]">{selectedOrder.shipping_address}</span>
                </div>
              )}
            </div>

            {/* Bảng sản phẩm */}
            <div className="border-t border-[#E4E3DD] pt-2">
              <div className="text-[11px] font-semibold text-[#6A726E] mb-1">DANH MỤC SẢN PHẨM:</div>
              <div className="space-y-1.5">
                {selectedOrder.lines.map((l) => (
                  <div key={l.id} className="flex justify-between text-xs">
                    <span className="max-w-[220px] truncate">{l.product_name_snapshot} (x{l.quantity})</span>
                    <span className="font-mono">{Number(l.subtotal).toLocaleString('vi-VN')} ₫</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t border-[#E4E3DD] text-xs">
              <span className="font-medium">Tổng giá trị đơn hàng:</span>
              <span className="font-bold text-[#0F5132] font-mono text-sm">
                {Number(selectedOrder.total_amount).toLocaleString('vi-VN')} ₫
              </span>
            </div>

            <div className="pt-2 text-[10px] text-center text-[#6A726E] border-t border-dashed border-[#E4E3DD] leading-relaxed">
              * Cảm ơn quý khách đã mua sắm tại Smash Court. Bảo hành điện tử tra cứu tại smashcourt.vn/tra-cuu-bao-hanh
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrintModalOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs hover:bg-stone-50"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  setPrintModalOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#111613] text-white text-xs font-medium hover:bg-black flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In phiếu ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Đang tải danh sách đơn hàng...</div>}>
      <AdminOrdersPageContent />
    </React.Suspense>
  );
}
