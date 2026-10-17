package com.badminton.order.infrastructure;

import com.badminton.order.domain.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    Page<Order> findByBranchId(String branchId, Pageable pageable);
    Page<Order> findByCustomerId(UUID customerId, Pageable pageable);
    java.util.Optional<Order> findByIdempotencyKey(String idempotencyKey);
}
