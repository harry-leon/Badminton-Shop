package com.badminton.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    RESOURCE_NOT_FOUND("RESOURCE_NOT_FOUND", "Tài nguyên không tồn tại", HttpStatus.NOT_FOUND),
    BUSINESS_ERROR("BUSINESS_ERROR", "Thao tác nghiệp vụ không hợp lệ", HttpStatus.CONFLICT),
    UNAUTHORIZED("UNAUTHORIZED", "Chưa xác thực hoặc phiên đăng nhập hết hạn", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("FORBIDDEN", "Bạn không có quyền thực hiện thao tác này", HttpStatus.FORBIDDEN),
    VALIDATION_FAILED("VALIDATION_FAILED", "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "Tên đăng nhập hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    USER_ALREADY_EXISTS("USER_ALREADY_EXISTS", "Tên tài khoản hoặc email đã tồn tại", HttpStatus.CONFLICT),
    INTERNAL_ERROR("INTERNAL_ERROR", "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String message;
    private final HttpStatus status;

    ErrorCode(String code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }
}
