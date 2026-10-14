import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-normal transition-colors select-none',
  {
    variants: {
      variant: {
        default: 'bg-surface border border-line text-ink',
        brand: 'bg-brand/10 text-brand border border-brand/20',
        muted: 'bg-bg text-muted border border-line',
        sale: 'bg-sale/10 text-sale border border-sale/20',
        accent: 'bg-accent/20 text-ink border border-accent/40',
        gradeA: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40',
        gradeB: 'bg-blue-50 text-blue-800 border border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40',
        gradeC: 'bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={badgeVariants({ variant, className })} {...props} />;
}
