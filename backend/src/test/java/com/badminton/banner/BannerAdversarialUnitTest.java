package com.badminton.banner;

import com.badminton.banner.application.BannerService;
import com.badminton.banner.domain.Banner;
import com.badminton.banner.domain.BannerPosition;
import com.badminton.banner.dto.BannerResponse;
import com.badminton.banner.dto.CreateBannerRequest;
import com.badminton.banner.dto.HomepageResponse;
import com.badminton.banner.dto.UpdateBannerRequest;
import com.badminton.banner.infrastructure.BannerRepository;
import com.badminton.catalog.domain.Category;
import com.badminton.catalog.domain.Product;
import com.badminton.common.exception.BusinessException;
import com.badminton.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Predicate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BannerAdversarialUnitTest {

    @Mock
    private BannerRepository bannerRepository;

    @InjectMocks
    private BannerService bannerService;

    private Instant now;
    private String sampleId;

    @BeforeEach
    void setUp() {
        now = Instant.now();
        sampleId = UUID.randomUUID().toString();
    }

    @Nested
    @DisplayName("Adversarial Test 1: Date Range Inversion (start_at > end_at)")
    class DateRangeInversionTests {

        @Test
        @DisplayName("createBanner: Phải ném BusinessException với VALIDATION_FAILED khi start_at > end_at (1 giây)")
        void createBanner_startAtAfterEndAt_1Second_throwsValidationFailed() {
            Instant start = now.plusSeconds(10);
            Instant end = now.plusSeconds(9);

            CreateBannerRequest request = new CreateBannerRequest(
                    "Adversarial Inverted Date Banner",
                    "Description",
                    "BADGE",
                    "https://example.com/img.webp",
                    null, null, null, null, null, null, null, null, null,
                    BannerPosition.HERO_SLIDER, 1, true, start, end
            );

            assertThatThrownBy(() -> bannerService.createBanner(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException be = (BusinessException) ex;
                        assertThat(be.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED);
                        assertThat(be.getMessage()).contains("startAt");
                    });

            verify(bannerRepository, never()).save(any());
        }

        @Test
        @DisplayName("createBanner: Phải ném BusinessException với VALIDATION_FAILED khi start_at > end_at (30 ngày)")
        void createBanner_startAtAfterEndAt_30Days_throwsValidationFailed() {
            Instant start = now.plus(30, ChronoUnit.DAYS);
            Instant end = now;

            CreateBannerRequest request = new CreateBannerRequest(
                    "Adversarial Inverted Date Banner 30d",
                    "Description",
                    "BADGE",
                    "https://example.com/img.webp",
                    null, null, null, null, null, null, null, null, null,
                    BannerPosition.HERO_SLIDER, 1, true, start, end
            );

            assertThatThrownBy(() -> bannerService.createBanner(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException be = (BusinessException) ex;
                        assertThat(be.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED);
                    });

            verify(bannerRepository, never()).save(any());
        }

        @Test
        @DisplayName("updateBanner: Phải ném BusinessException với VALIDATION_FAILED khi cập nhật start_at > end_at")
        void updateBanner_startAtAfterEndAt_throwsValidationFailed() {
            Instant start = now.plus(10, ChronoUnit.DAYS);
            Instant end = now.plus(5, ChronoUnit.DAYS);

            UpdateBannerRequest request = new UpdateBannerRequest(
                    "Updated Inverted Date",
                    "Desc",
                    "BADGE",
                    "https://example.com/img.webp",
                    null, null, null, null, null, null, null, null, null,
                    BannerPosition.HERO_SLIDER, 1, true, start, end
            );

            assertThatThrownBy(() -> bannerService.updateBanner(sampleId, request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException be = (BusinessException) ex;
                        assertThat(be.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED);
                    });

            verify(bannerRepository, never()).findById(any());
            verify(bannerRepository, never()).save(any());
        }

        @Test
        @DisplayName("Biên: start_at == end_at phải được chấp nhận (hợp lệ cho banner 1 mốc thời điểm)")
        void createBanner_startAtEqualsEndAt_accepted() {
            Instant exactMoment = now;

            CreateBannerRequest request = new CreateBannerRequest(
                    "Exact Moment Flash Sale",
                    "Flash Sale",
                    "FLASH",
                    "https://example.com/flash.webp",
                    null, null, null, null, null, null, null, null, null,
                    BannerPosition.HERO_SLIDER, 0, true, exactMoment, exactMoment
            );

            when(bannerRepository.save(any(Banner.class))).thenAnswer(inv -> {
                Banner b = inv.getArgument(0);
                b.setId(sampleId);
                return b;
            });

            BannerResponse response = bannerService.createBanner(request);
            assertThat(response).isNotNull();
            assertThat(response.startAt()).isEqualTo(exactMoment);
            assertThat(response.endAt()).isEqualTo(exactMoment);
            verify(bannerRepository).save(any(Banner.class));
        }

        @Test
        @DisplayName("Đơn biên: chỉ có start_at hoặc chỉ có end_at đều phải được chấp nhận")
        void createBanner_singleBoundDates_accepted() {
            when(bannerRepository.save(any(Banner.class))).thenAnswer(inv -> inv.getArgument(0));

            // Chỉ có start_at
            CreateBannerRequest req1 = new CreateBannerRequest(
                    "Start Only", null, null, "https://example.com/1.webp",
                    null, null, null, null, null, null, null, null, null,
                    null, 0, true, now, null
            );
            BannerResponse res1 = bannerService.createBanner(req1);
            assertThat(res1.startAt()).isEqualTo(now);
            assertThat(res1.endAt()).isNull();

            // Chỉ có end_at
            CreateBannerRequest req2 = new CreateBannerRequest(
                    "End Only", null, null, "https://example.com/2.webp",
                    null, null, null, null, null, null, null, null, null,
                    null, 0, true, null, now.plusSeconds(3600)
            );
            BannerResponse res2 = bannerService.createBanner(req2);
            assertThat(res2.startAt()).isNull();
            assertThat(res2.endAt()).isEqualTo(now.plusSeconds(3600));

            // Cả 2 đều null
            CreateBannerRequest req3 = new CreateBannerRequest(
                    "No Dates", null, null, "https://example.com/3.webp",
                    null, null, null, null, null, null, null, null, null,
                    null, 0, true, null, null
            );
            BannerResponse res3 = bannerService.createBanner(req3);
            assertThat(res3.startAt()).isNull();
            assertThat(res3.endAt()).isNull();
        }
    }

    @Nested
    @DisplayName("Adversarial Test 2: Blank / Null Title & ImageUrl Validation")
    class BlankAndNullValidationTests {

        @Test
        @DisplayName("createBanner: title = null -> ném VALIDATION_FAILED")
        void createBanner_nullTitle_throwsValidationFailed() {
            CreateBannerRequest request = new CreateBannerRequest(
                    null, "Desc", "BADGE", "https://example.com/img.webp",
                    null, null, null, null, null, null, null, null, null,
                    null, 0, true, null, null
            );

            assertThatThrownBy(() -> bannerService.createBanner(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(e -> assertThat(((BusinessException) e).getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED));
        }

        @ParameterizedTest
        @ValueSource(strings = {"", " ", "   ", "\t", "\n", " \t \n "})
        @DisplayName("createBanner: title rỗng/chỉ chứa khoảng trắng -> ném VALIDATION_FAILED")
        void createBanner_blankTitleVariants_throwsValidationFailed(String blankTitle) {
            CreateBannerRequest request = new CreateBannerRequest(
                    blankTitle, "Desc", "BADGE", "https://example.com/img.webp",
                    null, null, null, null, null, null, null, null, null,
                    null, 0, true, null, null
            );

            assertThatThrownBy(() -> bannerService.createBanner(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(e -> assertThat(((BusinessException) e).getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED));
        }

        @Test
        @DisplayName("createBanner: imageUrl = null -> ném VALIDATION_FAILED")
        void createBanner_nullImageUrl_throwsValidationFailed() {
            CreateBannerRequest request = new CreateBannerRequest(
                    "Valid Title", "Desc", "BADGE", null,
                    null, null, null, null, null, null, null, null, null,
                    null, 0, true, null, null
            );

            assertThatThrownBy(() -> bannerService.createBanner(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(e -> assertThat(((BusinessException) e).getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED));
        }

        @ParameterizedTest
        @ValueSource(strings = {"", " ", "   ", "\t", "\n", " \t \n "})
        @DisplayName("createBanner: imageUrl rỗng/chỉ chứa khoảng trắng -> ném VALIDATION_FAILED")
        void createBanner_blankImageUrlVariants_throwsValidationFailed(String blankUrl) {
            CreateBannerRequest request = new CreateBannerRequest(
                    "Valid Title", "Desc", "BADGE", blankUrl,
                    null, null, null, null, null, null, null, null, null,
                    null, 0, true, null, null
            );

            assertThatThrownBy(() -> bannerService.createBanner(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(e -> assertThat(((BusinessException) e).getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED));
        }

        @Test
        @DisplayName("createBanner: title và imageUrl được trim khoảng trắng tự động khi lưu")
        void createBanner_trimsWhitespace() {
            CreateBannerRequest request = new CreateBannerRequest(
                    "   Untrimmed Title   ", "Desc", "BADGE", "   https://example.com/untrimmed.jpg   ",
                    null, null, null, null, null, null, null, null, null,
                    null, 0, true, null, null
            );

            when(bannerRepository.save(any(Banner.class))).thenAnswer(inv -> inv.getArgument(0));

            BannerResponse res = bannerService.createBanner(request);
            assertThat(res.title()).isEqualTo("Untrimmed Title");
            assertThat(res.imageUrl()).isEqualTo("https://example.com/untrimmed.jpg");

            ArgumentCaptor<Banner> captor = ArgumentCaptor.forClass(Banner.class);
            verify(bannerRepository).save(captor.capture());
            assertThat(captor.getValue().getTitle()).isEqualTo("Untrimmed Title");
            assertThat(captor.getValue().getImageUrl()).isEqualTo("https://example.com/untrimmed.jpg");
        }
    }

    @Nested
    @DisplayName("Adversarial Test 3: Inactive Banner Filtering & Temporal Oracle")
    class InactiveAndTemporalFilteringOracleTests {

        /**
         * Giả lập chính xác mệnh đề JPQL trong BannerRepository:
         * WHERE b.isActive = true
         *   AND (:position IS NULL OR b.position = :position)
         *   AND (b.startAt IS NULL OR b.startAt <= :now)
         *   AND (b.endAt IS NULL OR b.endAt >= :now)
         */
        private Predicate<Banner> createJpqlFilterPredicate(String position, Instant queryTime) {
            return b -> {
                if (!Boolean.TRUE.equals(b.getIsActive())) return false;
                if (position != null && !position.equalsIgnoreCase(b.getPosition())) return false;
                if (b.getStartAt() != null && b.getStartAt().isAfter(queryTime)) return false;
                if (b.getEndAt() != null && b.getEndAt().isBefore(queryTime)) return false;
                return true;
            };
        }

        @Test
        @DisplayName("Stress Harness: Tạo 100 banner đa trạng thái, xác minh isActive=false, expired, future đều bị loại bỏ 100%")
        void stressTestHarness_100DiverseBanners_filtersStrictly() {
            List<Banner> population = new ArrayList<>();

            // 1. 20 Inactive banners (bất kể ngày giờ)
            for (int i = 0; i < 20; i++) {
                population.add(Banner.builder()
                        .id(UUID.randomUUID().toString())
                        .title("Inactive Banner " + i)
                        .imageUrl("https://example.com/inactive" + i + ".jpg")
                        .position(i % 2 == 0 ? BannerPosition.HERO_SLIDER : BannerPosition.MID_PAGE)
                        .isActive(false) // Vô hiệu hóa
                        .startAt(now.minus(10, ChronoUnit.DAYS))
                        .endAt(now.plus(10, ChronoUnit.DAYS))
                        .build());
            }

            // 2. 20 Expired banners (endAt trong quá khứ)
            for (int i = 0; i < 20; i++) {
                population.add(Banner.builder()
                        .id(UUID.randomUUID().toString())
                        .title("Expired Banner " + i)
                        .imageUrl("https://example.com/expired" + i + ".jpg")
                        .position(BannerPosition.HERO_SLIDER)
                        .isActive(true)
                        .startAt(now.minus(20, ChronoUnit.DAYS))
                        .endAt(now.minus(i + 1, ChronoUnit.HOURS)) // Đã hết hạn
                        .build());
            }

            // 3. 20 Future banners (startAt trong tương lai)
            for (int i = 0; i < 20; i++) {
                population.add(Banner.builder()
                        .id(UUID.randomUUID().toString())
                        .title("Future Banner " + i)
                        .imageUrl("https://example.com/future" + i + ".jpg")
                        .position(BannerPosition.HERO_SLIDER)
                        .isActive(true)
                        .startAt(now.plus(i + 1, ChronoUnit.HOURS)) // Chưa tới giờ
                        .endAt(now.plus(30, ChronoUnit.DAYS))
                        .build());
            }

            // 4. 40 Valid Active Banners
            for (int i = 0; i < 40; i++) {
                population.add(Banner.builder()
                        .id(UUID.randomUUID().toString())
                        .title("Active Valid Banner " + i)
                        .imageUrl("https://example.com/active" + i + ".jpg")
                        .position(i % 2 == 0 ? BannerPosition.HERO_SLIDER : BannerPosition.MID_PAGE)
                        .isActive(true)
                        .startAt(now.minus(5, ChronoUnit.DAYS))
                        .endAt(now.plus(5, ChronoUnit.DAYS))
                        .build());
            }

            Predicate<Banner> oracle = createJpqlFilterPredicate(null, now);
            List<Banner> activeValidFromOracle = population.stream().filter(oracle).toList();

            // Mock repository trả về kết quả khớp với oracle
            when(bannerRepository.findActiveValidBanners(isNull(), eq(now)))
                    .thenReturn(activeValidFromOracle);

            List<BannerResponse> serviceResults = bannerService.getActiveValidBanners("ALL", now);

            // Xác minh số lượng chính xác là 40 banner hợp lệ
            assertThat(serviceResults).hasSize(40);

            // Kiểm tra từng banner trong kết quả: Tuyệt đối không có banner inactive, expired hay future
            for (BannerResponse br : serviceResults) {
                assertThat(br.isActive()).isTrue();
                if (br.startAt() != null) {
                    assertThat(br.startAt()).isBeforeOrEqualTo(now);
                }
                if (br.endAt() != null) {
                    assertThat(br.endAt()).isAfterOrEqualTo(now);
                }
                assertThat(br.title()).startsWith("Active Valid Banner");
            }
        }

        @Test
        @DisplayName("Biên thời gian: Banner kết thúc tại đúng thời điểm now phải được coi là còn hạn (inclusive)")
        void temporalBoundary_endAtEqualsNow_included() {
            Banner boundaryBanner = Banner.builder()
                    .id(UUID.randomUUID().toString())
                    .title("Boundary Banner End At Now")
                    .imageUrl("https://example.com/img.jpg")
                    .position(BannerPosition.HERO_SLIDER)
                    .isActive(true)
                    .startAt(now.minusSeconds(3600))
                    .endAt(now) // Đúng thời điểm now
                    .build();

            Predicate<Banner> oracle = createJpqlFilterPredicate(null, now);
            assertThat(oracle.test(boundaryBanner)).isTrue();
        }

        @Test
        @DisplayName("Biên thời gian: Banner kết thúc 1 milli/nano giây trước now bị loại bỏ (exclusive)")
        void temporalBoundary_endAtBeforeNow_excluded() {
            Banner expiredNano = Banner.builder()
                    .id(UUID.randomUUID().toString())
                    .title("Expired Banner By 1 Millis")
                    .imageUrl("https://example.com/img.jpg")
                    .position(BannerPosition.HERO_SLIDER)
                    .isActive(true)
                    .startAt(now.minusSeconds(3600))
                    .endAt(now.minusMillis(1)) // 1ms trong quá khứ
                    .build();

            Predicate<Banner> oracle = createJpqlFilterPredicate(null, now);
            assertThat(oracle.test(expiredNano)).isFalse();
        }

        @Test
        @DisplayName("Biên thời gian: Banner bắt đầu tại đúng thời điểm now phải được coi là đã bắt đầu (inclusive)")
        void temporalBoundary_startAtEqualsNow_included() {
            Banner boundaryBanner = Banner.builder()
                    .id(UUID.randomUUID().toString())
                    .title("Boundary Banner Start At Now")
                    .imageUrl("https://example.com/img.jpg")
                    .position(BannerPosition.HERO_SLIDER)
                    .isActive(true)
                    .startAt(now) // Đúng thời điểm now
                    .endAt(now.plusSeconds(3600))
                    .build();

            Predicate<Banner> oracle = createJpqlFilterPredicate(null, now);
            assertThat(oracle.test(boundaryBanner)).isTrue();
        }

        @Test
        @DisplayName("Biên thời gian: Banner bắt đầu 1 milli giây trong tương lai bị loại bỏ (future)")
        void temporalBoundary_startAtAfterNow_excluded() {
            Banner futureNano = Banner.builder()
                    .id(UUID.randomUUID().toString())
                    .title("Future Banner By 1 Millis")
                    .imageUrl("https://example.com/img.jpg")
                    .position(BannerPosition.HERO_SLIDER)
                    .isActive(true)
                    .startAt(now.plusMillis(1)) // 1ms trong tương lai
                    .endAt(now.plusSeconds(3600))
                    .build();

            Predicate<Banner> oracle = createJpqlFilterPredicate(null, now);
            assertThat(oracle.test(futureNano)).isFalse();
        }
    }

    @Nested
    @DisplayName("Adversarial Test 4: Homepage Aggregator Response Integrity")
    class HomepageAggregatorTests {

        @Test
        @DisplayName("HomepageResponse phân tách chính xác heroBanners vs promoBanners và không bao giờ chứa null list")
        void homepageResponse_partitionIntegrity() {
            BannerResponse hero1 = new BannerResponse(
                    UUID.randomUUID().toString(), "Hero 1", "Desc", "TAG", "https://img1.jpg", "https://img1.jpg",
                    null, "CTA", "/link", null, null, null, null, null, null,
                    BannerPosition.HERO_SLIDER, 1, true, null, null, null, null, null
            );
            BannerResponse hero2 = new BannerResponse(
                    UUID.randomUUID().toString(), "Hero 2", "Desc", "TAG", "https://img2.jpg", "https://img2.jpg",
                    null, "CTA", "/link", null, null, null, null, null, null,
                    BannerPosition.HERO, 2, true, null, null, null, null, null
            );
            BannerResponse promo1 = new BannerResponse(
                    UUID.randomUUID().toString(), "Promo 1", "Desc", "TAG", "https://img3.jpg", "https://img3.jpg",
                    null, "CTA", "/link", null, null, null, null, null, null,
                    BannerPosition.MID_PAGE, 3, true, null, null, null, null, null
            );
            BannerResponse promo2 = new BannerResponse(
                    UUID.randomUUID().toString(), "Promo 2", "Desc", "TAG", "https://img4.jpg", "https://img4.jpg",
                    null, "CTA", "/link", null, null, null, null, null, null,
                    BannerPosition.HOME_PROMO_3, 4, true, null, null, null, null, null
            );

            Category cat = Category.builder().id(UUID.randomUUID().toString()).name("Vợt").slug("vot").build();
            Product prod = Product.builder().id(UUID.randomUUID()).name("Astrox 99").basePrice(new BigDecimal("4250000")).build();

            HomepageResponse response = new HomepageResponse(
                    List.of(hero1, hero2, promo1, promo2),
                    List.of(cat),
                    List.of(prod)
            );

            assertThat(response.banners()).hasSize(4);
            assertThat(response.heroBanners()).containsExactly(hero1, hero2);
            assertThat(response.promoBanners()).containsExactly(promo1, promo2);
            assertThat(response.categories()).containsExactly(cat);
            assertThat(response.products()).containsExactly(prod);
        }

        @Test
        @DisplayName("HomepageResponse với đầu vào null toàn bộ: Khởi tạo an toàn không NPE, trả về empty lists")
        void homepageResponse_nullInputs_handlesGracefully() {
            HomepageResponse response = new HomepageResponse(null, null, null);

            assertThat(response.banners()).isEmpty();
            assertThat(response.heroBanners()).isEmpty();
            assertThat(response.promoBanners()).isEmpty();
            assertThat(response.categories()).isEmpty();
            assertThat(response.products()).isEmpty();
        }
    }
}
