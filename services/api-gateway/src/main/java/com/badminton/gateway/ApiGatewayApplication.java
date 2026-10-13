package com.badminton.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.util.StringUtils;

import java.util.UUID;

@SpringBootApplication
public class ApiGatewayApplication {

    public static final String CORRELATION_ID_HEADER = "X-Correlation-Id";

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    public GlobalFilter correlationIdGlobalFilter() {
        return (exchange, chain) -> {
            String correlationId = exchange.getRequest().getHeaders().getFirst(CORRELATION_ID_HEADER);
            if (!StringUtils.hasText(correlationId)) {
                correlationId = UUID.randomUUID().toString();
            }

            final String finalCorrelationId = correlationId;
            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .header(CORRELATION_ID_HEADER, finalCorrelationId)
                    .build();

            exchange.getResponse().getHeaders().set(CORRELATION_ID_HEADER, finalCorrelationId);

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        };
    }
}
