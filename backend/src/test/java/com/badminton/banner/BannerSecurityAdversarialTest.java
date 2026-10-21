package com.badminton.banner;

import com.badminton.banner.api.AdminBannerController;
import com.badminton.banner.api.PublicHomepageController;
import com.badminton.banner.application.BannerService;
import com.badminton.banner.domain.BannerPosition;
import com.badminton.banner.dto.BannerResponse;
import com.badminton.banner.dto.CreateBannerRequest;
import com.badminton.catalog.application.CatalogService;
import com.badminton.common.exception.GlobalExceptionHandler;
import com.badminton.security.RestAccessDeniedHandler;
import com.badminton.security.RestAuthenticationEntryPoint;
import com.badminton.security.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {AdminBannerController.class, PublicHomepageController.class})
@Import({
        SecurityConfig.class,
        RestAuthenticationEntryPoint.class,
        RestAccessDeniedHandler.class,
        GlobalExceptionHandler.class
})
class BannerSecurityAdversarialTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BannerService bannerService;

    @MockBean
    private CatalogService catalogService;

    private String sampleId;
    private BannerResponse sampleBannerResponse;

    @BeforeEach
    void setUp() {
        sampleId = UUID.randomUUID().toString();
        sampleBannerResponse = new BannerResponse(
                sampleId,
                "Sample Banner",
                "Description",
                "BADGE",
                "https://example.com/banner.webp",
                "https://example.com/banner.webp",
                null,
                "CTA",
                "/link",
                null,
                null,
                null,
                null,
                null,
                null,
                BannerPosition.HERO_SLIDER,
                0,
                true,
                Instant.now(),
                Instant.now().plusSeconds(86400),
                "admin",
                Instant.now(),
                Instant.now()
        );
    }

    // ==========================================
    // 1. PUBLIC ENDPOINTS ACCESS
    // ==========================================

    @Test
    @DisplayName("Public API: GET /api/v1/public/homepage KHÔNG cần đăng nhập phải trả về HTTP 200 OK")
    void getHomepage_unauthenticated_returns200Ok() throws Exception {
        when(bannerService.getActiveValidBanners("ALL")).thenReturn(List.of(sampleBannerResponse));
        when(catalogService.getAllCategories()).thenReturn(List.of());
        when(catalogService.getProducts(eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/public/homepage"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("HOMEPAGE_DATA"));
    }

    // ==========================================
    // 2. ADMIN ENDPOINTS UNAUTHENTICATED (401)
    // ==========================================

    @Test
    @DisplayName("Security: GET /api/v1/admin/banners khi chưa xác thực phải trả về HTTP 401 UNAUTHORIZED")
    void getAdminBanners_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/banners"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Security: POST /api/v1/admin/banners khi chưa xác thực phải trả về HTTP 401 UNAUTHORIZED")
    void createBanner_unauthenticated_returns401() throws Exception {
        CreateBannerRequest request = new CreateBannerRequest(
                "Title", "Desc", "BADGE", "https://example.com/img.webp",
                null, null, null, null, null, null, null, null, null,
                BannerPosition.HERO_SLIDER, 0, true, null, null
        );

        mockMvc.perform(post("/api/v1/admin/banners")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Security: PUT /api/v1/admin/banners/{id} khi chưa xác thực phải trả về HTTP 401 UNAUTHORIZED")
    void updateBanner_unauthenticated_returns401() throws Exception {
        mockMvc.perform(put("/api/v1/admin/banners/{id}", sampleId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Security: PATCH /api/v1/admin/banners/{id}/status khi chưa xác thực phải trả về HTTP 401 UNAUTHORIZED")
    void toggleBannerStatus_unauthenticated_returns401() throws Exception {
        mockMvc.perform(patch("/api/v1/admin/banners/{id}/status", sampleId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Security: DELETE /api/v1/admin/banners/{id} khi chưa xác thực phải trả về HTTP 401 UNAUTHORIZED")
    void deleteBanner_unauthenticated_returns401() throws Exception {
        mockMvc.perform(delete("/api/v1/admin/banners/{id}", sampleId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    // ==========================================
    // 3. ADMIN ENDPOINTS INSUFFICIENT ROLE (403)
    // ==========================================

    @Test
    @WithMockUser(authorities = {"CUSTOMER"})
    @DisplayName("Security: GET /api/v1/admin/banners với quyền CUSTOMER phải trả về HTTP 403 FORBIDDEN")
    void getAdminBanners_asCustomer_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/banners"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @WithMockUser(authorities = {"CUSTOMER"})
    @DisplayName("Security: POST /api/v1/admin/banners với quyền CUSTOMER phải trả về HTTP 403 FORBIDDEN")
    void createBanner_asCustomer_returns403() throws Exception {
        CreateBannerRequest request = new CreateBannerRequest(
                "Title", "Desc", "BADGE", "https://example.com/img.webp",
                null, null, null, null, null, null, null, null, null,
                BannerPosition.HERO_SLIDER, 0, true, null, null
        );

        mockMvc.perform(post("/api/v1/admin/banners")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    // ==========================================
    // 4. ADMIN ENDPOINTS AUTHORIZED ROLES (200)
    // ==========================================

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("Security: GET /api/v1/admin/banners với quyền ADMIN được chấp thuận (200 OK)")
    void getAdminBanners_asAdmin_returns200() throws Exception {
        when(bannerService.getAllBanners(null)).thenReturn(List.of(sampleBannerResponse));

        mockMvc.perform(get("/api/v1/admin/banners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = {"STAFF"})
    @DisplayName("Security: GET /api/v1/admin/banners với quyền STAFF được chấp thuận (200 OK)")
    void getAdminBanners_asStaff_returns200() throws Exception {
        when(bannerService.getAllBanners(null)).thenReturn(List.of(sampleBannerResponse));

        mockMvc.perform(get("/api/v1/admin/banners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(authorities = {"banners:manage"})
    @DisplayName("Security: GET /api/v1/admin/banners với quyền granular 'banners:manage' được chấp thuận (200 OK)")
    void getAdminBanners_asBannersManagePermission_returns200() throws Exception {
        when(bannerService.getAllBanners(null)).thenReturn(List.of(sampleBannerResponse));

        mockMvc.perform(get("/api/v1/admin/banners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }
}
