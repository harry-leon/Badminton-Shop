package com.badminton.identity.api;

import com.badminton.common.response.ApiResponse;
import com.badminton.identity.api.dto.RolePermissionDto;
import com.badminton.identity.api.dto.UpdateRolePermissionsRequest;
import com.badminton.identity.application.IdentityService;
import com.badminton.identity.domain.Permission;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/roles")
@RequiredArgsConstructor
@Tag(name = "Roles & Permissions Management", description = "Quản lý vai trò và phân quyền động")
public class RoleController {

    private final IdentityService identityService;

    @GetMapping
    @PreAuthorize("hasAuthority('roles:view') or hasAuthority('ADMIN')")
    @Operation(summary = "Xem danh sách tất cả vai trò và quyền hạn tương ứng")
    public ResponseEntity<ApiResponse<List<RolePermissionDto>>> getAllRoles() {
        List<RolePermissionDto> roles = identityService.getAllRoles();
        return ResponseEntity.ok(ApiResponse.success("ROLES_RETRIEVED", "Lấy danh sách vai trò thành công", roles));
    }

    @GetMapping("/permissions")
    @PreAuthorize("hasAuthority('roles:view') or hasAuthority('ADMIN')")
    @Operation(summary = "Xem tất cả danh mục quyền hạn có trong hệ thống")
    public ResponseEntity<ApiResponse<List<Permission>>> getAllPermissions() {
        List<Permission> permissions = identityService.getAllPermissions();
        return ResponseEntity.ok(ApiResponse.success("PERMISSIONS_LIST", "Lấy danh sách quyền hạn thành công", permissions));
    }

    @PutMapping("/{roleId}/permissions")
    @PreAuthorize("hasAuthority('roles:manage') or hasAuthority('ADMIN')")
    @Operation(summary = "Cập nhật / cấp thêm quyền hạn cho vai trò (ngay lập tức áp dụng vào DB)")
    public ResponseEntity<ApiResponse<RolePermissionDto>> updateRolePermissions(
            @PathVariable String roleId,
            @Valid @RequestBody UpdateRolePermissionsRequest request
    ) {
        RolePermissionDto updatedRole = identityService.updateRolePermissions(roleId, request.permissionCodes());
        return ResponseEntity.ok(ApiResponse.success("ROLE_UPDATED", "Cập nhật phân quyền vai trò thành công", updatedRole));
    }
}
