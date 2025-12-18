package com.awad.ticketbooking.modules.booking.controller;

import com.awad.ticketbooking.common.config.security.ApplicationUserDetails;
import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.booking.dto.LockSeatRequest;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.booking.service.SeatLockService;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/bookings/seats")
@RequiredArgsConstructor
@Tag(name = "Seat locks", description = "Endpoints for locking and unlocking seats and querying seat status.")
public class SeatController {

    private final SeatLockService seatLockService;
    private final BookingRepository bookingRepository;

    @PostMapping("/lock")
    @Operation(summary = "Lock a seat", description = "Attempts to place a temporary lock on a seat for the current user or guest.")
    public ResponseEntity<?> lockSeat(@Valid @RequestBody LockSeatRequest request,
            @AuthenticationPrincipal ApplicationUserDetails userDetails) {
        UUID userId;
        if (userDetails != null) {
            userId = userDetails.getUser().getId();
        } else if (request.getGuestId() != null && !request.getGuestId().isBlank()) {
            userId = UUID.fromString(request.getGuestId());
        } else {
            return ResponseEntity.status(401).body("User must be logged in or provide guest ID");
        }

        // Check if seat is already booked (persistent check)
        boolean isBooked = bookingRepository.existsByTripIdAndTicketsSeatCodeAndStatusNot(
                request.getTripId(), request.getSeatCode(), BookingStatus.CANCELLED);

        if (isBooked) {
            return ResponseEntity.badRequest().body("Seat is already booked");
        }

        boolean locked = seatLockService.lockSeat(request.getTripId(), request.getSeatCode(), userId);
        if (locked) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(409).body("Seat is currently locked by another user");
        }
    }

    @PostMapping("/unlock")
    @Operation(summary = "Unlock a seat", description = "Releases a previously locked seat for the current user or guest.")
    public ResponseEntity<?> unlockSeat(@Valid @RequestBody LockSeatRequest request,
            @AuthenticationPrincipal ApplicationUserDetails userDetails) {
        UUID userId;
        if (userDetails != null) {
            userId = userDetails.getUser().getId();
        } else if (request.getGuestId() != null && !request.getGuestId().isBlank()) {
            userId = UUID.fromString(request.getGuestId());
        } else {
            return ResponseEntity.status(401).body("User must be logged in or provide guest ID");
        }

        seatLockService.unlockSeat(request.getTripId(), request.getSeatCode(), userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{tripId}")
    @Operation(summary = "Get seat status for trip", description = "Returns a map of seat codes to status (BOOKED or LOCKED) for a given trip.")
    public ResponseEntity<Map<String, String>> getSeatStatus(@PathVariable UUID tripId) {
        // 1. Get persistent bookings
        Set<String> bookedSeats = bookingRepository.findAllByTripIdAndStatusNot(tripId, BookingStatus.CANCELLED)
                .stream()
                .flatMap(booking -> booking.getTickets().stream())
                .map(ticket -> ticket.getSeatCode())
                .collect(Collectors.toSet());

        // 2. Get temporary locks
        Map<String, UUID> lockedSeats = seatLockService.getLockedSeats(tripId);

        // 3. Merge results (Booked overrides Lock)
        Map<String, String> statusMap = lockedSeats.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> "LOCKED:" + e.getValue()));

        bookedSeats.forEach(seat -> statusMap.put(seat, "BOOKED"));

        return ResponseEntity.ok(statusMap);
    }
}
