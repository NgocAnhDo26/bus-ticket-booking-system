package com.awad.ticketbooking.modules.auth.service;

import com.awad.ticketbooking.modules.auth.dto.ChangePasswordRequest;
import com.awad.ticketbooking.modules.auth.dto.UpdateAvatarRequest;
import com.awad.ticketbooking.modules.auth.dto.UpdateProfileRequest;
import com.awad.ticketbooking.modules.auth.entity.AuthProvider;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserServiceTest {

    @InjectMocks
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@example.com")
                .fullName("Test User")
                .phone("0123456789")
                .passwordHash("encoded-password")
                .authProvider(AuthProvider.LOCAL)
                .build();
        testUser.setId(UUID.randomUUID());
        testUser.setRole(UserRole.PASSENGER);
    }

    @Test
    void updateProfile_success() {
        // Arrange
        UpdateProfileRequest request = new UpdateProfileRequest("Updated Name", "0987654321");
        when(userRepository.findByPhone("0987654321")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateProfile(testUser, request);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateProfile_samePhone_success() {
        // Arrange
        UpdateProfileRequest request = new UpdateProfileRequest("Updated Name", "0123456789");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateProfile(testUser, request);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateProfile_phoneAlreadyExists_throwsException() {
        // Arrange
        User otherUser = User.builder()
                .email("other@example.com")
                .fullName("Other User")
                .phone("0987654321")
                .build();
        otherUser.setId(UUID.randomUUID());

        UpdateProfileRequest request = new UpdateProfileRequest("Updated Name", "0987654321");
        when(userRepository.findByPhone("0987654321")).thenReturn(Optional.of(otherUser));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> userService.updateProfile(testUser, request));
        assertEquals("Phone number already in use", exception.getMessage());
    }

    @Test
    void changePassword_success() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest("oldPassword", "newPassword");
        when(passwordEncoder.matches("oldPassword", "encoded-password")).thenReturn(true);
        when(passwordEncoder.matches("newPassword", "encoded-password")).thenReturn(false);
        when(passwordEncoder.encode("newPassword")).thenReturn("new-encoded-password");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        userService.changePassword(testUser, request);

        // Assert
        verify(userRepository).save(any(User.class));
        verify(passwordEncoder).encode("newPassword");
    }

    @Test
    void changePassword_oauthUser_throwsException() {
        // Arrange
        testUser.setAuthProvider(AuthProvider.GOOGLE);
        ChangePasswordRequest request = new ChangePasswordRequest("oldPassword", "newPassword");

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> userService.changePassword(testUser, request));
        assertEquals("Password cannot be changed for OAuth accounts", exception.getMessage());
    }

    @Test
    void changePassword_wrongOldPassword_throwsException() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest("wrongPassword", "newPassword");
        when(passwordEncoder.matches("wrongPassword", "encoded-password")).thenReturn(false);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> userService.changePassword(testUser, request));
        assertEquals("Old password is incorrect", exception.getMessage());
    }

    @Test
    void changePassword_sameAsOld_throwsException() {
        // Arrange
        ChangePasswordRequest request = new ChangePasswordRequest("oldPassword", "oldPassword");
        when(passwordEncoder.matches("oldPassword", "encoded-password")).thenReturn(true);

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> userService.changePassword(testUser, request));
        assertEquals("New password must be different from old password", exception.getMessage());
    }

    @Test
    void changePassword_nullPasswordHash_throwsException() {
        // Arrange
        testUser.setPasswordHash(null);
        ChangePasswordRequest request = new ChangePasswordRequest("oldPassword", "newPassword");

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> userService.changePassword(testUser, request));
        assertEquals("Old password is incorrect", exception.getMessage());
    }

    @Test
    void updateAvatar_success() {
        // Arrange
        UpdateAvatarRequest request = new UpdateAvatarRequest("https://example.com/avatar.jpg");
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateAvatar(testUser, request);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateAvatar_nullUrl_success() {
        // Arrange
        UpdateAvatarRequest request = new UpdateAvatarRequest(null);
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = userService.updateAvatar(testUser, request);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }
}
