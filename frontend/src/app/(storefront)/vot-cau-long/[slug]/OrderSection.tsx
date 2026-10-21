'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useCompare } from '@/lib/compare-context';
import { useCart } from '@/lib/cart-context';
import { PriceTag } from '@/components/ui/PriceTag';
import { Button } from '@/components/ui/Button';
import { QrCode, CheckCircle2, Clock, AlertCircle, X, Scale, Phone, ShoppingBag, Truck, RefreshCw, ShieldCheck, Gift } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';

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
    playerType: string;
    balancePoint?: number;
    stiffness?: string;
  };
  skus: SKU[];
  branches: Branch[];
  stockLevels: StockLevel[];
}

export default function OrderSection({ product, skus, branches, stockLevels }: OrderSectionProps) {
  const { addToCompare, isInCompare } = useCompare();
  const { addItem, setIsCartOpen } = useCart();

  // Tìm chi nhánh tối ưu có tồn kho available > 0 cho một SKU
  const getBestBranchForSku = (skuId: string) => {
    let bestId = branches[0]?.id || '';
    let maxAvail = -1;
    for (const b of branches) {
      const sl = stockLevels.find((s) => s.sku === skuId && s.branch_id === b.id);
      const avail = sl ? Math.max(0, sl.available) : 0;
      if (avail > maxAvail) {
        maxAvail = avail;
        bestId = b.id;
      }
    }
    return bestId;
  };

  // Tìm SKU đầu tiên còn hàng trong toàn hệ thống (ưu tiên biến thể còn hàng như 4UG5)
  const defaultSkuId = useMemo(() => {
    const inStockSku = skus.find((sku) => {
      const totalAvail = stockLevels
        .filter((sl) => sl.sku === sku.id)
        .reduce((sum, sl) => sum + Math.max(0, sl.available), 0);
      return totalAvail > 0;
    });
    return inStockSku?.id || skus[0]?.id || '';
  }, [skus, stockLevels]);

  const initialBranchId = getBestBranchForSku(defaultSkuId);

  const [selectedSkuId, setSelectedSkuId] = useState<string>(defaultSkuId);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(initialBranchId);

  useEffect(() => {
    setSelectedSkuId(defaultSkuId);
    setSelectedBranchId(getBestBranchForSku(defaultSkuId));
  }, [defaultSkuId]);
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'STORE_PICKUP'>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR' | 'COD'>('VIETQR');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [selectedTension, setSelectedTension] = useState('10.5');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [orderResult, setOrderResult] = useState<any>(null);

  const selectedSku = useMemo(() => {
    return skus.find((s) => s.id === selectedSkuId) || skus[0];
  }, [skus, selectedSkuId]);

  // Kiểm tra tồn kho của SKU đang chọn tại chi nhánh đang chọn
  const currentBranchStock = useMemo(() => {
    return stockLevels.find(
      (sl) => sl.sku === selectedSkuId && sl.branch_id === selectedBranchId
    );
  }, [stockLevels, selectedSkuId, selectedBranchId]);

  const availableQty = currentBranchStock ? Math.max(0, currentBranchStock.available) : 0;

  // Tổng số lượng có sẵn trên toàn bộ chi nhánh cho SKU này
  const totalAvailableAcrossBranches = useMemo(() => {
    return stockLevels
      .filter((sl) => sl.sku === selectedSkuId)
      .reduce((sum, sl) => sum + Math.max(0, sl.available), 0);
  }, [stockLevels, selectedSkuId]);

  // Khi người dùng đổi SKU, nếu chi nhánh hiện tại hết hàng, tự động chuyển sang chi nhánh còn hàng
  const handleSelectSku = (skuId: string) => {
    setSelectedSkuId(skuId);
    const currStock = stockLevels.find(
      (sl) => sl.sku === skuId && sl.branch_id === selectedBranchId
    );
    const currAvail = currStock ? Math.max(0, currStock.available) : 0;
    if (currAvail === 0) {
      const betterBranchId = getBestBranchForSku(skuId);
      if (betterBranchId) {
        setSelectedBranchId(betterBranchId);
      }
    }
  };

  const handleOpenOrder = () => {
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMsg('Vui lòng nhập họ tên và số điện thoại nhận hàng.');
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
        throw new Error(data.error || 'Đặt hàng không thành công');
      }

      setOrderResult(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const compared = isInCompare(product.slug);

  return (
    <div className="space-y-6">
      {/* 1. Chọn loại phiên bản (Trọng lượng & Chu vi cán) */}
      <div>
        <div className="text-[13px] text-muted font-normal mb-2">
          Chọn loại
        </div>
        <div className="flex flex-wrap gap-2">
          {skus.map((sku) => {
            const isSelected = sku.id === selectedSkuId;
            return (
              <button
                key={sku.id}
                type="button"
                onClick={() => handleSelectSku(sku.id)}
                className={`px-4 py-2.5 min-h-[44px] rounded-full text-[13px] transition-all cursor-pointer select-none flex items-center gap-2 touch-target ${
                  isSelected
                    ? 'bg-ink text-bg font-medium shadow-xs'
                    : 'bg-surface text-ink border border-line hover:border-ink/50 font-normal'
                }`}
              >
                <span>{sku.weight} · {sku.grip_size}</span>
                {sku.price !== skus[0]?.price && (
                  <span className="text-[13px] opacity-80">
                    (+{new Intl.NumberFormat('vi-VN').format(sku.price - skus[0].price)} ₫)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 1.1. HỘP QUÀ TẶNG KÈM ĐỘC QUYỀN (HỌC HỎI TỪ SHOPVNB ẢNH 3)           */}
      {/* =================================================================== */}
      <div className="rounded-2xl border-2 border-dashed border-amber-400/80 bg-amber-500/10 p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-[13px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-tight">
              COMBO QUÀ TẶNG KÈM TRỊ GIÁ 250.000₫
            </span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase shadow-2xs">
            Miễn phí
          </span>
        </div>

        <div className="space-y-2 text-[12px] text-ink/90">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>01 Cước Yonex BG65 / BG66 Ultimax</strong> (Miễn phí công đan máy điện tử chuẩn lbs)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>01 Quấn cán vợt cao cấp Yonex AC102EX</strong> thấm hút mồ hôi</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>01 Bao đựng vợt đơn chống sốc</strong> chuyên dụng</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Thẻ bảo hành điện tử chính hãng 12 tháng</strong> tra cứu theo SĐT</span>
          </div>
        </div>

        {/* Lựa chọn độ căng cước theo yêu cầu */}
        <div className="pt-2.5 border-t border-amber-400/40 space-y-1.5">
          <div className="text-[12px] font-semibold text-ink flex items-center justify-between">
            <span>Yêu cầu đan cước sẵn:</span>
            <span className="text-[11px] text-muted font-normal">Kỹ thuật viên đan 4 nút chuẩn BWF</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[12px]">
            {[
              { val: '10.5', label: '10.5 kg (Mức chuẩn)' },
              { val: '11.0', label: '11.0 kg (Công thủ)' },
              { val: '11.5', label: '11.5 kg (Tay khỏe)' },
              { val: 'NONE', label: 'Không đan cước' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setSelectedTension(opt.val)}
                className={`py-2 px-2 min-h-[44px] rounded-xl text-center border text-[11px] font-medium transition-all cursor-pointer flex items-center justify-center touch-target ${
                  selectedTension === opt.val
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow-2xs'
                    : 'bg-surface border-line text-muted hover:border-ink/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Nhận tại cửa hàng & Tồn kho thực tế (Tự động chọn chi nhánh còn hàng) */}
      <div>
        <div className="text-[13px] text-muted font-normal mb-2 flex items-center justify-between">
          <span>Nhận tại cửa hàng</span>
          <span className="text-[13px] text-muted">
            {totalAvailableAcrossBranches > 0
              ? `Còn ${totalAvailableAcrossBranches} cây toàn hệ thống`
              : 'Tạm hết hàng toàn hệ thống'}
          </span>
        </div>

        {totalAvailableAcrossBranches === 0 ? (
          <div className="p-4 rounded-xl border border-line bg-surface/60 text-[13px] flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted font-normal">
              <span className="w-2 h-2 rounded-full bg-sale/60" />
              <span>Tạm hết hàng tại tất cả {branches.length} chi nhánh</span>
            </div>
            <span className="text-[13px] text-muted font-normal shrink-0 ml-2">Hỗ trợ đặt trước</span>
          </div>
        ) : (
          <div className="space-y-2">
            {branches.map((b) => {
              const stock = stockLevels.find(
                (sl) => sl.sku === selectedSkuId && sl.branch_id === b.id
              );
              const avail = stock ? Math.max(0, stock.available) : 0;
              const isSelected = b.id === selectedBranchId;
              const isOutOfStock = avail === 0;

              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`p-3 rounded-xl border text-[13px] transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-ink bg-surface shadow-xs font-medium'
                      : isOutOfStock
                      ? 'border-line/60 bg-bg/40 opacity-60 hover:opacity-80'
                      : 'border-line bg-surface hover:border-ink/40'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="text-ink">
                      {b.name} <span className="text-muted font-normal">({b.city})</span>
                    </div>
                    <div className="text-[13px] text-muted font-normal">
                      {b.address}
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    {avail > 0 ? (
                      <span className="text-brand font-medium text-[13px] flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
                        Còn {avail} cây
                      </span>
                    ) : (
                      <span className="text-muted font-normal text-[13px]">
                        Hết hàng tại chi nhánh này
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. CÁC NÚT HÀNH ĐỘNG CHÍNH (DUAL CTA: MUA NGAY + THÊM VÀO GIỎ) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-3">
          {totalAvailableAcrossBranches === 0 ? (
            <a
              href="tel:19006868"
              className="flex-1 inline-flex items-center justify-center gap-2 h-13 px-6 rounded-full bg-brand text-white text-[14px] font-medium hover:bg-brand/90 transition-all cursor-pointer shadow-xs select-none"
            >
              <Phone className="w-4 h-4" />
              <span>Gọi hotline 1900 6868 tư vấn đặt trước</span>
            </a>
          ) : (
            <div className="flex-1 flex flex-col sm:flex-row gap-2.5">
              {/* Nút 1: MUA NGAY (Fast Checkout theo phong cách ShopVNB) */}
              <Button
                onClick={handleOpenOrder}
                disabled={availableQty === 0}
                className="flex-1 h-13 text-[14px] font-bold bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-98 transition-all"
                size="lg"
                aria-label={availableQty > 0 ? 'Mua ngay · Đặt hàng nhanh' : undefined}
                data-testid="add-to-cart-btn"
              >
                {availableQty > 0 ? (
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-[14px] font-bold uppercase tracking-wide">MUA NGAY</span>
                    <span className="text-[10px] font-normal opacity-90">Giao COD tận nơi hoặc nhận tại Showroom</span>
                  </div>
                ) : totalAvailableAcrossBranches > 0 ? (
                  'Chi nhánh này tạm hết'
                ) : (
                  'Tạm hết hàng toàn hệ thống'
                )}
              </Button>

              {/* Nút 2: THÊM VÀO GIỎ HÀNG */}
              {availableQty > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedSku) {
                      const tensionText = selectedTension !== 'NONE' ? ` · Căng ${selectedTension}kg` : '';
                      addItem({
                        id: selectedSku.id,
                        name: `${product.name} (${selectedSku.weight} - ${selectedSku.grip_size}${tensionText})`,
                        sku: selectedSku.id,
                        price: selectedSku.price,
                        imageUrl: product.imageUrl,
                        branchId: selectedBranchId,
                      });
                      setIsCartOpen(true);
                    }
                  }}
                  className="h-13 px-6 rounded-full border border-brand bg-brand/5 hover:bg-brand/10 text-brand text-[14px] font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs shrink-0"
                  title="Thêm vào giỏ hàng"
                >
                  <ShoppingBag className="w-4 h-4 text-brand" />
                  <span>Thêm vào giỏ</span>
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              addToCompare({
                id: product.slug,
                slug: product.slug,
                name: product.name,
                brand: product.brand,
                imageUrl: product.imageUrl,
                priceFrom: selectedSku?.price || 0,
                playerType: product.playerType,
                balancePoint: selectedSku?.balance_point_mm || product.balancePoint,
                stiffness: selectedSku?.stiffness || product.stiffness,
                weight: `${selectedSku?.weight} · ${selectedSku?.grip_size}`,
                maxTension: selectedSku ? `${selectedSku.max_tension_lbs} lbs` : '28 lbs',
              });
            }}
            className={`h-13 px-4 rounded-full border transition-all text-[13px] font-medium flex items-center gap-1.5 cursor-pointer shrink-0 ${
              compared
                ? 'bg-ink text-bg border-ink'
                : 'bg-surface text-ink border-line hover:border-ink/60'
            }`}
            title={compared ? 'Đang so sánh (Bấm để bỏ)' : 'Thêm vào so sánh'}
          >
            <Scale className="w-4 h-4" />
            <span className="hidden sm:inline">
              {compared ? 'Đã so sánh' : 'So sánh'}
            </span>
          </button>
        </div>

        {/* 4. DẢI CAM KẾT & BẢO HÀNH CHÍNH HÃNG (SHOPVNB DETAIL FOOTER) */}
        <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-muted">
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-bg border border-line">
            <Truck className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>Giao COD kiểm tra trước khi trả</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-bg border border-line">
            <ShieldCheck className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>100% Chính hãng · Bảo hành 12T</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-bg border border-line">
            <RefreshCw className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>Đổi mới trong 7 ngày nếu lỗi</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-xl bg-bg border border-line">
            <Gift className="w-3.5 h-3.5 text-brand shrink-0" />
            <span>Tặng cước BG65 & quấn cán sẵn</span>
          </div>
        </div>
      </div>

      {/* 4. Sticky Bottom Bar cho màn hình di động (Mobile Sticky Purchase Bar) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-surface/95 backdrop-blur-md border-t border-line p-3 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between gap-4 shadow-lg">
        <div>
          <span className="text-[13px] text-muted block">Tổng tiền</span>
          <PriceTag amount={selectedSku?.price || 0} size="md" />
        </div>

        {totalAvailableAcrossBranches === 0 ? (
          <a
            href="tel:19006868"
            className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-full bg-brand text-white text-[13px] font-medium hover:bg-brand/90 transition-all cursor-pointer shadow-xs select-none touch-target"
          >
            <Phone className="w-4 h-4" />
            <span>Gọi 1900 6868</span>
          </a>
        ) : (
          <Button
            onClick={handleOpenOrder}
            disabled={availableQty === 0}
            size="md"
            className="px-6 h-11 touch-target"
          >
            {availableQty > 0 ? 'Mua ngay' : 'Hết hàng'}
          </Button>
        )}
      </div>

      {/* 5. MODAL CHECKOUT & VIETQR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 border border-line">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setOrderResult(null);
              }}
              className="absolute top-4 right-4 w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-bg text-muted hover:text-ink transition-colors cursor-pointer touch-target"
              aria-label="Đóng cửa sổ đặt hàng"
            >
              <X className="w-5 h-5" />
            </button>

            {!orderResult ? (
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div>
                  <div className="text-[13px] text-muted font-normal">
                    Xác nhận thông tin
                  </div>
                  <h2 className="text-xl font-medium text-ink mt-1">
                    Xác nhận đặt mua vợt
                  </h2>
                  <p className="text-[13px] text-muted mt-0.5">
                    {product.name} ({selectedSku?.weight} · {selectedSku?.grip_size})
                  </p>
                </div>

                <div className="p-3 bg-bg rounded-xl text-[13px] space-y-1.5 border border-line">
                  <div className="flex justify-between">
                    <span className="text-muted">Chi nhánh xuất kho:</span>
                    <span className="text-ink font-medium">
                      {branches.find((b) => b.id === selectedBranchId)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Phiên bản:</span>
                    <span className="text-ink font-medium">
                      {selectedSku?.weight} · {selectedSku?.grip_size}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-line items-baseline">
                    <span className="text-ink font-medium">Tổng thanh toán:</span>
                    <PriceTag amount={selectedSku?.price || 0} size="md" />
                  </div>
                </div>

                <div className="space-y-3 text-[13px]">
                  <div>
                    <label className="block text-ink font-medium mb-1">Họ và tên người nhận:</label>
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

                  {/* Hình thức nhận hàng */}
                  <div>
                    <label className="block text-ink font-medium mb-1">Hình thức nhận hàng:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFulfillmentType('DELIVERY')}
                        className={`p-2.5 min-h-[44px] flex items-center justify-center rounded-xl border text-center transition-colors cursor-pointer text-[13px] touch-target ${
                          fulfillmentType === 'DELIVERY'
                            ? 'border-ink bg-bg text-ink font-medium'
                            : 'border-line text-muted font-normal'
                        }`}
                      >
                        Giao hàng tận nơi
                      </button>
                      <button
                        type="button"
                        onClick={() => setFulfillmentType('STORE_PICKUP')}
                        className={`p-2.5 min-h-[44px] flex items-center justify-center rounded-xl border text-center transition-colors cursor-pointer text-[13px] touch-target ${
                          fulfillmentType === 'STORE_PICKUP'
                            ? 'border-ink bg-bg text-ink font-medium'
                            : 'border-line text-muted font-normal'
                        }`}
                      >
                        Nhận tại cửa hàng
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
                        <QrCode className="w-4 h-4" /> Chuyển khoản VietQR
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
                        Thanh toán khi nhận (COD)
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
                  Xác nhận đặt hàng
                </Button>
              </form>
            ) : (
              /* MÀN HÌNH ĐẶT HÀNG THÀNH CÔNG VÀ VIETQR */
              <div className="space-y-5 text-center">
                <div className="w-12 h-12 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>

                <div>
                  <h3 className="text-xl font-medium text-ink">
                    Đặt hàng và giữ kho thành công
                  </h3>
                  <p className="text-[13px] text-muted mt-1">
                    Mã đơn hàng: <span className="text-ink font-medium">{orderResult.orderId}</span>
                  </p>
                </div>

                {orderResult.pickupCode && (
                  <div className="bg-bg border border-line p-3.5 rounded-xl text-left">
                    <div className="text-[13px] text-muted">
                      Mã nhận hàng tại quầy:
                    </div>
                    <div className="text-2xl font-medium text-ink mt-0.5 font-mono">
                      {orderResult.pickupCode}
                    </div>
                    <div className="text-[13px] text-muted mt-1">
                      Xuất trình mã này cho nhân viên chi nhánh khi nhận vợt.
                    </div>
                  </div>
                )}

                {orderResult.vietqr && (
                  <div className="bg-bg border border-line p-4 rounded-xl text-left space-y-3">
                    <div className="text-center font-medium text-[13px] text-ink flex items-center justify-center gap-1.5">
                      <QrCode className="w-4 h-4 text-brand" /> Quét mã VietQR NAPAS để thanh toán
                    </div>

                    <div className="flex justify-center">
                      <SafeImage
                        src={orderResult.vietqr.qrUrl}
                        alt="VietQR Payment"
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

                    <div className="p-2.5 bg-surface border border-line text-muted rounded-lg text-[13px] flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0 text-muted" />
                      <span>Hàng được giữ kho trong <span className="font-medium text-ink">30 phút</span>. Vui lòng hoàn tất thanh toán trước khi hết hạn.</span>
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
    </div>
  );
}
