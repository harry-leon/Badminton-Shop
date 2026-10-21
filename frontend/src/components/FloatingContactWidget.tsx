'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Mail, Phone, MessageSquare, X, ChevronDown, Send, CheckCircle2, Loader2, ExternalLink, RotateCcw } from 'lucide-react';
import { CONTACT_CONFIG } from '@/lib/contact-config';
import { toast } from 'sonner';
import { SanitizedMarkdown } from '@/app/(storefront)/vot-cau-long/[slug]/components/SanitizedMarkdown';
import { getProductDetailUrl } from '@/lib/productUrl';

export function FloatingContactWidget() {
  const pathname = usePathname() || '';
  const isPDP = Boolean(
    /^\/(vot-cau-long|giay-cau-long|quan-ao|day-cuoc|phu-kien|qua-cau-long|tui-bao-vot|quan-can|luoi-cau-long|second-hand)\/[^/]+/.test(pathname)
  );

  const [isPopupOpen, setIsPopupOpen] = React.useState(false);
  const [showEmailForm, setShowEmailForm] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Tab state: 'chat' (AI Tư vấn) | 'channels' (Kênh liên hệ khác)
  const [activeTab, setActiveTab] = React.useState<'chat' | 'channels'>('chat');

  // ChatBot state
  const [chatMessages, setChatMessages] = React.useState<Array<{
    role: 'assistant' | 'user';
    content: string;
    products?: Array<{
      id: string;
      name: string;
      slug: string;
      brand: string;
      category_id?: string;
      sale_price?: number;
      original_price: number;
      image_url?: string;
    }>;
  }>>([
    {
      role: 'assistant',
      content:
        'Chào bạn! Em là Trợ lý tư vấn AI SmashCourt. 🏸\nEm có thể hỗ trợ bạn tìm kiếm vợt theo lối chơi (tấn công, công thủ, phản tạt), tư vấn chọn giày, balo, cước đan hay tra cứu bảo hành chính hãng ạ!',
    },
  ]);
  const [chatInput, setChatInput] = React.useState('');
  const [isBotTyping, setIsBotTyping] = React.useState(false);
  const [suggestedChips, setSuggestedChips] = React.useState<string[]>([]);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Sinh URL động chuẩn xác theo category_id và slug của sản phẩm
  const getProductUrl = (p: { category_id?: string; slug?: string; id?: string }) => {
    return getProductDetailUrl({
      slug: p.slug || p.id || '',
      category_id: p.category_id,
    });
  };

  // Làm mới cuộc trò chuyện tư vấn
  const handleResetChat = () => {
    setChatMessages([
      {
        role: 'assistant',
        content:
          'Chào bạn! Em là Trợ lý tư vấn AI SmashCourt. 🏸\nEm có thể hỗ trợ bạn tìm kiếm vợt theo lối chơi, tư vấn chọn giày, căng cước, balo hoặc kho vợt cũ kiểm định 16 tiêu chí!',
      },
    ]);
    setSuggestedChips([]);
    setChatInput('');
    toast.info('Đã làm mới cuộc hội thoại tư vấn.');
  };

  // Auto scroll chat to bottom
  React.useEffect(() => {
    if (activeTab === 'chat' && isPopupOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isBotTyping, activeTab, isPopupOpen]);

  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = (presetText || chatInput).trim();
    if (!textToSend || isBotTyping) return;

    const newMessages = [...chatMessages, { role: 'user' as const, content: textToSend }];
    setChatMessages(newMessages);
    if (!presetText) setChatInput('');
    setIsBotTyping(true);

    // Gửi kèm 4 - 6 tin nhắn gần nhất để bot duy trì mạch hội thoại
    const recentHistory = chatMessages.slice(-6).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: recentHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi kết nối');

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          products: data.products,
        },
      ]);

      if (Array.isArray(data.suggested_chips) && data.suggested_chips.length > 0) {
        setSuggestedChips(data.suggested_chips);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Dạ hệ thống tư vấn đang bận một chút, bạn có thể gọi hotline 1900 6868 hoặc nhắn tin qua Zalo/Fanpage ở tab bên cạnh nhé!',
        },
      ]);
    } finally {
      setIsBotTyping(false);
    }
  };

  // Email form state
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [subject, setSubject] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);

  // Click outside to close popup and collapse
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPopupOpen(false);
        setIsExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Vui lòng điền họ tên, email và nội dung cần hỗ trợ.');
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
      if (!res.ok) throw new Error(data.error || 'Gửi thất bại.');

      setSubmitted(true);
      toast.success('Đã gửi yêu cầu thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Lỗi gửi tin nhắn.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDirectGmail = () => {
    const defaultSubject = encodeURIComponent(subject || 'Cần tư vấn hỗ trợ SmashCourt');
    const defaultBody = encodeURIComponent(
      `Chào CSKH SmashCourt,\n\nTôi là: ${name || 'Khách hàng'}\nSĐT: ${phone || 'Chưa cung cấp'}\n\nNội dung:\n${message || ''}`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      CONTACT_CONFIG.email.address
    )}&su=${defaultSubject}&body=${defaultBody}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const resetEmailForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSubject('');
    setMessage('');
    setSubmitted(false);
    setShowEmailForm(false);
  };

  return (
    <div
      className={`fixed ${isPDP ? 'bottom-20 sm:bottom-6' : 'bottom-4 sm:bottom-6'} right-4 sm:right-6 z-50 flex flex-col items-end select-none`}
      ref={containerRef}
    >
      {/* Sapo-like Chat Box Popup / AI Chatbot Tư Vấn */}
      {isPopupOpen && (
        <div className="mb-3 w-[calc(100dvw-2rem)] sm:w-[380px] max-w-[380px] bg-surface rounded-2xl shadow-2xl border border-line overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 flex flex-col max-h-[min(560px,calc(100dvh-100px))]">
          {/* Header Xanh Thương hiệu hệ thống */}
          <div className="bg-brand text-white p-3.5 relative shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center font-bold text-brand text-[13px] shadow-xs">
                    SC
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-brand" />
                </div>
                <div>
                  <h4 className="font-semibold text-[14px] leading-tight flex items-center gap-1.5">
                    <span>Trợ Lý Tư Vấn SmashCourt</span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-normal">AI Bot</span>
                  </h4>
                  <p className="text-[11px] text-white/80 font-normal">Tư vấn chọn vợt &amp; sản phẩm 24/7</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleResetChat}
                  className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer touch-target-hit"
                  aria-label="Làm mới cuộc trò chuyện"
                  title="Làm mới cuộc trò chuyện"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsPopupOpen(false)}
                  className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer touch-target-hit"
                  aria-label="Thu nhỏ"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tab chuyển đổi: Chatbot AI vs Kênh hỗ trợ khác */}
            <div className="flex items-center gap-1 bg-black/15 p-1 rounded-xl text-[12px]">
              <button
                type="button"
                onClick={() => { setActiveTab('chat'); setShowEmailForm(false); }}
                className={`flex-1 py-1.5 min-h-[38px] rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center ${
                  activeTab === 'chat' ? 'bg-surface text-brand shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Trò chuyện với AI
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('channels')}
                className={`flex-1 py-1.5 min-h-[38px] rounded-lg font-medium transition-all cursor-pointer flex items-center justify-center ${
                  activeTab === 'channels' ? 'bg-surface text-brand shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Kênh liên hệ khác
              </button>
            </div>
          </div>

          {/* Body: Tab Trò chuyện với ChatBot */}
          {activeTab === 'chat' && (
            <div className="flex flex-col flex-1 min-h-[350px] bg-bg/50">
              {/* Vùng tin nhắn cuộn */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3 text-[13px] max-h-[340px]">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-brand text-white rounded-br-xs'
                          : 'bg-surface text-ink border border-line/70 shadow-xs rounded-bl-xs'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="text-[13px] leading-relaxed">
                          <SanitizedMarkdown
                            content={msg.content}
                            className="space-y-2 text-[13px] text-ink leading-relaxed"
                          />
                        </div>
                      ) : (
                        <p className="whitespace-pre-line">{msg.content}</p>
                      )}

                      {/* Hiển thị thẻ sản phẩm gợi ý đính kèm nếu có */}
                      {msg.products && msg.products.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-line/60 space-y-2">
                          <span className="text-[11px] font-semibold text-muted block uppercase tracking-wider">
                            Sản phẩm phù hợp từ shop:
                          </span>
                          <div className="grid grid-cols-1 gap-1.5">
                            {msg.products.map((p) => (
                              <a
                                key={p.id}
                                href={getProductUrl(p)}
                                className="flex items-center gap-2 p-1.5 rounded-xl bg-bg/80 hover:bg-brand/5 border border-line/60 transition-colors group"
                              >
                                {p.image_url ? (
                                  <img
                                    src={p.image_url}
                                    alt={p.name}
                                    className="w-10 h-10 object-contain rounded-lg bg-surface p-0.5 border border-line/40 shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center font-bold text-[10px] text-brand border border-line/40 shrink-0">
                                    🏸
                                  </div>
                                )}
                                <div className="min-w-0 flex-1 text-left">
                                  <div className="text-[12px] font-semibold text-ink group-hover:text-brand truncate">
                                    {p.name}
                                  </div>
                                  <div className="text-[11px] font-medium text-rose-600">
                                    {Number(p.sale_price || p.original_price).toLocaleString('vi-VN')}đ
                                  </div>
                                </div>
                                <span className="text-[11px] text-muted group-hover:text-brand font-medium shrink-0 pr-1">
                                  Xem →
                                </span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isBotTyping && (
                  <div className="flex items-start">
                    <div className="bg-surface text-muted border border-line/70 rounded-2xl rounded-bl-xs px-3.5 py-2 flex items-center gap-1.5 shadow-xs text-[12px]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                      <span>Đang tra cứu dữ liệu shop...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Gợi ý xu hướng tìm kiếm nhanh (Trending Quick Prompts) & Suggested Chips động */}
              <div className="px-3 py-1.5 bg-surface/80 border-t border-line/50 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
                {suggestedChips.map((chip, cIdx) => (
                  <button
                    key={`chip-${cIdx}`}
                    type="button"
                    onClick={() => handleSendChatMessage(chip)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 transition-colors cursor-pointer shrink-0 font-medium flex items-center gap-1"
                  >
                    <span>💡</span>
                    <span>{chip}</span>
                  </button>
                ))}
                {[
                  '🔥 Top vợt smash bán chạy',
                  '👟 Giày size 42',
                  '🎒 Balo có ngăn để giày',
                  '🏸 Vợt cũ 16 tiêu chí',
                  '⚡ Giao hỏa tốc 2h',
                ].map((prompt, pIdx) => (
                  <button
                    key={`prompt-${pIdx}`}
                    type="button"
                    onClick={() => handleSendChatMessage(prompt)}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-bg hover:bg-brand/10 hover:text-brand text-muted border border-line/60 transition-colors cursor-pointer shrink-0 font-medium"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Ô nhập tin nhắn */}
              <form onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }} className="p-2.5 bg-surface border-t border-line flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Hỏi về vợt, giày, cước đan..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isBotTyping}
                  className="flex-1 bg-bg/60 border border-line rounded-xl px-3 py-2 text-[12.5px] text-ink placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-brand disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={isBotTyping || !chatInput.trim()}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-brand text-white flex items-center justify-center hover:bg-brand/90 transition-all disabled:opacity-40 cursor-pointer shrink-0 shadow-xs touch-target"
                  aria-label="Gửi tin nhắn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Body: Tab Kênh liên hệ khác (Zalo, Messenger, Hotline, Form Email) */}
          {activeTab === 'channels' && (
            <div className="p-4 bg-surface text-ink max-h-[420px] overflow-y-auto">
              {!showEmailForm ? (
                <div className="space-y-3">
                  <p className="text-[13px] text-center text-muted font-normal">
                    Kênh hỗ trợ trực tiếp từ chuyên viên SmashCourt
                  </p>

                  {/* 1. Chat bằng Zalo */}
                  <a
                    href={CONTACT_CONFIG.zalo.chatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#0068FF] hover:bg-[#0057d9] text-white font-medium text-[14px] transition-all shadow-xs cursor-pointer"
                  >
                    <span className="w-5 h-5 rounded-full bg-white text-[#0068FF] flex items-center justify-center text-[10px] font-black">
                      Z
                    </span>
                    <span>Chat bằng Zalo CSKH</span>
                  </a>

                  {/* 2. Chat qua Messenger / Fanpage */}
                  <a
                    href={CONTACT_CONFIG.fanpage.chatUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand hover:bg-brand/90 text-white font-medium text-[14px] transition-all shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 fill-white text-transparent" />
                    <span>Chat qua Fanpage Facebook</span>
                  </a>

                  {/* 3. Gọi điện trực tiếp */}
                  <a
                    href={`tel:${CONTACT_CONFIG.hotline.number}`}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#f59e0b] hover:bg-[#d97706] text-white font-medium text-[14px] transition-all shadow-xs cursor-pointer"
                  >
                    <Phone className="w-4 h-4 fill-white" />
                    <span>Gọi Hotline: {CONTACT_CONFIG.hotline.display}</span>
                  </a>

                  {/* 4. Chat nhanh / Gửi Gmail */}
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-bg hover:bg-bg/80 border border-line text-ink font-medium text-[14px] transition-all cursor-pointer"
                  >
                    <Mail className="w-4 h-4 text-brand" />
                    <span>Gửi thư hỗ trợ / Gmail CSKH</span>
                  </button>
                </div>
              ) : submitted ? (
                <div className="py-6 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-brand mx-auto" />
                  <h4 className="font-semibold text-ink text-[15px]">Đã gửi yêu cầu thành công</h4>
                  <p className="text-[12px] text-muted leading-relaxed">
                    Đội ngũ CSKH sẽ phản hồi qua email <span className="font-medium text-ink">{email}</span> trong vòng 2 giờ làm việc.
                  </p>
                  <button
                    type="button"
                    onClick={resetEmailForm}
                    className="px-4 py-2 rounded-xl bg-bg border border-line text-[13px] text-ink font-medium hover:bg-bg/80 cursor-pointer"
                  >
                    Quay lại
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendEmail} className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-line">
                    <span className="text-[13px] font-medium text-ink">Gửi thông tin cho chúng tôi</span>
                    <button
                      type="button"
                      onClick={() => setShowEmailForm(false)}
                      className="text-[12px] text-muted hover:text-ink cursor-pointer"
                    >
                      Quay lại
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-ink">Họ tên *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-8 rounded-lg border border-line bg-bg/50 px-2.5 text-[12px] text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-ink">Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="name@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-8 rounded-lg border border-line bg-bg/50 px-2.5 text-[12px] text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-ink">Số điện thoại</label>
                      <input
                        type="tel"
                        placeholder="0988xxxxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-8 rounded-lg border border-line bg-bg/50 px-2.5 text-[12px] text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-ink">Nội dung câu hỏi *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Cần tư vấn vợt, bảo hành hoặc căng cước..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-lg border border-line bg-bg/50 p-2 text-[12px] text-ink focus:outline-none focus:ring-1 focus:ring-brand resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <button
                      type="button"
                      onClick={handleOpenDirectGmail}
                      className="inline-flex items-center gap-1 text-brand hover:underline cursor-pointer font-medium"
                    >
                      <span>Mở Gmail Web</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white font-medium hover:bg-brand/90 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Gửi ngay</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Footer nhỏ */}
          <div className="py-2 px-4 border-t border-line bg-surface/80 flex items-center justify-between text-[11px] text-muted shrink-0">
            <span>SmashCourt Badminton Store</span>
            <span className="text-brand font-medium">Hỗ trợ toàn quốc</span>
          </div>
        </div>
      )}

      {/* Cụm liên hệ: Mặc định thu gọn thành 1 nút 'Liên hệ', click để mở các kênh */}
      <div className="flex flex-col items-end gap-2">
        {/* Danh sách các kênh xuất hiện khi mở rộng */}
        {isExpanded && (
          <div className="flex flex-col items-end gap-2 mb-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {/* Nút 1: Messenger / Fanpage */}
            <a
              href={CONTACT_CONFIG.fanpage.chatUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Chat Fanpage Facebook"
              className="group relative flex items-center gap-2 p-0.5 rounded-full transition-all touch-target"
            >
              <span className="bg-surface border border-line text-ink text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Messenger
              </span>
              <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer shadow-md bg-brand text-white hover:shadow-lg touch-target">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.145 2 11.258c0 2.91 1.455 5.517 3.735 7.185V22l3.418-1.875c.91.252 1.874.39 2.847.39 5.523 0 10-4.145 10-9.257C22 6.145 17.523 2 12 2zm1.042 12.443l-2.617-2.793-5.105 2.793 5.615-5.962 2.68 2.793 5.042-2.793-5.615 5.962z" />
                </svg>
              </div>
            </a>

            {/* Nút 2: Zalo */}
            <a
              href={CONTACT_CONFIG.zalo.chatUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Chat Zalo: ${CONTACT_CONFIG.zalo.displayPhone}`}
              className="group relative flex items-center gap-2 p-0.5 rounded-full transition-all touch-target"
            >
              <span className="bg-surface border border-line text-ink text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Zalo
              </span>
              <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer shadow-md bg-[#0068FF] hover:shadow-lg touch-target">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-xs">
                  <span className="text-[#0068FF] font-black text-[9px] tracking-tight">Zalo</span>
                </div>
              </div>
            </a>

            {/* Nút 3: Hotline Điện thoại */}
            <a
              href={`tel:${CONTACT_CONFIG.hotline.number}`}
              title={`Gọi ngay: ${CONTACT_CONFIG.hotline.display}`}
              className="group relative flex items-center gap-2 p-0.5 rounded-full transition-all touch-target"
            >
              <span className="bg-surface border border-line text-ink text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {CONTACT_CONFIG.hotline.display}
              </span>
              <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer shadow-md bg-[#f59e0b] text-white hover:shadow-lg touch-target">
                <Phone className="w-4 h-4 text-white fill-white" />
              </div>
            </a>

            {/* Nút 4: Hộp thoại tư vấn trực tuyến */}
            <button
              type="button"
              onClick={() => setIsPopupOpen(!isPopupOpen)}
              title="Mở hộp thoại tư vấn"
              className="group relative flex items-center gap-2 p-0.5 rounded-full transition-all touch-target"
            >
              <span className="bg-surface border border-line text-ink text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Tư vấn nhanh
              </span>
              <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer shadow-md bg-brand text-white hover:shadow-lg touch-target">
                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.08L2 22l4.92-1.38C8.42 21.5 10.15 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* Nút chính thu gọn mặc định: Icon + chữ 'Liên hệ' chuẩn màu Brand hệ thống */}
        <button
          type="button"
          onClick={() => {
            setIsExpanded(!isExpanded);
            if (isExpanded) {
              setIsPopupOpen(false);
            }
          }}
          className={`flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-full shadow-lg transition-all duration-200 cursor-pointer touch-target ${
            isExpanded
              ? 'bg-ink text-bg hover:opacity-90 shadow-xl scale-105'
              : 'bg-brand text-white hover:bg-brand/90 hover:shadow-xl hover:scale-105 active:scale-95'
          }`}
          aria-label={isExpanded ? 'Đóng liên hệ' : 'Mở kênh liên hệ'}
        >
          {isExpanded ? (
            <>
              <X className="w-4 h-4 transition-transform duration-200 rotate-0 hover:rotate-90" />
              <span className="text-[13px] font-semibold tracking-wide">Đóng</span>
            </>
          ) : (
            <>
              <div className="relative flex items-center justify-center">
                {/* Lớp hào quang thở nhẹ phía sau icon */}
                <span className="absolute -inset-1.5 rounded-full bg-white/20 animate-ping opacity-75" />
                
                {/* Icon bóng thoại đung đưa sống động */}
                <MessageSquare className="w-4 h-4 fill-white relative z-10 animate-contact-wiggle" />
                
                {/* Chấm tròn xanh chanh/lá chuẩn hệ thống báo online */}
                <span className="absolute -top-1 -right-1 flex h-2 w-2 z-20">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 border border-white" />
                </span>
              </div>
              <span className="text-[13px] font-semibold tracking-wide">Liên hệ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
