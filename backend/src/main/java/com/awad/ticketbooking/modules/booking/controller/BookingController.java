package com.awad.ticketbooking.modules.booking.controller;

import com.awad.ticketbooking.modules.booking.dto.CreateBookingRequest;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<Booking> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(request));
    }

    @org.springframework.web.bind.annotation.PutMapping("/{id}/confirm")
    public ResponseEntity<Booking> confirmBooking(
            @org.springframework.web.bind.annotation.PathVariable java.util.UUID id) {
        return ResponseEntity.ok(bookingService.confirmBooking(id));
    }
}
