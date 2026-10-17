package com.badminton.banner;

import com.badminton.banner.api.PublicHomepageController;
import com.badminton.banner.application.BannerService;
import com.badminton.banner.domain.BannerPosition;
import com.badminton.banner.dto.BannerResponse;
import com.badminton.catalog.application.CatalogService;
import com.badminton.catalog.domain.Category;
import com.badminton.catalog.domain.Product;
import com.badminton.common.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PublicHomepageController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class PublicHomepageControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private BannerService bannerService;

    @MockBean
    private CatalogService catalogService;

    @Test
    @DisplayName("GET /api/v1/public/homepage - Trả về HTTP 200 và HomepageResponse DTO đầy đủ")
    void getHomepageData_returnsOkWithHomepageResponse() throws Exception {
        UUID heroId = UUID.randomUUID();
        BannerResponse heroBanner = new BannerResponse(
                heroId,
                "Hero Astrox 99 Pro",
                "Mô tả vợt tấn công",
                "HOT DEAL",
                "https://example.com/hero.webp",
                "https://example.com/hero.webp",
                "https://example.com/hero-mob.webp",
                "Mua ngay",
                "/products/astrox-99-pro",
                null,
                null,
                "YONEX",
                "Chính hãng",
                "4.250.000 ₫",
                "[]",
                BannerPosition.HERO_SLIDER,
                1,
                true,
                Instant.now(),
                Instant.now().plusSeconds(86400),
                "admin",
                Instant.now(),
                Instant.now()
        );

        UUID promoId = UUID.randomUUID();
        BannerResponse promoBanner = new BannerResponse(
                promoId,
                "Khuyến mãi phụ kiện",
                "Giảm 15% quấn cán",
                "PROMO",
                "https://example.com/promo.webp",
                "https://example.com/promo.webp",
                null,
                "Xem ngay",
                "/phu-kien",
                null,
                null,
                null,
                null,
                null,
                null,
                BannerPosition.MID_PAGE,
                2,
                true,
                Instant.now(),
                Instant.now().plusSeconds(86400),
                "admin",
                Instant.now(),
                Instant.now()
        );

        Category category = Category.builder()
                .id(UUID.randomUUID())
                .name("Vợt Cầu Lông")
                .slug("vot-cau-long")
                .description("Các dòng vợt chính hãng")
                .build();

        Product product = Product.builder()
                .id(UUID.randomUUID())
                .name("Vợt Yonex Astrox 99 Pro Gen 3")
                .slug("yonex-astrox-99-pro-gen-3")
                .basePrice(new BigDecimal("4250000"))
                .status("ACTIVE")
                .build();

        when(bannerService.getActiveValidBanners("ALL")).thenReturn(List.of(heroBanner, promoBanner));
        when(catalogService.getAllCategories()).thenReturn(List.of(category));
        when(catalogService.getProducts(eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(product)));

        mockMvc.perform(get("/api/v1/public/homepage"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("HOMEPAGE_DATA"))
                .andExpect(jsonPath("$.data.banners", hasSize(2)))
                .andExpect(jsonPath("$.data.heroBanners", hasSize(1)))
                .andExpect(jsonPath("$.data.heroBanners[0].id").value(heroId.toString()))
                .andExpect(jsonPath("$.data.heroBanners[0].title").value("Hero Astrox 99 Pro"))
                .andExpect(jsonPath("$.data.promoBanners", hasSize(1)))
                .andExpect(jsonPath("$.data.promoBanners[0].id").value(promoId.toString()))
                .andExpect(jsonPath("$.data.categories", hasSize(1)))
                .andExpect(jsonPath("$.data.categories[0].name").value("Vợt Cầu Lông"))
                .andExpect(jsonPath("$.data.products", hasSize(1)))
                .andExpect(jsonPath("$.data.products[0].name").value("Vợt Yonex Astrox 99 Pro Gen 3"));

        verify(bannerService).getActiveValidBanners("ALL");
        verify(catalogService).getAllCategories();
        verify(catalogService).getProducts(eq(null), eq(null), any(Pageable.class));
    }
}
