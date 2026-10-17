package com.badminton.order.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "customer_id")
    private UUID customerId;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "shipping_address", columnDefinition = "TEXT")
    private String shippingAddress;

    @Column(name = "fulfillment_type", nullable = false, length = 30)
    @Builder.Default
    private String fulfillmentType = "DELIVERY";

    @Column(name = "branch_id", nullable = false, length = 50)
    private String branchId;

    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod;

    @Column(name = "total_amount", nullable = false)
    private Long totalAmount;

    @Column(length = 50)
    @Builder.Default
    private String status = "PENDING_RESERVATION";

    @Column(name = "idempotency_key", length = 100, unique = true)
    private String idempotencyKey;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    @com.fasterxml.jackson.annotation.JsonAlias({"items", "orderLines"})
    private List<OrderLine> lines = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (updatedAt == null) updatedAt = Instant.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }

    @Transient
    public String getOrderId() {
        return id;
    }

    @Transient
    public java.util.Map<String, Object> getVietqr() {
        if (totalAmount == null || id == null) return null;
        return java.util.Map.of(
                "payload", getVietqrPayload() != null ? getVietqrPayload() : "",
                "qrUrl", getVietqrUrl() != null ? getVietqrUrl() : "",
                "bankName", "MB Bank (Quân Đội)",
                "accountNumber", "9999888877",
                "accountName", "BADMINTON SHOP",
                "amount", totalAmount,
                "transferContent", id
        );
    }

    @Transient
    public String getVietqrUrl() {
        if (totalAmount != null && id != null) {
            return "https://img.vietqr.io/image/970422-9999888877-compact2.png?amount=" + totalAmount + "&addInfo=" + id + "&accountName=BADMINTON%20SHOP";
        }
        return null;
    }

    @Transient
    public String getVietqrPayload() {
        if (totalAmount == null || id == null) return null;
        String bin = "970422";
        String account = "9999888877";
        String f38_00 = "0010A000000727";
        String f38_01_val = String.format("0006%s01%02d%s", bin, account.length(), account);
        String f38_01 = String.format("01%02d%s", f38_01_val.length(), f38_01_val);
        String f38_val = f38_00 + f38_01;
        String f38 = String.format("38%02d%s", f38_val.length(), f38_val);
        String amountStr = String.valueOf(totalAmount);
        String f54 = String.format("54%02d%s", amountStr.length(), amountStr);
        String cleanMemo = id.replaceAll("[^A-Za-z0-9]", "");
        String f62_08 = String.format("08%02d%s", cleanMemo.length(), cleanMemo);
        String f62 = String.format("62%02d%s", f62_08.length(), f62_08);
        String raw = "000201010212" + f38 + "520460115303704" + f54 + "5802VN" + f62 + "6304";
        int crc = 0xFFFF;
        for (byte b : raw.getBytes(java.nio.charset.StandardCharsets.US_ASCII)) {
            crc ^= (b & 0xFF) << 8;
            for (int i = 0; i < 8; i++) {
                if ((crc & 0x8000) != 0) {
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
                } else {
                    crc = (crc << 1) & 0xFFFF;
                }
            }
        }
        return raw + String.format("%04X", crc);
    }
}
