package com.badminton.order.application;

import com.badminton.common.exception.ResourceNotFoundException;
import com.badminton.inventory.application.InventoryService;
import com.badminton.order.domain.Order;
import com.badminton.order.domain.OrderLine;
import com.badminton.order.infrastructure.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final InventoryService inventoryService;
    private final com.badminton.catalog.infrastructure.ProductSkuRepository productSkuRepository;

    @Transactional(readOnly = true)
    public Page<Order> getOrders(String branchId, Pageable pageable) {
        if (branchId != null && !branchId.isBlank() && !branchId.equalsIgnoreCase("ALL")) {
            return orderRepository.findByBranchId(branchId, pageable);
        }
        return orderRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public Order getOrderById(String orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng: " + orderId));
    }

    @Transactional
    public Order updateOrderStatus(String orderId, String newStatus) {
        Order order = getOrderById(orderId);
        order.setStatus(newStatus);
        return orderRepository.save(order);
    }

    @Transactional
    public Order createOrder(Order order) {
        if (order.getIdempotencyKey() != null && !order.getIdempotencyKey().isBlank()) {
            var existing = orderRepository.findByIdempotencyKey(order.getIdempotencyKey());
            if (existing.isPresent()) {
                return existing.get();
            }
        }

        if (order.getId() == null || order.getId().isBlank()) {
            String datePrefix = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String randomSuffix = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
            order.setId("DH-" + datePrefix + "-" + randomSuffix);
        }

        if (order.getLines() != null) {
            for (OrderLine line : order.getLines()) {
                if (line.getSku() != null && (line.getProductNameSnapshot() == null || line.getUnitPriceSnapshot() == null)) {
                    var skuOpt = productSkuRepository.findBySkuCode(line.getSku());
                    if (skuOpt.isPresent()) {
                        var sku = skuOpt.get();
                        if (line.getProductNameSnapshot() == null || line.getProductNameSnapshot().isBlank()) {
                            String prodName = sku.getProduct() != null ? sku.getProduct().getName() : line.getSku();
                            String variant = sku.getWeightGrip() != null ? " (" + sku.getWeightGrip() + ")" : "";
                            line.setProductNameSnapshot(prodName + variant);
                        }
                        if (line.getUnitPriceSnapshot() == null) {
                            line.setUnitPriceSnapshot(sku.getPrice().longValue());
                        }
                    } else {
                        if (line.getProductNameSnapshot() == null || line.getProductNameSnapshot().isBlank()) {
                            line.setProductNameSnapshot("Sản phẩm " + line.getSku());
                        }
                        if (line.getUnitPriceSnapshot() == null) {
                            line.setUnitPriceSnapshot(0L);
                        }
                    }
                } else if (line.getProductNameSnapshot() == null || line.getProductNameSnapshot().isBlank()) {
                    line.setProductNameSnapshot(line.getSku() != null ? "Sản phẩm " + line.getSku() : "Sản phẩm");
                }

                if (line.getUnitPriceSnapshot() == null) {
                    line.setUnitPriceSnapshot(0L);
                }

                if (line.getSubtotal() == null) {
                    line.setSubtotal(line.getUnitPriceSnapshot() * line.getQuantity());
                }

                if (line.getWarrantyPolicySnapshot() == null || line.getWarrantyPolicySnapshot().isBlank()) {
                    line.setWarrantyPolicySnapshot("Bảo hành tiêu chuẩn chính hãng 30 ngày");
                }

                inventoryService.deductStock(order.getBranchId(), line.getSku(), line.getQuantity());
                line.setOrder(order);
            }
        }

        if (order.getTotalAmount() == null && order.getLines() != null) {
            long total = order.getLines().stream().mapToLong(l -> l.getSubtotal() != null ? l.getSubtotal() : 0L).sum();
            order.setTotalAmount(total);
        } else if (order.getTotalAmount() == null) {
            order.setTotalAmount(0L);
        }

        order.setStatus("CONFIRMED");
        return orderRepository.save(order);
    }
}
