package com.awad.ticketbooking.modules.booking.scheduler;

import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.booking.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingCleanupScheduler {

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;

    // Run every minute (60 * 1000 ms)
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void cleanupExpiredBookings() {
        log.debug("Running expired booking cleanup job...");

        // Expire bookings older than 15 minutes
        Instant cutoffTime = Instant.now().minus(15, ChronoUnit.MINUTES);

        List<Booking> expiredBookings = bookingRepository.findExpiredPendingBookings(cutoffTime);

        if (!expiredBookings.isEmpty()) {
            log.info("Found {} expired pending bookings to cancel.", expiredBookings.size());

            for (Booking booking : expiredBookings) {
                try {
                    log.info("Cancelling expired booking: {} (Created at: {})", booking.getCode(),
                            booking.getCreatedAt());
                    bookingService.cancelBooking(booking.getId());
                } catch (Exception e) {
                    log.error("Failed to cancel expired booking {}: {}", booking.getCode(), e.getMessage());
                }
            }
        }
    }
}
