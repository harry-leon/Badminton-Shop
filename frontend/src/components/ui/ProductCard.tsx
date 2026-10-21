'use client';

import * as React from 'react';
import { SafeImage } from './SafeImage';
import Link from 'next/link';
import { PriceTag } from './PriceTag';
import { Badge } from './Badge';
import { useCompare, type CompareItem } from '@/lib/compare-context';
import { useCart } from '@/lib/cart-context';
import { getProductDetailUrl } from '@/lib/productUrl';
import { Scale, Star, Flame, ShoppingBag } from 'lucide-react';

export interface ProductCardTag {
  code: string;
  name: string;
  bg_color?: string;
  text_color?: string;
}

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  brand: string;
  playerType: string;
  priceFrom: number;
  originalPrice?: number;
  rating?: number;
  inStock?: boolean;
  stockStatusText?: string;
  imageUrl: string;
  secondImageUrl?: string;
  badgeText?: string;
  tags?: (string | ProductCardTag)[];
  specSummary?: string;
  isSecondHand?: boolean;
  grade?: 'A' | 'B' | 'C';
  showCompare?: boolean;
  compareData?: Partial<CompareItem>;
  salesCount?: number;
  isBestSeller?: boolean;
  category?: string | { slug?: string; id?: string };
  href?: string;
  onQuickAdd?: () => void;
  className?: string;
}

