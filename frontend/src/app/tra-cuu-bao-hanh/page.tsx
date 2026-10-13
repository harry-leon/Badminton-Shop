'use client';

import React, { useState } from 'react';
import { Search, ShieldCheck, Clock, CheckCircle2, AlertTriangle, XCircle, FileText, Wrench, ArrowRight, ShieldAlert, Check } from 'lucide-react';

interface Claim {
  id: string;
  order_code: string;
  customer_phone: string;
  serial_number: string;
  product_name: string;
  policy_snapshot: string;
  damage_description: string;
  images_json: string;
  status: 'SUBMITTED' | 'INSPECTING' | 'APPROVED' | 'REJECTED' | 'RESOLVED' | 'CLOSED';
  rejection_reason?: string;
  resolution_type?: string;
  assigned_technician?: string;
  created_at: string;
}

interface PurchasedWarranty {
  order_code: string;
  customer_phone: string;
  customer_name: string;
  created_at: string;
  sku: string;
  product_name_snapshot: string;
  warranty_policy_snapshot: string;
}

function maskPhone(phone?: string) {
  if (!phone || phone.length < 6) return phone || '';
  return phone.slice(0, 4) + '****' + phone.slice(-2);
}

function maskName(name?: string) {
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 1) + '***';
  return words
    .map((w, idx) => (idx === 0 ? w : w.slice(0, 1) + '***'))
    .join(' ');
}

