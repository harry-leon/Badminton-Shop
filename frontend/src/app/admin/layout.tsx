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
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Admin Header */}
      <header className="bg-[#0B1210] text-white border-b border-emerald-950 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl text-[#C8F31D]">SMASH</span>
            <span className="font-semibold text-lg">PORTAL</span>
            <span className="text-[10px] bg-emerald-900 text-emerald-300 font-bold px-2 py-0.5 rounded uppercase ml-1">
              Admin & Staff
            </span>
          </div>

          <nav className="flex items-center gap-4 text-xs font-semibold text-slate-300">
            <a href="/admin/inventory" className="hover:text-[#C8F31D] transition-colors py-1">Kho & Điều chuyển</a>
            <a href="/admin/orders" className="hover:text-[#C8F31D] transition-colors py-1">Đơn hàng & VietQR</a>
            <a href="/admin/secondhand" className="hover:text-[#C8F31D] transition-colors py-1">Thu mua Second-hand</a>
            <a href="/admin/warranty" className="hover:text-[#C8F31D] transition-colors py-1">Xử lý bảo hành</a>
          </nav>
        </div>

        {/* Branch Switcher & Role Badge */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
            <span className="text-slate-400 font-medium">Chi nhánh:</span>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-emerald-950 text-emerald-200 px-3 py-1.5 rounded-lg border border-emerald-800">
            <span>Vai trò:</span>
            <strong className="text-[#C8F31D]">{currentRole}</strong>
          </div>

          <a href="/" className="text-slate-400 hover:text-white transition-colors underline ml-2">
            Về Storefront →
          </a>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
