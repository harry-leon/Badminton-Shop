package com.badminton.catalog;

import com.badminton.catalog.api.CatalogController;
import com.badminton.catalog.application.CatalogService;
import com.badminton.catalog.domain.Brand;
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
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CatalogController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(GlobalExceptionHandler.class)
class CatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CatalogService catalogService;

    @Test
    @DisplayName("GET /api/v1/catalog/products - Lấy danh sách sản phẩm thành công")
    void getProducts_returnsOk() throws Exception {
        Product p = Product.builder()
                .id(UUID.randomUUID())
                .name("Yonex Astrox 88D Pro")
                .slug("yonex-astrox-88d-pro")
                .basePrice(new BigDecimal("4250000"))
                .build();

        when(catalogService.getProducts(eq(null), eq(null), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(p)));

        mockMvc.perform(get("/api/v1/catalog/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("PRODUCTS_RETRIEVED"))
                .andExpect(jsonPath("$.data.content", hasSize(1)))
                .andExpect(jsonPath("$.data.content[0].slug").value("yonex-astrox-88d-pro"));
    }

    @Test
    @DisplayName("GET /api/v1/catalog/facets - Lấy tiêu chí lọc thành công")
    void getFacets_returnsOk() throws Exception {
        when(catalogService.getFacets()).thenReturn(Map.of(
                "brands", List.of(),
                "playStyles", List.of("Tấn công dồn dập")
        ));

        mockMvc.perform(get("/api/v1/catalog/facets"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.code").value("FACETS_RETRIEVED"))
                .andExpect(jsonPath("$.data.playStyles[0]").value("Tấn công dồn dập"));
    }
}