export default function WarrantyLookupPage() {
  const [lookupMode, setLookupMode] = useState<'PHONE_OR_SERIAL' | 'ORDER_CODE'>('PHONE_OR_SERIAL');
  const [phoneOrSerial, setPhoneOrSerial] = useState('0909123456');
  const [orderCode, setOrderCode] = useState('DH-20261013-0001');
  const [orderPhone, setOrderPhone] = useState('0909123456');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [purchasedWarranties, setPurchasedWarranties] = useState<PurchasedWarranty[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setLoading(true);
    setErrorMessage('');
    try {
      let url = '';
      if (lookupMode === 'ORDER_CODE') {
        if (!orderCode.trim() || !orderPhone.trim()) {
          throw new Error('Vui lòng nhập cả Mã đơn hàng và Số điện thoại mua hàng để xác thực!');
        }
        url = `/api/warranty/lookup?orderCode=${encodeURIComponent(orderCode.trim())}&phone=${encodeURIComponent(orderPhone.trim())}`;
      } else {
        if (!phoneOrSerial.trim()) {
          throw new Error('Vui lòng nhập số điện thoại hoặc số serial');
        }
        url = `/api/warranty/lookup?q=${encodeURIComponent(phoneOrSerial.trim())}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi tra cứu thông tin');
      }
      setClaims(data.claims || []);
      setPurchasedWarranties(data.purchasedWarranties || []);
      setHasSearched(true);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Đã tiếp nhận yêu cầu
          </span>
        );
      case 'INSPECTING':
        return (
          <span className="bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> Đang kiểm định kỹ thuật
          </span>
        );
      case 'APPROVED':
        return (
          <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Đã duyệt bảo hành
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-rose-50 text-rose-800 border border-rose-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Từ chối bảo hành
          </span>
        );
      case 'CLOSED':
      case 'RESOLVED':
        return (
          <span className="bg-stone-100 text-stone-800 border border-stone-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-stone-600" /> Đã hoàn tất & Trả vợt
          </span>
        );
      default:
        return <span className="bg-stone-100 text-stone-800 text-xs font-bold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  const renderTimeline = (claim: Claim) => {
    const steps = [
      { key: 'SUBMITTED', title: '1. Tiếp nhận hồ sơ', desc: 'Đã nhận mô tả lỗi' },
      { key: 'INSPECTING', title: '2. Kiểm định kỹ thuật', desc: claim.assigned_technician ? `KTV: ${claim.assigned_technician}` : 'Đang phân công KTV' },
      {
        key: claim.status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
        title: claim.status === 'REJECTED' ? '3. Từ chối bảo hành' : '3. Duyệt giải pháp',
        desc: claim.status === 'REJECTED' ? 'Biên bản từ chối ngoại lực' : claim.resolution_type ? `Giải pháp: ${claim.resolution_type}` : 'Đang xét duyệt',
      },
      { key: 'RESOLVED', title: '4. Bàn giao vợt', desc: 'Hoàn tất quy trình' },
    ];

    const getStepState = (stepIndex: number) => {
      if (claim.status === 'REJECTED') {
        if (stepIndex <= 1) return 'completed';
        if (stepIndex === 2) return 'rejected';
        return 'inactive';
      }
      if (claim.status === 'RESOLVED' || claim.status === 'CLOSED') {
        return 'completed';
      }
      if (claim.status === 'APPROVED') {
        if (stepIndex <= 2) return 'completed';
        return 'active';
      }
      if (claim.status === 'INSPECTING') {
        if (stepIndex === 0) return 'completed';
        if (stepIndex === 1) return 'active';
        return 'inactive';
      }
      // SUBMITTED
      if (stepIndex === 0) return 'active';
      return 'inactive';
    };

    return (
      <div className="py-4 border-y border-stone-100 my-4">
        <div className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">
          Timeline tiến độ xử lý bảo hành:
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((st, i) => {
            const state = getStepState(i);
            const isCompleted = state === 'completed';
            const isActive = state === 'active';
            const isRejectedState = state === 'rejected';

            return (
              <div
                key={st.key}
                className={`p-3 rounded-2xl border text-xs transition-all ${
                  isCompleted
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                    : isActive
                    ? 'bg-amber-50/80 border-amber-300 text-amber-950 ring-2 ring-amber-400/30'
                    : isRejectedState
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-stone-50 border-stone-200 text-stone-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-black mb-1">
                  {isCompleted && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                  {isActive && <Wrench className="w-3.5 h-3.5 text-amber-700 animate-pulse" />}
                  {isRejectedState && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                  <span>{st.title}</span>
                </div>
                <div className="text-[11px] font-medium opacity-80">{st.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F7F2] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 bg-[#0F5132]/10 text-[#0F5132] text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-3 border border-[#0F5132]/20 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#0F5132]" /> Bảo Hành Điện Tử Minh Bạch
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A2420] tracking-tight">
            Tra Cứu Bảo Hành & Tiến Độ Sửa Chữa
          </h1>
          <p className="text-stone-600 text-sm mt-2">
            Nhập số điện thoại mua hàng, số serial vợt hoặc mã đơn để tra cứu chi tiết snapshot chính sách bảo hành đã cam kết (Quy tắc R9: Snapshot Immutability).
          </p>
        </div>

        {/* Form Tra Cứu */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs max-w-xl mx-auto mb-10">
          <div className="flex bg-stone-100 p-1.5 rounded-2xl text-xs font-bold mb-5">
            <button
              type="button"
              onClick={() => setLookupMode('PHONE_OR_SERIAL')}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                lookupMode === 'PHONE_OR_SERIAL'
                  ? 'bg-[#0F5132] text-[#C8F31D] shadow-sm font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Số ĐT / Số Serial Vợt
            </button>
            <button
              type="button"
              onClick={() => setLookupMode('ORDER_CODE')}
              className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                lookupMode === 'ORDER_CODE'
                  ? 'bg-[#0F5132] text-[#C8F31D] shadow-sm font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Mã Đơn (+ Xác thực SĐT)
            </button>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            {lookupMode === 'PHONE_OR_SERIAL' ? (
              <div>
                <label htmlFor="search-input" className="block text-xs font-black text-stone-700 uppercase tracking-wide mb-2">
                  Số Điện Thoại Mua Hàng hoặc Số Serial Vợt
                </label>
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    value={phoneOrSerial}
                    onChange={(e) => setPhoneOrSerial(e.target.value)}
                    placeholder="VD: 0909123456 hoặc SN-AX99P-2026-0042"
                    className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0F5132] text-sm text-stone-900 font-semibold"
                  />
                  <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-black text-stone-700 uppercase tracking-wide mb-1">
                    Mã Đơn Hàng (Bắt đầu bằng DH-...)
                  </label>
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="VD: DH-20261013-0001"
                    className="w-full px-4 py-3.5 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0F5132] text-sm text-stone-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-stone-700 uppercase tracking-wide mb-1">
                    Số Điện Thoại Mua Hàng (Chống rà quét IDOR)
                  </label>
                  <input
                    type="text"
                    value={orderPhone}
                    onChange={(e) => setOrderPhone(e.target.value)}
                    placeholder="VD: 0909123456"
                    className="w-full px-4 py-3.5 rounded-2xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-[#0F5132] text-sm text-stone-900 font-semibold"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F5132] hover:bg-[#16794C] text-[#C8F31D] font-black py-4 rounded-2xl transition-all shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Đang truy vấn dữ liệu từ PostgreSQL...' : 'Tra Cứu Thông Tin Bảo Hành'}
            </button>
          </form>

          {errorMessage && (
            <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" /> {errorMessage}
            </div>
          )}
        </div>

        {/* Kết Quả Tra Cứu */}
        {hasSearched && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* 1. Hồ sơ yêu cầu bảo hành */}
            <div>
              <h2 className="text-xl font-black text-stone-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#0F5132]" />
                Hồ Sơ Khiếu Nại & Tiến Độ Xử Lý ({claims.length})
              </h2>

              {claims.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center text-xs text-stone-500 shadow-xs">
                  Không tìm thấy hồ sơ khiếu nại bảo hành nào cho thông tin tra cứu &quot;{lookupMode === 'ORDER_CODE' ? orderCode : phoneOrSerial}&quot;.
                </div>
              ) : (
                <div className="grid gap-6">
                  {claims.map((c) => (
                    <div key={c.id} className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4 mb-4">
                        <div>
                          <div className="text-xs font-mono font-bold text-stone-400">MÃ HỒ SƠ: {c.id}</div>
                          <h3 className="text-lg font-black text-stone-900 mt-0.5">{c.product_name}</h3>
                        </div>
                        <div>{getStatusBadge(c.status)}</div>
                      </div>

                      {/* Visual Inspection Timeline */}
                      {renderTimeline(c)}

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs text-stone-600 mb-5">
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                          <span className="text-stone-400 block text-[10px]">Mã đơn gốc:</span>
                          <strong className="text-stone-900 font-mono">{c.order_code}</strong>
                        </div>
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                          <span className="text-stone-400 block text-[10px]">Serial sản phẩm:</span>
                          <strong className="text-stone-900 font-mono">{c.serial_number || 'Chưa gắn'}</strong>
                        </div>
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                          <span className="text-stone-400 block text-[10px]">SĐT Khách hàng (PII Masked):</span>
                          <strong className="text-stone-900 font-mono">{maskPhone(c.customer_phone)}</strong>
                        </div>
                        <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                          <span className="text-stone-400 block text-[10px]">Kỹ thuật viên phụ trách:</span>
                          <strong className="text-stone-900">{c.assigned_technician || 'Đang phân công'}</strong>
                        </div>
                      </div>

                      <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-4 text-xs mb-4">
                        <div className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-amber-700" />
                          Mô tả hiện trạng hư hỏng từ khách hàng:
                        </div>
                        <p className="text-amber-900 leading-relaxed font-medium">{c.damage_description}</p>
                      </div>

                      {c.rejection_reason && (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs mb-4">
                          <div className="font-bold text-rose-950 mb-1 flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-700" />
                            Biên bản từ chối bảo hành (Kịch bản K10):
                          </div>
                          <p className="text-rose-900 leading-relaxed font-semibold">{c.rejection_reason}</p>
                        </div>
                      )}

                      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-xs">
                        <div className="font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          Snapshot Chính sách bảo hành áp dụng (R9 - Bất biến):
                        </div>
                        <p className="text-stone-600 leading-relaxed italic">{c.policy_snapshot}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Danh mục sản phẩm đã mua có hiệu lực bảo hành */}
            <div>
              <h2 className="text-xl font-black text-stone-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                Sản Phẩm Đã Mua & Chính Sách Đi Kèm ({purchasedWarranties.length})
              </h2>

              {purchasedWarranties.length === 0 ? (
                <div className="bg-white border border-stone-200 rounded-3xl p-8 text-center text-xs text-stone-500 shadow-xs">
                  Chưa có đơn hàng hoàn tất nào gắn với từ khóa này.
                </div>
              ) : (
                <div className="grid gap-4">
                  {purchasedWarranties.map((w, idx) => (
                    <div key={idx} className="bg-white border border-stone-200 rounded-3xl p-6 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3 mb-3 text-xs">
                        <span className="font-mono font-bold text-stone-700">Đơn hàng: {w.order_code}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-stone-500 font-semibold">Khách: {maskName(w.customer_name)}</span>
                          <span className="text-stone-400">Ngày đặt: {new Date(w.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>
                      <div className="font-black text-stone-950 text-base mb-2">{w.product_name_snapshot}</div>
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-950">
                        <strong className="text-emerald-900">Chính sách bảo hành cam kết:</strong> {w.warranty_policy_snapshot}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quy định bảo hành chung */}
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs text-xs text-stone-600 space-y-3">
          <h3 className="font-black text-stone-900 text-sm">Cam kết bảo hành & Quy chuẩn tiếp nhận tại Smash Court:</h3>
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            <li><strong>Vợt mới chính hãng (100%):</strong> Bảo hành kết cấu khung 12 tháng. 1 đổi 1 trong 30 ngày nếu phát hiện lỗi nứt gãy tự nhiên từ vật liệu cấu trúc của NSX.</li>
            <li><strong>Vợt cũ kiểm định (Second-hand):</strong> Bảo hành kết cấu khung từ 30 đến 60 ngày theo biên bản kiểm định 16 điểm độc lập. Không áp dụng cho hao mòn tự nhiên (sơn, cước, quấn cán).</li>
            <li><strong>Trường hợp loại trừ (Từ chối):</strong> Va chạm 2 vợt đối kháng trên sân, cạch vợt vào nền sân bê tông, căng cước vượt quá mức lbs tối đa ghi trên thân vợt, sập khung do kẹp máy căng sai quy cách.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
