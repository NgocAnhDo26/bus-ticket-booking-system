package com.awad.ticketbooking.modules.auth.service;

import com.awad.ticketbooking.common.service.EmailService;
import com.awad.ticketbooking.modules.auth.dto.LoginRequest;
import com.awad.ticketbooking.modules.auth.dto.RegisterRequest;
import com.awad.ticketbooking.modules.auth.entity.RefreshToken;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private GoogleIdTokenVerifier googleIdTokenVerifier;
    @Mock
    private EmailService emailService;

    @Test
    void testRegister() {
        RegisterRequest request = new RegisterRequest("Test", "test@example.com", "password");

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any())).thenReturn("encoded-password");

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        when(jwtService.generateAccessToken(any(User.class))).thenReturn("mock-access-token");
        when(refreshTokenService.create(any(User.class))).thenReturn(new RefreshToken());

        assertDoesNotThrow(() -> authService.register(request));
    }

    @Test
    void testLogin() {
        LoginRequest request = new LoginRequest("test@example.com", "password");

        User user = User.builder()
                .email("test@example.com")
                .passwordHash("encoded-password")
                .enabled(true)
                .build();
        user.setId(UUID.randomUUID());

        if (UserRole.values().length > 0) {
            user.setRole(UserRole.values()[0]);
        }

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(any(), any())).thenReturn(true);

        when(jwtService.generateAccessToken(any(User.class))).thenReturn("mock-access-token");
        when(refreshTokenService.create(any(User.class))).thenReturn(new RefreshToken());

        assertDoesNotThrow(() -> authService.login(request));
    }
}