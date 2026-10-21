'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Save, Lock, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { useAdmin } from '@/lib/admin-context';
import { safeFetchJson } from '@/lib/portal-fetch';

interface Permission {
  id: string;
  code: string;
  module: string;
  category?: string;
  name: string;
  description: string;
}

interface RoleItem {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
  created_at: string;
  updated_at?: string;
  permissions: string[];
}

const MODULE_TITLES: Record<string, string> = {
  DASHBOARD: 'Tổng quan vận hành',
  ORDERS: 'Quản lý đơn hàng & VietQR',
  INVENTORY: 'Quản lý kho & điều chuyển hàng',
  SECONDHAND: 'Thu mua & kiểm định vợt cũ',
  WARRANTY: 'Tiếp nhận & xử lý bảo hành',
  REVIEWS: 'Đánh giá & phản hồi khách hàng',
  ROLES: 'Phân quyền quản trị hệ thống',
};

export default function AdminRolesPage() {
  const { user } = useAdmin();
  const isAdmin = user?.role === 'ADMIN';
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('STAFF');
  const [currentRolePerms, setCurrentRolePerms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form tạo role mới
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoleId, setNewRoleId] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<{ roles: RoleItem[]; permissions: Permission[]; error?: string }>('/api/admin/roles');
      if (res.success && res.data) {
        setRoles(res.data.roles || []);
        setPermissions(res.data.permissions || []);
        const active = (res.data.roles || []).find((r: RoleItem) => r.id === selectedRole) || res.data.roles?.[0];
        if (active) {
          setSelectedRole(active.id);
          setCurrentRolePerms(active.permissions || []);
        }
      } else {
        setMessage({ type: 'error', text: res.error || 'Lỗi khi tải dữ liệu phân quyền' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi kết nối' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleRefresh = () => loadData();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, []);

  const handleSelectRole = (roleId: string) => {
    setSelectedRole(roleId);
    const target = roles.find((r) => r.id === roleId);
    setCurrentRolePerms(target ? [...target.permissions] : []);
    setMessage(null);
  };

  const togglePermission = (permId: string) => {
    setCurrentRolePerms((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const toggleModulePermissions = (moduleName: string, selectAll: boolean) => {
    const modulePermIds = permissions
      .filter((p) => (p.module || p.category) === moduleName)
      .map((p) => p.id);

    setCurrentRolePerms((prev) => {
      if (selectAll) {
        const combined = new Set([...prev, ...modulePermIds]);
        return Array.from(combined);
      } else {
        return prev.filter((id) => !modulePermIds.includes(id));
      }
    });
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/roles/${selectedRole}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissions: currentRolePerms,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: `Đã lưu cập nhật quyền cho vai trò ${selectedRole} thành công! Quyền hạn có hiệu lực ngay lập tức.` });
        setRoles((prev) =>
          prev.map((r) => (r.id === selectedRole ? { ...r, permissions: currentRolePerms } : r))
        );
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi khi lưu phân quyền' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi kết nối khi lưu phân quyền' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleId.trim() || !newRoleName.trim()) {
      setMessage({ type: 'error', text: 'Mã vai trò và tên vai trò không được để trống' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: newRoleId,
          name: newRoleName,
          description: newRoleDesc,
          permissions: [],
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreateModal(false);
        const createdId = newRoleId.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        setNewRoleId('');
        setNewRoleName('');
        setNewRoleDesc('');
        await loadData();
        setSelectedRole(createdId);
        setCurrentRolePerms([]);
        setMessage({ type: 'success', text: `Đã tạo vai trò mới ${createdId} thành công!` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Lỗi khi tạo vai trò mới' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi kết nối' });
    } finally {
      setSaving(false);
    }
  };

  // Lấy danh sách 7 modules duy nhất
  const modules = Array.from(new Set(permissions.map((p) => p.module || p.category || 'GENERAL')));

  if (loading) {
    return (
      <div className="p-8 text-center text-muted font-normal text-[14px]">
        Đang tải bảng phân quyền động từ cơ sở dữ liệu...
      </div>
    );
  }

  const activeRoleData = roles.find((r) => r.id === selectedRole);

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl border text-[13px] font-normal flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-[13px] underline opacity-75 hover:opacity-100 cursor-pointer ml-4"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Main Grid: Danh sách Roles bên trái & Bảng Permissions bên phải */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: Roles List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E4E3DD] p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[#111613] uppercase tracking-wider">
              Danh sách vai trò ({roles.length})
            </span>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="min-h-[36px] touch-target-hit inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo vai trò</span>
              </button>
            )}
          </div>
          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = selectedRole === r.id;
              const permCount = isSelected ? currentRolePerms.length : r.permissions.length;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleSelectRole(r.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/80 border-emerald-600 shadow-xs'
                      : 'bg-stone-50 border-[#E4E3DD] hover:bg-stone-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[#111613]">{r.name}</span>
                    <Badge variant={isSelected ? 'brand' : 'muted'} className="truncate max-w-[140px] inline-block">{r.id}</Badge>
                  </div>
                  <div className="text-xs text-[#6A726E] font-normal mt-1.5 line-clamp-2">
                    {r.description || 'Chưa có mô tả cho vai trò này.'}
                  </div>
                  <div className="mt-2.5 text-xs text-[#6A726E] font-normal flex items-center justify-between">
                    <span>Quyền được cấp:</span>
                    <span className="font-semibold text-[#111613]">
                      {permCount}/{permissions.length} quyền
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CỘT PHẢI: Permissions Matrix */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-[#E4E3DD] p-6 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E4E3DD]">
            <div>
              <div className="text-xs text-[#6A726E] font-normal">Cấu hình phân quyền cho:</div>
              <h2 className="text-lg font-semibold text-[#111613] flex items-center gap-2 mt-0.5">
                <span>{activeRoleData?.name || selectedRole}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 border border-[#E4E3DD] text-[#6A726E] font-medium font-mono">
                  {selectedRole}
                </span>
                {activeRoleData?.is_system && (
                  <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Hệ thống</span>
                  </span>
                )}
              </h2>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-semibold hover:opacity-90 active:scale-98 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Đang lưu...' : 'Lưu phân quyền'}</span>
              </button>
            )}
          </div>

          {/* Grouped permissions by Module */}
          <div className="space-y-6">
            {modules.map((mod) => {
              const modPerms = permissions.filter((p) => (p.module || p.category) === mod);
              const allChecked = modPerms.every((p) => currentRolePerms.includes(p.id));

              return (
                <div key={mod} className="space-y-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#E4E3DD]/60">
                    <div className="text-xs font-semibold text-[#111613] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>{MODULE_TITLES[mod] || mod}</span>
                      <span className="text-xs text-[#6A726E] font-normal">({modPerms.length} quyền)</span>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => toggleModulePermissions(mod, !allChecked)}
                          className="text-emerald-700 hover:underline font-medium cursor-pointer"
                        >
                          {allChecked ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modPerms.map((perm) => {
                      const isChecked = currentRolePerms.includes(perm.id);
                      return (
                        <label
                          key={perm.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${isAdmin ? 'cursor-pointer' : 'cursor-default'} select-none ${
                            isChecked
                              ? 'bg-emerald-50/50 border-emerald-600/80 shadow-xs'
                              : 'bg-white hover:bg-stone-50 border-[#E4E3DD] text-[#6A726E]'
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={isChecked}
                            onChange={() => isAdmin && togglePermission(perm.id)}
                            className="w-4 h-4 mt-0.5 rounded border-[#E4E3DD] text-emerald-600 accent-[#0F5132] cursor-pointer disabled:opacity-60"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs font-semibold ${isChecked ? 'text-[#111613]' : 'text-[#6A726E]'}`}>
                                {perm.name}
                              </span>
                            </div>
                            <div className="text-[13px] font-mono text-muted mt-0.5">
                              {perm.code || perm.id}
                            </div>
                            <p className="text-[13px] text-muted font-normal mt-1 leading-snug">
                              {perm.description}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Tạo vai trò mới */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-black/10 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-[#111613]">Tạo vai trò mới</h3>
              <p className="text-[13px] text-[#6A726E] font-normal mt-1">
                Tạo định danh vai trò mới để cấu hình ma trận phân quyền linh hoạt cho từng phòng ban.
              </p>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-[13px] text-[#6A726E] mb-1.5 font-normal">
                  Mã vai trò (chữ in, ví dụ: WAREHOUSE_LEAD)
                </label>
                <input
                  type="text"
                  required
                  placeholder="WAREHOUSE_LEAD"
                  value={newRoleId}
                  onChange={(e) => setNewRoleId(e.target.value.toUpperCase())}
                  className="w-full bg-stone-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-[#111613] focus:outline-none focus:border-[#0F5132] focus:bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#6A726E] mb-1.5 font-normal">
                  Tên hiển thị vai trò tiếng Việt
                </label>
                <input
                  type="text"
                  required
                  placeholder="Trưởng kho vận chuyển"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full bg-stone-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-[#111613] focus:outline-none focus:border-[#0F5132] focus:bg-white font-normal"
                />
              </div>

              <div>
                <label className="block text-[13px] text-[#6A726E] mb-1.5 font-normal">
                  Mô tả nhiệm vụ vai trò
                </label>
                <textarea
                  rows={3}
                  placeholder="Điều phối vận chuyển hàng hóa, theo dõi tồn kho giữa các chi nhánh..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full bg-stone-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-[13px] text-[#111613] focus:outline-none focus:border-[#0F5132] focus:bg-white font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-[13px] text-[#6A726E] hover:text-[#111613] hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-[#0F5132] hover:bg-[#0c4128] text-white text-[13px] font-medium shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Đang tạo...' : 'Tạo vai trò'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
