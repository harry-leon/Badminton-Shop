'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ShieldCheck, Phone, Clock, QrCode, CheckCircle2, ChevronRight, LogOut, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PriceTag } from '@/components/ui/PriceTag';
import { EmptyState } from '@/components/ui/EmptyState';

const STORAGE_KEY = 'smashcourt_account_phone';

function maskPhone(phone: string) {
  if (!phone || phone.length < 6) return phone;
  return phone.slice(0, 4) + '****' + phone.slice(-2);
}

export default function AccountPage() {
  const [phone, setPhone] = useState('');
  const [inputPhone, setInputPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ORDERS' | 'WARRANTY'>('ORDERS');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPhone(saved);
        fetchAccountData(saved);
      }
    } catch {
      // Ignore
    }
  }, []);

  const fetchAccountData = async (userPhone: string) => {
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Tra cứu bảo hành & claims qua /api/warranty/lookup
      const warrantyRes = await fetch(`/api/warranty/lookup?q=${encodeURIComponent(userPhone.trim())}`);
      const warrantyData = await warrantyRes.json();
      if (warrantyRes.ok) {
        setWarranties(warrantyData.purchasedWarranties || []);
        setClaims(warrantyData.claims || []);
      }

      // 2. Tra cứu danh sách đơn hàng
      // Sử dụng purchasedWarranties để tổng hợp các đơn hàng mà khách đã đặt
      const uniqueOrders: any[] = [];
      if (warrantyData.purchasedWarranties) {
        const orderMap = new Map();
        for (const item of warrantyData.purchasedWarranties) {
          if (!orderMap.has(item.order_code)) {
            orderMap.set(item.order_code, {
              orderCode: item.order_code,
              createdAt: item.created_at,
              customerName: item.customer_name,
              items: [{ name: item.product_name_snapshot, sku: item.sku, policy: item.warranty_policy_snapshot }],
            });
          } else {
            orderMap.get(item.order_code).items.push({
              name: item.product_name_snapshot,
              sku: item.sku,
              policy: item.warranty_policy_snapshot,
            });
          }
        }
        setOrders(Array.from(orderMap.values()));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi tải thông tin tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPhone.trim() || inputPhone.trim().length < 9) {
      setErrorMessage('Vui lòng nhập số điện thoại hợp lệ (tối thiểu 9 số).');
      return;
    }
    const cleanPhone = inputPhone.trim();
    setPhone(cleanPhone);
    try {
      localStorage.setItem(STORAGE_KEY, cleanPhone);
    } catch {
      // Ignore
    }
    fetchAccountData(cleanPhone);
  };

  const handleLogout = () => {
    setPhone('');
    setInputPhone('');
    setOrders([]);
    setWarranties([]);
    setClaims([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted mb-4 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">Tài khoản & Đơn mua</span>
        </nav>

        {/* Chưa đăng nhập: Form xác thực SĐT */}
        {!phone ? (
          <div className="max-w-md mx-auto py-8">
            <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs text-center">
              <div className="w-14 h-14 bg-bg border border-line rounded-full flex items-center justify-center mx-auto text-ink">
                <Phone className="w-6 h-6" />
              </div>

              <div>
                <h1 className="text-2xl font-medium tracking-tight text-ink">
                  Tra cứu tài khoản khách hàng
                </h1>
                <p className="text-[14px] text-muted mt-1 leading-relaxed font-normal">
                  Nhập số điện thoại đã dùng khi đặt hàng để xem danh sách đơn mua, trạng thái giao nhận và thẻ bảo hành điện tử.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-[13px] text-ink font-medium mb-1.5">
                    Số điện thoại mua hàng:
                  </label>
                  <input
                    type="tel"
                    required
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    placeholder="VD: 0909123456"
                    className="w-full p-3 rounded-xl border border-line bg-surface text-ink focus:outline-none focus:border-ink text-[14px] font-normal"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 bg-sale/10 border border-sale/20 text-sale text-[13px] rounded-xl font-normal">
                    {errorMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  isLoading={loading}
                  size="md"
                  className="w-full text-[14px]"
                >
                  Xác nhận & Xem thông tin
                </Button>
              </form>

              <div className="text-[12px] text-muted font-normal pt-2 border-t border-line">
                Dữ liệu được bảo mật PII theo tiêu chuẩn an toàn của Smash Court.
              </div>
            </div>
          </div>
        ) : (
          /* Đã xác thực SĐT: Hiển thị thông tin tài khoản */
          <div className="space-y-8">
            {/* Header thông tin khách */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
              <div className="space-y-1">
                <div className="text-[13px] text-muted font-normal">
                  Số điện thoại khách hàng
                </div>
                <div className="text-xl sm:text-2xl font-medium text-ink flex items-center gap-2">
                  <span>{maskPhone(phone)}</span>
                  <Badge variant="brand">Đã xác thực</Badge>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink border border-line rounded-full px-4 py-1.5 transition-colors self-start sm:self-auto cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đổi số điện thoại</span>
              </button>
            </div>

            {/* Tab chuyển đổi Đơn hàng vs Bảo hành */}
            <div className="flex bg-bg p-1 rounded-full text-[13px] max-w-sm border border-line">
              <button
                type="button"
                onClick={() => setActiveTab('ORDERS')}
                className={`flex-1 py-2 rounded-full transition-all cursor-pointer ${
                  activeTab === 'ORDERS'
                    ? 'bg-ink text-bg font-medium shadow-xs'
                    : 'text-muted hover:text-ink font-normal'
                }`}
              >
                Đơn mua ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('WARRANTY')}
                className={`flex-1 py-2 rounded-full transition-all cursor-pointer ${
                  activeTab === 'WARRANTY'
                    ? 'bg-ink text-bg font-medium shadow-xs'
                    : 'text-muted hover:text-ink font-normal'
                }`}
              >
                Bảo hành ({warranties.length})
              </button>
            </div>

            {/* Tab 1: Đơn mua */}
            {activeTab === 'ORDERS' && (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <EmptyState
                    title="Chưa có đơn hàng nào được tìm thấy"
                    description="Không tìm thấy đơn hàng nào gắn với số điện thoại này. Bạn có thể duyệt danh mục vợt để chọn mua."
                    actionText="Xem danh mục vợt"
                    actionHref="/vot-cau-long"
                  />
                ) : (
                  orders.map((order, idx) => (
                    <div
                      key={idx}
                      className="bg-surface border border-line rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                        <div>
                          <div className="text-[12px] text-muted">Mã đơn hàng:</div>
                          <span className="font-mono text-[15px] font-medium text-ink">{order.orderCode}</span>
                        </div>
                        <div className="text-[13px] text-muted">
                          Ngày đặt: <span className="text-ink font-medium">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {order.items.map((item: any, iIdx: number) => (
                          <div key={iIdx} className="flex justify-between items-center text-[13px] p-3 bg-bg rounded-xl">
                            <div>
                              <div className="font-medium text-ink">{item.name}</div>
                              <div className="text-[12px] text-muted font-mono">{item.sku}</div>
                            </div>
                            <div className="text-right">
                              <Badge variant="muted">{item.policy || 'Bảo hành 12 tháng'}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <Link
                          href={`/tra-cuu-bao-hanh?orderCode=${order.orderCode}&phone=${phone}`}
                          className="text-[13px] text-brand hover:underline font-normal inline-flex items-center gap-1"
                        >
                          <span>Xem chi tiết & tra cứu bảo hành</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 2: Bảo hành & Claims */}
            {activeTab === 'WARRANTY' && (
              <div className="space-y-4">
                {warranties.length === 0 ? (
                  <EmptyState
                    title="Chưa có hợp đồng bảo hành nào"
                    description="Số điện thoại này hiện chưa có sản phẩm nào kích hoạt bảo hành điện tử."
                    actionText="Xem danh mục vợt"
                    actionHref="/vot-cau-long"
                  />
                ) : (
                  warranties.map((w, idx) => (
                    <div
                      key={idx}
                      className="bg-surface border border-line rounded-2xl p-5 space-y-3 shadow-xs"
                    >
                      <div className="flex justify-between items-center border-b border-line pb-3">
                        <div>
                          <h3 className="text-[15px] font-medium text-ink">{w.product_name_snapshot}</h3>
                          <div className="text-[12px] text-muted font-mono">Đơn hàng: {w.order_code}</div>
                        </div>
                        <Badge variant="brand">Bảo hành chính hãng</Badge>
                      </div>

                      <div className="text-[13px] text-muted space-y-1">
                        <div>Chính sách: <span className="text-ink font-medium">{w.warranty_policy_snapshot || '12 tháng khung'}</span></div>
                        <div>Ngày kích hoạt: <span className="text-ink">{new Date(w.created_at).toLocaleDateString('vi-VN')}</span></div>
                      </div>

                      <div className="pt-2 border-t border-line flex justify-end">
                        <Link
                          href={`/tra-cuu-bao-hanh?q=${encodeURIComponent(phone)}`}
                          className="text-[13px] text-brand hover:underline font-normal inline-flex items-center gap-1"
                        >
                          <span>Gửi yêu cầu bảo hành →</span>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
