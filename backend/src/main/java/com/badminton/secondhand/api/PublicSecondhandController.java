package com.badminton.secondhand.api;

import com.badminton.common.response.ApiResponse;
import com.badminton.secondhand.application.SecondhandService;
import com.badminton.secondhand.domain.SecondhandUnit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;

@RestController
@RequestMapping("/api/v1/public/secondhand")
@RequiredArgsConstructor
@Tag(name = "Public Secondhand", description = "Xem danh sách vợt cũ đã kiểm định công khai")
public class PublicSecondhandController {

    private final SecondhandService secondhandService;

    @GetMapping("/units")
    @Operation(summary = "Lấy danh sách vợt cũ đã kiểm định mở bán công khai")
    public ResponseEntity<ApiResponse<Page<SecondhandUnit>>> getPublicUnits(
            @RequestParam(required = false) String branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<SecondhandUnit> units = secondhandService.getApprovedUnits(branchId, pageable);
        Page<SecondhandUnit> maskedUnits = units.map(this::maskUnitSerial);
        return ResponseEntity.ok(ApiResponse.success("SECONDHAND_UNITS_RETRIEVED", "Lấy danh sách vợt cũ thành công", maskedUnits));
    }

    private SecondhandUnit maskUnitSerial(SecondhandUnit unit) {
        return SecondhandUnit.builder()
                .id(unit.getId())
                .buybackCaseId(unit.getBuybackCaseId())
                .serialNumber(maskSerialNumber(unit.getSerialNumber()))
                .modelName(unit.getModelName())
                .grade(unit.getGrade())
                .branchId(unit.getBranchId())
                .resalePrice(unit.getResalePrice())
                .warrantyDays(unit.getWarrantyDays())
                .conditionNotes(unit.getConditionNotes())
                .imagesJson(unit.getImagesJson())
                .status(unit.getStatus())
                .createdAt(unit.getCreatedAt())
                .build();
    }

    private String maskSerialNumber(String serial) {
        if (serial == null || serial.isBlank()) {
            return "Khớp hồ sơ";
        }
        String trimmed = serial.trim();
        if (trimmed.contains("***")) {
            return trimmed;
        }
        String[] parts = trimmed.split("-");
        if (parts.length >= 4) {
            String prefix = String.join("-", Arrays.copyOfRange(parts, 0, parts.length - 2));
            String suffix = parts[parts.length - 1];
            return prefix + "-***-" + suffix;
        }
        if (parts.length == 3) {
            return parts[0] + "-***-" + parts[2];
        }
        if (parts.length == 2) {
            return parts[0] + "-***";
        }
        if (trimmed.length() >= 7) {
            return trimmed.substring(0, 3) + "-***-" + trimmed.substring(trimmed.length() - 2);
        }
        if (trimmed.length() >= 4) {
            return trimmed.substring(0, 2) + "-***-" + trimmed.substring(trimmed.length() - 1);
        }
        return "***";
    }
}
