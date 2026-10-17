package com.badminton.catalog.infrastructure;

import com.badminton.catalog.domain.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySlug(String slug);
    Page<Product> findByBrandSlug(String brandSlug, Pageable pageable);
    Page<Product> findByCategorySlug(String categorySlug, Pageable pageable);
}
