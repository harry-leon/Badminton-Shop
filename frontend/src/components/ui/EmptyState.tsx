import * as React from 'react';
import Link from 'next/link';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionText,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  const label = actionText || actionLabel;

  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-line bg-surface/50 space-y-4 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-bg border border-line flex items-center justify-center text-muted">
        {icon || (
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        )}
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base sm:text-lg font-medium text-ink">{title}</h3>
        <p className="text-[14px] text-muted leading-relaxed font-normal">{description}</p>
      </div>

      {(label && (actionHref || onAction)) && (
        <div className="pt-2">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center justify-center h-10 px-5 text-[14px] font-medium rounded-full bg-ink text-bg hover:opacity-90 transition-opacity"
            >
              {label}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center justify-center h-10 px-5 text-[14px] font-medium rounded-full bg-ink text-bg hover:opacity-90 transition-opacity cursor-pointer"
            >
              {label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
