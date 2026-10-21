'use client';

import * as React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { Container } from '@/components/ui/Container';
import { useCart } from '@/lib/cart-context';
import { PriceTag } from '@/components/ui/PriceTag';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Trash2, Plus, Minus, ArrowRight, ShieldCheck, ChevronRight, Gift } from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, cartTotal } = useCart();

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-6xl">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted mb-4 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">Giỏ hàng của bạn</span>
        </nav>

        {/* Tiêu đề trang */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-8 border-b border-line">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-ink tracking-tight">
              Giỏ hàng của bạn
            </h1>
            <p className="text-[14px] text-muted mt-1 font-normal">
              Kiểm tra các sản phẩm đã chọn và tiếp tục đến bước thanh toán hoặc chọn nhận hàng tại chi nhánh.
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[13px] text-muted hover:text-ink border border-line hover:border-ink rounded-full px-4 py-1.5 transition-colors self-start sm:self-auto cursor-pointer"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Nội dung giỏ hàng hoặc EmptyState */}
        {items.length === 0 ? (
          <EmptyState
            title="Giỏ hàng của bạn đang trống"
            description="Hãy tham khảo danh mục vợt cầu lông chính hãng mới hoặc sàn vợt cũ kiểm định để chọn cây vợt ưng ý."
            actionText="Xem danh mục vợt"
            actionHref="/vot-cau-long"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            {/* Cột trái: Danh sách sản phẩm (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="divide-y divide-line border border-line rounded-2xl bg-surface overflow-hidden">
                {items.map((item) => (
                  <div key={item.id} className="p-3.5 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-5 sm:items-center justify-between">
                    {/* Ảnh & thông tin sản phẩm */}
                    <div className="flex gap-3 sm:gap-4 items-center flex-1 min-w-0">
                      {/* Ảnh sản phẩm */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-xl bg-[#EFECE6] dark:bg-[#18201C] p-2 shrink-0 flex items-center justify-center relative overflow-hidden">
                        <SafeImage
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-contain mix-blend-multiply dark:mix-blend-normal p-2"
                        />
                      </div>

                      {/* Chi tiết */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-[12px] sm:text-[13px] text-muted truncate">
                          {item.isSecondhand ? 'Vợt cũ kiểm định' : 'Vợt chính hãng'} · {item.sku}
                        </div>
                        <h3 className="text-[14px] sm:text-[16px] font-medium text-ink line-clamp-2">
                          {item.name}
                        </h3>
                        <div className="pt-0.5">
                          <PriceTag amount={item.price} size="md" />
                        </div>
                      </div>
                    </div>

                    {/* Bộ tăng/giảm số lượng & nút xóa */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-line/60 sm:border-0 w-full sm:w-auto">
                      {!item.isSecondhand ? (
                        <div className="flex items-center border border-line rounded-full bg-bg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer touch-target touch-target-hit"
                            aria-label="Giảm số lượng"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-9 text-center text-[14px] font-medium text-ink select-none">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted hover:text-ink transition-colors cursor-pointer touch-target touch-target-hit"
                            aria-label="Tăng số lượng"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[13px] text-muted px-3 py-1 bg-bg border border-line rounded-full">
                          SL: 1
                        </span>
                      )}

                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] text-muted hover:text-sale transition-colors rounded-full hover:bg-bg cursor-pointer touch-target touch-target-hit inline-flex items-center justify-center"
                        title="Xóa sản phẩm"
                        aria-label="Xóa sản phẩm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[13px] text-amber-900 dark:text-amber-200 flex items-center gap-2 font-medium">
                <Gift className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Mỗi cây vợt trong đơn được tặng kèm 01 cước Yonex BG65 + Miễn phí đan máy điện tử + Quấn cán AC102EX.</span>
              </div>

              <div className="p-4 rounded-xl bg-bg border border-line text-[13px] text-muted flex items-center gap-2 font-normal">
                <ShieldCheck className="w-4 h-4 text-brand shrink-0" />
                <span>Bảo hành kết cấu khung vợt 12 tháng chính hãng (hoặc 30–60 ngày đối với vợt cũ kiểm định).</span>
              </div>
            </div>

            {/* Cột phải: Tóm tắt đơn hàng (5 cols on lg) */}
            <div className="lg:col-span-5 bg-surface border border-line rounded-2xl p-6 space-y-5 sticky top-24">
              <h2 className="text-lg font-medium text-ink pb-3 border-b border-line">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-3 text-[14px]">
                <div className="flex justify-between text-muted font-normal">
                  <span>Tạm tính ({items.length} món):</span>
                  <PriceTag amount={cartTotal} size="sm" />
                </div>
                <div className="flex justify-between text-muted font-normal">
                  <span>Phí giao hàng:</span>
                  <span className="text-brand font-medium">Miễn phí</span>
                </div>
                <div className="flex justify-between text-muted font-normal">
                  <span>Thuế VAT:</span>
                  <span className="text-muted">Đã bao gồm</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-line items-baseline">
                  <span className="text-[16px] font-medium text-ink">Tổng thanh toán:</span>
                  <PriceTag amount={cartTotal} size="lg" />
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-ink text-bg font-medium text-[15px] hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  <span>Tiến hành thanh toán</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="text-center">
                <Link
                  href="/vot-cau-long"
                  className="text-[13px] text-muted hover:text-ink transition-colors font-normal inline-flex items-center min-h-[44px] touch-target-hit"
                >
                  ← Tiếp tục xem thêm vợt
                </Link>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
