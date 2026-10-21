'use client';

import * as React from 'react';
import { SafeImage } from '@/components/ui/SafeImage';
import { Container } from '@/components/ui/Container';
import Link from 'next/link';
import { useCompare } from '@/lib/compare-context';
import { PriceTag } from '@/components/ui/PriceTag';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { X, ArrowRight, Scale, ChevronRight } from 'lucide-react';
import { getProductDetailUrl } from '@/lib/productUrl';

export default function ComparePage() {
  const { items, removeFromCompare, clearCompare } = useCompare();

  return (
    <div className="py-8 sm:py-12">
      <Container className="max-w-6xl">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-muted mb-4 flex items-center gap-1.5 font-normal">
          <Link href="/" className="hover:text-ink transition-colors">Trang chủ</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <Link href="/vot-cau-long" className="hover:text-ink transition-colors">Vợt cầu lông</Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
          <span className="text-ink">So sánh thông số</span>
        </nav>

        {/* Tiêu đề trang */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 mb-8 border-b border-line">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-ink tracking-tight">
              So sánh thông số vợt
            </h1>
            <p className="text-[14px] text-muted mt-1 font-normal">
              Đối chiếu trực quan đặc tính kỹ thuật giữa tối đa 3 cây vợt để tìm ra cây vợt phù hợp nhất với lối chơi của bạn.
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearCompare}
              className="text-[13px] text-muted hover:text-ink border border-line hover:border-ink rounded-full px-4 py-1.5 transition-colors self-start sm:self-auto cursor-pointer touch-target-hit inline-flex items-center"
            >
              Xóa tất cả
            </button>
          )}
        </div>

        {/* Nội dung so sánh hoặc trạng thái rỗng */}
        {items.length === 0 ? (
          <EmptyState
            title="Chưa có cây vợt nào trong danh sách so sánh"
            description="Hãy duyệt danh mục vợt cầu lông và chọn biểu tượng so sánh trên thẻ sản phẩm để đưa vào bảng đối chiếu."
            actionLabel="Xem danh mục vợt"
            actionHref="/vot-cau-long"
          />
        ) : (
          <div className="overflow-x-auto pb-6">
            <div className="min-w-[640px]">
              {/* Hàng sản phẩm (Header) */}
              <div className="grid grid-cols-4 gap-4 pb-6 border-b border-line">
                <div className="text-[14px] text-muted font-normal flex items-end pb-2">
                  <span>Thông số đối chiếu</span>
                </div>

                {items.map((item) => (
                  <div key={item.id} className="relative bg-surface rounded-2xl p-4 border border-line flex flex-col justify-between">
                    <button
                      onClick={() => removeFromCompare(item.id)}
                      className="absolute top-2 right-2 text-muted hover:text-ink w-11 h-11 min-w-[44px] min-h-[44px] rounded-full hover:bg-bg transition-colors cursor-pointer touch-target touch-target-hit inline-flex items-center justify-center"
                      title="Bỏ so sánh"
                      aria-label={`Bỏ so sánh ${item.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div>
                      <div className="relative w-full aspect-square bg-[#EFECE6] dark:bg-[#18201C] rounded-xl overflow-hidden mb-3">
                        <SafeImage
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-contain mix-blend-multiply dark:mix-blend-normal p-3"
                        />
                      </div>
                      <div className="text-[13px] text-muted">{item.brand}</div>
                      <h3 className="text-[15px] font-medium text-ink line-clamp-2 leading-snug mt-0.5">
                        {item.name}
                      </h3>
                    </div>

                    <div className="mt-4 pt-3 border-t border-line flex flex-col gap-2">
                      <PriceTag amount={item.priceFrom} size="md" />
                      <Link
                        href={getProductDetailUrl({ slug: item.slug })}
                        className="inline-flex items-center justify-center gap-1.5 bg-ink text-bg text-[13px] font-medium min-h-[44px] py-2 px-3 rounded-full hover:opacity-90 transition-opacity touch-target"
                      >
                        <span>Xem chi tiết</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}

                {/* Ô trống nếu chưa đủ 3 cây */}
                {Array.from({ length: 3 - items.length }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="border border-dashed border-line rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-bg/50"
                  >
                    <Scale className="w-8 h-8 text-muted/40 mb-2" />
                    <p className="text-[13px] text-muted font-normal mb-3">
                      Thêm cây vợt khác để so sánh
                    </p>
                    <Link
                      href="/vot-cau-long"
                      className="text-[13px] text-ink hover:underline font-normal"
                    >
                      + Chọn từ danh mục
                    </Link>
                  </div>
                ))}
              </div>

              {/* Các hàng thông số */}
              <div className="divide-y divide-line text-[14px]">
                {/* 1. Thương hiệu */}
                <div className="grid grid-cols-4 gap-4 py-4 items-center">
                  <div className="text-muted font-normal">Thương hiệu</div>
                  {items.map((item) => (
                    <div key={item.id} className="text-ink font-medium">
                      {item.brand}
                    </div>
                  ))}
                  {Array.from({ length: 3 - items.length }).map((_, idx) => (
                    <div key={`brand-empty-${idx}`} className="text-muted/40">—</div>
                  ))}
                </div>

                {/* 2. Lối chơi sở trường */}
                <div className="grid grid-cols-4 gap-4 py-4 items-center">
                  <div className="text-muted font-normal">Lối chơi sở trường</div>
                  {items.map((item) => (
                    <div key={item.id} className="text-ink font-normal">
                      {item.playerType}
                    </div>
                  ))}
                  {Array.from({ length: 3 - items.length }).map((_, idx) => (
                    <div key={`playstyle-empty-${idx}`} className="text-muted/40">—</div>
                  ))}
                </div>

                {/* 3. Điểm cân bằng */}
                <div className="grid grid-cols-4 gap-4 py-4 items-center">
                  <div className="text-muted font-normal">Điểm cân bằng</div>
                  {items.map((item) => {
                    const bp = item.balancePoint || 305;
                    const tag = bp >= 305 ? 'Nặng đầu' : bp >= 295 ? 'Cân bằng' : 'Nhẹ đầu';
                    return (
                      <div key={item.id} className="space-y-1">
                        <div className="text-ink font-medium">{bp} mm ({tag})</div>
                        <div className="h-1 w-full bg-line rounded-full overflow-hidden">
                          <div
                            className="h-full bg-ink rounded-full"
                            style={{ width: `${Math.min(100, Math.max(20, ((bp - 280) / 35) * 100))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {Array.from({ length: 3 - items.length }).map((_, idx) => (
                    <div key={`bp-empty-${idx}`} className="text-muted/40">—</div>
                  ))}
                </div>

                {/* 4. Độ cứng đũa vợt */}
                <div className="grid grid-cols-4 gap-4 py-4 items-center">
                  <div className="text-muted font-normal">Độ cứng thân đũa</div>
                  {items.map((item) => (
                    <div key={item.id} className="text-ink font-normal">
                      {item.stiffness || 'Cứng'}
                    </div>
                  ))}
                  {Array.from({ length: 3 - items.length }).map((_, idx) => (
                    <div key={`stiff-empty-${idx}`} className="text-muted/40">—</div>
                  ))}
                </div>

                {/* 5. Trọng lượng & Chu vi cán */}
                <div className="grid grid-cols-4 gap-4 py-4 items-center">
                  <div className="text-muted font-normal">Trọng lượng / Cán</div>
                  {items.map((item) => (
                    <div key={item.id} className="text-ink font-normal">
                      {item.weight || '3U, 4U · G5'}
                    </div>
                  ))}
                  {Array.from({ length: 3 - items.length }).map((_, idx) => (
                    <div key={`weight-empty-${idx}`} className="text-muted/40">—</div>
                  ))}
                </div>

                {/* 6. Mức căng tối đa */}
                <div className="grid grid-cols-4 gap-4 py-4 items-center">
                  <div className="text-muted font-normal">Sức căng tối đa</div>
                  {items.map((item) => (
                    <div key={item.id} className="text-ink font-normal">
                      {item.maxTension || '28 – 30 lbs'}
                    </div>
                  ))}
                  {Array.from({ length: 3 - items.length }).map((_, idx) => (
                    <div key={`tension-empty-${idx}`} className="text-muted/40">—</div>
                  ))}
                </div>

                {/* 7. Bảo hành chính hãng */}
                <div className="grid grid-cols-4 gap-4 py-4 items-center">
                  <div className="text-muted font-normal">Bảo hành khung</div>
                  {items.map((item) => (
                    <div key={item.id} className="text-ink font-normal">
                      12 tháng chính hãng
                    </div>
                  ))}
                  {Array.from({ length: 3 - items.length }).map((_, idx) => (
                    <div key={`warranty-empty-${idx}`} className="text-muted/40">—</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
