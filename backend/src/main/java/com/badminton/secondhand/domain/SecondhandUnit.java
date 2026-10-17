package com.badminton.secondhand.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "secondhand_units")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecondhandUnit {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "buyback_case_id", nullable = false, length = 50)
    private String buybackCaseId;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(nullable = false, length = 10)
    private String grade;

    @Column(name = "branch_id", nullable = false, length = 50)
    private String branchId;

    @Column(name = "resale_price", nullable = false)
    private Long resalePrice;

    @Column(name = "warranty_days")
    @Builder.Default
    private int warrantyDays = 30;

    @Column(name = "condition_notes", columnDefinition = "TEXT")
    private String conditionNotes;

    @Column(length = 50)
    @Builder.Default
    private String status = "PURCHASED";

    @Column(name = "created_at")
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
