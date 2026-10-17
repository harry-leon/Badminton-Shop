'use client';

import * as React from 'react';
import Image, { ImageProps } from 'next/image';

export interface SafeImageProps extends Omit<ImageProps, 'src' | 'alt' | 'onError'> {
  src?: string | null;
  alt?: string;
  fallbackSrc?: string;
  aspectRatio?: '4/5' | '1/1' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
}

const IMAGEKIT_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/htqhun';

/**
 * Chuyển đổi đường dẫn ảnh cục bộ /images/... sang URL lưu trữ trên ImageKit.io CDN
 */
export function resolveImageKitUrl(src?: string | null): string {
  if (!src) return '';
  const trimmed = src.trim();

  // Nếu là URL ImageKit banner cũ bị 404 (dạng ik.imagekit.io/htqhun/banners/banner-*.png), tự động chuyển sang ảnh cục bộ
  if (trimmed.includes('ik.imagekit.io') && trimmed.includes('/banners/')) {
    const filename = trimmed.split('/banners/')[1]?.split('?')[0];
    if (filename) {
      return `/images/banners/${filename}`;
    }
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  // Giữ nguyên file logo hoặc avatar cục bộ không chuyển hướng sang ImageKit
  if (trimmed.startsWith('/images/logo-') || trimmed.startsWith('/images/avatars/')) {
    return trimmed;
  }
  // Nếu là file banner cục bộ /images/banners/..., giữ nguyên để phục vụ từ Next.js public
  if (trimmed.startsWith('/images/banners/')) {
    return trimmed;
  }
  if (trimmed.startsWith('/images/')) {
    const base = IMAGEKIT_ENDPOINT.replace(/\/$/, '');
    return `${base}/Badminton-shop${trimmed.replace(/^\/images/, '')}`;
  }
  return trimmed;
}

// Fallback SVG tỉ lệ 4:5 (400x500px), tự tải tức thì không phụ thuộc mạng
const DEFAULT_4_5_PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
      <rect width="400" height="500" fill="#EFECE6"/>
      <g stroke="#8C827A" stroke-width="4" fill="none" opacity="0.35">
        <ellipse cx="200" cy="180" rx="90" ry="110"/>
        <line x1="200" y1="290" x2="200" y2="420"/>
        <rect x="188" y="420" width="24" height="60" rx="4" fill="#8C827A" opacity="0.2"/>
        <circle cx="200" cy="180" r="12" stroke-dasharray="2 2"/>
      </g>
    </svg>
  `.trim());

export function SafeImage({
  src,
  alt = '',
  fallbackSrc,
  className = '',
  fill,
  width,
  height,
  priority = false,
  loading,
  fetchPriority,
  unoptimized,
  ...restProps
}: SafeImageProps) {
  const effectiveFallback = fallbackSrc || DEFAULT_4_5_PLACEHOLDER;
  const initialResolved = resolveImageKitUrl(src);
  const initialSrc = initialResolved || effectiveFallback;

  const [imgSrc, setImgSrc] = React.useState<string>(initialSrc);
  const [isError, setIsError] = React.useState<boolean>(!src || src.trim() === '');

  React.useEffect(() => {
    const resolved = resolveImageKitUrl(src);
    if (resolved) {
      setImgSrc(resolved);
      setIsError(false);
    } else {
      setImgSrc(effectiveFallback);
      setIsError(true);
    }
  }, [src, effectiveFallback]);

  const handleError = () => {
    if (!isError) {
      // 1. Nếu đang tải qua ImageKit CDN và bị lỗi, thử fallback về file local tương ứng
      if (typeof imgSrc === 'string' && imgSrc.includes('ik.imagekit.io')) {
        if (imgSrc.includes('/banners/')) {
          const bannerName = imgSrc.split('/banners/')[1]?.split('?')[0];
          if (bannerName) {
            setImgSrc(`/images/banners/${bannerName}`);
            return;
          }
        }
      }
      // 2. Nếu src là /images/... mà bị đổi sang CDN, thử quay về src gốc
      if (src && src.startsWith('/images/') && imgSrc !== src) {
        setImgSrc(src);
        return;
      }
      // 3. Cuối cùng mới chuyển sang placeholder
      setIsError(true);
      setImgSrc(effectiveFallback);
    }
  };

  // Tự động bật unoptimized cho URL bên ngoài (ImageKit, VietQR), Data URI hoặc URL có query string
  const hasQuery = typeof imgSrc === 'string' && imgSrc.includes('?');
  const isExternalOrData =
    typeof imgSrc === 'string' &&
    (imgSrc.startsWith('http://') || imgSrc.startsWith('https://') || imgSrc.startsWith('data:') || hasQuery);

  const computedUnoptimized = unoptimized !== undefined ? unoptimized : isExternalOrData;

  // Khi có lỗi, ẩn alt text để tránh trình duyệt render text thô gây vỡ giao diện
  const visibleAlt = isError ? '' : alt;
  const accessibleLabel = alt || 'Hình ảnh sản phẩm';

  // Nếu không truyền fill và cũng không có width/height, fallback kích thước mặc định 400x500 (4:5)
  const defaultWidth = !fill && !width ? 400 : width;
  const defaultHeight = !fill && !height ? 500 : height;

  // Khi priority = true, thiết lập loading="eager" và fetchPriority="high"
  const effectiveLoading = priority ? 'eager' : (loading || 'lazy');
  const effectiveFetchPriority = priority ? (fetchPriority || 'high') : fetchPriority;

  return (
    <Image
      src={imgSrc}
      alt={visibleAlt}
      aria-label={accessibleLabel}
      role="img"
      className={className}
      fill={fill}
      width={fill ? undefined : defaultWidth}
      height={fill ? undefined : defaultHeight}
      priority={priority}
      loading={effectiveLoading}
      fetchPriority={effectiveFetchPriority}
      onError={handleError}
      unoptimized={computedUnoptimized}
      {...restProps}
    />
  );
}

export default SafeImage;
