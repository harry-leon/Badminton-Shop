package com.badminton.inventory;

import com.badminton.common.exception.BusinessException;
import com.badminton.inventory.application.InventoryService;
import com.badminton.inventory.domain.StockLevel;
import com.badminton.inventory.infrastructure.StockLevelRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private StockLevelRepository stockLevelRepository;

    @InjectMocks
    private InventoryService inventoryService;

    @Test
    @DisplayName("Deduct stock: Giảm on_hand thành công khi đủ tồn kho")
    void deductStock_success() {
        StockLevel stock = StockLevel.builder()
                .branchId("BR_HCM_01")
                .sku("YONEX-88D-4UG5")
                .onHand(15)
                .reserved(0)
                .build();

        when(stockLevelRepository.findByBranchIdAndSku("BR_HCM_01", "YONEX-88D-4UG5"))
                .thenReturn(Optional.of(stock));

        inventoryService.deductStock("BR_HCM_01", "YONEX-88D-4UG5", 1);

        assertEquals(14, stock.getOnHand());
        verify(stockLevelRepository).save(stock);
    }

    @Test
    @DisplayName("Deduct stock: Ném lỗi BusinessException khi tồn kho khả dụng không đủ")
    void deductStock_insufficient() {
        StockLevel stock = StockLevel.builder()
                .branchId("BR_HCM_01")
                .sku("YONEX-88D-4UG5")
                .onHand(2)
                .reserved(2)
                .build();

        when(stockLevelRepository.findByBranchIdAndSku("BR_HCM_01", "YONEX-88D-4UG5"))
                .thenReturn(Optional.of(stock));

        assertThrows(BusinessException.class, () ->
                inventoryService.deductStock("BR_HCM_01", "YONEX-88D-4UG5", 1)
        );
        verify(stockLevelRepository, never()).save(stock);
    }
}
