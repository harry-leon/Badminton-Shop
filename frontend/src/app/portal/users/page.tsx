'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { 
  Users, 
  Plus, 
  Edit2, 
  Power, 
  Key, 
  RefreshCw, 
  Search, 
  X, 
  Building2, 
  ShieldCheck, 
  UserCheck, 
  Trash2,
  Lock,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface UserItem {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  role: string;
  role_name?: string;
  branch_id?: string;
  branch_name?: string;
  branch_city?: string;
  is_active: boolean;
  created_at: string;
}

interface RoleOption {
  id: string;
  name: string;
  description: string;
}

interface BranchOption {
  id: string;
  name: string;
  city: string;
}

export default function AdminUsersPage() {
  const { user } = useAdmin();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');

  // Modal Create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createUsername, setCreateUsername] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRole, setCreateRole] = useState('STAFF');
  const [createBranch, setCreateBranch] = useState('BR_HCM_01');
  const [createPassword, setCreatePassword] = useState('smash2026');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Modal Edit
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('STAFF');
  const [editBranch, setEditBranch] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?role=${roleFilter}&branch_id=${branchFilter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi tải danh sách người dùng');
      setUsers(data.users || []);
      setRoles(data.roles || []);
      setBranches(data.branches || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const handleRefresh = () => fetchUsers();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, [roleFilter, branchFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_USER',
          username: createUsername,
          email: createEmail,
          full_name: createFullName,
          phone: createPhone,
          role: createRole,
          branch_id: createBranch,
          password: createPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo tài khoản thất bại');
      toast.success(data.message);
      setIsCreateOpen(false);
      setCreateUsername('');
      setCreateEmail('');
      setCreateFullName('');
      setCreatePhone('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmittingEdit(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_USER',
          user_id: editingUser.id,
          full_name: editFullName,
          phone: editPhone,
          role: editRole,
          branch_id: editBranch,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cập nhật thất bại');
      toast.success(data.message);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleToggleActive = async (u: UserItem) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_ACTIVE',
          user_id: u.id,
          is_active: !u.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleResetPassword = async (u: UserItem) => {
    if (!confirm(`Bạn có chắc muốn đặt lại mật khẩu của "${u.full_name}" về mặc định "smash2026"?`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESET_PASSWORD',
          user_id: u.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (u: UserItem) => {
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${u.full_name}" (${u.username})?`)) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_USER',
          user_id: u.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.full_name.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.includes(q))
    );
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">Tổng Quản trị</span>;
      case 'BRANCH_MANAGER':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">Quản lý Chi nhánh</span>;
      case 'STAFF':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">Nhân viên</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700 border border-stone-200">Khách hàng</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <div className="bg-white p-3.5 rounded-xl border border-black/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, email, username hoặc SĐT..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-black"
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="ADMIN">ADMIN</option>
            <option value="BRANCH_MANAGER">BRANCH_MANAGER</option>
            <option value="STAFF">STAFF</option>
            <option value="CUSTOMER">CUSTOMER</option>
          </select>

          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-700 focus:outline-none focus:border-black"
          >
            <option value="ALL">Tất cả chi nhánh</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <div className="text-xs text-gray-500 font-medium px-2 shrink-0">
            Tổng cộng: <strong>{filteredUsers.length}</strong> tài khoản
          </div>

          {(user?.role === 'ADMIN' || user?.permissions?.includes('users:manage')) && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm tài khoản</span>
            </button>
          )}
        </div>
      </div>

      {/* Users DataTable */}
      <div className="bg-white rounded-xl border border-black/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/75 text-gray-600 font-medium uppercase tracking-wider">
                <th className="py-3 px-4">Nhân sự</th>
                <th className="py-3 px-4">Liên hệ</th>
                <th className="py-3 px-4">Vai trò</th>
                <th className="py-3 px-4">Chi nhánh công tác</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-center">Ngày tạo</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    <span>Đang tải danh sách nhân sự...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Không tìm thấy tài khoản nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#111613] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {u.full_name ? u.full_name.charAt(0) : 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{u.full_name}</div>
                          <div className="text-[11px] text-gray-500 font-mono">@{u.username}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-gray-700">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getRoleBadge(u.role)}
                    </td>

                    <td className="py-3 px-4">
                      {u.branch_name ? (
                        <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-[#0F5132]" />
                          <span>{u.branch_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">Toàn quốc (Tổng bộ)</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        u.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        <span>{u.is_active ? 'Hoạt động' : 'Đã khóa'}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center text-gray-500 font-mono text-[11px]">
                      {new Date(u.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {(user?.role === 'ADMIN' || user?.permissions?.includes('users:manage')) ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(u);
                              setEditFullName(u.full_name);
                              setEditPhone(u.phone || '');
                              setEditRole(u.role);
                              setEditBranch(u.branch_id || 'ALL');
                            }}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer"
                            title="Sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResetPassword(u)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-amber-600 hover:border-amber-300 transition-colors cursor-pointer"
                            title="Đặt lại mật khẩu (reset về smash2026)"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              u.is_active 
                                ? 'border-gray-200 text-gray-500 hover:text-amber-600 hover:border-amber-300' 
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TẠO MỚI TÀI KHOẢN */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">Thêm nhân sự / tài khoản mới</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Tên đăng nhập (Username) *</label>
                  <input
                    type="text"
                    required
                    placeholder="staff_hn_02"
                    value={createUsername}
                    onChange={(e) => setCreateUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Mật khẩu khởi tạo</label>
                  <input
                    type="text"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Họ và tên nhân viên *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lê Văn An"
                  value={createFullName}
                  onChange={(e) => setCreateFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="an.le@smashcourt.vn"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="0912345678"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Vai trò (Role) *</label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Chi nhánh làm việc *</label>
                  <select
                    value={createBranch}
                    onChange={(e) => setCreateBranch(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800"
                  >
                    <option value="ALL">Toàn quốc (Tổng bộ)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCreate}
                  className="px-4 py-2 rounded-lg bg-[#0F5132] text-white font-medium hover:bg-[#0c4128] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingCreate ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHỈNH SỬA TÀI KHOẢN */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">Cập nhật tài khoản @{editingUser.username}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Họ và tên nhân viên *</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Số điện thoại</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Vai trò (Role) *</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-gray-800 block">Chi nhánh làm việc *</label>
                  <select
                    value={editBranch}
                    onChange={(e) => setEditBranch(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-xs bg-white text-gray-800"
                  >
                    <option value="ALL">Toàn quốc (Tổng bộ)</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 rounded-lg bg-[#0F5132] text-white font-medium hover:bg-[#0c4128] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
