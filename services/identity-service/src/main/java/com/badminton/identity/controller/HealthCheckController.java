package com.badminton.identity.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/identity")
public class HealthCheckController {

    private static final Logger log = LoggerFactory.getLogger(HealthCheckController.class);

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        String traceId = MDC.get("traceId");
        log.info("Xử lý yêu cầu kiểm tra sức khỏe Identity Service - TraceId: {}", traceId);

        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "identity-service",
                "timestamp", Instant.now().toString(),
                "traceId", traceId != null ? traceId : "N/A"
        ));
    }
}
