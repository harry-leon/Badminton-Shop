package com.badminton.banner.dto;

import com.badminton.banner.domain.BannerPosition;
import com.badminton.catalog.domain.Category;
import com.badminton.catalog.domain.Product;

import java.util.List;

public record HomepageResponse(
        List<BannerResponse> banners,
        List<BannerResponse> heroBanners,
        List<BannerResponse> promoBanners,
        List<Category> categories,
        List<Product> products
) {
    public HomepageResponse(List<BannerResponse> banners, List<Category> categories, List<Product> products) {
        this(
                banners != null ? banners : List.of(),
                banners != null ? banners.stream()
                        .filter(b -> BannerPosition.HERO.equalsIgnoreCase(b.position()) || BannerPosition.HERO_SLIDER.equalsIgnoreCase(b.position()))
                        .toList() : List.of(),
                banners != null ? banners.stream()
                        .filter(b -> !BannerPosition.HERO.equalsIgnoreCase(b.position()) && !BannerPosition.HERO_SLIDER.equalsIgnoreCase(b.position()))
                        .toList() : List.of(),
                categories != null ? categories : List.of(),
                products != null ? products : List.of()
        );
    }
}
