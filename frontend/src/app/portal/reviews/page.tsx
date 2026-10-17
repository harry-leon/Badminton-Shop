'use client';

import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/lib/admin-context';
import { 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  EyeOff, 
  Trash2, 
  RefreshCw, 
  Send, 
  X, 
  Search, 
  Filter,
  ThumbsUp,
  User,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface ReviewItem {
  id: string;
  product_id: string;
  product_name?: string;
  product_slug?: string;
  product_image?: string;
  author_name: string;
  rating: number;
  title?: string;
  comment: string;
  status: string;
  reply?: string;
  reply_at?: string;
  created_at: string;
}

export default function AdminReviewsPage() {
  const { user } = useAdmin();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Reply
  const [replyingReview, setReplyingReview] = useState<ReviewItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${statusFilter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải đánh giá');
      setReviews(data.reviews || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    const handleRefresh = () => fetchReviews();
    window.addEventListener('portal-refresh', handleRefresh);
    return () => window.removeEventListener('portal-refresh', handleRefresh);
  }, [statusFilter]);

  const handleModerate = async (reviewId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MODERATE',
          review_id: reviewId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyingReview) return;
    setSubmittingReply(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REPLY',
          review_id: replyingReview.id,
          reply_text: replyText,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      setReplyingReview(null);
      setReplyText('');
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Bạn có chắc muốn xóa vĩnh viễn đánh giá này?')) return;
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE',
          review_id: reviewId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message);
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const q = searchQuery.toLowerCase();
    return (
      r.author_name.toLowerCase().includes(q) ||
      (r.product_name && r.product_name.toLowerCase().includes(q)) ||
      (r.comment && r.comment.toLowerCase().includes(q)) ||
      (r.title && r.title.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-black/10 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên khách, sản phẩm hoặc nội dung..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-gray-700 focus:outline-none focus:border-black"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="APPROVED">Đang hiển thị (APPROVED)</option>
            <option value="PENDING">Chờ duyệt (PENDING)</option>
            <option value="HIDDEN">Đã ẩn (HIDDEN)</option>
          </select>

          <div className="text-xs text-gray-500 font-medium px-2 shrink-0">
            Tổng cộng: <strong>{filteredReviews.length}</strong> đánh giá
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-xl border border-black/10 p-12 text-center text-gray-400 text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
            <span>Đang tải đánh giá từ người dùng...</span>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-black/10 p-12 text-center text-gray-400 text-xs">
            Không có đánh giá nào phù hợp với bộ lọc.
          </div>
        ) : (
          filteredReviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-black/10 p-5 shadow-xs flex flex-col md:flex-row justify-between gap-5 transition-shadow hover:shadow-sm"
            >
              <div className="space-y-2.5 max-w-3xl">
                {/* Header review */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    r.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : r.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-gray-100 text-gray-600 border border-gray-200'
                  }`}>
                    {r.status === 'APPROVED' ? 'Đang hiển thị' : r.status === 'PENDING' ? 'Chờ duyệt' : 'Đã ẩn'}
                  </span>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span key={star} className={star <= r.rating ? 'text-amber-400' : 'text-gray-200'}>
                        ★
                      </span>
                    ))}
                    <span className="text-xs text-gray-600 font-semibold ml-1">({r.rating}/5)</span>
                  </div>

                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(r.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Product Name */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Sản phẩm:</span>
                  <span className="font-semibold text-gray-900">{r.product_name || 'Vợt cầu lông'}</span>
                </div>

                {/* Author & Content */}
                <div>
                  <div className="text-xs font-medium text-gray-800 flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>{r.author_name}</span>
                  </div>
                  {r.title && <div className="font-semibold text-sm text-gray-900 mb-0.5">{r.title}</div>}
                  <p className="text-xs text-gray-700 leading-relaxed bg-gray-50/75 p-3 rounded-lg border border-gray-100">
                    "{r.comment}"
                  </p>
                </div>

                {/* Reply */}
                {r.reply && (
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-emerald-900 font-semibold">
                      <span className="flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#0F5132]" />
                        <span>Phản hồi từ Smash Court:</span>
                      </span>
                      {r.reply_at && (
                        <span className="text-[10px] font-normal text-emerald-700 font-mono">
                          {new Date(r.reply_at).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-950 text-xs leading-relaxed">{r.reply}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row md:flex-col items-end justify-between md:justify-start gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingReview(r);
                    setReplyText(r.reply || '');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:border-black bg-white hover:bg-gray-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#0F5132]" />
                  <span>{r.reply ? 'Sửa phản hồi' : 'Trả lời'}</span>
                </button>

                {r.status !== 'APPROVED' ? (
                  <button
                    type="button"
                    onClick={() => handleModerate(r.id, 'APPROVED')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Duyệt hiển thị</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleModerate(r.id, 'HIDDEN')}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-amber-600 hover:border-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Ẩn đánh giá</span>
                  </button>
                )}

                {user?.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Reply */}
      {replyingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-black/10 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0F5132]" />
                <h3 className="font-semibold text-gray-900 text-sm">Phản hồi khách hàng {replyingReview.author_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setReplyingReview(null)}
                className="text-gray-400 hover:text-gray-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendReply} className="p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 text-gray-600">
                <div className="font-medium text-gray-800 mb-0.5">{replyingReview.product_name}</div>
                <div className="italic">"{replyingReview.comment}"</div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-800 block">Nội dung phản hồi từ đại diện Smash Court *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Cảm ơn bạn đã phản hồi! Smash Court rất hân hạnh được phục vụ..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-black"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReplyingReview(null)}
                  className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-4 py-2 rounded-lg bg-[#0F5132] text-white font-medium hover:bg-[#0c4128] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingReply ? 'Đang gửi...' : 'Gửi phản hồi'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
