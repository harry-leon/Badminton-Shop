package com.badminton.common.exception;

import com.badminton.common.response.ApiResponse;
import org.apache.catalina.connector.ClientAbortException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;
    private MockHttpServletRequest request;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        request = new MockHttpServletRequest();
        request.setRequestURI("/api/v1/public/homepage");
    }

    @Test
    @DisplayName("handleClientAbortException - Xử lý trực tiếp ClientAbortException không ném 500")
    void handleClientAbortException_direct() {
        ClientAbortException ex = new ClientAbortException(new IOException("Broken pipe"));
        exceptionHandler.handleClientAbortException(ex, request);
        // Returns void cleanly without throwing exception
    }

    @Test
    @DisplayName("handleClientAbortException - Xử lý trực tiếp AsyncRequestNotUsableException không ném 500")
    void handleAsyncRequestNotUsableException_direct() {
        AsyncRequestNotUsableException ex = new AsyncRequestNotUsableException("ServletOutputStream failed to write: Broken pipe");
        exceptionHandler.handleClientAbortException(ex, request);
        // Returns void cleanly without throwing exception
    }

    @Test
    @DisplayName("handleGeneralException - Khi ngoại lệ lồng ClientAbortException trả về null (tránh 500)")
    void handleGeneralException_nestedClientAbort() {
        RuntimeException ex = new RuntimeException("Outer wrapper", new ClientAbortException(new IOException("Broken pipe")));
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleGeneralException(ex, request);
        assertThat(response).isNull();
    }

    @Test
    @DisplayName("handleGeneralException - Ngoại lệ hệ thống thông thường trả về HTTP 500")
    void handleGeneralException_regularError() {
        RuntimeException ex = new RuntimeException("Database timeout error");
        ResponseEntity<ApiResponse<Void>> response = exceptionHandler.handleGeneralException(ex, request);
        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().success()).isFalse();
        assertThat(response.getBody().code()).isEqualTo("INTERNAL_ERROR");
    }
}
