'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdmin } from '@/lib/admin-context';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Edit3, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  Layers,
  LayoutGrid,
  ShieldCheck,
  Settings,
  Image as ImageIcon,
  Truck,
  ThumbsUp,
  CreditCard,
  RotateCcw,
  Award,
  Flame,
  Phone,
  Mail,
  MapPin,
  Share2,
  RefreshCw,
  Tag,
  Monitor,
  Smartphone,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowRight,
  Gift,
  SlidersHorizontal,
  Wifi,
  BatteryMedium
} from 'lucide-react';
import ImageUpload from '@/components/ui/ImageUpload';
import { SafeImage } from '@/components/ui/SafeImage';

export interface BannerItem {
  id: string;
  badge: string;
  title: string;
  description: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  imageSrc: string;
  mobileImageSrc?: string;
  productTag: string;
  productSub: string;
  productPrice: string;
  features: string[];
  isActive: boolean;
  position?: string;
  sortOrder?: number;
  startAt?: string;
  endAt?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  tag_subtitle: string;
  sort_order: number;
  is_featured: boolean;
}

interface SiteSetting {
  key: string;
  value: string;
  group_name: string;
  description?: string;
}

export interface NavItem {
  id: string;
  href: string;
  label: string;
  badge_text: string;
  badge_type?: 'badge' | 'pill' | 'pill_2lines';
  bg_gradient?: string;
  bg_color?: string;
  text_color?: string;
  animation?: 'none' | 'shake' | 'pulse';
  is_active: boolean;
  sort_order: number;
}

export const BANNER_POSITIONS = [
  { value: 'HERO', label: 'HERO — Hero Slider (Đầu trang chủ)', badge: 'HERO', description: 'Trình chiếu lớn trên cùng trang chủ' },
  { value: 'PROMO_POPUP', label: 'PROMO_POPUP — Popup ưu đãi đặc biệt', badge: 'POPUP', description: 'Hộp thoại popup chào mừng / khuyến mãi nổi bật' },
  { value: 'MID_PAGE', label: 'MID_PAGE — Banner quảng cáo giữa trang', badge: 'MID-PAGE', description: 'Dải banner ngang giữa trang chủ thu hút sự chú ý' },
  { value: 'HOME_PROMO_3', label: 'HOME_PROMO_3 — Bộ 3 banner ưu đãi', badge: 'PROMO-3', description: 'Khối 3 thẻ ưu đãi tuần ngay dưới danh mục' },
  { value: 'USP_BAR', label: 'USP_BAR — Dải 4 cam kết vàng', badge: 'USP', description: 'Dải 4 cam kết vận chuyển, chính hãng, thanh toán, đổi trả' },
  { value: 'ATHLETES', label: 'ATHLETES — Vận động viên đại diện', badge: 'ATHLETE', description: 'Khối huyền thoại cầu lông và vận động viên đại sứ' },
];

