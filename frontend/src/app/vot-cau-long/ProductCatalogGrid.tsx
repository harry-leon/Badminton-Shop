'use client';

import React, { useState, useMemo } from 'react';
import { Filter, ArrowUpDown, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  playerType: string;
  priceFrom: number;
  imageUrl: string;
}

interface ProductCatalogGridProps {
  initialProducts: ProductItem[];
}

export default function ProductCatalogGrid({ initialProducts }: ProductCatalogGridProps) {
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedPlaystyle, setSelectedPlaystyle] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'NAME_ASC' | 'PRICE_ASC' | 'PRICE_DESC'>('NAME_ASC');

  // Unique brands
  const brands = useMemo(() => {
    const list = Array.from(new Set(initialProducts.map((p) => p.brand)));
    return ['ALL', ...list];
  }, [initialProducts]);

  // Unique playstyles
  const playstyles = useMemo(() => {
    const list = Array.from(new Set(initialProducts.map((p) => p.playerType)));
    return ['ALL', ...list];
  }, [initialProducts]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = initialProducts.filter((product) => {
      const matchBrand = selectedBrand === 'ALL' || product.brand === selectedBrand;
      const matchPlaystyle = selectedPlaystyle === 'ALL' || product.playerType === selectedPlaystyle;
      return matchBrand && matchPlaystyle;
    });

    result.sort((a, b) => {
      if (sortBy === 'PRICE_ASC') return a.priceFrom - b.priceFrom;
      if (sortBy === 'PRICE_DESC') return b.priceFrom - a.priceFrom;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [initialProducts, selectedBrand, selectedPlaystyle, sortBy]);

  return (
    <div className="space-y-8">
      {/* Filters Toolbar */}
      <div className="bg-white rounded-3xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-5">
        {/* Brand Filter */}
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-stone-500 uppercase tracking-wider mb-2.5">
            <Filter className="w-3.5 h-3.5 text-[#0F5132]" /> Thương hiệu
          </div>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => {
              const isSelected = selectedBrand === brand;
              const label = brand === 'ALL' ? 'Tất Cả Thương Hiệu' : brand;
              return (
                <button
                  key={brand}
                  type="button"
                  onClick={() => setSelectedBrand(brand)}
                  className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F5132] text-[#C8F31D] shadow-sm font-extrabold'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Playstyle Filter */}
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-stone-500 uppercase tracking-wider mb-2.5">
            <Zap className="w-3.5 h-3.5 text-emerald-700" /> Lối chơi sở trường
          </div>
          <div className="flex flex-wrap gap-2">
            {playstyles.map((style) => {
              const isSelected = selectedPlaystyle === style;
              const label = style === 'ALL' ? 'Tất Cả Lối Chơi' : style;
              return (
                <button
                  key={style}
                  type="button"
                  onClick={() => setSelectedPlaystyle(style)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#16794C] text-white font-bold'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort & Count Bar */}
        <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-stone-500 font-medium">
            Hiển thị <span className="font-bold text-[#0F5132]">{filteredProducts.length}</span> / {initialProducts.length} sản phẩm
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" /> Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 font-bold text-stone-800 focus:outline-none focus:ring-1 focus:ring-[#0F5132] cursor-pointer"
            >
              <option value="NAME_ASC">Tên: A → Z</option>
              <option value="PRICE_ASC">Giá: Thấp đến Cao</option>
              <option value="PRICE_DESC">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid sản phẩm */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center text-stone-500 shadow-sm max-w-md mx-auto my-6">
          <p className="font-bold text-stone-800 text-base mb-1">Không tìm thấy sản phẩm phù hợp</p>
          <p className="text-xs text-stone-500 mb-4">Vui lòng điều chỉnh lại bộ lọc thương hiệu hoặc lối chơi.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedBrand('ALL');
              setSelectedPlaystyle('ALL');
            }}
            className="bg-[#0F5132] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <a
              key={product.id}
              href={`/vot-cau-long/${product.slug}`}
              className="group bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:shadow-xl hover:border-emerald-600/40 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Racket Image Container */}
                <div className="aspect-square bg-linear-to-b from-stone-50 via-white to-emerald-50/20 rounded-2xl overflow-hidden mb-4 relative flex items-center justify-center p-4 border border-stone-100">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-[#0F5132] text-[#C8F31D] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                    {product.brand}
                  </span>
                </div>

                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <span>{product.playerType}</span>
                </div>
                <h3 className="font-black text-sm text-stone-900 group-hover:text-[#0F5132] transition-colors line-clamp-2 leading-snug">
                  {product.name}
                </h3>
              </div>

              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-bold block uppercase tracking-wider">Giá từ</span>
                  <span className="text-base font-black text-[#0F5132]">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.priceFrom)}
                  </span>
                </div>
                <span className="text-xs font-black text-[#0F5132] group-hover:text-emerald-700 group-hover:translate-x-1 transition-all flex items-center gap-1">
                  Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
