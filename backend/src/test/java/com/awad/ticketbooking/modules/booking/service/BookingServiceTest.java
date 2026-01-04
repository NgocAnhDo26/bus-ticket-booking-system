package com.awad.ticketbooking.modules.booking.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.common.service.EmailService;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import com.awad.ticketbooking.modules.booking.dto.BookingResponse;
import com.awad.ticketbooking.modules.booking.dto.CreateBookingRequest;
import com.awad.ticketbooking.modules.booking.dto.RefundCalculation;
import com.awad.ticketbooking.modules.booking.dto.TicketRequest;
import com.awad.ticketbooking.modules.booking.dto.UpdateBookingRequest;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.entity.Ticket;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.booking.repository.TicketRepository;
import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.entity.BusLayout;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.catalog.repository.StationRepository;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import org.mockito.ArgumentMatchers;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BookingServiceTest {

    @InjectMocks
    private BookingService bookingService;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TicketRepository ticketRepository;

    @Mock
    private StationRepository stationRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private SeatLockService seatLockService;

    private Trip testTrip;
    private User testUser;
    private Booking testBooking;
    private Station originStation;
    private Station destinationStation;

    @BeforeEach
    void setUp() {
        // Setup origin station
        originStation = new Station();
        originStation.setId(UUID.randomUUID());
        originStation.setName("Hanoi Station");
        originStation.setCity("Hanoi");
        originStation.setAddress("123 Main St");

        // Setup destination station
        destinationStation = new Station();
        destinationStation.setId(UUID.randomUUID());
        destinationStation.setName("Saigon Station");
        destinationStation.setCity("Saigon");
        destinationStation.setAddress("456 Main St");

        // Setup route
        Route route = new Route();
        route.setId(UUID.randomUUID());
        route.setOriginStation(originStation);
        route.setDestinationStation(destinationStation);
        route.setDurationMinutes(360);

        // Setup operator
        Operator operator = new Operator();
        operator.setId(UUID.randomUUID());
        operator.setName("Test Operator");

        // Setup bus layout
        BusLayout busLayout = new BusLayout();
        busLayout.setId(UUID.randomUUID());
        busLayout.setTotalSeats(40);

        // Setup bus
        Bus bus = new Bus();
        bus.setId(UUID.randomUUID());
        bus.setPlateNumber("29A-12345");
        bus.setOperator(operator);
        bus.setBusLayout(busLayout);
        bus.setAmenities(Collections.singletonList("wifi"));

        // Setup trip
        testTrip = new Trip();
        testTrip.setId(UUID.randomUUID());
        testTrip.setRoute(route);
        testTrip.setBus(bus);
        testTrip.setDepartureTime(Instant.now().plus(2, ChronoUnit.DAYS));
        testTrip.setArrivalTime(Instant.now().plus(2, ChronoUnit.DAYS).plus(6, ChronoUnit.HOURS));
        testTrip.setTripStops(new ArrayList<>());

        // Setup user
        testUser = User.builder()
                .email("test@example.com")
                .fullName("Test User")
                .build();
        testUser.setId(UUID.randomUUID());

        // Setup booking
        testBooking = new Booking();
        testBooking.setId(UUID.randomUUID());
        testBooking.setCode("BK-ABC123");
        testBooking.setTrip(testTrip);
        testBooking.setUser(testUser);
        testBooking.setPassengerName("Test Passenger");
        testBooking.setPassengerPhone("0123456789");
        testBooking.setPassengerEmail("test@example.com");
        testBooking.setStatus(BookingStatus.PENDING);
        testBooking.setTotalPrice(new BigDecimal("200000"));
        testBooking.setPickupStation(originStation);
        testBooking.setDropoffStation(destinationStation);

        Ticket ticket = new Ticket();
        ticket.setId(UUID.randomUUID());
        ticket.setBooking(testBooking);
        ticket.setSeatCode("A1");
        ticket.setPassengerName("Test Passenger");
        ticket.setPassengerPhone("0123456789");
        ticket.setPrice(new BigDecimal("200000"));
        testBooking.setTickets(new ArrayList<>(Collections.singletonList(ticket)));
    }

    @Test
    void createBooking_success() {
        // Arrange
        CreateBookingRequest request = new CreateBookingRequest();
        request.setTripId(testTrip.getId());
        request.setUserId(testUser.getId());
        request.setPassengerName("Test Passenger");
        request.setPassengerPhone("0123456789");
        request.setPassengerEmail("test@example.com");
        request.setTotalPrice(new BigDecimal("200000"));

        TicketRequest ticketRequest = new TicketRequest();
        ticketRequest.setSeatCode("A1");
        ticketRequest.setPassengerName("Test Passenger");
        ticketRequest.setPassengerPhone("0123456789");
        ticketRequest.setPrice(new BigDecimal("200000"));
        request.setTickets(Collections.singletonList(ticketRequest));

        when(tripRepository.findById(request.getTripId())).thenReturn(Optional.of(testTrip));
        when(userRepository.findById(request.getUserId())).thenReturn(Optional.of(testUser));
        when(ticketRepository.findBookedSeatCodesByTripId(request.getTripId())).thenReturn(Collections.emptyList());
        when(ticketRepository.findByBookingTripIdAndSeatCodeIn(any(), anyList())).thenReturn(Collections.emptyList());
        when(bookingRepository.findByCode(anyString())).thenReturn(Optional.empty());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(UUID.randomUUID());
            return b;
        });

        // Act
        BookingResponse response = bookingService.createBooking(request);

        // Assert
        assertNotNull(response);
        assertEquals("Test Passenger", response.getPassengerName());
        verify(bookingRepository).save(any(Booking.class));
        verify(seatLockService).markSeatsAsBooked(eq(testTrip.getId()), anyList());
    }

    @Test
    void createBooking_tripNotFound_throwsException() {
        // Arrange
        CreateBookingRequest request = new CreateBookingRequest();
        request.setTripId(UUID.randomUUID());

        when(tripRepository.findById(request.getTripId())).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.createBooking(request));
        assertEquals("Trip not found", exception.getMessage());
    }

    @Test
    void createBooking_seatAlreadyBooked_throwsException() {
        // Arrange
        CreateBookingRequest request = new CreateBookingRequest();
        request.setTripId(testTrip.getId());
        request.setPassengerName("Test Passenger");
        request.setPassengerPhone("0123456789");
        request.setTotalPrice(new BigDecimal("200000"));

        TicketRequest ticketRequest = new TicketRequest();
        ticketRequest.setSeatCode("A1");
        ticketRequest.setPassengerName("Test Passenger");
        ticketRequest.setPassengerPhone("0123456789");
        ticketRequest.setPrice(new BigDecimal("200000"));
        request.setTickets(Collections.singletonList(ticketRequest));

        // Create a conflicting ticket from another user's CONFIRMED booking
        Booking otherBooking = new Booking();
        otherBooking.setId(UUID.randomUUID());
        otherBooking.setStatus(BookingStatus.CONFIRMED);
        otherBooking.setUser(null); // Different user

        Ticket conflictingTicket = new Ticket();
        conflictingTicket.setId(UUID.randomUUID());
        conflictingTicket.setSeatCode("A1");
        conflictingTicket.setBooking(otherBooking);

        when(tripRepository.findById(request.getTripId())).thenReturn(Optional.of(testTrip));
        when(ticketRepository.findBookedSeatCodesByTripId(request.getTripId())).thenReturn(Collections.singletonList("A1"));
        when(ticketRepository.findByBookingTripIdAndSeatCodeIn(any(), anyList()))
                .thenReturn(Collections.singletonList(conflictingTicket));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.createBooking(request));
        assertTrue(exception.getMessage().contains("already booked"));
    }

    @Test
    void confirmBooking_success() {
        // Arrange
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);
        when(bookingRepository.findByIdWithFullDetails(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act
        BookingResponse response = bookingService.confirmBooking(testBooking.getId());

        // Assert
        assertNotNull(response);
        verify(bookingRepository).save(any(Booking.class));
        verify(emailService).sendBookingConfirmationEmail(any(Booking.class), anyString());
    }

    @Test
    void confirmBooking_notPending_throwsException() {
        // Arrange
        testBooking.setStatus(BookingStatus.CONFIRMED);
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.confirmBooking(testBooking.getId()));
        assertEquals("Only pending bookings can be confirmed", exception.getMessage());
    }

    @Test
    void cancelBooking_success() {
        // Arrange
        testBooking.setStatus(BookingStatus.PENDING);
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        // Act
        BookingResponse response = bookingService.cancelBooking(testBooking.getId());

        // Assert
        assertNotNull(response);
        verify(seatLockService).unlockSeatsForBooking(eq(testTrip.getId()), anyList());
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void cancelBooking_alreadyCancelled_throwsException() {
        // Arrange
        testBooking.setStatus(BookingStatus.CANCELLED);
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.cancelBooking(testBooking.getId()));
        assertEquals("Booking is already cancelled", exception.getMessage());
    }

    @Test
    void refundBooking_success() {
        // Arrange
        testBooking.setStatus(BookingStatus.CONFIRMED);
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        // Act
        BookingResponse response = bookingService.refundBooking(testBooking.getId());

        // Assert
        assertNotNull(response);
        verify(seatLockService).unlockSeatsForBooking(eq(testTrip.getId()), anyList());
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void refundBooking_alreadyRefunded_throwsException() {
        // Arrange
        testBooking.setStatus(BookingStatus.REFUNDED);
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.refundBooking(testBooking.getId()));
        assertEquals("Booking is already refunded", exception.getMessage());
    }

    @Test
    void calculateRefund_refundableMoreThan24h() {
        // Arrange - Trip is 2 days from now (more than 24h)
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act
        RefundCalculation refund = bookingService.calculateRefund(testBooking.getId());

        // Assert
        assertNotNull(refund);
        assertTrue(refund.isRefundable());
        assertEquals(100.0, refund.getRefundPercentage());
        assertEquals(testBooking.getTotalPrice(), refund.getRefundAmount());
    }

    @Test
    void calculateRefund_notRefundableWithin24h() {
        // Arrange - Trip departs in 12 hours (less than 24h)
        testTrip.setDepartureTime(Instant.now().plus(12, ChronoUnit.HOURS));
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act
        RefundCalculation refund = bookingService.calculateRefund(testBooking.getId());

        // Assert
        assertNotNull(refund);
        assertFalse(refund.isRefundable());
        assertEquals(0.0, refund.getRefundPercentage());
        assertEquals(BigDecimal.ZERO, refund.getRefundAmount());
    }

    @Test
    void lookupBooking_success() {
        // Arrange
        when(bookingRepository.findByCode("BK-ABC123")).thenReturn(Optional.of(testBooking));

        // Act
        BookingResponse response = bookingService.lookupBooking("BK-ABC123", "test@example.com");

        // Assert
        assertNotNull(response);
        assertEquals("BK-ABC123", response.getCode());
    }

    @Test
    void lookupBooking_emailMismatch_throwsException() {
        // Arrange
        when(bookingRepository.findByCode("BK-ABC123")).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.lookupBooking("BK-ABC123", "wrong@example.com"));
        assertTrue(exception.getMessage().contains("not found or email does not match"));
    }

    @Test
    void getBookingById_success() {
        // Arrange
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act
        BookingResponse response = bookingService.getBookingById(testBooking.getId());

        // Assert
        assertNotNull(response);
        assertEquals(testBooking.getId(), response.getId());
    }

    @Test
    void getUserBookings_success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Booking> page = new PageImpl<>(Collections.singletonList(testBooking));
        when(bookingRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId(), pageable)).thenReturn(page);

        // Act
        Page<BookingResponse> response = bookingService.getUserBookings(testUser.getId(), pageable);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
    }

    @Test
    void checkInBooking_success() {
        // Arrange
        testBooking.setStatus(BookingStatus.CONFIRMED);
        testBooking.getTickets().get(0).setBoarded(false);
        when(bookingRepository.findByCode("BK-ABC123")).thenReturn(Optional.of(testBooking));
        when(ticketRepository.saveAll(anyList())).thenReturn(testBooking.getTickets());

        // Act
        BookingResponse response = bookingService.checkInBooking("BK-ABC123");

        // Assert
        assertNotNull(response);
        verify(ticketRepository).saveAll(anyList());
    }

    @Test
    void checkInBooking_invalidStatus_throwsException() {
        // Arrange
        testBooking.setStatus(BookingStatus.PENDING);
        when(bookingRepository.findByCode("BK-ABC123")).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.checkInBooking("BK-ABC123"));
        assertTrue(exception.getMessage().contains("INVALID_STATUS"));
    }

    @Test
    void checkInBooking_alreadyCheckedIn_throwsException() {
        // Arrange
        testBooking.setStatus(BookingStatus.CONFIRMED);
        testBooking.getTickets().get(0).setBoarded(true);
        when(bookingRepository.findByCode("BK-ABC123")).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.checkInBooking("BK-ABC123"));
        assertTrue(exception.getMessage().contains("ALREADY_CHECKED_IN"));
    }

    @Test
    void getBookedSeatsForTrip_success() {
        // Arrange
        List<String> bookedSeats = List.of("A1", "A2", "B1");
        when(ticketRepository.findBookedSeatCodesByTripId(testTrip.getId())).thenReturn(bookedSeats);

        // Act
        List<String> result = bookingService.getBookedSeatsForTrip(testTrip.getId());

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        assertTrue(result.contains("A1"));
    }

    @Test
    void updateBooking_success() {
        // Arrange
        testBooking.setStatus(BookingStatus.PENDING);
        UpdateBookingRequest request = new UpdateBookingRequest();
        request.setPassengerName("Updated Passenger");
        request.setPassengerPhone("0987654321");
        request.setPassengerEmail("updated@example.com");

        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));
        when(ticketRepository.findByBookingTripIdAndSeatCodeIn(any(), anyList())).thenReturn(Collections.emptyList());
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        // Act
        BookingResponse response = bookingService.updateBooking(testBooking.getId(), request);

        // Assert
        assertNotNull(response);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void updateBooking_notPending_throwsException() {
        // Arrange
        testBooking.setStatus(BookingStatus.CONFIRMED);
        UpdateBookingRequest request = new UpdateBookingRequest();
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.updateBooking(testBooking.getId(), request));
        assertEquals("Only pending bookings can be updated", exception.getMessage());
    }

    @Test
    void updateBooking_withSeatConflict_throwsException() {
        // Arrange
        testBooking.setStatus(BookingStatus.PENDING);
        UpdateBookingRequest request = new UpdateBookingRequest();
        TicketRequest ticketRequest = new TicketRequest();
        ticketRequest.setSeatCode("A2");
        request.setTickets(Collections.singletonList(ticketRequest));

        Booking otherBooking = new Booking();
        otherBooking.setId(UUID.randomUUID());
        Ticket conflictingTicket = new Ticket();
        conflictingTicket.setSeatCode("A2");
        conflictingTicket.setBooking(otherBooking);

        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));
        when(ticketRepository.findByBookingTripIdAndSeatCodeIn(any(), anyList()))
                .thenReturn(Collections.singletonList(conflictingTicket));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.updateBooking(testBooking.getId(), request));
        assertTrue(exception.getMessage().contains("already booked"));
    }

    @Test
    void checkInPassenger_success() {
        // Arrange
        Ticket ticket = testBooking.getTickets().get(0);
        ticket.setBoarded(false);
        when(ticketRepository.findById(ticket.getId())).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenReturn(ticket);

        // Act
        BookingResponse response = bookingService.checkInPassenger(ticket.getId());

        // Assert
        assertNotNull(response);
        verify(ticketRepository).save(any(Ticket.class));
    }

    @Test
    void checkInPassenger_ticketNotFound_throwsException() {
        // Arrange
        UUID ticketId = UUID.randomUUID();
        when(ticketRepository.findById(ticketId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.checkInPassenger(ticketId));
        assertEquals("Ticket not found", exception.getMessage());
    }

    @Test
    void getAdminBookings_success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Booking> page = new PageImpl<>(Collections.singletonList(testBooking));
        when(bookingRepository.findAll(ArgumentMatchers.<org.springframework.data.jpa.domain.Specification<Booking>>any(), eq(pageable))).thenReturn(page);

        // Act
        Page<BookingResponse> response = bookingService.getAdminBookings(
                null, null, null, null, pageable);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getTotalElements());
    }

    @Test
    void createBooking_withSelfConflict_updatePendingBooking() {
        // Arrange
        CreateBookingRequest request = new CreateBookingRequest();
        request.setTripId(testTrip.getId());
        request.setUserId(testUser.getId());
        request.setPassengerName("Test Passenger");
        request.setPassengerPhone("0123456789");
        request.setPassengerEmail("test@example.com");

        TicketRequest ticketRequest = new TicketRequest();
        ticketRequest.setSeatCode("A1");
        ticketRequest.setPassengerName("Test Passenger");
        ticketRequest.setPassengerPhone("0123456789");
        ticketRequest.setPrice(new BigDecimal("200000"));
        request.setTickets(Collections.singletonList(ticketRequest));

        // Create a pending booking from the same user with same seats
        Booking existingBooking = new Booking();
        existingBooking.setId(UUID.randomUUID());
        existingBooking.setStatus(BookingStatus.PENDING);
        existingBooking.setUser(testUser);
        existingBooking.setTrip(testTrip);
        Ticket existingTicket = new Ticket();
        existingTicket.setSeatCode("A1");
        existingTicket.setBooking(existingBooking);
        existingBooking.setTickets(Collections.singletonList(existingTicket));

        when(tripRepository.findById(request.getTripId())).thenReturn(Optional.of(testTrip));
        when(userRepository.findById(request.getUserId())).thenReturn(Optional.of(testUser));
        when(ticketRepository.findBookedSeatCodesByTripId(request.getTripId())).thenReturn(Collections.emptyList());
        when(ticketRepository.findByBookingTripIdAndSeatCodeIn(any(), anyList()))
                .thenReturn(Collections.singletonList(existingTicket));
        when(bookingRepository.save(any(Booking.class))).thenReturn(existingBooking);

        // Act
        BookingResponse response = bookingService.createBooking(request);

        // Assert
        assertNotNull(response);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void createBooking_withPickupDropoffTripStopIds() {
        // Arrange
        CreateBookingRequest request = new CreateBookingRequest();
        request.setTripId(testTrip.getId());
        request.setUserId(testUser.getId());
        request.setPassengerName("Test Passenger");
        request.setPassengerPhone("0123456789");
        request.setPassengerEmail("test@example.com");

        com.awad.ticketbooking.modules.trip.entity.TripStop pickupStop = new com.awad.ticketbooking.modules.trip.entity.TripStop();
        pickupStop.setId(UUID.randomUUID());
        pickupStop.setStopOrder(1);
        pickupStop.setStation(originStation);

        com.awad.ticketbooking.modules.trip.entity.TripStop dropoffStop = new com.awad.ticketbooking.modules.trip.entity.TripStop();
        dropoffStop.setId(UUID.randomUUID());
        dropoffStop.setStopOrder(2);
        dropoffStop.setStation(destinationStation);

        testTrip.setTripStops(List.of(pickupStop, dropoffStop));
        request.setPickupTripStopId(pickupStop.getId());
        request.setDropoffTripStopId(dropoffStop.getId());

        TicketRequest ticketRequest = new TicketRequest();
        ticketRequest.setSeatCode("A1");
        ticketRequest.setPassengerName("Test Passenger");
        ticketRequest.setPassengerPhone("0123456789");
        ticketRequest.setPrice(new BigDecimal("200000"));
        request.setTickets(Collections.singletonList(ticketRequest));

        when(tripRepository.findById(request.getTripId())).thenReturn(Optional.of(testTrip));
        when(userRepository.findById(request.getUserId())).thenReturn(Optional.of(testUser));
        when(ticketRepository.findBookedSeatCodesByTripId(request.getTripId())).thenReturn(Collections.emptyList());
        when(ticketRepository.findByBookingTripIdAndSeatCodeIn(any(), anyList())).thenReturn(Collections.emptyList());
        when(bookingRepository.findByCode(anyString())).thenReturn(Optional.empty());
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking b = invocation.getArgument(0);
            b.setId(UUID.randomUUID());
            return b;
        });

        // Act
        BookingResponse response = bookingService.createBooking(request);

        // Assert
        assertNotNull(response);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    void cancelBooking_confirmedWithRefund() {
        // Arrange
        testBooking.setStatus(BookingStatus.CONFIRMED);
        testTrip.setDepartureTime(Instant.now().plus(48, ChronoUnit.HOURS)); // More than 24h
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenReturn(testBooking);

        // Act
        BookingResponse response = bookingService.cancelBooking(testBooking.getId());

        // Assert
        assertNotNull(response);
        verify(seatLockService).unlockSeatsForBooking(eq(testTrip.getId()), anyList());
    }

    @Test
    void cancelBooking_confirmedDeparted_throwsException() {
        // Arrange
        testBooking.setStatus(BookingStatus.CONFIRMED);
        testTrip.setDepartureTime(Instant.now().minus(1, ChronoUnit.HOURS)); // Already departed
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.cancelBooking(testBooking.getId()));
        assertTrue(exception.getMessage().contains("departed"));
    }

    @Test
    void refundBooking_pending_throwsException() {
        // Arrange
        testBooking.setStatus(BookingStatus.PENDING);
        when(bookingRepository.findById(testBooking.getId())).thenReturn(Optional.of(testBooking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.refundBooking(testBooking.getId()));
        assertEquals("Cannot refund a pending booking", exception.getMessage());
    }

    @Test
    void getBookingById_notFound_throwsException() {
        // Arrange
        UUID bookingId = UUID.randomUUID();
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.getBookingById(bookingId));
        assertEquals("Booking not found", exception.getMessage());
    }

    @Test
    void lookupBooking_notFound_throwsException() {
        // Arrange
        when(bookingRepository.findByCode("INVALID")).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> bookingService.lookupBooking("INVALID", "test@example.com"));
        assertEquals("Booking not found", exception.getMessage());
    }
}
