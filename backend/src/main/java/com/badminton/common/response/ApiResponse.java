package com.badminton.common.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String code,
        String message,
        T data,
        Instant timestamp,
        String path
) {
    public static <T> ApiResponse<T> success(String code, String message, T data) {
        return new ApiResponse<>(true, code, message, data, Instant.now(), null);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, "SUCCESS", message, data, Instant.now(), null);
    }

    public static ApiResponse<Void> success(String code, String message) {
        return new ApiResponse<>(true, code, message, null, Instant.now(), null);
    }

    public static <T> ApiResponse<T> failure(String code, String message, String path) {
        return new ApiResponse<>(false, code, message, null, Instant.now(), path);
    }

    public static <T> ApiResponse<T> failure(String code, String message) {
        return new ApiResponse<>(false, code, message, null, Instant.now(), null);
    }
}
