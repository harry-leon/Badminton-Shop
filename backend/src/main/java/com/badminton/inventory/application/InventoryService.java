package com.badminton.inventory.application;

import com.badminton.common.exception.BusinessException;
import com.badminton.common.exception.ErrorCode;
import com.badminton.inventory.domain.StockLevel;
import com.badminton.inventory.infrastructure.StockLevelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryService {

    private final StockLevelRepository stockLevelRepository;

    @Transactional(readOnly = true)
    public List<StockLevel> getStockLevels(String branchId) {
        if (branchId != null && !branchId.isBlank() && !branchId.equalsIgnoreCase("ALL")) {
            return stockLevelRepository.findByBranchId(branchId);
        }
        return stockLevelRepository.findAll();
    }

    @Transactional
    public void reserveStock(String branchId, String sku, int quantity) {
        StockLevel stock = stockLevelRepository.findByBranchIdAndSku(branchId, sku)
                .orElseThrow(() -> new BusinessException(ErrorCode.BUSINESS_ERROR, "Không tìm thấy thông tin tồn kho cho SKU: " + sku));

        int available = stock.getOnHand() - stock.getReserved();
        if (available < quantity) {
            throw new BusinessException(ErrorCode.BUSINESS_ERROR, "Không đủ số lượng tồn khả dụng cho SKU: " + sku + " (Còn: " + available + ")");
        }

        stock.setReserved(stock.getReserved() + quantity);
        stockLevelRepository.save(stock);
    }

    @Transactional
    public void deductStock(String branchId, String sku, int quantity) {
        StockLevel stock = stockLevelRepository.findByBranchIdAndSku(branchId, sku)
                .orElseThrow(() -> new BusinessException(ErrorCode.BUSINESS_ERROR, "Không tìm thấy thông tin tồn kho cho SKU: " + sku));

        int available = stock.getOnHand() - stock.getReserved();
        if (available < quantity) {
            throw new BusinessException(ErrorCode.BUSINESS_ERROR, "Không đủ số lượng tồn khả dụng cho SKU: " + sku + " (Còn: " + available + ")");
        }

        stock.setOnHand(stock.getOnHand() - quantity);
        stockLevelRepository.save(stock);
    }
}
