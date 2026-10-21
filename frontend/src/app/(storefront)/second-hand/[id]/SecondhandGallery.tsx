'use client';

import React, { useState } from 'react';
import { SafeImage } from '@/components/ui/SafeImage';
import { Badge } from '@/components/ui/Badge';
import { ZoomIn, X, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface GalleryPhoto {
  url: string;
  label: string;
  callout?: string;
}

interface SecondhandGalleryProps {
  modelName: string;
  grade: string;
  photos: GalleryPhoto[];
}

export default function SecondhandGallery({
  modelName,
  grade,
  photos,
}: SecondhandGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);

  const activePhoto = photos[activeIndex] || photos[0];

  return (
    <div className="space-y-4">
      {/* Khung ảnh chính */}
      <div className="relative w-full aspect-square bg-[#EFECE6] dark:bg-[#18201C] rounded-3xl overflow-hidden border border-line flex items-center justify-center p-6 group">
        <div className="relative w-full h-full">
          <SafeImage
            src={activePhoto.url}
            alt={`${modelName} - ${activePhoto.label}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain mix-blend-multiply dark:mix-blend-normal p-4 transition-transform duration-300 group-hover:scale-105"
            priority
          />
        </div>

        {/* Huy hiệu góc ảnh */}
        <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
          <Badge variant={grade === 'A' ? 'gradeA' : grade === 'B' ? 'gradeB' : 'gradeC'}>
            Hạng {grade}
          </Badge>
          <span className="text-[13px] bg-surface/90 backdrop-blur-xs px-3 py-1 rounded-full border border-line text-ink font-medium">
            {activePhoto.label}
          </span>
        </div>

        {/* Nút phóng to Lightbox */}
        <button
          type="button"
          onClick={() => setZoomPhoto(activePhoto.url)}
          className="absolute bottom-4 right-4 bg-surface/90 hover:bg-surface border border-line min-h-[44px] px-3.5 py-2 rounded-full text-ink shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 text-[13px] font-medium touch-target"
          aria-label="Phóng to ảnh kiểm định"
        >
          <ZoomIn className="w-4 h-4 text-brand" />
          <span>Phóng to</span>
        </button>

        {/* Callout vết xước/ghi chú kiểm định thực tế nếu có */}
        {activePhoto.callout && (
          <div className="absolute bottom-4 left-4 max-w-[85%] bg-surface/95 backdrop-blur-xs border border-amber-200 dark:border-amber-900/50 p-3 rounded-2xl shadow-sm space-y-1">
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Ghi nhận kiểm định vi mô:</span>
            </div>
            <p className="text-[13px] text-muted font-normal leading-relaxed">
              {activePhoto.callout}
            </p>
          </div>
        )}
      </div>

      {/* Danh sách ảnh góc chụp thu nhỏ (Thumbnails) */}
      <div className="flex overflow-x-auto no-scrollbar sm:grid sm:grid-cols-5 gap-2 sm:gap-3 pb-1 sm:pb-0">
        {photos.map((photo, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`relative min-w-[68px] sm:min-w-0 aspect-square rounded-2xl overflow-hidden border p-1.5 sm:p-2 transition-all cursor-pointer bg-[#EFECE6] dark:bg-[#18201C] flex flex-col items-center justify-center shrink-0 sm:shrink touch-target ${
                isSelected
                  ? 'border-brand ring-2 ring-brand/20'
                  : 'border-line hover:border-ink/40 opacity-75 hover:opacity-100'
              }`}
            >
              <div className="relative w-full h-full">
                <SafeImage
                  src={photo.url}
                  alt={photo.label}
                  fill
                  sizes="120px"
                  className="object-contain mix-blend-multiply dark:mix-blend-normal p-1"
                />
              </div>
              <div className="absolute bottom-1 inset-x-1 text-center">
                <span className="text-[11px] sm:text-[13px] font-medium text-ink bg-surface/90 px-1 py-0.5 rounded truncate block shadow-2xs">
                  {photo.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Modal phóng to ảnh (Lightbox) */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setZoomPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full aspect-square bg-surface rounded-3xl p-4 overflow-hidden border border-line"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomPhoto(null)}
              className="absolute top-4 right-4 z-10 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-bg/90 hover:bg-bg border border-line flex items-center justify-center text-ink cursor-pointer touch-target"
              aria-label="Đóng ảnh phóng to"
            >
              <X className="w-5 h-5" />
            </button>
            <SafeImage
              src={zoomPhoto}
              alt="Ảnh kiểm định phóng to"
              fill
              className="object-contain p-6"
            />
          </div>
        </div>
      )}
    </div>
  );
}
