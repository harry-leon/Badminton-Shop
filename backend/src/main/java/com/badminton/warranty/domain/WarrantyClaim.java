package com.badminton.warranty.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "warranty_claims")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WarrantyClaim {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "order_code", nullable = false, length = 50)
    private String orderCode;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "policy_snapshot", columnDefinition = "TEXT")
    @Builder.Default
    private String policySnapshot = "Bảo hành gãy khung hoặc lỗi nhà sản xuất";

    @Column(name = "damage_description", nullable = false, columnDefinition = "TEXT")
    private String damageDescription;

    @Column(length = 50)
    @Builder.Default
    private String status = "SUBMITTED";

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
