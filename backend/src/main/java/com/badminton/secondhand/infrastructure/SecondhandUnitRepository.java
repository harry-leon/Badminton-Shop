package com.badminton.secondhand.infrastructure;

import com.badminton.secondhand.domain.SecondhandUnit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SecondhandUnitRepository extends JpaRepository<SecondhandUnit, String> {
    Page<SecondhandUnit> findByBranchId(String branchId, Pageable pageable);
    Page<SecondhandUnit> findByStatus(String status, Pageable pageable);
    Page<SecondhandUnit> findByStatusAndBranchId(String status, String branchId, Pageable pageable);
}
