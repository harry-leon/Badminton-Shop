'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';

import { Flame, ShoppingBag } from 'lucide-react';

export interface TabProductTag {
  code: string;
  name: string;
  bg_color?: string;
  text_color?: string;
}

export interface TabProduct {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category: string; // 'cat_racket', 'cat_shoes', 'ao-cau-long', 'vay-cau-long', 'quan-cau-long'
  priceFrom: number;
  originalPrice?: number;
  imageUrl: string;
  tags?: (string | TabProductTag)[];
}

interface HomeProductTabsProps {
  products: TabProduct[];
  badgeText?: string;
  initialTab?: string;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'cat_racket', label: 'Vợt Cầu Lông' },
  { id: 'cat_shoes', label: 'Giày Cầu Lông' },
  { id: 'ao', label: 'Áo Cầu Lông' },
  { id: 'quan', label: 'Quần Cầu Lông' },
  { id: 'cat_string', label: 'Dây Cước' },
  { id: 'cat_accessory', label: 'Phụ Kiện' },
];

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

export function HomeProductTabs({ products, initialTab = 'all', badgeText }: HomeProductTabsProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const filtered = products.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'cat_racket') return p.category === 'cat_racket';
    if (activeTab === 'cat_shoes') return p.category === 'cat_shoes';
    if (activeTab === 'cat_string') return p.category === 'cat_string';
    if (activeTab === 'cat_accessory') return p.category === 'cat_accessory' || p.category === 'cat_grip' || p.category === 'cat_bag';
    if (activeTab === 'ao') {
      const n = p.name.toLowerCase();
      return p.category === 'cat_apparel' && (n.includes('áo') || n.includes('shirt') || n.includes('jersey') || n.includes('polo') || n.includes('jacket'));
    }
    if (activeTab === 'quan') {
      const n = p.name.toLowerCase();
      return p.category === 'cat_apparel' && (n.includes('quần') || n.includes('short') || n.includes('pant'));
    }
    return true;
  });

  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 5;

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setCurrentPage(0);
  };

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const currentSafePage = Math.min(currentPage, totalPages - 1);
  const startIndex = currentSafePage * ITEMS_PER_PAGE;
  const displayList = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  return (
    <div className="space-y-0 relative">
      {/* 1. Header Tabs bar */}
      <div className="flex items-stretch border border-line bg-surface overflow-x-auto no-scrollbar shadow-2xs">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 min-w-[120px] py-3.5 px-3 text-[14px] sm:text-[15px] font-bold text-center transition-colors cursor-pointer select-none border-r last:border-r-0 border-line ${
                isActive
                  ? 'bg-brand text-white shadow-inner'
                  : 'bg-white text-ink hover:text-brand hover:bg-brand/5 dark:bg-surface dark:text-ink'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 2. Products Container with Brand Border + Navigation Buttons */}
      <div className="relative border-2 border-t-0 border-brand bg-surface p-4 sm:p-5 shadow-xs group/container">
        
        {/* Nút chuyển trang bên Trái (Previous) */}
        {totalPages > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-1 sm:-left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-surface border border-brand text-brand shadow-md flex items-center justify-center hover:bg-brand hover:text-white transition-all cursor-pointer select-none active:scale-95 touch-target-hit"
            aria-label="Trang sản phẩm trước"
            title="Xem sản phẩm trước"
          >
            <span className="text-lg font-bold leading-none -ml-0.5">‹</span>
          </button>
        )}

        {/* Nút chuyển trang bên Phải (Next) */}
        {totalPages > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-1 sm:-right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-surface border border-brand text-brand shadow-md flex items-center justify-center hover:bg-brand hover:text-white transition-all cursor-pointer select-none active:scale-95 touch-target-hit"
            aria-label="Trang sản phẩm tiếp theo"
            title="Xem thêm sản phẩm khác"
          >
            <span className="text-lg font-bold leading-none -mr-0.5">›</span>
          </button>
        )}

        {/* Grid 5 sản phẩm của trang hiện tại hoặc Trạng thái trống */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center min-h-[260px] bg-bg/50 rounded-xl border border-dashed border-line">
            <div className="w-14 h-14 rounded-full bg-surface-raised flex items-center justify-center text-muted mb-3 border border-line shadow-2xs">
              <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-ink font-semibold text-[15px] mb-1">
              Danh mục đang cập nhật sản phẩm mới
            </p>
            <p className="text-muted text-[13px] max-w-sm mb-4">
              Các mẫu sản phẩm thuộc nhóm này đang được nhập kho và kiểm định. Quý khách vui lòng chọn tab khác hoặc xem toàn bộ sản phẩm.
            </p>
            <button
              type="button"
              onClick={() => handleTabChange('all')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-white rounded-lg text-[13px] font-medium hover:bg-brand/90 transition-colors cursor-pointer shadow-xs active:scale-95"
            >
              Xem tất cả sản phẩm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 min-h-[260px]">
            {displayList.map((p) => {
              const hasDiscount = Boolean(p.originalPrice && p.originalPrice > p.priceFrom);
              return (
                <Link
                  key={p.id}
                  href={`/vot-cau-long/${p.slug}`}
                  className="group flex flex-col justify-between bg-white dark:bg-bg/40 border border-line hover:border-brand rounded-xl p-3 text-left transition-all hover:shadow-md hover:-translate-y-0.5"
                >
                  <div>
                    {/* Square Image Box */}
                    <div className="aspect-square w-full relative mb-2.5 rounded-lg overflow-hidden bg-[#F8F8F8] dark:bg-bg flex items-center justify-center p-2">
                      <SafeImage
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Tag badge góc trên trái */}
                      {p.tags && p.tags.length > 0 && (
                        <div className="absolute top-1.5 left-1.5 pointer-events-none flex flex-col gap-0.5 z-10">
                          {p.tags.slice(0, 1).map((t, idx) => {
                            const isObj = typeof t === 'object' && t !== null;
                            const name = isObj ? t.name : t;
                            const bg = isObj ? t.bg_color || '#DC2626' : (t === 'HOT' ? '#D97706' : t === 'NEW' ? '#0F5132' : '#DC2626');
                            const color = isObj ? t.text_color || '#FFFFFF' : '#FFFFFF';
                            return (
                              <span
                                key={idx}
                                style={{ backgroundColor: bg, color }}
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-xs uppercase tracking-wider inline-flex items-center gap-0.5"
                              >
                                {name === 'HOT' || name === 'Bán chạy / Hot' ? <Flame className="w-2.5 h-2.5 fill-current" /> : null}
                                <span>{name}</span>
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Product Title */}
                    <h4 className="text-[12px] sm:text-[13px] font-medium text-ink line-clamp-2 leading-snug group-hover:text-brand transition-colors">
                      {p.name}
                    </h4>
                  </div>

                  {/* Price block */}
                  <div className="mt-2.5 pt-2 border-t border-line/60 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-[13px] sm:text-[14px] font-bold text-sale">
                      {formatVND(p.priceFrom)}
                    </span>
                    {hasDiscount && p.originalPrice && (
                      <span className="text-[11px] text-muted line-through">
                        {formatVND(p.originalPrice)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination Indicator Dots */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 pt-3.5 select-none">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentPage(idx)}
                className={`transition-all rounded-full cursor-pointer ${
                  currentSafePage === idx
                    ? 'w-6 h-1.5 bg-brand'
                    : 'w-1.5 h-1.5 bg-line hover:bg-brand/60'
                }`}
                aria-label={`Trang ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
