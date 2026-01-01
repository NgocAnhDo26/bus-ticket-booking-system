package com.awad.ticketbooking.modules.auth.controller;

import com.awad.ticketbooking.common.config.security.ApplicationUserDetails;
import com.awad.ticketbooking.common.model.ApiResponse;
import com.awad.ticketbooking.modules.auth.dto.ChangePasswordRequest;
import com.awad.ticketbooking.modules.auth.dto.UpdateAvatarRequest;
import com.awad.ticketbooking.modules.auth.dto.UpdateProfileRequest;
import com.awad.ticketbooking.modules.auth.dto.UserResponse;
import com.awad.ticketbooking.modules.auth.mapper.UserMapper;
import com.awad.ticketbooking.modules.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Endpoints related to the authenticated user profile.")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Returns profile information for the currently authenticated user.")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal ApplicationUserDetails principal) {
        if (principal == null) {
            throw new IllegalStateException("User not authenticated");
        }
        return ApiResponse.success(UserMapper.toResponse(principal.getUser()));
    }

    @PutMapping("/me/profile")
    @Operation(summary = "Update user profile", description = "Updates the authenticated user's name and phone number.")
    public ApiResponse<UserResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            @AuthenticationPrincipal ApplicationUserDetails principal) {
        if (principal == null) {
            throw new IllegalStateException("User not authenticated");
        }
        var updatedUser = userService.updateProfile(principal.getUser(), request);
        return ApiResponse.success(UserMapper.toResponse(updatedUser));
    }

    @PutMapping("/me/password")
    @Operation(summary = "Change password", description = "Changes the authenticated user's password. Requires old password verification.")
    public ApiResponse<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal ApplicationUserDetails principal) {
        if (principal == null) {
            throw new IllegalStateException("User not authenticated");
        }
        userService.changePassword(principal.getUser(), request);
        return ApiResponse.message(200, "Password changed successfully");
    }

    @PutMapping("/me/avatar")
    @Operation(summary = "Update avatar", description = "Updates the authenticated user's avatar URL.")
    public ApiResponse<UserResponse> updateAvatar(
            @Valid @RequestBody UpdateAvatarRequest request,
            @AuthenticationPrincipal ApplicationUserDetails principal) {
        if (principal == null) {
            throw new IllegalStateException("User not authenticated");
        }
        var updatedUser = userService.updateAvatar(principal.getUser(), request);
        return ApiResponse.success(UserMapper.toResponse(updatedUser));
    }
}

