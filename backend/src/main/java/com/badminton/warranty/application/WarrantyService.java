package com.badminton.warranty.application;

import com.badminton.common.exception.ResourceNotFoundException;
import com.badminton.warranty.domain.WarrantyClaim;
import com.badminton.warranty.infrastructure.WarrantyClaimRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WarrantyService {

    private final WarrantyClaimRepository warrantyClaimRepository;

    @Transactional(readOnly = true)
    public Page<WarrantyClaim> getClaims(Pageable pageable) {
        return warrantyClaimRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public List<WarrantyClaim> lookupWarranty(String phone, String serial) {
        return warrantyClaimRepository.findByCustomerPhoneOrSerialNumber(phone, serial);
    }

    @Transactional
    public WarrantyClaim createClaim(WarrantyClaim claim) {
        if (claim.getId() == null || claim.getId().isBlank()) {
            String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String suffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            claim.setId("CLM-" + datePrefix + "-" + suffix);
        }
        claim.setStatus("SUBMITTED");
        return warrantyClaimRepository.save(claim);
    }

    @Transactional
    public WarrantyClaim updateClaimStatus(String claimId, String status) {
        WarrantyClaim claim = warrantyClaimRepository.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ bảo hành: " + claimId));
        claim.setStatus(status);
        return warrantyClaimRepository.save(claim);
    }
}