export function ProductCard({
  id,
  slug,
  name,
  brand,
  playerType,
  priceFrom,
  originalPrice,
  rating,
  inStock = true,
  stockStatusText,
  imageUrl,
  secondImageUrl,
  badgeText,
  tags,
  specSummary,
  isSecondHand = false,
  grade,
  showCompare = true,
  compareData,
  salesCount,
  isBestSeller,
  category,
  href: customHref,
  onQuickAdd,
  className = '',
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const { addToCompare, isInCompare } = useCompare();
  const { addItem, setIsCartOpen } = useCart();
  const href = customHref || (isSecondHand ? `/second-hand#${slug}` : getProductDetailUrl({ slug, category }));
  const compared = isInCompare(slug);

  const hasDiscount = Boolean(originalPrice && originalPrice > priceFrom);
  const hasSecondaryImage = Boolean(secondImageUrl && secondImageUrl !== imageUrl);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd();
      return;
    }
    addItem({
      id: id || slug,
      name,
      sku: slug,
      price: priceFrom,
      imageUrl: imageUrl || '/images/products/yonex-astrox-100zz.png',
      isSecondhand: isSecondHand,
    });
    setIsCartOpen(true);
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl p-2.5 sm:p-4 bg-surface border border-line/80 shadow-xs hover:shadow-lg hover:border-brand/40 transition-all duration-200 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div>
        {/* Khung ảnh tỷ lệ chuẩn 4:5 */}
        <div className="relative w-full aspect-[4/5] bg-bg/70 dark:bg-black/20 rounded-xl overflow-hidden mb-2.5 sm:mb-3 border border-line/40">
          <Link href={href} className="block w-full h-full relative p-2 sm:p-4 flex items-center justify-center">
            {/* Ảnh chính (Front angle) */}
            <div
              className={`absolute inset-2 sm:inset-4 transition-opacity duration-300 ${
                isHovered && hasSecondaryImage ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <SafeImage
                src={imageUrl}
                alt={name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain mix-blend-multiply dark:mix-blend-normal p-1 sm:p-2 group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>

            {/* Ảnh phụ (Back angle) xuất hiện khi hover desktop */}
            {hasSecondaryImage && (
              <div
                className={`absolute inset-2 sm:inset-4 transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <SafeImage
                  src={secondImageUrl}
                  alt={`${name} — Mặt sau`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-contain mix-blend-multiply dark:mix-blend-normal p-1 sm:p-2 group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            )}
          </Link>

          {/* Badge góc trên bên trái: Ưu tiên tags động do Admin cấu hình */}
          {tags && tags.length > 0 ? (
            <div className="absolute top-2 left-2 pointer-events-none flex flex-col gap-1 z-10">
              {tags.slice(0, 2).map((t, idx) => {
                const isObj = typeof t === 'object' && t !== null;
                const name = isObj ? t.name : t;
                const bg = isObj ? t.bg_color || '#DC2626' : (t === 'HOT' ? '#D97706' : t === 'NEW' ? '#0F5132' : t === 'LIMITED' ? '#7C3AED' : '#DC2626');
                const color = isObj ? t.text_color || '#FFFFFF' : '#FFFFFF';
                return (
                  <span
                    key={idx}
                    style={{ backgroundColor: bg, color }}
                    className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wider inline-flex items-center gap-0.5 sm:gap-1"
                  >
                    {name === 'HOT' || name === 'Bán chạy / Hot' ? <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" /> : null}
                    <span>{name}</span>
                  </span>
                );
              })}
            </div>
          ) : (
            <>
              {hasDiscount && (
                <div className="absolute top-2 left-2 pointer-events-none bg-red-600 text-white font-bold text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wide">
                  -{Math.round(((originalPrice! - priceFrom) / originalPrice!) * 100)}%
                </div>
              )}
              {!hasDiscount && grade && (
                <div className="absolute top-2 left-2 pointer-events-none scale-90 sm:scale-100 origin-top-left">
                  <Badge variant={grade === 'A' ? 'gradeA' : grade === 'B' ? 'gradeB' : 'gradeC'}>
                    Hạng {grade}
                  </Badge>
                </div>
              )}
              {!hasDiscount && !grade && (isBestSeller || badgeText === 'Bán chạy') && (
                <div className="absolute top-2 left-2 pointer-events-none flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-1.5 sm:px-2 py-0.5 rounded-full text-[11px] sm:text-[13px] font-medium shadow-xs">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-500 text-amber-500" />
                  <span>Bán chạy</span>
                </div>
              )}
              {!hasDiscount && !grade && !isBestSeller && badgeText && badgeText !== 'Bán chạy' && (
                <div className="absolute top-2 left-2 pointer-events-none scale-90 sm:scale-100 origin-top-left">
                  <Badge variant="muted">{badgeText}</Badge>
                </div>
              )}
            </>
          )}

          {/* Nút so sánh ở góc trên bên phải */}
          {showCompare && !isSecondHand && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCompare({
                  id: slug,
                  slug,
                  name,
                  brand,
                  imageUrl,
                  priceFrom,
                  playerType,
                  ...compareData,
                });
              }}
              className={`absolute top-2 right-2 z-10 w-9 h-9 sm:w-11 sm:h-11 min-w-[36px] min-h-[36px] sm:min-w-[44px] sm:min-h-[44px] rounded-full flex items-center justify-center transition-all touch-target touch-target-hit ${
                compared
                  ? 'bg-ink text-bg shadow-xs'
                  : 'bg-surface/90 hover:bg-surface text-muted hover:text-ink backdrop-blur-xs border border-line shadow-xs'
              }`}
              title={compared ? 'Đang chọn so sánh (Bấm để bỏ)' : 'Chọn so sánh'}
              aria-label={`So sánh ${name}`}
            >
              <Scale className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Thông tin thương hiệu & tên sản phẩm */}
        <div className="space-y-1">
          <div className="text-[11px] sm:text-[13px] text-muted font-normal flex items-center justify-between">
            <span className="font-semibold text-brand tracking-wide uppercase">{brand}</span>
            {specSummary && <span className="hidden xs:inline text-[11px] text-muted truncate max-w-[50%]">{specSummary}</span>}
          </div>

          <Link href={href} className="block">
            <h3 className="text-[13px] sm:text-[15px] font-medium text-ink leading-snug line-clamp-2 hover:text-brand transition-colors h-[2.5rem] sm:h-[2.75rem]">
              {name}
            </h3>
          </Link>

          {/* Đánh giá sao, số lượt bán & Trạng thái tồn kho */}
          <div className="flex items-center justify-between pt-0.5 text-[11px] sm:text-[13px]">
            <div className="flex items-center gap-1.5" data-rating={rating || 0}>
              <div className="flex items-center gap-0.5">
                {typeof rating === 'number' && rating > 0 ? (
                  <>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" aria-label={`${rating} sao`} />
                    <span className="font-medium text-ink text-[11px] sm:text-[13px]">{rating.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="text-muted font-normal text-[10px] sm:text-[12px]">Mới</span>
                )}
              </div>
              {salesCount !== undefined && salesCount > 0 && (
                <span className="text-muted text-[10px] sm:text-[12px] font-normal hidden sm:inline">
                  · Đã bán {salesCount}
                </span>
              )}
            </div>

            <div>
              {stockStatusText ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium text-[10px] sm:text-[12px]">{stockStatusText}</span>
              ) : inStock ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-medium text-[10px] sm:text-[12px]">Còn hàng</span>
              ) : (
                <span className="text-muted font-normal text-[10px] sm:text-[12px]">Tạm hết</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Giá tiền & Nút Thêm vào giỏ hàng */}
      <div className="pt-2 sm:pt-3 mt-2 border-t border-line/70 flex items-center justify-between gap-1.5 sm:gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] sm:text-[11px] text-muted block font-normal leading-none mb-0.5">
            {isSecondHand ? 'Giá niêm yết' : 'Giá ưu đãi'}
          </span>
          <div className="flex items-baseline gap-1 sm:gap-2 overflow-hidden">
            <PriceTag 
              amount={priceFrom} 
              originalAmount={originalPrice} 
              size="sm" 
              color="red" 
            />
          </div>

          {/* Tag khuyến mãi tinh tế */}
          {!isSecondHand && (
            <div className="hidden xs:flex items-center gap-1 mt-1 flex-wrap">
              {hasDiscount && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/60">
                  SALE -{Math.round(((originalPrice! - priceFrom) / originalPrice!) * 100)}%
                </span>
              )}
              {(isBestSeller || badgeText === 'Bán chạy') && (
                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60">
                  HOT
                </span>
              )}
            </div>
          )}
        </div>

        {/* Nút Thêm vào giỏ hàng hiển thị rõ ràng */}
        <button
          type="button"
          onClick={handleAddToCart}
          className="inline-flex items-center justify-center gap-1.5 min-h-[38px] min-w-[38px] sm:min-h-[44px] px-2.5 sm:px-3.5 text-[12px] sm:text-[13px] font-medium text-white bg-brand hover:bg-brand/90 rounded-full shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer shrink-0 touch-target touch-target-hit"
          title="Thêm vào giỏ hàng"
          aria-label={`Thêm ${name} vào giỏ hàng`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Thêm giỏ</span>
        </button>
      </div>
    </div>
  );
}

export default ProductCard;