export function getBannerStatus(banner: BannerItem): {
  code: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'INACTIVE';
  label: string;
  badgeClass: string;
  subText: string;
} {
  if (!banner.isActive) {
    return {
      code: 'INACTIVE',
      label: 'Tắt',
      badgeClass: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
      subText: 'Đang tắt hiển thị',
    };
  }

  const now = new Date();
  if (banner.startAt) {
    const startDate = new Date(banner.startAt);
    if (!isNaN(startDate.getTime()) && startDate > now) {
      return {
        code: 'SCHEDULED',
        label: 'Đã lên lịch',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
        subText: `Phát từ: ${startDate.toLocaleDateString('vi-VN')} ${startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
      };
    }
  }

  if (banner.endAt) {
    const endDate = new Date(banner.endAt);
    if (!isNaN(endDate.getTime()) && endDate < now) {
      return {
        code: 'EXPIRED',
        label: 'Hết hạn',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        subText: `Đã kết thúc: ${endDate.toLocaleDateString('vi-VN')}`,
      };
    }
  }

  return {
    code: 'ACTIVE',
    label: 'Đang phát',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    subText: 'Đang hiển thị trực tiếp',
  };
}

function toDateTimeLocalString(isoString?: string | null): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function AdminBannersPageContent() {
  const { currentRole, user } = useAdmin();
  const searchParams = useSearchParams();
  const urlTab = searchParams.get('tab');
  const validTabs = ['hero', 'midpage', 'popup', 'promo', 'categories', 'usp', 'navtags', 'settings'] as const;
  type BannerTab = typeof validTabs[number];

  const [activeTab, setActiveTab] = useState<BannerTab>(() => {
    if (urlTab && validTabs.includes(urlTab as BannerTab)) return urlTab as BannerTab;
    return 'hero';
  });

  useEffect(() => {
    if (urlTab && validTabs.includes(urlTab as BannerTab)) {
      setActiveTab(urlTab as BannerTab);
    } else if (!urlTab) {
      setActiveTab('hero');
    }
  }, [urlTab]);
  
  // Data states
  const [allBanners, setAllBanners] = useState<BannerItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingNavItems, setSavingNavItems] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [editingNavItem, setEditingNavItem] = useState<NavItem | null>(null);
  const [isCreatingNavItem, setIsCreatingNavItem] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeModalTab, setActiveModalTab] = useState<'form' | 'preview'>('form');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load all data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [bannersRes, catsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/banners?position=ALL'),
        fetch('/api/admin/categories'),
        fetch('/api/admin/site-settings'),
      ]);

      const [bannersData, catsData, settingsData] = await Promise.all([
        bannersRes.json(),
        catsRes.json(),
        settingsRes.json(),
      ]);

      if (bannersData.banners) setAllBanners(bannersData.banners);
      if (catsData.categories) setCategories(catsData.categories);
      if (settingsData.settings) {
        const map: Record<string, string> = {};
        for (const s of settingsData.settings) {
          map[s.key] = s.value;
        }
        setSettings(map);

        if (map['nav_items_config']) {
          try {
            const parsed = JSON.parse(map['nav_items_config']);
            if (Array.isArray(parsed)) {
              setNavItems(parsed);
            }
          } catch (e) {
            console.error('Lỗi parse nav_items_config', e);
          }
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Không thể tải toàn bộ dữ liệu CMS' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, []);

  // Filter banners by position
  const heroBanners = allBanners.filter(b => b.position === 'HERO' || b.position === 'HERO_SLIDER' || b.position === 'HOME_MAIN');
  const midPageBanners = allBanners.filter(b => b.position === 'MID_PAGE');
  const promoPopupBanners = allBanners.filter(b => b.position === 'PROMO_POPUP');
  const promoBanners = allBanners.filter(b => b.position === 'HOME_PROMO_3');
  const uspBanners = allBanners.filter(b => b.position === 'USP_BAR');
  const athleteBanners = allBanners.filter(b => b.position === 'ATHLETES');

  // Actions for Banners
  const handleToggleBanner = async (bannerId: string) => {
    // Cập nhật lạc quan (optimistic update) để phản hồi tức thì
    setAllBanners((prev) =>
      prev.map((b) => (b.id === bannerId ? { ...b, isActive: !b.isActive } : b))
    );
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_STATUS', bannerId }),
      });
      const data = await res.json();
      if (data.success && data.banners) {
        setAllBanners(data.banners);
        setMessage({ type: 'success', text: 'Cập nhật trạng thái hiển thị thành công' });
      } else {
        fetchData();
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra khi cập nhật' });
      }
    } catch {
      fetchData();
      setMessage({ type: 'error', text: 'Lỗi mạng khi cập nhật trạng thái' });
    }
  };

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Bạn có chắc muốn xóa vĩnh viễn banner này?')) return;
    try {
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', bannerId }),
      });
      const data = await res.json();
      if (data.success) {
        setAllBanners(data.banners);
        setMessage({ type: 'success', text: 'Đã xóa banner thành công' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng khi xóa' });
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    try {
      const action = isCreating ? 'CREATE' : 'UPDATE';
      const payloadBanner = {
        ...editingBanner,
        startAt: editingBanner.startAt ? new Date(editingBanner.startAt).toISOString() : null,
        endAt: editingBanner.endAt ? new Date(editingBanner.endAt).toISOString() : null,
      };

      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, banner: payloadBanner }),
      });
      const data = await res.json();
      if (data.success) {
        setAllBanners(data.banners);
        setEditingBanner(null);
        setIsCreating(false);
        setMessage({ type: 'success', text: isCreating ? 'Tạo mới banner thành công' : 'Cập nhật banner thành công' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra khi lưu' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối khi lưu banner' });
    }
  };

  // Actions for Categories
  const handleToggleCategoryFeatured = async (catId: string) => {
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_FEATURED', categoryId: catId }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        setMessage({ type: 'success', text: 'Cập nhật hiển thị danh mục thành công' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng khi cập nhật' });
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE', category: editingCategory }),
      });
      const data = await res.json();
      if (data.success) {
        setCategories(data.categories);
        setEditingCategory(null);
        setMessage({ type: 'success', text: 'Cập nhật danh mục thành công' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Có lỗi xảy ra' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối khi lưu danh mục' });
    }
  };

  // Actions for Nav Items & Tags
  const handleSaveNavItems = async (itemsToSave: NavItem[]) => {
    try {
      setSavingNavItems(true);
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            {
              key: 'nav_items_config',
              value: JSON.stringify(itemsToSave),
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNavItems(itemsToSave);
        setMessage({ type: 'success', text: 'Đã lưu cấu hình Menu Navigation & Tags thành công!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể lưu cấu hình Menu' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng khi lưu Menu' });
    } finally {
      setSavingNavItems(false);
    }
  };

  const handleToggleNavItem = (id: string) => {
    const updated = navItems.map((item) =>
      item.id === id ? { ...item, is_active: !item.is_active } : item
    );
    handleSaveNavItems(updated);
  };

  const handleDeleteNavItem = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mục điều hướng này?')) return;
    const updated = navItems.filter((item) => item.id !== id);
    handleSaveNavItems(updated);
  };

  const handleSaveSingleNavItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNavItem) return;

    let updated: NavItem[] = [];
    if (isCreatingNavItem) {
      const newItem: NavItem = {
        ...editingNavItem,
        id: editingNavItem.id || `nav_${Date.now()}`,
        sort_order: Number(editingNavItem.sort_order || navItems.length + 1),
      };
      updated = [...navItems, newItem].sort((a, b) => a.sort_order - b.sort_order);
    } else {
      updated = navItems
        .map((item) => (item.id === editingNavItem.id ? editingNavItem : item))
        .sort((a, b) => a.sort_order - b.sort_order);
    }

    setEditingNavItem(null);
    setIsCreatingNavItem(false);
    handleSaveNavItems(updated);
  };

  // Actions for Site Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingSettings(true);
      const res = await fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: 'success', text: 'Đã lưu toàn bộ cài đặt chung vào hệ thống!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Không thể lưu cài đặt' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi mạng khi lưu cài đặt' });
    } finally {
      setSavingSettings(false);
    }
  };

  const renderBannerCard = (banner: BannerItem, positionLabel: string) => {
    const status = getBannerStatus(banner);
    const hasMobileImg = Boolean(banner.mobileImageSrc && banner.mobileImageSrc.trim());

    return (
      <div 
        key={banner.id}
        className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-xs flex flex-col group hover:border-emerald-600/40 transition-all"
      >
        <div className="relative aspect-16/9 bg-stone-900 overflow-hidden">
          {banner.imageSrc ? (
            <SafeImage
              src={banner.imageSrc}
              alt={banner.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">
              <ImageIcon className="w-8 h-8 opacity-40" />
            </div>
          )}

          {/* Huy hiệu vị trí và STT */}
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#111613] text-white uppercase tracking-wide">
              {banner.badge || positionLabel}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white backdrop-blur-xs">
              #{banner.sortOrder || 1}
            </span>
            {hasMobileImg && (
              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-blue-600 text-white flex items-center gap-0.5" title="Có ảnh Mobile riêng">
                <Smartphone className="w-2.5 h-2.5" />
                Mobile
              </span>
            )}
          </div>

          {/* Trạng thái động & Nút toggle */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-md ${status.badgeClass}`}>
              {status.label}
            </span>
            <button
              type="button"
              onClick={() => handleToggleBanner(banner.id)}
              className={`p-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition-colors cursor-pointer ${
                banner.isActive ? 'bg-emerald-600/90 hover:bg-emerald-700 text-white' : 'bg-zinc-700/80 hover:bg-zinc-800 text-white'
              }`}
              title={banner.isActive ? 'Nhấn để tắt' : 'Nhấn để bật'}
            >
              {banner.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <h3 className="font-semibold text-sm text-[#111613] line-clamp-1">{banner.title}</h3>
            <p className="text-xs text-[#6A726E] line-clamp-2 mt-1">{banner.description}</p>
            
            {/* Lịch phát sóng nếu có */}
            {(banner.startAt || banner.endAt) && (
              <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-[#6A726E] space-y-0.5">
                {banner.startAt && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Calendar className="w-3 h-3" />
                    <span>Bắt đầu: {new Date(banner.startAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {banner.endAt && (
                  <div className="flex items-center gap-1 text-rose-600">
                    <Clock className="w-3 h-3" />
                    <span>Hết hạn: {new Date(banner.endAt).toLocaleString('vi-VN')}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#6A726E]">
              <span className="truncate max-w-[240px]">🔗 Đích đến: <strong className="text-[#111613] font-mono">{banner.primaryCtaLink || (banner as any).link_url || '/'}</strong></span>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#6A726E] uppercase">{banner.position || 'HERO'}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingBanner({ ...banner });
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-medium text-[#111613] transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                <span>Sửa</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBanner(banner.id)}
                className="p-1.5 hover:bg-red-50 text-red-600 border border-transparent hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                title="Xóa"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Thông báo Message */}
      {message && (
        <div className={`p-3.5 rounded-xl flex items-center justify-between text-xs font-medium border ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{message.text}</span>
          </div>
          <button type="button" onClick={() => setMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: HERO SLIDER */}
      {activeTab === 'hero' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-black/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-[#6A726E]">
              Danh sách banner trình chiếu lớn trên cùng trang chủ. Khuyên dùng tỉ lệ 16:9 với ảnh ngang độ phân giải cao.
              <span className="ml-2 font-medium text-emerald-700">({heroBanners.length} slide đang cấu hình)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                setEditingBanner({
                  id: '',
                  title: '',
                  badge: '',
                  description: '',
                  primaryCtaText: 'Xem ngay',
                  primaryCtaLink: '/vot-cau-long',
                  secondaryCtaText: '',
                  secondaryCtaLink: '',
                  imageSrc: '',
                  mobileImageSrc: '',
                  productTag: '',
                  productSub: '',
                  productPrice: '',
                  features: ['100% Chính hãng'],
                  isActive: true,
                  position: 'HERO',
                  sortOrder: 1,
                });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Hero Slide</span>
            </button>
          </div>
          {heroBanners.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-[#6A726E] text-xs">
              Chưa có Hero Banner nào. Nhấn nút "Thêm Hero Slide" để tạo mới.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {heroBanners.map((banner) => renderBannerCard(banner, 'HERO SLIDE'))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BANNER GIỮA TRANG (MID_PAGE) */}
      {activeTab === 'midpage' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-black/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-[#6A726E]">
              Dải banner ngang nổi bật hiển thị ở giữa trang chủ (giữa các khối sản phẩm / danh mục).
              <span className="ml-2 font-medium text-cyan-600">({midPageBanners.length} banner)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                setEditingBanner({
                  id: '',
                  title: '',
                  badge: '',
                  description: '',
                  primaryCtaText: 'Xem ngay',
                  primaryCtaLink: '/vot-cau-long',
                  secondaryCtaText: '',
                  secondaryCtaLink: '',
                  imageSrc: '',
                  mobileImageSrc: '',
                  productTag: '',
                  productSub: '',
                  productPrice: '',
                  features: ['100% Chính hãng'],
                  isActive: true,
                  position: 'MID_PAGE',
                  sortOrder: 1,
                });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Banner Giữa Trang</span>
            </button>
          </div>
          {midPageBanners.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-[#6A726E] text-xs">
              Chưa có Banner giữa trang nào. Nhấn nút "Thêm Banner Giữa Trang" để tạo mới.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {midPageBanners.map((banner) => renderBannerCard(banner, 'MID PAGE'))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: POPUP ƯU ĐÃI (PROMO_POPUP) */}
      {activeTab === 'popup' && (
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded-xl border border-black/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-[#6A726E]">
              Popup khuyến mãi tự động hiển thị khi khách truy cập vào trang chủ (có thể lên lịch thời gian bắt đầu và hết hạn).
              <span className="ml-2 font-medium text-violet-600">({promoPopupBanners.length} popup)</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                setEditingBanner({
                  id: '',
                  title: '',
                  badge: '',
                  description: '',
                  primaryCtaText: 'Xem ngay',
                  primaryCtaLink: '/vot-cau-long',
                  secondaryCtaText: '',
                  secondaryCtaLink: '',
                  imageSrc: '',
                  mobileImageSrc: '',
                  productTag: '',
                  productSub: '',
                  productPrice: '',
                  features: ['100% Chính hãng'],
                  isActive: true,
                  position: 'PROMO_POPUP',
                  sortOrder: 1,
                });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Popup Ưu Đãi</span>
            </button>
          </div>
          {promoPopupBanners.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-[#6A726E] text-xs">
              Chưa có Popup ưu đãi nào. Nhấn nút "Thêm Popup Ưu Đãi" để tạo mới.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {promoPopupBanners.map((banner) => renderBannerCard(banner, 'POPUP'))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BỘ 3 BANNER ƯU ĐÃI (PROMO TILES - HOME_PROMO_3) */}
      {activeTab === 'promo' && (
        <div className="space-y-6">
          <div className="p-4 bg-white rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#111613] flex items-center gap-2">
                <Flame className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                <span>Khối "ƯU ĐÃI TUẦN NÀY — SALE OFF" Hiển Thị Trên Trang Chủ</span>
              </div>
              <p className="text-[11px] text-[#6A726E] mt-1">
                Gồm 3 thẻ ưu đãi nằm ngay dưới thanh cam kết. Thẻ được thiết kế bo góc lớn, viền thanh mảnh, nền trắng ngà và nút viên thuốc xanh rêu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                setEditingBanner({
                  id: `promo-${Date.now()}`,
                  badge: 'Ưu đãi tuần này',
                  title: 'VỢT YONEX SALE 30%',
                  description: 'Tặng combo cước BG65 + Quấn cán miễn phí',
                  primaryCtaText: 'Săn ngay',
                  primaryCtaLink: '/vot-cau-long?brand=Yonex&sale=true',
                  secondaryCtaText: '',
                  secondaryCtaLink: '',
                  imageSrc: '/images/products/yonex-astrox-88d-pro.png',
                  mobileImageSrc: '',
                  productTag: 'Yonex Astrox',
                  productSub: 'Sale 30%',
                  productPrice: '3.200.000đ',
                  features: [],
                  isActive: true,
                  position: 'HOME_PROMO_3',
                  sortOrder: promoBanners.length + 1,
                });
              }}
              className="px-4 py-2 bg-[#C8F31D] text-[#111613] hover:bg-[#d8fb48] font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Thẻ Ưu Đãi Mới</span>
            </button>
          </div>

          {/* HIỂN THỊ CHÍNH XÁC NHƯ SECTION TRANG CHỦ THEO ẢNH */}
          <div className="p-6 sm:p-8 bg-[#FAF8F3] border border-[#ECE8DE] rounded-3xl space-y-6">
            <div className="flex flex-col items-center justify-center text-center space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="w-10 sm:w-14 h-[1px] bg-[#11382B]/25" />
                <span className="text-xs font-semibold text-[#11382B] uppercase tracking-wider">
                  Ưu đãi tuần này
                </span>
                <span className="w-10 sm:w-14 h-[1px] bg-[#11382B]/25" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#112F25] uppercase">
                SALE OFF
              </h2>
              <div className="w-12 h-1 bg-[#11382B] rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {promoBanners.map((banner, index) => {
                const status = getBannerStatus(banner);
                return (
                  <div
                    key={banner.id}
                    className="bg-white border border-[#ECE8DE] rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group relative overflow-hidden"
                  >
                    {/* Header Thẻ: Badge + Trạng thái bật/tắt */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11382B] text-white text-[12px] font-semibold">
                        {index === 0 ? (
                          <Flame className="w-3.5 h-3.5 text-[#4EBA86] fill-[#4EBA86]" />
                        ) : index === 1 ? (
                          <Gift className="w-3.5 h-3.5 text-[#4EBA86]" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-[#4EBA86]" />
                        )}
                        <span>{banner.badge || 'Ưu đãi tuần này'}</span>
                      </span>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${status.badgeClass}`}>
                          {status.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleBanner(banner.id)}
                          className={`p-1 rounded-md text-xs font-semibold ${
                            banner.isActive ? 'text-emerald-600 hover:text-emerald-700' : 'text-zinc-400 hover:text-zinc-500'
                          }`}
                          title={banner.isActive ? 'Tắt hiển thị' : 'Bật hiển thị'}
                        >
                          {banner.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Nội dung Thẻ + Ảnh sản phẩm */}
                    <div className="flex items-center justify-between gap-4 flex-1">
                      <div className="space-y-2.5 max-w-[62%]">
                        <h3 className="text-[17px] sm:text-[18px] font-black tracking-tight text-[#112F25]  leading-snug uppercase line-clamp-2">
                          {banner.title}
                        </h3>
                        <p className="text-[12px] text-[#556960]  leading-relaxed line-clamp-2">
                          {banner.description}
                        </p>
                        <div className="pt-2">
                          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#11382B] text-white text-[12px] font-semibold shadow-xs">
                            <span>{banner.primaryCtaText || 'Săn ngay'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>

                      <div className="w-24 sm:w-28 h-36 sm:h-40 relative shrink-0 flex items-center justify-center p-1 group-hover:scale-105 transition-transform duration-300">
                        {banner.imageSrc ? (
                          <SafeImage
                            src={banner.imageSrc}
                            alt={banner.title}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400 text-[10px]">
                            Chưa có ảnh
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Thẻ: Hành động Sửa / Xóa */}
                    <div className="mt-5 pt-3 border-t border-gray-200/60 flex items-center justify-between">
                      <span className="text-[10px] text-[#6A726E] font-mono">Thứ tự #{banner.sortOrder || index + 1}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreating(false);
                            setEditingBanner({ ...banner });
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-black/5 hover:bg-black/10   rounded-lg text-xs font-semibold text-[#111613] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBanner(banner.id)}
                          className="p-1 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                          title="Xóa thẻ này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: HÌNH ẢNH & TAG DANH MỤC TRANG CHỦ */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="text-xs text-[#6A726E]">
            Quản lý các khối danh mục trang chủ (Vợt, Giày, Quần áo, Túi balo, Cước, Quấn cán, Vợt cũ...). Admin có thể đổi ảnh đại diện, đổi tag phụ (ví dụ: "Yonex · Victor") và bật/tắt hiển thị.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <div 
                key={cat.id}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between group hover:border-emerald-600/40 transition-all"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#111613] uppercase tracking-wider">#{cat.sort_order}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleCategoryFeatured(cat.id)}
                      className={`px-2 py-0.5 rounded-full font-medium ${
                        cat.is_featured ? 'bg-emerald-100 text-emerald-800  ' : 'bg-zinc-100 text-zinc-500'
                      }`}
                    >
                      {cat.is_featured ? 'Hiển thị trang chủ' : 'Ẩn'}
                    </button>
                  </div>

                  <div className="relative aspect-square rounded-xl overflow-hidden bg-[#eef5f1]  border border-gray-200/60">
                    {cat.image_url ? (
                      <SafeImage
                        src={cat.image_url}
                        alt={cat.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs uppercase text-[#111613]">{cat.name}</h4>
                    <div className="text-[11px] text-emerald-700  font-medium mt-0.5">
                      Tag: {cat.tag_subtitle || 'Chưa có tag phụ'}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingCategory({ ...cat })}
                    className="flex items-center gap-1 px-3 py-1.5 bg-black/5 hover:bg-black/10   rounded-lg text-xs font-semibold text-[#111613] transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Đổi ảnh &amp; Tag
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: DẢI CAM KẾT VÀNG & VĐV ĐẠI DIỆN */}
      {activeTab === 'usp' && (
        <div className="space-y-8">
          {/* Cam kết vàng */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#111613] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-700" />
                  Dải 4 Cam Kết Vàng (USP Bar)
                </h3>
                <p className="text-xs text-[#6A726E] mt-0.5">Hiển thị dưới banner trang chủ (Vận chuyển, Cam kết chất lượng, Thanh toán, Đổi trả).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {uspBanners.map((usp) => (
                <div key={usp.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#6A726E] mb-2">
                      <span className="font-semibold text-[#111613]">Mục #{usp.sortOrder}</span>
                      <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/5 ">Icon: {usp.badge || 'Truck'}</span>
                    </div>
                    <div className="font-bold text-xs text-[#111613]">{usp.title}</div>
                    <div className="text-[11px] text-[#6A726E] mt-1">{usp.description}</div>
                  </div>
                  <div className="pt-3 border-t border-gray-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingBanner({ ...usp });
                      }}
                      className="px-2.5 py-1 bg-black/5 hover:bg-black/10  rounded-lg text-xs font-semibold text-[#111613]"
                    >
                      Sửa nội dung
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* VĐV Đại diện */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#111613] flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Vận Động Viên Đại Diện &amp; Huyền Thoại
                </h3>
                <p className="text-xs text-[#6A726E] mt-0.5">Hiển thị trong khối đại sứ thương hiệu trên trang chủ (Axelsen, Momota, An Se-young).</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {athleteBanners.map((athlete) => (
                <div key={athlete.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-stone-900 border border-gray-200 shrink-0">
                      {athlete.imageSrc ? (
                        <SafeImage src={athlete.imageSrc} alt={athlete.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-500">
                          <Award className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">{athlete.badge}</div>
                      <div className="font-bold text-sm text-[#111613] truncate">{athlete.title}</div>
                      <div className="text-xs text-[#6A726E] line-clamp-1">{athlete.description}</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setEditingBanner({ ...athlete });
                      }}
                      className="px-3 py-1.5 bg-black/5 hover:bg-black/10  rounded-lg text-xs font-semibold text-[#111613]"
                    >
                      Sửa thông tin VĐV
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: CÀI ĐẶT CHUNG (HEADER / FOOTER / HOTLINE) */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="text-xs text-[#6A726E]">
            Tùy chỉnh thông tin liên hệ, hotline, địa chỉ chi nhánh và mạng xã hội hiển thị trên Header và Footer toàn trang web.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#111613] flex items-center gap-2 border-b border-gray-200 pb-2.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                Cài Đặt Header &amp; Thanh Đầu Trang
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111613]">Hotline Tư Vấn (Header)</label>
                <input
                  type="text"
                  value={settings['header_hotline'] || ''}
                  onChange={(e) => setSettings({ ...settings, header_hotline: e.target.value })}
                  placeholder="1900 6868"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111613]">Giờ Phục Vụ Hotline</label>
                <input
                  type="text"
                  value={settings['header_hotline_hours'] || ''}
                  onChange={(e) => setSettings({ ...settings, header_hotline_hours: e.target.value })}
                  placeholder="08:30 – 21:30"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111613]">Thông Điệp Đầu Trang (Top Announcement Bar)</label>
                <textarea
                  rows={2}
                  value={settings['header_announcement'] || ''}
                  onChange={(e) => setSettings({ ...settings, header_announcement: e.target.value })}
                  placeholder="Nhập thông báo chạy trên đầu trang..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111613]">Tên Logo Thương Hiệu</label>
                <input
                  type="text"
                  value={settings['store_logo_text'] || ''}
                  onChange={(e) => setSettings({ ...settings, store_logo_text: e.target.value })}
                  placeholder="SmashCourt"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#111613] flex items-center gap-2 border-b border-gray-200 pb-2.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Cài Đặt Footer &amp; Showroom
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111613]">Email Chăm Sóc Khách Hàng</label>
                <input
                  type="email"
                  value={settings['footer_email'] || ''}
                  onChange={(e) => setSettings({ ...settings, footer_email: e.target.value })}
                  placeholder="cskh@smashcourt.vn"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111613]">Địa Chỉ Showroom TP.HCM</label>
                <input
                  type="text"
                  value={settings['footer_address_hcm'] || ''}
                  onChange={(e) => setSettings({ ...settings, footer_address_hcm: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111613]">Địa Chỉ Showroom Hà Nội</label>
                <input
                  type="text"
                  value={settings['footer_address_hn'] || ''}
                  onChange={(e) => setSettings({ ...settings, footer_address_hn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111613]">Địa Chỉ Showroom Đà Nẵng</label>
                <input
                  type="text"
                  value={settings['footer_address_dn'] || ''}
                  onChange={(e) => setSettings({ ...settings, footer_address_dn: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111613]">Link Zalo OA</label>
                  <input
                    type="text"
                    value={settings['footer_zalo_url'] || ''}
                    onChange={(e) => setSettings({ ...settings, footer_zalo_url: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[#111613]">Link Fanpage FB</label>
                  <input
                    type="text"
                    value={settings['footer_facebook_url'] || ''}
                    onChange={(e) => setSettings({ ...settings, footer_facebook_url: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={savingSettings}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#C8F31D] text-[#111613] hover:bg-[#d4fa36] rounded-xl text-xs font-bold shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              {savingSettings ? 'Đang lưu cài đặt...' : 'Lưu Toàn Bộ Cài Đặt Giao Diện'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 8: QUẢN LÝ HUY HIỆU & MENU NAVIGATION */}
      {activeTab === 'navtags' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200">
            <div>
              <h3 className="text-sm font-bold text-[#111613] flex items-center gap-2">
                <Tag className="w-4 h-4 text-rose-500" />
                Danh Sách Mục Điều Hướng &amp; Huy Hiệu Header (Storefront Navigation)
              </h3>
              <p className="text-xs text-[#6A726E] mt-0.5">
                Admin tự do đổi tên menu, gắn hoặc tháo gỡ tag (như 16 TIÊU CHÍ, HOT DEAL, SALE, NEW...), tùy chỉnh màu sắc và hiệu ứng rung lắc hoạt họa.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNavItem(true);
                setEditingNavItem({
                  id: `nav_${Date.now()}`,
                  href: '/',
                  label: '',
                  badge_text: '',
                  badge_type: 'badge',
                  bg_color: '#f43f5e',
                  text_color: '#ffffff',
                  animation: 'shake',
                  is_active: true,
                  sort_order: navItems.length + 1,
                });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm Menu / Gán Tag</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#141A17] text-white border-b border-white/10 font-semibold">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4">Tên Menu (Label)</th>
                    <th className="py-3 px-4">Đường dẫn URL</th>
                    <th className="py-3 px-4">Huy hiệu (Tag đã gán)</th>
                    <th className="py-3 px-4">Xem trước (Live Preview)</th>
                    <th className="py-3 px-4">Hiệu ứng</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {navItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#6A726E]">
                        Chưa có mục điều hướng nào được thiết lập.
                      </td>
                    </tr>
                  ) : (
                    navItems.map((item, idx) => {
                      const hasBadge = Boolean(item.badge_text && item.badge_text.trim());
                      const animClass = item.animation === 'shake' ? 'animate-badge-shake' : item.animation === 'pulse' ? 'animate-pulse' : '';

                      return (
                        <tr key={item.id} className="hover:bg-black/5  transition-colors">
                          <td className="py-3 px-4 text-center font-medium text-[#6A726E]">
                            {item.sort_order || idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#111613]">
                            {item.label}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-[#6A726E] max-w-[180px] truncate">
                            {item.href}
                          </td>
                          <td className="py-3 px-4">
                            {hasBadge ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[#111613]">{item.badge_text}</span>
                                <span className="text-[10px] text-[#6A726E] px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200">
                                  {item.badge_type === 'pill_2lines' ? '2 Dòng' : item.badge_type === 'pill' ? 'Oval' : 'Chữ nhật'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#6A726E]/60 italic text-[11px]">(Không có tag)</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative inline-flex items-center px-3 py-1.5 bg-white shadow-2xs rounded-lg border border-gray-200 text-[12px] font-medium text-[#111613] select-none">
                              <span>{item.label || 'Tên Menu'}</span>
                              {hasBadge && (
                                <span className={`absolute -top-2.5 -right-5 select-none pointer-events-none z-10 ${animClass}`}>
                                  <span
                                    className="inline-block px-1.5 py-0.5 text-[9px] font-black rounded-full shadow-xs whitespace-nowrap leading-none"
                                    style={{
                                      backgroundColor: item.bg_color || '#f43f5e',
                                      color: item.text_color || '#ffffff',
                                    }}
                                  >
                                    {item.badge_text}
                                  </span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-[11px] text-[#6A726E]">
                              {item.animation === 'shake' ? '⚡ Rung' : item.animation === 'pulse' ? '✨ Nháy' : '—'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleNavItem(item.id)}
                              className={`p-1 rounded-md text-xs font-semibold ${
                                item.is_active ? 'text-emerald-500 hover:text-emerald-600' : 'text-zinc-400 hover:text-zinc-500'
                              }`}
                            >
                              {item.is_active ? <Eye className="w-4 h-4 inline" /> : <EyeOff className="w-4 h-4 inline" />}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsCreatingNavItem(false);
                                  setEditingNavItem({ ...item });
                                }}
                                className="p-1 hover:bg-black/5  rounded text-[#111613]"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteNavItem(item.id)}
                                className="p-1 hover:bg-red-500/10 rounded text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SỬA NAV ITEM */}
      {editingNavItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-[#141A17] border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-white">
                  {isCreatingNavItem ? 'Thêm Mục Điều Hướng Mới' : 'Chỉnh Sửa Mục Điều Hướng & Gán Tag'}
                </h3>
                <span className="text-xs text-[#9BA39F]">Cấu hình nhãn menu, link liên kết và huy hiệu nổi bật</span>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingNavItem(null)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSingleNavItem} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111613]">Tên hiển thị (Label) *</label>
                  <input
                    type="text"
                    required
                    value={editingNavItem.label}
                    onChange={(e) => setEditingNavItem({ ...editingNavItem, label: e.target.value })}
                    placeholder="VD: Sàn Vợt Cũ"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111613]">Đường dẫn liên kết (Href) *</label>
                  <input
                    type="text"
                    required
                    value={editingNavItem.href}
                    onChange={(e) => setEditingNavItem({ ...editingNavItem, href: e.target.value })}
                    placeholder="VD: /vot-cu"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              {/* Nhóm thiết lập Huy hiệu (Tag Badge) */}
              <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#111613] flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-rose-500" />
                    Huy Hiệu Nổi Bật (Header Badge)
                  </h4>
                  <span className="text-[10px] text-[#6A726E]">Tùy chọn</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111613]">Chữ trong huy hiệu (Badge text)</label>
                  <input
                    type="text"
                    value={editingNavItem.badge_text}
                    onChange={(e) => setEditingNavItem({ ...editingNavItem, badge_text: e.target.value })}
                    placeholder="VD: 16 TIÊU CHÍ, HOT, SALE, NEW"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#111613]">Màu nền huy hiệu</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editingNavItem.bg_color || '#f43f5e'}
                        onChange={(e) => setEditingNavItem({ ...editingNavItem, bg_color: e.target.value })}
                        className="w-7 h-7 rounded border-0 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={editingNavItem.bg_color || '#f43f5e'}
                        onChange={(e) => setEditingNavItem({ ...editingNavItem, bg_color: e.target.value })}
                        className="flex-1 px-2 py-1 text-xs rounded-lg bg-white border border-gray-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#111613]">Hiệu ứng chuyển động</label>
                    <select
                      value={editingNavItem.animation || 'shake'}
                      onChange={(e) => setEditingNavItem({ ...editingNavItem, animation: e.target.value as any })}
                      className="w-full px-2 py-1.5 text-xs rounded-lg bg-white border border-gray-200"
                    >
                      <option value="shake">⚡ Rung lắc (Shake)</option>
                      <option value="pulse">✨ Nhấp nháy (Pulse)</option>
                      <option value="none">Đứng yên (None)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sắp xếp & Trạng thái */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111613]">Thứ tự hiển thị (sort_order)</label>
                  <input
                    type="number"
                    value={editingNavItem.sort_order}
                    onChange={(e) => setEditingNavItem({ ...editingNavItem, sort_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="space-y-1.5 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingNavItem.is_active}
                      onChange={(e) => setEditingNavItem({ ...editingNavItem, is_active: e.target.checked })}
                      className="rounded border-gray-200 text-emerald-700 focus:ring-brand"
                    />
                    <span className="text-xs text-[#111613] font-medium">Đang bật hiển thị trên Header</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingNavItem(null)}
                  className="px-4 py-2 text-xs rounded-xl border border-gray-200 hover:bg-black/5  font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingNavItems}
                  className="px-5 py-2 text-xs rounded-xl bg-[#C8F31D] text-[#111613] hover:bg-[#d4fa36] font-bold shadow-xs transition-colors"
                >
                  {savingNavItems ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL SỬA / TẠO BANNER VỚI MULTI-DEVICE PREVIEW & SCHEDULING (R2 HOÀN CHỈNH) */}
      {editingBanner && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-gray-200 w-full max-w-6xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-[#141A17] border-b border-white/10 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C8F31D]/10 border border-[#C8F31D]/30 flex items-center justify-center text-[#C8F31D]">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span>{isCreating ? 'Tạo Mới Nội Dung Banner' : 'Chỉnh Sửa Nội Dung Banner'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/10 text-[#C8F31D]">
                      {editingBanner.position || 'HERO'}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-[#9BA39F]">
                    <span>Trạng thái dự kiến:</span>
                    <span className={`px-2 py-0.2 rounded font-semibold text-[10px] border ${getBannerStatus(editingBanner).badgeClass}`}>
                      {getBannerStatus(editingBanner).label}
                    </span>
                    <span className="hidden sm:inline opacity-70">• {getBannerStatus(editingBanner).subText}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile / Small Screen View Switcher */}
                <div className="flex lg:hidden items-center bg-white/10 rounded-xl p-0.5 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('form')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeModalTab === 'form' ? 'bg-[#C8F31D] text-[#111613]' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Thông số
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('preview')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeModalTab === 'preview' ? 'bg-[#C8F31D] text-[#111613]' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Xem trước
                  </button>
                </div>

                <button 
                  type="button" 
                  onClick={() => setEditingBanner(null)}
                  className="text-stone-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: 2 Columns on Desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-line">
              
              {/* CỘT TRÁI: FORM BIÊN TẬP THÔNG SỐ (lg:col-span-7) */}
              <div className={`lg:col-span-7 p-5 sm:p-6 overflow-y-auto space-y-5 ${
                activeModalTab === 'preview' ? 'hidden lg:block' : 'block'
              }`}>
                <form id="bannerEditForm" onSubmit={handleSaveBanner} className="space-y-4">
                  
                  {/* Vị trí hiển thị (Position Selector) */}
                  <div className="p-3.5 bg-white rounded-2xl border border-gray-200 space-y-1.5">
                    <label className="text-xs font-bold text-[#111613] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-700" />
                      Vị trí hiển thị trên Storefront (Position) *
                    </label>
                    <select
                      value={editingBanner.position || 'HERO'}
                      onChange={(e) => setEditingBanner({ ...editingBanner, position: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand font-medium text-[#111613]"
                    >
                      {BANNER_POSITIONS.map((pos) => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-[#6A726E]">
                      Chọn vị trí hiển thị để banner xuất hiện đúng ngữ cảnh ngoài giao diện người dùng.
                    </p>
                  </div>

                  {/* Tiêu đề & Huy hiệu (Nếu là Banner ảnh như HERO/MID_PAGE/POPUP thì chỉ cần Tên banner/Gợi nhớ SEO) */}
                  {editingBanner.position === 'USP_BAR' || editingBanner.position === 'ATHLETES' || editingBanner.position === 'HOME_PROMO_3' ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#111613]">Tiêu đề chính *</label>
                          <input
                            type="text"
                            required
                            value={editingBanner.title}
                            onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                            placeholder="VD: Vận chuyển TOÀN QUỐC hoặc Viktor Axelsen"
                            className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[#111613]">Huy hiệu tag nổi bật (Badge)</label>
                          <input
                            type="text"
                            value={editingBanner.badge}
                            onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                            placeholder="VD: truck, award, HOT"
                            className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#111613]">Mô tả ngắn</label>
                        <textarea
                          rows={2}
                          value={editingBanner.description}
                          onChange={(e) => setEditingBanner({ ...editingBanner, description: e.target.value })}
                          placeholder="Mô tả tóm tắt nội dung..."
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#111613]">Tên banner / Gợi nhớ quản trị (Alt text cho SEO) *</label>
                      <input
                        type="text"
                        required
                        value={editingBanner.title}
                        onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                        placeholder="VD: Banner Yonex Astrox 2026, Khuyến mãi cước Gosen..."
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                      />
                      <p className="text-[11px] text-[#6A726E]">
                        Dùng để nhận diện trong trang quản trị và tối ưu thẻ Alt cho công cụ tìm kiếm (SEO). Hệ thống sẽ không chèn chữ này đè lên ảnh.
                      </p>
                    </div>
                  )}

                  {/* UPLOAD ẢNH: CẢ DESKTOP & MOBILE */}
                  <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-4">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <h4 className="text-xs font-bold text-[#111613] flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                        Hình Ảnh Hiển Thị Đa Thiết Bị (Desktop &amp; Mobile)
                      </h4>
                      <span className="text-[10px] text-[#6A726E] font-mono">ImageKit.io CDN</span>
                    </div>

                    {/* Ảnh Desktop (16:9) - chỉ bắt buộc khi không phải USP_BAR */}
                    <div className="space-y-1.5">
                      <ImageUpload
                        value={editingBanner.imageSrc}
                        onChange={(url) => setEditingBanner({ ...editingBanner, imageSrc: url })}
                        folder="banners"
                        label={`Ảnh Desktop (Tỉ lệ chuẩn 16:9 ngang) ${editingBanner.position === 'USP_BAR' ? '(Tùy chọn cho dải cam kết)' : '*'}`}
                        helperText={editingBanner.position === 'USP_BAR' ? 'Đối với Dải 4 cam kết vàng, hệ thống ưu tiên dùng Icon biểu tượng vector. Bạn có thể để trống ảnh nếu chỉ dùng Icon.' : 'Khuyên dùng ảnh ngang độ phân giải cao (1920x1080 hoặc 16:9). Tự động nén qua ImageKit.'}
                        placeholder="Tải ảnh lên hoặc dán link CDN..."
                      />
                    </div>

                    {/* Bộ chọn Icon nhanh khi chọn vị trí USP_BAR */}
                    {editingBanner.position === 'USP_BAR' && (
                      <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2 pt-2">
                        <label className="text-[11px] font-bold text-[#111613] flex items-center justify-between">
                          <span>Chọn Icon Biểu Tượng (Badge Icon) *</span>
                          <span className="font-mono text-emerald-700 text-[10px]">{editingBanner.badge || 'truck'}</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { id: 'truck', label: 'Vận chuyển', icon: Truck },
                            { id: 'thumbs-up', label: 'Chất lượng', icon: ThumbsUp },
                            { id: 'credit-card', label: 'Thanh toán', icon: CreditCard },
                            { id: 'rotate-ccw', label: 'Đổi trả', icon: RotateCcw },
                            { id: 'shield-check', label: 'Bảo hành', icon: ShieldCheck },
                            { id: 'award', label: 'Chính hãng', icon: Award },
                            { id: 'flame', label: 'Khuyến mãi', icon: Flame },
                            { id: 'tag', label: 'Ưu đãi', icon: Tag },
                          ].map((item) => {
                            const IconComponent = item.icon;
                            const isSelected = (editingBanner.badge || '').toLowerCase() === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => setEditingBanner({ ...editingBanner, badge: item.id })}
                                className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-all ${
                                  isSelected
                                    ? 'bg-[#C8F31D]/15 border-[#C8F31D] text-[#111613] font-bold'
                                    : 'bg-white border-gray-200 text-[#6A726E] hover:text-[#111613] hover:bg-black/5 '
                                }`}
                              >
                                <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#7ca008]' : 'text-[#6A726E]'}`} />
                                <span className="text-[11px] truncate">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Ảnh Mobile riêng biệt */}
                    {editingBanner.position !== 'USP_BAR' && (
                      <div className="space-y-1.5 pt-2 border-t border-gray-200/60">
                        <ImageUpload
                          value={editingBanner.mobileImageSrc || ''}
                          onChange={(url) => setEditingBanner({ ...editingBanner, mobileImageSrc: url })}
                          folder="banners"
                          label="Ảnh Mobile chuyên dụng (Tỉ lệ 4:5 hoặc 9:16 tùy chọn)"
                          helperText="Tùy chọn: Dành riêng cho màn hình điện thoại di động. Nếu để trống, hệ thống tự động dùng ảnh Desktop."
                          placeholder="Tải ảnh mobile hoặc dán link CDN..."
                        />
                      </div>
                    )}
                  </div>

                  {/* Nút kêu gọi hành động (Primary & Secondary CTA) */}
                  <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <h4 className="text-xs font-bold text-[#111613] flex items-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-700" />
                        Nút Kêu Gọi Hành Động (CTA Buttons)
                      </h4>
                      {editingBanner.primaryCtaLink && (
                        <a
                          href={editingBanner.primaryCtaLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <span>Mở thử liên kết</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                  {/* ĐƯỜNG DẪN LIÊN KẾT ĐÍCH (KHI CLICK VÀO BANNER) */}
                  {editingBanner.position === 'USP_BAR' || editingBanner.position === 'ATHLETES' || editingBanner.position === 'HOME_PROMO_3' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#111613]">Chữ nút</label>
                        <input
                          type="text"
                          value={editingBanner.primaryCtaText || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, primaryCtaText: e.target.value })}
                          placeholder="VD: Xem ngay, Săn ngay"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[#111613]">Đường dẫn liên kết</label>
                        <input
                          type="text"
                          value={editingBanner.primaryCtaLink || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, primaryCtaLink: e.target.value })}
                          placeholder="VD: /vot-cau-long"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand font-mono"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={editingBanner.primaryCtaLink}
                          onChange={(e) => setEditingBanner({ ...editingBanner, primaryCtaLink: e.target.value })}
                          placeholder="VD: /vot-cau-long, /day-cuoc, /giay-cau-long hoặc https://..."
                          className="w-full pl-3 pr-8 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand font-mono"
                        />
                        {editingBanner.primaryCtaLink && (
                          <a
                            href={editingBanner.primaryCtaLink}
                            target="_blank"
                            rel="noreferrer"
                            title="Kiểm tra mở link này trong tab mới"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6A726E] hover:text-[#111613] transition-colors p-0.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <p className="text-[11px] text-[#6A726E]">
                        Khách hàng bấm vào bất kỳ vị trí nào trên banner sẽ được chuyển hướng ngay đến liên kết này.
                      </p>
                    </div>
                  )}
                  </div>

                  {/* LÊN LỊCH PHÁT SÓNG (SCHEDULING) */}
                  <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <h4 className="text-xs font-bold text-[#111613] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                        Lên Lịch Phát Sóng (Banner Scheduling)
                      </h4>
                      <span className="text-[10px] text-[#6A726E]">Định dạng ISO-8601</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#111613] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-blue-500" />
                          Thời gian bắt đầu phát (start_at)
                        </label>
                        <input
                          type="datetime-local"
                          value={toDateTimeLocalString(editingBanner.startAt)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingBanner({
                              ...editingBanner,
                              startAt: val ? new Date(val).toISOString() : undefined,
                            });
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand text-[#111613]"
                        />
                        <p className="text-[10px] text-[#6A726E]">Để trống nếu muốn hiển thị ngay khi kích hoạt.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#111613] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-rose-500" />
                          Thời gian hết hạn (end_at)
                        </label>
                        <input
                          type="datetime-local"
                          value={toDateTimeLocalString(editingBanner.endAt)}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingBanner({
                              ...editingBanner,
                              endAt: val ? new Date(val).toISOString() : undefined,
                            });
                          }}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand text-[#111613]"
                        />
                        <p className="text-[10px] text-[#6A726E]">Để trống nếu chiến dịch không giới hạn thời gian.</p>
                      </div>
                    </div>
                  </div>

                  {/* Sắp xếp & Trạng thái kích hoạt */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#111613]">Thứ tự hiển thị (sort_order)</label>
                      <input
                        type="number"
                        value={editingBanner.sortOrder || 0}
                        onChange={(e) => setEditingBanner({ ...editingBanner, sortOrder: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                      />
                    </div>
                    <div className="space-y-1.5 pt-5">
                      <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl bg-white border border-gray-200 hover:border-brand transition-colors">
                        <input
                          type="checkbox"
                          id="bannerIsActive"
                          checked={editingBanner.isActive}
                          onChange={(e) => setEditingBanner({ ...editingBanner, isActive: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-200 text-emerald-700 focus:ring-brand"
                        />
                        <div>
                          <span className="text-xs text-[#111613] font-bold block">Kích hoạt hiển thị (isActive)</span>
                          <span className="text-[10px] text-[#6A726E] block">Bật để banner tham gia hiển thị trên website</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              {/* CỘT PHẢI: INTERACTIVE MULTI-DEVICE PREVIEW (lg:col-span-5) */}
              <div className={`lg:col-span-5 p-5 sm:p-6 bg-[#0E1210] flex flex-col justify-between overflow-y-auto space-y-4 ${
                activeModalTab === 'form' ? 'hidden lg:flex' : 'flex'
              }`}>
                <div className="space-y-4">
                  
                  {/* Thanh điều khiển Preview Device */}
                  <div className="flex items-center justify-between bg-black/40 p-1.5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewDevice('desktop')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          previewDevice === 'desktop'
                            ? 'bg-[#C8F31D] text-[#111613] shadow-xs'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>🖥️ Desktop (16:9)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewDevice('mobile')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          previewDevice === 'mobile'
                            ? 'bg-[#C8F31D] text-[#111613] shadow-xs'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>📱 Mobile (375px)</span>
                      </button>
                    </div>

                    <span className="text-[10px] text-white/50 font-mono pr-2">
                      Live Preview
                    </span>
                  </div>

                  {/* CHẾ ĐỘ 1: XEM TRƯỚC DESKTOP */}
                  {previewDevice === 'desktop' && (
                    <div className="space-y-2">
                      {/* 1A. PREVIEW CHO USP_BAR (DẢI 4 CAM KẾT VÀNG) */}
                      {editingBanner.position === 'USP_BAR' ? (
                        <div className="p-4 rounded-2xl bg-stone-900 border border-white/15 space-y-3">
                          <div className="text-[11px] font-semibold text-white/70 flex items-center justify-between border-b border-white/10 pb-2">
                            <span>Mô phỏng Thẻ Cam Kết Vàng (Storefront USP Bar)</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBannerStatus(editingBanner).badgeClass}`}>
                              {getBannerStatus(editingBanner).label}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#141A17] border border-[#232F29] shadow-lg">
                              <div className="shrink-0 p-3 rounded-xl bg-[#C8F31D]/15 text-[#C8F31D]">
                                {(() => {
                                  const iconName = (editingBanner.badge || '').toLowerCase();
                                  if (iconName.includes('thumb')) return <ThumbsUp className="w-6 h-6" />;
                                  if (iconName.includes('credit') || iconName.includes('pay')) return <CreditCard className="w-6 h-6" />;
                                  if (iconName.includes('rotate') || iconName.includes('return') || iconName.includes('doi')) return <RotateCcw className="w-6 h-6" />;
                                  if (iconName.includes('shield') || iconName.includes('bao-hanh')) return <ShieldCheck className="w-6 h-6" />;
                                  if (iconName.includes('award')) return <Award className="w-6 h-6" />;
                                  if (iconName.includes('flame')) return <Flame className="w-6 h-6" />;
                                  if (iconName.includes('tag')) return <Tag className="w-6 h-6" />;
                                  return <Truck className="w-6 h-6" />;
                                })()}
                              </div>
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="text-sm text-white font-bold leading-tight">
                                  {editingBanner.title || 'Tiêu đề cam kết'}
                                </div>
                                <div className="text-xs text-white/70 leading-tight">
                                  {editingBanner.description || 'Mô tả chi tiết quyền lợi khách hàng'}
                                </div>
                              </div>
                              {editingBanner.primaryCtaLink && (
                                <a
                                  href={editingBanner.primaryCtaLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-lg bg-[#C8F31D] text-[#111613] text-xs font-bold hover:bg-[#d8fb48] transition-colors flex items-center gap-1 shrink-0"
                                  title="Kiểm tra mở liên kết đích"
                                >
                                  <span>{editingBanner.primaryCtaText || 'Xem ngay'}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="text-[10px] text-white/50 flex items-center justify-between pt-1">
                            <span>Bố cục: Thẻ trong dải 4 cam kết vàng chân Header</span>
                            <span>Badge Icon: {editingBanner.badge || 'truck'}</span>
                          </div>
                        </div>
                      ) : editingBanner.position === 'ATHLETES' ? (
                        /* 1B. PREVIEW CHO VẬN ĐỘNG VIÊN ĐẠI DIỆN */
                        <div className="p-4 rounded-2xl bg-stone-900 border border-white/15 space-y-3">
                          <div className="text-[11px] font-semibold text-white/70 flex items-center justify-between border-b border-white/10 pb-2">
                            <span>Mô phỏng Khối Vận Động Viên Đại Diện</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBannerStatus(editingBanner).badgeClass}`}>
                              {getBannerStatus(editingBanner).label}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#141A17] border border-white/10">
                            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-stone-800 border-2 border-[#C8F31D] shrink-0">
                              {editingBanner.imageSrc ? (
                                <SafeImage src={editingBanner.imageSrc} alt={editingBanner.title} fill className="object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/30">
                                  <Award className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-[#C8F31D] text-[#111613] uppercase tracking-wide">
                                {editingBanner.badge || 'VĐV HUYỀN THOẠI'}
                              </span>
                              <h4 className="font-bold text-sm text-white mt-1">{editingBanner.title || 'Tên vận động viên'}</h4>
                              <p className="text-xs text-white/70 line-clamp-2 mt-0.5">{editingBanner.description || 'Trích dẫn thành tích & lối đánh'}</p>
                            </div>
                          </div>
                        </div>
                      ) : editingBanner.position === 'HOME_PROMO_3' ? (
                        /* 1B. PREVIEW CHO BỘ 3 BANNER ƯU ĐÃI (SALE OFF CARDS) */
                        <div className="p-4 rounded-2xl bg-[#FAF8F3]  border border-[#ECE8DE]  space-y-3">
                          <div className="text-[11px] font-semibold text-[#11382B]  flex items-center justify-between border-b border-[#ECE8DE]  pb-2">
                            <span className="flex items-center gap-1.5 font-bold">
                              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                              Mô phỏng Thẻ Ưu Đãi (Khối SALE OFF Trang Chủ)
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBannerStatus(editingBanner).badgeClass}`}>
                              {getBannerStatus(editingBanner).label}
                            </span>
                          </div>

                          <div className="bg-white border border-[#ECE8DE] rounded-3xl p-5 flex items-center justify-between shadow-sm">
                            <div className="space-y-2 z-10 max-w-[62%]">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#11382B] text-white text-xs font-semibold">
                                <Flame className="w-3 h-3 text-[#4EBA86] fill-[#4EBA86]" />
                                <span>{editingBanner.badge || 'Ưu đãi tuần này'}</span>
                              </span>
                              <h3 className="text-base font-bold tracking-tight text-[#112F25]  leading-snug">
                                {editingBanner.title || 'VỢT YONEX SALE 30%'}
                              </h3>
                              <p className="text-xs text-[#556960]  leading-relaxed font-normal line-clamp-2">
                                {editingBanner.description || 'Tặng combo cước BG65 + Quấn cán miễn phí khi mua dòng vợt Astrox, Nanoflare.'}
                              </p>
                              <div className="pt-1.5">
                                {editingBanner.primaryCtaLink ? (
                                  <a
                                    href={editingBanner.primaryCtaLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#11382B] hover:bg-[#184E3D] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer group"
                                    title="Kiểm tra mở liên kết đích"
                                  >
                                    <span>{editingBanner.primaryCtaText || 'Săn ngay'}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#11382B] text-white text-xs font-semibold shadow-xs">
                                    <span>{editingBanner.primaryCtaText || 'Săn ngay'}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="w-28 h-36 relative shrink-0 flex items-center justify-center p-2 bg-stone-50  rounded-2xl border border-gray-200/40">
                              {editingBanner.imageSrc ? (
                                <SafeImage
                                  src={editingBanner.imageSrc}
                                  alt={editingBanner.title}
                                  fill
                                  className="object-contain"
                                />
                              ) : (
                                <div className="text-center text-[#6A726E] text-[10px]">Chưa có ảnh sản phẩm</div>
                              )}
                            </div>
                          </div>

                          <div className="text-[10px] text-[#6A726E] flex items-center justify-between pt-1">
                            <span>Vị trí: HOME_PROMO_3 (Khối 3 thẻ ưu đãi tuần)</span>
                            <span className="text-emerald-700">Khuyên dùng ảnh tách nền PNG (cây vợt hoặc giày)</span>
                          </div>
                        </div>
                      ) : (
                        /* 1C. PREVIEW CHO HERO / MID_PAGE / PROMO SLIDER (CHUẨN 16:9) */
                        <div className="space-y-2">
                          <div className="relative aspect-16/9 rounded-2xl overflow-hidden border border-white/15 bg-stone-900 shadow-2xl group flex flex-col justify-between p-3 select-none">
                            {/* Background Image - Clean 100% Brightness, No Dark Overlay */}
                            {editingBanner.imageSrc ? (
                              <a
                                href={editingBanner.primaryCtaLink || '#'}
                                target="_blank"
                                rel="noreferrer"
                                title="Bấm vào ảnh để kiểm tra liên kết đích"
                                className="absolute inset-0 block w-full h-full cursor-pointer"
                              >
                                <SafeImage
                                  src={editingBanner.imageSrc}
                                  alt={editingBanner.title}
                                  fill
                                  className="object-cover group-hover:scale-102 transition-transform duration-300"
                                />
                              </a>
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 bg-radial from-stone-800 to-stone-950">
                                <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                                <span className="text-xs">Chưa có ảnh Desktop</span>
                              </div>
                            )}

                            {/* Header Status Badge */}
                            <div className="relative z-10 flex items-center justify-between pointer-events-none">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/20">
                                {editingBanner.position || 'HERO'}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border backdrop-blur-md ${getBannerStatus(editingBanner).badgeClass}`}>
                                {getBannerStatus(editingBanner).label}
                              </span>
                            </div>

                            {/* Clickable pill indicator at bottom */}
                            <div className="relative z-10 mt-auto flex items-center justify-between bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15 text-[11px] text-white">
                              <span className="truncate max-w-[240px] font-mono text-zinc-300">
                                🔗 {editingBanner.primaryCtaLink || 'Chưa gắn link'}
                              </span>
                              {editingBanner.primaryCtaLink && (
                                <a
                                  href={editingBanner.primaryCtaLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#C8F31D] hover:underline flex items-center gap-1 font-semibold ml-2 shrink-0"
                                >
                                  <span>Mở thử link</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="text-[10px] text-white/60 flex items-center justify-between px-1">
                            <span>🖥️ Tỉ lệ chuẩn Desktop 16:9 • Ảnh sắc nét 100% không bị phủ tối</span>
                            <span className="text-[#C8F31D]">💡 Nhấn vào ảnh để kiểm tra liên kết</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CHẾ ĐỘ 2: XEM TRƯỚC MOBILE (VIEWPORT 375PX FRAME) */}
                  {previewDevice === 'mobile' && (
                    <div className="space-y-2">
                      <div className="w-[310px] sm:w-[340px] max-w-full mx-auto rounded-[2.5rem] border-4 border-stone-800 bg-stone-950 p-2.5 shadow-2xl relative">
                        
                        {/* Loa thoại / Dynamic Island mô phỏng */}
                        <div className="w-24 h-3.5 bg-stone-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-stone-900 mr-2" />
                          <div className="w-8 h-1 rounded-full bg-stone-700" />
                        </div>

                        {/* Màn hình điện thoại sạch sẽ, không lớp tối mờ, không đè chữ */}
                        <div className="relative rounded-[1.75rem] overflow-hidden bg-stone-900 border border-stone-800/80 aspect-[9/14] flex flex-col justify-between p-3 select-none">
                          {/* Background ảnh mobile hoặc fallback desktop */}
                          {editingBanner.mobileImageSrc || editingBanner.imageSrc ? (
                            <a
                              href={editingBanner.primaryCtaLink || '#'}
                              target="_blank"
                              rel="noreferrer"
                              title="Bấm vào ảnh để kiểm tra liên kết mobile"
                              className="absolute inset-0 block w-full h-full cursor-pointer"
                            >
                              <SafeImage
                                src={editingBanner.mobileImageSrc || editingBanner.imageSrc}
                                alt={editingBanner.title}
                                fill
                                className="object-cover"
                              />
                            </a>
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 bg-radial from-stone-800 to-stone-950">
                              <Smartphone className="w-8 h-8 mb-1.5 opacity-50" />
                              <span className="text-[11px]">Chưa có ảnh</span>
                            </div>
                          )}

                          {/* Header Status */}
                          <div className="relative z-10 flex items-center justify-between pointer-events-none pt-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/60 text-white backdrop-blur-md border border-white/20">
                              📱 Mobile
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border backdrop-blur-md ${getBannerStatus(editingBanner).badgeClass}`}>
                              {getBannerStatus(editingBanner).label}
                            </span>
                          </div>

                          {/* Footer Link Indicator */}
                          <div className="relative z-10 mt-auto bg-black/75 backdrop-blur-md p-2 rounded-xl border border-white/15 text-[10px] text-white">
                            <div className="truncate font-mono text-zinc-300">
                              🔗 {editingBanner.primaryCtaLink || 'Chưa gắn link'}
                            </div>
                          </div>
                        </div>

                        {/* Thanh gạt Home bar dưới đáy máy */}
                        <div className="w-28 h-1 bg-stone-700 rounded-full mx-auto mt-2" />
                      </div>

                      <div className="text-[10px] text-white/60 flex items-center justify-between px-1">
                        <span>📱 Khung di động 375px</span>
                        <span className="text-[#C8F31D]">
                          {editingBanner.mobileImageSrc ? 'Đang dùng ảnh Mobile riêng' : 'Tự co dãn từ ảnh Desktop'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hướng dẫn tóm tắt preview */}
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-[11px] text-[#9BA39F] space-y-1">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C8F31D]" />
                    Đồng Bộ Thời Gian Thực (Live Sync)
                  </div>
                  <div>Mọi thay đổi trên Form sẽ lập tức phản ánh trực tiếp vào khung xem trước để kiểm tra bố cục chữ và ảnh.</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-[#6A726E]">
                {editingBanner.id ? `ID: ${editingBanner.id}` : 'Banner mới (chưa lưu)'}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="px-4 py-2 text-xs rounded-xl border border-gray-200 hover:bg-black/5  font-medium transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  form="bannerEditForm"
                  className="px-6 py-2 text-xs rounded-xl bg-[#C8F31D] text-[#111613] hover:bg-[#d4fa36] font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isCreating ? 'Tạo Mới Banner' : 'Lưu Thay Đổi'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL SỬA DANH MỤC */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 bg-[#141A17] border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base text-white">Đổi Ảnh &amp; Tag Phụ Danh Mục</h3>
                <span className="text-xs text-[#9BA39F]">{editingCategory.name} ({editingCategory.slug})</span>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingCategory(null)}
                className="text-stone-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111613]">Tên danh mục</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#111613]">Dòng Tag phụ hiển thị dưới tên</label>
                <input
                  type="text"
                  value={editingCategory.tag_subtitle}
                  onChange={(e) => setEditingCategory({ ...editingCategory, tag_subtitle: e.target.value })}
                  placeholder="VD: Yonex · Victor · Li-Ning"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                />
                <p className="text-[11px] text-[#6A726E]">Hiển thị nổi bật bằng chữ xanh ngọc dưới tên danh mục ngoài trang chủ.</p>
              </div>

              <div className="space-y-1.5">
                <ImageUpload
                  value={editingCategory.image_url}
                  onChange={(url) => setEditingCategory({ ...editingCategory, image_url: url })}
                  folder="categories"
                  label="Ảnh đại diện danh mục"
                  placeholder="Tải ảnh hoặc dán link ảnh..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#111613]">Thứ tự hiển thị (sort_order)</label>
                  <input
                    type="number"
                    value={editingCategory.sort_order}
                    onChange={(e) => setEditingCategory({ ...editingCategory, sort_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-gray-200 focus:outline-none focus:border-brand"
                  />
                </div>
                <div className="space-y-1.5 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCategory.is_featured}
                      onChange={(e) => setEditingCategory({ ...editingCategory, is_featured: e.target.checked })}
                      className="rounded border-gray-200 text-emerald-700 focus:ring-brand"
                    />
                    <span className="text-xs text-[#111613] font-medium">Hiển thị ra trang chủ</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 text-xs rounded-xl border border-gray-200 hover:bg-black/5  font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs rounded-xl bg-[#C8F31D] text-[#111613] hover:bg-[#d4fa36] font-bold shadow-xs transition-colors"
                >
                  Lưu Danh Mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminBannersPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-stone-500">Đang tải CMS banners...</div>}>
      <AdminBannersPageContent />
    </React.Suspense>
  );
}
