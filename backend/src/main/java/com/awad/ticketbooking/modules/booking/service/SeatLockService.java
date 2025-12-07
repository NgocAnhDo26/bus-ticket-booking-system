package com.awad.ticketbooking.modules.booking.service;

import com.awad.ticketbooking.modules.booking.dto.SeatStatusMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RLock;
import org.redisson.api.RMap;
import org.redisson.api.RedissonClient;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SeatLockService {

    private final RedissonClient redissonClient;
    private final SimpMessagingTemplate messagingTemplate;

    private static final String LOCK_KEY_PREFIX = "trip:%s:seat:%s";
    private static final String LOCK_INFO_MAP_PREFIX = "trip:%s:locks";
    private static final long LOCK_TTL_MINUTES = 10;

    public boolean lockSeat(UUID tripId, String seatCode, UUID userId) {
        String lockKey = String.format(LOCK_KEY_PREFIX, tripId, seatCode);
        RLock lock = redissonClient.getLock(lockKey);

        try {
            // Try to acquire lock. Wait 0s, hold for 10m
            if (lock.tryLock(0, LOCK_TTL_MINUTES, TimeUnit.MINUTES)) {
                // Store lock info in a map for easy retrieval
                RMap<String, UUID> locksMap = redissonClient.getMap(String.format(LOCK_INFO_MAP_PREFIX, tripId));
                locksMap.put(seatCode, userId);
                locksMap.expire(LOCK_TTL_MINUTES, TimeUnit.MINUTES);

                broadcastSeatStatus(tripId, seatCode, "LOCKED", userId);
                return true;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("Error locking seat", e);
        }
        return false;
    }

    public void unlockSeat(UUID tripId, String seatCode, UUID userId) {
        String lockKey = String.format(LOCK_KEY_PREFIX, tripId, seatCode);
        RLock lock = redissonClient.getLock(lockKey);

        if (lock.isLocked()) {
             // In a real scenario we should check if it's locked by the same user or if it's force unlock
             // but RLock handles hold count. For simplicity, we assume the controller validates user ownership 
             // or we check the map.
            
            RMap<String, UUID> locksMap = redissonClient.getMap(String.format(LOCK_INFO_MAP_PREFIX, tripId));
            UUID lockerId = locksMap.get(seatCode);
            
            if (lockerId != null && lockerId.equals(userId)) {
                if (lock.isHeldByCurrentThread() || lock.isLocked()) {
                     // Force unlock if needed or just unlock. 
                     // Since we are in a different thread than the one that locked it (likely),
                     // standard lock.unlock() might throw IllegalMonitorStateException if not handled correctly by Redisson across threads/transactions.
                     // However, Redisson RLock is reentrant. But here we are processing a new request.
                     // A safer way with Redisson for distributed locks not tied to thread is forceUnlock if we verify ownership via the Map.
                     lock.forceUnlock();
                }
                locksMap.remove(seatCode);
                broadcastSeatStatus(tripId, seatCode, "AVAILABLE", null);
            }
        }
    }

    public Map<String, UUID> getLockedSeats(UUID tripId) {
        RMap<String, UUID> locksMap = redissonClient.getMap(String.format(LOCK_INFO_MAP_PREFIX, tripId));
        return locksMap.readAllMap();
    }

    private void broadcastSeatStatus(UUID tripId, String seatCode, String status, UUID userId) {
        SeatStatusMessage message = new SeatStatusMessage(seatCode, status, userId);
        messagingTemplate.convertAndSend("/topic/trip/" + tripId + "/seats", message);
    }
}

