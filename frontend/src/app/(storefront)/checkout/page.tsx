'use client';

import * as React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { Container } from '@/components/ui/Container';
import { useCart } from '@/lib/cart-context';
import { PriceTag } from '@/components/ui/PriceTag';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { QrCode, CheckCircle2, Clock, AlertCircle, ChevronRight, ShieldCheck, MapPin, Truck, Store } from 'lucide-react';

const BRANCHES = [
  { id: 'BR_HCM_01', name: 'Chi nhánh Quận 1 (TP. Hồ Chí Minh)', address: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1' },
  { id: 'BR_HN_01', name: 'Chi nhánh Cầu Giấy (Hà Nội)', address: '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy' },
  { id: 'BR_DN_01', name: 'Chi nhánh Hải Châu (Đà Nẵng)', address: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu' },
];

export default function CheckoutPage() {
  const { items, cartTotal, clearCart } = useCart();

  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [shippingAddress, setShippingAddress] = React.useState('');
  const [fulfillmentType, setFulfillmentType] = React.useState<'DELIVERY' | 'STORE_PICKUP'>('DELIVERY');
  const [branchId, setBranchId] = React.useState<string>(BRANCHES[0].id);
  const [paymentMethod, setPaymentMethod] = React.useState<'VIETQR' | 'COD'>('VIETQR');

  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [orderResult, setOrderResult] = React.useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ họ tên và số điện thoại người nhận.');
      return;
    }
    if (fulfillmentType === 'DELIVERY' && !shippingAddress.trim()) {
      setErrorMsg('Vui lòng nhập địa chỉ nhận hàng.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const checkoutItems = items.map((i) => ({
        sku: i.sku || i.id,
        quantity: i.quantity,
      }));

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          shippingAddress: shippingAddress.trim(),
          fulfillmentType,
          branchId,
          paymentMethod,
          items: checkoutItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đặt hàng không thành công');
      }

      setOrderResult(data);
      clearCart();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Màn hình thành công sau khi đặt hàng
  if (orderResult) {
    return (
      <div className="py-12 px-4 sm:px-6">
        <div className="max-w-xl mx-auto bg-surface border border-line rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-6">
          <div className="w-14 h-14 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-medium text-ink tracking-tight">
              Đặt hàng và giữ kho thành công
            </h1>
            <p className="text-[14px] text-muted mt-1 font-normal">
              Mã đơn hàng: <span className="font-mono text-ink font-medium">{orderResult.orderId}</span>
            </p>
          </div>

          {orderResult.pickupCode && (
            <div className="p-4 bg-bg border border-line rounded-xl text-left space-y-1">
              <div className="text-[13px] text-muted">
                Mã nhận hàng tại quầy (Store Pickup):
              </div>
              <div className="text-2xl font-medium text-ink font-mono">
                {orderResult.pickupCode}
              </div>
              <div className="text-[12px] text-muted">
                Chi nhánh nhận: {BRANCHES.find((b) => b.id === branchId)?.name}
              </div>
            </div>
          )}

          {orderResult.vietqr && (
            <div className="p-5 bg-bg border border-line rounded-xl text-left space-y-3">
              <div className="text-center text-[14px] font-medium text-ink flex items-center justify-center gap-1.5">
                <QrCode className="w-4 h-4 text-brand" /> Quét mã VietQR NAPAS để thanh toán
              </div>

              <div className="flex justify-center">
                <SafeImage
                  src={orderResult.vietqr.qrUrl}
                  alt="VietQR"
                  width={192}
                  height={192}
                  className="w-48 h-48 rounded-xl border border-line bg-white p-2"
                />
              </div>

              <div className="text-[13px] space-y-1.5 border-t border-line pt-3 text-muted">
                <div className="flex justify-between">
                  <span>Ngân hàng:</span>
                  <span className="text-ink font-medium">{orderResult.vietqr.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Số tài khoản:</span>
                  <span className="text-ink font-mono font-medium">{orderResult.vietqr.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chủ tài khoản:</span>
                  <span className="text-ink font-medium">{orderResult.vietqr.accountName}</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span>Số tiền:</span>
                  <PriceTag amount={orderResult.totalAmount} size="md" />
                </div>
                <div className="flex justify-between">
                  <span>Nội dung chuyển khoản:</span>
                  <span className="text-brand font-medium">{orderResult.vietqr.transferContent}</span>
                </div>
              </div>

              <div className="p-2.5 bg-surface border border-line text-muted rounded-lg text-[12px] flex items-center gap-2">
                <Clock className="w-4 h-4 shrink-0 text-muted" />
                <span>Hàng được giữ kho trong <span className="font-medium text-ink">30 phút</span>. Vui lòng hoàn tất thanh toán trước khi hết hạn.</span>
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/tra-cuu-bao-hanh?orderCode=${orderResult.orderId}&phone=${customerPhone}`}
              className="w-full sm:w-auto inline-flex items-center justify-center bg-ink text-bg text-[14px] font-medium px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity"
            >
              Theo dõi đơn hàng & bảo hành
            </Link>
            <Link
              href="/vot-cau-long"
              className="w-full sm:w-auto inline-flex items-center justify-center border border-line text-ink text-[14px] font-normal px-6 py-2.5 rounded-full hover:bg-bg transition-colors"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Nếu giỏ hàng rỗng
  if (items.length === 0) {
    return (
      <div className="py-12 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <EmptyState
            title="Chưa có sản phẩm để thanh toán"
            description="Giỏ hàng của bạn đang trống. Vui lòng thêm vợt vào giỏ hàng trước khi tiến hành thanh toán."
            actionText="Khám phá danh mục vợt"
            actionHref="/vot-cau-long"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-6xl">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted mb-4 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <Link href="/cart" className="hover:text-ink transition-colors">Giỏ hàng</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">Thanh toán</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-medium text-ink tracking-tight pb-6 mb-8 border-b border-line">
          Thanh toán đơn hàng
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Cột trái: Form thông tin & Phương thức (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Bước 1: Thông tin người nhận */}
              <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4">
                <h2 className="text-base font-medium text-ink flex items-center gap-2">
                  <span>1. Thông tin người nhận</span>
                </h2>

                <div className="space-y-3 text-[13px]">
                  <div>
                    <label className="block text-ink font-medium mb-1">Họ và tên:</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="VD: Nguyễn Văn An"
                      className="w-full p-2.5 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-ink font-normal"
                    />
                  </div>
                  <div>
                    <label className="block text-ink font-medium mb-1">Số điện thoại (dùng tra cứu đơn & bảo hành):</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="VD: 0909123456"
                      className="w-full p-2.5 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-ink font-normal"
                    />
                  </div>
                </div>
              </div>

              {/* Bước 2: Hình thức nhận hàng */}
              <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4">
                <h2 className="text-base font-medium text-ink">
                  2. Hình thức nhận hàng
                </h2>

                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('DELIVERY')}
                    className={`p-3 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                      fulfillmentType === 'DELIVERY'
                        ? 'border-ink bg-bg text-ink font-medium'
                        : 'border-line text-muted font-normal'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>Giao hàng tận nơi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('STORE_PICKUP')}
                    className={`p-3 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                      fulfillmentType === 'STORE_PICKUP'
                        ? 'border-ink bg-bg text-ink font-medium'
                        : 'border-line text-muted font-normal'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Nhận tại cửa hàng</span>
                  </button>
                </div>

                {fulfillmentType === 'DELIVERY' && (
                  <div className="text-[13px] pt-2">
                    <label className="block text-ink font-medium mb-1">Địa chỉ giao hàng chi tiết:</label>
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

                {/* Chọn chi nhánh */}
                <div className="pt-2 text-[13px] space-y-2">
                  <label className="block text-ink font-medium">
                    {fulfillmentType === 'STORE_PICKUP' ? 'Chọn chi nhánh nhận hàng:' : 'Chi nhánh xuất kho:'}
                  </label>
                  <div className="space-y-2">
                    {BRANCHES.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setBranchId(b.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          branchId === b.id
                            ? 'border-ink bg-bg font-medium'
                            : 'border-line bg-surface hover:border-ink/40'
                        }`}
                      >
                        <div className="text-ink text-[13px]">{b.name}</div>
                        <div className="text-[12px] text-muted font-normal">{b.address}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bước 3: Phương thức thanh toán */}
              <div className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4">
                <h2 className="text-base font-medium text-ink">
                  3. Phương thức thanh toán
                </h2>

                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('VIETQR')}
                    className={`p-3 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'VIETQR'
                        ? 'border-ink bg-bg text-ink font-medium'
                        : 'border-line text-muted font-normal'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-brand" />
                    <span>Chuyển khoản VietQR</span>
                    <span className="text-[11px] text-muted">Giữ kho 30 phút</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    className={`p-3 rounded-xl border text-center transition-colors cursor-pointer flex flex-col items-center gap-1.5 ${
                      paymentMethod === 'COD'
                        ? 'border-ink bg-bg text-ink font-medium'
                        : 'border-line text-muted font-normal'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-muted" />
                    <span>Thanh toán khi nhận (COD)</span>
                    <span className="text-[11px] text-muted">Giữ kho 12 giờ</span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-sale/10 border border-sale/20 text-sale text-[13px] rounded-xl flex items-center gap-2 font-normal">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
                </div>
              )}
            </div>

            {/* Cột phải: Tóm tắt đơn hàng cố định (5 cols on lg) */}
            <div className="lg:col-span-5 bg-surface border border-line rounded-2xl p-6 space-y-5 sticky top-24">
              <h2 className="text-lg font-medium text-ink pb-3 border-b border-line">
                Đơn hàng của bạn ({items.length} món)
              </h2>

              <div className="divide-y divide-line max-h-64 overflow-y-auto pr-1 space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-lg bg-[#EFECE6] dark:bg-[#18201C] p-1.5 shrink-0 flex items-center justify-center relative overflow-hidden">
                      <SafeImage
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-contain mix-blend-multiply dark:mix-blend-normal p-1"
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-[13px]">
                      <div className="text-ink font-medium truncate">{item.name}</div>
                      <div className="text-muted text-[12px]">SL: {item.quantity} · {item.sku}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <PriceTag amount={item.price * item.quantity} size="sm" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-[14px] border-t border-line pt-4">
                <div className="flex justify-between text-muted font-normal">
                  <span>Tạm tính:</span>
                  <PriceTag amount={cartTotal} size="sm" />
                </div>
                <div className="flex justify-between text-muted font-normal">
                  <span>Vận chuyển:</span>
                  <span className="text-brand font-medium">Miễn phí</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-line items-baseline">
                  <span className="text-[16px] font-medium text-ink">Tổng thanh toán:</span>
                  <PriceTag amount={cartTotal} size="lg" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={submitting}
                isLoading={submitting}
                size="lg"
                className="w-full text-[15px]"
              >
                Xác nhận đặt hàng
              </Button>

              <div className="text-[12px] text-muted text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-brand" />
                <span>Giữ hàng tự động · Cam kết chính xác theo tồn kho</span>
              </div>
            </div>
          </div>
        </form>
      </Container>
    </div>
  );
}
