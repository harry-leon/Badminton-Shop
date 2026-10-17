package com.badminton.warranty.infrastructure;

import com.badminton.warranty.domain.WarrantyClaim;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WarrantyClaimRepository extends JpaRepository<WarrantyClaim, String> {
    Page<WarrantyClaim> findByCustomerPhone(String customerPhone, Pageable pageable);
    List<WarrantyClaim> findByCustomerPhoneOrSerialNumber(String customerPhone, String serialNumber);
}
