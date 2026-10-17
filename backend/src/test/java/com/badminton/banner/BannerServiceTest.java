package com.badminton.banner;

import com.badminton.banner.application.BannerService;
import com.badminton.banner.domain.Banner;
import com.badminton.banner.domain.BannerPosition;
import com.badminton.banner.dto.BannerResponse;
import com.badminton.banner.dto.CreateBannerRequest;
import com.badminton.banner.dto.UpdateBannerRequest;
import com.badminton.banner.infrastructure.BannerRepository;
import com.badminton.common.exception.BusinessException;
import com.badminton.common.exception.ErrorCode;
import com.badminton.common.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BannerServiceTest {

    @Mock
    private BannerRepository bannerRepository;

    @InjectMocks
    private BannerService bannerService;

    private UUID sampleId;
    private Instant now;

    @BeforeEach
    void setUp() {
        sampleId = UUID.randomUUID();
        now = Instant.now();
    }

    @Test
    @DisplayName("Tạo banner hợp lệ thành công")
    void createBanner_validRequest_success() {
        Instant start = now.minus(1, ChronoUnit.DAYS);
        Instant end = now.plus(10, ChronoUnit.DAYS);

        CreateBannerRequest request = new CreateBannerRequest(
                "Yonex Astrox 99 Pro Sale",
                "Siêu phẩm vợt tấn công đỉnh cao giảm 20%",
                "GIẢM 20%",
                "https://example.com/banner-hero.webp",
                "https://example.com/banner-hero-mobile.webp",
                "Mua ngay",
                "/products/yonex-astrox-99-pro",
                "Xem chi tiết",
                "/news/astrox-sale",
                "YONEX",
                "Pro Series",
                "4.250.000 ₫",
                "[\"Namd\", \"Rotational Generator System\"]",
                BannerPosition.HERO_SLIDER,
                1,
                true,
                start,
                end
        );

        when(bannerRepository.save(any(Banner.class))).thenAnswer(invocation -> {
            Banner saved = invocation.getArgument(0);
            saved.setId(sampleId);
            saved.setCreatedAt(now);
            saved.setUpdatedAt(now);
            return saved;
        });

        BannerResponse response = bannerService.createBanner(request);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(sampleId);
        assertThat(response.title()).isEqualTo("Yonex Astrox 99 Pro Sale");
        assertThat(response.imageUrl()).isEqualTo("https://example.com/banner-hero.webp");
        assertThat(response.position()).isEqualTo(BannerPosition.HERO_SLIDER);
        assertThat(response.isActive()).isTrue();
        assertThat(response.startAt()).isEqualTo(start);
        assertThat(response.endAt()).isEqualTo(end);

        ArgumentCaptor<Banner> captor = ArgumentCaptor.forClass(Banner.class);
        verify(bannerRepository).save(captor.capture());
        Banner captured = captor.getValue();
        assertThat(captured.getTitle()).isEqualTo("Yonex Astrox 99 Pro Sale");
    }

    @Test
    @DisplayName("Tạo banner thất bại khi thiếu tiêu đề")
    void createBanner_blankTitle_throwsValidationException() {
        CreateBannerRequest request = new CreateBannerRequest(
                "   ",
                "Mô tả",
                "TAG",
                "https://example.com/banner.jpg",
                null,
                null, null, null, null, null, null, null, null,
                BannerPosition.HERO_SLIDER,
                0,
                true,
                null,
                null
        );

        assertThatThrownBy(() -> bannerService.createBanner(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Tiêu đề banner không được để trống")
                .matches(e -> ((BusinessException) e).getErrorCode() == ErrorCode.VALIDATION_FAILED);

        verify(bannerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tạo banner thất bại khi thiếu ảnh")
    void createBanner_blankImageUrl_throwsValidationException() {
        CreateBannerRequest request = new CreateBannerRequest(
                "Banner Tiêu đề",
                "Mô tả",
                "TAG",
                "",
                null,
                null, null, null, null, null, null, null, null,
                BannerPosition.HERO_SLIDER,
                0,
                true,
                null,
                null
        );

        assertThatThrownBy(() -> bannerService.createBanner(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Đường dẫn ảnh banner không được để trống")
                .matches(e -> ((BusinessException) e).getErrorCode() == ErrorCode.VALIDATION_FAILED);

        verify(bannerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Tạo banner thất bại khi startAt > endAt")
    void createBanner_invalidDateRange_throwsValidationException() {
        Instant start = now.plus(5, ChronoUnit.DAYS);
        Instant end = now.plus(1, ChronoUnit.DAYS);

        CreateBannerRequest request = new CreateBannerRequest(
                "Banner Giảm Giá",
                "Mô tả",
                "HOT",
                "https://example.com/banner.jpg",
                null,
                null, null, null, null, null, null, null, null,
                BannerPosition.HERO_SLIDER,
                0,
                true,
                start,
                end
        );

        assertThatThrownBy(() -> bannerService.createBanner(request))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("startAt")
                .matches(e -> ((BusinessException) e).getErrorCode() == ErrorCode.VALIDATION_FAILED);

        verify(bannerRepository, never()).save(any());
    }

    @Test
    @DisplayName("Lọc banner theo trạng thái is_active và khoảng thời gian hiệu lực")
    void filterBanners_byActiveAndTimeRange() {
        Banner activeBanner = Banner.builder()
                .id(UUID.randomUUID())
                .title("Active Valid Banner")
                .imageUrl("https://example.com/banner1.jpg")
                .position(BannerPosition.HERO_SLIDER)
                .sortOrder(1)
                .isActive(true)
                .startAt(now.minus(2, ChronoUnit.DAYS))
                .endAt(now.plus(5, ChronoUnit.DAYS))
                .build();

        when(bannerRepository.findActiveValidBanners(eq(BannerPosition.HERO_SLIDER), eq(now)))
                .thenReturn(List.of(activeBanner));

        List<BannerResponse> results = bannerService.getActiveValidBanners(BannerPosition.HERO_SLIDER, now);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).title()).isEqualTo("Active Valid Banner");
        assertThat(results.get(0).isActive()).isTrue();
        verify(bannerRepository).findActiveValidBanners(BannerPosition.HERO_SLIDER, now);
    }

    @Test
    @DisplayName("Lấy active banners với position ALL truyền null cho repository")
    void filterBanners_allPositions_passesNullToRepo() {
        when(bannerRepository.findActiveValidBanners(isNull(), eq(now)))
                .thenReturn(List.of());

        List<BannerResponse> results = bannerService.getActiveValidBanners("ALL", now);

        assertThat(results).isEmpty();
        verify(bannerRepository).findActiveValidBanners(isNull(), eq(now));
    }

    @Test
    @DisplayName("Cập nhật banner thành công")
    void updateBanner_validRequest_success() {
        Banner existing = Banner.builder()
                .id(sampleId)
                .title("Old Title")
                .imageUrl("https://example.com/old.jpg")
                .position(BannerPosition.HERO_SLIDER)
                .sortOrder(0)
                .isActive(true)
                .build();

        when(bannerRepository.findById(sampleId)).thenReturn(Optional.of(existing));
        when(bannerRepository.save(any(Banner.class))).thenAnswer(i -> i.getArgument(0));

        UpdateBannerRequest request = new UpdateBannerRequest(
                "Updated Title",
                "Updated Desc",
                "NEW BADGE",
                "https://example.com/new.jpg",
                "https://example.com/new-mobile.jpg",
                "Click Here",
                "/new-link",
                null,
                null,
                "TAG",
                "SUB",
                "1.000.000 ₫",
                "[]",
                BannerPosition.MID_PAGE,
                5,
                false,
                now,
                now.plus(1, ChronoUnit.DAYS)
        );

        BannerResponse updated = bannerService.updateBanner(sampleId, request);

        assertThat(updated.title()).isEqualTo("Updated Title");
        assertThat(updated.position()).isEqualTo(BannerPosition.MID_PAGE);
        assertThat(updated.sortOrder()).isEqualTo(5);
        assertThat(updated.isActive()).isFalse();
        verify(bannerRepository).save(existing);
    }

    @Test
    @DisplayName("Cập nhật banner không tồn tại ném lỗi ResourceNotFoundException")
    void updateBanner_notFound_throwsException() {
        when(bannerRepository.findById(sampleId)).thenReturn(Optional.empty());

        UpdateBannerRequest request = new UpdateBannerRequest(
                "Title", null, null, "https://example.com/img.jpg",
                null, null, null, null, null, null, null, null, null,
                null, null, null, null, null
        );

        assertThatThrownBy(() -> bannerService.updateBanner(sampleId, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Bật/tắt trạng thái banner (toggle status)")
    void toggleBannerStatus_flipsIsActive() {
        Banner banner = Banner.builder()
                .id(sampleId)
                .title("Banner 1")
                .imageUrl("https://example.com/1.jpg")
                .isActive(true)
                .build();

        when(bannerRepository.findById(sampleId)).thenReturn(Optional.of(banner));
        when(bannerRepository.save(any(Banner.class))).thenAnswer(i -> i.getArgument(0));

        BannerResponse toggled1 = bannerService.toggleBannerStatus(sampleId);
        assertThat(toggled1.isActive()).isFalse();

        BannerResponse toggled2 = bannerService.toggleBannerStatus(sampleId);
        assertThat(toggled2.isActive()).isTrue();

        verify(bannerRepository, times(2)).save(banner);
    }

    @Test
    @DisplayName("Xóa banner thành công khi tồn tại")
    void deleteBanner_existingId_success() {
        when(bannerRepository.existsById(sampleId)).thenReturn(true);

        bannerService.deleteBanner(sampleId);

        verify(bannerRepository).deleteById(sampleId);
    }

    @Test
    @DisplayName("Xóa banner thất bại khi không tồn tại")
    void deleteBanner_notFound_throwsException() {
        when(bannerRepository.existsById(sampleId)).thenReturn(false);

        assertThatThrownBy(() -> bannerService.deleteBanner(sampleId))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(bannerRepository, never()).deleteById(any());
    }
}
