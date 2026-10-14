'use client';

import * as React from 'react';
import NumberFlow from '@number-flow/react';

export interface PriceTagProps {
  amount: number;
  originalAmount?: number;
  currency?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  animated?: boolean;
}

export function PriceTag({
  amount,
  originalAmount,
  currency = 'VND',
  className = '',
  size = 'md',
  animated = false,
}: PriceTagProps) {
  const sizeClasses = {
    sm: 'text-[14px]',
    md: 'text-[16px]',
    lg: 'text-[20px]',
    hero: 'text-[28px] sm:text-[32px]',
  };

  const isSale = originalAmount && originalAmount > amount;

  return (
    <div className={`inline-flex items-baseline gap-2 tabular-nums ${className}`}>
      <span className={`font-medium text-ink ${sizeClasses[size]}`}>
        {animated ? (
          <span className="inline-flex items-baseline gap-0.5">
            <NumberFlow value={amount} locales="vi-VN" />
            <span className="text-[0.8em]">₫</span>
          </span>
        ) : (
          new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount)
        )}
      </span>

      {isSale && (
        <span className="text-[13px] font-normal text-muted line-through">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(originalAmount)}
        </span>
      )}
    </div>
  );
}
