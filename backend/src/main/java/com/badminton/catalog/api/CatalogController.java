package com.badminton.catalog.api;

import com.badminton.catalog.application.CatalogService;
import com.badminton.catalog.domain.Brand;
import com.badminton.catalog.domain.Category;
import com.badminton.catalog.domain.Product;
import com.badminton.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Catalog & Products", description = "Xem và tìm kiếm sản phẩm, danh mục, thương hiệu")
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping({"/products", "/catalog/products"})
    @Operation(summary = "Lấy danh sách sản phẩm có phân trang, lọc theo thương hiệu hoặc danh mục")
    public ResponseEntity<ApiResponse<Page<Product>>> getProducts(
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        String[] sortParams = sort.split(",");
        Sort.Direction direction = sortParams.length > 1 && sortParams[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParams[0]));

        Page<Product> products = catalogService.getProducts(brand, category, pageable);
        return ResponseEntity.ok(ApiResponse.success("PRODUCTS_RETRIEVED", "Lấy danh sách sản phẩm thành công", products));
    }

    @GetMapping({"/products/{slug}", "/catalog/products/{slug}"})
    @Operation(summary = "Xem chi tiết một sản phẩm theo slug (chuẩn SEO)")
    public ResponseEntity<ApiResponse<Product>> getProductBySlug(@PathVariable String slug) {
        Product product = catalogService.getProductBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success("PRODUCT_DETAIL", "Lấy chi tiết sản phẩm thành công", product));
    }

    @GetMapping({"/categories", "/catalog/categories"})
    @Operation(summary = "Lấy toàn bộ danh mục sản phẩm")
    public ResponseEntity<ApiResponse<List<Category>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success("CATEGORIES_RETRIEVED", "Lấy danh mục thành công", catalogService.getAllCategories()));
    }

    @GetMapping({"/brands", "/catalog/brands"})
    @Operation(summary = "Lấy toàn bộ thương hiệu sản phẩm")
    public ResponseEntity<ApiResponse<List<Brand>>> getBrands() {
        return ResponseEntity.ok(ApiResponse.success("BRANDS_RETRIEVED", "Lấy thương hiệu thành công", catalogService.getAllBrands()));
    }

    @GetMapping({"/facets", "/catalog/facets"})
    @Operation(summary = "Lấy các tiêu chí lọc danh mục sản phẩm (thương hiệu, loại lối chơi, độ cứng đũa, điểm cân bằng)")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> getFacets() {
        return ResponseEntity.ok(ApiResponse.success("FACETS_RETRIEVED", "Lấy tiêu chí lọc thành công", catalogService.getFacets()));
    }
}
