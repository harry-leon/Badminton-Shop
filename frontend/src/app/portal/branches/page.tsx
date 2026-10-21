'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { 
  Building2, 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  MapPin, 
  Users, 
  X, 
  CheckCircle2, 
  Store,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { safeFetchJson } from '@/lib/portal-fetch';

interface BranchItem {
  id: string;
  name: string;
  city: string;
  address: string;
  created_at: string;
  staff_count: number;
}

export default function AdminBranchesPage() {
  const { user } = useAdmin();
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createId, setCreateId] = useState('');
  const [createName, setCreateName] = useState('');
  const [createCity, setCreateCity] = useState('');
  const [createAddress, setCreateAddress] = useState('');
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Modal Edit
  const [editingBranch, setEditingBranch] = useState<BranchItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await safeFetchJson<{ branches: BranchItem[]; error?: string }>('/api/admin/branches');
      if (!res.success) {
        toast.error(res.error || 'Lỗi tải danh sách chi nhánh');
        return;
      }
      setBranches(res.data?.branches || []);
    } catch (err: any) {
      toast.error(err.message || 'Lỗi không xác định');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    const handleRefresh = () => fetchBranches();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCreate(true);
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_BRANCH',
          id: createId,
          name: createName,
          city: createCity,
          address: createAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tạo chi nhánh thất bại');
      toast.success(data.message);
      setIsCreateOpen(false);
      setCreateId('');
      setCreateName('');
      setCreateCity('');
      setCreateAddress('');
      fetchBranches();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingCreate(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBranch) return;
    setSubmittingEdit(true);
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_BRANCH',
          branch_id: editingBranch.id,
          name: editName,
          city: editCity,
          address: editAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Cập nhật thất bại');
      toast.success(data.message);
      setEditingBranch(null);
      fetchBranches();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDelete = async (b: BranchItem) => {
    if (!confirm(`Bạn có chắc muốn xóa chi nhánh "${b.name}" (${b.id})? Thao tác này không thể hoàn tác.`)) return;
    try {
      const res = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_BRANCH',
          branch_id: b.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchBranches();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar Mạng lưới chi nhánh */}
      <div className="bg-white p-3.5 rounded-xl border border-black/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-[#0F5132]" />
          <span className="text-xs text-stone-600">
            Hệ thống mạng lưới gồm <strong>{branches.length}</strong> showroom &amp; kho vận toàn quốc
          </span>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm chi nhánh</span>
          </button>
        )}
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            <span>Đang tải thông tin mạng lưới chi nhánh...</span>
          </div>
        ) : branches.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400">
            Chưa có chi nhánh nào trong hệ thống.
          </div>
        ) : (
          branches.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl border border-black/10 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center font-bold text-sm">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight">{b.name}</h3>
                      <div className="text-[11px] font-mono text-gray-500 mt-0.5">{b.id}</div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-stone-100 text-stone-700">
                    {b.city}
                  </span>
                </div>

                <div className="space-y-2 mt-4 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{b.address}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 text-gray-700">
                    <Users className="w-4 h-4 text-[#0F5132] shrink-0" />
                    <span>
                      Nhân sự hoạt động: <strong className="text-gray-900">{b.staff_count || 0}</strong> nhân viên
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
                <span className="text-[11px] text-gray-400">
                  Khởi tạo: {new Date(b.created_at).toLocaleDateString('vi-VN')}
                </span>

                {user?.role === 'ADMIN' && b.id !== 'ALL' && (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBranch(b);
                        setEditName(b.name);
                        setEditCity(b.city);
                        setEditAddress(b.address);
                      }}
                      className="min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-300 transition-colors cursor-pointer"
                      title="Chỉnh sửa chi nhánh"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(b)}
                      className="min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Xóa chi nhánh"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL 1: TẠO CHI NHÁNH */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">Thêm chi nhánh mới</h3>
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
              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Mã định danh chi nhánh (ID) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: BR_CT_01 (Cần Thơ)"
                  value={createId}
                  onChange={(e) => setCreateId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Tên chi nhánh *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Smash Court — Cần Thơ"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Tỉnh / Thành phố *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Cần Thơ"
                  value={createCity}
                  onChange={(e) => setCreateCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Địa chỉ chi tiết *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ví dụ: 99 đường 30 Tháng 4, Phường Hưng Lợi, Quận Ninh Kiều"
                  value={createAddress}
                  onChange={(e) => setCreateAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
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
                  {submittingCreate ? 'Đang tạo...' : 'Tạo chi nhánh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SỬA CHI NHÁNH */}
      {editingBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">Chỉnh sửa {editingBranch.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingBranch(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Tên chi nhánh *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Tỉnh / Thành phố *</label>
                <input
                  type="text"
                  required
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Địa chỉ chi tiết *</label>
                <textarea
                  rows={2}
                  required
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingBranch(null)}
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
