'use client';

import React, { useState } from 'react';
import { Search, ShieldCheck, Clock, CheckCircle2, AlertTriangle, XCircle, FileText, Wrench } from 'lucide-react';

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
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Đã tiếp nhận yêu cầu</span>;
      case 'INSPECTING':
        return <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Wrench className="w-3.5 h-3.5" /> Đang kiểm định kỹ thuật</span>;
      case 'APPROVED':
        return <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt bảo hành</span>;
      case 'REJECTED':
        return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Từ chối bảo hành</span>;
      case 'CLOSED':
      case 'RESOLVED':
        return <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Đã hoàn tất</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-6">
      <div className="text-center max-w-xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-[#0F5132] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
          <ShieldCheck className="w-4 h-4" /> Bảo hành điện tử 100%
        </div>
        <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
          Tra Cứu Bảo Hành & Tiến Độ Sửa Chữa
        </h1>
        <p className="text-slate-600 text-sm mt-2">
          Nhập số điện thoại mua hàng, mã đơn hoặc số serial để tra cứu chi tiết snapshot chính sách bảo hành đã cam kết.
        </p>
      </div>

      {/* Form Tra Cứu */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm max-w-xl mx-auto mb-10">
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold mb-4">
          <button
            type="button"
            onClick={() => setLookupMode('PHONE_OR_SERIAL')}
            className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
              lookupMode === 'PHONE_OR_SERIAL' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Số Điện Thoại / Số Serial
          </button>
          <button
            type="button"
            onClick={() => setLookupMode('ORDER_CODE')}
            className={`flex-1 py-2 rounded-lg transition-colors cursor-pointer ${
              lookupMode === 'ORDER_CODE' ? 'bg-white text-emerald-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mã Đơn Hàng (+ Xác Thực SĐT)
          </button>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          {lookupMode === 'PHONE_OR_SERIAL' ? (
            <div>
              <label htmlFor="search-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                Số Điện Thoại hoặc Số Serial Vợt
              </label>
              <div className="relative">
                <input
                  id="search-input"
                  type="text"
                  value={phoneOrSerial}
                  onChange={(e) => setPhoneOrSerial(e.target.value)}
                  placeholder="VD: 0909123456 hoặc SN-AX99P-2026-0042"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0F5132] text-sm text-slate-900"
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Mã Đơn Hàng (DH-...)
                </label>
                <input
                  type="text"
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  placeholder="VD: DH-20261013-0001"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0F5132] text-sm text-slate-900 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Số Điện Thoại Mua Hàng (Bảo mật IDOR)
                </label>
                <input
                  type="text"
                  value={orderPhone}
                  onChange={(e) => setOrderPhone(e.target.value)}
                  placeholder="VD: 0909123456"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0F5132] text-sm text-slate-900 font-semibold"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0F5132] text-white font-bold py-3.5 rounded-xl hover:bg-emerald-900 transition-colors shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Đang truy vấn dữ liệu...' : 'Tra Cứu Thông Tin'}
          </button>
        </form>

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {errorMessage}
          </div>
        )}
      </div>

      {/* Kết Quả Tra Cứu */}
      {hasSearched && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Hồ sơ yêu cầu bảo hành */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0F5132]" />
              Tiến Độ Khiếu Nại & Xử Lý Bảo Hành ({claims.length})
            </h2>

            {claims.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
                Không tìm thấy hồ sơ khiếu nại bảo hành nào cho thông tin tra cứu &quot;{lookupMode === 'ORDER_CODE' ? orderCode : phoneOrSerial}&quot;.
              </div>
            ) : (
              <div className="grid gap-4">
                {claims.map((c) => (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                      <div>
                        <div className="text-xs font-bold text-slate-400">MÃ HỒ SƠ: {c.id}</div>
                        <div className="text-base font-extrabold text-slate-900 mt-0.5">{c.product_name}</div>
                      </div>
                      <div>{getStatusBadge(c.status)}</div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-600 mb-4">
                      <div>
                        <strong className="text-slate-900">Mã đơn gốc:</strong> {c.order_code}
                      </div>
                      <div>
                        <strong className="text-slate-900">Serial sản phẩm:</strong> {c.serial_number || 'Chưa gắn'}
                      </div>
                      <div>
                        <strong className="text-slate-900">Ngày yêu cầu:</strong> {new Date(c.created_at).toLocaleDateString('vi-VN')}
                      </div>
                      <div>
                        <strong className="text-slate-900">Kỹ thuật viên phụ trách:</strong> {c.assigned_technician || 'Đang phân công'}
                      </div>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 text-xs mb-4">
                      <div className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        Mô tả hiện trạng hư hỏng từ khách hàng:
                      </div>
                      <p className="text-amber-900 leading-relaxed">{c.damage_description}</p>
                    </div>

                    {c.rejection_reason && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs mb-4">
                        <div className="font-bold text-rose-950 mb-1 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-rose-700" />
                          Lý do từ chối bảo hành:
                        </div>
                        <p className="text-rose-900 leading-relaxed">{c.rejection_reason}</p>
                      </div>
                    )}

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
                      <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        Snapshot Chính sách bảo hành áp dụng (R9 - Bất biến):
                      </div>
                      <p className="text-slate-600 leading-relaxed">{c.policy_snapshot}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danh mục sản phẩm đã mua có hiệu lực bảo hành */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              Sản Phẩm Đã Mua & Chính Sách Đi Kèm ({purchasedWarranties.length})
            </h2>

            {purchasedWarranties.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-500">
                Chưa có đơn hàng hoàn tất nào gắn với từ khóa này.
              </div>
            ) : (
              <div className="grid gap-4">
                {purchasedWarranties.map((w, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3 text-xs">
                      <span className="font-bold text-slate-500">Đơn hàng: {w.order_code}</span>
                      <span className="text-slate-400">Ngày đặt: {new Date(w.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="font-extrabold text-slate-950 text-sm mb-2">{w.product_name_snapshot}</div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-950">
                      <strong>Chính sách bảo hành cam kết:</strong> {w.warranty_policy_snapshot}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quy định bảo hành chung */}
      <div className="mt-12 bg-slate-50 rounded-2xl p-6 border border-slate-200 text-xs text-slate-600 space-y-2">
        <h3 className="font-bold text-slate-900 text-sm mb-2">Quy định tiếp nhận và cam kết bảo hành tại Smash Court:</h3>
        <ul className="list-disc pl-4 space-y-1.5 leading-relaxed">
          <li><strong>Vợt mới chính hãng:</strong> Bảo hành nứt/gãy khung do lỗi vật liệu cấu trúc của NSX trong 12 tháng. 1 đổi 1 trong 30 ngày đầu nếu phát hiện lỗi nhà máy.</li>
          <li><strong>Vợt kiểm định Second-hand:</strong> Bảo hành kết cấu khung từ 30 đến 60 ngày theo biên bản kiểm định 16 điểm. Không áp dụng cho hao mòn tự nhiên (sơn, cước, quấn cán).</li>
          <li><strong>Trường hợp loại trừ:</strong> Va chạm 2 vợt, cạch vợt vào nền sân bê tông, căng cước vượt mức lbs tối đa ghi trên thân vợt, sập khung do máy căng cước ngoài hệ thống.</li>
        </ul>
      </div>
    </div>
  );
}
