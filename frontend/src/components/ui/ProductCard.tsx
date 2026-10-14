'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { PriceTag } from './PriceTag';
import { Badge } from './Badge';
import { useCompare, type CompareItem } from '@/lib/compare-context';
import { Scale } from 'lucide-react';

export interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  brand: string;
  playerType: string;
  priceFrom: number;
  imageUrl: string;
  secondImageUrl?: string;
  badgeText?: string;
  specSummary?: string;
  isSecondHand?: boolean;
  grade?: 'A' | 'B' | 'C';
  showCompare?: boolean;
  compareData?: Partial<CompareItem>;
  onQuickAdd?: () => void;
  className?: string;
}

export function ProductCard({
  slug,
  name,
  brand,
  playerType,
  priceFrom,
  imageUrl,
  secondImageUrl,
  badgeText,
  specSummary,
  isSecondHand = false,
  grade,
  showCompare = true,
  compareData,
  onQuickAdd,
  className = '',
}: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const { addToCompare, isInCompare } = useCompare();
  const href = isSecondHand ? `/second-hand#${slug}` : `/vot-cau-long/${slug}`;
  const compared = isInCompare(slug);

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl p-3 sm:p-4 transition-colors hover:bg-surface border border-transparent hover:border-line ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div>
        {/* Khung ảnh tỷ lệ 1:1 nền trung tính ấm, hòa trộn ảnh trắng */}
        <div className="relative w-full aspect-square bg-[#EFECE6] dark:bg-[#18201C] rounded-xl overflow-hidden mb-3">
          <Link href={href} className="block w-full h-full">
            <motion.div
              className="w-full h-full relative p-4 flex items-center justify-center"
              animate={{ scale: isHovered ? 1.03 : 1 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <Image
                src={isHovered && secondImageUrl ? secondImageUrl : imageUrl}
                alt={name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-contain mix-blend-multiply dark:mix-blend-normal p-2"
                loading="lazy"
              />
            </motion.div>
          </Link>

          {/* Badge duy nhất ở góc trên bên trái */}
          {grade && (
            <div className="absolute top-2.5 left-2.5 pointer-events-none">
              <Badge variant={grade === 'A' ? 'gradeA' : grade === 'B' ? 'gradeB' : 'gradeC'}>
                Hạng {grade}
              </Badge>
            </div>
          )}
          {!grade && badgeText && (
            <div className="absolute top-2.5 left-2.5 pointer-events-none">
              <Badge variant="muted">{badgeText}</Badge>
            </div>
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
              className={`absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                compared
                  ? 'bg-ink text-bg shadow-xs'
                  : 'bg-surface/80 hover:bg-surface text-muted hover:text-ink backdrop-blur-xs border border-line'
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
          <div className="text-[13px] text-muted font-normal flex items-center justify-between">
            <span>{brand}</span>
            {specSummary && <span>{specSummary}</span>}
          </div>

          <Link href={href} className="block">
            <h3 className="text-[15px] sm:text-[16px] font-medium text-ink leading-snug line-clamp-2 hover:opacity-80 transition-opacity">
              {name}
            </h3>
          </Link>
        </div>
      </div>

      {/* Giá tiền & Nút tương tác */}
      <div className="pt-3 mt-2 border-t border-line flex items-center justify-between">
        <div>
          <span className="text-[13px] text-muted block font-normal">
            {isSecondHand ? 'Giá niêm yết' : 'Giá từ'}
          </span>
          <PriceTag amount={priceFrom} size="md" />
        </div>

        {onQuickAdd && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickAdd();
            }}
            className="hidden sm:inline-flex items-center justify-center h-8 px-3 text-[13px] font-medium text-ink bg-bg hover:bg-surface border border-line rounded-full transition-colors active:scale-95 cursor-pointer"
          >
            Chọn mua
          </button>
        )}
      </div>
    </div>
  );
}
