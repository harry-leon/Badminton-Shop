package com.badminton.catalog.application;

import com.badminton.catalog.domain.Brand;
import com.badminton.catalog.domain.Category;
import com.badminton.catalog.domain.Product;
import com.badminton.catalog.infrastructure.BrandRepository;
import com.badminton.catalog.infrastructure.CategoryRepository;
import com.badminton.catalog.infrastructure.ProductRepository;
import com.badminton.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    @Transactional(readOnly = true)
    public Page<Product> getProducts(String brand, String category, Pageable pageable) {
        boolean hasBrand = brand != null && !brand.isBlank();
        boolean hasCategory = category != null && !category.isBlank();

        if (hasBrand && hasCategory) {
            return productRepository.findByBrandSlugOrIdAndCategorySlugOrId(brand, category, pageable);
        }
        if (hasBrand) {
            return productRepository.findByBrandSlugOrId(brand, pageable);
        }
        if (hasCategory) {
            return productRepository.findByCategorySlugOrId(category, pageable);
        }
        return productRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Product getProductBySlug(String slug) {
        return productRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm với slug: " + slug));
    }

    @Transactional(readOnly = true)
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Brand> getAllBrands() {
        return brandRepository.findAll();
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getFacets() {
        return java.util.Map.of(
                "brands", brandRepository.findAll(),
                "categories", categoryRepository.findAll(),
                "playStyles", List.of("Tấn công dồn dập", "Thiên công", "Công thủ toàn diện", "Phản tạt tốc độ", "Kiểm soát điều cầu"),
                "shaftStiffness", List.of("Dẻo", "Trung bình", "Cứng", "Siêu cứng"),
                "balanceCategories", List.of("Nặng đầu (Head Heavy)", "Cân bằng (Even Balance)", "Nhẹ đầu (Head Light)"),
                "weightClasses", List.of("3U", "4U", "5U")
        );
    }
}
