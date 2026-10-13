'use client';

import React, { useState } from 'react';
import { ShoppingBag, Store, QrCode, CheckCircle2, Clock, AlertCircle, Copy, X } from 'lucide-react';

interface SKU {
  id: string;
  weight: string;
  grip_size: string;
  balance_point_mm: number;
  stiffness: string;
  max_tension_lbs: number;
  price: number;
}

interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
}

interface StockLevel {
  branch_id: string;
  sku: string;
  on_hand: number;
  reserved: number;
  available: number;
}

interface OrderSectionProps {
  product: {
    id: string;
    name: string;
    slug: string;
    brand: string;
    imageUrl: string;
  };
  skus: SKU[];
  branches: Branch[];
  stockLevels: StockLevel[];
}

export default function OrderSection({ product, skus, branches, stockLevels }: OrderSectionProps) {
  const [selectedSkuId, setSelectedSkuId] = useState<string>(skus[0]?.id || '');
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || '');
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'STORE_PICKUP'>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'COD'>('VIETQR');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderResult, setOrderResult] = useState<any>(null);

  const selectedSku = skus.find((s) => s.id === selectedSkuId) || skus[0];
  const currentBranchStock = stockLevels.find(
    (sl) => sl.sku === selectedSkuId && sl.branch_id === selectedBranchId
  );
  const availableQty = currentBranchStock ? Math.max(0, currentBranchStock.available) : 0;

  const handleOpenOrder = () => {
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Vui lòng nhập họ tên và số điện thoại nhận hàng!');
      return;
    }
    if (fulfillmentType === 'DELIVERY' && !shippingAddress.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ nhận hàng!');
      return;
    }

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
          branchId: selectedBranchId,
          paymentMethod,
          items: [
            {
              sku: selectedSkuId,
              quantity: 1,
            },
          ],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đặt hàng thất bại');
      }

      setOrderResult(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Lựa chọn phiên bản SKU */}
      <div>
        <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
          1. Chọn Phiên Bản (Trọng Lượng & Cán Vợt)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {skus.map((sku) => {
            const isSelected = sku.id === selectedSkuId;
            return (
              <button
                key={sku.id}
                type="button"
                onClick={() => setSelectedSkuId(sku.id)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#0F5132] bg-emerald-50/60 ring-2 ring-[#0F5132]'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <div className="font-extrabold text-xs text-slate-900">{sku.weight} - {sku.grip_size}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">{sku.id}</div>
                </div>
                <div className="font-black text-xs text-[#0F5132] mt-2">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(sku.price)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lựa chọn chi nhánh & xem tồn kho thực tế */}
      <div className="border border-emerald-900/10 rounded-2xl p-4 bg-emerald-50/50">
        <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wide mb-2">
          2. Tồn Kho Thực Tế Tại Các Chi Nhánh
        </label>
        <div className="space-y-2">
          {branches.map((b) => {
            const stock = stockLevels.find((sl) => sl.sku === selectedSkuId && sl.branch_id === b.id);
            const avail = stock ? Math.max(0, stock.available) : 0;
            const isSelected = b.id === selectedBranchId;

            return (
              <div
                key={b.id}
                onClick={() => setSelectedBranchId(b.id)}
                className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition text-xs ${
                  isSelected
                    ? 'border-emerald-600 bg-white shadow-xs font-semibold'
                    : 'border-transparent hover:bg-emerald-100/40 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-900">{b.name}</div>
                  <div className="text-[11px] text-slate-500">{b.address}</div>
                </div>
                <div className="text-right">
                  {avail > 0 ? (
                    <span className="font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Còn {avail} cây
                    </span>
                  ) : (
                    <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                      Tạm hết hàng
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nút Kích Hoạt Mua */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleOpenOrder}
          disabled={availableQty === 0}
          className="flex-1 bg-[#C8F31D] text-[#0B1210] font-black py-4 rounded-xl shadow-md hover:bg-lime-400 transition-all text-base tracking-wide flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ShoppingBag className="w-5 h-5" />
          {availableQty > 0 ? 'Đặt Mua Ngay (Khóa Kho)' : 'Hết Hàng Tại Chi Nhánh Đã Chọn'}
        </button>
      </div>

      {/* MODAL CHECKOUT & VIETQR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-slate-200">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setOrderResult(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!orderResult ? (
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
                    Khóa kho nguyên tử R1
                  </span>
                  <h2 className="text-xl font-black text-slate-900 mt-2">
                    Xác Nhận Đặt Mua Vợt Cầu Lông
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {product.name} ({selectedSku?.weight}-{selectedSku?.grip_size})
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã SKU:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedSkuId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Chi nhánh xuất kho:</span>
                    <span className="font-bold text-slate-800">
                      {branches.find((b) => b.id === selectedBranchId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-700">Tổng thanh toán:</span>
                    <span className="font-black text-base text-[#0F5132]">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedSku?.price || 0)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Họ và tên người nhận:</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="VD: Nguyễn Văn An"
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Số điện thoại (dùng tra cứu bảo hành):</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="VD: 0909123456"
                      className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                    />
                  </div>

                  {/* Hình thức nhận hàng */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Hình thức nhận hàng:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFulfillmentType('DELIVERY')}
                        className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer ${
                          fulfillmentType === 'DELIVERY'
                            ? 'border-[#0F5132] bg-emerald-50 text-[#0F5132]'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Giao hàng tận nơi
                      </button>
                      <button
                        type="button"
                        onClick={() => setFulfillmentType('STORE_PICKUP')}
                        className={`p-2.5 rounded-xl border text-center font-bold cursor-pointer ${
                          fulfillmentType === 'STORE_PICKUP'
                            ? 'border-[#0F5132] bg-emerald-50 text-[#0F5132]'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Nhận tại quầy (Store Pickup)
                      </button>
                    </div>
                  </div>

                  {fulfillmentType === 'DELIVERY' && (
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Địa chỉ giao hàng:</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="VD: 123 Lê Lợi, Phường Bến Nghé, Quận 1"
                        className="w-full p-2.5 rounded-xl border border-slate-300"
                      />
                    </div>
                  )}

                  {/* Phương thức thanh toán */}
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
                        <QrCode className="w-4 h-4" /> Chuyển khoản VietQR (30p)
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
                        Thanh toán COD khi nhận (12h)
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
                  {submitting ? 'Đang thực hiện atomic lock tồn kho...' : 'Xác Nhận & Đặt Hàng'}
                </button>
              </form>
            ) : (
              /* MÀN HÌNH ĐẶT HÀNG THÀNH CÔNG VÀ VIETQR */
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-[#0F5132] rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">
                    Đặt Hàng & Giữ Chỗ Thành Công!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Mã đơn hàng: <strong className="font-mono text-slate-900">{orderResult.orderId}</strong>
                  </p>
                </div>

                {orderResult.pickupCode && (
                  <div className="bg-lime-50 border border-lime-300 p-3 rounded-2xl">
                    <div className="text-[11px] text-lime-900 font-bold uppercase">Mã Nhận Hàng Tại Quầy (Store Pickup):</div>
                    <div className="text-2xl font-black text-lime-950 font-mono tracking-wider mt-0.5">
                      {orderResult.pickupCode}
                    </div>
                  </div>
                )}

                {orderResult.vietqr && (
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-left space-y-3">
                    <div className="text-center font-bold text-xs text-slate-800 flex items-center justify-center gap-1.5">
                      <QrCode className="w-4 h-4 text-[#0F5132]" /> Quét Mã VietQR NAPAS Để Thanh Toán
                    </div>

                    <div className="flex justify-center">
                      <img
                        src={orderResult.vietqr.qrUrl}
                        alt="VietQR Payment"
                        className="w-48 h-48 rounded-xl border border-slate-200 shadow-sm"
                      />
                    </div>

                    <div className="text-xs space-y-1.5 border-t border-slate-200 pt-3 text-slate-600">
                      <div className="flex justify-between">
                        <span>Ngân hàng:</span>
                        <strong className="text-slate-900">{orderResult.vietqr.bankName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Số tài khoản:</span>
                        <strong className="font-mono text-slate-900">{orderResult.vietqr.accountNumber}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Chủ tài khoản:</span>
                        <strong className="text-slate-900">{orderResult.vietqr.accountName}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Số tiền:</span>
                        <strong className="text-emerald-800 text-sm font-black">
                          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderResult.totalAmount)}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Nội dung CK:</span>
                        <strong className="font-mono text-[#0F5132] font-black">{orderResult.vietqr.transferContent}</strong>
                      </div>
                    </div>

                    <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-[11px] flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0 text-amber-700" />
                      <span>Hàng được giữ kho trong <strong>30 phút</strong>. Vui lòng hoàn tất thanh toán trước khi hết hạn!</span>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <a
                    href={`/tra-cuu-bao-hanh?orderCode=${orderResult.orderId}&phone=${customerPhone}`}
                    className="inline-block bg-[#0F5132] text-white font-bold text-xs px-6 py-3 rounded-xl hover:bg-emerald-900 transition"
                  >
                    Xem Chi Tiết Đơn Hàng & Bảo Hành
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
