'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdmin } from '@/lib/admin-context';
import { 
  Tag, 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  ArrowLeft,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface TagItem {
  id: string;
  code: string;
  name: string;
  bg_color: string;
  text_color: string;
  icon_name: string;
  sort_order: number;
  is_active: boolean;
}

export default function ProductTagsPage() {
  const { user } = useAdmin();
  const [availableTags, setAvailableTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Tag modal
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagCode, setTagCode] = useState('');
  const [tagName, setTagName] = useState('');
  const [tagBgColor, setTagBgColor] = useState('#DC2626');
  const [tagTextColor, setTagTextColor] = useState('#FFFFFF');
  const [tagIcon, setTagIcon] = useState('Tag');
  const [tagSortOrder, setTagSortOrder] = useState('1');
  const [editingTagItem, setEditingTagItem] = useState<TagItem | null>(null);
  const [savingTag, setSavingTag] = useState(false);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/tags');
      const data = await res.json();
      if (data.tags) setAvailableTags(data.tags);
    } catch (err: any) {
      toast.error(err.message || 'Không thể tải danh sách thẻ tag');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
    const handleRefresh = () => fetchTags();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, []);

  const handleSaveTag = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTag(true);
    try {
      const action = editingTagItem ? 'UPDATE' : 'CREATE';
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          tag: {
            id: editingTagItem?.id,
            code: tagCode,
            name: tagName,
            bg_color: tagBgColor,
            text_color: tagTextColor,
            icon_name: tagIcon,
            sort_order: parseInt(tagSortOrder, 10) || 0,
            is_active: true,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu tag thất bại');
      toast.success(editingTagItem ? 'Cập nhật tag thành công!' : 'Tạo tag mới thành công!');
      setTagModalOpen(false);
      setEditingTagItem(null);
      setTagCode('');
      setTagName('');
      setTagBgColor('#DC2626');
      setTagTextColor('#FFFFFF');
      if (data.tags) setAvailableTags(data.tags);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSavingTag(false);
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tag "${name}"?`)) return;
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE', tagId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Xóa tag thất bại');
      toast.success('Đã xóa tag thành công!');
      if (data.tags) setAvailableTags(data.tags);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleTag = async (id: string) => {
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'TOGGLE_ACTIVE', tagId: id }),
      });
      const data = await res.json();
      if (data.tags) setAvailableTags(data.tags);
      toast.success('Đã thay đổi trạng thái tag!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Danh sách Thẻ Tag */}
      <div className="bg-white rounded-xl border border-black/10 overflow-hidden shadow-xs">
        <div className="p-3.5 sm:p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50">
          <div>
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#0F5132]" />
              <h2 className="text-sm font-semibold text-gray-900">Danh mục Thẻ Tag &amp; Huy hiệu ({availableTags.length})</h2>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Định nghĩa huy hiệu nổi bật (HOT, NEW, SALE, LIMITED...) để gắn vào sản phẩm.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/portal/products"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium border border-[#E4E3DD] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Về Sản phẩm</span>
            </Link>

            {user?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => {
                  setEditingTagItem(null);
                  setTagCode('');
                  setTagName('');
                  setTagBgColor('#DC2626');
                  setTagTextColor('#FFFFFF');
                  setTagIcon('Tag');
                  setTagSortOrder((availableTags.length + 1).toString());
                  setTagModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0F5132] hover:bg-[#0c4128] text-white text-xs font-medium shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm thẻ Tag</span>
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {availableTags.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              Chưa có tag nào được kích hoạt. Hãy tạo tag đầu tiên!
            </div>
          ) : (
            availableTags.map((t) => (
              <div key={t.id} className="p-4 hover:bg-gray-50/60 transition-colors flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4">
                  <span
                    style={{ backgroundColor: t.bg_color, color: t.text_color }}
                    className="px-3 py-1 rounded-full text-xs font-bold shadow-xs uppercase tracking-wider"
                  >
                    {t.name}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{t.name}</span>
                      <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">Mã: {t.code}</span>
                      <span className="text-[10px] text-gray-400">Thứ tự #{t.sort_order}</span>
                    </div>
                    <div className="text-[11px] text-gray-500 font-mono mt-0.5 flex items-center gap-3">
                      <span>Màu nền: <span className="inline-block w-3 h-3 rounded-full border align-middle ml-1" style={{ backgroundColor: t.bg_color }} /> {t.bg_color}</span>
                      <span>Màu chữ: <span className="inline-block w-3 h-3 rounded-full border align-middle ml-1" style={{ backgroundColor: t.text_color }} /> {t.text_color}</span>
                    </div>
                  </div>
                </div>

                {user?.role === 'ADMIN' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleTag(t.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                        t.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {t.is_active ? 'Đang bật' : 'Tạm tắt'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTagItem(t);
                        setTagCode(t.code);
                        setTagName(t.name);
                        setTagBgColor(t.bg_color);
                        setTagTextColor(t.text_color);
                        setTagIcon(t.icon_name || 'Tag');
                        setTagSortOrder(t.sort_order.toString());
                        setTagModalOpen(true);
                      }}
                      className="min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700 cursor-pointer"
                      title="Sửa tag"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTag(t.id, t.name)}
                      className="min-w-[36px] min-h-[36px] touch-target-hit inline-flex items-center justify-center p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 cursor-pointer"
                      title="Xóa tag"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL: THÊM / SỬA TAG */}
      {tagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">
                  {editingTagItem ? 'Chỉnh sửa Thẻ Tag' : 'Thêm Thẻ Tag Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setTagModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveTag} className="p-4 space-y-3 text-xs">
              <div>
                <label className="font-medium text-gray-700 block mb-1">Mã Code nhận diện (VD: HOT, SALE, NEW) *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingTagItem}
                  value={tagCode}
                  onChange={(e) => setTagCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                  placeholder="HOT"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg disabled:bg-gray-100 text-gray-900 font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-medium text-gray-700 block mb-1">Tên nhãn hiển thị *</label>
                <input
                  type="text"
                  required
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Bán chạy"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-gray-700 block mb-1">Màu nền (Hex) *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tagBgColor}
                      onChange={(e) => setTagBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={tagBgColor}
                      onChange={(e) => setTagBgColor(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-medium text-gray-700 block mb-1">Màu chữ (Hex) *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={tagTextColor}
                      onChange={(e) => setTagTextColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={tagTextColor}
                      onChange={(e) => setTagTextColor(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="font-medium text-gray-700 block mb-1">Thứ tự ưu tiên sắp xếp</label>
                <input
                  type="number"
                  value={tagSortOrder}
                  onChange={(e) => setTagSortOrder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>
              <div className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-gray-500">Xem trước hiển thị:</span>
                <span
                  style={{ backgroundColor: tagBgColor, color: tagTextColor }}
                  className="px-3 py-1 rounded-full text-xs font-bold shadow-xs uppercase tracking-wider"
                >
                  {tagName || 'Demo Tag'}
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setTagModalOpen(false)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingTag}
                  className="px-4 py-1.5 bg-[#0F5132] hover:bg-[#0c4128] text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {savingTag ? 'Đang lưu...' : 'Lưu thẻ Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
