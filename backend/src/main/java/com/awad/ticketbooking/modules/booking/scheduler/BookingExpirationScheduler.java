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
public class BookingExpirationScheduler {

    private final BookingRepository bookingRepository;
    private final BookingService bookingService;

    @Scheduled(fixedRate = 60000) // Run every 1 minute
    @Transactional
    public void expirePendingBookings() {
        log.info("Running booking expiration scheduler...");
        Instant cutoffTime = Instant.now().minus(15, ChronoUnit.MINUTES);

        List<Booking> expiredBookings = bookingRepository.findExpiredPendingBookings(cutoffTime);

        if (!expiredBookings.isEmpty()) {
            log.info("Found {} expired bookings to cancel", expiredBookings.size());
            for (Booking booking : expiredBookings) {
                try {
                    log.info("Expiring booking: {}", booking.getId());
                    // We use the service method to ensure any side effects (like email or status
                    // checks) are handled
                    // But we catch exceptions to continue processing others
                    bookingService.cancelBooking(booking.getId());
                } catch (Exception e) {
                    log.error("Failed to cancel expired booking: " + booking.getId(), e);
                }
            }
        }
    }
}
