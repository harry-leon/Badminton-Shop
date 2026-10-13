package com.badminton.common.inbox;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * Entity lưu lịch sử các Message đã tiêu thụ để đảm bảo Idempotent Consumer (chống xử lý trùng lặp).
 */
@Entity
@Table(name = "processed_messages")
public class ProcessedMessage {

    @Id
    @Column(name = "message_id", length = 100)
    private String messageId;

    @Column(name = "consumer_name", nullable = false, length = 100)
    private String consumerName;

    @Column(name = "processed_at", nullable = false)
    private Instant processedAt;

    public ProcessedMessage() {
    }

    public ProcessedMessage(String messageId, String consumerName) {
        this.messageId = messageId;
        this.consumerName = consumerName;
        this.processedAt = Instant.now();
    }

    public String getMessageId() { return messageId; }
    public String getConsumerName() { return consumerName; }
    public Instant getProcessedAt() { return processedAt; }
}
