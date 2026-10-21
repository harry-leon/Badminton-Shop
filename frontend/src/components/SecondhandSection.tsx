'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Clock, 
  RotateCcw, 
  Store, 
  ChevronDown, 
  Check, 
  Search, 
  ArrowRight
} from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { useCart } from '@/lib/cart-context';

export interface SecondhandCardItem {
  id: string;
  name: string;
  slug?: string;
  brand: string;
  condition: string; // e.g. "9/10" or "8/10"
  warranty: string;  // e.g. "1 tháng"
  weight: string;    // "3U" | "4U"
  grip: string;      // "G5"
  balance: string;   // "Head Heavy" | "Even Balance" | "Head Light"
  resalePrice: number;
  originalPrice: number;
  imageUrl: string;
}

const DEFAULT_ITEMS: SecondhandCardItem[] = [
  {
    id: 'sh-1',
    name: 'Yonex Astrox 88D Pro (Cũ)',
    brand: 'Yonex',
    condition: '8/10',
    warranty: '1 tháng',
    weight: '4U',
    grip: 'G5',
    balance: 'Head Heavy',
    resalePrice: 2650000,
    originalPrice: 3600000,
    imageUrl: '/images/products/yonex-astrox-88d-pro.png',
  },
  {
    id: 'sh-2',
    name: 'Victor Thruster K 9000 (Cũ)',
    brand: 'Victor',
    condition: '9/10',
    warranty: '1 tháng',
    weight: '4U',
    grip: 'G5',
    balance: 'Head Heavy',
    resalePrice: 2850000,
    originalPrice: 3800000,
    imageUrl: '/images/secondhand/sh-ryuga-ii.webp',
  },
  {
    id: 'sh-3',
    name: 'Li-Ning Turbo Charging 75C (Cũ)',
    brand: 'Li-Ning',
    condition: '8/10',
    warranty: '1 tháng',
    weight: '4U',
    grip: 'G5',
    balance: 'Even Balance',
    resalePrice: 2350000,
    originalPrice: 3200000,
    imageUrl: '/images/secondhand/sh-axforce-80.jpg',
  },
  {
    id: 'sh-4',
    name: 'Yonex Nanoflare 800 (Cũ)',
    brand: 'Yonex',
    condition: '9/10',
    warranty: '1 tháng',
    weight: '4U',
    grip: 'G5',
    balance: 'Head Light',
    resalePrice: 2450000,
    originalPrice: 3300000,
    imageUrl: '/images/products/yonex-nanoflare-800-pro.png',
  },
  {
    id: 'sh-5',
    name: 'Mizuno Fortius 10 (Cũ)',
    brand: 'Mizuno',
    condition: '9/10',
    warranty: '1 tháng',
    weight: '4U',
    grip: 'G5',
    balance: 'Even Balance',
    resalePrice: 2200000,
    originalPrice: 3000000,
    imageUrl: '/images/secondhand/sh-fortius-11-quick.png',
  },
  {
    id: 'sh-6',
    name: 'Apacs Z Ziggler (Cũ)',
    brand: 'Apacs',
    condition: '9/10',
    warranty: '1 tháng',
    weight: '4U',
    grip: 'G5',
    balance: 'Head Heavy',
    resalePrice: 1850000,
    originalPrice: 2500000,
    imageUrl: '/images/secondhand/sh-arcsaber-11-pro.png',
  },
  {
    id: 'sh-7',
    name: 'Kawasaki Power 9900 (Cũ)',
    brand: 'Kawasaki',
    condition: '9/10',
    warranty: '1 tháng',
    weight: '4U',
    grip: 'G5',
    balance: 'Even Balance',
    resalePrice: 1750000,
    originalPrice: 2300000,
    imageUrl: '/images/secondhand/sh-astrox-100zz.png',
  },
  {
    id: 'sh-8',
    name: 'Yonex Voltric Z-Force II (Cũ)',
    brand: 'Yonex',
    condition: '9/10',
    warranty: '1 tháng',
    weight: '3U',
    grip: 'G5',
    balance: 'Head Heavy',
    resalePrice: 3250000,
    originalPrice: 4200000,
    imageUrl: '/images/products/yonex-astrox-99-pro.jpg',
  },
];

const BRAND_TABS = [
  'Tất cả',
  'Yonex',
  'Victor',
  'Li-Ning',
  'Mizuno',
  'Apacs',
  'Kawasaki',
];

