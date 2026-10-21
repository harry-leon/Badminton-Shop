package com.badminton.banner;

import com.badminton.banner.api.AdminBannerController;
import com.badminton.banner.application.BannerService;
import com.badminton.banner.domain.BannerPosition;
import com.badminton.banner.dto.BannerResponse;
import com.badminton.banner.dto.CreateBannerRequest;
import com.badminton.banner.dto.UpdateBannerRequest;
import com.badminton.common.exception.GlobalExceptionHandler;
import com.badminton.common.exception.ResourceNotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminBannerController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class AdminBannerControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BannerService bannerService;

    private String sampleId;
    private BannerResponse sampleBannerResponse;

    @BeforeEach
    void setUp() {
        sampleId = UUID.randomUUID().toString();
        sampleBannerResponse = new BannerResponse(
                sampleId,
                "Siêu Sale Vợt Yonex 2026",
                "Mô tả khuyến mãi",
                "HOT",
                "https://example.com/banner.webp",
                "https://example.com/banner.webp",
                "https://example.com/banner-mobile.webp",
                "Mua Ngay",
                "/products/yonex-astrox",
                "Chi Tiết",
                "/sale",
                "YONEX",
                "Astrox Series",
                "3.990.000 ₫",
                "[\"Nanomesh Neo\"]",
                BannerPosition.HERO_SLIDER,
                1,
                true,
                Instant.now(),
                Instant.now().plusSeconds(86400),
                "admin",
                Instant.now(),
                Instant.now()
        );
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("GET /api/v1/admin/banners - Lấy danh sách banner thành công")
    void getBanners_all_returnsOk() throws Exception {
        when(bannerService.getAllBanners(null)).thenReturn(List.of(sampleBannerResponse));

        mockMvc.perform(get("/api/v1/admin/banners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("BANNERS_RETRIEVED"))
                .andExpect(jsonPath("$.data", hasSize(1)))
                .andExpect(jsonPath("$.data[0].id").value(sampleId.toString()))
                .andExpect(jsonPath("$.data[0].title").value("Siêu Sale Vợt Yonex 2026"));

        verify(bannerService).getAllBanners(null);
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("GET /api/v1/admin/banners?position=HERO_SLIDER - Lọc theo position")
    void getBanners_withPositionFilter_returnsOk() throws Exception {
        when(bannerService.getAllBanners("HERO_SLIDER")).thenReturn(List.of(sampleBannerResponse));

        mockMvc.perform(get("/api/v1/admin/banners").param("position", "HERO_SLIDER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].position").value(BannerPosition.HERO_SLIDER));

        verify(bannerService).getAllBanners("HERO_SLIDER");
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("GET /api/v1/admin/banners/{id} - Lấy chi tiết banner thành công")
    void getBannerById_existingId_returnsOk() throws Exception {
        when(bannerService.getBannerById(sampleId)).thenReturn(sampleBannerResponse);

        mockMvc.perform(get("/api/v1/admin/banners/{id}", sampleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(sampleId.toString()))
                .andExpect(jsonPath("$.data.title").value("Siêu Sale Vợt Yonex 2026"));

        verify(bannerService).getBannerById(sampleId);
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("GET /api/v1/admin/banners/{id} - Không tìm thấy trả về 404")
    void getBannerById_notFound_returns404() throws Exception {
        when(bannerService.getBannerById(sampleId))
                .thenThrow(new ResourceNotFoundException("Không tìm thấy banner với ID: " + sampleId));

        mockMvc.perform(get("/api/v1/admin/banners/{id}", sampleId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));

        verify(bannerService).getBannerById(sampleId);
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("POST /api/v1/admin/banners - Tạo banner hợp lệ trả về 200")
    void createBanner_validRequest_returnsOk() throws Exception {
        CreateBannerRequest request = new CreateBannerRequest(
                "New Banner Title",
                "New Banner Desc",
                "NEW",
                "https://example.com/new.webp",
                "https://example.com/new-mob.webp",
                "Shop Now",
                "/shop",
                null,
                null,
                "TAG",
                "SUB",
                "1.000.000 ₫",
                "[]",
                BannerPosition.HERO_SLIDER,
                0,
                true,
                null,
                null
        );

        when(bannerService.createBanner(any(CreateBannerRequest.class))).thenReturn(sampleBannerResponse);

        mockMvc.perform(post("/api/v1/admin/banners")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("BANNER_CREATED"))
                .andExpect(jsonPath("$.data.id").value(sampleId.toString()));

        verify(bannerService).createBanner(any(CreateBannerRequest.class));
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("POST /api/v1/admin/banners - Lỗi validation khi thiếu tiêu đề (400)")
    void createBanner_blankTitle_returns400() throws Exception {
        CreateBannerRequest invalidRequest = new CreateBannerRequest(
                "",
                "Desc",
                "BADGE",
                "https://example.com/img.jpg",
                null, null, null, null, null, null, null, null, null,
                BannerPosition.HERO_SLIDER, 0, true, null, null
        );

        mockMvc.perform(post("/api/v1/admin/banners")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        verify(bannerService, never()).createBanner(any());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("POST /api/v1/admin/banners - Lỗi validation khi thiếu ảnh (400)")
    void createBanner_blankImageUrl_returns400() throws Exception {
        CreateBannerRequest invalidRequest = new CreateBannerRequest(
                "Valid Title",
                "Desc",
                "BADGE",
                "",
                null, null, null, null, null, null, null, null, null,
                BannerPosition.HERO_SLIDER, 0, true, null, null
        );

        mockMvc.perform(post("/api/v1/admin/banners")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        verify(bannerService, never()).createBanner(any());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("PUT /api/v1/admin/banners/{id} - Cập nhật banner thành công")
    void updateBanner_validRequest_returnsOk() throws Exception {
        UpdateBannerRequest request = new UpdateBannerRequest(
                "Updated Banner Title",
                "Updated Desc",
                "UPDATE",
                "https://example.com/updated.webp",
                null, null, null, null, null, null, null, null, null,
                BannerPosition.HERO_SLIDER, 2, true, null, null
        );

        when(bannerService.updateBanner(eq(sampleId), any(UpdateBannerRequest.class)))
                .thenReturn(sampleBannerResponse);

        mockMvc.perform(put("/api/v1/admin/banners/{id}", sampleId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("BANNER_UPDATED"));

        verify(bannerService).updateBanner(eq(sampleId), any(UpdateBannerRequest.class));
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("PUT /api/v1/admin/banners/{id} - Lỗi validation khi thiếu tiêu đề (400)")
    void updateBanner_invalidRequest_returns400() throws Exception {
        UpdateBannerRequest request = new UpdateBannerRequest(
                "",
                "Updated Desc",
                "UPDATE",
                "https://example.com/updated.webp",
                null, null, null, null, null, null, null, null, null,
                BannerPosition.HERO_SLIDER, 2, true, null, null
        );

        mockMvc.perform(put("/api/v1/admin/banners/{id}", sampleId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        verify(bannerService, never()).updateBanner(any(), any());
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("PATCH /api/v1/admin/banners/{id}/status - Toggle status banner thành công")
    void toggleBannerStatus_returnsOk() throws Exception {
        when(bannerService.toggleBannerStatus(sampleId)).thenReturn(sampleBannerResponse);

        mockMvc.perform(patch("/api/v1/admin/banners/{id}/status", sampleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("BANNER_STATUS_TOGGLED"));

        verify(bannerService).toggleBannerStatus(sampleId);
    }

    @Test
    @WithMockUser(authorities = {"ADMIN"})
    @DisplayName("DELETE /api/v1/admin/banners/{id} - Xóa banner thành công")
    void deleteBanner_returnsOk() throws Exception {
        doNothing().when(bannerService).deleteBanner(sampleId);

        mockMvc.perform(delete("/api/v1/admin/banners/{id}", sampleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("BANNER_DELETED"));

        verify(bannerService).deleteBanner(sampleId);
    }
}
