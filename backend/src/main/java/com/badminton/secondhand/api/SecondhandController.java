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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/secondhand")
@RequiredArgsConstructor
@Tag(name = "Secondhand Racket Service", description = "Thu mua, kiểm định và mở bán vợt cũ")
public class SecondhandController {

    private final SecondhandService secondhandService;

    @GetMapping("/units")
    @PreAuthorize("hasAuthority('secondhand:view') or hasAuthority('ADMIN')")
    @Operation(summary = "Xem danh sách sản phẩm vợt cũ")
    public ResponseEntity<ApiResponse<Page<SecondhandUnit>>> getUnits(
            @RequestParam(required = false) String branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SecondhandUnit> units = secondhandService.getUnits(branchId, pageable);
        return ResponseEntity.ok(ApiResponse.success("SECONDHAND_RETRIEVED", "Lấy danh sách vợt cũ thành công", units));
    }

    @PostMapping("/units/{unitId}/approve-resale")
    @PreAuthorize("hasAuthority('secondhand:approve_resale') or hasAuthority('ADMIN')")
    @Operation(summary = "Phê duyệt mở bán niêm yết vợt cũ")
    public ResponseEntity<ApiResponse<SecondhandUnit>> approveResale(@PathVariable String unitId) {
        SecondhandUnit approved = secondhandService.approveResale(unitId);
        return ResponseEntity.ok(ApiResponse.success("RESALE_APPROVED", "Phê duyệt mở bán thành công", approved));
    }
}
