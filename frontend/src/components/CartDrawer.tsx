'use client';

import * as React from 'react';
import Link from 'next/link';
import { X, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { PriceTag } from './ui/PriceTag';

export interface CartItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  imageUrl: string;
  isSecondhand?: boolean;
}

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items?: CartItem[];
  onRemoveItem?: (id: string) => void;
}

export function CartDrawer({
  open,
  onOpenChange,
  items = [],
  onRemoveItem,
}: CartDrawerProps) {
  if (!open) return null;

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={() => onOpenChange(false)} />

      <div className="relative w-full max-w-md h-full bg-surface border-l border-line flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-ink" />
            <h2 className="text-lg font-medium text-ink">Giỏ hàng của bạn</h2>
            <span className="text-[13px] text-muted font-normal">({items.length} món)</span>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-full hover:bg-bg text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-bg flex items-center justify-center text-muted">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="text-[16px] font-medium text-ink">Giỏ hàng đang trống</div>
              <p className="text-[14px] text-muted max-w-xs">
                Hãy khám phá các mẫu vợt chính hãng hoặc sàn vợt cũ kiểm định để chọn cây vợt ưng ý.
              </p>
              <div className="pt-2">
                <Link
                  href="/vot-cau-long"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex items-center justify-center h-10 px-5 text-[14px] font-medium rounded-full bg-ink text-bg hover:opacity-90 transition-opacity"
                >
                  Xem danh mục vợt
                </Link>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-3 rounded-xl border border-line bg-bg/50 relative group"
              >
                <div className="w-16 h-16 rounded-lg bg-white p-2 border border-line shrink-0 flex items-center justify-center">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-[14px] font-medium text-ink truncate">{item.name}</h4>
                  <div className="text-[13px] text-muted">{item.sku}</div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[13px] text-muted font-normal">Số lượng: {item.quantity}</span>
                    <PriceTag amount={item.price * item.quantity} size="sm" />
                  </div>
                </div>
                {onRemoveItem && (
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="p-1 text-muted hover:text-sale transition-colors self-start"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer / Checkout CTA */}
        {items.length > 0 && (
          <div className="p-5 border-t border-line bg-surface space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-[14px] text-muted font-normal">Tổng tạm tính:</span>
              <PriceTag amount={totalAmount} size="lg" />
            </div>
            <p className="text-[13px] text-muted font-normal">
              Đã bao gồm VAT. Miễn phí giao hàng hoặc nhận tại 3 chi nhánh toàn quốc.
            </p>
            <Link
              href="/vot-cau-long"
              onClick={() => onOpenChange(false)}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-full bg-ink text-bg font-medium text-[15px] hover:opacity-90 transition-opacity"
            >
              <span>Tiến hành đặt hàng</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
