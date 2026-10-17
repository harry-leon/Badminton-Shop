package com.badminton.banner.dto;

import com.badminton.banner.domain.Banner;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.Instant;
import java.util.UUID;

public record BannerResponse(
        UUID id,
        String title,
        String description,
        String badge,
        String imageUrl,
        @JsonProperty("imageSrc")
        String imageSrc,
        String mobileImageUrl,
        String primaryCtaText,
        String primaryCtaLink,
        @JsonProperty("link_url")
        String linkUrl,
        String secondaryCtaText,
        String secondaryCtaLink,
        String productTag,
        String productSub,
        String productPrice,
        String features,
        String position,
        Integer sortOrder,
        Boolean isActive,
        Instant startAt,
        Instant endAt,
        String createdBy,
        Instant createdAt,
        Instant updatedAt
) {
    public BannerResponse(
            UUID id,
            String title,
            String description,
            String badge,
            String imageUrl,
            String imageSrc,
            String mobileImageUrl,
            String primaryCtaText,
            String primaryCtaLink,
            String secondaryCtaText,
            String secondaryCtaLink,
            String productTag,
            String productSub,
            String productPrice,
            String features,
            String position,
            Integer sortOrder,
            Boolean isActive,
            Instant startAt,
            Instant endAt,
            String createdBy,
            Instant createdAt,
            Instant updatedAt
    ) {
        this(
                id,
                title,
                description,
                badge,
                imageUrl,
                imageSrc,
                mobileImageUrl,
                primaryCtaText,
                primaryCtaLink,
                primaryCtaLink,
                secondaryCtaText,
                secondaryCtaLink,
                productTag,
                productSub,
                productPrice,
                features,
                position,
                sortOrder,
                isActive,
                startAt,
                endAt,
                createdBy,
                createdAt,
                updatedAt
        );
    }

    public static BannerResponse fromEntity(Banner banner) {
        if (banner == null) return null;
        String link = banner.getLinkUrl() != null && !banner.getLinkUrl().isBlank()
                ? banner.getLinkUrl()
                : banner.getPrimaryCtaLink();
        return new BannerResponse(
                banner.getId(),
                banner.getTitle(),
                banner.getDescription(),
                banner.getBadge(),
                banner.getImageUrl(),
                banner.getImageUrl(),
                banner.getMobileImageUrl(),
                banner.getPrimaryCtaText(),
                banner.getPrimaryCtaLink(),
                link,
                banner.getSecondaryCtaText(),
                banner.getSecondaryCtaLink(),
                banner.getProductTag(),
                banner.getProductSub(),
                banner.getProductPrice(),
                banner.getFeatures(),
                banner.getPosition(),
                banner.getSortOrder(),
                banner.getIsActive(),
                banner.getStartAt(),
                banner.getEndAt(),
                banner.getCreatedBy(),
                banner.getCreatedAt(),
                banner.getUpdatedAt()
        );
    }
}
