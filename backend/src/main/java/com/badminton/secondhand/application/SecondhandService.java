package com.badminton.secondhand.application;

import com.badminton.common.exception.ResourceNotFoundException;
import com.badminton.secondhand.domain.SecondhandUnit;
import com.badminton.secondhand.infrastructure.SecondhandUnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SecondhandService {

    private final SecondhandUnitRepository secondhandUnitRepository;

    @Transactional(readOnly = true)
    public Page<SecondhandUnit> getUnits(String branchId, Pageable pageable) {
        if (branchId != null && !branchId.isBlank() && !branchId.equalsIgnoreCase("ALL")) {
            return secondhandUnitRepository.findByBranchId(branchId, pageable);
        }
        return secondhandUnitRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Page<SecondhandUnit> getApprovedUnits(String branchId, Pageable pageable) {
        if (branchId != null && !branchId.isBlank() && !branchId.equalsIgnoreCase("ALL")) {
            return secondhandUnitRepository.findByStatusAndBranchId("APPROVED_FOR_SALE", branchId, pageable);
        }
        return secondhandUnitRepository.findByStatus("APPROVED_FOR_SALE", pageable);
    }

    @Transactional
    public SecondhandUnit approveResale(String unitId) {
        SecondhandUnit unit = secondhandUnitRepository.findById(unitId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sản phẩm vợt cũ: " + unitId));
        unit.setStatus("APPROVED_FOR_SALE");
        return secondhandUnitRepository.save(unit);
    }
}
