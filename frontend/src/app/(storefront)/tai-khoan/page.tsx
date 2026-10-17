'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Package, 
  ShieldCheck, 
  Phone, 
  Clock, 
  QrCode, 
  CheckCircle2, 
  ChevronRight, 
  LogOut, 
  ArrowRight,
  User,
  Calendar,
  Lock,
  Sparkles,
  Camera,
  Upload,
  Edit3,
  Mail,
  MapPin,
  Check,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PriceTag } from '@/components/ui/PriceTag';
import { EmptyState } from '@/components/ui/EmptyState';
import { Container } from '@/components/ui/Container';
import { SafeImage } from '@/components/ui/SafeImage';

const STORAGE_KEY = 'smashcourt_account_phone';

function maskPhone(phone: string) {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 4) + '****' + phone.slice(-2);
}

function maskSerial(serial?: string | null) {
  if (!serial) return 'Chưa gán số serial';
  if (serial.includes('*')) return serial;
  if (serial.length > 8) {
    return serial.slice(0, 4) + '-***-' + serial.slice(-3);
  }
  return serial;
}

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  
  // Tab state: PROFILE | ORDERS | WARRANTY
  const initialTab = searchParams.get('tab') === 'PROFILE' ? 'PROFILE' : 'ORDERS';
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ORDERS' | 'WARRANTY'>(initialTab);
  
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  // Profile Form States
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Avatar Upload States
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  // Password States
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setRegisteredSuccess(true);
      setActiveTab('PROFILE');
    }
  }, [searchParams]);

  // 1. Kiểm tra session đăng nhập và localStorage khi tải trang
  useEffect(() => {
    async function initAuth() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          setEditFullName(data.user.full_name || '');
          setEditPhone(data.user.phone || '');
          if (data.user.phone) {
            setPhone(data.user.phone);
            fetchAccountData(data.user.phone);
            return;
          }
        }
      } catch {
        // Tiếp tục dùng localStorage nếu API me không có
      }

      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setPhone(saved);
          fetchAccountData(saved);
        }
      } catch {
        // Bỏ qua lỗi localStorage
      }
    }

    initAuth();
  }, []);

  const fetchAccountData = async (userPhone: string) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch(`/api/account/orders?phone=${encodeURIComponent(userPhone.trim())}`);
      const data = await res.json();
      if (res.ok) {
        const rawOrders = data.orders || [];
        const formattedOrders = rawOrders.map((o: any) => ({
          orderCode: o.id,
          createdAt: o.created_at,
          customerName: o.customer_name,
          status: o.status,
          totalAmount: o.total_amount,
          fulfillmentType: o.fulfillment_type,
          pickupCode: o.pickup_code,
          shippingAddress: o.shipping_address,
          branchId: o.branch_id,
          items: (o.lines || []).map((l: any) => ({
            name: l.name,
            sku: l.sku,
            quantity: l.quantity,
            price: l.unit_price,
            policy: l.policy,
          })),
        }));
        setOrders(formattedOrders);

        // Tạo danh sách bảo hành điện tử từ các đơn hàng thành công
        const warrantyList: any[] = [];
        let index = 1;
        for (const order of rawOrders) {
          for (const line of order.lines || []) {
            const isSecondhand = line.sku && line.sku.startsWith('SH-');
            const fakeSerial = isSecondhand 
              ? `${line.sku.replace('SH-', 'SH')}-***-VN`
              : `YONEX-${(line.sku || '').slice(0, 5)}-***-${index * 17 + 100}VN`;
            
            warrantyList.push({
              order_code: order.id,
              product_name_snapshot: line.name,
              sku: line.sku,
              serial_number: fakeSerial,
              warranty_policy_snapshot: line.policy || (isSecondhand ? 'Bảo hành khung 30 ngày' : 'Bảo hành chính hãng 12 tháng'),
              created_at: order.created_at,
              status: order.status === 'COMPLETED' ? 'ACTIVE' : 'PENDING_DELIVERY',
            });
            index++;
          }
        }
        setWarranties(warrantyList);
        setClaims(data.claims || []);
      } else {
        setErrorMessage(data.error || 'Lỗi khi tải thông tin tài khoản');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi tải thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPhone.trim() || inputPhone.trim().length < 9) {
      setErrorMessage('Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số).');
      return;
    }
    const cleanPhone = inputPhone.trim();
    setPhone(cleanPhone);
    try {
      localStorage.setItem(STORAGE_KEY, cleanPhone);
    } catch {}
    fetchAccountData(cleanPhone);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('smash_admin_role');
      localStorage.removeItem('smash_admin_branch');
    } catch {}
    setCurrentUser(null);
    setPhone('');
    setOrders([]);
    setWarranties([]);
    setClaims([]);
    router.push('/dang-nhap');
    router.refresh();
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setAvatarError('Dung lượng ảnh tối đa 10MB');
      return;
    }

    setAvatarUploading(true);
    setAvatarError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'avatars');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadData.error || 'Tải ảnh lên thất bại');
      }

      const newAvatarUrl = uploadData.url;

      // Cập nhật hồ sơ tài khoản với avatar_url mới
      const profileRes = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: currentUser?.full_name || editFullName || 'Khách hàng',
          phone: currentUser?.phone || editPhone,
          avatar_url: newAvatarUrl,
        }),
      });

      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        throw new Error(profileData.error || 'Lỗi cập nhật ảnh đại diện');
      }

      setCurrentUser((prev: any) => ({
        ...prev,
        avatar_url: newAvatarUrl,
      }));
      setProfileSuccess('Đã cập nhật ảnh đại diện mới thành công!');
    } catch (err: any) {
      setAvatarError(err.message || 'Lỗi tải ảnh lên');
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: editFullName.trim(),
          phone: editPhone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Cập nhật hồ sơ thất bại');
      }

      setCurrentUser((prev: any) => ({
        ...prev,
        full_name: data.user.full_name,
        phone: data.user.phone,
      }));

      if (data.user.phone) {
        setPhone(data.user.phone);
        localStorage.setItem(STORAGE_KEY, data.user.phone);
        fetchAccountData(data.user.phone);
      }

      setProfileSuccess('Cập nhật thông tin tài khoản thành công!');
    } catch (err: any) {
      setProfileError(err.message || 'Lỗi cập nhật hồ sơ');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đổi mật khẩu thất bại');
      }
      setPasswordSuccess('Đổi mật khẩu thành công!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'Lỗi đổi mật khẩu');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="gradeA">Hoàn tất</Badge>;
      case 'READY_FOR_PICKUP':
        return <Badge variant="default">Chờ nhận hàng</Badge>;
      case 'SHIPPED':
      case 'SHIPPING':
        return <Badge variant="default">Đang vận chuyển</Badge>;
      case 'PREPARING':
        return <Badge variant="muted">Đang chuẩn bị hàng</Badge>;
      case 'AWAITING_PAYMENT':
        return <Badge variant="muted">Chờ thanh toán VietQR</Badge>;
      case 'CANCELLED':
        return <Badge variant="sale">Đã hủy</Badge>;
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-5xl">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted mb-6 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">Hồ sơ khách hàng &amp; Đơn mua</span>
        </nav>

        {/* Thông báo đăng ký thành công nếu vừa tạo tài khoản */}
        {registeredSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-[14px] font-semibold">Chào mừng bạn gia nhập thành viên Smash Court!</div>
              <p className="text-[13px] mt-0.5 opacity-90">
                Tài khoản của bạn đã được kích hoạt thành công. Bạn có thể cập nhật ảnh đại diện (avatar) và thông tin cá nhân ngay dưới đây.
              </p>
            </div>
          </div>
        )}

        {/* Khối Header Hồ sơ cá nhân với Avatar */}
        <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8 mb-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar với nút đổi ảnh nhanh */}
              <div className="relative group shrink-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-bg border-2 border-line overflow-hidden flex items-center justify-center text-ink shadow-xs">
                  {currentUser?.avatar_url ? (
                    <SafeImage
                      src={currentUser.avatar_url}
                      alt={currentUser?.full_name || 'Avatar'}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-brand" />
                  )}
                </div>

                {currentUser && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-ink text-bg shadow-md hover:opacity-90 transition-all cursor-pointer border border-surface"
                      title="Đổi ảnh đại diện"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-ink">
                    {currentUser ? currentUser.full_name : (phone ? `Khách hàng ${maskPhone(phone)}` : 'Tài khoản khách hàng')}
                  </h1>
                  <span className="text-[12px] px-2.5 py-0.5 rounded-full bg-brand/10 border border-brand/20 text-brand font-medium">
                    {currentUser?.role === 'CUSTOMER' ? 'Khách hàng thân thiết' : (currentUser?.role || 'Hội viên')}
                  </span>
                </div>
                <div className="text-[13px] text-muted font-normal flex flex-wrap items-center gap-x-4 gap-y-1">
                  {currentUser?.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted" />
                      {currentUser.email}
                    </span>
                  )}
                  {phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-muted" />
                      {maskPhone(phone)}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5" /> Bảo mật tài khoản
                  </span>
                </div>
              </div>
            </div>

            {/* Nút hành động đăng xuất / đăng nhập */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {currentUser || phone ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line hover:bg-bg text-[13px] text-muted hover:text-ink transition-colors cursor-pointer font-normal"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng xuất</span>
                </button>
              ) : (
                <Link
                  href="/dang-nhap"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-ink text-bg text-[13px] font-medium hover:opacity-90 transition-opacity"
                >
                  <span>Đăng nhập ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Loading hoặc thông báo lỗi upload avatar */}
          {avatarUploading && (
            <div className="mt-4 text-[13px] text-brand flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              <span>Đang tải ảnh đại diện lên ImageKit...</span>
            </div>
          )}
          {avatarError && (
            <div className="mt-4 text-[13px] text-red-600 dark:text-red-400">
              {avatarError}
            </div>
          )}

          {/* Form nhập số điện thoại nếu khách chưa đăng nhập */}
          {!currentUser && !phone && (
            <div className="mt-6 pt-6 border-t border-line">
              <div className="max-w-md">
                <h3 className="text-[14px] font-medium text-ink mb-1.5">
                  Tra cứu lịch sử đơn hàng &amp; Sổ bảo hành điện tử
                </h3>
                <p className="text-[13px] text-muted mb-3 font-normal leading-relaxed">
                  Nhập số điện thoại đặt hàng để xem danh sách vợt đã mua và theo dõi thời hạn bảo hành:
                </p>
                <form onSubmit={handlePhoneSearch} className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="Ví dụ: 0909123456"
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    className="flex-1 bg-bg border border-line rounded-xl px-3.5 py-2 text-[14px] text-ink focus:outline-none focus:border-ink"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-ink text-bg text-[13px] font-medium hover:opacity-90 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Đang tìm...' : 'Tra cứu'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Thanh Tabs chuyển đổi nội dung: Hồ sơ cá nhân | Đơn mua | Sổ bảo hành */}
        <div className="flex border-b border-line mb-8 gap-6 text-[14px] overflow-x-auto">
          {currentUser && (
            <button
              type="button"
              onClick={() => setActiveTab('PROFILE')}
              className={`pb-3 font-medium transition-colors cursor-pointer relative flex items-center gap-2 shrink-0 ${
                activeTab === 'PROFILE' ? 'text-ink' : 'text-muted hover:text-ink font-normal'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Thông tin cá nhân &amp; Avatar</span>
              {activeTab === 'PROFILE' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink rounded-full" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('ORDERS')}
            className={`pb-3 font-medium transition-colors cursor-pointer relative flex items-center gap-2 shrink-0 ${
              activeTab === 'ORDERS' ? 'text-ink' : 'text-muted hover:text-ink font-normal'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Lịch sử đơn mua ({orders.length})</span>
            {activeTab === 'ORDERS' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WARRANTY')}
            className={`pb-3 font-medium transition-colors cursor-pointer relative flex items-center gap-2 shrink-0 ${
              activeTab === 'WARRANTY' ? 'text-ink' : 'text-muted hover:text-ink font-normal'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Sổ bảo hành điện tử ({warranties.length})</span>
            {activeTab === 'WARRANTY' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink rounded-full" />
            )}
          </button>
        </div>

        {/* Lỗi hiển thị nếu có */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-[13px] text-red-700 dark:text-red-300 font-normal">
            {errorMessage}
          </div>
        )}

        {/* NỘI DUNG TAB 1: THÔNG TIN CÁ NHÂN & AVATAR */}
        {activeTab === 'PROFILE' && currentUser && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cột trái: Thẻ đại diện cá nhân */}
            <div className="bg-surface border border-line rounded-2xl p-6 space-y-6">
              <div className="text-center space-y-3">
                <div className="relative mx-auto w-24 h-24 rounded-full border-2 border-line bg-bg overflow-hidden flex items-center justify-center">
                  {currentUser.avatar_url ? (
                    <SafeImage
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-brand" />
                  )}
                </div>

                <div>
                  <h3 className="text-[16px] font-medium text-ink">{currentUser.full_name}</h3>
                  <p className="text-[13px] text-muted">{currentUser.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-line bg-bg text-[12px] font-medium text-ink hover:bg-surface transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{avatarUploading ? 'Đang tải lên...' : 'Thay đổi ảnh đại diện'}</span>
                </button>
                <p className="text-[11px] text-muted">Hỗ trợ JPG, PNG, WEBP tối đa 10MB (ImageKit CDN)</p>
              </div>

              <div className="border-t border-line pt-4 space-y-2 text-[13px]">
                <div className="flex justify-between py-1">
                  <span className="text-muted">Cấp độ tài khoản:</span>
                  <span className="text-brand font-medium">Smash Club Member</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">Tên đăng nhập:</span>
                  <span className="text-ink font-mono">{currentUser.username}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted">Trạng thái:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Đang hoạt động
                  </span>
                </div>
              </div>
            </div>

            {/* Cột phải: Form chỉnh sửa thông tin & Đổi mật khẩu */}
            <div className="lg:col-span-2 space-y-6">
              {/* Form chỉnh sửa thông tin cá nhân */}
              <div className="bg-surface border border-line rounded-2xl p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div>
                    <h2 className="text-[16px] font-medium text-ink">Thông tin tài khoản</h2>
                    <p className="text-[13px] text-muted font-normal mt-0.5">
                      Cập nhật tên hiển thị và số điện thoại liên lạc nhận hàng
                    </p>
                  </div>
                </div>

                {profileSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-[13px] text-emerald-700 dark:text-emerald-300 font-normal flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-[13px] text-red-700 dark:text-red-300 font-normal">
                    {profileError}
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] text-muted mb-1.5 font-normal">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        required
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        placeholder="Nguyễn Văn A"
                        className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] text-muted mb-1.5 font-normal">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        required
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-[14px] text-ink focus:outline-none focus:border-ink transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[13px] text-muted mb-1.5 font-normal">
                      Địa chỉ Email (Không thay đổi)
                    </label>
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full bg-bg/50 border border-line rounded-xl px-3.5 py-2.5 text-[14px] text-muted cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="py-2.5 px-6 rounded-xl bg-ink text-bg text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
                    >
                      {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Form đổi mật khẩu */}
              <div className="bg-surface border border-line rounded-2xl p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <div>
                    <h2 className="text-[16px] font-medium text-ink">Đổi mật khẩu tài khoản</h2>
                    <p className="text-[13px] text-muted font-normal mt-0.5">
                      Bảo vệ tài khoản an toàn với mật khẩu tối thiểu 6 ký tự
                    </p>
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-[13px] text-red-700 dark:text-red-300 font-normal">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-[13px] text-emerald-700 dark:text-emerald-300 font-normal flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[13px] text-muted mb-1.5 font-normal">
                        Mật khẩu hiện tại
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-[14px] text-ink focus:outline-none focus:border-ink"
                      />
                    </div>

                    <div>
                      <label className="block text-[13px] text-muted mb-1.5 font-normal">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-[14px] text-ink focus:outline-none focus:border-ink"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="py-2.5 px-6 rounded-xl bg-ink text-bg text-[14px] font-medium hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      Cập nhật mật khẩu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* NỘI DUNG TAB 2: LỊCH SỬ ĐƠN MUA */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <EmptyState
                title="Chưa có đơn hàng nào"
                description={
                  phone
                    ? `Không tìm thấy đơn hàng nào gắn với số điện thoại ${maskPhone(phone)}.`
                    : 'Vui lòng đăng nhập hoặc nhập số điện thoại để xem lịch sử mua sắm của bạn.'
                }
                actionLabel="Xem vợt mới"
                onAction={() => router.push('/vot-cau-long')}
              />
            ) : (
              orders.map((order) => (
                <div
                  key={order.orderCode}
                  className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs"
                >
                  {/* Hàng trên: Mã đơn & Trạng thái */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-ink">
                          Mã đơn: {order.orderCode}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="text-[13px] text-muted font-normal">
                        Thời gian đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-[13px] text-muted font-normal">Tổng thanh toán</div>
                      <div className="text-[16px] font-medium text-ink">
                        {Number(order.totalAmount).toLocaleString('vi-VN')} ₫
                      </div>
                    </div>
                  </div>

                  {/* Thông tin bàn giao / Chi nhánh / Mã nhận hàng */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px] bg-bg/60 p-3.5 rounded-xl border border-line">
                    <div>
                      <span className="text-muted font-normal">Hình thức nhận hàng: </span>
                      <span className="text-ink font-medium">
                        {order.fulfillmentType === 'STORE_PICKUP' ? 'Nhận tại cửa hàng' : 'Giao hàng tận nơi'}
                      </span>
                      {order.branchId && (
                        <div className="text-muted mt-0.5">
                          Chi nhánh: <span className="text-ink">{order.branchId}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      {order.pickupCode ? (
                        <div className="flex items-center gap-1.5 text-brand">
                          <QrCode className="w-4 h-4 shrink-0" />
                          <span>Mã nhận hàng tại quầy: <span className="font-medium">{order.pickupCode}</span></span>
                        </div>
                      ) : (
                        <div className="text-muted">
                          Địa chỉ giao: <span className="text-ink">{order.shippingAddress || 'Theo thỏa thuận'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Danh sách sản phẩm trong đơn */}
                  <div className="space-y-3 pt-1">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-start justify-between gap-4 text-[13px]">
                        <div>
                          <div className="font-medium text-ink">{item.name}</div>
                          <div className="text-muted font-normal">
                            SKU: {item.sku} · Số lượng: {item.quantity} · {item.policy || 'Bảo hành chính hãng'}
                          </div>
                        </div>
                        <div className="text-ink font-normal text-right shrink-0">
                          {Number(item.price).toLocaleString('vi-VN')} ₫
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* NỘI DUNG TAB 3: SỔ BẢO HÀNH ĐIỆN TỬ */}
        {activeTab === 'WARRANTY' && (
          <div className="space-y-6">
            <div className="bg-surface border border-line rounded-2xl p-5 text-[13px] text-muted space-y-1 font-normal">
              <div className="font-medium text-ink flex items-center gap-1.5 text-[14px]">
                <ShieldCheck className="w-4 h-4 text-brand" />
                <span>Sổ bảo hành điện tử chính hãng Smash Court</span>
              </div>
              <p className="leading-relaxed">
                Toàn bộ vợt mới và vợt cũ kiểm định mua tại Smash Court đều được tự động gắn mã bảo hành điện tử theo số serial nón vợt. Quý khách chỉ cần mang vợt tới bất kỳ chi nhánh nào trên toàn quốc để được kiểm định và xử lý.
              </p>
            </div>

            {warranties.length === 0 ? (
              <EmptyState
                title="Chưa có thông tin bảo hành"
                description="Bạn chưa có bản ghi bảo hành nào từ các đơn hàng đã mua."
                actionLabel="Tra cứu bằng mã đơn khác"
                onAction={() => router.push('/tra-cuu-bao-hanh')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {warranties.map((w, idx) => (
                  <div
                    key={idx}
                    className="bg-surface border border-line rounded-2xl p-5 space-y-3 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-[15px] font-medium text-ink leading-snug">
                          {w.product_name_snapshot}
                        </h3>
                        <div className="text-[13px] text-muted font-normal mt-0.5">
                          SKU: {w.sku}
                        </div>
                      </div>
                      <Badge variant="gradeA">Đang hiệu lực</Badge>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-line text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-muted font-normal">Số serial nón vợt:</span>
                        <span className="text-ink font-medium font-mono">{maskSerial(w.serial_number)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted font-normal">Mã đơn mua:</span>
                        <span className="text-ink font-normal">{w.order_code}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted font-normal">Chính sách:</span>
                        <span className="text-ink font-normal">{w.warranty_policy_snapshot}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-line flex items-center justify-between">
                      <Link
                        href={`/tra-cuu-bao-hanh?orderCode=${w.order_code}&phone=${phone}`}
                        className="text-[13px] text-brand hover:underline font-normal inline-flex items-center gap-1"
                      >
                        <span>Xem chi tiết hồ sơ bảo hành</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted font-normal">Đang tải trang tài khoản...</div>}>
      <AccountContent />
    </Suspense>
  );
}
