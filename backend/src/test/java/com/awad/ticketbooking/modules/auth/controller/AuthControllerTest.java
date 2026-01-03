package com.awad.ticketbooking.modules.auth.controller;

import com.awad.ticketbooking.common.config.JwtProperties;
import com.awad.ticketbooking.common.config.security.ApplicationUserDetails;
import com.awad.ticketbooking.modules.auth.dto.AuthResponse;
import com.awad.ticketbooking.modules.auth.dto.ForgotPasswordRequest;
import com.awad.ticketbooking.modules.auth.dto.GoogleLoginRequest;
import com.awad.ticketbooking.modules.auth.dto.LoginRequest;
import com.awad.ticketbooking.modules.auth.dto.RegisterRequest;
import com.awad.ticketbooking.modules.auth.dto.ResetPasswordRequest;
import com.awad.ticketbooking.modules.auth.dto.UserResponse;
import com.awad.ticketbooking.modules.auth.entity.AuthProvider;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import com.awad.ticketbooking.modules.auth.service.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockCookie;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Duration;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
@org.mockito.junit.jupiter.MockitoSettings(strictness = org.mockito.quality.Strictness.LENIENT)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @Mock
    private JwtProperties jwtProperties;

    @InjectMocks
    private AuthController authController;

    private ObjectMapper objectMapper;
    private AuthService.AuthResult mockAuthResult;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();

        UserResponse userResponse = new UserResponse(
                UUID.randomUUID(),
                "Test User",
                "test@example.com",
                "0123456789",
                UserRole.PASSENGER,
                null,
                AuthProvider.LOCAL
        );
        AuthResponse authResponse = new AuthResponse("access-token", userResponse);
        mockAuthResult = new AuthService.AuthResult(authResponse, "refresh-token");

        when(jwtProperties.refreshTokenTtl()).thenReturn(Duration.ofDays(7));
    }

    @Test
    void register_success() throws Exception {
        // Arrange
        RegisterRequest request = new RegisterRequest(
                "Test User",
                "test@example.com",
                "Password123!"
        );
        doNothing().when(authService).register(any(RegisterRequest.class));

        // Act & Assert
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Registration successful. Please check your email to activate your account."));

        verify(authService).register(any(RegisterRequest.class));
    }

    @Test
    void activate_success() throws Exception {
        // Arrange
        when(authService.activateAccount(anyString())).thenReturn(mockAuthResult);

        // Act & Assert
        mockMvc.perform(post("/api/auth/activate")
                        .param("token", "activation-token"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"));

        verify(authService).activateAccount("activation-token");
    }

    @Test
    void forgotPassword_success() throws Exception {
        // Arrange
        ForgotPasswordRequest request = new ForgotPasswordRequest("test@example.com");
        doNothing().when(authService).initiatePasswordReset(anyString());

        // Act & Assert
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("If your email is registered, you will receive a password reset link shortly."));

        verify(authService).initiatePasswordReset("test@example.com");
    }

    @Test
    void resetPassword_success() throws Exception {
        // Arrange
        ResetPasswordRequest request = new ResetPasswordRequest("reset-token", "NewPassword123!");
        doNothing().when(authService).resetPassword(anyString(), anyString());

        // Act & Assert
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password reset successful. You can now login."));

        verify(authService).resetPassword("reset-token", "NewPassword123!");
    }

    @Test
    void login_success() throws Exception {
        // Arrange
        LoginRequest request = new LoginRequest("test@example.com", "password123");
        when(authService.login(any(LoginRequest.class))).thenReturn(mockAuthResult);

        // Act & Assert
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"));

        verify(authService).login(any(LoginRequest.class));
    }

    @Test
    void loginWithGoogle_success() throws Exception {
        // Arrange
        GoogleLoginRequest request = new GoogleLoginRequest("google-credential");
        when(authService.loginWithGoogle(any(GoogleLoginRequest.class))).thenReturn(mockAuthResult);

        // Act & Assert
        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"));

        verify(authService).loginWithGoogle(any(GoogleLoginRequest.class));
    }

    @Test
    void refresh_success() throws Exception {
        // Arrange
        when(authService.refresh(anyString())).thenReturn(mockAuthResult);

        // Act & Assert
        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(new MockCookie("refresh_token", "refresh-token")))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"));

        verify(authService).refresh("refresh-token");
    }

    @Test
    void refresh_missingToken_returns401() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/auth/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Missing refresh token"));

        verify(authService, never()).refresh(anyString());
    }

    @Test
    void logout_success() throws Exception {
        // Arrange
        // Note: In standalone setup, @AuthenticationPrincipal is not automatically injected
        // This test verifies the endpoint works when user is null (no authentication)
        // Full authentication testing requires integration tests with Spring Security context

        // Act & Assert
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(cookie().value("refresh_token", ""))
                .andExpect(jsonPath("$.message").value("Logged out"));

        // When user is null, logout should not call authService
        verify(authService, never()).logout(any(User.class));
    }

    @Test
    void logout_withoutUser_success() throws Exception {
        // Act & Assert
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(cookie().value("refresh_token", ""))
                .andExpect(jsonPath("$.message").value("Logged out"));

        verify(authService, never()).logout(any(User.class));
    }
}
