'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Search, ShieldCheck, Clock, CheckCircle2, AlertTriangle, XCircle, FileText, Wrench, Check, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

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

function WarrantyLookupContent() {
  const searchParams = useSearchParams();
  const [lookupMode, setLookupMode] = useState<'PHONE_OR_SERIAL' | 'ORDER_CODE'>('PHONE_OR_SERIAL');
  const [phoneOrSerial, setPhoneOrSerial] = useState('');
  const [orderCode, setOrderCode] = useState('');
  const [orderPhone, setOrderPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [purchasedWarranties, setPurchasedWarranties] = useState<PurchasedWarranty[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Tự động kích hoạt tìm kiếm nếu URL có sẵn tham số
  useEffect(() => {
    const q = searchParams.get('q');
    const paramOrderCode = searchParams.get('orderCode');
    const paramPhone = searchParams.get('phone');

    if (paramOrderCode && paramPhone) {
      setLookupMode('ORDER_CODE');
      setOrderCode(paramOrderCode);
      setOrderPhone(paramPhone);
      executeSearch('ORDER_CODE', paramOrderCode, paramPhone);
    } else if (q) {
      setLookupMode('PHONE_OR_SERIAL');
      setPhoneOrSerial(q);
      executeSearch('PHONE_OR_SERIAL', q);
    }
  }, [searchParams]);

  const executeSearch = async (mode: 'PHONE_OR_SERIAL' | 'ORDER_CODE', queryOrCode: string, phoneAuth?: string) => {
    setLoading(true);
    setErrorMessage('');
    try {
      let url = '';
      if (mode === 'ORDER_CODE') {
        url = `/api/warranty/lookup?orderCode=${encodeURIComponent(queryOrCode.trim())}&phone=${encodeURIComponent((phoneAuth || '').trim())}`;
      } else {
        url = `/api/warranty/lookup?q=${encodeURIComponent(queryOrCode.trim())}`;
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

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (lookupMode === 'ORDER_CODE') {
      if (!orderCode.trim() || !orderPhone.trim()) {
        setErrorMessage('Vui lòng nhập cả mã đơn hàng và số điện thoại mua hàng để xác thực.');
        return;
      }
      executeSearch('ORDER_CODE', orderCode, orderPhone);
    } else {
      if (!phoneOrSerial.trim()) {
        setErrorMessage('Vui lòng nhập số điện thoại hoặc số serial.');
        return;
      }
      executeSearch('PHONE_OR_SERIAL', phoneOrSerial);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <Badge variant="muted" className="gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Đã tiếp nhận yêu cầu</span>
          </Badge>
        );
      case 'INSPECTING':
        return (
          <Badge variant="accent" className="gap-1.5">
            <Wrench className="w-3.5 h-3.5" />
            <span>Đang kiểm định kỹ thuật</span>
          </Badge>
        );
      case 'APPROVED':
        return (
          <Badge variant="brand" className="gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Đã duyệt bảo hành</span>
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="sale" className="gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>Từ chối bảo hành</span>
          </Badge>
        );
      case 'CLOSED':
      case 'RESOLVED':
        return (
          <Badge variant="muted" className="gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>Đã hoàn tất & trả vợt</span>
          </Badge>
        );
      default:
        return <Badge variant="muted">{status}</Badge>;
    }
  };

  const renderTimeline = (claim: Claim) => {
    const steps = [
      { key: 'SUBMITTED', title: '1. Tiếp nhận hồ sơ', desc: 'Đã nhận mô tả lỗi từ khách hàng' },
      { key: 'INSPECTING', title: '2. Kiểm định kỹ thuật', desc: claim.assigned_technician ? `KTV: ${claim.assigned_technician}` : 'Đang phân công KTV' },
      {
        key: claim.status === 'REJECTED' ? 'REJECTED' : 'APPROVED',
        title: claim.status === 'REJECTED' ? '3. Từ chối bảo hành' : '3. Duyệt giải pháp',
        desc: claim.status === 'REJECTED' ? 'Biên bản từ chối va chạm ngoại lực' : claim.resolution_type ? `Giải pháp: ${claim.resolution_type}` : 'Đang xét duyệt',
      },
      { key: 'RESOLVED', title: '4. Bàn giao vợt', desc: 'Hoàn tất quy trình bảo hành' },
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
      <div className="py-4 border-y border-line my-4">
        <div className="text-[13px] text-muted font-normal mb-3">
          Tiến độ xử lý hồ sơ bảo hành:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {steps.map((st, i) => {
            const state = getStepState(i);
            const isCompleted = state === 'completed';
            const isActive = state === 'active';
            const isRejectedState = state === 'rejected';

            return (
              <div
                key={st.key}
                className={`p-3 rounded-xl border text-[13px] transition-all ${
                  isCompleted
                    ? 'bg-brand/5 border-brand/20 text-ink'
                    : isActive
                    ? 'bg-surface border-ink text-ink shadow-xs'
                    : isRejectedState
                    ? 'bg-sale/5 border-sale/20 text-sale'
                    : 'bg-bg border-line text-muted'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium mb-1">
                  {isCompleted && <Check className="w-3.5 h-3.5 text-brand" />}
                  {isActive && <Wrench className="w-3.5 h-3.5 text-ink animate-pulse" />}
                  {isRejectedState && <XCircle className="w-3.5 h-3.5 text-sale" />}
                  <span>{st.title}</span>
                </div>
                <div className="text-[12px] opacity-80 font-normal">{st.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-4xl">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted mb-4 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">Tra cứu bảo hành</span>
        </nav>

        {/* Tiêu đề trang */}
        <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[13px] text-brand font-normal">
            <ShieldCheck className="w-4 h-4" />
            <span>Bảo hành điện tử minh bạch · Cam kết chính sách bất biến</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
            Tra cứu bảo hành & tiến độ sửa chữa
          </h1>
          <p className="text-[14px] text-muted leading-relaxed font-normal">
            Nhập số serial nón vợt hoặc mã đơn kèm số điện thoại để tra cứu chi tiết chính sách bảo hành đã cam kết theo đơn hàng.
          </p>
        </div>

        {/* Form Tra Cứu */}
        <div className="bg-surface rounded-2xl border border-line p-5 sm:p-7 shadow-xs max-w-xl mx-auto mb-10">
          <div className="flex bg-bg p-1 rounded-full text-[13px] mb-5 border border-line">
            <button
              type="button"
              onClick={() => setLookupMode('PHONE_OR_SERIAL')}
              className={`flex-1 py-2 rounded-full transition-all cursor-pointer ${
                lookupMode === 'PHONE_OR_SERIAL'
                  ? 'bg-ink text-bg font-medium shadow-xs'
                  : 'text-muted hover:text-ink font-normal'
              }`}
            >
              Số serial nón vợt
            </button>
            <button
              type="button"
              onClick={() => setLookupMode('ORDER_CODE')}
              className={`flex-1 py-2 rounded-full transition-all cursor-pointer ${
                lookupMode === 'ORDER_CODE'
                  ? 'bg-ink text-bg font-medium shadow-xs'
                  : 'text-muted hover:text-ink font-normal'
              }`}
            >
              Mã đơn hàng + Số ĐT
            </button>
          </div>

          <form onSubmit={handleSearch} className="space-y-4">
            {lookupMode === 'PHONE_OR_SERIAL' ? (
              <div>
                <label htmlFor="search-input" className="block text-[13px] text-ink font-medium mb-1.5">
                  Số serial nón vợt
                </label>
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    value={phoneOrSerial}
                    onChange={(e) => setPhoneOrSerial(e.target.value)}
                    placeholder="VD: SN-AX99P-2026-0042"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-ink text-[14px] font-normal"
                  />
                  <Search className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[13px] text-ink font-medium mb-1">
                    Mã đơn hàng (Bắt đầu bằng DH-...)
                  </label>
                  <input
                    type="text"
                    value={orderCode}
                    onChange={(e) => setOrderCode(e.target.value)}
                    placeholder="VD: DH-20261013-0001"
                    className="w-full p-3 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-ink text-[14px] font-normal"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-ink font-medium mb-1">
                    Số điện thoại đặt hàng (Bắt buộc để bảo mật PII)
                  </label>
                  <input
                    type="tel"
                    value={orderPhone}
                    onChange={(e) => setOrderPhone(e.target.value)}
                    placeholder="VD: 0909123456"
                    className="w-full p-3 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-ink text-[14px] font-normal"
                  />
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-3 bg-sale/10 border border-sale/20 text-sale text-[13px] rounded-xl flex items-center gap-2 font-normal">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              isLoading={loading}
              size="md"
              className="w-full text-[14px]"
            >
              Tra cứu thông tin
            </Button>
          </form>
        </div>

        {/* Kết quả Tra Cứu */}
        {hasSearched && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* 1. Danh sách sản phẩm được bảo hành */}
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
                <h2 className="text-lg font-medium text-ink flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand" />
                  <span>Sản phẩm & hợp đồng bảo hành ({purchasedWarranties.length})</span>
                </h2>
                <span className="text-[13px] text-muted font-normal">Chính sách bảo hành bất biến</span>
              </div>

              {purchasedWarranties.length === 0 ? (
                <div className="p-6 bg-surface border border-line rounded-2xl text-center text-[13px] text-muted">
                  Không tìm thấy hợp đồng bảo hành tương ứng với thông tin tra cứu.
                </div>
              ) : (
                <div className="space-y-4">
                  {purchasedWarranties.map((pw, idx) => (
                    <div key={idx} className="bg-surface border border-line rounded-2xl p-5 space-y-3 shadow-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                        <div>
                          <div className="text-[12px] text-muted">Mã đơn hàng:</div>
                          <span className="font-mono text-ink font-medium text-[14px]">{pw.order_code}</span>
                        </div>
                        <div className="text-[13px] text-muted">
                          Ngày mua: <span className="text-ink font-medium">{new Date(pw.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                        <div>
                          <span className="text-muted block text-[12px]">Tên sản phẩm:</span>
                          <span className="font-medium text-ink">{pw.product_name_snapshot}</span>
                        </div>
                        <div>
                          <span className="text-muted block text-[12px]">Mã SKU:</span>
                          <span className="font-mono text-muted">{pw.sku}</span>
                        </div>
                        <div>
                          <span className="text-muted block text-[12px]">Khách hàng:</span>
                          <span className="text-ink">{maskName(pw.customer_name)} ({maskPhone(pw.customer_phone)})</span>
                        </div>
                        <div>
                          <span className="text-muted block text-[12px]">Chính sách cam kết:</span>
                          <span className="text-brand font-medium">{pw.warranty_policy_snapshot || 'Bảo hành khung 12 tháng chính hãng'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Danh sách hồ sơ claim bảo hành */}
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
                <h2 className="text-lg font-medium text-ink flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-brand" />
                  <span>Tiến độ xử lý hồ sơ yêu cầu bảo hành ({claims.length})</span>
                </h2>
              </div>

              {claims.length === 0 ? (
                <div className="p-6 bg-surface border border-line rounded-2xl text-center text-[13px] text-muted">
                  Chưa có yêu cầu bồi thường hoặc bảo hành nào được tạo cho sản phẩm này.
                </div>
              ) : (
                <div className="space-y-6">
                  {claims.map((claim) => (
                    <div key={claim.id} className="bg-surface border border-line rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-ink font-medium text-[15px]">{claim.id}</span>
                            {getStatusBadge(claim.status)}
                          </div>
                          <div className="text-[12px] text-muted mt-1">
                            Sản phẩm: <span className="text-ink font-medium">{claim.product_name}</span> (Serial: <span className="font-mono">{claim.serial_number || 'Khớp hồ sơ'}</span>)
                          </div>
                        </div>

                        <div className="text-[12px] text-muted">
                          Ngày tạo: {new Date(claim.created_at).toLocaleDateString('vi-VN')}
                        </div>
                      </div>

                      {/* Timeline trực quan 4 bước */}
                      {renderTimeline(claim)}

                      {/* Chi tiết lỗi & Lý do từ chối nếu có */}
                      <div className="bg-bg rounded-xl p-4 text-[13px] space-y-2 border border-line">
                        <div>
                          <span className="text-muted block text-[12px]">Mô tả lỗi từ khách hàng:</span>
                          <p className="text-ink mt-0.5 leading-relaxed">&ldquo;{claim.damage_description}&rdquo;</p>
                        </div>

                        {claim.status === 'REJECTED' && claim.rejection_reason && (
                          <div className="p-3 bg-sale/5 border border-sale/20 rounded-lg text-sale text-[12px] mt-2 space-y-1">
                            <div className="font-medium flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>Lý do từ chối bảo hành kèm căn cứ kỹ thuật:</span>
                            </div>
                            <p className="leading-relaxed pl-5">&ldquo;{claim.rejection_reason}&rdquo;</p>
                          </div>
                        )}

                        {claim.assigned_technician && (
                          <div className="text-[12px] text-muted pt-1">
                            Kỹ thuật viên phụ trách: <span className="text-ink font-medium">{claim.assigned_technician}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}

export default function WarrantyLookupPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted text-[14px]">Đang tải dữ liệu tra cứu bảo hành...</div>}>
      <WarrantyLookupContent />
    </Suspense>
  );
}
