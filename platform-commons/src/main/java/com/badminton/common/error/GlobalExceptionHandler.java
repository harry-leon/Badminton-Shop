package com.badminton.common.error;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

/**
 * Xử lý ngoại lệ toàn cục chuyển đổi sang chuẩn RFC 9457 Problem Details.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String TRACE_ID_KEY = "traceId";

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ProblemDetailResponse> handleBusinessException(BusinessException ex, HttpServletRequest request) {
        String traceId = MDC.get(TRACE_ID_KEY);
        log.warn("Ngoại lệ nghiệp vụ [{}]: {} - TraceId: {}", ex.getCode(), ex.getMessage(), traceId);

        ProblemDetailResponse response = ProblemDetailResponse.builder()
                .type(URI.create("urn:problem-type:business-error"))
                .title("Lỗi nghiệp vụ")
                .status(ex.getStatus().value())
                .detail(ex.getMessage())
                .code(ex.getCode())
                .instance(request.getRequestURI())
                .traceId(traceId)
                .build();

        return ResponseEntity.status(ex.getStatus())
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetailResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String traceId = MDC.get(TRACE_ID_KEY);
        List<ProblemDetailResponse.ValidationError> validationErrors = new ArrayList<>();

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            validationErrors.add(new ProblemDetailResponse.ValidationError(
                    error.getField(),
                    error.getDefaultMessage(),
                    error.getRejectedValue()
            ));
        }

        ProblemDetailResponse response = ProblemDetailResponse.builder()
                .type(URI.create("urn:problem-type:validation-error"))
                .title("Dữ liệu đầu vào không hợp lệ")
                .status(HttpStatus.BAD_REQUEST.value())
                .detail("Một hoặc nhiều trường dữ liệu không thỏa mãn điều kiện xác thực.")
                .code("VALIDATION_FAILED")
                .instance(request.getRequestURI())
                .traceId(traceId)
                .validationErrors(validationErrors)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetailResponse> handleGeneralException(Exception ex, HttpServletRequest request) {
        String traceId = MDC.get(TRACE_ID_KEY);
        log.error("Lỗi hệ thống không mong muốn - TraceId: {}", traceId, ex);

        ProblemDetailResponse response = ProblemDetailResponse.builder()
                .type(URI.create("urn:problem-type:internal-server-error"))
                .title("Lỗi máy chủ nội bộ")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .detail("Hệ thống đã gặp lỗi trong quá trình xử lý yêu cầu. Vui lòng thử lại sau.")
                .code("INTERNAL_ERROR")
                .instance(request.getRequestURI())
                .traceId(traceId)
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .contentType(MediaType.APPLICATION_PROBLEM_JSON)
                .body(response);
    }
}
