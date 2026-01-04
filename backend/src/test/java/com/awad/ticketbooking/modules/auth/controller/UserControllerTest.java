package com.awad.ticketbooking.modules.auth.controller;

import com.awad.ticketbooking.common.config.security.ApplicationUserDetails;
import com.awad.ticketbooking.modules.auth.dto.ChangePasswordRequest;
import com.awad.ticketbooking.modules.auth.dto.UpdateAvatarRequest;
import com.awad.ticketbooking.modules.auth.dto.UpdateProfileRequest;
import com.awad.ticketbooking.modules.auth.dto.UserResponse;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import com.awad.ticketbooking.common.exception.GlobalExceptionHandler;
import com.awad.ticketbooking.modules.auth.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private ObjectMapper objectMapper;
    private User testUser;
    private ApplicationUserDetails userDetails;

    @BeforeEach
    void setUp() {
        // Create a custom argument resolver that works with SecurityContext
        AuthenticationPrincipalArgumentResolver resolver = new AuthenticationPrincipalArgumentResolver();
        
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(resolver)
                .build();
        objectMapper = new ObjectMapper();

        testUser = User.builder()
                .email("test@example.com")
                .fullName("Test User")
                .role(UserRole.PASSENGER)
                .build();
        testUser.setId(UUID.randomUUID());
        userDetails = new ApplicationUserDetails(testUser);
    }
    
    private void setupSecurityContext() {
        SecurityContext context = new SecurityContextImpl();
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }
    
    private void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void me_success() throws Exception {
        try {
            setupSecurityContext();
            // Act & Assert
            mockMvc.perform(get("/api/users/me")
                            .with(SecurityMockMvcRequestPostProcessors.user(userDetails)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.email").value("test@example.com"));
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void me_unauthorized() throws Exception {
        // Act & Assert - Without authentication, should throw IllegalStateException
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isInternalServerError());
    }

    @Test
    void updateProfile_success() throws Exception {
        try {
            setupSecurityContext();
            // Arrange
            UpdateProfileRequest request = new UpdateProfileRequest("Updated Name", "0123456789");
            User updatedUser = User.builder()
                    .fullName("Updated Name")
                    .phone("0123456789")
                    .build();
            updatedUser.setId(testUser.getId());
            when(userService.updateProfile(eq(testUser), any(UpdateProfileRequest.class))).thenReturn(updatedUser);

            // Act & Assert
            mockMvc.perform(put("/api/users/me/profile")
                            .with(SecurityMockMvcRequestPostProcessors.user(userDetails))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.fullName").value("Updated Name"));

            verify(userService).updateProfile(eq(testUser), any(UpdateProfileRequest.class));
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void changePassword_success() throws Exception {
        try {
            setupSecurityContext();
            // Arrange
            ChangePasswordRequest request = new ChangePasswordRequest("oldPassword", "newPassword1!");
            doNothing().when(userService).changePassword(any(User.class), any(ChangePasswordRequest.class));

            // Act & Assert
            mockMvc.perform(put("/api/users/me/password")
                            .with(SecurityMockMvcRequestPostProcessors.user(userDetails))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.message").value("Password changed successfully"));

            verify(userService).changePassword(eq(testUser), any(ChangePasswordRequest.class));
        } finally {
            clearSecurityContext();
        }
    }

    @Test
    void updateAvatar_success() throws Exception {
        try {
            setupSecurityContext();
            // Arrange
            UpdateAvatarRequest request = new UpdateAvatarRequest("https://example.com/avatar.jpg");
            User updatedUser = User.builder()
                    .avatarUrl("https://example.com/avatar.jpg")
                    .build();
            updatedUser.setId(testUser.getId());
            when(userService.updateAvatar(eq(testUser), any(UpdateAvatarRequest.class))).thenReturn(updatedUser);

            // Act & Assert
            mockMvc.perform(put("/api/users/me/avatar")
                            .with(SecurityMockMvcRequestPostProcessors.user(userDetails))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.avatarUrl").value("https://example.com/avatar.jpg"));

            verify(userService).updateAvatar(eq(testUser), any(UpdateAvatarRequest.class));
        } finally {
            clearSecurityContext();
        }
    }
}
