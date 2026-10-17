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

        {/* Khung ảnh chính — nhấn để mở lightbox, có thumbnail navigation */}
        <div
          className="relative flex-1 w-full aspect-[4/5] bg-[#EFECE6] dark:bg-[#1C2620] rounded-2xl overflow-hidden cursor-pointer group border border-line/60 flex items-center justify-center p-6 sm:p-10 select-none"
          onClick={() => setIsLightboxOpen(true)}
          role="button"
          tabIndex={0}
          aria-label="Nhấn để xem ảnh phóng to toàn màn hình"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsLightboxOpen(true);
            }
          }}
        >
          {/* Ảnh chính — hover scale nhẹ, không zoom lens */}
          <div className="relative w-full h-full transition-transform duration-300 ease-out group-hover:scale-[1.04]">
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
            <span className="text-[13px] font-medium text-ink/80 bg-surface/80 backdrop-blur-xs px-2 py-0.5 rounded-full border border-line">
              {ANGLE_LABELS[activeImage.angle] || activeImage.angle}
            </span>
          </div>

          {/* Hướng dẫn: nhấn để phóng to */}
          <div className="absolute bottom-4 right-4 bg-surface/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-line text-[13px] text-ink font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-xs pointer-events-none">
            <ZoomIn className="w-3.5 h-3.5 text-muted" />
            <span>Xem ảnh lớn</span>
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
