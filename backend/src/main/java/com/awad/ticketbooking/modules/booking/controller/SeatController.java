package com.awad.ticketbooking.modules.booking.controller;

import com.awad.ticketbooking.common.config.security.ApplicationUserDetails;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.booking.dto.LockSeatRequest;
import com.awad.ticketbooking.modules.booking.service.SeatLockService;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
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
public class SeatController {

    private final SeatLockService seatLockService;
    private final BookingRepository bookingRepository;
    private final TripRepository tripRepository; // To validate trip exists

    @PostMapping("/lock")
    public ResponseEntity<?> lockSeat(@Valid @RequestBody LockSeatRequest request, 
                                      @AuthenticationPrincipal ApplicationUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        
        // Check if seat is already booked (persistent check)
        // This requires a method in BookingRepository to check seat availability for a trip
        boolean isBooked = bookingRepository.existsByTripIdAndTicketsSeatCodeAndStatusNot(
                request.getTripId(), request.getSeatCode(), BookingStatus.CANCELLED);
        
        if (isBooked) {
            return ResponseEntity.badRequest().body("Seat is already booked");
        }

        boolean locked = seatLockService.lockSeat(request.getTripId(), request.getSeatCode(), user.getId());
        if (locked) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(409).body("Seat is currently locked by another user");
        }
    }

    @PostMapping("/unlock")
    public ResponseEntity<?> unlockSeat(@Valid @RequestBody LockSeatRequest request, 
                                        @AuthenticationPrincipal ApplicationUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userDetails.getUser();
        seatLockService.unlockSeat(request.getTripId(), request.getSeatCode(), user.getId());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{tripId}")
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

