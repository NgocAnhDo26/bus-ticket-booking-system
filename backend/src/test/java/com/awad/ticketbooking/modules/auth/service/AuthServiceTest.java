package com.awad.ticketbooking.modules.auth.service;

import com.awad.ticketbooking.common.service.EmailService;
import com.awad.ticketbooking.modules.auth.dto.GoogleLoginRequest;
import com.awad.ticketbooking.modules.auth.dto.LoginRequest;
import com.awad.ticketbooking.modules.auth.dto.RegisterRequest;
import com.awad.ticketbooking.modules.auth.entity.AuthProvider;
import com.awad.ticketbooking.modules.auth.entity.PasswordResetToken;
import com.awad.ticketbooking.modules.auth.entity.RefreshToken;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import com.awad.ticketbooking.modules.auth.repository.PasswordResetTokenRepository;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

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
    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@example.com")
                .fullName("Test User")
                .passwordHash("encoded-password")
                .enabled(true)
                .role(UserRole.PASSENGER)
                .authProvider(AuthProvider.LOCAL)
                .build();
        testUser.setId(UUID.randomUUID());
    }

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

    @Test
    void register_emailAlreadyExists_throwsException() {
        // Arrange
        RegisterRequest request = new RegisterRequest("Test", "test@example.com", "password");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(testUser));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.register(request));
        assertEquals("Email already registered", exception.getMessage());
    }

    @Test
    void activateAccount_success() {
        // Arrange
        String token = UUID.randomUUID().toString();
        testUser.setEnabled(false);
        testUser.setActivationToken(token);
        testUser.setActivationTokenExpiry(Instant.now().plusSeconds(3600));

        when(userRepository.findByActivationToken(token)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("access-token");
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token");
        when(refreshTokenService.create(any(User.class))).thenReturn(refreshToken);

        // Act
        AuthService.AuthResult result = authService.activateAccount(token);

        // Assert
        assertNotNull(result);
        assertTrue(testUser.isEnabled());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void activateAccount_invalidToken_throwsException() {
        // Arrange
        String token = "invalid-token";
        when(userRepository.findByActivationToken(token)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.activateAccount(token));
        assertEquals("Invalid activation token", exception.getMessage());
    }

    @Test
    void activateAccount_expiredToken_throwsException() {
        // Arrange
        String token = UUID.randomUUID().toString();
        testUser.setActivationToken(token);
        testUser.setActivationTokenExpiry(Instant.now().minusSeconds(3600)); // Expired

        when(userRepository.findByActivationToken(token)).thenReturn(Optional.of(testUser));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.activateAccount(token));
        assertEquals("Activation token expired", exception.getMessage());
    }

    @Test
    void login_userNotFound_throwsException() {
        // Arrange
        LoginRequest request = new LoginRequest("notfound@example.com", "password");
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.login(request));
        assertEquals("User not found", exception.getMessage());
    }

    @Test
    void login_accountNotActivated_throwsException() {
        // Arrange
        LoginRequest request = new LoginRequest("test@example.com", "password");
        testUser.setEnabled(false);
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(testUser));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.login(request));
        assertTrue(exception.getMessage().contains("not activated"));
    }

    @Test
    void loginWithGoogle_success_newUser() throws Exception {
        // Arrange
        GoogleLoginRequest request = new GoogleLoginRequest("google-credential");
        GoogleIdToken idToken = mock(GoogleIdToken.class);
        GoogleIdToken.Payload payload = mock(GoogleIdToken.Payload.class);

        when(googleIdTokenVerifier.verify("google-credential")).thenReturn(idToken);
        when(idToken.getPayload()).thenReturn(payload);
        when(payload.getEmail()).thenReturn("google@example.com");
        when(payload.get("name")).thenReturn("Google User");
        when(payload.get("picture")).thenReturn("https://example.com/pic.jpg");

        when(userRepository.findByEmail("google@example.com")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("access-token");
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token");
        when(refreshTokenService.create(any(User.class))).thenReturn(refreshToken);

        // Act
        AuthService.AuthResult result = authService.loginWithGoogle(request);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void loginWithGoogle_success_existingUser() throws Exception {
        // Arrange
        GoogleLoginRequest request = new GoogleLoginRequest("google-credential");
        GoogleIdToken idToken = mock(GoogleIdToken.class);
        GoogleIdToken.Payload payload = mock(GoogleIdToken.Payload.class);

        when(googleIdTokenVerifier.verify("google-credential")).thenReturn(idToken);
        when(idToken.getPayload()).thenReturn(payload);
        when(payload.getEmail()).thenReturn("google@example.com");

        testUser.setAuthProvider(AuthProvider.GOOGLE);
        when(userRepository.findByEmail("google@example.com")).thenReturn(Optional.of(testUser));
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("access-token");
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token");
        when(refreshTokenService.create(any(User.class))).thenReturn(refreshToken);

        // Act
        AuthService.AuthResult result = authService.loginWithGoogle(request);

        // Assert
        assertNotNull(result);
    }

    @Test
    void loginWithGoogle_invalidCredential_throwsException() throws Exception {
        // Arrange
        GoogleLoginRequest request = new GoogleLoginRequest("invalid-credential");
        when(googleIdTokenVerifier.verify("invalid-credential")).thenReturn(null);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.loginWithGoogle(request));
        assertEquals("Invalid Google credential", exception.getMessage());
    }

    @Test
    void refresh_success() {
        // Arrange
        String refreshTokenValue = "refresh-token";
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(refreshTokenValue);
        refreshToken.setUser(testUser);

        when(refreshTokenService.validateToken(refreshTokenValue)).thenReturn(refreshToken);
        when(jwtService.generateAccessToken(any(User.class))).thenReturn("new-access-token");
        RefreshToken newRefreshToken = new RefreshToken();
        newRefreshToken.setToken("new-refresh-token");
        when(refreshTokenService.create(any(User.class))).thenReturn(newRefreshToken);

        // Act
        AuthService.AuthResult result = authService.refresh(refreshTokenValue);

        // Assert
        assertNotNull(result);
        verify(refreshTokenService).revokeAll(testUser);
    }

    @Test
    void refresh_accountNotActivated_throwsException() {
        // Arrange
        String refreshTokenValue = "refresh-token";
        testUser.setEnabled(false);
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(refreshTokenValue);
        refreshToken.setUser(testUser);

        when(refreshTokenService.validateToken(refreshTokenValue)).thenReturn(refreshToken);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.refresh(refreshTokenValue));
        assertEquals("Account not activated.", exception.getMessage());
    }

    @Test
    void logout_success() {
        // Arrange
        doNothing().when(refreshTokenService).revokeAll(testUser);

        // Act
        assertDoesNotThrow(() -> authService.logout(testUser));

        // Assert
        verify(refreshTokenService).revokeAll(testUser);
    }

    @Test
    void initiatePasswordReset_success() {
        // Arrange
        String email = "test@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.of(testUser));
        when(passwordResetTokenRepository.findByUser(testUser)).thenReturn(Optional.empty());
        when(passwordResetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(invocation -> {
            PasswordResetToken token = invocation.getArgument(0);
            return token;
        });
        doNothing().when(emailService).sendPasswordResetEmail(anyString(), anyString(), anyString());

        // Act
        assertDoesNotThrow(() -> authService.initiatePasswordReset(email));

        // Assert
        verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(eq(email), anyString(), anyString());
    }

    @Test
    void initiatePasswordReset_userNotFound_throwsException() {
        // Arrange
        String email = "notfound@example.com";
        when(userRepository.findByEmail(email)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.initiatePasswordReset(email));
        assertTrue(exception.getMessage().contains("User not found"));
    }

    @Test
    void resetPassword_success() {
        // Arrange
        String token = UUID.randomUUID().toString();
        String newPassword = "newPassword123";
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(testUser)
                .expiryDate(LocalDateTime.now().plusMinutes(15))
                .build();

        when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode(newPassword)).thenReturn("encoded-new-password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        doNothing().when(passwordResetTokenRepository).delete(resetToken);

        // Act
        assertDoesNotThrow(() -> authService.resetPassword(token, newPassword));

        // Assert
        verify(passwordEncoder).encode(newPassword);
        verify(userRepository).save(any(User.class));
        verify(passwordResetTokenRepository).delete(resetToken);
    }

    @Test
    void resetPassword_invalidToken_throwsException() {
        // Arrange
        String token = "invalid-token";
        when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.resetPassword(token, "newPassword"));
        assertTrue(exception.getMessage().contains("Invalid or expired"));
    }

    @Test
    void resetPassword_expiredToken_throwsException() {
        // Arrange
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(testUser)
                .expiryDate(LocalDateTime.now().minusMinutes(1)) // Expired
                .build();

        when(passwordResetTokenRepository.findByToken(token)).thenReturn(Optional.of(resetToken));
        doNothing().when(passwordResetTokenRepository).delete(resetToken);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.resetPassword(token, "newPassword"));
        assertEquals("Token expired", exception.getMessage());
        verify(passwordResetTokenRepository).delete(resetToken);
    }
}