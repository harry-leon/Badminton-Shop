package com.badminton.order.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "order_lines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;

    @Column(nullable = false, length = 100)
    private String sku;

    @Column(name = "product_name_snapshot", nullable = false)
    private String productNameSnapshot;

    @Column(name = "unit_price_snapshot", nullable = false)
    private Long unitPriceSnapshot;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private Long subtotal;

    @Column(name = "warranty_policy_snapshot", columnDefinition = "TEXT")
    @Builder.Default
    private String warrantyPolicySnapshot = "Bảo hành tiêu chuẩn 30 ngày";
}
