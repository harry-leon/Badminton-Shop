'use client';

import * as React from 'react';
import { SafeImage } from './ui/SafeImage';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useCompare } from '@/lib/compare-context';
import { X, ArrowRight, Scale } from 'lucide-react';
import { PriceTag } from './ui/PriceTag';

export function FloatingCompareBar() {
  const { items, removeFromCompare, clearCompare } = useCompare();
  const pathname = usePathname();

  if (items.length === 0 || pathname === '/so-sanh') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-surface border border-line rounded-2xl shadow-xl p-3 sm:p-4 backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          {/* Danh sách các cây vợt đang chọn */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 overflow-x-auto py-1">
            <div className="hidden sm:flex items-center gap-1.5 text-muted text-[13px] font-normal shrink-0 pr-1">
              <Scale className="w-4 h-4 text-brand" />
              <span>So sánh ({items.length}/3)</span>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className="relative flex items-center gap-2 bg-bg border border-line rounded-xl p-1.5 pr-2.5 shrink-0 group"
              >
                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-white shrink-0">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-contain mix-blend-multiply p-0.5"
                  />
                </div>
                <div className="text-left hidden xs:block">
                  <div className="text-[12px] font-medium text-ink line-clamp-1 max-w-[90px] sm:max-w-[120px]">
                    {item.name}
                  </div>
                  <div className="text-[11px] text-muted">
                    <PriceTag amount={item.priceFrom} size="sm" />
                  </div>
                </div>
                <button
                  onClick={() => removeFromCompare(item.id)}
                  className="text-muted hover:text-ink p-0.5 rounded-full hover:bg-surface transition-colors"
                  title="Bỏ so sánh"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Các nút hành động */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={clearCompare}
              className="hidden sm:inline-flex text-[13px] text-muted hover:text-ink px-2 py-1 transition-colors"
            >
              Xóa tất cả
            </button>

            <Link
              href="/so-sanh"
              className="inline-flex items-center gap-1.5 bg-ink text-bg text-[13px] font-medium px-4 py-2 rounded-full hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <span>Đối chiếu</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
