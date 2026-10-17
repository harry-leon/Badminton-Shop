package com.badminton.order.api;

import com.badminton.common.response.ApiResponse;
import com.badminton.order.application.OrderService;
import com.badminton.order.domain.Order;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Order Management", description = "Quản lý đơn hàng quầy & online")
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    @PreAuthorize("hasAuthority('orders:view') or hasAuthority('ADMIN')")
    @Operation(summary = "Xem danh sách đơn hàng có phân trang theo chi nhánh")
    public ResponseEntity<ApiResponse<Page<Order>>> getOrders(
            @RequestParam(required = false) String branchId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Order> orders = orderService.getOrders(branchId, pageable);
        return ResponseEntity.ok(ApiResponse.success("ORDERS_RETRIEVED", "Lấy danh sách đơn hàng thành công", orders));
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAuthority('orders:view') or hasAuthority('ADMIN')")
    @Operation(summary = "Xem chi tiết một đơn hàng")
    public ResponseEntity<ApiResponse<Order>> getOrderById(@PathVariable String orderId) {
        Order order = orderService.getOrderById(orderId);
        return ResponseEntity.ok(ApiResponse.success("ORDER_DETAIL", "Lấy thông tin đơn hàng thành công", order));
    }

    @PatchMapping("/{orderId}/status")
    @PreAuthorize("hasAuthority('orders:process') or hasAuthority('ADMIN')")
    @Operation(summary = "Cập nhật trạng thái tiến độ đơn hàng")
    public ResponseEntity<ApiResponse<Order>> updateOrderStatus(
            @PathVariable String orderId,
            @RequestBody Map<String, String> body
    ) {
        String status = body.get("status");
        Order order = orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok(ApiResponse.success("ORDER_STATUS_UPDATED", "Cập nhật trạng thái đơn hàng thành công", order));
    }

    @PostMapping
    @Operation(summary = "Tạo đơn hàng mới (Dành cho khách hàng hoặc nhân viên tại quầy)")
    public ResponseEntity<ApiResponse<Order>> createOrder(@RequestBody Order order) {
        Order created = orderService.createOrder(order);
        return ResponseEntity.ok(ApiResponse.success("ORDER_CREATED", "Tạo đơn hàng thành công", created));
    }
}
