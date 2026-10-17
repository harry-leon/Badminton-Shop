'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, 
  ShoppingBag, 
  User, 
  Menu, 
  X, 
  ShieldCheck, 
  Sun, 
  Moon, 
  MapPin, 
  Package, 
  ChevronDown, 
  Phone, 
  Sparkles,
  ArrowRight,
  Flame,
  CheckCircle2,
  Clock,
  TrendingUp,
  Binoculars
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { CartDrawer } from './CartDrawer';
import { useCart } from '@/lib/cart-context';
import { Container } from '@/components/ui/Container';
import { PriceTag } from '@/components/ui/PriceTag';
import { SafeImage } from '@/components/ui/SafeImage';

const SEARCH_STORAGE_KEY = 'smash_recent_searches';
const TOP_SEARCHES = [
  'Yonex Astrox 99 Pro',
  'Astrox 100ZZ',
  'Arcsaber 11 Pro',
  'Lining Axforce 80',
  'Victor Ryuga II',
  'Dây cước BG65 Ti',
  'Vợt cũ hạng A',
  'Vợt thiên công',
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { cartCount, isCartOpen, setIsCartOpen, items, removeItem, cartTotal } = useCart();
  const [mounted, setMounted] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = React.useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = React.useState(false);
  const [miniCartOpen, setMiniCartOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [siteSettings, setSiteSettings] = React.useState<Record<string, string>>({
    hotline: '1900 6868',
    business_hours: '08:30 – 21:30',
  });

  // Search dropdown / mega menu state
  const [searchMenuOpen, setSearchMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const accountMenuRef = React.useRef<HTMLDivElement>(null);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);

  const megaMenuTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const miniCartTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Load recent searches
    try {
      const saved = localStorage.getItem(SEARCH_STORAGE_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {}

    // Close menus on click outside or escape
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchContainerRef.current && !searchContainerRef.current.contains(target)) {
        setSearchMenuOpen(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setAccountMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchMenuOpen(false);
        setAccountMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {});

    fetch('/api/catalog/storefront-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSiteSettings(data.settings);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pathname]);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 15);
      setRecentSearches(updated);
      localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const removeRecentSearch = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((s) => s !== term);
      setRecentSearches(updated);
      localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(SEARCH_STORAGE_KEY);
    } catch {}
  };

  const handleSearchSubmit = (e?: React.FormEvent, term?: string) => {
    if (e) e.preventDefault();
    const finalQuery = (term !== undefined ? term : searchQuery).trim();
    if (!finalQuery) return;
    saveRecentSearch(finalQuery);
    setSearchMenuOpen(false);
    router.push(`/tim-kiem?q=${encodeURIComponent(finalQuery)}`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setCurrentUser(null);
    setAccountMenuOpen(false);
    window.location.href = '/';
  };

  const handleMegaMenuEnter = () => {
    if (megaMenuTimeoutRef.current) clearTimeout(megaMenuTimeoutRef.current);
    setMegaMenuOpen(true);
  };

  const handleMegaMenuLeave = () => {
    megaMenuTimeoutRef.current = setTimeout(() => {
      setMegaMenuOpen(false);
    }, 200);
  };

  const handleMiniCartEnter = () => {
    if (miniCartTimeoutRef.current) clearTimeout(miniCartTimeoutRef.current);
    setMiniCartOpen(true);
  };

  const handleMiniCartLeave = () => {
    miniCartTimeoutRef.current = setTimeout(() => {
      setMiniCartOpen(false);
    }, 250);
  };

  const DEFAULT_NAV_LINKS = [
    { id: 'nav_secondhand', href: '/second-hand', label: 'VỢT CŨ KIỂM ĐỊNH', badge_text: '16 TIÊU CHÍ', badge_type: 'pill_2lines', bg_gradient: 'from-amber-400 to-amber-500', bg_color: '#f59e0b', text_color: '#020617', animation: 'shake', is_active: true },
    { id: 'nav_sale', href: '/vot-cau-long?sale=true', label: 'SALE OFF', badge_text: 'HOT DEAL', badge_type: 'badge', bg_color: '#f43f5e', text_color: '#ffffff', animation: 'shake', is_active: true },
    { id: 'nav_shoes', href: '/giay-cau-long', label: 'GIÀY CẦU LÔNG', badge_text: 'SALE', badge_type: 'pill', bg_color: '#e11d48', text_color: '#ffffff', animation: 'shake', is_active: true },
    { id: 'nav_branches', href: '/chi-nhanh', label: 'HỆ THỐNG CỬA HÀNG', badge_text: '', is_active: true },
    { id: 'nav_about', href: '/gioi-thieu', label: 'GIỚI THIỆU', badge_text: '', is_active: true },
    { id: 'nav_careers', href: '/tuyen-dung', label: 'TUYỂN DỤNG', badge_text: '', is_active: true },
  ];

  const [navItems, setNavItems] = React.useState<any[]>(DEFAULT_NAV_LINKS);

  React.useEffect(() => {
    fetch('/api/catalog/storefront-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSiteSettings(data.settings);
        }
        if (data.navItems && Array.isArray(data.navItems) && data.navItems.length > 0) {
          setNavItems(data.navItems.filter((item: any) => item.is_active !== false));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      {/* 1. TOP UTILITY STRIP (Học hỏi từ ShopVNB: Hotline, Showroom, Tra cứu) */}
      <div className="bg-[#0b1612] dark:bg-[#070e0b] text-zinc-300 text-[12px] border-b border-white/5 relative z-50">
        <Container className="flex items-center justify-between py-1.5 gap-4">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold text-white">HOTLINE:</span>
              <a
                href={`tel:${(siteSettings.hotline || '1900 6868').replace(/\s+/g, '')}`}
                className="text-emerald-400 font-bold hover:underline"
              >
                {siteSettings.hotline || '1900 6868'}
              </a>
              <span className="hidden md:inline text-zinc-400 text-[11px]">
                ({siteSettings.business_hours || '08:30 – 21:30'})
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-semibold text-white">SHOWROOM:</span>
              <Link href="/chi-nhanh" className="hover:text-emerald-300 transition-colors">
                3 Chi nhánh (HCM · Hà Nội · Đà Nẵng)
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 text-[11px] sm:text-[12px]">
            <Link 
              href="/tra-cuu-bao-hanh" 
              className="flex items-center gap-1 hover:text-emerald-300 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Tra cứu</span> bảo hành điện tử
            </Link>

            <span className="text-zinc-600">|</span>

            <Link 
              href="/tai-khoan" 
              className="flex items-center gap-1 hover:text-emerald-300 transition-colors"
            >
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Tra cứu</span> đơn hàng
            </Link>

            <span className="hidden sm:inline text-zinc-600">|</span>

            <Link 
              href="/second-hand" 
              className="hidden sm:flex items-center gap-1 text-amber-300 hover:text-amber-200 font-medium"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sàn vợt cũ 16 tiêu chí</span>
            </Link>
          </div>
        </Container>
      </div>

      {/* 2. MAIN HEADER BAR */}
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 border-b ${
          isScrolled
            ? 'bg-surface/95 backdrop-blur-md border-line shadow-xs py-2.5'
            : 'bg-surface/90 backdrop-blur-sm border-line/60 py-3.5'
        }`}
      >
        <Container className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group select-none">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 transition-transform duration-200 group-hover:scale-105">
                <img
                  src="/images/logo-shuttlecock-green-transparent.png"
                  alt="SmashCourt Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-ink leading-tight flex items-center">
                  Smash<span className="text-brand">Court</span>
                </span>
                <span className="text-[11px] sm:text-[11.5px] font-medium text-muted tracking-tight leading-none mt-0.5">
                  Vợt tốt trải nghiệm tốt
                </span>
              </div>
            </Link>
          </div>

          {/* Search bar with dropdown menu (ShopVNB / Mega Search style) */}
          <div ref={searchContainerRef} className="flex-1 max-w-xl hidden md:block relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div 
                className={`w-full flex items-center justify-between bg-bg hover:bg-surface border ${
                  searchMenuOpen ? 'border-brand ring-2 ring-brand/20 bg-surface' : 'border-line hover:border-brand/50'
                } rounded-full py-2 px-4 text-[13px] text-muted transition-all shadow-2xs group`}
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <Search className={`w-4 h-4 shrink-0 transition-colors ${searchMenuOpen ? 'text-brand' : 'text-muted group-hover:text-brand'}`} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchMenuOpen(true)}
                    placeholder="Tìm vợt Astrox, Lining Halbertec, cước BG65, giày cầu lông..."
                    className="w-full bg-transparent text-ink placeholder:text-muted/80 focus:outline-hidden text-[13px]"
                  />
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="text-muted hover:text-ink p-0.5 rounded-full hover:bg-line/60 transition-colors ml-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

            {/* BẢNG MENU TÌM KIẾM SỔ XUỐNG (SEARCH DROPDOWN / MEGA PANEL) */}
            {searchMenuOpen && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-surface border border-line rounded-2xl shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="grid grid-cols-2 gap-6 text-[13px]">
                  {/* Cột 1: TÌM KIẾM GẦN ĐÂY */}
                  <div className="space-y-3 border-r border-line/60 pr-5">
                    <div className="flex items-center justify-between pb-2 border-b border-line/50">
                      <div className="flex items-center gap-2 font-bold text-ink text-[13.5px]">
                        <Clock className="w-4 h-4 text-brand" />
                        <span>Tìm kiếm gần đây</span>
                      </div>
                      {recentSearches.length > 0 && (
                        <button
                          type="button"
                          onClick={clearAllRecent}
                          className="text-[12px] text-muted hover:text-red-500 font-normal transition-colors cursor-pointer"
                        >
                          Xóa tất cả
                        </button>
                      )}
                    </div>

                    {recentSearches.length === 0 ? (
                      <div className="py-8 text-center text-muted/70 text-[12.5px]">
                        Chưa có lịch sử tìm kiếm nào
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y divide-line/40 max-h-[300px] overflow-y-auto pr-1">
                        {recentSearches.slice(0, 7).map((term, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setSearchQuery(term);
                              handleSearchSubmit(undefined, term);
                            }}
                            className="group flex items-center justify-between py-2 px-2 rounded-lg hover:bg-bg transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <Clock className="w-3.5 h-3.5 text-muted shrink-0 group-hover:text-brand transition-colors" />
                              <span className="truncate text-ink font-normal group-hover:text-brand transition-colors">
                                {term}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => removeRecentSearch(term, e)}
                              className="opacity-40 group-hover:opacity-100 hover:text-red-500 p-1 rounded-sm transition-all ml-1.5 cursor-pointer"
                              title="Xóa"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cột 2: TOP TÌM KIẾM THỊNH HÀNH VỚI ICON SẤM SÉT HOẠT ẢNH & SỐ THỨ TỰ BÊN TRONG */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-line/50">
                      <div className="flex items-center gap-2 font-bold text-ink text-[13.5px]">
                        <TrendingUp className="w-4 h-4 text-amber-500 animate-pulse" />
                        <span>Top tìm kiếm thịnh hành</span>
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        HOT
                      </span>
                    </div>

                    <div className="flex flex-col divide-y divide-line/40 max-h-[300px] overflow-y-auto pr-1">
                      {TOP_SEARCHES.map((term, idx) => {
                        const rank = idx + 1;
                        const lightningColor = 
                          rank === 1 ? 'text-amber-500 fill-amber-500' :
                          rank === 2 ? 'text-orange-500 fill-orange-500' :
                          rank === 3 ? 'text-red-500 fill-red-500' :
                          rank === 4 ? 'text-emerald-500 fill-emerald-500' :
                          rank === 5 ? 'text-cyan-500 fill-cyan-500' :
                          'text-muted fill-muted/40';

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setSearchQuery(term);
                              handleSearchSubmit(undefined, term);
                            }}
                            className="group flex items-center justify-between py-2 px-2 rounded-lg hover:bg-bg transition-colors cursor-pointer text-left w-full"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {/* Biểu tượng sấm sét hoạt ảnh động với số thứ tự bên trong */}
                              <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
                                <svg
                                  viewBox="0 0 24 24"
                                  className={`w-6 h-6 animate-lightning ${lightningColor} transition-transform group-hover:scale-125`}
                                >
                                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                                </svg>
                                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] pointer-events-none select-none">
                                  {rank}
                                </span>
                              </div>
                              <span className="truncate text-ink font-medium group-hover:text-brand transition-colors">
                                {term}
                              </span>
                            </div>
                            <span className="text-[11px] text-muted group-hover:text-brand font-medium transition-colors shrink-0 ml-1">
                              Xem →
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons (Right) */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Mobile search button */}
            <Link
              href="/tim-kiem"
              className="md:hidden w-8 h-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-bg border border-transparent hover:border-line transition-colors"
              title="Tìm kiếm"
            >
              <Search className="w-4 h-4" />
            </Link>

            {/* Nút Chuyển Giao diện (Sáng / Tối) - Đồng bộ style với Tra cứu, Tài khoản, Giỏ hàng */}
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex flex-col items-center justify-center group cursor-pointer px-1"
                title={theme === 'dark' ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'}
              >
                <div className="w-10 h-10 rounded-full border border-line bg-surface flex items-center justify-center shadow-2xs group-hover:border-brand group-hover:bg-brand/5 transition-all">
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-amber-500 transition-transform group-hover:scale-110" />
                  ) : (
                    <Moon className="w-5 h-5 text-brand transition-transform group-hover:scale-110" />
                  )}
                </div>
                <span className="text-[10.5px] sm:text-[11px] font-bold text-ink uppercase tracking-tight mt-1 group-hover:text-brand transition-colors">
                  {theme === 'dark' ? 'GIAO DIỆN' : 'GIAO DIỆN'}
                </span>
              </button>
            )}

            {/* 1. NÚT TRA CỨU */}
            <Link
              href="/tra-cuu-bao-hanh"
              className="flex flex-col items-center justify-center group cursor-pointer px-1"
              title="Tra cứu bảo hành & đơn hàng"
            >
              <div className="w-10 h-10 rounded-full border border-line bg-surface flex items-center justify-center shadow-2xs group-hover:border-brand group-hover:bg-brand/5 transition-all">
                <Binoculars className="w-5 h-5 text-brand transition-transform group-hover:scale-110" />
              </div>
              <span className="text-[10.5px] sm:text-[11px] font-bold text-ink uppercase tracking-tight mt-1 group-hover:text-brand transition-colors">
                TRA CỨU
              </span>
            </Link>

            {/* 2. NÚT TÀI KHOẢN */}
            {mounted && (
              <div ref={accountMenuRef} className="relative">
                {currentUser ? (
                  <>
                    <button
                      onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                      className="flex flex-col items-center justify-center group cursor-pointer px-1"
                      title={`Tài khoản: ${currentUser.full_name}`}
                    >
                      <div className="w-10 h-10 rounded-full border border-line bg-surface flex items-center justify-center overflow-hidden shadow-2xs group-hover:border-brand group-hover:bg-brand/5 transition-all">
                        {currentUser.avatar_url ? (
                          <SafeImage
                            src={currentUser.avatar_url}
                            alt={currentUser.full_name}
                            width={38}
                            height={38}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-brand fill-brand transition-transform group-hover:scale-110" />
                        )}
                      </div>
                      <span className="text-[10.5px] sm:text-[11px] font-bold text-ink uppercase tracking-tight mt-1 group-hover:text-brand transition-colors">
                        TÀI KHOẢN
                      </span>
                    </button>

                    {accountMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-64 bg-surface border border-line rounded-2xl shadow-xl p-2 z-50 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                        onClick={() => setAccountMenuOpen(false)}
                      >
                        <div className="px-3 py-2 border-b border-line flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-bg border border-line shrink-0 flex items-center justify-center">
                            {currentUser.avatar_url ? (
                              <SafeImage
                                src={currentUser.avatar_url}
                                alt={currentUser.full_name}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-5 h-5 text-brand fill-brand" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-medium text-ink truncate">
                              {currentUser.full_name}
                            </div>
                            <div className="text-[12px] text-muted truncate">
                              {currentUser.email}
                            </div>
                            <div className="mt-1">
                              <span className="inline-block text-[11px] px-2 py-0.5 rounded-full bg-bg border border-line text-ink font-normal">
                                {currentUser.role === 'ADMIN' && 'Quản trị viên'}
                                {currentUser.role === 'BRANCH_MANAGER' && 'Quản lý chi nhánh'}
                                {currentUser.role === 'STAFF' && 'Nhân viên bán hàng'}
                                {currentUser.role === 'CUSTOMER' && 'Khách hàng thành viên'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <Link
                          href="/tai-khoan"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-ink hover:bg-bg transition-colors"
                        >
                          <Package className="w-4 h-4 text-brand" />
                          <span>Tài khoản &amp; Đơn mua</span>
                        </Link>

                        <Link
                          href="/tra-cuu-bao-hanh"
                          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-ink hover:bg-bg transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-brand" />
                          <span>Tra cứu bảo hành</span>
                        </Link>

                        {currentUser.role !== 'CUSTOMER' && (
                          <div className="pt-1 border-t border-line">
                            <Link
                              href="/portal"
                              className="flex items-center justify-between px-3 py-2 rounded-xl text-[13px] text-brand hover:bg-bg transition-colors font-medium"
                            >
                              <span>Cổng quản trị nội bộ</span>
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-bg text-muted font-normal">
                                {currentUser.branch_id || 'Admin'}
                              </span>
                            </Link>
                          </div>
                        )}

                        <div className="pt-1 border-t border-line">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer font-normal"
                          >
                            <span>Đăng xuất</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={pathname && pathname !== '/dang-nhap' ? `/dang-nhap?redirect=${encodeURIComponent(pathname)}` : '/dang-nhap'}
                    className="flex flex-col items-center justify-center group cursor-pointer px-1"
                    title="Đăng nhập / Đăng ký"
                  >
                    <div className="w-10 h-10 rounded-full border border-line bg-surface flex items-center justify-center shadow-2xs group-hover:border-brand group-hover:bg-brand/5 transition-all">
                      <User className="w-5 h-5 text-brand fill-brand transition-transform group-hover:scale-110" />
                    </div>
                    <span className="text-[10.5px] sm:text-[11px] font-bold text-ink uppercase tracking-tight mt-1 group-hover:text-brand transition-colors">
                      TÀI KHOẢN
                    </span>
                  </Link>
                )}
              </div>
            )}

            {/* 3. NÚT GIỎ HÀNG */}
            <div 
              className="relative"
              onMouseEnter={handleMiniCartEnter}
              onMouseLeave={handleMiniCartLeave}
            >
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex flex-col items-center justify-center group cursor-pointer px-1"
                title="Xem giỏ hàng"
              >
                <div className="relative w-10 h-10 rounded-full border border-line bg-surface flex items-center justify-center shadow-2xs group-hover:border-brand group-hover:bg-brand/5 transition-all">
                  {/* Icon xe đẩy mua hàng */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5 text-brand transition-transform group-hover:scale-110"
                  >
                    <circle cx="8" cy="21" r="1" fill="currentColor" />
                    <circle cx="19" cy="21" r="1" fill="currentColor" />
                    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                    <path d="m11 8 2 2 2-2" />
                    <path d="M13 5v5" />
                  </svg>

                  {/* Badge số lượng màu sale nổi bật */}
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-sale text-white text-[10px] font-bold flex items-center justify-center shadow-xs border-2 border-surface">
                    {cartCount}
                  </span>
                </div>
                <span className="text-[10.5px] sm:text-[11px] font-bold text-ink uppercase tracking-tight mt-1 group-hover:text-brand transition-colors">
                  GIỎ HÀNG
                </span>
              </button>

              {/* MINI-CART POPOVER DROPDOWN (Khi hover chuột) */}
              {miniCartOpen && (
                <div 
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface border border-line rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-1 text-ink"
                  onMouseEnter={handleMiniCartEnter}
                  onMouseLeave={handleMiniCartLeave}
                >
                  {items.length === 0 ? (
                    /* Trạng thái Giỏ hàng trống y hệt ShopVNB */
                    <div className="text-center py-6 px-2 space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-bg border border-line flex items-center justify-center text-muted">
                        <ShoppingBag className="w-8 h-8 stroke-1 text-muted" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[14px] font-medium text-ink">
                          Không có sản phẩm nào trong giỏ hàng
                        </h4>
                        <p className="text-[12px] text-muted">
                          Hãy chọn cây vợt hoặc phụ kiện bạn yêu thích để tiếp tục mua sắm.
                        </p>
                      </div>
                      <Link
                        href="/vot-cau-long"
                        onClick={() => setMiniCartOpen(false)}
                        className="inline-block px-4 py-2 bg-brand text-white text-[12px] font-medium rounded-full hover:bg-brand/90 transition-colors"
                      >
                        Tiếp tục mua sắm
                      </Link>
                    </div>
                  ) : (
                    /* Trạng thái Giỏ hàng có sản phẩm */
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-line text-[12px]">
                        <span className="font-medium text-ink">
                          Giỏ hàng ({cartCount} món)
                        </span>
                        <span className="text-brand font-medium">
                          Miễn phí vận chuyển
                        </span>
                      </div>

                      <div className="py-2 space-y-2.5 max-h-60 overflow-y-auto no-scrollbar divide-y divide-line/40">
                        {items.map((item) => (
                          <div key={item.id} className="pt-2 flex items-center gap-3 text-[12px]">
                            <div className="w-12 h-12 rounded-xl bg-bg border border-line p-1 relative overflow-hidden shrink-0 flex items-center justify-center">
                              <SafeImage
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-contain p-1"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-ink truncate">{item.name}</div>
                              <div className="text-[11px] text-muted">
                                SL: {item.quantity} · {item.sku}
                              </div>
                              <div className="font-medium text-brand">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-muted hover:text-red-500 text-[11px] p-1 cursor-pointer"
                              title="Xóa"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="pt-3 border-t border-line mt-2 space-y-3">
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="text-muted">Tổng cộng:</span>
                          <span className="text-[16px] font-bold text-ink">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal)}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[12px]">
                          <button
                            type="button"
                            onClick={() => {
                              setMiniCartOpen(false);
                              setIsCartOpen(true);
                            }}
                            className="w-full py-2 bg-bg hover:bg-surface border border-line text-ink font-medium rounded-xl transition-colors text-center"
                          >
                            Xem giỏ hàng
                          </button>
                          <Link
                            href="/checkout"
                            onClick={() => setMiniCartOpen(false)}
                            className="w-full py-2 bg-ink text-bg font-medium rounded-xl hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-1"
                          >
                            <span>Thanh toán</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hamburger button (Mobile) */}
            <div ref={mobileMenuRef} className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink hover:bg-bg transition-colors cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </Container>
      </header>

      {/* 3. NAVIGATION BAR & MEGA MENU TRIGGER (HỌC HỎI TỪ SHOPVNB ẢNH 2) */}
      <nav className="hidden md:block bg-surface border-b border-line relative z-30">
        <Container className="flex items-center justify-between">
          <div className="flex items-center gap-1 lg:gap-2">
            
            {/* 1. TRANG CHỦ — NGOÀI CÙNG BÊN TRÁI */}
            <Link
              href="/"
              className={`px-3 py-2.5 text-[13px] tracking-tight font-medium transition-colors flex items-center group relative ${
                pathname === '/'
                  ? 'text-brand font-bold'
                  : 'text-ink/85 hover:text-brand'
              }`}
            >
              <span className="relative inline-flex items-center">
                <span>TRANG CHỦ</span>
                {pathname === '/' && (
                  <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-brand rounded-full animate-in fade-in" />
                )}
              </span>
            </Link>

            {/* 2. DANH MỤC SẢN PHẨM — CÙNG STYLE VỚI CÁC MENU KHÁC */}
            <div 
              className="relative"
              onMouseEnter={handleMegaMenuEnter}
              onMouseLeave={handleMegaMenuLeave}
            >
              <button
                type="button"
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className={`px-3 py-2.5 text-[13px] tracking-tight font-medium transition-colors flex items-center gap-1 group relative cursor-pointer ${
                  megaMenuOpen
                    ? 'text-brand font-bold'
                    : 'text-ink/85 hover:text-brand'
                }`}
              >
                <span className="relative inline-flex items-center gap-1">
                  <span>DANH MỤC SẢN PHẨM</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${megaMenuOpen ? 'rotate-180 text-brand' : 'text-muted group-hover:text-brand'}`} />
                  {megaMenuOpen && (
                    <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-brand rounded-full animate-in fade-in" />
                  )}
                </span>
              </button>


              {/* ======================================================= */}
              {/* MEGA MENU 5 CỘT PHÂN TẦNG ĐA THƯƠNG HIỆU (SHOPVNB STYLE) */}
              {/* ======================================================= */}
              {megaMenuOpen && (
                <div 
                  className="fixed left-0 right-0 top-auto mt-0 w-full bg-surface border-b-2 border-brand shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 py-10"
                  onMouseEnter={handleMegaMenuEnter}
                  onMouseLeave={handleMegaMenuLeave}
                >
                  <Container>
                    <div className="grid grid-cols-5 gap-8 text-[13.5px]">
                      
                      {/* Cột 1: VỢT CẦU LÔNG */}
                      <div className="space-y-4 border-r border-line pr-6 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-ink uppercase tracking-wide pb-2.5 mb-3 border-b-2 border-brand flex items-center justify-between text-[14px]">
                            <Link href="/vot-cau-long" className="hover:text-brand">VỢT CẦU LÔNG</Link>
                            <span className="text-[10px] bg-red-100 text-red-600 dark:bg-red-950/80 dark:text-red-400 px-1.5 py-0.5 rounded font-bold">HOT</span>
                          </div>
                          <div className="space-y-2.5 text-muted">
                            <Link href="/vot-cau-long?brand=Yonex" className="flex items-center justify-between hover:text-brand hover:font-medium py-0.5">
                              <span>Vợt cầu lông Yonex</span>
                              <span className="text-[9px] bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 px-1.5 py-0.2 rounded font-semibold">HOT</span>
                            </Link>
                            <Link href="/vot-cau-long?brand=Victor" className="block hover:text-brand hover:font-medium py-0.5">
                              Vợt cầu lông Victor
                            </Link>
                            <Link href="/vot-cau-long?brand=Li-Ning" className="flex items-center justify-between hover:text-brand hover:font-medium py-0.5">
                              <span>Vợt cầu lông Li-Ning</span>
                              <span className="text-[9px] bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 px-1.5 py-0.2 rounded font-semibold">MỚI</span>
                            </Link>
                            <Link href="/vot-cau-long?brand=Mizuno" className="block hover:text-brand hover:font-medium py-0.5">
                              Vợt cầu lông Mizuno
                            </Link>
                            <Link href="/vot-cau-long?brand=Apacs" className="block hover:text-brand hover:font-medium py-0.5">
                              Vợt cầu lông Apacs
                            </Link>
                            <Link href="/vot-cau-long?brand=Kawasaki" className="block hover:text-brand hover:font-medium py-0.5">
                              Vợt cầu lông Kawasaki
                            </Link>
                          </div>
                        </div>
                        <div className="pt-2">
                          <Link href="/vot-cau-long" className="block text-brand font-semibold hover:underline">
                            Xem tất cả vợt mới (+250) →
                          </Link>
                        </div>
                      </div>

                      {/* Cột 2: GIÀY CẦU LÔNG */}
                      <div className="space-y-4 border-r border-line pr-6 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-ink uppercase tracking-wide pb-2.5 mb-3 border-b-2 border-brand flex items-center justify-between text-[14px]">
                            <Link href="/giay-cau-long" className="hover:text-brand">GIÀY CẦU LÔNG</Link>
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">NEW</span>
                          </div>
                          <div className="space-y-2.5 text-muted">
                            <Link href="/giay-cau-long?brand=Yonex" className="flex items-center justify-between hover:text-brand hover:font-medium py-0.5">
                              <span>Giày cầu lông Yonex</span>
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 px-1.5 py-0.2 rounded font-semibold">NEW</span>
                            </Link>
                            <Link href="/giay-cau-long?brand=Victor" className="block hover:text-brand hover:font-medium py-0.5">
                              Giày cầu lông Victor
                            </Link>
                            <Link href="/giay-cau-long?brand=Li-Ning" className="block hover:text-brand hover:font-medium py-0.5">
                              Giày cầu lông Li-Ning
                            </Link>
                            <Link href="/giay-cau-long?brand=Mizuno" className="block hover:text-brand hover:font-medium py-0.5">
                              Giày cầu lông Mizuno
                            </Link>
                            <Link href="/giay-cau-long" className="flex items-center justify-between hover:text-brand hover:font-medium py-0.5">
                              <span>Giày bám sân Kawasaki</span>
                              <span className="text-[9px] bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 px-1.5 py-0.2 rounded font-semibold">GIÁ RẺ</span>
                            </Link>
                            <Link href="/giay-cau-long" className="block hover:text-brand hover:font-medium py-0.5">
                              Lót giày êm chân Wave Foam
                            </Link>
                          </div>
                        </div>
                        <div className="pt-2">
                          <Link href="/giay-cau-long" className="block text-brand font-semibold hover:underline">
                            Xem tất cả giày cầu lông →
                          </Link>
                        </div>
                      </div>

                      {/* Cột 3: ÁO QUẦN THỂ THAO */}
                      <div className="space-y-4 border-r border-line pr-6 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-ink uppercase tracking-wide pb-2.5 mb-3 border-b-2 border-brand flex items-center justify-between text-[14px]">
                            <Link href="/quan-ao" className="hover:text-brand">TRANG PHỤC THI ĐẤU</Link>
                            <span className="text-[10px] bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold">SALE -30%</span>
                          </div>
                          <div className="space-y-2.5 text-muted">
                            <Link href="/quan-ao" className="block hover:text-brand hover:font-medium py-0.5">
                              Áo cầu lông Yonex / Victor
                            </Link>
                            <Link href="/quan-ao" className="flex items-center justify-between hover:text-brand hover:font-medium py-0.5">
                              <span>Áo đấu giải BWF World Tour</span>
                              <span className="text-[9px] bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 px-1.5 py-0.2 rounded font-semibold">SALE</span>
                            </Link>
                            <Link href="/quan-ao" className="block hover:text-brand hover:font-medium py-0.5">
                              Quần cầu lông chuyên dụng
                            </Link>
                            <Link href="/quan-ao" className="block hover:text-brand hover:font-medium py-0.5">
                              Váy cầu lông nữ thể thao
                            </Link>
                            <Link href="/quan-ao" className="block hover:text-brand hover:font-medium py-0.5">
                              Áo khoác thể thao cản gió
                            </Link>
                            <Link href="/quan-ao" className="block hover:text-brand hover:font-medium py-0.5">
                              Tất dệt đệm gót chống trượt
                            </Link>
                          </div>
                        </div>
                        <div className="pt-2">
                          <Link href="/quan-ao" className="block text-brand font-semibold hover:underline">
                            Xem thời trang thể thao →
                          </Link>
                        </div>
                      </div>

                      {/* Cột 4: CƯỚC & PHỤ KIỆN */}
                      <div className="space-y-4 border-r border-line pr-6 flex flex-col justify-between">
                        <div>
                          <div className="font-bold text-ink uppercase tracking-wide pb-2.5 mb-3 border-b-2 border-brand flex items-center justify-between text-[14px]">
                            <Link href="/phu-kien" className="hover:text-brand">CƯỚC & PHỤ KIỆN</Link>
                            <span className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400 px-1.5 py-0.5 rounded font-bold">BEST</span>
                          </div>
                          <div className="space-y-2.5 text-muted">
                            <Link href="/day-cuoc" className="flex items-center justify-between hover:text-brand hover:font-medium py-0.5">
                              <span>Dây cước đan (BG65, 66UM)</span>
                              <span className="text-[9px] bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 px-1.5 py-0.2 rounded font-semibold">TOP 1</span>
                            </Link>
                            <Link href="/quan-can" className="flex items-center justify-between hover:text-brand hover:font-medium py-0.5">
                              <span>Quấn cán vợt AC102EX</span>
                              <span className="text-[9px] bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 px-1.5 py-0.2 rounded font-semibold">COMBO</span>
                            </Link>
                            <Link href="/tui-bao-vot" className="block hover:text-brand hover:font-medium py-0.5">
                              Túi &amp; Balo đựng vợt
                            </Link>
                            <Link href="/qua-cau-long" className="block hover:text-brand hover:font-medium py-0.5">
                              Quả cầu lông thi đấu
                            </Link>
                            <Link href="/luoi-cau-long" className="block hover:text-brand hover:font-medium py-0.5">
                              Lưới &amp; Cột cầu lông tiêu chuẩn
                            </Link>
                            <Link href="/phu-kien" className="block hover:text-brand hover:font-medium py-0.5">
                              Băng bảo vệ khớp gối &amp; cổ tay
                            </Link>
                          </div>
                        </div>
                        <div className="pt-2">
                          <Link href="/phu-kien" className="block text-brand font-semibold hover:underline">
                            Xem tất cả phụ kiện →
                          </Link>
                        </div>
                      </div>

                      {/* Cột 5: ĐẶC QUYỀN SMASHCOURT (VỢT CŨ 16 TIÊU CHÍ) */}
                      <div className="bg-gradient-to-br from-brand/5 to-brand/10 border border-brand/20 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                        <div className="space-y-2.5">
                          <span className="inline-block px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-brand text-white uppercase tracking-wider">
                            Độc quyền SmashCourt
                          </span>
                          <h4 className="font-bold text-ink text-[15px] pt-1">
                            Sàn Vợt Cũ Kiểm Định
                          </h4>
                          <p className="text-[12.5px] text-muted leading-relaxed">
                            Quy trình 16 tiêu chí tại quầy: Kiểm tra nứt ngầm máy nội soi, sụp gen, cam kết mã serial chính hãng.
                          </p>
                          <div className="pt-1.5 space-y-1 text-[12px] text-ink/80">
                            <div>✓ Tiết kiệm 30% - 50% so với mua mới</div>
                            <div>✓ Bảo hành kết cấu khung 30 ngày</div>
                            <div>✓ Thu cũ đổi mới trợ giá 15%</div>
                          </div>
                        </div>
                        <div className="pt-4">
                          <Link
                            href="/second-hand"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-ink text-bg text-[12.5px] font-semibold hover:opacity-90 transition-opacity w-full justify-center shadow-xs"
                          >
                            <span>Khám phá kho vợt cũ</span>
                            <span>→</span>
                          </Link>
                        </div>
                      </div>

                    </div>
                  </Container>
                </div>
              )}
            </div>

            {/* Main Navigation Links (Linh hoạt từ Storefront Config / Admin Portal) */}
            {navItems.map((link) => {
              const isActive = pathname === link.href;
              const hasBadge = Boolean(link.badge_text && link.badge_text.trim());
              const animClass = link.animation === 'shake' ? 'animate-badge-shake' : link.animation === 'pulse' ? 'animate-pulse' : '';

              return (
                <Link
                  key={link.id || link.href}
                  href={link.href}
                  className={`px-3 py-2.5 text-[13px] tracking-tight font-medium transition-colors flex items-center group relative ${
                    isActive
                      ? 'text-brand font-bold'
                      : 'text-ink/85 hover:text-brand'
                  }`}
                >
                  <span className="relative inline-flex items-center">
                    <span>{link.label}</span>

                    {/* Huy hiệu tùy biến từ Admin */}
                    {hasBadge && (
                      <span className={`absolute -top-3 -right-7 select-none pointer-events-none z-10 ${animClass}`}>
                        {link.badge_type === 'pill_2lines' ? (
                          <span 
                            className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-full shadow-2xs border border-amber-300/80 ${
                              link.bg_gradient ? `bg-gradient-to-r ${link.bg_gradient}` : ''
                            }`}
                            style={{ 
                              backgroundColor: !link.bg_gradient && link.bg_color ? link.bg_color : undefined,
                              color: link.text_color || '#020617' 
                            }}
                          >
                            <span className="flex flex-col text-[6.5px] font-black leading-[7px] text-center tracking-tighter uppercase whitespace-nowrap">
                              {link.badge_text.includes(' ') ? (
                                <>
                                  <span>{link.badge_text.split(' ').slice(0, Math.ceil(link.badge_text.split(' ').length / 2)).join(' ')}</span>
                                  <span>{link.badge_text.split(' ').slice(Math.ceil(link.badge_text.split(' ').length / 2)).join(' ')}</span>
                                </>
                              ) : (
                                <span>{link.badge_text}</span>
                              )}
                            </span>
                          </span>
                        ) : (
                          <span 
                            className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-full shadow-2xs"
                            style={{ 
                              backgroundColor: link.bg_color || '#f43f5e',
                              color: link.text_color || '#ffffff' 
                            }}
                          >
                            <span className="text-[7px] font-black text-center tracking-tighter uppercase whitespace-nowrap">
                              {link.badge_text}
                            </span>
                          </span>
                        )}
                      </span>
                    )}

                    {/* Active line indicator */}
                    {isActive && (
                      <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-brand rounded-full animate-in fade-in" />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </Container>
      </nav>

      {/* 4. MOBILE MENU DROPDOWN */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-surface/95 backdrop-blur-md px-4 py-4 space-y-3">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block px-2">
              Danh mục sản phẩm
            </span>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <Link
                href="/vot-cau-long"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-bg text-[13px] text-ink font-medium"
              >
                Vợt cầu lông mới
              </Link>
              <Link
                href="/second-hand"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-amber-500/10 text-amber-900 dark:text-amber-200 text-[13px] font-bold"
              >
                Vợt cũ kiểm định ⭐
              </Link>
              <Link
                href="/giay-cau-long"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-bg text-[13px] text-ink font-medium"
              >
                Giày cầu lông
              </Link>
              <Link
                href="/day-cuoc"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-bg text-[13px] text-ink font-medium"
              >
                Dây cước đan vợt
              </Link>
              <Link
                href="/quan-ao"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-bg text-[13px] text-ink font-medium"
              >
                Quần áo thi đấu
              </Link>
              <Link
                href="/phu-kien"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-bg text-[13px] text-ink font-medium"
              >
                Phụ kiện &amp; Túi vợt
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t border-line/60 space-y-1">
            <Link
              href="/chi-nhanh"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-[13px] text-ink hover:bg-bg font-medium"
            >
              Hệ thống 3 Showroom (HCM · HN · ĐN)
            </Link>
            <Link
              href="/tra-cuu-bao-hanh"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-[13px] text-ink hover:bg-bg font-medium"
            >
              Tra cứu bảo hành điện tử
            </Link>
            <Link
              href="/tai-khoan"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-[13px] text-ink hover:bg-bg font-medium"
            >
              Tra cứu đơn hàng
            </Link>
          </div>

          <div className="pt-2 border-t border-line/60">
            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-[13px] text-red-600 font-medium"
              >
                Đăng xuất ({currentUser.full_name})
              </button>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link
                  href="/dang-nhap"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-xl border border-line bg-surface text-[13px] font-medium"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dang-nhap?mode=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 text-center py-2 rounded-xl bg-ink text-bg text-[13px] font-medium"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

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
