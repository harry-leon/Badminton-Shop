package com.badminton.catalog;

import com.badminton.catalog.application.CatalogService;
import com.badminton.catalog.domain.Product;
import com.badminton.catalog.infrastructure.BrandRepository;
import com.badminton.catalog.infrastructure.CategoryRepository;
import com.badminton.catalog.infrastructure.ProductRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private BrandRepository brandRepository;

    @InjectMocks
    private CatalogService catalogService;

    @Test
    @DisplayName("getProducts - Khi có cả brand và category thì gọi findByBrandSlugOrIdAndCategorySlugOrId")
    void getProducts_bothBrandAndCategory() {
        Pageable pageable = PageRequest.of(0, 10);
        Product product = Product.builder().name("Yonex Power Cushion 65Z3").slug("yonex-power-cushion-65z3").build();
        when(productRepository.findByBrandSlugOrIdAndCategorySlugOrId(eq("yonex"), eq("cat_shoes"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(product)));

        Page<Product> result = catalogService.getProducts("yonex", "cat_shoes", pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Yonex Power Cushion 65Z3");
        verify(productRepository).findByBrandSlugOrIdAndCategorySlugOrId(eq("yonex"), eq("cat_shoes"), eq(pageable));
    }

    @Test
    @DisplayName("getProducts - Khi chỉ có brand thì gọi findByBrandSlugOrId")
    void getProducts_onlyBrand() {
        Pageable pageable = PageRequest.of(0, 10);
        when(productRepository.findByBrandSlugOrId(eq("yonex"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        catalogService.getProducts("yonex", null, pageable);
        verify(productRepository).findByBrandSlugOrId(eq("yonex"), eq(pageable));
    }

    @Test
    @DisplayName("getProducts - Khi chỉ có category thì gọi findByCategorySlugOrId")
    void getProducts_onlyCategory() {
        Pageable pageable = PageRequest.of(0, 10);
        when(productRepository.findByCategorySlugOrId(eq("cat_shoes"), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of()));

        catalogService.getProducts(null, "cat_shoes", pageable);
        verify(productRepository).findByCategorySlugOrId(eq("cat_shoes"), eq(pageable));
    }

    @Test
    @DisplayName("getProducts - Khi không có brand và category thì gọi findAll")
    void getProducts_neitherBrandNorCategory() {
        Pageable pageable = PageRequest.of(0, 10);
        when(productRepository.findAll(eq(pageable))).thenReturn(new PageImpl<>(List.of()));

        catalogService.getProducts(null, null, pageable);
        verify(productRepository).findAll(eq(pageable));
    }
}
