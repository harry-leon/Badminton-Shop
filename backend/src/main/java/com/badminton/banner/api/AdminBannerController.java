package com.badminton.banner.api;

import com.badminton.banner.application.BannerService;
import com.badminton.banner.dto.BannerResponse;
import com.badminton.banner.dto.CreateBannerRequest;
import com.badminton.banner.dto.UpdateBannerRequest;
import com.badminton.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/banners")
@RequiredArgsConstructor
@Tag(name = "Admin Banner Management", description = "Quản lý Banner và CMS Trang chủ")
@PreAuthorize("hasAuthority('ADMIN') or hasAuthority('STAFF') or hasAuthority('banners:manage')")
public class AdminBannerController {

    private final BannerService bannerService;

    @GetMapping
    @Operation(summary = "Lấy danh sách banner quản trị (có thể lọc theo position)")
    public ResponseEntity<ApiResponse<List<BannerResponse>>> getBanners(@RequestParam(required = false) String position) {
        List<BannerResponse> banners = bannerService.getAllBanners(position);
        return ResponseEntity.ok(ApiResponse.success("BANNERS_RETRIEVED", "Lấy danh sách banner thành công", banners));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một banner")
    public ResponseEntity<ApiResponse<BannerResponse>> getBannerById(@PathVariable String id) {
        BannerResponse banner = bannerService.getBannerById(id);
        return ResponseEntity.ok(ApiResponse.success("BANNER_DETAIL", "Lấy chi tiết banner thành công", banner));
    }

    @PostMapping
    @Operation(summary = "Tạo mới banner")
    public ResponseEntity<ApiResponse<BannerResponse>> createBanner(@Valid @RequestBody CreateBannerRequest request) {
        BannerResponse created = bannerService.createBanner(request);
        return ResponseEntity.ok(ApiResponse.success("BANNER_CREATED", "Tạo banner thành công", created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật banner")
    public ResponseEntity<ApiResponse<BannerResponse>> updateBanner(
            @PathVariable String id,
            @Valid @RequestBody UpdateBannerRequest request
    ) {
        BannerResponse updated = bannerService.updateBanner(id, request);
        return ResponseEntity.ok(ApiResponse.success("BANNER_UPDATED", "Cập nhật banner thành công", updated));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Bật/Tắt trạng thái hiển thị banner")
    public ResponseEntity<ApiResponse<BannerResponse>> toggleBannerStatus(@PathVariable String id) {
        BannerResponse updated = bannerService.toggleBannerStatus(id);
        return ResponseEntity.ok(ApiResponse.success("BANNER_STATUS_TOGGLED", "Cập nhật trạng thái banner thành công", updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa banner")
    public ResponseEntity<ApiResponse<Void>> deleteBanner(@PathVariable String id) {
        bannerService.deleteBanner(id);
        return ResponseEntity.ok(ApiResponse.success("BANNER_DELETED", "Xóa banner thành công"));
    }
}
