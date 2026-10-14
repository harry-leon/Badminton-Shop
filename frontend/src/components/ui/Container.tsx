import * as React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export function Container({
  children,
  className = '',
  as: Component = 'div',
  ...props
}: ContainerProps) {
  return (
    <Component
      className={`w-full max-w-7xl mx-auto px-[var(--page-gutter)] ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Container;
