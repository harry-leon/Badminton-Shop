'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
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
  Copy
} from 'lucide-react';

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
  lines: OrderLine[];
  payments: Payment[];
}

export default function AdminOrdersPage() {
  const { selectedBranch, density } = useAdmin();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reconcileRef, setReconcileRef] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        if (data.orders && data.orders.length > 0 && !selectedOrder) {
          setSelectedOrder(data.orders[0]);
        } else if (selectedOrder) {
          const updated = data.orders.find((o: Order) => o.id === selectedOrder.id);
          if (updated) setSelectedOrder(updated);
        }
      }
    } catch (err) {
      console.error('Lỗi tải đơn hàng:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleReconcile = async () => {
    if (!selectedOrder || !reconcileRef.trim()) {
      alert('Vui lòng nhập mã tham chiếu giao dịch ngân hàng');
      return;
    }
    setReconciling(true);
    setActionMessage('');
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          transactionRef: reconcileRef.trim(),
          confirmedBy: 'kt_admin_portal',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Đối soát thành công đơn ${selectedOrder.id}! Trạng thái chuyển sang PAID.`);
        setReconcileRef('');
        await loadOrders();
      } else {
        alert(data.error || 'Lỗi đối soát thanh toán');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReconciling(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchQuery = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_phone.includes(searchQuery);
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchBranch = selectedBranch === 'ALL' || o.branch_id === selectedBranch;
    return matchQuery && matchStatus && matchBranch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            Đã thanh toán (PAID)
          </span>
        );
      case 'AWAITING_PAYMENT':
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-900 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-700" />
            Chờ thanh toán QR
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-stone-100 text-stone-800">
            <Check className="w-3 h-3 text-stone-600" />
            Đã hoàn thành
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-900">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-[#E4E3DD]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-0.5 rounded bg-[#0F5132]/10 text-[#0F5132] font-medium border border-[#0F5132]/20">
              Chi nhánh: {selectedBranch}
            </span>
            <span className="text-xs text-[#6A726E]">Quy tắc Snapshot R9 & Đối soát VietQR</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-[#111613] tracking-tight">
            Quản lý đơn hàng & đối soát thanh toán
          </h1>
          <p className="text-xs text-[#6A726E] mt-0.5">
            Dữ liệu trực tiếp từ PostgreSQL order_db. Đảm bảo snapshot giá và chính sách bất biến, đối soát ngân hàng duy nhất 1 lần.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E3DD] bg-white hover:bg-stone-50 text-xs font-normal text-[#111613] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#0F5132] shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Main Grid: Orders Table on Left, Details on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Orders DataTable */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#E4E3DD] overflow-hidden">
          {/* Toolbar */}
          <div className="p-3 sm:p-4 border-b border-[#E4E3DD] space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Tìm theo mã đơn, tên hoặc số điện thoại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[#E4E3DD] text-xs bg-white text-[#111613]"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="AWAITING_PAYMENT">Chờ thanh toán (VietQR)</option>
                <option value="PAID">Đã thanh toán (PAID)</option>
                <option value="COMPLETED">Đã hoàn tất</option>
              </select>
            </div>

            <div className="text-[11px] text-[#6A726E] flex items-center justify-between">
              <span>Đang chọn chi nhánh: <strong className="text-[#111613] font-medium">{selectedBranch}</strong></span>
              <span>Tổng số: <strong className="text-[#111613] font-medium">{filteredOrders.length}</strong> đơn</span>
            </div>
          </div>

          {/* List items */}
          <div className="divide-y divide-[#E4E3DD] max-h-[640px] overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6A726E]">
                Không có đơn hàng nào khớp với điều kiện lọc.
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const total = parseInt(order.total_amount as any, 10);
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-3.5 transition-colors cursor-pointer text-xs ${
                      isSelected ? 'bg-[#F5F4F0] border-l-3 border-[#0F5132]' : 'hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-[#111613] font-medium">{order.id}</span>
                      {getStatusBadge(order.status)}
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#6A726E] mt-1">
                      <div>
                        <strong className="text-[#111613] font-medium">{order.customer_name}</strong>
                        <span className="text-[11px] ml-1.5">({order.customer_phone})</span>
                      </div>
                      <div className="font-medium text-[#111613] tabular-nums">
                        {total.toLocaleString('vi-VN')} ₫
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#6A726E] mt-2 pt-1 border-t border-stone-100">
                      <span>
                        {order.fulfillment_type === 'DELIVERY' 
                          ? 'Giao hàng tận nơi' 
                          : `Nhận tại quầy (${order.pickup_code || 'Chờ mã'})`}
                      </span>
                      <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Order Detail & Reconciliation */}
        <div className="lg:col-span-5">
          {selectedOrder ? (
            <div className="bg-white rounded-xl border border-[#E4E3DD] p-5 space-y-5 sticky top-20">
              <div className="border-b border-[#E4E3DD] pb-3">
                <div className="text-[11px] text-[#6A726E]">Chi tiết đơn hàng</div>
                <div className="flex items-center justify-between mt-1">
                  <h2 className="text-base font-medium font-mono text-[#111613]">{selectedOrder.id}</h2>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div className="text-[11px] text-[#6A726E] mt-0.5">
                  Tạo lúc: {new Date(selectedOrder.created_at).toLocaleString('vi-VN')}
                </div>
              </div>

              {/* Customer Information */}
              <div className="text-xs space-y-1.5 bg-[#F5F4F0] p-3 rounded-lg text-[#6A726E]">
                <div className="text-[#111613] font-medium mb-1">Thông tin khách hàng & Giao nhận</div>
                <div><span className="text-[#111613]">Họ tên:</span> {selectedOrder.customer_name}</div>
                <div><span className="text-[#111613]">Số điện thoại:</span> {selectedOrder.customer_phone}</div>
                <div>
                  <span className="text-[#111613]">Phương thức:</span>{' '}
                  {selectedOrder.fulfillment_type === 'DELIVERY' ? 'Giao hàng tận nơi' : 'Nhận tại quầy cửa hàng'}
                </div>
                {selectedOrder.shipping_address && (
                  <div><span className="text-[#111613]">Địa chỉ nhận:</span> {selectedOrder.shipping_address}</div>
                )}
                {selectedOrder.pickup_code && (
                  <div>
                    <span className="text-[#111613]">Mã nhận hàng (Pickup):</span>{' '}
                    <span className="font-mono font-medium text-[#0F5132]">{selectedOrder.pickup_code}</span>
                  </div>
                )}
              </div>

              {/* Snapshot Lines (R9) */}
              <div>
                <div className="text-xs font-medium text-[#111613] mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0F5132]" />
                  <span>Dòng sản phẩm Snapshot bất biến (R9)</span>
                </div>
                <div className="space-y-2">
                  {selectedOrder.lines.map((line) => (
                    <div key={line.id} className="border border-[#E4E3DD] bg-stone-50/50 p-2.5 rounded-lg text-xs">
                      <div className="font-medium text-[#111613]">{line.product_name_snapshot}</div>
                      <div className="flex justify-between text-[#6A726E] mt-1 text-[11px]">
                        <span>Số lượng: {line.quantity} cây</span>
                        <span className="font-medium text-[#111613] tabular-nums">
                          {parseInt(line.subtotal as any, 10).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                      <div className="mt-1.5 text-[10px] text-[#0F5132] bg-[#0F5132]/5 p-1.5 rounded border border-[#0F5132]/10">
                        <strong>Bảo hành:</strong> {line.warranty_policy_snapshot}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs font-medium text-[#111613] mt-3 pt-2 border-t border-[#E4E3DD]">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="text-sm font-medium tabular-nums text-[#0F5132]">
                    {parseInt(selectedOrder.total_amount as any, 10).toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>

              {/* VietQR Reconciliation Block */}
              <div className="border-t border-[#E4E3DD] pt-4">
                <div className="text-xs font-medium text-[#111613] mb-2 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-[#0F5132]" />
                  <span>Đối soát thanh toán ngân hàng (K8)</span>
                </div>

                {selectedOrder.payments && selectedOrder.payments.length > 0 && selectedOrder.payments[0].status === 'CONFIRMED' ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3 rounded-lg text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-[#0F5132]">
                      <CheckCircle2 className="w-4 h-4 text-[#0F5132]" />
                      <span>Đã xác nhận khớp số dư giao dịch</span>
                    </div>
                    <div><strong>Mã tham chiếu:</strong> <span className="font-mono">{selectedOrder.payments[0].transaction_ref}</span></div>
                    <div><strong>Người xác nhận:</strong> {selectedOrder.payments[0].confirmed_by}</div>
                    <div><strong>Thời điểm:</strong> {new Date(selectedOrder.payments[0].confirmed_at!).toLocaleString('vi-VN')}</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs">
                      <div className="font-medium flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        <span>Chờ đối chiếu chuyển khoản VietQR</span>
                      </div>
                      <div className="mt-1 text-[11px] text-amber-800">
                        Khách thanh toán quét mã Napas với nội dung kèm mã đơn <strong>{selectedOrder.id}</strong>.
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#6A726E] mb-1">
                        Mã giao dịch đối chiếu ngân hàng (Transaction Ref):
                      </label>
                      <input
                        type="text"
                        value={reconcileRef}
                        onChange={(e) => setReconcileRef(e.target.value)}
                        placeholder="VD: TXN-VCB-20261013-9999"
                        className="w-full text-xs p-2 rounded-lg border border-[#E4E3DD] font-mono text-[#111613] focus:outline-none focus:border-[#0F5132]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleReconcile}
                      disabled={reconciling || !reconcileRef.trim()}
                      className="w-full bg-[#111613] hover:bg-[#0F5132] text-white py-2 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {reconciling ? 'Đang xác nhận đối soát...' : 'Xác nhận đã nhận tiền (Chuyển PAID)'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E4E3DD] p-8 text-center text-xs text-[#6A726E]">
              Chọn một đơn hàng từ bảng bên trái để xem chi tiết
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
