package com.badminton.banner.api;

import com.badminton.banner.application.BannerService;
import com.badminton.banner.dto.BannerResponse;
import com.badminton.banner.dto.HomepageResponse;
import com.badminton.catalog.application.CatalogService;
import com.badminton.catalog.domain.Category;
import com.badminton.catalog.domain.Product;
import com.badminton.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/public")
@RequiredArgsConstructor
@Tag(name = "Public Homepage", description = "Aggregator API cho Trang chủ")
public class PublicHomepageController {

    private final BannerService bannerService;
    private final CatalogService catalogService;

    @GetMapping("/homepage")
    @Operation(summary = "Lấy toàn bộ dữ liệu trang chủ (Banners hiệu lực, Danh mục, Sản phẩm nổi bật)")
    public ResponseEntity<ApiResponse<HomepageResponse>> getHomepageData() {
        List<BannerResponse> activeBanners = bannerService.getActiveValidBanners("ALL");
        List<Category> categories = catalogService.getAllCategories();
        Page<Product> productsPage = catalogService.getProducts(
                null,
                null,
                PageRequest.of(0, 8, Sort.by(Sort.Direction.DESC, "createdAt"))
        );

        HomepageResponse response = new HomepageResponse(
                activeBanners,
                categories,
                productsPage != null ? productsPage.getContent() : List.of()
        );

        return ResponseEntity.ok(ApiResponse.success("HOMEPAGE_DATA", "Lấy dữ liệu trang chủ thành công", response));
    }
}
