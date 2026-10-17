'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { SafeImage } from '@/components/ui/SafeImage';

export interface BannerSlide {
  id?: string;
  badge?: string;
  title: string;
  description?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  link_url?: string;
  linkUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  imageUrl?: string;
  imageSrc?: string;
  mobileImageUrl?: string;
  mobileImageSrc?: string;
  image_url?: string;
  mobile_image_url?: string;
  primary_cta_text?: string;
  primary_cta_link?: string;
  secondary_cta_text?: string;
  secondary_cta_link?: string;
  product_tag?: string;
  product_sub?: string;
  product_price?: string;
  imageAlt?: string;
  productTag?: string;
  productSub?: string;
  productPrice?: string;
  features?: string[] | string;
  sortOrder?: number;
  sort_order?: number;
  isActive?: boolean;
  is_active?: boolean;
}

export interface HeroBannerCarouselProps {
  banners?: BannerSlide[] | null;
  autoplayInterval?: number;
}

const DEFAULT_HERO_BANNERS: BannerSlide[] = [
  {
    id: 'banner-1-gosen-ryzonic',
    badge: 'Mẫu Mới — Made in Japan',
    title: 'Gosen Ryzonic 62 — Cước Cầu Lông Cao Cấp',
    description: 'Dòng cước cao cấp 0.62mm độ nảy tối đa, lực đập bộc phát, âm thanh nổ vang rền và đường cầu kiểm soát sắc nét.',
    primaryCtaText: 'Khám phá cước Gosen',
    primaryCtaLink: '/day-cuoc',
    secondaryCtaText: 'Căng cước lấy ngay',
    secondaryCtaLink: '/day-cuoc',
    imageSrc: '/images/banners/banner-1-gosen-ryzonic.png',
    imageUrl: '/images/banners/banner-1-gosen-ryzonic.png',
    mobileImageSrc: '/images/banners/banner-1-gosen-ryzonic.png',
    mobileImageUrl: '/images/banners/banner-1-gosen-ryzonic.png',
    imageAlt: 'Gosen Ryzonic 62 Cước Cầu Lông Cao Cấp',
    productTag: 'Gosen Ryzonic 62 String',
    productSub: 'Quick Repulsion & Control · 0.62mm',
    productPrice: 'Cước thi đấu BWF',
  },
  {
    id: 'banner-2-dam-me-san-cau',
    badge: 'Chơi Tốt Hơn Mỗi Ngày',
    title: 'Đam Mê Bắt Đầu Từ Sân — Vợt, Giày, Quần Áo, Phụ Kiện',
    description: 'Trang bị thi đấu cầu lông chính hãng toàn diện: Vợt Yonex, giày bám sân cao cấp, bao vợt và phụ kiện chuyên nghiệp.',
    primaryCtaText: 'Mua ngay',
    primaryCtaLink: '/vot-cau-long',
    secondaryCtaText: 'Hệ thống cửa hàng',
    secondaryCtaLink: '/chi-nhanh',
    imageSrc: '/images/banners/banner-2-dam-me-san-cau.png',
    imageUrl: '/images/banners/banner-2-dam-me-san-cau.png',
    mobileImageSrc: '/images/banners/banner-2-dam-me-san-cau.png',
    mobileImageUrl: '/images/banners/banner-2-dam-me-san-cau.png',
    imageAlt: 'Đam Mê Bắt Đầu Từ Sân - Shop Cầu Lông',
    productTag: 'Hệ sinh thái Yonex chính hãng',
    productSub: 'Cam kết chính hãng · Giao hàng toàn quốc',
    productPrice: 'Bộ sưu tập mới',
  },
  {
    id: 'banner-3-but-pha-san-cau',
    badge: 'Bộ Sưu Tập Mới 2026',
    title: 'Bứt Phá Trên Sân Cầu — Bộ Sưu Tập Thể Thao Đỉnh Cao',
    description: 'Trang phục thi đấu phối màu đỏ đen rực lửa, giày thi đấu trợ lực gót chân, balo chống sốc và vợt tấn công uy lực.',
    primaryCtaText: 'Khám phá ngay',
    primaryCtaLink: '/vot-cau-long',
    secondaryCtaText: 'Xem quần áo thi đấu',
    secondaryCtaLink: '/quan-ao',
    imageSrc: '/images/banners/banner-3-but-pha-san-cau.png',
    imageUrl: '/images/banners/banner-3-but-pha-san-cau.png',
    mobileImageSrc: '/images/banners/banner-3-but-pha-san-cau.png',
    mobileImageUrl: '/images/banners/banner-3-but-pha-san-cau.png',
    imageAlt: 'Bộ sưu tập Bứt Phá Trên Sân Cầu',
    productTag: 'Bộ sưu tập Bứt Phá Sân Cầu',
    productSub: 'Khí thế áp đảo mọi đối thủ',
    productPrice: 'Sản phẩm mới',
  },
  {
    id: 'banner-4-rise-smash-repeat',
    badge: 'Hiệu Năng Cầu Lông Đỉnh Cao',
    title: 'Rise. Smash. Repeat. — Bứt Phá Giới Hạn Của Bạn',
    description: 'Vũ khí và trang thiết bị tốc độ cao tông xanh neon điện năng, tối đa hóa lực smash và tốc độ phản xạ liên hoàn trên sân.',
    primaryCtaText: 'Khám phá bộ sưu tập',
    primaryCtaLink: '/vot-cau-long',
    secondaryCtaText: 'Thử vợt tại quầy',
    secondaryCtaLink: '/chi-nhanh',
    imageSrc: '/images/banners/banner-4-rise-smash-repeat.png',
    imageUrl: '/images/banners/banner-4-rise-smash-repeat.png',
    mobileImageSrc: '/images/banners/banner-4-rise-smash-repeat.png',
    mobileImageUrl: '/images/banners/banner-4-rise-smash-repeat.png',
    imageAlt: 'Rise Smash Repeat Badminton Performance',
    productTag: 'Rise Smash Repeat Collection',
    productSub: 'Tốc độ hủy diệt · Phản tạt chớp nhoáng',
    productPrice: 'Phiên bản thi đấu',
  },
];

