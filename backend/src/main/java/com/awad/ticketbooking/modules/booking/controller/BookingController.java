package com.awad.ticketbooking.modules.booking.controller;

import com.awad.ticketbooking.common.config.security.ApplicationUserDetails;
import com.awad.ticketbooking.modules.booking.dto.BookingResponse;
import com.awad.ticketbooking.modules.booking.dto.CreateBookingRequest;
import com.awad.ticketbooking.modules.booking.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Endpoints for creating and managing ticket bookings.")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @Operation(summary = "Create booking", description = "Creates a new booking for a given trip and passenger details.")
    public ResponseEntity<BookingResponse> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(request));
    }

    @PostMapping("/lookup")
    @Operation(summary = "Lookup booking by code and email", description = "Returns booking details given booking code and passenger email.")
    public ResponseEntity<BookingResponse> lookupBooking(
            @Valid @RequestBody com.awad.ticketbooking.modules.booking.dto.BookingLookupRequest request) {
        return ResponseEntity.ok(bookingService.lookupBooking(request.getCode(), request.getEmail()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get booking by ID", description = "Returns detailed information for a single booking.")
    public ResponseEntity<BookingResponse> getBookingById(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    @GetMapping("/user")
    @Operation(summary = "Get current user bookings", description = "Returns a paginated list of bookings for the authenticated user.")
    public ResponseEntity<Page<BookingResponse>> getUserBookings(
            @AuthenticationPrincipal ApplicationUserDetails principal,
            Pageable pageable) {
        if (principal == null) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(bookingService.getUserBookings(principal.getUser().getId(), pageable));
    }

    @GetMapping("/trip/{tripId}/seats")
    @Operation(summary = "Get booked seats for trip", description = "Returns list of seat codes that are booked for a given trip.")
    public ResponseEntity<List<String>> getBookedSeatsForTrip(@PathVariable UUID tripId) {
        return ResponseEntity.ok(bookingService.getBookedSeatsForTrip(tripId));
    }

    @PutMapping("/{id}/confirm")
    @Operation(summary = "Confirm booking", description = "Marks a booking as confirmed after successful payment.")
    public ResponseEntity<BookingResponse> confirmBooking(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.confirmBooking(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BookingResponse> updateBooking(
            @PathVariable UUID id,
            @Valid @RequestBody com.awad.ticketbooking.modules.booking.dto.UpdateBookingRequest request) {
        return ResponseEntity.ok(bookingService.updateBooking(id, request));
    }

    @PutMapping("/{id}/cancel")
    @Operation(summary = "Cancel booking", description = "Cancels an existing booking and releases seats.")
    public ResponseEntity<BookingResponse> cancelBooking(@PathVariable UUID id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }
}
