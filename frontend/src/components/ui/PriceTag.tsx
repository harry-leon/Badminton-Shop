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
  color?: 'brand' | 'red' | 'ink';
}

export function PriceTag({
  amount,
  originalAmount,
  currency = 'VND',
  className = '',
  size = 'md',
  animated = false,
  color = 'red',
}: PriceTagProps) {
  const sizeClasses = {
    sm: 'text-[14px]',
    md: 'text-[16px] sm:text-[17px]',
    lg: 'text-[20px] sm:text-[22px]',
    hero: 'text-[28px] sm:text-[32px]',
  };

  const colorClasses = {
    red: 'text-sale font-bold',
    brand: 'text-brand font-bold',
    ink: 'text-ink font-medium',
  };

  const isSale = Boolean(originalAmount && originalAmount > amount);

  return (
    <div className={`inline-flex items-baseline gap-2 tabular-nums flex-wrap ${className}`}>
      <span className={`${colorClasses[color]} ${sizeClasses[size]}`}>
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
        <span className="text-[12px] sm:text-[13px] font-normal text-muted line-through opacity-85">
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(originalAmount!)}
        </span>
      )}
    </div>
  );
}
