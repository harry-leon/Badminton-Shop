'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, User, Menu, X, ShieldCheck, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { CommandSearch } from './CommandSearch';
import { CartDrawer, CartItem } from './CartDrawer';

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [cartOpen, setCartOpen] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/vot-cau-long', label: 'Vợt mới' },
    { href: '/second-hand', label: 'Vợt cũ đã kiểm định' },
    { href: '/tra-cuu-bao-hanh', label: 'Bảo hành' },
    { href: '/_design', label: 'Design System' },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 border-b ${
          isScrolled
            ? 'bg-surface/85 backdrop-blur-md border-line shadow-xs py-3'
            : 'bg-surface/60 backdrop-blur-sm border-line/60 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* 1. Logo chữ tối giản */}
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-1.5 group select-none">
              <span className="text-xl sm:text-2xl font-medium tracking-tight text-ink">
                Smash<span className="text-brand">Court</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-[14px] transition-colors ${
                      isActive
                        ? 'text-ink font-medium'
                        : 'text-muted hover:text-ink font-normal'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 2. Actions (Tìm kiếm ⌘K, Theme, Tài khoản, Giỏ hàng) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Thanh tìm kiếm nhanh */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 h-9 px-3 text-[13px] text-muted bg-bg hover:bg-surface border border-line rounded-full transition-colors cursor-pointer"
              title="Tìm kiếm (⌘K / Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-muted" />
              <span className="hidden sm:inline">Tìm kiếm...</span>
              <kbd className="hidden sm:inline-flex text-[11px] px-1.5 py-0.5 rounded bg-surface border border-line text-muted font-sans">
                ⌘K
              </kbd>
            </button>

            {/* Dark mode toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-bg border border-transparent hover:border-line transition-colors cursor-pointer"
                title="Chuyển chế độ sáng/tối"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Menu tài khoản */}
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-bg border border-transparent hover:border-line transition-colors cursor-pointer"
                title="Tài khoản"
              >
                <User className="w-4 h-4" />
              </button>

              {accountMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-surface border border-line rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  <div className="px-3 py-2 text-[13px] text-muted border-b border-line">
                    Khách hàng Smash Court
                  </div>
                  <Link
                    href="/tra-cuu-bao-hanh"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[14px] text-ink hover:bg-bg transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-brand" />
                    <span>Lịch sử đơn & Bảo hành</span>
                  </Link>
                  <div className="pt-1 border-t border-line">
                    <Link
                      href="/admin/inventory"
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] text-muted hover:text-ink hover:bg-bg transition-colors"
                    >
                      <span>Cổng quản trị nội bộ</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-bg text-muted">Nhân viên</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Nút Giỏ hàng */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center justify-center w-9 h-9 rounded-full text-ink hover:bg-bg border border-transparent hover:border-line transition-colors cursor-pointer"
              title="Xem giỏ hàng"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-ink text-bg text-[10px] font-medium flex items-center justify-center">
                0
              </span>
            </button>

            {/* Nút Hamburger menu Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-ink hover:bg-bg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-3 pb-6 border-t border-line bg-surface space-y-2 animate-in slide-in-from-top-2 duration-150">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-[15px] font-normal text-ink hover:bg-bg transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Quick Search Dialog ⌘K */}
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Cart Drawer */}
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
    </>
  );
}
