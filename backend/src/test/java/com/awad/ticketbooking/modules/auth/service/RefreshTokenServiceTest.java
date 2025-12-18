package com.awad.ticketbooking.modules.auth.service;

import com.awad.ticketbooking.common.config.JwtProperties;
import com.awad.ticketbooking.modules.auth.entity.RefreshToken;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.repository.RefreshTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtProperties jwtProperties;

    @Test
    void testCreate() {
         User user = User.builder().build();
        user.setId(UUID.randomUUID());
        
        // SỬA LỖI: Trả về Duration thay vì long
        when(jwtProperties.refreshTokenTtl()).thenReturn(Duration.ofDays(1));
        
        // Mock save db
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArguments()[0]);
        
        assertDoesNotThrow(() -> refreshTokenService.create(user));
    }

    @Test
    void testRevokeAll() {
        User user = User.builder().build();
        // Mock hàm void
        doNothing().when(refreshTokenRepository).deleteByUserId(any());
        assertDoesNotThrow(() -> refreshTokenService.revokeAll(user));
    }

    @Test
    void testValidateToken() {
        String token = "dummy-token";
        RefreshToken mockToken = new RefreshToken();
        mockToken.setToken(token);
        // Set expiresAt xa trong tương lai để token valid
        mockToken.setExpiresAt(java.time.Instant.now().plusSeconds(1000));
        when(refreshTokenRepository.findByToken(token)).thenReturn(Optional.of(mockToken));
        assertDoesNotThrow(() -> refreshTokenService.validateToken(token));
    }
}