package com.badminton.common.exception;

import com.badminton.common.response.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex, HttpServletRequest request) {
        log.warn("Resource not found: {} at path {}", ex.getMessage(), request.getRequestURI());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.failure(ex.getErrorCode().getCode(), ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(BusinessException ex, HttpServletRequest request) {
        log.warn("Business exception: {} at path {}", ex.getMessage(), request.getRequestURI());
        return ResponseEntity.status(ex.getErrorCode().getStatus())
                .body(ApiResponse.failure(ex.getErrorCode().getCode(), ex.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String detailMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        if (detailMessage.isBlank()) {
            detailMessage = "Dữ liệu đầu vào không hợp lệ";
        }
        log.warn("Validation failed for {}: {}", request.getRequestURI(), detailMessage);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.failure(ErrorCode.VALIDATION_FAILED.getCode(), detailMessage, request.getRequestURI()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        log.warn("Access denied at path {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.failure(ErrorCode.FORBIDDEN.getCode(), ErrorCode.FORBIDDEN.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(AuthenticationException ex, HttpServletRequest request) {
        log.warn("Authentication failed at path {}: {}", request.getRequestURI(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.failure(ErrorCode.UNAUTHORIZED.getCode(), ErrorCode.UNAUTHORIZED.getMessage(), request.getRequestURI()));
    }

    @ExceptionHandler({
            org.apache.catalina.connector.ClientAbortException.class,
            org.springframework.web.context.request.async.AsyncRequestNotUsableException.class
    })
    public void handleClientAbortException(Exception ex, HttpServletRequest request) {
        log.debug("Client closed connection prematurely for {}: {}", request.getRequestURI(), ex.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex, HttpServletRequest request) {
        Throwable cause = ex;
        while (cause != null) {
            if (cause instanceof org.apache.catalina.connector.ClientAbortException
                    || cause instanceof org.springframework.web.context.request.async.AsyncRequestNotUsableException
                    || (cause.getMessage() != null && (cause.getMessage().contains("Broken pipe") || cause.getMessage().contains("Connection reset by peer")))) {
                log.debug("Client closed connection prematurely for {}: {}", request.getRequestURI(), cause.getMessage());
                return null;
            }
            cause = cause.getCause();
        }

        log.error("Unhandled system error at {}: ", request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.failure(ErrorCode.INTERNAL_ERROR.getCode(), ErrorCode.INTERNAL_ERROR.getMessage(), request.getRequestURI()));
    }
}
