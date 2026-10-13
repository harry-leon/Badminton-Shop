package com.badminton.common.outbox;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity lưu trữ sự kiện cần phát đi trong cùng một Local Transaction (Transactional Outbox Pattern).
 */
@Entity
@Table(name = "outbox_messages", indexes = {
        @Index(name = "idx_outbox_status_created", columnList = "status, created_at")
})
public class OutboxMessage {

    @Id
    private UUID id;

    @Column(name = "aggregate_type", nullable = false, length = 100)
    private String aggregateType;

    @Column(name = "aggregate_id", nullable = false, length = 100)
    private String aggregateId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "payload", nullable = false, columnDefinition = "TEXT")
    private String payload;

    @Column(name = "status", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private OutboxStatus status;

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    public enum OutboxStatus {
        PENDING,
        PUBLISHED,
        FAILED
    }

    public OutboxMessage() {
    }

    public OutboxMessage(String aggregateType, String aggregateId, String eventType, String payload) {
        this.id = UUID.randomUUID();
        this.aggregateType = aggregateType;
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.payload = payload;
        this.status = OutboxStatus.PENDING;
        this.retryCount = 0;
        this.createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public String getAggregateType() { return aggregateType; }
    public String getAggregateId() { return aggregateId; }
    public String getEventType() { return eventType; }
    public String getPayload() { return payload; }
    public OutboxStatus getStatus() { return status; }
    public int getRetryCount() { return retryCount; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getProcessedAt() { return processedAt; }
    public String getErrorMessage() { return errorMessage; }

    public void markPublished() {
        this.status = OutboxStatus.PUBLISHED;
        this.processedAt = Instant.now();
    }

    public void markFailed(String error) {
        this.retryCount++;
        this.errorMessage = error;
        if (this.retryCount >= 5) {
            this.status = OutboxStatus.FAILED;
        }
    }
}
