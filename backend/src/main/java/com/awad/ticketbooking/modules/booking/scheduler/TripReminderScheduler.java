package com.awad.ticketbooking.modules.booking.scheduler;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.common.service.EmailService;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class TripReminderScheduler {

    private final BookingRepository bookingRepository;
    private final EmailService emailService;

    // Run every hour to check for upcoming trips
    @Scheduled(fixedRate = 3600000)
    @Transactional
    public void scheduleTripReminders() {
        sendReminders();
    }

    // Run on application startup (as requested by user)
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onStartup() {
        log.info("Running startup check for trip reminders...");
        sendReminders();
    }

    @Transactional
    public void sendReminders() {
        Instant now = Instant.now();
        Instant next24Hours = now.plus(24, ChronoUnit.HOURS);

        log.info("Checking for trips between {} and {}", now, next24Hours);

        // Find bookings departing between NOW and NOW + 24 Hours
        // that are CONFIRMED and haven't had a reminder sent yet.
        List<Booking> bookings = bookingRepository.findByStatusAndReminderSentFalseAndTripDepartureTimeBetween(
                BookingStatus.CONFIRMED, now, next24Hours);

        if (bookings.isEmpty()) {
            log.info("No bookings found needing reminders in this time range.");
            return;
        }

        log.info("Found {} bookings needing reminders", bookings.size());

        for (Booking booking : bookings) {
            try {
                String recipientEmail = booking.getPassengerEmail();
                if (recipientEmail == null && booking.getUser() != null) {
                    recipientEmail = booking.getUser().getEmail();
                }

                if (recipientEmail != null && !recipientEmail.isBlank()) {
                    emailService.sendTripReminderEmail(booking, recipientEmail);

                    booking.setReminderSent(true);
                    bookingRepository.save(booking);
                }
            } catch (Exception e) {
                log.error("Failed to process reminder for booking {}: {}", booking.getCode(), e.getMessage());
            }
        }
    }
}
