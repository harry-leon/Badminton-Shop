package com.badminton.identity.api.dto;

import java.util.List;
import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserInfo user
) {
    public record UserInfo(
            UUID id,
            String username,
            String email,
            String fullName,
            String role,
            String branchId,
            List<String> permissions
    ) {}
}
