import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 bg-bg text-ink">
      <div className="w-20 h-20 rounded-full bg-surface border border-line flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-muted"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-2h2zm0-4h-2V7h2z" />
        </svg>
      </div>

      <span className="text-[13px] font-medium text-brand mb-2">
        Mã lỗi 404
      </span>
      <h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-ink mb-3">
        Không tìm thấy trang yêu cầu
      </h1>
      <p className="text-[15px] text-muted max-w-md mb-8 leading-relaxed font-normal">
        Trang bạn đang tìm kiếm có thể đã bị đổi tên, tạm ẩn hoặc không tồn tại trên hệ thống Smash Court.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-full bg-ink text-bg text-[14px] font-medium hover:opacity-90 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
        </Link>
        <Link
          href="/vot-cau-long"
          className="inline-flex items-center h-11 px-6 rounded-full border border-line bg-surface text-ink text-[14px] font-medium hover:bg-bg transition-colors"
        >
          Xem danh mục vợt
        </Link>
      </div>
    </div>
  );
}
