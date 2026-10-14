'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ProductCard } from '@/components/ui/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SlidersHorizontal, ArrowUpDown, X, Check } from 'lucide-react';
import { Drawer } from 'vaul';

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  rawBrand?: string;
  playerType: string;
  playStyle?: string;
  priceFrom: number;
  originalPrice?: number;
  imageUrl: string;
  secondImageUrl?: string;
  balancePoint?: number;
  balanceCategory?: string;
  stiffness?: string;
  weight?: string;
  maxTension?: string;
  inStockBranches: string[];
  rating?: number;
}

interface ProductCatalogGridProps {
  initialProducts: ProductItem[];
  initialSearchParams?: { [key: string]: string | string[] | undefined };
}

const BRANCHES = [
  { id: 'ALL', label: 'Tất cả chi nhánh' },
  { id: 'BR_HCM_01', label: 'Smash Court — Quận 1 (TP.HCM)' },
  { id: 'BR_HN_01', label: 'Smash Court — Cầu Giấy (Hà Nội)' },
  { id: 'BR_DN_01', label: 'Smash Court — Hải Châu (Đà Nẵng)' },
];

export default function ProductCatalogGrid({
  initialProducts,
  initialSearchParams,
}: ProductCatalogGridProps) {
  // 1. Initial State from URL searchParams
  const getInitialBrand = () => {
    const b = initialSearchParams?.brand;
    if (typeof b === 'string') return [b];
    if (Array.isArray(b)) return b;
    return [];
  };

  const getInitialMaxPrice = () => {
    const p = initialSearchParams?.maxPrice || initialSearchParams?.max_price;
    if (typeof p === 'string') return parseInt(p, 10);
    return null;
  };

  const getInitialMinPrice = () => {
    const p = initialSearchParams?.minPrice || initialSearchParams?.min_price;
    if (typeof p === 'string') return parseInt(p, 10);
    return null;
  };

  const [selectedBrands, setSelectedBrands] = useState<string[]>(getInitialBrand);
  const [selectedBalances, setSelectedBalances] = useState<string[]>([]);
  const [selectedStiffness, setSelectedStiffness] = useState<string[]>([]);
  const [selectedPlaystyles, setSelectedPlaystyles] = useState<string[]>([]);
  const [selectedWeights, setSelectedWeights] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [minPrice, setMinPrice] = useState<number | null>(getInitialMinPrice);
  const [maxPrice, setMaxPrice] = useState<number | null>(getInitialMaxPrice);
  const [sortBy, setSortBy] = useState<'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC'>('NAME_ASC');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sync state to URL without page reload
  const updateUrl = useCallback((brands: string[], minP: number | null, maxP: number | null) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (brands.length > 0) {
      params.set('brand', brands.join(','));
    }
    if (minP !== null && minP > 0) {
      params.set('minPrice', minP.toString());
    }
    if (maxP !== null && maxP > 0) {
      params.set('maxPrice', maxP.toString());
    }

    const query = params.toString();
    const newUrl = query ? `/vot-cau-long?${query}` : '/vot-cau-long';
    window.history.replaceState(null, '', newUrl);
  }, []);

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands((prev) => {
      const next = prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand];
      updateUrl(next, minPrice, maxPrice);
      return next;
    });
  };

  const handleMinPriceChange = (val: number | null) => {
    let nextMin = val;
    let nextMax = maxPrice;
    if (nextMin !== null && nextMax !== null && nextMin > nextMax) {
      // Auto-clamp min <= max
      nextMin = nextMax;
    }
    setMinPrice(nextMin);
    updateUrl(selectedBrands, nextMin, nextMax);
  };

  const handleMaxPriceChange = (val: number | null) => {
    let nextMax = val;
    let nextMin = minPrice;
    if (nextMax !== null && nextMin !== null && nextMax < nextMin) {
      // Auto-clamp max >= min
      nextMax = nextMin;
    }
    setMaxPrice(nextMax);
    updateUrl(selectedBrands, nextMin, nextMax);
  };

  const resetAllFilters = () => {
    setSelectedBrands([]);
    setSelectedBalances([]);
    setSelectedStiffness([]);
    setSelectedPlaystyles([]);
    setSelectedWeights([]);
    setSelectedBranch('ALL');
    setMinPrice(null);
    setMaxPrice(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/vot-cau-long');
    }
  };

  const hasActiveFilters =
    selectedBrands.length > 0 ||
    selectedBalances.length > 0 ||
    selectedStiffness.length > 0 ||
    selectedPlaystyles.length > 0 ||
    selectedWeights.length > 0 ||
    selectedBranch !== 'ALL' ||
    minPrice !== null ||
    maxPrice !== null;

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = initialProducts.filter((product) => {
      // 1. Brand filter
      if (selectedBrands.length > 0) {
        const matchesBrand = selectedBrands.some(
          (b) =>
            product.brand.toLowerCase() === b.toLowerCase() ||
            (product.rawBrand && product.rawBrand.toLowerCase() === b.toLowerCase())
        );
        if (!matchesBrand) return false;
      }

      // 2. Balance filter
      if (selectedBalances.length > 0) {
        const matchesBal = selectedBalances.some((bal) => {
          if (bal === 'HEAD_HEAVY') return product.balancePoint ? product.balancePoint >= 305 : true;
          if (bal === 'EVEN_BALANCE') return product.balancePoint ? product.balancePoint >= 295 && product.balancePoint < 305 : true;
          if (bal === 'HEAD_LIGHT') return product.balancePoint ? product.balancePoint < 295 : true;
          return true;
        });
        if (!matchesBal) return false;
      }

      // 3. Stiffness filter
      if (selectedStiffness.length > 0) {
        const matchesStiff = selectedStiffness.some((stiff) => {
          if (!product.stiffness) return false;
          return product.stiffness.toLowerCase().includes(stiff.toLowerCase());
        });
        if (!matchesStiff) return false;
      }

      // 4. Play style filter
      if (selectedPlaystyles.length > 0) {
        const matchesStyle = selectedPlaystyles.some((style) => {
          const pStyle = (product.playStyle || product.playerType || '').toLowerCase();
          return pStyle.includes(style.toLowerCase());
        });
        if (!matchesStyle) return false;
      }

      // 5. Weight filter
      if (selectedWeights.length > 0) {
        const matchesWeight = selectedWeights.some((w) => {
          return product.weight?.includes(w);
        });
        if (!matchesWeight) return false;
      }

      // 6. Branch filter
      if (selectedBranch !== 'ALL') {
        if (!product.inStockBranches || !product.inStockBranches.includes(selectedBranch)) {
          return false;
        }
      }

      // 7. Price filter
      if (minPrice !== null && product.priceFrom < minPrice) return false;
      if (maxPrice !== null && product.priceFrom > maxPrice) return false;

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.priceFrom - b.priceFrom;
      if (sortBy === 'PRICE_DESC') return b.priceFrom - a.priceFrom;
      return a.name.localeCompare(b.name, 'vi');
    });

    return result;
  }, [
    initialProducts,
    selectedBrands,
    selectedBalances,
    selectedStiffness,
    selectedPlaystyles,
    selectedWeights,
    selectedBranch,
    minPrice,
    maxPrice,
    sortBy,
  ]);

  // Compute live counts
  const facetCounts = useMemo(() => {
    return {
      brands: {
        Yonex: initialProducts.filter((p) => p.brand.toLowerCase() === 'yonex').length,
        'Li-Ning': initialProducts.filter((p) => p.brand.toLowerCase() === 'li-ning' || p.brand.toLowerCase() === 'lining').length,
        Victor: initialProducts.filter((p) => p.brand.toLowerCase() === 'victor').length,
      },
      balance: {
        HEAD_HEAVY: initialProducts.filter((p) => (p.balancePoint || 300) >= 305).length,
        EVEN_BALANCE: initialProducts.filter((p) => (p.balancePoint || 300) >= 295 && (p.balancePoint || 300) < 305).length,
        HEAD_LIGHT: initialProducts.filter((p) => (p.balancePoint || 300) < 295).length,
      },
      stiffness: {
        'Cứng': initialProducts.filter((p) => (p.stiffness || '').includes('cứng')).length,
        'Trung bình': initialProducts.filter((p) => (p.stiffness || '').includes('trung bình')).length,
        'Dẻo': initialProducts.filter((p) => (p.stiffness || '').includes('dẻo')).length,
      },
      playStyles: {
        'Tấn công': initialProducts.filter((p) => (p.playStyle || p.playerType || '').toLowerCase().includes('tấn công')).length,
        'Phòng thủ': initialProducts.filter((p) => (p.playStyle || p.playerType || '').toLowerCase().includes('phòng thủ') || (p.playStyle || p.playerType || '').toLowerCase().includes('phản tạt')).length,
        'Công thủ toàn diện': initialProducts.filter((p) => (p.playStyle || p.playerType || '').toLowerCase().includes('công thủ')).length,
      },
      weights: {
        '3U': initialProducts.filter((p) => p.weight?.includes('3U')).length,
        '4U': initialProducts.filter((p) => p.weight?.includes('4U')).length,
        '5U': initialProducts.filter((p) => p.weight?.includes('5U')).length,
      },
      branches: {
        BR_HCM_01: initialProducts.filter((p) => p.inStockBranches?.includes('BR_HCM_01')).length,
        BR_HN_01: initialProducts.filter((p) => p.inStockBranches?.includes('BR_HN_01')).length,
        BR_DN_01: initialProducts.filter((p) => p.inStockBranches?.includes('BR_DN_01')).length,
      },
    };
  }, [initialProducts]);

  // Facet Content Component for Sidebar & Mobile Drawer
  const renderFacetFilters = () => (
    <div className="space-y-6 text-[13px]">
      {/* 1. Hãng sản xuất (Brand checkboxes & buttons) */}
      <div className="border-b border-line pb-5">
        <h3 className="font-medium text-ink mb-3 text-[14px]">Hãng sản xuất</h3>
        <div className="space-y-2">
          {[
            { id: 'Yonex', label: 'Yonex', count: facetCounts.brands.Yonex },
            { id: 'Li-Ning', label: 'Li-Ning', count: facetCounts.brands['Li-Ning'] },
            { id: 'Victor', label: 'Victor', count: facetCounts.brands.Victor },
          ].map((b) => {
            const isChecked = selectedBrands.includes(b.id);
            return (
              <label
                key={b.id}
                className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-surface cursor-pointer select-none group"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    value={b.id}
                    checked={isChecked}
                    onChange={() => handleBrandToggle(b.id)}
                    className="w-4 h-4 rounded border-line text-ink focus:ring-0 focus:ring-offset-0 cursor-pointer accent-ink"
                  />
                  <span className={`text-[13px] ${isChecked ? 'font-medium text-ink' : 'text-muted group-hover:text-ink'}`}>
                    {b.label}
                  </span>
                </div>
                <span className="text-[12px] text-muted font-normal">({b.count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 2. Mức giá (Price presets + inputs) */}
      <div className="border-b border-line pb-5">
        <h3 className="font-medium text-ink mb-3 text-[14px]">Mức giá (₫)</h3>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {[
            { label: '< 2 triệu', min: null, max: 2000000 },
            { label: '2 - 3 triệu', min: 2000000, max: 3000000 },
            { label: '3 - 4 triệu', min: 3000000, max: 4000000 },
            { label: '> 4 triệu', min: 4000000, max: null },
          ].map((preset, idx) => {
            const isSelected = minPrice === preset.min && maxPrice === preset.max;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setMinPrice(null);
                    setMaxPrice(null);
                    updateUrl(selectedBrands, null, null);
                  } else {
                    setMinPrice(preset.min);
                    setMaxPrice(preset.max);
                    updateUrl(selectedBrands, preset.min, preset.max);
                  }
                }}
                className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-ink text-bg border-ink font-medium'
                    : 'bg-bg text-muted border-line hover:border-ink/50 hover:text-ink font-normal'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Min/Max Input */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[11px] text-muted block mb-1">Từ (₫)</label>
            <input
              type="number"
              placeholder="0"
              value={minPrice !== null ? minPrice : ''}
              onChange={(e) => handleMinPriceChange(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full bg-bg border border-line rounded-lg px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted block mb-1">Đến (₫)</label>
            <input
              type="number"
              placeholder="5.000.000"
              value={maxPrice !== null ? maxPrice : ''}
              onChange={(e) => handleMaxPriceChange(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full bg-bg border border-line rounded-lg px-2.5 py-1.5 text-[13px] text-ink focus:outline-none focus:border-ink"
            />
          </div>
        </div>
      </div>

      {/* 3. Điểm cân bằng (Balance) */}
      <div className="border-b border-line pb-5">
        <h3 className="font-medium text-ink mb-3 text-[14px]">Điểm cân bằng</h3>
        <div className="space-y-2">
          {[
            { id: 'HEAD_HEAVY', label: 'Nặng đầu (> 300 mm)', count: facetCounts.balance.HEAD_HEAVY },
            { id: 'EVEN_BALANCE', label: 'Cân bằng (295 - 300 mm)', count: facetCounts.balance.EVEN_BALANCE },
            { id: 'HEAD_LIGHT', label: 'Nhẹ đầu (< 295 mm)', count: facetCounts.balance.HEAD_LIGHT },
          ].map((bal) => {
            const isChecked = selectedBalances.includes(bal.id);
            return (
              <label
                key={bal.id}
                className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-surface cursor-pointer select-none group"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    value={bal.id}
                    checked={isChecked}
                    onChange={() => {
                      setSelectedBalances((prev) =>
                        prev.includes(bal.id) ? prev.filter((b) => b !== bal.id) : [...prev, bal.id]
                      );
                    }}
                    className="w-4 h-4 rounded border-line text-ink focus:ring-0 cursor-pointer accent-ink"
                  />
                  <span className={`text-[13px] ${isChecked ? 'font-medium text-ink' : 'text-muted group-hover:text-ink'}`}>
                    {bal.label}
                  </span>
                </div>
                <span className="text-[12px] text-muted font-normal">({bal.count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Trọng lượng (Weight Class) */}
      <div className="border-b border-line pb-5">
        <h3 className="font-medium text-ink mb-3 text-[14px]">Trọng lượng</h3>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: '3U', label: '3U (85-89g)', count: facetCounts.weights['3U'] },
            { id: '4U', label: '4U (80-84g)', count: facetCounts.weights['4U'] },
            { id: '5U', label: '5U (75-79g)', count: facetCounts.weights['5U'] },
          ].map((w) => {
            const isSelected = selectedWeights.includes(w.id);
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => {
                  setSelectedWeights((prev) =>
                    prev.includes(w.id) ? prev.filter((x) => x !== w.id) : [...prev, w.id]
                  );
                }}
                className={`text-[12px] px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-ink text-bg border-ink font-medium shadow-xs'
                    : 'bg-bg text-muted border-line hover:border-ink/50 hover:text-ink font-normal'
                }`}
              >
                {w.label} ({w.count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Độ cứng đũa (Stiffness) */}
      <div className="border-b border-line pb-5">
        <h3 className="font-medium text-ink mb-3 text-[14px]">Độ cứng đũa</h3>
        <div className="space-y-2">
          {[
            { id: 'cứng', label: 'Cứng', count: facetCounts.stiffness['Cứng'] },
            { id: 'trung bình', label: 'Trung bình', count: facetCounts.stiffness['Trung bình'] },
            { id: 'dẻo', label: 'Dẻo', count: facetCounts.stiffness['Dẻo'] },
          ].map((stiff) => {
            const isChecked = selectedStiffness.includes(stiff.id);
            return (
              <label
                key={stiff.id}
                className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-surface cursor-pointer select-none group"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    value={stiff.id}
                    checked={isChecked}
                    onChange={() => {
                      setSelectedStiffness((prev) =>
                        prev.includes(stiff.id) ? prev.filter((s) => s !== stiff.id) : [...prev, stiff.id]
                      );
                    }}
                    className="w-4 h-4 rounded border-line text-ink focus:ring-0 cursor-pointer accent-ink"
                  />
                  <span className={`text-[13px] ${isChecked ? 'font-medium text-ink' : 'text-muted group-hover:text-ink'}`}>
                    {stiff.label}
                  </span>
                </div>
                <span className="text-[12px] text-muted font-normal">({stiff.count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 6. Lối chơi (Play style) */}
      <div className="border-b border-line pb-5">
        <h3 className="font-medium text-ink mb-3 text-[14px]">Lối chơi</h3>
        <div className="space-y-2">
          {[
            { id: 'tấn công', label: 'Tấn công', count: facetCounts.playStyles['Tấn công'] },
            { id: 'phòng thủ', label: 'Phòng thủ / Phản tạt', count: facetCounts.playStyles['Phòng thủ'] },
            { id: 'công thủ', label: 'Công thủ toàn diện', count: facetCounts.playStyles['Công thủ toàn diện'] },
          ].map((style) => {
            const isChecked = selectedPlaystyles.includes(style.id);
            return (
              <label
                key={style.id}
                className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-surface cursor-pointer select-none group"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    value={style.id}
                    checked={isChecked}
                    onChange={() => {
                      setSelectedPlaystyles((prev) =>
                        prev.includes(style.id) ? prev.filter((s) => s !== style.id) : [...prev, style.id]
                      );
                    }}
                    className="w-4 h-4 rounded border-line text-ink focus:ring-0 cursor-pointer accent-ink"
                  />
                  <span className={`text-[13px] ${isChecked ? 'font-medium text-ink' : 'text-muted group-hover:text-ink'}`}>
                    {style.label}
                  </span>
                </div>
                <span className="text-[12px] text-muted font-normal">({style.count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 7. Chi nhánh còn hàng (Branch Availability) */}
      <div className="pb-2">
        <h3 className="font-medium text-ink mb-3 text-[14px]">Chi nhánh còn hàng (Kho)</h3>
        <div className="space-y-2">
          {BRANCHES.map((b) => {
            const isSelected = selectedBranch === b.id;
            const count = b.id === 'ALL' ? initialProducts.length : facetCounts.branches[b.id as keyof typeof facetCounts.branches] || 0;
            return (
              <label
                key={b.id}
                className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-surface cursor-pointer select-none group"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="branch_facet"
                    value={b.id}
                    checked={isSelected}
                    onChange={() => setSelectedBranch(b.id)}
                    className="w-4 h-4 border-line text-ink focus:ring-0 cursor-pointer accent-ink"
                  />
                  <span className={`text-[13px] ${isSelected ? 'font-medium text-ink' : 'text-muted group-hover:text-ink'}`}>
                    {b.label}
                  </span>
                </div>
                <span className="text-[12px] text-muted font-normal">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Reset CTA */}
      {hasActiveFilters && (
        <div className="pt-2">
          <button
            type="button"
            onClick={resetAllFilters}
            className="w-full py-2 px-3 text-[13px] text-muted hover:text-ink bg-surface hover:bg-bg border border-line rounded-xl transition-colors cursor-pointer text-center font-normal"
          >
            Xóa bộ lọc
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* 1. DESKTOP 280px FIXED LEFT SIDEBAR (Width strictly ~280px) */}
      <aside
        className="hidden lg:block w-[280px] shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto space-y-6 pr-4 no-scrollbar"
        data-filter-sidebar
      >
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <h2 className="text-[16px] font-medium text-ink">Bộ lọc sản phẩm</h2>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-[13px] text-brand hover:underline font-normal cursor-pointer"
            >
              Đặt lại
            </button>
          )}
        </div>
        {renderFacetFilters()}
      </aside>

      {/* 2. MAIN CATALOG SECTION */}
      <main className="flex-1 min-w-0 space-y-6">
        {/* Mobile Toolbar: Filter Trigger Button & Match Counter */}
        <div className="lg:hidden flex items-center justify-between pb-4 border-b border-line">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-line bg-surface hover:bg-bg text-[14px] font-medium text-ink transition-colors cursor-pointer shadow-xs active:scale-95"
            aria-label="Mở bộ lọc"
          >
            <SlidersHorizontal className="w-4 h-4 text-muted" />
            <span>Bộ lọc</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-brand inline-block" />
            )}
          </button>

          <span className="text-[13px] text-muted font-normal">
            Hiển thị <span className="font-medium text-ink">{filteredProducts.length}</span> sản phẩm
          </span>
        </div>

        {/* Desktop Sorting & Status Bar */}
        <div className="hidden lg:flex items-center justify-between pb-4 border-b border-line text-[13px]">
          <span className="text-muted font-normal">
            Hiển thị <span className="text-ink font-medium">{filteredProducts.length}</span> / {initialProducts.length} sản phẩm
          </span>

          <div className="flex items-center gap-2">
            <span className="text-muted font-normal flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-bg border border-line rounded-lg px-3 py-1.5 text-[13px] font-normal text-ink focus:outline-none focus:border-ink cursor-pointer"
            >
              <option value="NAME_ASC">Tên: A → Z</option>
              <option value="PRICE_ASC">Giá: Thấp đến cao</option>
              <option value="PRICE_DESC">Giá: Cao đến thấp</option>
            </select>
          </div>
        </div>

        {/* Product Grid / Empty State */}
        {filteredProducts.length === 0 ? (
          <EmptyState
            title="Không tìm thấy sản phẩm phù hợp"
            description="Vui lòng thử điều chỉnh lại bộ lọc thương hiệu, khoảng giá hoặc thông số kỹ thuật."
            actionLabel="Xóa bộ lọc"
            onAction={resetAllFilters}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                slug={product.slug}
                name={product.name}
                brand={product.brand}
                playerType={product.playerType}
                priceFrom={product.priceFrom}
                originalPrice={product.originalPrice}
                imageUrl={product.imageUrl}
                secondImageUrl={product.secondImageUrl}
                specSummary={product.weight ? `${product.weight.split(',')[0].trim()} · ${product.playerType}` : product.playerType}
                showCompare={true}
                rating={product.rating}
                inStock={true}
                compareData={{
                  balancePoint: product.balancePoint,
                  stiffness: product.stiffness,
                  weight: product.weight,
                  maxTension: product.maxTension,
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* 3. MOBILE VAUL BOTTOM SHEET (Drawer) */}
      <Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs transition-opacity" />
          <Drawer.Content
            className="bg-surface flex flex-col rounded-t-[20px] max-h-[85vh] fixed bottom-0 left-0 right-0 z-50 focus:outline-none border-t border-line shadow-2xl"
            aria-describedby="filter-drawer-desc"
          >
            <Drawer.Title className="sr-only">Bộ lọc</Drawer.Title>
            {/* Visual Grab Handle for Drag-to-Dismiss */}
            <div className="pt-3 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-line" />
            </div>

            {/* Drawer Header */}
            <div className="px-5 py-3 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-medium text-ink">Bộ lọc sản phẩm</h2>
                <span className="text-[13px] text-muted font-normal">({filteredProducts.length} sản phẩm)</span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-[13px] text-brand hover:underline font-normal cursor-pointer"
                >
                  Đặt lại
                </button>
              )}
            </div>

            <p id="filter-drawer-desc" className="sr-only">
              Bộ lọc tiêu chí sản phẩm vợt cầu lông
            </p>

            {/* Scrollable Facets Body */}
            <div className="px-5 py-4 overflow-y-auto flex-1 space-y-6">
              {renderFacetFilters()}
            </div>

            {/* Drawer Footer CTA */}
            <div className="p-4 border-t border-line bg-surface/95 backdrop-blur-xs">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-full h-11 rounded-full bg-ink text-bg text-[14px] font-medium flex items-center justify-center cursor-pointer active:scale-98 transition-transform"
              >
                Xem {filteredProducts.length} sản phẩm
              </button>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
