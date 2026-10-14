'use client';

import * as React from 'react';

export interface SpecBarProps {
  label: string;
  valueText: string;
  percentage: number; // 0 to 100
  leftLabel?: string;
  rightLabel?: string;
  className?: string;
}

export function SpecBar({
  label,
  valueText,
  percentage,
  leftLabel,
  rightLabel,
  className = '',
}: SpecBarProps) {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between items-baseline text-[14px]">
        <span className="text-muted font-normal">{label}</span>
        <span className="text-ink font-medium">{valueText}</span>
      </div>

      {/* 4px sleek track */}
      <div className="h-1 w-full bg-line rounded-full overflow-hidden relative">
        <div
          className="h-full bg-ink rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>

      {(leftLabel || rightLabel) && (
        <div className="flex justify-between text-[13px] text-muted font-normal pt-0.5">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
      )}
    </div>
  );
}
