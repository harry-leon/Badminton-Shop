'use client';

import * as React from 'react';
import { SafeImage } from '@/components/ui/SafeImage';
import { Badge } from '@/components/ui/Badge';
import { ZoomIn, X } from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';

export interface GalleryImage {
  id: string;
  angle: 'FRONT' | 'BACK' | 'SIDE' | 'HEAD' | 'THROAT' | 'GRIP' | 'DETAIL' | string;
  image_url: string;
  sort_order?: number;
  is_primary?: boolean;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

const ANGLE_LABELS: Record<string, string> = {
  FRONT: 'Chính diện',
  BACK: 'Mặt sau',
  SIDE: 'Cạnh vợt',
  HEAD: 'Khung vợt',
  THROAT: 'Khớp chữ T',
  GRIP: 'Cán cầm',
  DETAIL: 'Chi tiết',
};

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 50, y: 50 });

  const displayImages = React.useMemo(() => {
    if (!images || images.length === 0) {
      return [
        {
          id: 'default',
          angle: 'FRONT',
          image_url: '/images/products/yonex-astrox-99-pro.jpg',
          sort_order: 1,
          is_primary: true,
        },
      ];
    }
    return images;
  }, [images]);

  const activeImage = displayImages[activeIndex] || displayImages[0];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMousePos({ x, y });
  };

  const slides = displayImages.map((img) => ({
    src: img.image_url,
    alt: `${productName} — ${ANGLE_LABELS[img.angle] || img.angle}`,
  }));

  return (
    <div className="space-y-4">
      {/* Khung thư viện ảnh chính: Desktop thumbnail dọc bên trái + ảnh lớn bên phải */}
      <div className="flex flex-col-reverse lg:flex-row gap-3 lg:gap-4 items-start">
        {/* Dải thumbnail 7 góc */}
        {displayImages.length > 1 && (
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto max-h-[580px] no-scrollbar w-full lg:w-[76px] shrink-0 py-1">
            {displayImages.map((img, idx) => {
              const isSelected = idx === activeIndex;
              const label = ANGLE_LABELS[img.angle] || img.angle;

              return (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  aria-label={`Xem góc ${label}`}
                  className={`group relative aspect-[4/5] w-14 sm:w-16 lg:w-full shrink-0 rounded-xl overflow-hidden border transition-all cursor-pointer select-none bg-surface p-1 ${
                    isSelected
                      ? 'border-ink ring-2 ring-ink ring-offset-2 shadow-xs'
                      : 'border-line opacity-75 hover:opacity-100 hover:border-ink/50'
                  }`}
                >
                  <div className="relative w-full h-full">
                    <SafeImage
                      src={img.image_url}
                      alt={`${productName} thumbnail ${label}`}
                      fill
                      sizes="80px"
                      className="object-contain p-0.5 mix-blend-multiply dark:mix-blend-normal"
                    />
                  </div>
                  <span className="sr-only">{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Khung ảnh chính tỉ lệ 4:5 với inline lens zoom & lightbox trigger */}
        <div
          className="relative flex-1 w-full aspect-[4/5] bg-[#EFECE6] dark:bg-[#18201C] rounded-2xl overflow-hidden cursor-zoom-in group border border-line/60 flex items-center justify-center p-6 sm:p-10 select-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onMouseMove={handleMouseMove}
          onClick={() => setIsLightboxOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Nhấn để phóng to chi tiết vợt toàn màn hình"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsLightboxOpen(true);
            }
          }}
        >
          {/* Lớp hiển thị ảnh chính với hover scale(1.85) */}
          <div
            className="relative w-full h-full transition-transform duration-100 ease-out"
            style={{
              transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
              transform: isHovered ? 'scale(1.85)' : 'scale(1)',
            }}
          >
            <SafeImage
              src={activeImage.image_url}
              alt={`${productName} — ${ANGLE_LABELS[activeImage.angle] || activeImage.angle}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-contain mix-blend-multiply dark:mix-blend-normal p-4 pointer-events-none"
            />
          </div>

          {/* Badges trang nhã */}
          <div className="absolute top-4 left-4 flex flex-col gap-1.5 pointer-events-none">
            <Badge variant="muted">Chính hãng</Badge>
            <span className="text-[11px] font-medium text-ink/80 bg-surface/80 backdrop-blur-xs px-2 py-0.5 rounded-full border border-line">
              {ANGLE_LABELS[activeImage.angle] || activeImage.angle}
            </span>
          </div>

          {/* Nút chỉ dẫn phóng to góc phải */}
          <div className="absolute bottom-4 right-4 bg-surface/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-line text-[12px] text-ink font-medium flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity shadow-xs pointer-events-none">
            <ZoomIn className="w-3.5 h-3.5 text-muted" />
            <span>Phóng to</span>
          </div>
        </div>
      </div>

      {/* Modal Lightbox toàn màn hình với plugin Zoom */}
      {isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          index={activeIndex}
          slides={slides}
          plugins={[Zoom]}
          zoom={{
            maxZoomPixelRatio: 3,
            zoomInMultiplier: 1.5,
            doubleTapDelay: 300,
            doubleClickDelay: 300,
            keyboardMoveDistance: 50,
          }}
          animation={{ fade: 200, swipe: 200 }}
          carousel={{ finite: false }}
          render={{
            buttonClose: () => (
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Đóng cửa sổ phóng to"
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-black/50 hover:bg-black/75 text-white transition-colors cursor-pointer m-2"
              >
                <X className="w-5 h-5" />
              </button>
            ),
          }}
        />
      )}
    </div>
  );
}

export default ProductGallery;