export function HeroBannerCarousel({
  banners,
  autoplayInterval = 6000,
}: HeroBannerCarouselProps) {
  // Resilient fallback: fallback smoothly to default banners if null, undefined, or empty
  const effectiveBanners: BannerSlide[] =
    banners && Array.isArray(banners) && banners.length > 0
      ? banners
      : DEFAULT_HERO_BANNERS;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [isHovered, setIsHovered] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect user preference for reduced motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', handleMotionChange);
    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  // Autoplay with pause on hover & reduced-motion awareness
  useEffect(() => {
    if (!emblaApi || effectiveBanners.length <= 1) return;
    if (prefersReducedMotion || isHovered) return;

    const timer = setInterval(() => {
      emblaApi.scrollNext();
    }, autoplayInterval);

    return () => clearInterval(timer);
  }, [emblaApi, effectiveBanners.length, autoplayInterval, prefersReducedMotion, isHovered]);

  return (
    <section
      className="relative overflow-hidden border-b border-line bg-surface select-none group w-full"
      aria-label="Banner nổi bật sản phẩm và ưu đãi"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Embla Viewport */}
      <div
        className="overflow-hidden w-full relative min-h-[380px] sm:min-h-[440px] md:aspect-[3/1] md:max-h-[700px] bg-zinc-950"
        ref={emblaRef}
      >
        <div className="flex h-full w-full">
          {effectiveBanners.map((slide, index) => {
            const desktopImage =
              slide.imageUrl ||
              slide.imageSrc ||
              slide.image_url ||
              slide.mobileImageUrl ||
              slide.mobileImageSrc ||
              slide.mobile_image_url ||
              '';
            const mobileImage =
              slide.mobileImageUrl ||
              slide.mobileImageSrc ||
              slide.mobile_image_url ||
              slide.imageUrl ||
              slide.imageSrc ||
              slide.image_url ||
              '';

            const targetLink =
              slide.link_url ||
              slide.linkUrl ||
              slide.primaryCtaLink ||
              slide.primary_cta_link ||
              '/vot-cau-long';

            return (
              <div
                key={slide.id ? `${slide.id}-${index}` : `slide-${index}`}
                className="relative flex-[0_0_100%] min-w-0 w-full h-full min-h-[380px] sm:min-h-[440px] md:min-h-full"
              >
                <Link
                  href={targetLink}
                  className="block relative w-full h-full min-h-[380px] sm:min-h-[440px] md:min-h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand focus:ring-inset"
                  aria-label={slide.title || 'Xem chi tiết'}
                >
                  {/* Mobile Responsive Image (<640px) */}
                  <div className="block sm:hidden absolute inset-0 w-full h-full">
                    <SafeImage
                      src={mobileImage}
                      alt={slide.imageAlt || slide.title || 'Banner'}
                      fill
                      priority={index === 0}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      sizes="100vw"
                      className="object-cover object-center w-full h-full"
                    />
                  </div>

                  {/* Desktop Responsive Image (>=640px) */}
                  <div className="hidden sm:block absolute inset-0 w-full h-full">
                    <SafeImage
                      src={desktopImage}
                      alt={slide.imageAlt || slide.title || 'Banner'}
                      fill
                      priority={index === 0}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      sizes="100vw"
                      className="object-cover object-center w-full h-full"
                    />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default HeroBannerCarousel;
