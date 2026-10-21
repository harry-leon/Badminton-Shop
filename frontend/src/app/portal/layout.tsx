'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  AdminProvider, 
  useAdmin 
} from '@/lib/admin-context';
import { Toaster } from 'sonner';
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
  Check,
  PackageOpen,
  Megaphone,
  Users,
  Star,
  Activity,
  BarChart3,
  ScrollText,
  Briefcase,
  RefreshCw
} from 'lucide-react';

interface NavChildItem {
  href: string;
  label: string;
  tabKey?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  requiredPermission: string;
  children?: NavChildItem[];
}

const NAV_ITEMS: NavItem[] = [
  { href: '/portal', label: 'Tổng quan', icon: LayoutDashboard, requiredPermission: 'dashboard:view' },
  { 
    href: '/portal/products', 
    label: 'Quản lý sản phẩm', 
    icon: PackageOpen, 
    requiredPermission: 'products:view',
    children: [
      { href: '/portal/products', label: 'Sản phẩm & SKU' },
      { href: '/portal/products/taxonomy', label: 'Thương hiệu & Danh mục' },
      { href: '/portal/products/tags', label: 'Quản lý Thẻ Tag' },
    ]
  },
  { 
    href: '/portal/banners', 
    label: 'Storefront CMS & Banners', 
    icon: Megaphone, 
    requiredPermission: 'banners:manage',
    children: [
      { href: '/portal/banners?tab=hero', label: 'Hero Slide Carousel', tabKey: 'hero' },
      { href: '/portal/banners?tab=midpage', label: 'Banner giữa trang', tabKey: 'midpage' },
      { href: '/portal/banners?tab=popup', label: 'Popup khuyến mãi', tabKey: 'popup' },
      { href: '/portal/banners?tab=promo', label: 'Bộ 3 banner ưu đãi', tabKey: 'promo' },
      { href: '/portal/banners?tab=categories', label: 'Ảnh danh mục nổi bật', tabKey: 'categories' },
      { href: '/portal/banners?tab=usp', label: 'Cam kết & Đại sứ VĐV', tabKey: 'usp' },
      { href: '/portal/banners?tab=navtags', label: 'Menu Tags điều hướng', tabKey: 'navtags' },
      { href: '/portal/banners?tab=settings', label: 'Cài đặt Header/Footer', tabKey: 'settings' },
    ]
  },
  { 
    href: '/portal/inventory', 
    label: 'Kho & điều chuyển', 
    icon: Boxes, 
    requiredPermission: 'inventory:view',
    children: [
      { href: '/portal/inventory?tab=STOCK', label: 'Tồn kho chi nhánh', tabKey: 'STOCK' },
      { href: '/portal/inventory?tab=TRANSFERS', label: 'Điều chuyển liên kho', tabKey: 'TRANSFERS' },
      { href: '/portal/inventory?tab=PURCHASE_ORDERS', label: 'Nhập kho nhà cung cấp', tabKey: 'PURCHASE_ORDERS' },
      { href: '/portal/inventory?tab=MOVEMENTS', label: 'Sổ cái xuất nhập R10', tabKey: 'MOVEMENTS' },
    ]
  },
  { 
    href: '/portal/orders', 
    label: 'Đơn hàng & VietQR', 
    icon: ShoppingBag, 
    requiredPermission: 'orders:view',
    children: [
      { href: '/portal/orders?tab=ORDERS', label: 'Danh sách đơn hàng', tabKey: 'ORDERS' },
      { href: '/portal/orders?tab=REFUNDS', label: 'Yêu cầu hoàn tiền', tabKey: 'REFUNDS' },
    ]
  },
  { href: '/portal/stringing', label: 'Dịch vụ căng cước', icon: Activity, requiredPermission: 'stringing:view' },
  { 
    href: '/portal/secondhand', 
    label: 'Thu mua vợt cũ', 
    icon: ShieldCheck, 
    requiredPermission: 'secondhand:view',
    children: [
      { href: '/portal/secondhand?tab=WIZARD', label: 'Wizard kiểm định thu mua', tabKey: 'WIZARD' },
      { href: '/portal/secondhand?tab=RESALE_APPROVAL', label: 'Duyệt mở bán hàng cũ', tabKey: 'RESALE_APPROVAL' },
      { href: '/portal/secondhand?tab=PRICE_TABLES', label: 'Bảng giá chuẩn BWF', tabKey: 'PRICE_TABLES' },
    ]
  },
  { 
    href: '/portal/warranty', 
    label: 'Xử lý bảo hành', 
    icon: Wrench, 
    requiredPermission: 'warranty:view',
    children: [
      { href: '/portal/warranty?tab=CLAIMS', label: 'Hồ sơ bảo hành', tabKey: 'CLAIMS' },
      { href: '/portal/warranty?tab=POLICIES', label: 'Chính sách bảo hành', tabKey: 'POLICIES' },
    ]
  },
  { href: '/portal/reviews', label: 'Đánh giá sản phẩm', icon: Star, requiredPermission: 'reviews:view' },
  { href: '/portal/customers', label: 'Khách hàng (CRM)', icon: Users, requiredPermission: 'customers:view' },
  { href: '/portal/users', label: 'Quản lý nhân viên', icon: UserCheck, requiredPermission: 'users:view' },
  { 
    href: '/portal/recruitment', 
    label: 'Tuyển dụng chi nhánh', 
    icon: Briefcase, 
    requiredPermission: 'recruitment:view',
    children: [
      { href: '/portal/recruitment?tab=JOBS', label: 'Tin tuyển dụng', tabKey: 'JOBS' },
      { href: '/portal/recruitment?tab=APPLICATIONS', label: 'Hồ sơ ứng viên', tabKey: 'APPLICATIONS' },
    ]
  },
  { href: '/portal/branches', label: 'Quản lý chi nhánh', icon: Building2, requiredPermission: 'branches:view' },
  { href: '/portal/reports', label: 'Báo cáo doanh số', icon: BarChart3, requiredPermission: 'reports:view' },
  { href: '/portal/roles', label: 'Phân quyền (RBAC)', icon: ShieldCheck, requiredPermission: 'roles:view' },
  { href: '/portal/logs', label: 'Nhật ký hệ thống', icon: ScrollText, requiredPermission: 'logs:view' },
];

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    selectedBranch, 
    setSelectedBranch, 
    currentRole, 
    user,
    density, 
    setDensity,
    branches, 
    activeBranchInfo 
  } = useAdmin();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Accordion state: Chỉ mở tối đa 1 menu cha có submenu tại 1 thời điểm.
  // Mặc định tự động nhận diện menu cha của route hiện tại nếu có children
  const [openMenu, setOpenMenu] = useState<string | null>(() => {
    const matched = NAV_ITEMS.find(item => item.children && pathname.startsWith(item.href));
    return matched ? matched.href : null;
  });

  // Khi pathname thay đổi, tự động chuyển openMenu theo route đang truy cập
  useEffect(() => {
    const matched = NAV_ITEMS.find(item => item.children && pathname.startsWith(item.href));
    if (matched) {
      setOpenMenu(matched.href);
    }
  }, [pathname]);

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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getBreadcrumbTitle = () => {
    if (pathname === '/portal') return 'Tổng quan';
    if (pathname === '/portal/products/taxonomy') return 'Thương hiệu & Danh mục';
    if (pathname === '/portal/products/tags') return 'Quản lý Thẻ Tag & Huy hiệu';
    if (pathname.includes('/portal/products')) return 'Quản lý sản phẩm & SKU';
    if (pathname.includes('/portal/banners')) return 'Quản lý banner & chiến dịch';
    if (pathname.includes('/portal/inventory')) return 'Kho & điều chuyển hàng';
    if (pathname.includes('/portal/orders')) return 'Đơn hàng & đối soát VietQR';
    if (pathname.includes('/portal/stringing')) return 'Dịch vụ tiếp nhận & căng cước vợt';
    if (pathname.includes('/portal/secondhand')) return 'Thu mua & kiểm định vợt cũ';
    if (pathname.includes('/portal/warranty')) return 'Hồ sơ & tiếp nhận bảo hành';
    if (pathname.includes('/portal/reviews')) return 'Đánh giá & phản hồi sản phẩm';
    if (pathname.includes('/portal/customers')) return 'Quản lý khách hàng thân thiết & CRM';
    if (pathname.includes('/portal/users')) return 'Quản trị nhân sự & tài khoản';
    if (pathname.includes('/portal/recruitment')) return 'Tuyển dụng & nhân sự chi nhánh';
    if (pathname.includes('/portal/branches')) return 'Quản lý chi nhánh & điểm bán';
    if (pathname.includes('/portal/reports')) return 'Báo cáo & Phân tích doanh thu chuỗi';
    if (pathname.includes('/portal/roles')) return 'Phân quyền (RBAC)';
    if (pathname.includes('/portal/logs')) return 'Nhật ký hoạt động & Kiểm toán hệ thống';
    return 'Khu quản trị';
  };

  const userPermissions = user?.permissions || [];
  const isSuperAdmin = user?.role === 'ADMIN' || currentRole === 'ADMIN';

  // Lọc NAV_ITEMS theo phân quyền thực tế từ server
  const permittedNavItems = NAV_ITEMS.filter((item) => {
    if (isSuperAdmin) return true;
    return userPermissions.includes(item.requiredPermission);
  });

  const filteredNavItems = searchQuery
    ? permittedNavItems.filter((item) => item.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : permittedNavItems;

  const [authError, setAuthError] = useState<'GUEST' | 'CUSTOMER_FORBIDDEN' | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || !data.user) {
          setAuthError('GUEST');
        } else if (data.user.role === 'CUSTOMER') {
          setAuthError('CUSTOMER_FORBIDDEN');
        } else {
          setAuthError(null);
        }
      })
      .catch(() => {
        setAuthError(null);
      });
  }, []);

  // Portal Theme Isolation: Đảm bảo Cổng Quản Trị luôn hiển thị Light Theme chuẩn, độc lập với theme khách hàng
  useEffect(() => {
    const root = document.documentElement;
    const previousTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') : null;
    
    root.classList.remove('dark');
    root.style.colorScheme = 'light';

    return () => {
      // Khi rời khỏi portal quay lại storefront, khôi phục theme nếu khách hàng đã chọn dark
      if (previousTheme === 'dark') {
        root.classList.add('dark');
        root.style.colorScheme = 'dark';
      }
    };
  }, [pathname]);

  if (authError === 'CUSTOMER_FORBIDDEN') {
    return (
      <div className="portal-root min-h-screen bg-[#F5F4F0] flex items-center justify-center p-6 text-[#111613]">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-black/10 shadow-lg text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs text-amber-600 font-medium tracking-wide uppercase">403 Forbidden</div>
            <h1 className="text-xl font-medium text-[#111613] mt-1">Hạn chế quyền truy cập</h1>
            <p className="text-sm text-[#555E58] mt-2 leading-relaxed">
              Bạn đang đăng nhập với tài khoản Khách hàng (CUSTOMER). Khu vực Quản trị chỉ dành riêng cho Nhân viên, Quản lý chi nhánh và Quản trị viên hệ thống.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl bg-[#111613] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Về trang chủ cửa hàng
            </Link>
            <Link
              href="/dang-nhap?redirect=/portal/inventory"
              className="w-full py-2.5 rounded-xl border border-black/10 bg-[#F5F4F0] text-[#111613] text-sm font-medium hover:bg-black/5 transition-colors"
            >
              Đăng nhập tài khoản Nhân viên
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (authError === 'GUEST') {
    return (
      <div className="portal-root min-h-screen bg-[#F5F4F0] flex items-center justify-center p-6 text-[#111613]">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-black/10 shadow-lg text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs text-emerald-600 font-medium tracking-wide uppercase">Yêu cầu xác thực</div>
            <h1 className="text-xl font-medium text-[#111613] mt-1">Cổng quản trị nội bộ</h1>
            <p className="text-sm text-[#555E58] mt-2 leading-relaxed">
              Vui lòng đăng nhập với tài khoản Nhân viên, Quản lý chi nhánh hoặc Quản trị viên để truy cập hệ thống vận hành.
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href={`/dang-nhap?redirect=${encodeURIComponent(pathname)}`}
              className="w-full py-2.5 rounded-xl bg-[#111613] text-white text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <span>Đăng nhập Cổng Quản trị</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl border border-black/10 bg-[#F5F4F0] text-[#111613] text-sm font-medium hover:bg-black/5 transition-colors"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`portal-root min-h-screen bg-[#F5F4F0] flex flex-col lg:flex-row text-[#111613] density-${density}`}
      data-density={density}
    >
      {/* 1. Desktop & Tablet Sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#111613] text-[#F5F4F0] flex-col border-r border-white/10 shrink-0 sticky top-0 h-[100dvh] z-30">
        {/* Logo & Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0F5132] flex items-center justify-center text-white font-medium text-sm">
              SC
            </div>
            <div>
              <div className="font-medium text-sm tracking-tight text-white flex items-center gap-1.5">
                Smash Court
                <span className="text-[10px] bg-white/10 text-[#C8F31D] px-1.5 py-0.2 rounded font-normal">
                  Portal
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
          {permittedNavItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isMenuOpen = openMenu === item.href;
            const isParentActive = item.href === '/portal' 
              ? pathname === '/portal' 
              : pathname.startsWith(item.href);

            if (hasChildren) {
              return (
                <div key={item.href} className="space-y-1">
                  {/* Menu Cha - Toggle Accordion */}
                  <button
                    type="button"
                    onClick={() => {
                      // Khi nhấn vào menu cha khác thì menu cha trước đó phải tự thu gọn lại
                      setOpenMenu(isMenuOpen ? null : item.href);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-normal transition-colors text-left group ${
                      isParentActive
                        ? 'bg-[#0F5132]/40 text-white font-medium'
                        : 'text-[#D1D5D2] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 shrink-0 ${isParentActive ? 'text-[#C8F31D]' : 'text-[#A2A9A5] group-hover:text-white'}`} />
                      <span>{item.label}</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#A2A9A5] transition-transform duration-200 shrink-0 ${
                        isMenuOpen ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </button>

                  {/* Menu Con - Cấu trúc cây xương cá (Fishbone Tree) */}
                  {isMenuOpen && (
                    <div className="ml-5 pl-3 border-l-2 border-white/10 space-y-0.5 my-1 animate-in fade-in slide-in-from-top-1 duration-150">
                      {item.children?.map((child) => {
                        // Xác định active: so sánh URL hoặc tabKey
                        const isChildActive = child.tabKey
                          ? pathname.startsWith(item.href) && (
                              typeof window !== 'undefined'
                                ? new URLSearchParams(window.location.search).get('tab') === child.tabKey ||
                                  (!new URLSearchParams(window.location.search).get('tab') && child === item.children?.[0])
                                : false
                            )
                          : pathname === child.href;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`group relative flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-colors ${
                              isChildActive
                                ? 'bg-[#0F5132] text-white font-medium shadow-xs'
                                : 'text-[#A2A9A5] hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {/* Đường nhánh xương cá nằm ngang nối từ cột dọc */}
                            <span 
                              className={`absolute -left-[14px] top-1/2 w-2.5 h-[1.5px] transition-colors ${
                                isChildActive ? 'bg-[#C8F31D]' : 'bg-white/20 group-hover:bg-white/40'
                              }`} 
                            />
                            {/* Dot điểm nút nhánh */}
                            <span 
                              className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                                isChildActive ? 'bg-[#C8F31D]' : 'bg-white/30 group-hover:bg-white/60'
                              }`} 
                            />
                            <span className="truncate">{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Khi nhấn ra menu cha khác không có submenu, thu gọn các menu cha trước đó
                  setOpenMenu(null);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-normal transition-colors ${
                  isParentActive
                    ? 'bg-[#0F5132] text-white font-medium shadow-sm'
                    : 'text-[#D1D5D2] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isParentActive ? 'text-[#C8F31D]' : 'text-[#A2A9A5]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer controls: Density & Storefront Link */}
        <div className="p-3 border-t border-white/10 space-y-2 text-xs">
          {/* Static user badge showing authenticated user's full_name, role, and assigned branch */}
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs text-[#A2A9A5] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium truncate max-w-[140px]">
                {user?.full_name || 'Nhân sự SmashCourt'}
              </span>
              <Link
                href="/dang-nhap?redirect=/portal"
                className="text-[11px] text-[#C8F31D] hover:underline"
                title="Đăng xuất hoặc đổi tài khoản"
              >
                Đổi TK
              </Link>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3 h-3 text-[#0F5132]" />
                <span className="text-[#D1D5D2]">{currentRole}</span>
              </span>
              <span className="text-[#A2A9A5] truncate max-w-[100px]" title={activeBranchInfo.name}>
                {activeBranchInfo.city || activeBranchInfo.name}
              </span>
            </div>
          </div>

          {/* Density Switcher */}
          <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] text-[#A2A9A5]">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Mật độ bảng
            </span>
            <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => setDensity('normal')}
                aria-pressed={density === 'normal'}
                title="Mật độ Chuẩn: Khoảng cách dòng thoáng đãng, dễ đọc"
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                  density === 'normal' ? 'bg-[#0F5132] text-white shadow-xs' : 'text-[#A2A9A5] hover:text-white hover:bg-white/5'
                }`}
              >
                Chuẩn
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                aria-pressed={density === 'compact'}
                title="Mật độ Đặc: Thu gọn dòng, hiển thị nhiều dữ liệu hơn trên màn hình"
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all cursor-pointer ${
                  density === 'compact' ? 'bg-[#0F5132] text-white shadow-xs' : 'text-[#A2A9A5] hover:text-white hover:bg-white/5'
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
              className="lg:hidden min-w-[44px] min-h-[44px] touch-target p-2 rounded-lg hover:bg-stone-100 text-stone-600 touch-target-hit inline-flex items-center justify-center cursor-pointer"
              aria-label="Mở menu quản trị"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-[#6A726E]">
              <Link href="/portal" className="hover:text-[#111613]">Cổng vận hành</Link>
              <span>/</span>
              <span className="text-[#111613] font-medium">{getBreadcrumbTitle()}</span>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Nút Làm Mới Dữ Liệu (Icon only) */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('portal-refresh'));
                }
                router.refresh();
              }}
              title="Làm mới dữ liệu trang"
              className="min-w-[44px] min-h-[44px] touch-target p-2 rounded-lg border border-[#E4E3DD] bg-stone-50 hover:bg-stone-100 text-[#111613] hover:text-[#0F5132] transition-colors cursor-pointer touch-target-hit inline-flex items-center justify-center"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-600" />
            </button>

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

            {/* Quick Table Density Switcher in Header */}
            <div className="hidden sm:flex items-center bg-stone-100 p-0.5 rounded-lg border border-[#E4E3DD] text-[11px]">
              <button
                type="button"
                onClick={() => setDensity('normal')}
                aria-pressed={density === 'normal'}
                title="Mật độ bảng: Chuẩn (Khoảng cách dòng rộng rãi, dễ đọc)"
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer font-medium ${
                  density === 'normal'
                    ? 'bg-white text-[#0F5132] shadow-2xs'
                    : 'text-stone-500 hover:text-[#111613]'
                }`}
              >
                Chuẩn
              </button>
              <button
                type="button"
                onClick={() => setDensity('compact')}
                aria-pressed={density === 'compact'}
                title="Mật độ bảng: Đặc (Thu gọn dòng, hiển thị nhiều dữ liệu hơn)"
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer font-medium ${
                  density === 'compact'
                    ? 'bg-white text-[#0F5132] shadow-2xs'
                    : 'text-stone-500 hover:text-[#111613]'
                }`}
              >
                Đặc
              </button>
            </div>

            {/* Branch Pill badge */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-[#0F5132]/10 text-[#0F5132] border border-[#0F5132]/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F5132]" />
              <span>{activeBranchInfo.id}</span>
            </div>
          </div>
        </header>

        {/* Main Body - Full width tối ưu diện tích hiển thị không để thừa lề */}
        <main className="flex-1 p-4 sm:p-5 lg:p-6 w-full" data-density={density}>
          {children}
        </main>
      </div>

      {/* 3. Mobile Sheet Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-[#111613] text-[#F5F4F0] flex flex-col h-[100dvh] max-h-[100dvh] overscroll-contain shadow-2xl z-10">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="font-medium text-sm text-white flex items-center gap-2">
                <span className="text-[#C8F31D]">Smash Court</span> Cổng Vận Hành
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-w-[44px] min-h-[44px] touch-target p-2 rounded-md text-stone-400 hover:text-white cursor-pointer touch-target-hit inline-flex items-center justify-center"
                aria-label="Đóng menu quản trị"
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
              {permittedNavItems.map((item) => {
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;
                const isMenuOpen = openMenu === item.href;
                const isParentActive = item.href === '/portal' 
                  ? pathname === '/portal' 
                  : pathname.startsWith(item.href);

                if (hasChildren) {
                  return (
                    <div key={item.href} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenMenu(isMenuOpen ? null : item.href);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors text-left ${
                          isParentActive
                            ? 'bg-[#0F5132]/40 text-white font-medium'
                            : 'text-[#D1D5D2] hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 ${isParentActive ? 'text-[#C8F31D]' : 'text-[#A2A9A5]'}`} />
                          <span>{item.label}</span>
                        </div>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-[#A2A9A5] transition-transform duration-200 ${
                            isMenuOpen ? 'rotate-180 text-white' : ''
                          }`}
                        />
                      </button>

                      {isMenuOpen && (
                        <div className="ml-5 pl-3 border-l-2 border-white/10 space-y-0.5 my-1">
                          {item.children?.map((child) => {
                            const isChildActive = child.tabKey
                              ? pathname.startsWith(item.href) && (
                                  typeof window !== 'undefined'
                                    ? new URLSearchParams(window.location.search).get('tab') === child.tabKey ||
                                      (!new URLSearchParams(window.location.search).get('tab') && child === item.children?.[0])
                                    : false
                                )
                              : pathname === child.href;

                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`relative flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-colors ${
                                  isChildActive
                                    ? 'bg-[#0F5132] text-white font-medium shadow-xs'
                                    : 'text-[#A2A9A5] hover:text-white hover:bg-white/5'
                                }`}
                              >
                                <span 
                                  className={`absolute -left-[14px] top-1/2 w-2.5 h-[1.5px] ${
                                    isChildActive ? 'bg-[#C8F31D]' : 'bg-white/20'
                                  }`} 
                                />
                                <span 
                                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                    isChildActive ? 'bg-[#C8F31D]' : 'bg-white/30'
                                  }`} 
                                />
                                <span className="truncate">{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setOpenMenu(null);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors ${
                      isParentActive ? 'bg-[#0F5132] text-white font-medium' : 'text-[#D1D5D2] hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Density Switcher */}
            <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs text-[#A2A9A5]">
              <span className="flex items-center gap-1.5 text-[11px]">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Mật độ bảng
              </span>
              <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() => setDensity('normal')}
                  aria-pressed={density === 'normal'}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    density === 'normal' ? 'bg-[#0F5132] text-white shadow-xs' : 'text-[#A2A9A5] hover:text-white'
                  }`}
                >
                  Chuẩn
                </button>
                <button
                  type="button"
                  onClick={() => setDensity('compact')}
                  aria-pressed={density === 'compact'}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    density === 'compact' ? 'bg-[#0F5132] text-white shadow-xs' : 'text-[#A2A9A5] hover:text-white'
                  }`}
                >
                  Đặc
                </button>
              </div>
            </div>

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
      <Toaster position="top-right" richColors />
    </AdminProvider>
  );
}
