'use client';

import * as React from 'react';
import { Container } from '@/components/ui/Container';

interface StickyAnchorBarProps {
  className?: string;
}

const TABS = [
  { id: 'mo-ta', label: 'Mô tả' },
  { id: 'thong-so', label: 'Thông số' },
  { id: 'danh-gia', label: 'Đánh giá' },
  { id: 'bao-hanh', label: 'Bảo hành' },
];

export function StickyAnchorBar({ className = '' }: StickyAnchorBarProps) {
  const [activeTab, setActiveTab] = React.useState<string>('mo-ta');

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;

      for (let i = TABS.length - 1; i >= 0; i--) {
        const tab = TABS[i];
        const el = document.getElementById(tab.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveTab(tab.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleTabClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setActiveTab(id);
      window.history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <div className={`sticky top-16 z-20 bg-surface/90 backdrop-blur-md border-b border-line ${className}`.trim()}>
      <Container>
        <nav
          className="flex items-center gap-6 sm:gap-8 overflow-x-auto no-scrollbar py-3 text-[14px]"
          aria-label="Điều hướng phân mục chi tiết sản phẩm"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                onClick={(e) => handleTabClick(e, tab.id)}
                className={`py-1.5 transition-colors relative whitespace-nowrap select-none font-medium ${
                  isActive ? 'text-ink' : 'text-muted hover:text-ink font-normal'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-[-13px] left-0 right-0 h-0.5 bg-brand rounded-full" />
                )}
              </a>
            );
          })}
        </nav>
      </Container>
    </div>
  );
}

export default StickyAnchorBar;
