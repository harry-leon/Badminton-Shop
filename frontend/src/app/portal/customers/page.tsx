'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { 
  Users, 
  Search, 
  RefreshCw, 
  ShieldCheck, 
  ShoppingBag, 
  Award, 
  Lock, 
  Unlock, 
  Phone, 
  Mail, 
  Calendar,
  ExternalLink,
  Edit2,
  X,
  CreditCard
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomerItem {
  id: string;
  username: string;
  email: string;
  full_name: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  total_orders: number;
  total_spent: number;
  tier: 'STANDARD' | 'SILVER' | 'GOLD' | 'DIAMOND';
}

export default function AdminCustomersPage() {
  const { user } = useAdmin();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Edit Modal State
  const [editingCustomer, setEditingCustomer] = useState<CustomerItem | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const q = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
      const res = await fetch(`/api/admin/customers${q}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi tải danh sách khách hàng');
      setCustomers(data.customers || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    const handleRefresh = () => fetchCustomers();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, [searchQuery]);

  const handleToggleStatus = async (cust: CustomerItem) => {
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_STATUS',
          userId: cust.id,
          is_active: !cust.is_active,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật trạng thái');
      toast.success(cust.is_active ? 'Đã khóa tài khoản khách hàng' : 'Đã kích hoạt lại tài khoản');
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    setSubmittingEdit(true);
    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_CUSTOMER',
          userId: editingCustomer.id,
          full_name: editFullName,
          phone: editPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật');
      toast.success('Cập nhật thông tin khách hàng thành công');
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingEdit(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (tierFilter !== 'ALL' && c.tier !== tierFilter) return false;
    if (statusFilter === 'ACTIVE' && !c.is_active) return false;
    if (statusFilter === 'INACTIVE' && c.is_active) return false;
    return true;
  });

  const totalSpentAll = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
  const vipCount = customers.filter((c) => c.tier === 'GOLD' || c.tier === 'DIAMOND').length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-[#E4E3DD] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#6A726E]">Tổng số khách hàng</div>
            <div className="text-2xl font-medium text-[#111613] mt-1 tabular-nums">
              {customers.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E4E3DD] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#6A726E]">Khách hàng VIP (Vàng &amp; KC)</div>
            <div className="text-2xl font-medium text-[#0F5132] mt-1 tabular-nums">
              {vipCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0F5132]/10 text-[#0F5132] flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#E4E3DD] p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#6A726E]">Tổng giá trị chi tiêu (LTV)</div>
            <div className="text-2xl font-medium text-amber-700 mt-1 tabular-nums">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalSpentAll)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-white rounded-xl border border-[#E4E3DD] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, số điện thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 min-h-[42px] rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-2.5 py-2 min-h-[42px] rounded-lg border border-[#E4E3DD] text-xs bg-white text-[#111613] focus:outline-none"
          >
            <option value="ALL">Tất cả hạng thành viên</option>
            <option value="DIAMOND">Kim Cương (&gt; 20tr)</option>
            <option value="GOLD">Vàng (&gt; 10tr)</option>
            <option value="SILVER">Bạc (&gt; 3tr)</option>
            <option value="STANDARD">Tiêu chuẩn</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 min-h-[42px] rounded-lg border border-[#E4E3DD] text-xs bg-white text-[#111613] focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="INACTIVE">Đang bị khóa</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-[#E4E3DD] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-xs border-collapse">
            <thead className="bg-[#F5F4F0] border-b border-[#E4E3DD] text-[#6A726E] font-medium">
              <tr>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Hạng thành viên</th>
                <th className="py-3 px-4 text-right">Tổng đơn</th>
                <th className="py-3 px-4 text-right">Tổng chi tiêu</th>
                <th className="py-3 px-4">Ngày đăng ký</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E3DD]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6A726E]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-stone-400" />
                    Đang tải danh sách khách hàng...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6A726E]">
                    Không tìm thấy khách hàng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#0F5132]/10 text-[#0F5132] font-medium flex items-center justify-center shrink-0">
                          {cust.full_name?.charAt(0) || cust.username?.charAt(0) || 'K'}
                        </div>
                        <div>
                          <div className="font-medium text-[#111613]">{cust.full_name}</div>
                          <div className="text-[11px] text-[#6A726E]">{cust.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#111613]">
                      {cust.phone || 'Chưa cập nhật'}
                    </td>
                    <td className="py-3 px-4">
                      {cust.tier === 'DIAMOND' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                          💎 Kim Cương
                        </span>
                      )}
                      {cust.tier === 'GOLD' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200">
                          🥇 Vàng
                        </span>
                      )}
                      {cust.tier === 'SILVER' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-300">
                          🥈 Bạc
                        </span>
                      )}
                      {cust.tier === 'STANDARD' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600">
                          Tiêu chuẩn
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[#111613] tabular-nums">
                      {cust.total_orders}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-[#0F5132] font-mono tabular-nums">
                      {new Intl.NumberFormat('vi-VN').format(cust.total_spent)} ₫
                    </td>
                    <td className="py-3 px-4 text-[#6A726E] text-[11px] whitespace-nowrap">
                      {new Date(cust.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="py-3 px-4">
                      {cust.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Bị khóa
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCustomer(cust);
                            setEditFullName(cust.full_name);
                            setEditPhone(cust.phone || '');
                          }}
                          className="min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1 rounded hover:bg-stone-100 text-stone-600 cursor-pointer"
                          title="Sửa thông tin"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(cust)}
                          className={`min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1 rounded hover:bg-stone-100 cursor-pointer ${cust.is_active ? 'text-rose-600' : 'text-emerald-600'}`}
                          title={cust.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {cust.is_active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#E4E3DD] max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E3DD]">
              <h2 className="text-base font-medium text-[#111613]">
                Chỉnh sửa thông tin khách hàng
              </h2>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#111613] mb-1">
                  Tên tài khoản / Email
                </label>
                <input
                  type="text"
                  disabled
                  value={`${editingCustomer.username} (${editingCustomer.email})`}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] bg-stone-50 text-xs text-stone-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111613] mb-1">
                  Họ và tên khách hàng *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#111613] mb-1">
                  Số điện thoại liên hệ *
                </label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs focus:outline-none focus:border-[#0F5132]"
                />
              </div>

              <div className="pt-3 border-t border-[#E4E3DD] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-3 py-1.5 rounded-lg border border-[#E4E3DD] text-xs hover:bg-stone-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-1.5 rounded-lg bg-[#0F5132] text-white text-xs font-medium hover:bg-[#0F5132]/90 disabled:opacity-50"
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
