package com.awad.ticketbooking.modules.auth.controller;

import com.awad.ticketbooking.common.config.security.ApplicationUserDetails;
import com.awad.ticketbooking.common.model.ApiResponse;
import com.awad.ticketbooking.modules.auth.dto.UserResponse;
import com.awad.ticketbooking.modules.auth.mapper.UserMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "Users", description = "Endpoints related to the authenticated user profile.")
public class UserController {

    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Returns profile information for the currently authenticated user.")
    public ApiResponse<UserResponse> me(@AuthenticationPrincipal ApplicationUserDetails principal) {
        if (principal == null) {
            throw new IllegalStateException("User not authenticated");
        }
        return ApiResponse.success(UserMapper.toResponse(principal.getUser()));
    }
}

