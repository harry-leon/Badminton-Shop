package com.badminton.identity.api.dto;

import java.util.List;

public record RolePermissionDto(
        String roleId,
        String roleName,
        String description,
        boolean isSystem,
        List<String> permissionCodes
) {}
