package com.badminton.inventory.infrastructure;

import com.badminton.inventory.domain.StockLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockLevelRepository extends JpaRepository<StockLevel, UUID> {
    List<StockLevel> findByBranchId(String branchId);
    Optional<StockLevel> findByBranchIdAndSku(String branchId, String sku);
    List<StockLevel> findBySku(String sku);
}
