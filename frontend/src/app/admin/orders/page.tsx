'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, QrCode, CheckCircle2, Clock, AlertTriangle, RefreshCw, FileText, User } from 'lucide-react';

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
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reconcileRef, setReconcileRef] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-[#0F5132]" />
            Quản Lý Đơn Hàng & Đối Soát VietQR
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dữ liệu trực tiếp từ PostgreSQL 18 order_db. Snapshot bất biến (R9), máy trạng thái và đối soát VietQR duy nhất một lần.
          </p>
        </div>

        <button
          onClick={loadOrders}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl shadow-sm cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới danh sách
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          {actionMessage}
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Danh Sách Đơn Hàng */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="font-extrabold text-xs text-slate-800">Tất Cả Đơn Hàng ({orders.length})</span>
              <span className="text-[11px] text-slate-500">Click để xem chi tiết & đối soát</span>
            </div>

            <div className="divide-y divide-slate-100">
              {orders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const total = parseInt(order.total_amount as any, 10);
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-4 transition cursor-pointer ${
                      isSelected ? 'bg-emerald-50/60 border-l-4 border-emerald-700' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono font-bold text-xs text-slate-900">{order.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.status === 'COMPLETED' ? 'bg-slate-100 text-slate-800' :
                        order.status === 'PAID' ? 'bg-emerald-100 text-emerald-900' :
                        order.status === 'AWAITING_PAYMENT' ? 'bg-amber-100 text-amber-900' :
                        'bg-blue-100 text-blue-900'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <div>
                        <strong className="text-slate-800">{order.customer_name}</strong> ({order.customer_phone})
                      </div>
                      <div className="font-black text-[#0F5132]">{total.toLocaleString('vi-VN')}₫</div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>{order.fulfillment_type === 'DELIVERY' ? 'Giao hàng tận nơi' : `Nhận tại kho (${order.pickup_code || 'Chờ sinh mã'})`}</span>
                      <span>{new Date(order.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chi Tiết Đơn Hàng & Đối Soát VietQR */}
        <div className="lg:col-span-5">
          {selectedOrder ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-24">
              <div className="border-b border-slate-100 pb-4">
                <div className="text-xs font-mono font-bold text-slate-400">CHI TIẾT ĐƠN HÀNG</div>
                <h2 className="text-lg font-black text-slate-900 mt-0.5">{selectedOrder.id}</h2>
                <div className="text-xs text-slate-500 mt-1">
                  Trạng thái: <strong className="text-emerald-800">{selectedOrder.status}</strong>
                </div>
              </div>

              {/* Thông tin khách hàng */}
              <div className="text-xs space-y-1.5 text-slate-600 bg-slate-50 p-3.5 rounded-xl">
                <div><strong className="text-slate-900">Khách hàng:</strong> {selectedOrder.customer_name}</div>
                <div><strong className="text-slate-900">Điện thoại:</strong> {selectedOrder.customer_phone}</div>
                <div>
                  <strong className="text-slate-900">Hình thức:</strong>{' '}
                  {selectedOrder.fulfillment_type === 'DELIVERY' ? 'Giao hàng tận nơi' : 'Nhận tại cửa hàng'}
                </div>
                {selectedOrder.shipping_address && (
                  <div><strong className="text-slate-900">Địa chỉ:</strong> {selectedOrder.shipping_address}</div>
                )}
                {selectedOrder.pickup_code && (
                  <div><strong className="text-slate-900">Mã pickup:</strong> <span className="font-mono font-bold text-emerald-800">{selectedOrder.pickup_code}</span></div>
                )}
              </div>

              {/* Dòng hàng snapshot (R9) */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0F5132]" />
                  Dòng Sản Phẩm Snapshot (R9)
                </h3>
                <div className="space-y-2">
                  {selectedOrder.lines.map((line) => (
                    <div key={line.id} className="border border-slate-100 bg-slate-50/50 p-2.5 rounded-lg text-xs">
                      <div className="font-bold text-slate-900">{line.product_name_snapshot}</div>
                      <div className="flex justify-between text-slate-500 mt-1 text-[11px]">
                        <span>Số lượng: {line.quantity}</span>
                        <span className="font-bold text-slate-800">
                          {parseInt(line.subtotal as any, 10).toLocaleString('vi-VN')}₫
                        </span>
                      </div>
                      <div className="mt-1.5 text-[10px] text-emerald-900 bg-emerald-50/80 p-1.5 rounded">
                        <strong>Bảo hành snapshot:</strong> {line.warranty_policy_snapshot}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Khối Đối Soát VietQR */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-emerald-700" />
                  Đối Soát & Xác Nhận Thanh Toán VietQR
                </h3>

                {selectedOrder.payments && selectedOrder.payments.length > 0 && selectedOrder.payments[0].status === 'CONFIRMED' ? (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-3.5 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      Đã xác nhận thanh toán thành công
                    </div>
                    <div><strong>Mã tham chiếu ngân hàng:</strong> <span className="font-mono">{selectedOrder.payments[0].transaction_ref}</span></div>
                    <div><strong>Người xác nhận:</strong> {selectedOrder.payments[0].confirmed_by}</div>
                    <div><strong>Thời điểm:</strong> {new Date(selectedOrder.payments[0].confirmed_at!).toLocaleString('vi-VN')}</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs">
                      <div className="font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Đang chờ chuyển khoản VietQR
                      </div>
                      <div className="mt-1 text-[11px]">
                        Khách hàng quét mã VietQR kèm cú pháp mã đơn <strong>{selectedOrder.id}</strong>.
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Nhập mã giao dịch đối chiếu (Transaction Ref):
                      </label>
                      <input
                        type="text"
                        value={reconcileRef}
                        onChange={(e) => setReconcileRef(e.target.value)}
                        placeholder="VD: TXN-VCB-20261013-9999"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0F5132]"
                      />
                    </div>

                    <button
                      onClick={handleReconcile}
                      disabled={reconciling || !reconcileRef.trim()}
                      className="w-full bg-[#0F5132] hover:bg-emerald-900 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {reconciling ? 'Đang xác nhận...' : 'Xác Nhận Đã Nhận Tiền & Chuyển PAID'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
              Chọn một đơn hàng để xem chi tiết
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
