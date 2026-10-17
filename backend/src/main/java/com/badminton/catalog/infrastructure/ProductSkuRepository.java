package com.badminton.catalog.infrastructure;

import com.badminton.catalog.domain.ProductSku;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductSkuRepository extends JpaRepository<ProductSku, UUID> {
    Optional<ProductSku> findBySkuCode(String skuCode);
}
