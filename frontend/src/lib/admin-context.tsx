'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
}

export const ADMIN_BRANCHES: Branch[] = [
  { id: 'BR_HCM_01', name: 'Smash Court — Quận 1', city: 'TP. Hồ Chí Minh', address: 'Số 15 Lê Duẩn, P. Bến Nghé, Quận 1' },
  { id: 'BR_HN_01', name: 'Smash Court — Cầu Giấy', city: 'Hà Nội', address: 'Số 28 Cầu Giấy, P. Quan Hoa, Q. Cầu Giấy' },
  { id: 'BR_DN_01', name: 'Smash Court — Hải Châu', city: 'Đà Nẵng', address: 'Số 102 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu' },
  { id: 'ALL', name: 'Toàn quốc (Tất cả chi nhánh)', city: 'Toàn quốc', address: 'Quản trị tập trung toàn hệ thống' },
];

export type AdminRole = 'ADMIN' | 'BRANCH_MANAGER' | 'STAFF';
export type TableDensity = 'compact' | 'normal';

interface AdminContextType {
  selectedBranch: string;
  setSelectedBranch: (id: string) => void;
  currentRole: AdminRole;
  setCurrentRole: (role: AdminRole) => void;
  density: TableDensity;
  setDensity: (density: TableDensity) => void;
  branches: Branch[];
  activeBranchInfo: Branch;
}

const AdminContext = createContext<AdminContextType>({
  selectedBranch: 'BR_HCM_01',
  setSelectedBranch: () => {},
  currentRole: 'BRANCH_MANAGER',
  setCurrentRole: () => {},
  density: 'normal',
  setDensity: () => {},
  branches: ADMIN_BRANCHES,
  activeBranchInfo: ADMIN_BRANCHES[0],
});

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<string>('BR_HCM_01');
  const [currentRole, setCurrentRole] = useState<AdminRole>('BRANCH_MANAGER');
  const [density, setDensity] = useState<TableDensity>('normal');

  useEffect(() => {
    try {
      const savedBranch = localStorage.getItem('smash_admin_branch');
      if (savedBranch && ADMIN_BRANCHES.some(b => b.id === savedBranch)) {
        setSelectedBranch(savedBranch);
      }
      const savedRole = localStorage.getItem('smash_admin_role') as AdminRole;
      if (savedRole && ['ADMIN', 'BRANCH_MANAGER', 'STAFF'].includes(savedRole)) {
        setCurrentRole(savedRole);
      }
      const savedDensity = localStorage.getItem('smash_admin_density') as TableDensity;
      if (savedDensity && ['compact', 'normal'].includes(savedDensity)) {
        setDensity(savedDensity);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleSetBranch = (id: string) => {
    setSelectedBranch(id);
    try {
      localStorage.setItem('smash_admin_branch', id);
    } catch {}
  };

  const handleSetRole = (role: AdminRole) => {
    setCurrentRole(role);
    try {
      localStorage.setItem('smash_admin_role', role);
    } catch {}
  };

  const handleSetDensity = (d: TableDensity) => {
    setDensity(d);
    try {
      localStorage.setItem('smash_admin_density', d);
    } catch {}
  };

  const activeBranchInfo = ADMIN_BRANCHES.find(b => b.id === selectedBranch) || ADMIN_BRANCHES[0];

  return (
    <AdminContext.Provider
      value={{
        selectedBranch,
        setSelectedBranch: handleSetBranch,
        currentRole,
        setCurrentRole: handleSetRole,
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
