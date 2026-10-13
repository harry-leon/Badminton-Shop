package com.badminton.common.error;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Định dạng phản hồi lỗi tuân thủ chuẩn RFC 9457 (Problem Details for HTTP APIs).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ProblemDetailResponse(
        URI type,
        String title,
        int status,
        String detail,
        String instance,
        String code,
        String traceId,
        Instant timestamp,
        List<ValidationError> validationErrors,
        Map<String, Object> extensions
) {
    public static Builder builder() {
        return new Builder();
    }

    public record ValidationError(String field, String message, Object rejectedValue) {}

    public static class Builder {
        private URI type = URI.create("about:blank");
        private String title;
        private int status;
        private String detail;
        private String instance;
        private String code;
        private String traceId;
        private Instant timestamp = Instant.now();
        private List<ValidationError> validationErrors;
        private Map<String, Object> extensions;

        public Builder type(URI type) { this.type = type; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder status(int status) { this.status = status; return this; }
        public Builder detail(String detail) { this.detail = detail; return this; }
        public Builder instance(String instance) { this.instance = instance; return this; }
        public Builder code(String code) { this.code = code; return this; }
        public Builder traceId(String traceId) { this.traceId = traceId; return this; }
        public Builder timestamp(Instant timestamp) { this.timestamp = timestamp; return this; }
        public Builder validationErrors(List<ValidationError> errors) { this.validationErrors = errors; return this; }
        public Builder extensions(Map<String, Object> extensions) { this.extensions = extensions; return this; }

        public ProblemDetailResponse build() {
            return new ProblemDetailResponse(type, title, status, detail, instance, code, traceId, timestamp, validationErrors, extensions);
        }
    }
}
