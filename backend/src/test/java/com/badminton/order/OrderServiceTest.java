package com.badminton.order;

import com.badminton.common.exception.BusinessException;
import com.badminton.inventory.application.InventoryService;
import com.badminton.inventory.domain.StockLevel;
import com.badminton.inventory.infrastructure.StockLevelRepository;
import com.badminton.order.application.OrderService;
import com.badminton.order.domain.Order;
import com.badminton.order.domain.OrderLine;
import com.badminton.order.infrastructure.OrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private InventoryService inventoryService;

    @Mock
    private com.badminton.catalog.infrastructure.ProductSkuRepository productSkuRepository;

    @InjectMocks
    private OrderService orderService;

    private Order sampleOrder;

    @BeforeEach
    void setUp() {
        OrderLine line = OrderLine.builder()
                .sku("YONEX-88D-4UG5")
                .productNameSnapshot("Vợt Cầu Lông Yonex Astrox 88D Pro")
                .unitPriceSnapshot(4250000L)
                .quantity(1)
                .subtotal(4250000L)
                .build();

        sampleOrder = Order.builder()
                .customerName("Nguyễn Văn A")
                .customerPhone("0901234567")
                .shippingAddress("123 Lê Lợi, Q1, HCM")
                .branchId("BR_HCM_01")
                .paymentMethod("VIETQR")
                .idempotencyKey("idem-test-key-001")
                .lines(new ArrayList<>(List.of(line)))
                .build();
    }

    @Test
    @DisplayName("Đặt hàng thành công: Sinh mã DH-, trừ kho, sinh mã VietQR và trạng thái CONFIRMED")
    void createOrder_success() {
        when(orderRepository.findByIdempotencyKey("idem-test-key-001")).thenReturn(Optional.empty());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Order result = orderService.createOrder(sampleOrder);

        assertNotNull(result);
        assertNotNull(result.getId());
        assertTrue(result.getId().startsWith("DH-"));
        assertEquals("CONFIRMED", result.getStatus());
        assertEquals(4250000L, result.getTotalAmount());

        // Kiểm tra trừ tồn kho
        verify(inventoryService).deductStock("BR_HCM_01", "YONEX-88D-4UG5", 1);
        verify(orderRepository).save(any(Order.class));

        // Kiểm tra sinh mã VietQR
        String vietqrUrl = result.getVietqrUrl();
        assertNotNull(vietqrUrl);
        assertTrue(vietqrUrl.contains("img.vietqr.io"));
        assertTrue(vietqrUrl.contains("4250000"));

        String vietqrPayload = result.getVietqrPayload();
        assertNotNull(vietqrPayload);
        assertTrue(vietqrPayload.startsWith("000201010212"));

        assertNotNull(result.getVietqr());
        assertEquals("DH-" + result.getId().substring(3), result.getOrderId());
    }

    @Test
    @DisplayName("Đặt hàng với SKU tối giản: Tự động tra cứu ProductSkuRepository và điền snapshot giá/tên")
    void createOrder_withMinimalSku_resolvesFromRepository() {
        com.badminton.catalog.domain.Product product = com.badminton.catalog.domain.Product.builder()
                .name("Vợt Cầu Lông Yonex Astrox 88D Pro")
                .build();
        com.badminton.catalog.domain.ProductSku sku = com.badminton.catalog.domain.ProductSku.builder()
                .skuCode("YONEX-88D-4UG5")
                .weightGrip("4U-G5")
                .price(java.math.BigDecimal.valueOf(4250000))
                .product(product)
                .build();

        when(productSkuRepository.findBySkuCode("YONEX-88D-4UG5")).thenReturn(Optional.of(sku));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrderLine minimalLine = OrderLine.builder()
                .sku("YONEX-88D-4UG5")
                .quantity(2)
                .build();

        Order minimalOrder = Order.builder()
                .customerName("Trần Văn B")
                .customerPhone("0987654321")
                .branchId("BR_HCM_01")
                .paymentMethod("VIETQR")
                .lines(new ArrayList<>(List.of(minimalLine)))
                .build();

        Order created = orderService.createOrder(minimalOrder);

        assertNotNull(created);
        assertEquals(8500000L, created.getTotalAmount());
        assertEquals("Vợt Cầu Lông Yonex Astrox 88D Pro (4U-G5)", created.getLines().get(0).getProductNameSnapshot());
        assertEquals(4250000L, created.getLines().get(0).getUnitPriceSnapshot());
        assertEquals(8500000L, created.getLines().get(0).getSubtotal());
        verify(inventoryService).deductStock("BR_HCM_01", "YONEX-88D-4UG5", 2);
    }

    @Test
    @DisplayName("Idempotency: Trả về đơn hàng cũ nếu trùng idempotencyKey mà không trừ kho lần 2")
    void createOrder_idempotent() {
        Order existingOrder = Order.builder()
                .id("DH-20261017-EXIST")
                .status("CONFIRMED")
                .totalAmount(4250000L)
                .idempotencyKey("idem-test-key-001")
                .build();

        when(orderRepository.findByIdempotencyKey("idem-test-key-001")).thenReturn(Optional.of(existingOrder));

        Order result = orderService.createOrder(sampleOrder);

        assertEquals("DH-20261017-EXIST", result.getId());
        verify(inventoryService, never()).deductStock(anyString(), anyString(), anyInt());
        verify(orderRepository, never()).save(any(Order.class));
    }
}
