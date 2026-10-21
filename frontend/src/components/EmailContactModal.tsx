'use client';

import * as React from 'react';
import { X, Send, Mail, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CONTACT_CONFIG } from '@/lib/contact-config';
import { toast } from 'sonner';

interface EmailContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailContactModal({ isOpen, onClose }: EmailContactModalProps) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Vui lòng điền đầy đủ họ tên, email và nội dung cần hỗ trợ.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/contact/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gửi tin nhắn không thành công.');
      }

      setSubmitted(true);
      toast.success('Yêu cầu hỗ trợ đã được gửi thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDirectGmail = () => {
    const defaultSubject = encodeURIComponent(subject || 'Cần tư vấn hỗ trợ từ SmashCourt');
    const defaultBody = encodeURIComponent(
      `Chào bộ phận CSKH SmashCourt,\n\nTôi là: ${name || 'Khách hàng'}\nSố điện thoại: ${phone || 'Chưa cung cấp'}\n\nNội dung yêu cầu:\n${message || ''}`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      CONTACT_CONFIG.email.address
    )}&su=${defaultSubject}&body=${defaultBody}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSubject('');
    setMessage('');
    setSubmitted(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-bg border border-line rounded-2xl w-full max-w-lg shadow-lg overflow-hidden flex flex-col max-h-[90dvh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 id="contact-modal-title" className="font-medium text-[15px] text-ink leading-tight">
                Gửi yêu cầu qua Email
              </h3>
              <p className="text-[12px] text-muted font-normal mt-0.5">
                Hỗ trợ kỹ thuật, kiểm định và bảo hành vợt
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-muted hover:text-ink w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-surface transition-colors cursor-pointer touch-target"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {submitted ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand/10 text-brand mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-[16px] font-medium text-ink">Yêu cầu đã được tiếp nhận</h4>
              <p className="text-[13px] text-muted font-normal max-w-sm mx-auto leading-relaxed">
                Chuyên viên tư vấn SmashCourt sẽ kiểm tra và phản hồi trực tiếp tới email{' '}
                <span className="font-medium text-ink">{email}</span> trong vòng 2 giờ làm việc.
              </p>
              <div className="pt-2">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Đóng cửa sổ
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-ink">
                    Họ và tên <span className="text-sale">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full h-9 rounded-lg border border-line bg-surface/50 px-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-colors"
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[12px] font-medium text-ink">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    className="w-full h-9 rounded-lg border border-line bg-surface/50 px-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-colors"
                    placeholder="0988xxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-medium text-ink">
                  Địa chỉ Email <span className="text-sale">*</span>
                </label>
                <input
                  type="email"
                  className="w-full h-9 rounded-lg border border-line bg-surface/50 px-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-colors"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-medium text-ink">Tiêu đề yêu cầu</label>
                <input
                  type="text"
                  className="w-full h-9 rounded-lg border border-line bg-surface/50 px-3 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-colors"
                  placeholder="Ví dụ: Tư vấn căng vợt Astrox / Kiểm tra serial bảo hành"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[12px] font-medium text-ink">
                  Nội dung chi tiết <span className="text-sale">*</span>
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-line bg-surface/50 px-3 py-2 text-[13px] text-ink placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink focus:border-ink transition-colors resize-none"
                  placeholder="Mô tả cụ thể câu hỏi hoặc tình trạng vợt của bạn để nhân viên hỗ trợ nhanh nhất..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
              </div>

              {/* Tùy chọn mở Gmail trực tiếp */}
              <div className="bg-surface border border-line rounded-xl p-3 flex items-center justify-between text-[12px]">
                <div className="text-muted font-normal">
                  Gửi tới: <span className="font-medium text-ink">{CONTACT_CONFIG.email.address}</span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenDirectGmail}
                  className="inline-flex items-center gap-1 text-brand font-medium hover:underline cursor-pointer"
                >
                  <span>Mở trên Gmail Web</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
                <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                  Hủy bỏ
                </Button>
                <Button type="submit" variant="brand" size="sm" disabled={loading} className="gap-1.5">
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang gửi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Gửi tin nhắn</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
