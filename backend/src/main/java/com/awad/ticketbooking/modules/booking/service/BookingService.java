package com.awad.ticketbooking.modules.booking.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import com.awad.ticketbooking.modules.booking.dto.CreateBookingRequest;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final TripRepository tripRepository;
    private final UserRepository userRepository;

    @Transactional
    public Booking createBooking(CreateBookingRequest request) {
        Trip trip = tripRepository.findById(request.getTripId())
                .orElseThrow(() -> new RuntimeException("Trip not found"));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Basic validation: Check if seat is already booked (simplified)
        // In real app, check against existing bookings for this trip and seat

        Booking booking = new Booking();
        booking.setTrip(trip);
        booking.setUser(user);
        booking.setSeatNumber(request.getSeatNumber());
        booking.setPassengerName(request.getPassengerName());
        booking.setPassengerPhone(request.getPassengerPhone());
        booking.setTotalPrice(request.getTotalPrice()); // Should be calculated from TripPricing
        booking.setStatus(BookingStatus.PENDING);

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking confirmBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(BookingStatus.CONFIRMED);
        return bookingRepository.save(booking);
    }
}
