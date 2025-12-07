package com.awad.ticketbooking.modules.booking.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import com.awad.ticketbooking.modules.booking.dto.CreateBookingRequest;
import com.awad.ticketbooking.modules.booking.dto.TicketRequest;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.entity.Ticket;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.stream.Collectors;

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

        Booking booking = new Booking();
        booking.setTrip(trip);
        booking.setUser(user);
        booking.setPassengerName(request.getPassengerName());
        booking.setPassengerPhone(request.getPassengerPhone());
        booking.setStatus(BookingStatus.PENDING);

        booking.setTickets(request.getTickets().stream()
                .map(ticketReq -> mapTicket(ticketReq, booking))
                .collect(Collectors.toList()));

        BigDecimal calculatedTotal = booking.getTickets().stream()
                .map(Ticket::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        booking.setTotalPrice(calculatedTotal);

        return bookingRepository.save(booking);
    }

    @Transactional
    public Booking confirmBooking(UUID bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(BookingStatus.CONFIRMED);
        return bookingRepository.save(booking);
    }

    private Ticket mapTicket(TicketRequest ticketReq, Booking booking) {
        Ticket ticket = new Ticket();
        ticket.setBooking(booking);
        ticket.setSeatCode(ticketReq.getSeatCode());
        ticket.setPassengerName(ticketReq.getPassengerName());
        ticket.setPassengerPhone(ticketReq.getPassengerPhone());
        ticket.setPrice(ticketReq.getPrice());
        return ticket;
    }
}
