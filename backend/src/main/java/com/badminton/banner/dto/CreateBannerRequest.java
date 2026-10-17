package com.badminton.banner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateBannerRequest(
        @NotBlank(message = "Tiêu đề banner không được để trống")
        @Size(max = 255, message = "Tiêu đề không được vượt quá 255 ký tự")
        String title,

        String description,
        String badge,

        @NotBlank(message = "Đường dẫn ảnh banner không được để trống")
        String imageUrl,

        String mobileImageUrl,

        @Size(max = 100, message = "Nút bấm chính không được vượt quá 100 ký tự")
        String primaryCtaText,

        @Size(max = 255, message = "Liên kết nút bấm chính không được vượt quá 255 ký tự")
        String primaryCtaLink,

        String linkUrl,

        @Size(max = 100, message = "Nút bấm phụ không được vượt quá 100 ký tự")
        String secondaryCtaText,

        @Size(max = 255, message = "Liên kết nút bấm phụ không được vượt quá 255 ký tự")
        String secondaryCtaLink,

        String productTag,
        String productSub,
        String productPrice,
        String features,

        String position,
        Integer sortOrder,
        Boolean isActive,
        Instant startAt,
        Instant endAt
) {
    public CreateBannerRequest(
            String title,
            String description,
            String badge,
            String imageUrl,
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
            Instant endAt
    ) {
        this(
                title,
                description,
                badge,
                imageUrl,
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
                endAt
        );
    }
}