const SORT_OPTIONS = [
  { id: 'newest', label: 'Mới nhất' },
  { id: 'price-asc', label: 'Giá tăng dần' },
  { id: 'price-desc', label: 'Giá giảm dần' },
];

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

export function SecondhandSection({ initialItems }: { initialItems?: SecondhandCardItem[] }) {
  const { addItem, setIsCartOpen } = useCart();
  const [selectedBrand, setSelectedBrand] = useState('Tất cả');
  const [sortOption, setSortOption] = useState('newest');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const allItems = initialItems && initialItems.length > 0 ? initialItems : DEFAULT_ITEMS;

  const handleAddToCart = (item: SecondhandCardItem) => {
    addItem({
      id: item.id,
      name: item.name,
      sku: `SH-${item.id}`,
      price: item.resalePrice,
      imageUrl: item.imageUrl,
      isSecondhand: true,
    });
    setIsCartOpen(true);
  };

  // Lọc theo brand
  const filteredItems = allItems.filter((item) => {
    if (selectedBrand === 'Tất cả') return true;
    return item.brand.toLowerCase() === selectedBrand.toLowerCase();
  });

  // Sắp xếp
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortOption === 'price-asc') return a.resalePrice - b.resalePrice;
    if (sortOption === 'price-desc') return b.resalePrice - a.resalePrice;
    return 0; // newest / default
  });

  return (
    <section className="border-b border-[#EAE7DF] dark:border-line">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & 4 CAM KẾT — KHUNG NỀN BEIGE SÁNG (SHOP PHOTO EXACT) */}
      {/* ========================================================= */}
      <div className="bg-[#FAF8F3] dark:bg-[#121a16] py-14 border-b border-[#ECE8DE] dark:border-line/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header Title Centered */}
          <div className="text-center max-w-2xl mx-auto space-y-2.5">
            <div className="flex items-center justify-center gap-2.5">
              <span className="h-[1px] w-8 bg-[#1B4332]/30 dark:bg-emerald-500/30" />
              <span className="text-[12px] font-bold uppercase tracking-wider text-[#1B4332] dark:text-emerald-400">
                Vợt cũ có kiểm định
              </span>
              <span className="h-[1px] w-8 bg-[#1B4332]/30 dark:bg-emerald-500/30" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[#112F25] dark:text-emerald-300 uppercase">
              Chất Lượng Tại Quầy
            </h2>

            <p className="text-[13.5px] text-[#556960] dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
              Vợt cũ chính hãng, đã qua kiểm định kỹ thuật, đảm bảo chất lượng và hiệu suất sử dụng như mới.
            </p>
          </div>

          {/* 4 Cam Kết Thẳng Hàng: 1 Cột trên mobile, 2 cột trên sm, 4 trên lg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-0 lg:divide-x lg:divide-[#E2DDD2] dark:lg:divide-line/60">
            {/* Box 1 */}
            <div className="flex items-center gap-3.5 sm:gap-4 p-3 sm:p-0 bg-white/60 dark:bg-surface/60 sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-line/60 lg:px-6 first:pl-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#11382B] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#4EBA86]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[13px] sm:text-[14px] font-bold text-[#112F25] dark:text-zinc-100">Kiểm định 5 bước</h4>
                <p className="text-[11px] sm:text-[12px] text-[#556960] dark:text-zinc-400 leading-snug">
                  Kiểm tra khung, dây, cán, trọng lượng, độ cân bằng
                </p>
              </div>
            </div>

            {/* Box 2 */}
            <div className="flex items-center gap-3.5 sm:gap-4 p-3 sm:p-0 bg-white/60 dark:bg-surface/60 sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-line/60 lg:px-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#11382B] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-[#4EBA86]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[13px] sm:text-[14px] font-bold text-[#112F25] dark:text-zinc-100">Bảo hành 1-3 tháng</h4>
                <p className="text-[11px] sm:text-[12px] text-[#556960] dark:text-zinc-400 leading-snug">
                  Yên tâm sử dụng với chính sách rõ ràng
                </p>
              </div>
            </div>

            {/* Box 3 */}
            <div className="flex items-center gap-3.5 sm:gap-4 p-3 sm:p-0 bg-white/60 dark:bg-surface/60 sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-line/60 lg:px-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#11382B] text-white flex items-center justify-center shrink-0 shadow-xs">
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-[#4EBA86]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[13px] sm:text-[14px] font-bold text-[#112F25] dark:text-zinc-100">Đổi trả linh hoạt</h4>
                <p className="text-[11px] sm:text-[12px] text-[#556960] dark:text-zinc-400 leading-snug">
                  7 ngày nếu có lỗi kỹ thuật
                </p>
              </div>
            </div>

            {/* Box 4 */}
            <div className="flex items-center gap-3.5 sm:gap-4 p-3 sm:p-0 bg-white/60 dark:bg-surface/60 sm:bg-transparent rounded-xl sm:rounded-none border sm:border-0 border-line/60 lg:px-6 last:pr-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#11382B] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-[#4EBA86]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[13px] sm:text-[14px] font-bold text-[#112F25] dark:text-zinc-100">Trực tiếp tại cửa hàng</h4>
                <p className="text-[11px] sm:text-[12px] text-[#556960] dark:text-zinc-400 leading-snug">
                  Kiểm tra & thử vợt trước khi mua
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN CONTENT (FILTER + 8 CARDS + PROCESS + CTA BANNER) */}
      {/* ========================================================= */}
      <div className="bg-white dark:bg-[#0B100D] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-9">
          
          {/* Thanh Filter (Brand pills + Sắp xếp dropdown) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Brand Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
              {BRAND_TABS.map((brand) => {
                const active = selectedBrand === brand;
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#11382B] text-white shadow-xs font-semibold'
                        : 'bg-white dark:bg-surface border border-[#E6E3DA] dark:border-line text-[#556960] dark:text-muted hover:text-ink hover:border-[#11382B]'
                    }`}
                  >
                    {brand}
                  </button>
                );
              })}
            </div>

            {/* Sort Dropdown */}
            <div className="relative self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-surface border border-[#E6E3DA] dark:border-line text-[13px] text-[#556960] dark:text-muted hover:text-ink transition-colors cursor-pointer"
              >
                <span>Sắp xếp:</span>
                <span className="font-semibold text-[#112F25] dark:text-ink">
                  {SORT_OPTIONS.find((s) => s.id === sortOption)?.label}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#556960]" />
              </button>

              {sortDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-white dark:bg-surface border border-line rounded-2xl shadow-xl py-1.5 z-20 animate-in fade-in">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortOption(opt.id);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-[12.5px] hover:bg-bg transition-colors flex items-center justify-between cursor-pointer ${
                        sortOption === opt.id ? 'text-[#11382B] dark:text-brand font-bold' : 'text-ink'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortOption === opt.id && <Check className="w-3.5 h-3.5 text-[#11382B] dark:text-brand" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* LƯỚI 8 SẢN PHẨM: 2 CỘT TRÊN MOBILE, 2 TRÊN SM, 4 TRÊN LG */}
          {/* ========================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
            {sortedItems.map((item) => {
              return (
                <div
                  key={item.id}
                  className="group relative rounded-2xl bg-white dark:bg-surface border border-[#EBE8E1] dark:border-line/70 hover:border-[#11382B]/40 hover:shadow-lg transition-all duration-200 flex flex-col justify-between p-2.5 sm:p-4"
                >
                  {/* Top card row: Tag "Đã kiểm định" */}
                  <div className="flex items-center justify-between z-10">
                    <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-bold bg-[#E6F4EA] text-[#1E7E34] dark:bg-emerald-950/80 dark:text-emerald-400">
                      Đã kiểm định
                    </span>
                  </div>

                  {/* Product Image — Nền trắng sạch sẽ, căn giữa hoàn hảo */}
                  <div className="relative w-full aspect-square my-2 sm:my-3 overflow-hidden flex items-center justify-center p-1.5 sm:p-3">
                    <SafeImage
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  {/* Product Info */}
                  <div className="space-y-1.5 sm:space-y-2 pt-1">
                    {/* Tên sản phẩm */}
                    <h3 className="font-bold text-[12px] sm:text-[14px] text-[#112F25] dark:text-ink leading-snug line-clamp-2 h-[2rem] sm:h-[2.5rem] group-hover:text-brand transition-colors">
                      {item.name}
                    </h3>

                    {/* Tình trạng & Bảo hành */}
                    <div className="text-[11px] sm:text-[12px] text-[#6B7280] dark:text-muted flex items-center gap-1 font-normal flex-wrap">
                      <span>Độ mới: <strong className="font-medium text-[#374151] dark:text-zinc-200">{item.condition}</strong></span>
                      <span className="text-[#D1D5DB] hidden xs:inline">|</span>
                      <span>BH: <strong className="font-medium text-[#374151] dark:text-zinc-200">{item.warranty}</strong></span>
                    </div>

                    {/* Specs Badges (Bo tròn kiểu pill, viền mảnh nhẹ nhàng) */}
                    <div className="hidden xs:flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-medium border border-[#E5E7EB] dark:border-line bg-transparent text-[#6B7280] dark:text-zinc-300">
                        {item.weight}
                      </span>
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[11px] font-medium border border-[#E5E7EB] dark:border-line bg-transparent text-[#6B7280] dark:text-zinc-300">
                        {item.grip}
                      </span>
                    </div>

                    {/* Giá bán và giá gạch */}
                    <div className="pt-0.5 sm:pt-1 flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-[13px] sm:text-[16px] font-bold text-[#112F25] dark:text-ink">
                        {formatVND(item.resalePrice)}
                      </span>
                      {item.originalPrice > item.resalePrice && (
                        <span className="text-[10px] sm:text-[12px] text-[#9CA3AF] line-through">
                          {formatVND(item.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Nút Thêm vào giỏ bo tròn viền đậm (Rounded-full Exact Photo) */}
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className="w-full mt-1.5 sm:mt-2 flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-2 sm:px-4 rounded-full bg-[#11382B] hover:bg-[#184E3D] text-white text-[11px] sm:text-[13px] font-semibold transition-all cursor-pointer shadow-xs active:scale-[0.98] min-h-[36px] sm:min-h-[42px] touch-target"
                    >
                      {/* Icon xe đẩy giỏ hàng chuẩn theo ảnh */}
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="8" cy="21" r="1" />
                        <circle cx="19" cy="21" r="1" />
                        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                      </svg>
                      <span className="hidden xs:inline">Thêm vào giỏ</span>
                      <span className="xs:hidden">Thêm giỏ</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================= */}
          {/* QUY TRÌNH KIỂM ĐỊNH 5 BƯỚC (5-Step Inspection Process) */}
          {/* ========================================================= */}
          <div className="p-6 sm:p-10 rounded-3xl bg-[#FAF8F3] dark:bg-[#121a16] border border-[#ECE8DE] dark:border-line/70">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column */}
              <div className="lg:col-span-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1B4332] dark:text-emerald-400">
                  — QUY TRÌNH KIỂM ĐỊNH
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#112F25] dark:text-zinc-100 uppercase tracking-tight">
                  5 BƯỚC KIỂM TRA CHẤT LƯỢNG
                </h3>
                <p className="text-[13px] text-[#556960] dark:text-zinc-400 leading-relaxed">
                  Mỗi cây vợt cũ đều được kiểm tra kỹ lưỡng bởi đội ngũ kỹ thuật trước khi đến tay khách hàng.
                </p>
                <div className="pt-2">
                  <Link
                    href="/second-hand"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#11382B] hover:bg-[#184E3D] text-white text-[13px] font-semibold transition-colors shadow-xs"
                  >
                    <span>Tìm hiểu chi tiết</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Right Column: 5 Process Steps */}
              <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-5 gap-4">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center space-y-2 relative">
                  <div className="relative">
                    <div className="w-13 h-13 rounded-full bg-white dark:bg-surface border border-[#E6E3DA] dark:border-line flex items-center justify-center text-[#11382B] dark:text-emerald-400 shadow-2xs">
                      <Search className="w-5 h-5 text-[#11382B] dark:text-emerald-400" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#11382B] text-white text-[10px] font-bold flex items-center justify-center">
                      1
                    </span>
                  </div>
                  <h5 className="text-[12.5px] font-bold text-[#112F25] dark:text-zinc-100 pt-1">Kiểm tra khung</h5>
                  <p className="text-[11px] text-[#556960] dark:text-zinc-400 leading-snug">
                    Phát hiện nứt, cong, biến dạng
                  </p>
                </div>

                {/* Step 2 */}
                <div className="flex flex-col items-center text-center space-y-2 relative">
                  <div className="relative">
                    <div className="w-13 h-13 rounded-full bg-white dark:bg-surface border border-[#E6E3DA] dark:border-line flex items-center justify-center text-[#11382B] dark:text-emerald-400 shadow-2xs">
                      <svg className="w-5 h-5 text-[#11382B] dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="8" y1="3" x2="8" y2="21" />
                        <line x1="16" y1="3" x2="16" y2="21" />
                        <line x1="3" y1="8" x2="21" y2="8" />
                        <line x1="3" y1="16" x2="21" y2="16" />
                      </svg>
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#11382B] text-white text-[10px] font-bold flex items-center justify-center">
                      2
                    </span>
                  </div>
                  <h5 className="text-[12.5px] font-bold text-[#112F25] dark:text-zinc-100 pt-1">Kiểm tra dây</h5>
                  <p className="text-[11px] text-[#556960] dark:text-zinc-400 leading-snug">
                    Độ căng, độ bền, khả năng đàn hồi
                  </p>
                </div>

                {/* Step 3 */}
                <div className="flex flex-col items-center text-center space-y-2 relative">
                  <div className="relative">
                    <div className="w-13 h-13 rounded-full bg-white dark:bg-surface border border-[#E6E3DA] dark:border-line flex items-center justify-center text-[#11382B] dark:text-emerald-400 shadow-2xs">
                      <svg className="w-5 h-5 text-[#11382B] dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="3" width="6" height="18" rx="2" />
                        <line x1="9" y1="8" x2="15" y2="8" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                      </svg>
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#11382B] text-white text-[10px] font-bold flex items-center justify-center">
                      3
                    </span>
                  </div>
                  <h5 className="text-[12.5px] font-bold text-[#112F25] dark:text-zinc-100 pt-1">Kiểm tra cán</h5>
                  <p className="text-[11px] text-[#556960] dark:text-zinc-400 leading-snug">
                    Độ bám, độ thẳng, không lỏng
                  </p>
                </div>

                {/* Step 4 */}
                <div className="flex flex-col items-center text-center space-y-2 relative">
                  <div className="relative">
                    <div className="w-13 h-13 rounded-full bg-white dark:bg-surface border border-[#E6E3DA] dark:border-line flex items-center justify-center text-[#11382B] dark:text-emerald-400 shadow-2xs">
                      <svg className="w-5 h-5 text-[#11382B] dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 3v3m0 0a4 4 0 100 8 4 4 0 000-8zm-7 8l-2 7h18l-2-7" />
                      </svg>
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#11382B] text-white text-[10px] font-bold flex items-center justify-center">
                      4
                    </span>
                  </div>
                  <h5 className="text-[12.5px] font-bold text-[#112F25] dark:text-zinc-100 pt-1">Kiểm tra thông số</h5>
                  <p className="text-[11px] text-[#556960] dark:text-zinc-400 leading-snug">
                    Trọng lượng, độ cân bằng
                  </p>
                </div>

                {/* Step 5 */}
                <div className="flex flex-col items-center text-center space-y-2 relative col-span-2 sm:col-span-1">
                  <div className="relative">
                    <div className="w-13 h-13 rounded-full bg-white dark:bg-surface border border-[#E6E3DA] dark:border-line flex items-center justify-center text-[#11382B] dark:text-emerald-400 shadow-2xs">
                      <ShieldCheck className="w-5 h-5 text-[#11382B] dark:text-emerald-400" />
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#11382B] text-white text-[10px] font-bold flex items-center justify-center">
                      5
                    </span>
                  </div>
                  <h5 className="text-[12.5px] font-bold text-[#112F25] dark:text-zinc-100 pt-1">Đánh giá tổng thể</h5>
                  <p className="text-[11px] text-[#556960] dark:text-zinc-400 leading-snug">
                    Phân loại tình trạng và dán tem kiểm định
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* BANNER PROMO DƯỚI CÙNG (Xanh rêu đậm, nút trắng bo tròn) */}
          {/* ========================================================= */}
          <div className="relative overflow-hidden rounded-3xl bg-[#11382B] p-6 sm:p-9 text-white shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-7 h-7 text-[#4EBA86]" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#4EBA86]">
                    VỢT CŨ CHẤT LƯỢNG — LỰA CHỌN THÔNG MINH
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                    TIẾT KIỆM CHI PHÍ — VẪN ĐẢM BẢO HIỆU SUẤT
                  </h4>
                  <p className="text-[13px] text-emerald-100/80">
                    Vợt cũ đã qua kiểm định, chất lượng như mới, giá tốt hơn.
                  </p>
                </div>
              </div>

              <Link
                href="/second-hand"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[#11382B] hover:bg-emerald-50 text-[13px] font-bold transition-all shadow-md shrink-0 self-stretch sm:self-auto justify-center"
              >
                <svg className="w-4 h-4 text-[#11382B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
                <span>Khám phá ngay</span>
                <ArrowRight className="w-4 h-4 text-[#11382B]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
