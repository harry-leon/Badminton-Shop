package com.badminton.warranty.api;

import com.badminton.common.response.ApiResponse;
import com.badminton.warranty.application.WarrantyService;
import com.badminton.warranty.domain.WarrantyClaim;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/warranty")
@RequiredArgsConstructor
@Tag(name = "Warranty Service", description = "Tra cứu và xử lý hồ sơ bảo hành điện tử")
public class WarrantyController {

    private final WarrantyService warrantyService;

    @GetMapping("/lookup")
    @Operation(summary = "Tra cứu thông tin bảo hành công khai qua SĐT hoặc Số Serial")
    public ResponseEntity<ApiResponse<List<WarrantyClaim>>> lookupWarranty(
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String serial
    ) {
        List<WarrantyClaim> claims = warrantyService.lookupWarranty(phone, serial);
        return ResponseEntity.ok(ApiResponse.success("WARRANTY_FOUND", "Tra cứu thông tin bảo hành thành công", claims));
    }

    @GetMapping("/claims")
    @PreAuthorize("hasAuthority('warranty:view') or hasAuthority('ADMIN')")
    @Operation(summary = "Xem danh sách hồ sơ bảo hành")
    public ResponseEntity<ApiResponse<Page<WarrantyClaim>>> getClaims(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<WarrantyClaim> claims = warrantyService.getClaims(pageable);
        return ResponseEntity.ok(ApiResponse.success("CLAIMS_RETRIEVED", "Lấy danh sách hồ sơ bảo hành thành công", claims));
    }

    @PatchMapping("/claims/{claimId}/status")
    @PreAuthorize("hasAuthority('warranty:decide') or hasAuthority('ADMIN')")
    @Operation(summary = "Cập nhật trạng thái xử lý bảo hành")
    public ResponseEntity<ApiResponse<WarrantyClaim>> updateStatus(
            @PathVariable String claimId,
            @RequestBody Map<String, String> body
    ) {
        String status = body.get("status");
        WarrantyClaim updated = warrantyService.updateClaimStatus(claimId, status);
        return ResponseEntity.ok(ApiResponse.success("CLAIM_UPDATED", "Cập nhật trạng thái bảo hành thành công", updated));
    }
}
