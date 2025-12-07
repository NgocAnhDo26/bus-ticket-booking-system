package com.awad.ticketbooking.modules.booking.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.common.service.EmailService;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import com.awad.ticketbooking.modules.booking.dto.BookingResponse;
import com.awad.ticketbooking.modules.booking.dto.CreateBookingRequest;
import com.awad.ticketbooking.modules.booking.dto.TicketRequest;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.entity.Ticket;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.booking.repository.TicketRepository;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

        private final BookingRepository bookingRepository;
        private final TripRepository tripRepository;
        private final UserRepository userRepository;
        private final TicketRepository ticketRepository;
        private final EmailService emailService;

        @Transactional
        public BookingResponse createBooking(CreateBookingRequest request) {
                Trip trip = tripRepository.findById(request.getTripId())
                                .orElseThrow(() -> new RuntimeException("Trip not found"));

                User user = userRepository.findById(request.getUserId())
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Validate seats are not already booked
                List<String> bookedSeats = ticketRepository.findBookedSeatCodesByTripId(request.getTripId());
                List<String> requestedSeats = request.getTickets().stream()
                                .map(TicketRequest::getSeatCode)
                                .collect(Collectors.toList());

                for (String seatCode : requestedSeats) {
                        if (bookedSeats.contains(seatCode)) {
                                throw new RuntimeException("Seat " + seatCode + " is already booked");
                        }
                }

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

                Booking savedBooking = bookingRepository.save(booking);

                // Send confirmation email asynchronously
                emailService.sendBookingConfirmationEmail(savedBooking, user.getEmail());

                return toBookingResponse(savedBooking);
        }

        @Transactional(readOnly = true)
        public BookingResponse getBookingById(UUID bookingId) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));
                return toBookingResponse(booking);
        }

        @Transactional(readOnly = true)
        public Page<BookingResponse> getUserBookings(UUID userId, Pageable pageable) {
                return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable)
                                .map(this::toBookingResponse);
        }

        @Transactional(readOnly = true)
        public List<String> getBookedSeatsForTrip(UUID tripId) {
                return ticketRepository.findBookedSeatCodesByTripId(tripId);
        }

        @Transactional
        public BookingResponse confirmBooking(UUID bookingId) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                if (booking.getStatus() != BookingStatus.PENDING) {
                        throw new RuntimeException("Only pending bookings can be confirmed");
                }

                booking.setStatus(BookingStatus.CONFIRMED);
                return toBookingResponse(bookingRepository.save(booking));
        }

        @Transactional
        public BookingResponse cancelBooking(UUID bookingId) {
                Booking booking = bookingRepository.findById(bookingId)
                                .orElseThrow(() -> new RuntimeException("Booking not found"));

                if (booking.getStatus() == BookingStatus.CANCELLED) {
                        throw new RuntimeException("Booking is already cancelled");
                }

                if (booking.getStatus() == BookingStatus.CONFIRMED) {
                        // Check if trip hasn't departed yet
                        if (booking.getTrip().getDepartureTime().isBefore(java.time.Instant.now())) {
                                throw new RuntimeException("Cannot cancel booking for departed trip");
                        }
                }

                booking.setStatus(BookingStatus.CANCELLED);
                return toBookingResponse(bookingRepository.save(booking));
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

        private BookingResponse toBookingResponse(Booking booking) {
                Trip trip = booking.getTrip();

                return BookingResponse.builder()
                                .id(booking.getId())
                                .status(booking.getStatus())
                                .totalPrice(booking.getTotalPrice())
                                .passengerName(booking.getPassengerName())
                                .passengerPhone(booking.getPassengerPhone())
                                .createdAt(booking.getCreatedAt())
                                .updatedAt(booking.getUpdatedAt())
                                .trip(BookingResponse.TripInfo.builder()
                                                .id(trip.getId())
                                                .departureTime(trip.getDepartureTime())
                                                .arrivalTime(trip.getArrivalTime())
                                                .route(BookingResponse.RouteInfo.builder()
                                                                .id(trip.getRoute().getId())
                                                                .originStation(BookingResponse.StationInfo.builder()
                                                                                .id(trip.getRoute().getOriginStation()
                                                                                                .getId())
                                                                                .name(trip.getRoute().getOriginStation()
                                                                                                .getName())
                                                                                .city(trip.getRoute().getOriginStation()
                                                                                                .getCity())
                                                                                .address(trip.getRoute()
                                                                                                .getOriginStation()
                                                                                                .getAddress())
                                                                                .build())
                                                                .destinationStation(BookingResponse.StationInfo
                                                                                .builder()
                                                                                .id(trip.getRoute()
                                                                                                .getDestinationStation()
                                                                                                .getId())
                                                                                .name(trip.getRoute()
                                                                                                .getDestinationStation()
                                                                                                .getName())
                                                                                .city(trip.getRoute()
                                                                                                .getDestinationStation()
                                                                                                .getCity())
                                                                                .address(trip.getRoute()
                                                                                                .getDestinationStation()
                                                                                                .getAddress())
                                                                                .build())
                                                                .durationMinutes(trip.getRoute().getDurationMinutes())
                                                                .build())
                                                .bus(BookingResponse.BusInfo.builder()
                                                                .id(trip.getBus().getId())
                                                                .plateNumber(trip.getBus().getPlateNumber())
                                                                .operatorName(trip.getBus().getOperator().getName())
                                                                .amenities(trip.getBus().getAmenities())
                                                                .build())
                                                .build())
                                .tickets(booking.getTickets().stream()
                                                .map(ticket -> BookingResponse.TicketInfo.builder()
                                                                .id(ticket.getId())
                                                                .seatCode(ticket.getSeatCode())
                                                                .passengerName(ticket.getPassengerName())
                                                                .passengerPhone(ticket.getPassengerPhone())
                                                                .price(ticket.getPrice())
                                                                .build())
                                                .collect(Collectors.toList()))
                                .build();
        }
}
