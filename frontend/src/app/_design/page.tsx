'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PriceTag } from '@/components/ui/PriceTag';
import { SpecBar } from '@/components/ui/SpecBar';
import { ProductCard } from '@/components/ui/ProductCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { Sun, Moon, Sparkles, ShieldCheck, ArrowRight } from 'lucide-react';

export default function DesignSystemPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [demoPrice, setDemoPrice] = React.useState(3950000);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-bg text-ink p-4 sm:p-8 lg:p-12 transition-colors duration-200">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-line">
          <div>
            <div className="inline-flex items-center gap-2 text-[13px] text-muted font-normal mb-1">
              <span className="w-2 h-2 rounded-full bg-brand" />
              <span>Smash Court Design System</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight">
              Quiet Court — Định hướng & Thư viện thành phần
            </h1>
          </div>

          {mounted && (
            <div className="flex items-center gap-2 bg-surface p-1.5 rounded-full border border-line">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-ink text-bg shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Sun className="w-3.5 h-3.5" /> Sáng
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-ink text-bg shadow-xs'
                    : 'text-muted hover:text-ink'
                }`}
              >
                <Moon className="w-3.5 h-3.5" /> Tối
              </button>
            </div>
          )}
        </div>

        {/* 1. Design Tokens */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-ink">1. Bảng màu Design Tokens (CSS Variables)</h2>
          <p className="text-[14px] text-muted">
            Một mức bề mặt, không viền dày hay màu sắc chói lóa. Màu trạng thái chỉ dùng đúng mục đích.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { token: '--bg', label: 'Background', hex: theme === 'dark' ? '#0B0F0D' : '#F5F4F0', border: true },
              { token: '--surface', label: 'Surface', hex: theme === 'dark' ? '#141A17' : '#FFFFFF', border: true },
              { token: '--ink', label: 'Ink (Chính)', hex: theme === 'dark' ? '#F5F4F0' : '#111613' },
              { token: '--muted', label: 'Muted (Phụ)', hex: theme === 'dark' ? '#9BA39F' : '#6A726E' },
              { token: '--line', label: 'Line (1px)', hex: theme === 'dark' ? '#222B26' : '#E4E3DD', border: true },
              { token: '--brand', label: 'Brand (Sân)', hex: theme === 'dark' ? '#16794C' : '#0F5132' },
              { token: '--accent', label: 'Accent (Chanh)', hex: '#C8F31D' },
              { token: '--sale', label: 'Sale (Giảm)', hex: theme === 'dark' ? '#FF6B4A' : '#E5532A' },
            ].map((c) => (
              <div key={c.token} className="p-3 bg-surface rounded-xl border border-line space-y-2">
                <div
                  className="w-full h-10 rounded-lg"
                  style={{ backgroundColor: c.hex, border: c.border ? '1px solid var(--line)' : 'none' }}
                />
                <div className="text-[13px] font-medium text-ink">{c.token}</div>
                <div className="text-[13px] text-muted">{c.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Typography & Vietnamese Diacritics Verification */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-ink">2. Kiểu chữ (Be Vietnam Pro — Xác minh tiếng Việt)</h2>
          <div className="p-6 bg-surface rounded-2xl border border-line space-y-4">
            <div className="space-y-1">
              <span className="text-[13px] text-muted">TIÊU ĐỀ CLAMP() & LETTER-SPACING ÂM (WEIGHT 500)</span>
              <div className="text-2xl sm:text-3xl font-medium tracking-tight text-ink">
                Vợt cầu lông Yonex Astrox 99 Pro — Ặ Ữ Ợ Ẩ Ễ Ỳ Đ đ
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-line">
              <span className="text-[13px] text-muted">NỘI DUNG 16PX (WEIGHT 400, LINE-HEIGHT 1.6)</span>
              <p className="text-[16px] text-ink leading-relaxed font-normal max-w-3xl">
                Cây vợt thiên công mạnh mẽ, đầu nặng kết hợp thân đũa siêu cứng. Mọi sản phẩm kiểm định đều có số định danh nón vợt riêng biệt, tem niêm phong và snapshot điều khoản bảo hành bất biến.
              </p>
            </div>

            <div className="space-y-1 pt-2 border-t border-line">
              <span className="text-[13px] text-muted">CHÚ THÍCH PHỤ 14PX & 13PX (TỐI THIỂU CHO PHÉP)</span>
              <div className="flex gap-4 text-[14px] text-muted">
                <span>Nhận tại cửa hàng: 10 cây</span>
                <span>•</span>
                <span>Serial: 260341SP</span>
                <span>•</span>
                <span className="text-[13px]">Bảo hành khung 12 tháng</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Buttons & Interactions */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-ink">3. Nút bấm (Button Primitives & Micro-Press 0.98)</h2>
          <div className="p-6 bg-surface rounded-2xl border border-line flex flex-wrap items-center gap-4">
            <Button variant="primary">Thêm vào giỏ</Button>
            <Button variant="secondary">Vợt cũ đã kiểm định</Button>
            <Button variant="outline">Xem chi nhánh</Button>
            <Button variant="ghost">Tra cứu bảo hành</Button>
            <Button variant="brand">Xác nhận thanh toán</Button>
            <Button variant="primary" isLoading>Đang giữ hàng</Button>
            <Button variant="primary" disabled>Hết hàng toàn hệ thống</Button>
          </div>
        </section>

        {/* 4. Badges, Chips & SpecBars */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-ink">4. Huy hiệu & Chip trạng thái (Badge)</h2>
            <div className="p-6 bg-surface rounded-2xl border border-line space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="gradeA">Hạng A · Như mới 99%</Badge>
                <Badge variant="gradeB">Hạng B · Xước nhẹ</Badge>
                <Badge variant="gradeC">Hạng C · Đã đấu kiếm</Badge>
                <Badge variant="brand">Còn hàng tại Q1</Badge>
                <Badge variant="sale">Giảm 250.000 ₫</Badge>
                <Badge variant="muted">Chiếc duy nhất</Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium text-ink">5. Giá tiền (Tabular Figures & NumberFlow)</h2>
            <div className="p-6 bg-surface rounded-2xl border border-line space-y-4">
              <div className="flex items-center gap-4">
                <PriceTag amount={demoPrice} size="lg" animated />
                <button
                  onClick={() => setDemoPrice((p) => (p === 3950000 ? 4250000 : 3950000))}
                  className="text-[13px] text-muted hover:text-ink underline cursor-pointer"
                >
                  Đổi phiên bản (Demo số chạy)
                </button>
              </div>
              <PriceTag amount={2850000} originalAmount={3400000} size="md" />
            </div>
          </div>
        </section>

        {/* 6. SpecBar & Product Card Demo */}
        <section className="space-y-4">
          <h2 className="text-lg font-medium text-ink">6. Thanh thông số (SpecBar) & Thẻ sản phẩm (ProductCard)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="p-6 bg-surface rounded-2xl border border-line space-y-5 lg:col-span-1">
              <h3 className="text-base font-medium text-ink">Thông số vợt (4px Sleek)</h3>
              <SpecBar
                label="Độ cứng thân"
                valueText="Rất cứng"
                percentage={85}
                leftLabel="Dẻo"
                rightLabel="Cứng"
              />
              <SpecBar
                label="Điểm cân bằng"
                valueText="305 mm"
                percentage={90}
                leftLabel="Nhẹ đầu"
                rightLabel="Nặng đầu"
              />
              <SpecBar
                label="Trọng lượng / Cán"
                valueText="4U · G5"
                percentage={60}
                leftLabel="5U"
                rightLabel="3U"
              />
              <SpecBar
                label="Sức căng tối đa"
                valueText="28 lbs"
                percentage={75}
                leftLabel="24 lbs"
                rightLabel="32 lbs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:col-span-2">
              <ProductCard
                id="ax99"
                slug="yonex-astrox-99-pro"
                name="Yonex Astrox 99 Pro Cherry Sunburst"
                brand="Yonex"
                playerType="Thiên công"
                priceFrom={3950000}
                imageUrl="/images/products/yonex-astrox-99-pro.png"
                badgeText="Flagship"
                specSummary="4U · Nặng đầu"
                onQuickAdd={() => alert('Thêm nhanh demo')}
              />

              <ProductCard
                id="sh-01"
                slug="sh-20261013-0001"
                name="Lining Axforce 80 Chen Long Edition"
                brand="Lining"
                playerType="Thiên công"
                priceFrom={2450000}
                imageUrl="/images/products/lining-axforce-80.png"
                isSecondHand
                grade="A"
                specSummary="Serial: 260341SP"
                onQuickAdd={() => alert('Chọn mua demo')}
              />
            </div>
          </div>
        </section>

        {/* 7. Hai Phương Án Hero Landing Page để Chủ Dự Án So Sánh */}
        <section className="space-y-6 pt-6 border-t border-line">
          <div className="space-y-1">
            <h2 className="text-xl font-medium text-ink">7. So sánh hai phương án Hero Landing Page</h2>
            <p className="text-[14px] text-muted">
              Phương án A (Nền sáng ngà) đã được chủ dự án phê duyệt làm định hướng chính. Dưới đây là trực quan hóa 2 phương án:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Phương án A */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#F5F4F0] text-[#111613] border border-[#E4E3DD] space-y-6 relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E4E3DD] text-[13px] font-normal">
                <span className="w-2 h-2 rounded-full bg-[#0F5132]" />
                <span>Phương án A (Được chọn) — Nền sáng ngà</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-medium tracking-tight text-[#111613] leading-tight">
                  Vợt chính hãng, nhận tại cửa hàng gần bạn.
                </h3>
                <p className="text-[15px] text-[#6A726E] leading-relaxed">
                  Phân phối chính hãng Yonex, Victor, Li-Ning. Sàn vợt cũ kiểm định 16 tiêu chí với tình trạng minh bạch từng chiếc.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button variant="primary">Xem vợt mới</Button>
                <Button variant="secondary">Vợt cũ đã kiểm định</Button>
              </div>
            </div>

            {/* Phương án B */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0F0D] text-[#F5F4F0] border border-[#222B26] space-y-6 relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141A17] border border-[#222B26] text-[13px] font-normal text-[#9BA39F]">
                <span className="w-2 h-2 rounded-full bg-[#C8F31D]" />
                <span>Phương án B — Nền tối xanh sâu</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl font-medium tracking-tight text-[#F5F4F0] leading-tight">
                  Vợt chính hãng, nhận tại cửa hàng gần bạn.
                </h3>
                <p className="text-[15px] text-[#9BA39F] leading-relaxed">
                  Phân phối chính hãng Yonex, Victor, Li-Ning. Sàn vợt cũ kiểm định 16 tiêu chí với tình trạng minh bạch từng chiếc.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button className="h-11 px-6 text-[14px] font-medium rounded-full bg-[#F5F4F0] text-[#0B0F0D] hover:opacity-90 transition-opacity">
                  Xem vợt mới
                </button>
                <button className="h-11 px-6 text-[14px] font-medium rounded-full border border-[#222B26] bg-[#141A17] text-[#F5F4F0] hover:bg-[#1f2622] transition-colors">
                  Vợt cũ đã kiểm định
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
