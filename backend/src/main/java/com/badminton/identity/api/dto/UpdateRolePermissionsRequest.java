package com.badminton.identity.api.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpdateRolePermissionsRequest(
        @NotEmpty(message = "Danh sách quyền không được rỗng")
        List<String> permissionCodes
) {}
