package com.awad.ticketbooking.modules.auth.service;

import com.awad.ticketbooking.common.config.JwtProperties;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @InjectMocks
    private JwtService jwtService;

    @Mock
    private JwtProperties jwtProperties;

    @BeforeEach
    void setUp() {
        String secret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";
        when(jwtProperties.getSecret()).thenReturn(secret);
        when(jwtProperties.accessTokenTtl()).thenReturn(Duration.ofSeconds(3600)); 
    }

    @Test
    void testGenerateAccessToken() {
        User user = User.builder()
                .email("test@mail.com")
                .fullName("Test User") // Thêm fullName để tránh NPE nếu JWT dùng đến tên
                .build();
        user.setId(UUID.randomUUID());
        
        // Bắt buộc set Role. Lấy role đầu tiên trong Enum
        user.setRole(UserRole.values()[0]); 
        
        assertDoesNotThrow(() -> {
            String token = jwtService.generateAccessToken(user);
            assertNotNull(token);
        });
    }

    @Test
    void testExtractUserId_And_Validation() {
        User user = User.builder()
                .email("test@mail.com")
                .fullName("Test User") // Thêm fullName
                .build();
        user.setId(UUID.randomUUID());
        user.setRole(UserRole.values()[0]);

        String token = jwtService.generateAccessToken(user);
        
        assertDoesNotThrow(() -> jwtService.extractUserId(token));
        assertDoesNotThrow(() -> jwtService.isTokenValid(token));
    }
}