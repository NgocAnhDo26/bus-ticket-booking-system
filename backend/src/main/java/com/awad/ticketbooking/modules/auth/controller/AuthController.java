package com.awad.ticketbooking.modules.auth.controller;

import com.awad.ticketbooking.common.config.JwtProperties;
import com.awad.ticketbooking.common.config.security.ApplicationUserDetails;
import com.awad.ticketbooking.common.model.ApiResponse;
import com.awad.ticketbooking.modules.auth.dto.AuthResponse;
import com.awad.ticketbooking.modules.auth.dto.GoogleLoginRequest;
import com.awad.ticketbooking.modules.auth.dto.LoginRequest;
import com.awad.ticketbooking.modules.auth.dto.RegisterRequest;
import com.awad.ticketbooking.modules.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Endpoints for user registration, login, token refresh and logout.")
public class AuthController {

    private static final String REFRESH_COOKIE = "refresh_token";

    private final AuthService authService;
    private final JwtProperties jwtProperties;

    @PostMapping("/register")
    @Operation(summary = "Register new user", description = "Creates a new user account. Returns message to check email for activation.")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.ok(
                ApiResponse.message(200, "Registration successful. Please check your email to activate your account."));
    }

    @PostMapping("/activate")
    @Operation(summary = "Activate account", description = "Activates user account using the token from email.")
    public ResponseEntity<ApiResponse<AuthResponse>> activate(
            @org.springframework.web.bind.annotation.RequestParam String token) {
        AuthService.AuthResult result = authService.activateAccount(token);
        return buildTokenResponse(result);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request password reset", description = "Sends a password reset link to the registered email.")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody com.awad.ticketbooking.modules.auth.dto.ForgotPasswordRequest request) {
        authService.initiatePasswordReset(request.getEmail());
        return ResponseEntity.ok(ApiResponse.message(200,
                "If your email is registered, you will receive a password reset link shortly."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Resets user password using the token.")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody com.awad.ticketbooking.modules.auth.dto.ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.message(200, "Password reset successful. You can now login."));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password", description = "Authenticates user with credentials and returns JWT tokens.")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthService.AuthResult result = authService.login(request);
        return buildTokenResponse(result);
    }

    @PostMapping("/google")
    @Operation(summary = "Login with Google OAuth", description = "Authenticates user using Google ID token and returns JWT tokens.")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithGoogle(@Valid @RequestBody GoogleLoginRequest request) {
        AuthService.AuthResult result = authService.loginWithGoogle(request);
        return buildTokenResponse(result);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token", description = "Uses the HTTP-only refresh token cookie to issue a new access token.")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(new ApiResponse<>(401, "Missing refresh token", null));
        }
        AuthService.AuthResult result = authService.refresh(refreshToken);
        return buildTokenResponse(result);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout user", description = "Revokes the refresh token and clears the refresh token cookie for the current user.")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal ApplicationUserDetails userDetails,
            HttpServletResponse response) {
        if (userDetails != null) {
            authService.logout(userDetails.getUser());
        }
        ResponseCookie deleteCookie = ResponseCookie.from(REFRESH_COOKIE, "")
                .path("/")
                .httpOnly(true)
                .secure(true) // Required for SameSite=None (cross-site cookies)
                .sameSite("None") // Allow cross-site cookies
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());
        return ResponseEntity.ok(ApiResponse.message(200, "Logged out"));
    }

    private ResponseEntity<ApiResponse<AuthResponse>> buildTokenResponse(AuthService.AuthResult result) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, result.refreshToken())
                .httpOnly(true)
                .secure(true) // Required for SameSite=None (cross-site cookies)
                .sameSite("None") // Allow cross-site cookies
                .path("/")
                .maxAge(jwtProperties.refreshTokenTtl())
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(result.payload()));
    }
}
