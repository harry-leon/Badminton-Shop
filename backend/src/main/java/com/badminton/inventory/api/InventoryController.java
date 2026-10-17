package com.badminton.inventory.api;

import com.badminton.common.response.ApiResponse;
import com.badminton.inventory.application.InventoryService;
import com.badminton.inventory.domain.StockLevel;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
@Tag(name = "Inventory Management", description = "Quản lý tồn kho theo chi nhánh")
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping("/stocks")
    @PreAuthorize("hasAuthority('inventory:view') or hasAuthority('ADMIN')")
    @Operation(summary = "Xem danh sách tồn kho theo chi nhánh hoặc toàn quốc")
    public ResponseEntity<ApiResponse<List<StockLevel>>> getStockLevels(@RequestParam(required = false) String branchId) {
        List<StockLevel> levels = inventoryService.getStockLevels(branchId);
        return ResponseEntity.ok(ApiResponse.success("INVENTORY_RETRIEVED", "Lấy dữ liệu tồn kho thành công", levels));
    }
}
