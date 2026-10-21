package com.badminton.identity.application;

import com.badminton.common.exception.BusinessException;
import com.badminton.common.exception.ErrorCode;
import com.badminton.common.exception.ResourceNotFoundException;
import com.badminton.identity.api.dto.AuthResponse;
import com.badminton.identity.api.dto.LoginRequest;
import com.badminton.identity.api.dto.RegisterRequest;
import com.badminton.identity.api.dto.RolePermissionDto;
import com.badminton.identity.domain.Permission;
import com.badminton.identity.domain.Role;
import com.badminton.identity.domain.User;
import com.badminton.identity.infrastructure.PermissionRepository;
import com.badminton.identity.infrastructure.RoleRepository;
import com.badminton.identity.infrastructure.UserRepository;
import com.badminton.security.JwtTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class IdentityService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenService jwtTokenService;

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .or(() -> userRepository.findByEmail(request.username()))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        if (!user.isActive()) {
            throw new BusinessException(ErrorCode.BUSINESS_ERROR, "Tài khoản của bạn đã bị vô hiệu hóa");
        }

        List<String> permissions = getUserPermissions(user);
        String token = jwtTokenService.generateToken(
                user.getId(),
                user.getUsername(),
                user.getRole().getId(),
                user.getBranchId(),
                permissions
        );

        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getRole().getId(),
                user.getBranchId(),
                permissions
        );

        return new AuthResponse(token, "Bearer", 86400, userInfo);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new BusinessException(ErrorCode.USER_ALREADY_EXISTS, "Tên tài khoản đã tồn tại");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessException(ErrorCode.USER_ALREADY_EXISTS, "Email đã được sử dụng");
        }

        Role customerRole = roleRepository.findById("CUSTOMER")
                .orElseThrow(() -> new ResourceNotFoundException("Vai trò mặc định CUSTOMER không tồn tại"));

        User newUser = User.builder()
                .username(request.username())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .phone(request.phone())
                .role(customerRole)
                .active(true)
                .build();

        userRepository.save(newUser);

        List<String> permissions = getUserPermissions(newUser);
        String token = jwtTokenService.generateToken(
                newUser.getId(),
                newUser.getUsername(),
                customerRole.getId(),
                null,
                permissions
        );

        AuthResponse.UserInfo userInfo = new AuthResponse.UserInfo(
                newUser.getId(),
                newUser.getUsername(),
                newUser.getEmail(),
                newUser.getFullName(),
                customerRole.getId(),
                null,
                permissions
        );

        return new AuthResponse(token, "Bearer", 86400, userInfo);
    }

    @Transactional(readOnly = true)
    public List<String> getCurrentUserPermissions(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng với ID: " + userId));
        return getUserPermissions(user);
    }

    @Transactional(readOnly = true)
    public List<RolePermissionDto> getAllRoles() {
        return roleRepository.findAll().stream().map(role -> new RolePermissionDto(
                role.getId(),
                role.getName(),
                role.getDescription(),
                role.isSystem(),
                role.getPermissions().stream().map(Permission::getCode).sorted().collect(Collectors.toList())
        )).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Permission> getAllPermissions() {
        return permissionRepository.findAll();
    }

    @Transactional
    public RolePermissionDto updateRolePermissions(String roleId, List<String> permissionCodes) {
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò: " + roleId));

        Set<Permission> targetPermissions = new HashSet<>();
        for (String code : permissionCodes) {
            permissionRepository.findById(code).ifPresent(targetPermissions::add);
        }

        role.setPermissions(targetPermissions);
        roleRepository.save(role);

        log.info("Updated permissions for role {}. Count: {}", roleId, targetPermissions.size());

        return new RolePermissionDto(
                role.getId(),
                role.getName(),
                role.getDescription(),
                role.isSystem(),
                role.getPermissions().stream().map(Permission::getCode).sorted().collect(Collectors.toList())
        );
    }

    private List<String> getUserPermissions(User user) {
        if (user.getRole() == null || user.getRole().getPermissions() == null) {
            return Collections.emptyList();
        }
        return user.getRole().getPermissions().stream()
                .map(Permission::getCode)
                .sorted()
                .collect(Collectors.toList());
    }
}
