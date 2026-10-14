'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, User, Menu, X, ShieldCheck, Sun, Moon, MapPin, Package } from 'lucide-react';
import { useTheme } from 'next-themes';
import { CommandSearch } from './CommandSearch';
import { CartDrawer } from './CartDrawer';
import { useCart } from '@/lib/cart-context';

import { Container } from '@/components/ui/Container';

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { cartCount, isCartOpen, setIsCartOpen, items, removeItem } = useCart();
  const [mounted, setMounted] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
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
    { href: '/chi-nhanh', label: 'Chi nhánh' },
    { href: '/tra-cuu-bao-hanh', label: 'Bảo hành' },
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
        <Container className="flex items-center justify-between gap-2 sm:gap-4">
          {/* 1. Logo chữ tối giản */}
          <div className="flex items-center gap-3 sm:gap-6">
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
                    className={`text-[14px] transition-colors relative py-1 ${
                      isActive
                        ? 'text-ink font-medium'
                        : 'text-muted hover:text-ink font-normal'
                    }`}
                  >
                    {link.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 2. Actions: Search, Dark Mode, Account, Cart */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
            {/* ⌘K Search trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center gap-2 text-[13px] text-muted hover:text-ink bg-bg hover:bg-surface border border-line w-8 h-8 sm:w-auto sm:px-3 sm:py-1.5 rounded-full transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4 text-muted" />
              <span className="hidden sm:inline">Tìm kiếm...</span>
              <kbd className="hidden sm:inline-flex text-[11px] px-1.5 py-0.5 rounded bg-surface border border-line text-muted font-sans">
                ⌘K
              </kbd>
            </button>

            {/* Dark mode toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-bg border border-transparent hover:border-line transition-colors cursor-pointer"
                title="Chuyển chế độ sáng/tối"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Menu tài khoản */}
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-bg border border-transparent hover:border-line transition-colors cursor-pointer"
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
                    href="/account"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[14px] text-ink hover:bg-bg transition-colors"
                  >
                    <Package className="w-4 h-4 text-brand" />
                    <span>Tài khoản & Đơn mua</span>
                  </Link>
                  <Link
                    href="/tra-cuu-bao-hanh"
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[14px] text-ink hover:bg-bg transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-brand" />
                    <span>Tra cứu bảo hành</span>
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
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-ink hover:bg-bg border border-transparent hover:border-line transition-colors cursor-pointer"
              title="Xem giỏ hàng"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-ink text-bg text-[10px] font-medium flex items-center justify-center animate-in zoom-in duration-150">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Nút Hamburger menu Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-ink hover:bg-bg transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </Container>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-line bg-surface/95 backdrop-blur-md px-4 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-[14px] text-ink hover:bg-bg font-normal"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/account"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-[14px] text-ink hover:bg-bg font-normal border-t border-line/60 pt-3"
            >
              Tài khoản & Đơn mua
            </Link>
          </div>
        )}
      </header>

      {/* Global Command Search Dialog */}
      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Global Cart Drawer */}
      <CartDrawer
        open={isCartOpen}
        onOpenChange={setIsCartOpen}
        items={items}
        onRemoveItem={removeItem}
      />
    </>
  );
}
