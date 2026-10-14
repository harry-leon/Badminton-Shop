'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PriceTag } from '@/components/ui/PriceTag';
import { QrCode, CheckCircle2, Clock, AlertCircle, X, ShoppingBag } from 'lucide-react';

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
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Vui lòng nhập họ tên và số điện thoại.');
      return;
    }
    if (fulfillmentType === 'DELIVERY' && !shippingAddress.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ nhận hàng.');
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
          branchId: unit.branch_id,
          paymentMethod,
          items: [{ sku: unit.id, quantity: 1 }],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Giữ chỗ không thành công');
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
      <Button
        onClick={() => setIsOpen(true)}
        size="sm"
        className="px-4 text-[13px]"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        <span>Giữ chỗ mua</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-line">
            <button
              onClick={() => {
                setIsOpen(false);
                setOrderResult(null);
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-bg text-muted hover:text-ink transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!orderResult ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="text-[12px] text-muted font-normal">
                    Quy tắc R2: Sản phẩm độc bản duy nhất
                  </div>
                  <h2 className="text-xl font-medium text-ink mt-1">
                    Giữ chỗ mua vợt cũ Hạng {unit.grade}
                  </h2>
                  <p className="text-[13px] text-muted mt-0.5 font-normal">
                    {unit.model_name}
                  </p>
                </div>

                <div className="p-3 bg-bg rounded-xl text-[13px] space-y-1.5 border border-line">
                  <div className="flex justify-between">
                    <span className="text-muted">Mã serial:</span>
                    <span className="font-mono text-ink">{unit.serial_number || 'Khớp hồ sơ'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Bảo hành kết cấu:</span>
                    <span className="text-ink font-medium">{unit.warranty_days} ngày</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-line items-baseline">
                    <span className="text-ink font-medium">Giá niêm yết:</span>
                    <PriceTag amount={parseInt(unit.resale_price as any, 10)} size="md" />
                  </div>
                </div>

                <div className="space-y-3 text-[13px]">
                  <div>
                    <label className="block text-ink font-medium mb-1">Họ và tên người mua:</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="VD: Lê Hoàng Nam"
                      className="w-full p-2.5 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-ink font-normal"
                    />
                  </div>
                  <div>
                    <label className="block text-ink font-medium mb-1">Số điện thoại:</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="VD: 0912345678"
                      className="w-full p-2.5 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-ink font-normal"
                    />
                  </div>

                  {/* Hình thức nhận hàng */}
                  <div>
                    <label className="block text-ink font-medium mb-1">Hình thức nhận hàng:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFulfillmentType('STORE_PICKUP')}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer text-[13px] ${
                          fulfillmentType === 'STORE_PICKUP'
                            ? 'border-ink bg-bg text-ink font-medium'
                            : 'border-line text-muted font-normal'
                        }`}
                      >
                        Nhận tại cửa hàng
                      </button>
                      <button
                        type="button"
                        onClick={() => setFulfillmentType('DELIVERY')}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer text-[13px] ${
                          fulfillmentType === 'DELIVERY'
                            ? 'border-ink bg-bg text-ink font-medium'
                            : 'border-line text-muted font-normal'
                        }`}
                      >
                        Giao hàng tận nơi
                      </button>
                    </div>
                  </div>

                  {fulfillmentType === 'DELIVERY' && (
                    <div>
                      <label className="block text-ink font-medium mb-1">Địa chỉ giao hàng:</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="VD: 123 Lê Lợi, Phường Bến Nghé, Quận 1"
                        className="w-full p-2.5 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-ink font-normal"
                      />
                    </div>
                  )}

                  {/* Phương thức thanh toán */}
                  <div>
                    <label className="block text-ink font-medium mb-1">Phương thức thanh toán:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('VIETQR')}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 text-[13px] ${
                          paymentMethod === 'VIETQR'
                            ? 'border-ink bg-bg text-ink font-medium'
                            : 'border-line text-muted font-normal'
                        }`}
                      >
                        <QrCode className="w-4 h-4" /> VietQR (Giữ 30p)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('COD')}
                        className={`p-2.5 rounded-xl border text-center transition-colors cursor-pointer text-[13px] ${
                          paymentMethod === 'COD'
                            ? 'border-ink bg-bg text-ink font-medium'
                            : 'border-line text-muted font-normal'
                        }`}
                      >
                        COD (Giữ 12h)
                      </button>
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 bg-sale/10 border border-sale/20 text-sale text-[13px] rounded-xl flex items-center gap-2 font-normal">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  isLoading={submitting}
                  className="w-full mt-2"
                  size="lg"
                >
                  Xác nhận giữ chỗ mua
                </Button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-xl font-medium text-ink">
                    Giữ chỗ thành công
                  </h3>
                  <p className="text-[13px] text-muted mt-0.5">
                    Mã đơn hàng: <span className="text-ink font-medium">{orderResult.orderId}</span>
                  </p>
                </div>

                {orderResult.pickupCode && (
                  <div className="bg-bg border border-line p-3.5 rounded-xl text-left">
                    <div className="text-[12px] text-muted">
                      Mã nhận hàng tại quầy:
                    </div>
                    <div className="text-2xl font-medium text-ink mt-0.5 font-mono">
                      {orderResult.pickupCode}
                    </div>
                    <p className="text-[12px] text-muted mt-1 font-normal">
                      Vui lòng xuất trình mã này cho nhân viên chi nhánh khi đến nhận vợt.
                    </p>
                  </div>
                )}

                {orderResult.vietqr && (
                  <div className="bg-bg border border-line p-4 rounded-xl text-left space-y-2 text-[13px]">
                    <div className="flex justify-center mb-2">
                      <img
                        src={orderResult.vietqr.qrUrl}
                        alt="VietQR"
                        className="w-44 h-44 rounded-xl border border-line bg-white p-2"
                      />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Nội dung CK:</span>
                      <span className="text-brand font-medium">{orderResult.vietqr.transferContent}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-muted">Số tiền:</span>
                      <PriceTag amount={parseInt(orderResult.totalAmount, 10)} size="md" />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <a
                    href={`/tra-cuu-bao-hanh?orderCode=${orderResult.orderId}&phone=${customerPhone}`}
                    className="inline-flex items-center justify-center bg-ink text-bg font-medium text-[13px] px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity"
                  >
                    Xem chi tiết đơn hàng & bảo hành
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
