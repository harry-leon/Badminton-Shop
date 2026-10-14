'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  AdminProvider, 
  useAdmin 
} from '@/lib/admin-context';
import {
  LayoutDashboard,
  Boxes,
  ShoppingBag,
  ShieldCheck,
  Wrench,
  Store,
  ChevronDown,
  Menu,
  X,
  Search,
  ExternalLink,
  SlidersHorizontal,
  UserCheck,
  Building2,
  Check
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/inventory', label: 'Kho & điều chuyển', icon: Boxes },
  { href: '/admin/orders', label: 'Đơn hàng & VietQR', icon: ShoppingBag },
  { href: '/admin/secondhand', label: 'Thu mua vợt cũ', icon: ShieldCheck },
  { href: '/admin/warranty', label: 'Xử lý bảo hành', icon: Wrench },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    selectedBranch, 
    setSelectedBranch, 
    currentRole, 
    setCurrentRole, 
    density, 
    setDensity,
    branches, 
    activeBranchInfo 
  } = useAdmin();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Lắng nghe ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchModalOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setSearchModalOpen(false);
        setBranchDropdownOpen(false);
        setRoleDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getBreadcrumbTitle = () => {
    if (pathname === '/admin') return 'Tổng quan';
    if (pathname.includes('/admin/inventory')) return 'Kho & điều chuyển hàng';
    if (pathname.includes('/admin/orders')) return 'Đơn hàng & đối soát VietQR';
    if (pathname.includes('/admin/secondhand')) return 'Thu mua & kiểm định vợt cũ';
    if (pathname.includes('/admin/warranty')) return 'Hồ sơ & tiếp nhận bảo hành';
    return 'Khu quản trị';
  };

  const filteredNavItems = searchQuery
    ? NAV_ITEMS.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : NAV_ITEMS;

  return (
    <div className="min-h-screen bg-[#F5F4F0] flex flex-col md:flex-row text-[#111613]">
      {/* 1. Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#111613] text-[#F5F4F0] flex-col border-r border-white/10 shrink-0 sticky top-0 h-screen z-30">
        {/* Logo & Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F5132] flex items-center justify-center text-white font-medium text-sm">
              SC
            </div>
            <div>
              <div className="font-medium text-sm tracking-tight text-white flex items-center gap-1.5">
                Smash Court
                <span className="text-[10px] bg-white/10 text-[#C8F31D] px-1.5 py-0.2 rounded font-normal">
                  Admin
                </span>
              </div>
              <div className="text-[11px] text-[#A2A9A5]">Cổng vận hành nội bộ</div>
            </div>
          </Link>
        </div>

        {/* Branch Switcher (Team Switcher) */}
        <div className="p-3 border-b border-white/10 relative">
          <label className="text-[11px] text-[#A2A9A5] block mb-1">Chi nhánh làm việc</label>
          <button
            type="button"
            onClick={() => {
              setBranchDropdownOpen(!branchDropdownOpen);
              setRoleDropdownOpen(false);
            }}
            className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-left text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-[#C8F31D] shrink-0" />
              <div className="truncate">
                <div className="font-medium text-white truncate">{activeBranchInfo.name}</div>
                <div className="text-[10px] text-[#A2A9A5]">{activeBranchInfo.city}</div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#A2A9A5] shrink-0 ml-1" />
          </button>

          {/* Branch Dropdown */}
          {branchDropdownOpen && (
            <div className="absolute top-full left-3 right-3 mt-1 bg-[#1A201C] rounded-lg border border-white/15 shadow-xl p-1 z-50">
              {branches.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBranch(b.id);
                    setBranchDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded text-xs transition-colors text-left ${
                    selectedBranch === b.id ? 'bg-[#0F5132] text-white' : 'hover:bg-white/5 text-[#D1D5D2]'
                  }`}
                >
                  <div>
                    <div className="font-medium">{b.name}</div>
                    <div className="text-[10px] opacity-75">{b.address}</div>
                  </div>
                  {selectedBranch === b.id && <Check className="w-3.5 h-3.5 shrink-0 ml-1 text-[#C8F31D]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <div className="text-[11px] text-[#A2A9A5] px-2 py-1">Nghiệp vụ chi nhánh</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/admin' 
              ? pathname === '/admin' 
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-normal transition-colors ${
                  isActive
                    ? 'bg-[#0F5132] text-white font-medium shadow-sm'
                    : 'text-[#D1D5D2] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#C8F31D]' : 'text-[#A2A9A5]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer controls: Density & Storefront Link */}
        <div className="p-3 border-t border-white/10 space-y-2 text-xs">
          {/* Role selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setRoleDropdownOpen(!roleDropdownOpen);
                setBranchDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-[11px] text-[#A2A9A5]"
            >
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#0F5132]" />
                Vai trò: <strong className="text-white font-medium">{currentRole}</strong>
              </span>
              <ChevronDown className="w-3 h-3 text-[#A2A9A5]" />
            </button>
            {roleDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#1A201C] rounded-lg border border-white/15 shadow-xl p-1 z-50">
                {(['BRANCH_MANAGER', 'STAFF', 'ADMIN'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setCurrentRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors flex items-center justify-between ${
                      currentRole === r ? 'bg-[#0F5132] text-white' : 'text-[#D1D5D2] hover:bg-white/5'
                    }`}
                  >
                    <span>{r}</span>
                    {currentRole === r && <Check className="w-3 h-3 text-[#C8F31D]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Density Switcher */}
          <div className="flex items-center justify-between px-2.5 py-1 text-[11px] text-[#A2A9A5]">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Mật độ bảng
            </span>
            <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded">
              <button
                type="button"
                onClick={() => setDensity('normal')}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  density === 'normal' ? 'bg-[#0F5132] text-white' : 'text-[#A2A9A5] hover:text-white'
                }`}
              >
                Chuẩn
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`px-1.5 py-0.5 rounded text-[10px] ${
                  density === 'compact' ? 'bg-[#0F5132] text-white' : 'text-[#A2A9A5] hover:text-white'
                }`}
              >
                Đặc
              </button>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[#A2A9A5] hover:text-white hover:bg-white/5 transition-colors text-[11px]"
          >
            <span className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" />
              Xem cửa hàng khách
            </span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header / Breadcrumb Bar */}
        <header className="bg-white border-b border-[#E4E3DD] sticky top-0 z-20 px-4 py-2.5 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-stone-100 text-stone-600"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-[#6A726E]">
              <Link href="/admin" className="hover:text-[#111613]">Khu quản trị</Link>
              <span>/</span>
              <span className="text-[#111613] font-medium">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2.5">
            {/* ⌘K Trigger Button */}
            <button
              type="button"
              onClick={() => setSearchModalOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-[#E4E3DD] bg-stone-50 hover:bg-stone-100 text-xs text-[#6A726E] transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline">Tìm nhanh...</span>
              <kbd className="hidden sm:inline-block px-1 py-0.2 text-[10px] bg-white border border-[#E4E3DD] rounded text-stone-500">
                ⌘K
              </kbd>
            </button>

            {/* Branch Pill badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-[#0F5132]/10 text-[#0F5132] border border-[#0F5132]/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132]" />
              <span>{activeBranchInfo.id}</span>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 3. Mobile Sheet Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-[#111613] text-[#F5F4F0] flex flex-col h-full shadow-2xl z-10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="font-medium text-sm text-white flex items-center gap-2">
                <span className="text-[#C8F31D]">Smash Court</span> Quản Trị
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Branch Switcher */}
            <div className="p-3 border-b border-white/10">
              <label className="text-[11px] text-[#A2A9A5] block mb-1">Chi nhánh</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full bg-[#1A201C] text-white border border-white/15 rounded-lg p-2 text-xs"
              >
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Nav links */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === '/admin' 
                  ? pathname === '/admin' 
                  : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors ${
                      isActive ? 'bg-[#0F5132] text-white font-medium' : 'text-[#D1D5D2] hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10">
              <Link
                href="/"
                className="flex items-center justify-between text-xs text-[#A2A9A5] hover:text-white"
              >
                <span>Xem Storefront</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Command Search Modal (⌘K) */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setSearchModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#E4E3DD] overflow-hidden z-10">
            <div className="flex items-center px-3.5 border-b border-[#E4E3DD]">
              <Search className="w-4 h-4 text-stone-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm trang quản trị hoặc nghiệp vụ..."
                autoFocus
                className="w-full py-3 text-xs bg-transparent focus:outline-none text-[#111613]"
              />
              <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                ESC
              </span>
            </div>

            <div className="p-2 max-h-72 overflow-y-auto space-y-1">
              <div className="text-[11px] text-stone-400 px-2 py-1">Điều hướng nhanh</div>
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      router.push(item.href);
                      setSearchModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs hover:bg-[#F5F4F0] text-left transition-colors"
                  >
                    <span className="flex items-center gap-2.5 text-[#111613]">
                      <Icon className="w-4 h-4 text-[#0F5132]" />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">{item.href}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <AdminLayoutInner>
        {children}
      </AdminLayoutInner>
    </AdminProvider>
  );
}
