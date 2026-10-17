package com.badminton.banner.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "banners")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Banner {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String badge;

    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "mobile_image_url", columnDefinition = "TEXT")
    private String mobileImageUrl;

    @Column(name = "primary_cta_text", length = 100)
    private String primaryCtaText;

    @Column(name = "primary_cta_link")
    private String primaryCtaLink;

    @Column(name = "link_url")
    private String linkUrl;

    @Column(name = "secondary_cta_text", length = 100)
    private String secondaryCtaText;

    @Column(name = "secondary_cta_link")
    private String secondaryCtaLink;

    @Column(name = "product_tag")
    private String productTag;

    @Column(name = "product_sub")
    private String productSub;

    @Column(name = "product_price", length = 100)
    private String productPrice;

    @Column(name = "features", columnDefinition = "TEXT")
    private String features;

    @Column(length = 50)
    @Builder.Default
    private String position = BannerPosition.HERO_SLIDER;

    @Column(name = "sort_order")
    @Builder.Default
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "start_at")
    private Instant startAt;

    @Column(name = "end_at")
    private Instant endAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
        if (isActive == null) isActive = true;
        if (sortOrder == null) sortOrder = 0;
        if (position == null) position = BannerPosition.HERO_SLIDER;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
