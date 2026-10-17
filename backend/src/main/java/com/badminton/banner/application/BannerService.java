package com.badminton.banner.application;

import com.badminton.banner.domain.Banner;
import com.badminton.banner.domain.BannerPosition;
import com.badminton.banner.dto.BannerResponse;
import com.badminton.banner.dto.CreateBannerRequest;
import com.badminton.banner.dto.UpdateBannerRequest;
import com.badminton.banner.infrastructure.BannerRepository;
import com.badminton.common.exception.BusinessException;
import com.badminton.common.exception.ErrorCode;
import com.badminton.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BannerService {

    private final BannerRepository bannerRepository;

    @Transactional(readOnly = true)
    public List<BannerResponse> getAllBanners(String position) {
        List<Banner> banners = (position == null || position.isBlank() || "ALL".equalsIgnoreCase(position))
                ? bannerRepository.findAllByOrderBySortOrderAscCreatedAtDesc()
                : bannerRepository.findByPositionOrderBySortOrderAscCreatedAtDesc(position);
        return banners.stream().map(BannerResponse::fromEntity).toList();
    }

    @Transactional(readOnly = true)
    public List<BannerResponse> getActiveValidBanners(String position) {
        return getActiveValidBanners(position, Instant.now());
    }

    @Transactional(readOnly = true)
    public List<BannerResponse> getActiveValidBanners(String position, Instant now) {
        Instant queryTime = (now != null) ? now : Instant.now();
        String pos = (position == null || position.isBlank() || "ALL".equalsIgnoreCase(position)) ? null : position;
        return bannerRepository.findActiveValidBanners(pos, queryTime)
                .stream()
                .map(BannerResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public BannerResponse getBannerById(UUID id) {
        return bannerRepository.findById(id)
                .map(BannerResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner với ID: " + id));
    }

    @Transactional
    public BannerResponse createBanner(CreateBannerRequest request) {
        validateBannerInput(request.title(), request.imageUrl(), request.startAt(), request.endAt());

        String link = request.linkUrl() != null && !request.linkUrl().isBlank()
                ? request.linkUrl().trim()
                : (request.primaryCtaLink() != null ? request.primaryCtaLink().trim() : null);

        Banner banner = Banner.builder()
                .title(request.title().trim())
                .description(request.description())
                .badge(request.badge())
                .imageUrl(request.imageUrl().trim())
                .mobileImageUrl(request.mobileImageUrl())
                .linkUrl(link)
                .primaryCtaLink(link)
                .primaryCtaText(request.primaryCtaText())
                .secondaryCtaText(request.secondaryCtaText())
                .secondaryCtaLink(request.secondaryCtaLink())
                .productTag(request.productTag())
                .productSub(request.productSub())
                .productPrice(request.productPrice())
                .features(request.features())
                .position(request.position() != null && !request.position().isBlank() ? request.position() : BannerPosition.HERO_SLIDER)
                .sortOrder(request.sortOrder() != null ? request.sortOrder() : 0)
                .isActive(request.isActive() != null ? request.isActive() : true)
                .startAt(request.startAt())
                .endAt(request.endAt())
                .build();

        return BannerResponse.fromEntity(bannerRepository.save(banner));
    }

    @Transactional
    public BannerResponse updateBanner(UUID id, UpdateBannerRequest request) {
        validateBannerInput(request.title(), request.imageUrl(), request.startAt(), request.endAt());

        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner với ID: " + id));

        String link = request.linkUrl() != null && !request.linkUrl().isBlank()
                ? request.linkUrl().trim()
                : (request.primaryCtaLink() != null ? request.primaryCtaLink().trim() : null);

        banner.setTitle(request.title().trim());
        banner.setDescription(request.description());
        banner.setBadge(request.badge());
        banner.setImageUrl(request.imageUrl().trim());
        banner.setMobileImageUrl(request.mobileImageUrl());
        banner.setLinkUrl(link);
        banner.setPrimaryCtaLink(link);
        banner.setPrimaryCtaText(request.primaryCtaText());
        banner.setSecondaryCtaText(request.secondaryCtaText());
        banner.setSecondaryCtaLink(request.secondaryCtaLink());
        banner.setProductTag(request.productTag());
        banner.setProductSub(request.productSub());
        banner.setProductPrice(request.productPrice());
        banner.setFeatures(request.features());

        if (request.position() != null && !request.position().isBlank()) {
            banner.setPosition(request.position());
        }
        if (request.sortOrder() != null) {
            banner.setSortOrder(request.sortOrder());
        }
        if (request.isActive() != null) {
            banner.setIsActive(request.isActive());
        }
        banner.setStartAt(request.startAt());
        banner.setEndAt(request.endAt());

        return BannerResponse.fromEntity(bannerRepository.save(banner));
    }

    @Transactional
    public BannerResponse toggleBannerStatus(UUID id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy banner với ID: " + id));
        banner.setIsActive(!Boolean.TRUE.equals(banner.getIsActive()));
        return BannerResponse.fromEntity(bannerRepository.save(banner));
    }

    @Transactional
    public void deleteBanner(UUID id) {
        if (!bannerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy banner với ID: " + id);
        }
        bannerRepository.deleteById(id);
    }

    private void validateBannerInput(String title, String imageUrl, Instant startAt, Instant endAt) {
        if (title == null || title.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Tiêu đề banner không được để trống");
        }
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Đường dẫn ảnh banner không được để trống");
        }
        if (startAt != null && endAt != null && startAt.isAfter(endAt)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Thời gian bắt đầu (startAt) không được sau thời gian kết thúc (endAt)");
        }
    }
}
