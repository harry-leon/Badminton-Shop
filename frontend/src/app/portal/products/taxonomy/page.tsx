'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/lib/admin-context';
import { 
  Building2, 
  PackageOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  ArrowLeft,
  CheckCircle2,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface BrandItem {
  id: string;
  name: string;
  country: string;
  description?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export default function TaxonomyPage() {
  const { user } = useAdmin();
  const [dbBrands, setDbBrands] = useState<BrandItem[]>([]);
  const [dbCategories, setDbCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Brand modal
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [brandId, setBrandId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandCountry, setBrandCountry] = useState('Nhật Bản');
  const [brandDesc, setBrandDesc] = useState('');
  const [editingBrandItem, setEditingBrandItem] = useState<BrandItem | null>(null);
  const [savingBrand, setSavingBrand] = useState(false);

  // Category modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [catId, setCatId] = useState('');
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [editingCatItem, setEditingCatItem] = useState<CategoryItem | null>(null);
  const [savingCat, setSavingCat] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải danh mục & thương hiệu');
      setDbBrands(data.brands || []);
      setDbCategories(data.categories || []);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleRefresh = () => fetchData();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, []);

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBrand(true);
    try {
      const action = editingBrandItem ? 'UPDATE_BRAND' : 'CREATE_BRAND';
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          id: brandId,
          name: brandName,
          country: brandCountry,
          description: brandDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu thương hiệu thất bại');
      toast.success(data.message || 'Đã lưu thương hiệu thành công!');
      setBrandModalOpen(false);
      setEditingBrandItem(null);
      setBrandId('');
      setBrandName('');
      setBrandCountry('Nhật Bản');
      setBrandDesc('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingBrand(false);
    }
  };

  const handleDeleteBrand = async (bId: string) => {
    if (!confirm(`Bạn có chắc muốn xóa thương hiệu "${bId}"?`)) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_BRAND', id: bId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa thất bại');
      toast.success(data.message || 'Đã xóa thương hiệu!');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    try {
      const action = editingCatItem ? 'UPDATE_CATEGORY' : 'CREATE_CATEGORY';
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          id: catId,
          name: catName,
          slug: catSlug || catId.replace('cat_', ''),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu danh mục thất bại');
      toast.success(data.message || 'Đã lưu danh mục thành công!');
      setCatModalOpen(false);
      setEditingCatItem(null);
      setCatId('');
      setCatName('');
      setCatSlug('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cId: string) => {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${cId}"?`)) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_CATEGORY', id: cId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa danh mục thất bại');
      toast.success(data.message || 'Đã xóa danh mục!');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Grid 2 cột: Brands & Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Brands */}
        <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-xs">
          <div className="p-3.5 sm:p-4 border-b border-gray-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0F5132]" />
              <h2 className="text-sm font-semibold text-gray-900">Thương hiệu ({dbBrands.length})</h2>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/portal/products"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium border border-[#E4E3DD] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Về Sản phẩm</span>
              </Link>

              {user?.role === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingBrandItem(null);
                    setBrandId('');
                    setBrandName('');
                    setBrandCountry('Nhật Bản');
                    setBrandDesc('');
                    setBrandModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm thương hiệu</span>
                </button>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {dbBrands.map((b) => (
              <div key={b.id} className="p-4 hover:bg-gray-50/60 transition-colors flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{b.name}</span>
                    <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{b.id}</span>
                    <span className="text-[11px] text-[#0F5132] font-medium">({b.country})</span>
                  </div>
                  {b.description && (
                    <p className="text-[11px] text-gray-500 mt-1 font-light leading-relaxed">{b.description}</p>
                  )}
                </div>
                {user?.role === 'ADMIN' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBrandItem(b);
                        setBrandId(b.id);
                        setBrandName(b.name);
                        setBrandCountry(b.country || '');
                        setBrandDesc(b.description || '');
                        setBrandModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 cursor-pointer"
                      title="Sửa thương hiệu"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBrand(b.id)}
                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer"
                      title="Xóa thương hiệu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Categories */}
        <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-xs">
          <div className="p-3.5 sm:p-4 border-b border-gray-100 flex items-center justify-between bg-stone-50/50">
            <div className="flex items-center gap-2">
              <PackageOpen className="w-4 h-4 text-[#0F5132]" />
              <h2 className="text-sm font-semibold text-gray-900">Danh mục Sản phẩm ({dbCategories.length})</h2>
            </div>

            {user?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => {
                  setEditingCatItem(null);
                  setCatId('');
                  setCatName('');
                  setCatSlug('');
                  setCatModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm danh mục</span>
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {dbCategories.map((c) => (
              <div key={c.id} className="p-4 hover:bg-gray-50/60 transition-colors flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{c.name}</span>
                    <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{c.id}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 font-mono mt-1">Đường dẫn: /{c.slug}</div>
                </div>
                {user?.role === 'ADMIN' && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatItem(c);
                        setCatId(c.id);
                        setCatName(c.name);
                        setCatSlug(c.slug);
                        setCatModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 cursor-pointer"
                      title="Sửa danh mục"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(c.id)}
                      className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer"
                      title="Xóa danh mục"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: THÊM / SỬA THƯƠNG HIỆU */}
      {brandModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  {editingBrandItem ? 'Chỉnh sửa Thương hiệu' : 'Thêm Thương hiệu Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setBrandModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveBrand} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-medium text-gray-700 block mb-1">Mã ID Thương hiệu (VD: yonex, victor, lining) *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingBrandItem}
                  value={brandId}
                  onChange={(e) => setBrandId(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="yonex"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg disabled:bg-gray-100 text-gray-900 font-mono"
                />
              </div>
              <div>
                <label className="font-medium text-gray-700 block mb-1">Tên thương hiệu hiển thị *</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Yonex"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="font-medium text-gray-700 block mb-1">Quốc gia xuất xứ *</label>
                <input
                  type="text"
                  required
                  value={brandCountry}
                  onChange={(e) => setBrandCountry(e.target.value)}
                  placeholder="Nhật Bản"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="font-medium text-gray-700 block mb-1">Mô tả tóm tắt</label>
                <textarea
                  rows={2}
                  value={brandDesc}
                  onChange={(e) => setBrandDesc(e.target.value)}
                  placeholder="Thương hiệu cầu lông hàng đầu thế giới..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setBrandModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingBrand}
                  className="px-4 py-1.5 bg-[#0F5132] hover:bg-[#0c4128] text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {savingBrand ? 'Đang lưu...' : 'Lưu thương hiệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM / SỬA DANH MỤC */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <PackageOpen className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  {editingCatItem ? 'Chỉnh sửa Danh mục' : 'Thêm Danh mục Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-medium text-gray-700 block mb-1">Mã ID Danh mục (VD: cat_racket, cat_shoes) *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingCatItem}
                  value={catId}
                  onChange={(e) => setCatId(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                  placeholder="cat_racket"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg disabled:bg-gray-100 text-gray-900 font-mono"
                />
              </div>
              <div>
                <label className="font-medium text-gray-700 block mb-1">Tên danh mục hiển thị *</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Vợt cầu lông"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="font-medium text-gray-700 block mb-1">Slug URL (VD: vot-cau-long) *</label>
                <input
                  type="text"
                  required
                  value={catSlug}
                  onChange={(e) => setCatSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="vot-cau-long"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900 font-mono"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingCat}
                  className="px-4 py-1.5 bg-[#0F5132] hover:bg-[#0c4128] text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {savingCat ? 'Đang lưu...' : 'Lưu danh mục'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
