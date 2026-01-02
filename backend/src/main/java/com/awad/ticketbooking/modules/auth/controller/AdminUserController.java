package com.awad.ticketbooking.modules.auth.controller;

import com.awad.ticketbooking.common.model.ApiResponse;
import com.awad.ticketbooking.modules.auth.dto.AdminUserResponse;
import com.awad.ticketbooking.modules.auth.dto.CreateAdminRequest;
import com.awad.ticketbooking.modules.auth.dto.UpdateAdminRequest;
import com.awad.ticketbooking.modules.auth.dto.UserStatusRequest;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import com.awad.ticketbooking.modules.auth.mapper.UserMapper;
import com.awad.ticketbooking.modules.auth.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@Tag(name = "Admin User Management", description = "Endpoints for managing users (admin and passengers)")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @Operation(summary = "Get all users", description = "Retrieve a paginated list of users, optionally filtered by role.")
    public ApiResponse<Page<AdminUserResponse>> getAllUsers(
            @RequestParam(required = false) UserRole role,
            Pageable pageable) {
        var users = adminUserService.getAllUsers(role, pageable);
        return ApiResponse.success(users.map(UserMapper::toAdminResponse));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Retrieve detailed information about a specific user.")
    public ApiResponse<AdminUserResponse> getUserById(@PathVariable UUID id) {
        var user = adminUserService.getUserById(id);
        return ApiResponse.success(UserMapper.toAdminResponse(user));
    }

    @PostMapping
    @Operation(summary = "Create admin", description = "Create a new admin account.")
    public ApiResponse<AdminUserResponse> createAdmin(@Valid @RequestBody CreateAdminRequest request) {
        var user = adminUserService.createAdmin(request);
        return ApiResponse.success(UserMapper.toAdminResponse(user));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update admin", description = "Update information for an existing admin account.")
    public ApiResponse<AdminUserResponse> updateAdmin(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAdminRequest request) {
        var user = adminUserService.updateAdmin(id, request);
        return ApiResponse.success(UserMapper.toAdminResponse(user));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Set user status", description = "Enable or disable a user account.")
    public ApiResponse<AdminUserResponse> setUserStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UserStatusRequest request) {
        var user = adminUserService.setUserStatus(id, request.enabled());
        return ApiResponse.success(UserMapper.toAdminResponse(user));
    }
}
