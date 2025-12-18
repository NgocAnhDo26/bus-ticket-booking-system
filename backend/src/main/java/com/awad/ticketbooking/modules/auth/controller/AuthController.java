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
    @Operation(summary = "Register new user", description = "Creates a new user account and returns access/refresh tokens.")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthService.AuthResult result = authService.register(request);
        return buildTokenResponse(result);
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
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken) {
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
                .secure(false)
                .sameSite("Lax")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, deleteCookie.toString());
        return ResponseEntity.ok(ApiResponse.message(200, "Logged out"));
    }

    private ResponseEntity<ApiResponse<AuthResponse>> buildTokenResponse(AuthService.AuthResult result) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, result.refreshToken())
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(jwtProperties.refreshTokenTtl())
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(ApiResponse.success(result.payload()));
    }
}

