package com.awad.ticketbooking.modules.auth.service;

import com.awad.ticketbooking.modules.auth.dto.CreateAdminRequest;
import com.awad.ticketbooking.modules.auth.dto.UpdateAdminRequest;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminUserServiceTest {

    @InjectMocks
    private AdminUserService adminUserService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    private User testUser;
    private User adminUser;

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
        testUser.setEnabled(true);

        adminUser = User.builder()
                .email("admin@example.com")
                .fullName("Admin User")
                .phone("0987654321")
                .passwordHash("encoded-password")
                .authProvider(AuthProvider.LOCAL)
                .build();
        adminUser.setId(UUID.randomUUID());
        adminUser.setRole(UserRole.ADMIN);
        adminUser.setEnabled(true);
    }

    @Test
    void getAllUsers_withoutRole_returnsAllUsers() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> page = new PageImpl<>(Collections.singletonList(testUser));
        when(userRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<User> result = adminUserService.getAllUsers(null, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(userRepository).findAll(pageable);
    }

    @Test
    void getAllUsers_withRole_returnsFilteredUsers() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<User> page = new PageImpl<>(Collections.singletonList(adminUser));
        when(userRepository.findByRole(UserRole.ADMIN, pageable)).thenReturn(page);

        // Act
        Page<User> result = adminUserService.getAllUsers(UserRole.ADMIN, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        verify(userRepository).findByRole(UserRole.ADMIN, pageable);
    }

    @Test
    void getUserById_success() {
        // Arrange
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

        // Act
        User result = adminUserService.getUserById(testUser.getId());

        // Assert
        assertNotNull(result);
        assertEquals("Test User", result.getFullName());
    }

    @Test
    void getUserById_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> adminUserService.getUserById(nonExistentId));
        assertTrue(exception.getMessage().contains("User not found"));
    }

    @Test
    void createAdmin_success() {
        // Arrange
        CreateAdminRequest request = new CreateAdminRequest(
                "newadmin@example.com",
                "New Admin",
                "0111222333",
                "password123"
        );

        when(userRepository.findByEmail("newadmin@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByPhone("0111222333")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("encoded-new-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        // Act
        User result = adminUserService.createAdmin(request);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
        verify(passwordEncoder).encode("password123");
    }

    @Test
    void createAdmin_emailExists_throwsException() {
        // Arrange
        CreateAdminRequest request = new CreateAdminRequest(
                "test@example.com",
                "New Admin",
                "0111222333",
                "password123"
        );

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> adminUserService.createAdmin(request));
        assertEquals("Email already in use", exception.getMessage());
    }

    @Test
    void createAdmin_phoneExists_throwsException() {
        // Arrange
        CreateAdminRequest request = new CreateAdminRequest(
                "newadmin@example.com",
                "New Admin",
                "0123456789",
                "password123"
        );

        when(userRepository.findByEmail("newadmin@example.com")).thenReturn(Optional.empty());
        when(userRepository.findByPhone("0123456789")).thenReturn(Optional.of(testUser));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> adminUserService.createAdmin(request));
        assertEquals("Phone number already in use", exception.getMessage());
    }

    @Test
    void createAdmin_nullPhone_success() {
        // Arrange
        CreateAdminRequest request = new CreateAdminRequest(
                "newadmin@example.com",
                "New Admin",
                null,
                "password123"
        );

        when(userRepository.findByEmail("newadmin@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("encoded-new-password");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        // Act
        User result = adminUserService.createAdmin(request);

        // Assert
        assertNotNull(result);
        verify(userRepository, never()).findByPhone(anyString());
    }

    @Test
    void updateAdmin_success() {
        // Arrange
        UpdateAdminRequest request = new UpdateAdminRequest("Updated Admin", "0999888777");
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(userRepository.findByPhone("0999888777")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenReturn(adminUser);

        // Act
        User result = adminUserService.updateAdmin(adminUser.getId(), request);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateAdmin_notAdmin_throwsException() {
        // Arrange
        UpdateAdminRequest request = new UpdateAdminRequest("Updated User", "0999888777");
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> adminUserService.updateAdmin(testUser.getId(), request));
        assertEquals("Can only update admin users via this endpoint", exception.getMessage());
    }

    @Test
    void updateAdmin_phoneExists_throwsException() {
        // Arrange
        User otherAdmin = User.builder()
                .email("other@example.com")
                .phone("0999888777")
                .build();
        otherAdmin.setId(UUID.randomUUID());

        UpdateAdminRequest request = new UpdateAdminRequest("Updated Admin", "0999888777");
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(userRepository.findByPhone("0999888777")).thenReturn(Optional.of(otherAdmin));

        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> adminUserService.updateAdmin(adminUser.getId(), request));
        assertEquals("Phone number already in use", exception.getMessage());
    }

    @Test
    void updateAdmin_samePhone_success() {
        // Arrange
        UpdateAdminRequest request = new UpdateAdminRequest("Updated Admin", "0987654321");
        when(userRepository.findById(adminUser.getId())).thenReturn(Optional.of(adminUser));
        when(userRepository.findByPhone("0987654321")).thenReturn(Optional.of(adminUser));
        when(userRepository.save(any(User.class))).thenReturn(adminUser);

        // Act
        User result = adminUserService.updateAdmin(adminUser.getId(), request);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void setUserStatus_enable_success() {
        // Arrange
        testUser.setEnabled(false);
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = adminUserService.setUserStatus(testUser.getId(), true);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }

    @Test
    void setUserStatus_disable_success() {
        // Arrange
        when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenReturn(testUser);

        // Act
        User result = adminUserService.setUserStatus(testUser.getId(), false);

        // Assert
        assertNotNull(result);
        verify(userRepository).save(any(User.class));
    }
}
