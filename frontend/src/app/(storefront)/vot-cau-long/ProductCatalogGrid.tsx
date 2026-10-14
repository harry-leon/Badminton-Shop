'use client';

import React, { useState, useMemo } from 'react';
import { ProductCard } from '@/components/ui/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowUpDown } from 'lucide-react';

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  rawBrand?: string;
  playerType: string;
  priceFrom: number;
  imageUrl: string;
  balancePoint?: number;
  stiffness?: string;
  weight?: string;
  maxTension?: string;
}

interface ProductCatalogGridProps {
  initialProducts: ProductItem[];
}

export default function ProductCatalogGrid({ initialProducts }: ProductCatalogGridProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedPlaystyle, setSelectedPlaystyle] = useState<string>('ALL');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC'>('NAME_ASC');

  // Danh sách các thương hiệu duy nhất
  const brands = useMemo(() => {
    const list = Array.from(new Set(initialProducts.map((p) => p.brand)));
    return ['ALL', ...list];
  }, [initialProducts]);

  // Danh sách lối chơi
  const playstyles = useMemo(() => {
    const list = Array.from(new Set(initialProducts.map((p) => p.playerType)));
    return ['ALL', ...list];
  }, [initialProducts]);

  // Bộ lọc sản phẩm
  const filteredProducts = useMemo(() => {
    let result = initialProducts.filter((product) => {
      const matchBrand = selectedBrand === 'ALL' || product.brand === selectedBrand;
      const matchPlaystyle = selectedPlaystyle === 'ALL' || product.playerType === selectedPlaystyle;
      
      let matchPrice = true;
      if (selectedPriceRange === 'UNDER_3M') {
        matchPrice = product.priceFrom < 3000000;
      } else if (selectedPriceRange === '3M_TO_4M') {
        matchPrice = product.priceFrom >= 3000000 && product.priceFrom <= 4000000;
      } else if (selectedPriceRange === 'ABOVE_4M') {
        matchPrice = product.priceFrom > 4000000;
      }

      return matchBrand && matchPlaystyle && matchPrice;
    });

    result.sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.priceFrom - b.priceFrom;
      if (sortBy === 'PRICE_DESC') return b.priceFrom - a.priceFrom;
      return a.name.localeCompare(b.name, 'vi');
    });

    return result;
  }, [initialProducts, selectedBrand, selectedPlaystyle, selectedPriceRange, sortBy]);

  const hasActiveFilters = selectedBrand !== 'ALL' || selectedPlaystyle !== 'ALL' || selectedPriceRange !== 'ALL';

  return (
    <div className="space-y-8">
      {/* Khung bộ lọc đa tiêu chí */}
      <div className="bg-surface rounded-2xl border border-line p-5 sm:p-6 space-y-5">
        {/* Lọc theo thương hiệu */}
        <div>
          <div className="text-[13px] text-muted font-normal mb-2.5">
            Thương hiệu
          </div>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => {
              const isSelected = selectedBrand === brand;
              const label = brand === 'ALL' ? 'Tất cả thương hiệu' : brand;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrand(brand)}
                  className={`text-[13px] px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-ink text-bg font-medium shadow-xs'
                      : 'bg-bg text-ink border border-line hover:border-ink/50 font-normal'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lọc theo lối chơi */}
        <div>
          <div className="text-[13px] text-muted font-normal mb-2.5">
            Lối chơi sở trường
          </div>
          <div className="flex flex-wrap gap-2">
            {playstyles.map((style) => {
              const isSelected = selectedPlaystyle === style;
              const label = style === 'ALL' ? 'Tất cả lối chơi' : style;
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => setSelectedPlaystyle(style)}
                  className={`text-[13px] px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-ink text-bg font-medium shadow-xs'
                      : 'bg-bg text-ink border border-line hover:border-ink/50 font-normal'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lọc theo khoảng giá */}
        <div>
          <div className="text-[13px] text-muted font-normal mb-2.5">
            Mức giá
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'ALL', label: 'Tất cả mức giá' },
              { id: 'UNDER_3M', label: 'Dưới 3.000.000 ₫' },
              { id: '3M_TO_4M', label: '3.000.000 ₫ — 4.000.000 ₫' },
              { id: 'ABOVE_4M', label: 'Trên 4.000.000 ₫' },
            ].map((p) => {
              const isSelected = selectedPriceRange === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPriceRange(p.id)}
                  className={`text-[13px] px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-ink text-bg font-medium shadow-xs'
                      : 'bg-bg text-ink border border-line hover:border-ink/50 font-normal'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thanh đếm kết quả & Sắp xếp */}
        <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
          <div className="text-muted font-normal flex items-center gap-2">
            <span>
              Hiển thị <span className="text-ink font-medium">{filteredProducts.length}</span> / {initialProducts.length} sản phẩm
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand('ALL');
                  setSelectedPlaystyle('ALL');
                  setSelectedPriceRange('ALL');
                }}
                className="text-brand hover:underline cursor-pointer"
              >
                (Đặt lại bộ lọc)
              </button>
            )}
          </div>

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
      </div>

      {/* Lưới sản phẩm */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          title="Không tìm thấy sản phẩm phù hợp"
          description="Vui lòng thử điều chỉnh lại bộ lọc thương hiệu, lối chơi hoặc tầm giá."
          actionLabel="Đặt lại bộ lọc"
          actionHref="/vot-cau-long"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              name={product.name}
              brand={product.brand}
              playerType={product.playerType}
              priceFrom={product.priceFrom}
              imageUrl={product.imageUrl}
              specSummary={product.weight ? `${product.weight.split(',')[0].trim()} · ${product.playerType}` : product.playerType}
              showCompare={true}
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
    </div>
  );
}
