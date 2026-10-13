'use client';

import React, { useState } from 'react';
import { ShoppingBag, QrCode, CheckCircle2, Clock, AlertCircle, X } from 'lucide-react';

interface SecondhandOrderButtonProps {
  unit: {
    id: string;
    model_name: string;
    grade: string;
    resale_price: number;
    branch_id: string;
    warranty_days: number;
    serial_number?: string;
  };
}

export default function SecondhandOrderButton({ unit }: SecondhandOrderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'STORE_PICKUP'>('STORE_PICKUP');
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'COD'>('VIETQR');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderResult, setOrderResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          shippingAddress: shippingAddress.trim(),
          fulfillmentType,
          branchId: unit.branch_id,
          paymentMethod,
          items: [{ sku: unit.id, quantity: 1 }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Giữ chỗ thất bại');
      }

      setOrderResult(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-[#0F5132] hover:bg-emerald-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
      >
        <ShoppingBag className="w-3.5 h-3.5" /> Giữ Chỗ Mua
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-slate-200">
            <button
              onClick={() => {
                setIsOpen(false);
                setOrderResult(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!orderResult ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
                    Quy tắc R2: Unique Unit (Chỉ 1 chiếc)
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-2">
                    Giữ Chỗ Mua Vợt Cũ Hạng {unit.grade}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 font-bold">
                    {unit.model_name} • Mã: {unit.id}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã Serial:</span>
                    <span className="font-mono font-bold text-slate-800">{unit.serial_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bảo hành kết cấu:</span>
                    <span className="font-bold text-slate-800">{unit.warranty_days} ngày</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-700">Giá niêm yết:</span>
                    <span className="font-black text-base text-[#0F5132]">
                      {parseInt(unit.resale_price as any, 10).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Họ và tên người mua:</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="VD: Lê Hoàng Nam"
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số điện thoại:</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="VD: 0912345678"
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phương thức thanh toán:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('VIETQR')}
                        className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                          paymentMethod === 'VIETQR'
                            ? 'border-[#0F5132] bg-emerald-50 text-[#0F5132]'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        <QrCode className="w-4 h-4" /> VietQR (Giữ 30p)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('COD')}
                        className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer ${
                          paymentMethod === 'COD'
                            ? 'border-[#0F5132] bg-emerald-50 text-[#0F5132]'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        COD (Giữ 12h)
                      </button>
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#0F5132] hover:bg-emerald-900 text-white font-black py-3.5 rounded-xl transition text-sm cursor-pointer disabled:opacity-50 mt-2"
                >
                  {submitting ? 'Đang xác nhận giữ chỗ...' : 'Xác Nhận Giữ Chỗ Mua'}
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-[#0F5132] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Đã Giữ Chỗ Thành Công!
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mã đơn hàng: <strong className="font-mono text-slate-900">{orderResult.orderId}</strong>
                  </p>
                </div>

                {orderResult.vietqr && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left space-y-2 text-xs">
                    <div className="flex justify-center mb-2">
                      <img
                        src={orderResult.vietqr.qrUrl}
                        alt="VietQR"
                        className="w-44 h-44 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Nội dung CK:</span>
                      <strong className="font-mono text-[#0F5132]">{orderResult.vietqr.transferContent}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số tiền:</span>
                      <strong className="text-emerald-800 font-bold">
                        {parseInt(orderResult.totalAmount, 10).toLocaleString('vi-VN')}₫
                      </strong>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <a
                    href={`/tra-cuu-bao-hanh?orderCode=${orderResult.orderId}&phone=${customerPhone}`}
                    className="inline-block bg-[#0F5132] text-white font-bold text-xs px-5 py-2.5 rounded-xl"
                  >
                    Xem Chi Tiết & Tra Cứu Bảo Hành
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
