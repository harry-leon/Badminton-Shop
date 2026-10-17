'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { ShieldCheck, User, KeyRound, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || searchParams.get('from') || '';
  const initialMode = searchParams.get('mode') === 'register' ? 'REGISTER' : 'LOGIN';

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleLogin = async (loginEmail?: string, loginPassword?: string) => {
    const targetEmail = loginEmail || email;
    const targetPassword = loginPassword || password;

    if (!targetEmail.trim() || !targetPassword) {
      setErrorMessage('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail.trim(),
          password: targetPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công');
      }

      setSuccessMessage(`Đăng nhập thành công với vai trò ${data.user.role}!`);

      // Lưu thông tin chi nhánh và SĐT tài khoản
      if (typeof window !== 'undefined') {
        if (data.user.role !== 'CUSTOMER' && data.user.branch_id) {
          localStorage.setItem('smash_admin_branch', data.user.branch_id);
        }
        if (data.user.phone) {
          localStorage.setItem('smashcourt_account_phone', data.user.phone);
        }
      }

      // Điều hướng theo vai trò hoặc query redirect
      setTimeout(() => {
        if (redirectUrl) {
          router.push(redirectUrl);
        } else if (data.user.role === 'CUSTOMER') {
          router.push('/tai-khoan');
        } else {
          router.push('/portal/inventory');
        }
        router.refresh();
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || !phone.trim()) {
      setErrorMessage('Vui lòng điền đầy đủ các trường thông tin.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim() || 'Khách hàng',
          phone: phone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký không thành công');
      }

      setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển hướng vào trang hồ sơ cá nhân...');
      if (typeof window !== 'undefined' && data.user?.phone) {
        localStorage.setItem('smashcourt_account_phone', data.user.phone);
      }

      setTimeout(() => {
        router.push('/tai-khoan?registered=true&tab=PROFILE');
        router.refresh();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-10 sm:py-16">
      <Container className="max-w-xl">
        {/* Tiêu đề trang */}
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center gap-1.5 text-[13px] text-brand font-normal bg-surface px-3 py-1 rounded-full border border-line">
            <ShieldCheck className="w-4 h-4" />
            <span>Hệ thống tài khoản chính thức · Smash Court</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
            {mode === 'LOGIN' ? 'Đăng nhập tài khoản' : 'Đăng ký thành viên mới'}
          </h1>
          <p className="text-[14px] text-muted max-w-md mx-auto font-normal">
            Đăng nhập để theo dõi đơn mua, tra cứu bảo hành và tích điểm thành viên Smash Club.
          </p>
        </div>

        <div>
          {/* Form đăng nhập / đăng ký */}
          <div className="bg-surface p-6 sm:p-8 rounded-2xl border border-line shadow-xs">
            {/* Tab chuyển Đăng nhập / Đăng ký */}
            <div className="flex border-b border-line mb-6">
              <button
                type="button"
                onClick={() => { setMode('LOGIN'); setErrorMessage(''); }}
                className={`flex-1 pb-3 text-[14px] transition-colors cursor-pointer text-center relative ${
                  mode === 'LOGIN' ? 'text-ink font-medium' : 'text-muted hover:text-ink font-normal'
                }`}
              >
                Đăng nhập
                {mode === 'LOGIN' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => { setMode('REGISTER'); setErrorMessage(''); }}
                className={`flex-1 pb-3 text-[14px] transition-colors cursor-pointer text-center relative ${
                  mode === 'REGISTER' ? 'text-ink font-medium' : 'text-muted hover:text-ink font-normal'
                }`}
              >
                Đăng ký tài khoản
                {mode === 'REGISTER' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink rounded-full" />
                )}
              </button>
            </div>

            {/* Thông báo lỗi / thành công */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-[13px] text-red-700 dark:text-red-300 font-normal">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-[13px] text-emerald-700 dark:text-emerald-300 font-normal flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {mode === 'LOGIN' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[13px] text-muted mb-1.5 font-normal">
                    Email hoặc số di động
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Email hoặc số di động"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-[14px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] text-muted mb-1.5 font-normal">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-[14px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-ink text-bg text-[14px] font-medium hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? 'Đang xử lý...' : 'Đăng nhập ngay'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[13px] text-muted mb-1.5 font-normal">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Họ và tên"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-[14px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[13px] text-muted mb-1.5 font-normal">
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Địa chỉ Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-[14px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[13px] text-muted mb-1.5 font-normal">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Số điện thoại (để tra cứu bảo hành và nhận mã nhận hàng)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-[14px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[13px] text-muted mb-1.5 font-normal">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-bg border border-line rounded-xl px-3.5 py-2.5 text-[14px] text-ink placeholder:text-muted/70 focus:outline-none focus:border-ink transition-colors"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-ink text-bg text-[14px] font-medium hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? 'Đang tạo tài khoản...' : 'Đăng ký tài khoản'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-4 border-t border-line text-[13px] text-muted text-center font-normal">
              Bảo mật 100% qua httpOnly cookie session, chống tấn công XSS & CSRF.
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted font-normal">Đang tải trang đăng nhập...</div>}>
      <LoginForm />
    </Suspense>
  );
}
