package com.awad.ticketbooking.modules.booking.service;

import com.awad.ticketbooking.modules.booking.dto.SeatStatusMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.redisson.api.RLock;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SeatLockServiceTest {

    @InjectMocks
    private SeatLockService seatLockService;

    @Mock
    private RedissonClient redissonClient;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private RLock rLock;

    @Mock
    private RMap<Object, Object> rMap;

    private UUID tripId;
    private UUID userId;
    private String seatCode;

    @BeforeEach
    void setUp() {
        tripId = UUID.randomUUID();
        userId = UUID.randomUUID();
        seatCode = "A1";
    }

    @Test
    void lockSeat_success() throws InterruptedException {
        // Arrange
        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(redissonClient.getMap(anyString())).thenReturn(rMap);
        when(rLock.tryLock(eq(0L), eq(10L), eq(TimeUnit.MINUTES))).thenReturn(true);

        // Act
        boolean result = seatLockService.lockSeat(tripId, seatCode, userId);

        // Assert
        assertTrue(result);
        verify(rMap).put(eq(seatCode), eq(userId));
        verify(rMap).expire(10L, TimeUnit.MINUTES);
        verify(messagingTemplate).convertAndSend(
                eq("/topic/trip/" + tripId + "/seats"),
                any(SeatStatusMessage.class));
    }

    @Test
    void lockSeat_alreadyLocked_returnsFalse() throws InterruptedException {
        // Arrange
        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(rLock.tryLock(eq(0L), eq(10L), eq(TimeUnit.MINUTES))).thenReturn(false);

        // Act
        boolean result = seatLockService.lockSeat(tripId, seatCode, userId);

        // Assert
        assertFalse(result);
        verify(rMap, never()).put(any(), any());
    }

    @Test
    void lockSeat_interrupted_returnsFalse() throws InterruptedException {
        // Arrange
        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(rLock.tryLock(eq(0L), eq(10L), eq(TimeUnit.MINUTES))).thenThrow(new InterruptedException());

        // Act
        boolean result = seatLockService.lockSeat(tripId, seatCode, userId);

        // Assert
        assertFalse(result);
    }

    @Test
    void unlockSeat_success() {
        // Arrange
        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(redissonClient.getMap(anyString())).thenReturn(rMap);
        when(rLock.isLocked()).thenReturn(true);
        when(rMap.get(eq(seatCode))).thenReturn(userId);

        // Act
        seatLockService.unlockSeat(tripId, seatCode, userId);

        // Assert
        verify(rLock).forceUnlock();
        verify(rMap).remove(eq(seatCode));
        verify(messagingTemplate).convertAndSend(
                eq("/topic/trip/" + tripId + "/seats"),
                any(SeatStatusMessage.class));
    }

    @Test
    void unlockSeat_differentUser_doesNotUnlock() {
        // Arrange
        UUID differentUserId = UUID.randomUUID();
        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(redissonClient.getMap(anyString())).thenReturn(rMap);
        when(rLock.isLocked()).thenReturn(true);
        when(rMap.get(seatCode)).thenReturn(differentUserId);

        // Act
        seatLockService.unlockSeat(tripId, seatCode, userId);

        // Assert
        verify(rLock, never()).forceUnlock();
        verify(rMap, never()).remove(any());
    }

    @Test
    void unlockSeat_notLocked_doesNothing() {
        // Arrange
        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(rLock.isLocked()).thenReturn(false);

        // Act
        seatLockService.unlockSeat(tripId, seatCode, userId);

        // Assert
        verify(rLock, never()).forceUnlock();
    }

    @Test
    void unlockSeatsForBooking_success() {
        // Arrange
        List<String> seatCodes = List.of("A1", "A2", "B1");
        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(redissonClient.getMap(anyString())).thenReturn(rMap);
        when(rLock.isLocked()).thenReturn(true);
        when(rMap.containsKey(any())).thenReturn(true);

        // Act
        seatLockService.unlockSeatsForBooking(tripId, seatCodes);

        // Assert
        verify(rLock, times(3)).forceUnlock();
        verify(rMap, times(3)).remove(any());
        verify(messagingTemplate, times(3)).convertAndSend(
                eq("/topic/trip/" + tripId + "/seats"),
                any(SeatStatusMessage.class));
    }

    @Test
    void markSeatsAsBooked_success() {
        // Arrange
        List<String> seatCodes = List.of("A1", "A2");
        when(redissonClient.getLock(anyString())).thenReturn(rLock);
        when(redissonClient.getMap(anyString())).thenReturn(rMap);
        when(rLock.isLocked()).thenReturn(true);
        when(rMap.containsKey(any())).thenReturn(true);

        // Act
        seatLockService.markSeatsAsBooked(tripId, seatCodes);

        // Assert
        verify(rLock, times(2)).forceUnlock();
        verify(rMap, times(2)).remove(any());
        verify(messagingTemplate, times(2)).convertAndSend(
                eq("/topic/trip/" + tripId + "/seats"),
                any(SeatStatusMessage.class));
    }

    @Test
    void getLockedSeats_success() {
        // Arrange
        Map<String, UUID> lockedSeats = new HashMap<>();
        lockedSeats.put("A1", userId);
        lockedSeats.put("A2", UUID.randomUUID());

        when(redissonClient.getMap(anyString())).thenReturn(rMap);
        when(rMap.readAllMap()).thenReturn((Map<Object, Object>) (Map<?, ?>) lockedSeats);

        // Act
        Map<String, UUID> result = seatLockService.getLockedSeats(tripId);

        // Assert
        assertNotNull(result);
        assertEquals(2, result.size());
        assertTrue(result.containsKey("A1"));
        assertTrue(result.containsKey("A2"));
    }
}
