'use client';

import React, { useState } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState('BR_HCM_01');
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'BRANCH_MANAGER' | 'STAFF'>('BRANCH_MANAGER');

  const branches = [
    { id: 'BR_HCM_01', name: 'Smash Court — Quận 1 (TP.HCM)' },
    { id: 'BR_HN_01', name: 'Smash Court — Cầu Giấy (Hà Nội)' },
    { id: 'BR_DN_01', name: 'Smash Court — Hải Châu (Đà Nẵng)' },
  ];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900">
      {/* Admin Header */}
      <header className="bg-[#0B1210] text-white border-b border-emerald-950 px-4 sm:px-6 py-3 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-[#C8F31D]">SMASH</span>
              <span className="font-bold text-lg">PORTAL</span>
              <span className="text-[10px] bg-emerald-900 text-emerald-200 font-bold px-2 py-0.5 rounded uppercase border border-emerald-700/40">
                Quản Trị Chi Nhánh
              </span>
            </div>

            <a href="/" className="md:hidden text-xs text-stone-400 hover:text-white underline">
              Về Storefront →
            </a>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2 sm:gap-4 text-xs font-bold text-stone-300 overflow-x-auto py-1">
            <a href="/admin/inventory" className="hover:text-[#C8F31D] transition-colors py-1 px-2 rounded-lg hover:bg-white/5 whitespace-nowrap">
              Kho & Điều chuyển
            </a>
            <a href="/admin/orders" className="hover:text-[#C8F31D] transition-colors py-1 px-2 rounded-lg hover:bg-white/5 whitespace-nowrap">
              Đơn hàng & VietQR
            </a>
            <a href="/admin/secondhand" className="hover:text-[#C8F31D] transition-colors py-1 px-2 rounded-lg hover:bg-white/5 whitespace-nowrap">
              Thu mua Second-hand
            </a>
            <a href="/admin/warranty" className="hover:text-[#C8F31D] transition-colors py-1 px-2 rounded-lg hover:bg-white/5 whitespace-nowrap">
              Xử lý bảo hành
            </a>
          </nav>

          {/* Branch Switcher & Role Badge */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/15">
              <span className="text-stone-400 text-[11px]">Chi nhánh:</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id} className="bg-stone-900 text-white">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950 text-emerald-200 px-2.5 py-1.5 rounded-xl border border-emerald-800">
              <span className="text-[11px]">Vai trò:</span>
              <strong className="text-[#C8F31D]">{currentRole}</strong>
            </div>

            <a href="/" className="hidden md:inline-block text-stone-400 hover:text-white transition-colors underline ml-1">
              Storefront →
            </a>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
