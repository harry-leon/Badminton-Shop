package com.badminton.inventory.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "stock_levels")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockLevel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "branch_id", nullable = false, length = 50)
    private String branchId;

    @Column(nullable = false, length = 100)
    private String sku;

    @Column(name = "item_type", length = 20)
    @Builder.Default
    private String itemType = "STANDARD";

    @Column(name = "on_hand", nullable = false)
    @Builder.Default
    private int onHand = 0;

    @Column(nullable = false)
    @Builder.Default
    private int reserved = 0;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        updatedAt = Instant.now();
    }
}
