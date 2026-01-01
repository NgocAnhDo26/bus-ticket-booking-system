package com.awad.ticketbooking.modules.trip.scheduler;

import com.awad.ticketbooking.common.enums.RecurrenceType;
import com.awad.ticketbooking.common.enums.SeatType;
import com.awad.ticketbooking.common.enums.TripStatus;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.awad.ticketbooking.modules.trip.entity.TripPricing;
import com.awad.ticketbooking.modules.trip.entity.TripSchedule;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
import com.awad.ticketbooking.modules.trip.repository.TripScheduleRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Scheduler that generates trips from TripSchedule configurations.
 * Runs daily to create trips for the next N days ahead.
 * This prevents generating all trips at once when a long recurrence is
 * configured.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class TripGenerationScheduler {

    private final TripScheduleRepository tripScheduleRepository;
    private final TripRepository tripRepository;
    private final ObjectMapper objectMapper;

    // How many days ahead to generate trips
    @Value("${app.trip-generation.days-ahead:7}")
    private int daysAhead;

    // Whether to run trip generation on application startup (default: false to
    // avoid duplicate runs)
    @Value("${app.trip-generation.run-on-startup:false}")
    private boolean runOnStartup;

    /**
     * Run every day at midnight to generate trips for the next N days
     */
    @Scheduled(cron = "0 0 0 * * *") // Every day at 00:00
    @Transactional
    public void generateTripsForUpcomingDays() {
        log.info("Starting scheduled trip generation for next {} days...", daysAhead);
        generateTrips();
    }

    /**
     * Run on application startup to ensure trips exist (only if enabled)
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void onStartup() {
        if (!runOnStartup) {
            log.info("Trip generation on startup is disabled. Skipping.");
            return;
        }
        log.info("Running startup trip generation check...");
        generateTrips();
    }

    @Transactional
    public void generateTrips() {
        LocalDate today = LocalDate.now();
        int tripsCreated = 0;
        int tripsSkipped = 0;

        for (int dayOffset = 0; dayOffset <= daysAhead; dayOffset++) {
            LocalDate targetDate = today.plusDays(dayOffset);

            // Find all active schedules applicable for this date
            List<TripSchedule> schedules = tripScheduleRepository.findActiveSchedulesForDate(
                    RecurrenceType.NONE, targetDate);

            for (TripSchedule schedule : schedules) {
                if (shouldGenerateTripForDate(schedule, targetDate)) {
                    boolean created = createTripFromSchedule(schedule, targetDate);
                    if (created) {
                        tripsCreated++;
                    } else {
                        tripsSkipped++;
                    }
                }
            }
        }

        log.info("Trip generation complete. Created: {}, Skipped (already exist): {}",
                tripsCreated, tripsSkipped);
    }

    /**
     * Check if a trip should be generated for a specific date based on recurrence
     * rules
     */
    private boolean shouldGenerateTripForDate(TripSchedule schedule, LocalDate date) {
        if (schedule.getRecurrenceType() == RecurrenceType.NONE) {
            return false;
        }

        if (schedule.getRecurrenceType() == RecurrenceType.DAILY) {
            return true;
        }

        if (schedule.getRecurrenceType() == RecurrenceType.WEEKLY) {
            // Check if the day of week matches the configured weekly days
            String weeklyDays = schedule.getWeeklyDays();
            if (weeklyDays == null || weeklyDays.isBlank()) {
                return false;
            }

            Set<String> allowedDays = new HashSet<>(Arrays.asList(weeklyDays.split(",")));
            DayOfWeek dayOfWeek = date.getDayOfWeek();
            String dayCode = convertDayOfWeekToCode(dayOfWeek);

            return allowedDays.contains(dayCode);
        }

        return false;
    }

    /**
     * Convert Java DayOfWeek to our code format (MON, TUE, etc.)
     */
    private String convertDayOfWeekToCode(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> "MON";
            case TUESDAY -> "TUE";
            case WEDNESDAY -> "WED";
            case THURSDAY -> "THU";
            case FRIDAY -> "FRI";
            case SATURDAY -> "SAT";
            case SUNDAY -> "SUN";
        };
    }

    /**
     * Create a trip from a schedule for a specific date.
     * Returns false if trip already exists.
     */
    private boolean createTripFromSchedule(TripSchedule schedule, LocalDate date) {
        // Calculate departure and arrival times
        LocalTime departureTime = schedule.getDepartureTime();
        LocalDateTime departureDateTime = LocalDateTime.of(date, departureTime);
        Instant departureInstant = departureDateTime.atZone(ZoneId.systemDefault()).toInstant();

        Route route = schedule.getRoute();
        int durationMinutes = route.getDurationMinutes();
        Instant arrivalInstant = departureInstant.plusSeconds(durationMinutes * 60L);

        // Check if trip already exists for this bus at this time
        boolean exists = tripRepository.existsByBusIdAndDepartureTimeLessThanAndArrivalTimeGreaterThan(
                schedule.getBus().getId(), arrivalInstant, departureInstant);

        if (exists) {
            log.debug("Trip already exists for schedule {} on date {}", schedule.getId(), date);
            return false;
        }

        // Create the trip
        Trip trip = new Trip();
        trip.setRoute(schedule.getRoute());
        trip.setBus(schedule.getBus());
        trip.setDepartureTime(departureInstant);
        trip.setArrivalTime(arrivalInstant);
        trip.setStatus(TripStatus.SCHEDULED);
        trip.setTripSchedule(schedule);

        // Copy Pricing Config
        if (schedule.getPricingConfig() != null && !schedule.getPricingConfig().isBlank()) {
            try {
                List<PricingDto> pricingDtos = objectMapper.readValue(
                        schedule.getPricingConfig(),
                        new TypeReference<List<PricingDto>>() {
                        });

                for (PricingDto dto : pricingDtos) {
                    TripPricing pricing = new TripPricing();
                    pricing.setTrip(trip);
                    pricing.setSeatType(dto.seatType);
                    pricing.setPrice(dto.price);
                    trip.getTripPricings().add(pricing);
                }
            } catch (Exception e) {
                log.error("Failed to parse pricing config for schedule {}: {}", schedule.getId(), e.getMessage());
                // Fallback or just log? For now log, but trip will have 0 price.
            }
        }

        tripRepository.save(trip);
        log.info("Created trip for schedule {} on date {} (departure: {})",
                schedule.getId(), date, departureInstant);

        return true;
    }

    @lombok.Data
    @lombok.NoArgsConstructor
    private static class PricingDto {
        private SeatType seatType;
        private BigDecimal price;
    }

    /**
     * Manually trigger trip generation (for admin use)
     */
    @Transactional
    public int manuallyGenerateTrips(int customDaysAhead) {
        int originalDaysAhead = this.daysAhead;
        this.daysAhead = Math.min(customDaysAhead, 90); // Cap at 90 days

        LocalDate today = LocalDate.now();
        int tripsCreated = 0;

        for (int dayOffset = 0; dayOffset <= this.daysAhead; dayOffset++) {
            LocalDate targetDate = today.plusDays(dayOffset);
            List<TripSchedule> schedules = tripScheduleRepository.findActiveSchedulesForDate(
                    RecurrenceType.NONE, targetDate);

            for (TripSchedule schedule : schedules) {
                if (shouldGenerateTripForDate(schedule, targetDate)) {
                    boolean created = createTripFromSchedule(schedule, targetDate);
                    if (created) {
                        tripsCreated++;
                    }
                }
            }
        }

        this.daysAhead = originalDaysAhead;
        return tripsCreated;
    }
}
