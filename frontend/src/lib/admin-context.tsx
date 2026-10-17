'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
}

export const ADMIN_BRANCHES: Branch[] = [
  { id: 'BR_HCM_01', name: 'Smash Court — Quận 1', city: 'TP. Hồ Chí Minh', address: '123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1' },
  { id: 'BR_HN_01', name: 'Smash Court — Cầu Giấy', city: 'Hà Nội', address: '45 Xuân Thủy, Phường Dịch Vọng Hậu, Quận Cầu Giấy' },
  { id: 'BR_DN_01', name: 'Smash Court — Hải Châu', city: 'Đà Nẵng', address: '78 Nguyễn Văn Linh, Phường Nam Dương, Quận Hải Châu' },
  { id: 'ALL', name: 'Toàn quốc (Tất cả chi nhánh)', city: 'Toàn quốc', address: 'Quản trị tập trung toàn hệ thống' },
];

export type TableDensity = 'compact' | 'normal';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: string;
  branch_id?: string | null;
  permissions?: string[];
}

interface AdminContextType {
  selectedBranch: string;
  setSelectedBranch: (id: string) => void;
  currentRole: string;
  user: AdminUser | null;
  density: TableDensity;
  setDensity: (density: TableDensity) => void;
  branches: Branch[];
  activeBranchInfo: Branch;
}

const AdminContext = createContext<AdminContextType>({
  selectedBranch: 'BR_HCM_01',
  setSelectedBranch: () => {},
  currentRole: 'STAFF',
  user: null,
  density: 'normal',
  setDensity: () => {},
  branches: ADMIN_BRANCHES,
  activeBranchInfo: ADMIN_BRANCHES[0],
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<string>('BR_HCM_01');
  const [currentRole, setCurrentRole] = useState<string>('STAFF');
  const [user, setUser] = useState<AdminUser | null>(null);
  const [density, setDensity] = useState<TableDensity>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('smash_admin_density');
        if (saved === 'compact' || saved === 'normal') return saved;
      } catch {}
    }
    return 'normal';
  });

  const refreshUser = (isInitial = false) => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
          if (data.user.role) {
            setCurrentRole(data.user.role);
          }
          if (isInitial && data.user.branch_id && ADMIN_BRANCHES.some((b) => b.id === data.user.branch_id)) {
            setSelectedBranch(data.user.branch_id);
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    // Role và danh tính người dùng được trích xuất trực tiếp từ máy chủ (Server Session)
    refreshUser(true);

    try {
      const savedBranch = localStorage.getItem('smash_admin_branch');
      if (savedBranch && ADMIN_BRANCHES.some((b) => b.id === savedBranch)) {
        setSelectedBranch(savedBranch);
      }
      const savedDensity = localStorage.getItem('smash_admin_density') as TableDensity;
      if (savedDensity && ['compact', 'normal'].includes(savedDensity)) {
        setDensity(savedDensity);
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-table-density', savedDensity);
        }
      } else if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-table-density', 'normal');
      }
    } catch {
      // Ignore localStorage errors
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'smash_admin_density' && (e.newValue === 'compact' || e.newValue === 'normal')) {
        setDensity(e.newValue);
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-table-density', e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSetBranch = (id: string) => {
    setSelectedBranch(id);
    try {
      localStorage.setItem('smash_admin_branch', id);
    } catch {}
  };

  const handleSetDensity = (d: TableDensity) => {
    setDensity(d);
    try {
      localStorage.setItem('smash_admin_density', d);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-table-density', d);
        window.dispatchEvent(new CustomEvent('density-change', { detail: d }));
      }
      if (d === 'compact') {
        toast.success('Mật độ bảng: Đặc — Đã thu gọn khoảng cách dòng dữ liệu');
      } else {
        toast.info('Mật độ bảng: Chuẩn — Khoảng cách dòng rộng rãi, dễ đọc');
      }
    } catch {}
  };

  const activeBranchInfo = ADMIN_BRANCHES.find((b) => b.id === selectedBranch) || ADMIN_BRANCHES[0];

  return (
    <AdminContext.Provider
      value={{
        selectedBranch,
        setSelectedBranch: handleSetBranch,
        currentRole,
        user,
        density,
        setDensity: handleSetDensity,
        branches: ADMIN_BRANCHES,
        activeBranchInfo,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}

export function useTableDensity() {
  const { density, setDensity } = useAdmin();
  return {
    density,
    setDensity,
    isCompact: density === 'compact',
    cellPadding: density === 'compact' ? 'py-1.5 px-2.5' : 'py-3 px-4',
    headerPadding: density === 'compact' ? 'py-1.5 px-2.5' : 'py-3 px-4',
    fontSize: density === 'compact' ? 'text-[11px]' : 'text-xs',
  };
}
