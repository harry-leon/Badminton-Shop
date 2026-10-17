package com.badminton.identity.api;

import com.badminton.common.response.ApiResponse;
import com.badminton.identity.api.dto.AuthResponse;
import com.badminton.identity.api.dto.LoginRequest;
import com.badminton.identity.api.dto.RegisterRequest;
import com.badminton.identity.application.IdentityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication & User Profile", description = "Đăng nhập, đăng ký và làm mới quyền động")
public class AuthController {

    private final IdentityService identityService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống bằng username và password")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = identityService.login(request);
        return ResponseEntity.ok(ApiResponse.success("AUTH_SUCCESS", "Đăng nhập thành công", response));
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản khách hàng mới")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = identityService.register(request);
        return ResponseEntity.ok(ApiResponse.success("REGISTER_SUCCESS", "Đăng ký tài khoản thành công", response));
    }

    @GetMapping("/me/permissions")
    @Operation(summary = "Lấy danh sách quyền hạn mới nhất từ Database theo thời gian thực (Dynamic RBAC)")
    public ResponseEntity<ApiResponse<List<String>>> getMyPermissions(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        List<String> permissions = identityService.getCurrentUserPermissions(userId);
        return ResponseEntity.ok(ApiResponse.success("PERMISSIONS_RETRIEVED", "Lấy danh sách quyền thành công", permissions));
    }
}
