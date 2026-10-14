'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, Sparkles, ShieldCheck, Tag, ArrowRight, X } from 'lucide-react';

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName))) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  if (!open) return null;

  const navigateTo = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={() => onOpenChange(false)} />
      
      <div className="relative w-full max-w-xl bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <Command label="Tìm kiếm nhanh toàn hệ thống" className="flex flex-col w-full">
          <div className="flex items-center px-4 border-b border-line">
            <Search className="w-4 h-4 text-muted shrink-0 mr-3" />
            <Command.Input
              placeholder="Tìm vợt mới, vợt cũ, serial nón, tra cứu bảo hành..."
              className="w-full h-13 bg-transparent text-[15px] text-ink placeholder:text-muted outline-none font-normal"
              autoFocus
            />
            <button
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-md text-muted hover:text-ink transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <Command.List className="max-h-80 overflow-y-auto p-2 space-y-1">
            <Command.Empty className="p-6 text-center text-[14px] text-muted font-normal">
              Không tìm thấy sản phẩm hoặc thông tin phù hợp.
            </Command.Empty>

            <Command.Group heading="Vợt nổi bật" className="px-2 py-1.5 text-[12px] text-muted font-medium uppercase tracking-wider">
              <Command.Item
                onSelect={() => navigateTo('/vot-cau-long/yonex-astrox-99-pro')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] text-ink hover:bg-bg cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-brand" />
                  <span className="font-medium">Yonex Astrox 99 Pro</span>
                  <span className="text-muted text-[13px]">· 4U Nặng đầu</span>
                </div>
                <span className="text-[13px] text-muted">Từ 4.250.000 ₫</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('/vot-cau-long/lining-axforce-80')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] text-ink hover:bg-bg cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-brand" />
                  <span className="font-medium">Lining Axforce 80</span>
                  <span className="text-muted text-[13px]">· Thân cứng thiên công</span>
                </div>
                <span className="text-[13px] text-muted">Từ 3.950.000 ₫</span>
              </Command.Item>

              <Command.Item
                onSelect={() => navigateTo('/vot-cau-long/victor-thruster-ryuga-ii')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] text-ink hover:bg-bg cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-brand" />
                  <span className="font-medium">Victor Thruster Ryuga II</span>
                  <span className="text-muted text-[13px]">· Tấn công uy lực</span>
                </div>
                <span className="text-[13px] text-muted">Từ 3.800.000 ₫</span>
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Sàn vợt cũ kiểm định" className="px-2 py-1.5 text-[12px] text-muted font-medium uppercase tracking-wider pt-2">
              <Command.Item
                onSelect={() => navigateTo('/second-hand')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] text-ink hover:bg-bg cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-muted" />
                  <span>Xem toàn bộ vợt cũ độc bản Hạng A/B/C</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Dịch vụ & Bảo hành" className="px-2 py-1.5 text-[12px] text-muted font-medium uppercase tracking-wider pt-2">
              <Command.Item
                onSelect={() => navigateTo('/tra-cuu-bao-hanh')}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-[14px] text-ink hover:bg-bg cursor-pointer select-none transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-brand" />
                  <span>Tra cứu bảo hành theo Serial / Mã đơn</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted" />
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="p-3 bg-bg border-t border-line flex items-center justify-between text-[12px] text-muted font-normal">
            <span>Dùng phím <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-ink">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-ink">↓</kbd> để di chuyển</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-surface border border-line text-ink">ESC</kbd> để đóng</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
