package com.badminton.catalog.infrastructure;

import com.badminton.catalog.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySlug(String slug);
    Page<Product> findByBrandSlug(String brandSlug, Pageable pageable);
    Page<Product> findByCategorySlug(String categorySlug, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.category.slug = :category OR p.category.id = :category")
    Page<Product> findByCategorySlugOrId(@Param("category") String category, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.brand.slug = :brand OR p.brand.id = :brand")
    Page<Product> findByBrandSlugOrId(@Param("brand") String brand, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE (p.brand.slug = :brand OR p.brand.id = :brand) AND (p.category.slug = :category OR p.category.id = :category)")
    Page<Product> findByBrandSlugOrIdAndCategorySlugOrId(@Param("brand") String brand, @Param("category") String category, Pageable pageable);
}
