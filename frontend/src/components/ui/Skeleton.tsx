import * as React from 'react';

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-line/60 dark:bg-line/40 ${className}`}
      {...props}
    />
  );
}
