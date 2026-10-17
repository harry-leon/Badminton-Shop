'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { ShieldAlert, ArrowLeft, LogIn, Home } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="py-16 sm:py-24">
      <Container className="max-w-lg text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-[14px] text-amber-600 dark:text-amber-400 font-medium">
            Lỗi 403 — Không có quyền truy cập
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
            Khu vực hạn chế phân quyền
          </h1>
          <p className="text-[14px] text-muted leading-relaxed font-normal">
            Bạn đang đăng nhập bằng tài khoản vai trò Khách hàng (<span className="text-ink font-medium">CUSTOMER</span>). Cổng quản trị nội bộ chỉ dành cho Nhân viên cửa hàng, Quản lý chi nhánh hoặc Quản trị viên.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-ink text-bg text-[14px] font-medium hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            <span>Về trang chủ</span>
          </Link>
          <Link
            href="/dang-nhap?redirect=/admin/inventory"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl border border-line bg-surface text-ink text-[14px] font-medium hover:bg-bg transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Đổi tài khoản quản trị</span>
          </Link>
        </div>
      </Container>
    </div>
  );
}
