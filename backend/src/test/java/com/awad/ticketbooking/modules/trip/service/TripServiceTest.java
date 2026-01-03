package com.awad.ticketbooking.modules.trip.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.common.enums.StopType;
import com.awad.ticketbooking.common.enums.TripStatus;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.booking.repository.TicketRepository;
import com.awad.ticketbooking.modules.booking.service.BookingService;
import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.entity.BusLayout;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.catalog.repository.BusRepository;
import com.awad.ticketbooking.modules.catalog.repository.RouteRepository;
import com.awad.ticketbooking.modules.catalog.repository.StationRepository;
import com.awad.ticketbooking.modules.trip.dto.CreateTripRequest;
import com.awad.ticketbooking.modules.trip.dto.SearchTripRequest;
import com.awad.ticketbooking.modules.trip.dto.TripResponse;
import com.awad.ticketbooking.modules.trip.dto.TripStopDto;
import com.awad.ticketbooking.modules.trip.dto.UpdateTripStopsRequest;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.awad.ticketbooking.modules.trip.repository.TripPricingRepository;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
import com.awad.ticketbooking.modules.trip.repository.TripScheduleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.data.jpa.domain.Specification;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import org.mockito.ArgumentMatchers;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TripServiceTest {

    @Mock
    private TripRepository tripRepository;
    @Mock
    private TripPricingRepository tripPricingRepository;
    @Mock
    private BusRepository busRepository;
    @Mock
    private RouteRepository routeRepository;
    @Mock
    private StationRepository stationRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private TicketRepository ticketRepository;
    @Mock
    private TripScheduleRepository tripScheduleRepository;
    @Mock
    private BookingService bookingService;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private TripService tripService;

    private Trip testTrip;
    private Bus testBus;
    private Route testRoute;
    private Station originStation;
    private Station destinationStation;

    @BeforeEach
    void setUp() {
        originStation = new Station();
        originStation.setId(UUID.randomUUID());
        originStation.setName("Hanoi Station");
        originStation.setCity("Hanoi");

        destinationStation = new Station();
        destinationStation.setId(UUID.randomUUID());
        destinationStation.setName("Saigon Station");
        destinationStation.setCity("Saigon");

        Operator operator = new Operator();
        operator.setId(UUID.randomUUID());
        operator.setName("Test Operator");

        BusLayout layout = new BusLayout();
        layout.setId(UUID.randomUUID());
        layout.setTotalSeats(40);

        testBus = new Bus();
        testBus.setId(UUID.randomUUID());
        testBus.setPlateNumber("29A-12345");
        testBus.setOperator(operator);
        testBus.setBusLayout(layout);
        testBus.setAmenities(Collections.singletonList("wifi"));

        testRoute = new Route();
        testRoute.setId(UUID.randomUUID());
        testRoute.setOriginStation(originStation);
        testRoute.setDestinationStation(destinationStation);
        testRoute.setDurationMinutes(360);
        testRoute.setStops(new ArrayList<>());

        testTrip = new Trip();
        testTrip.setId(UUID.randomUUID());
        testTrip.setRoute(testRoute);
        testTrip.setBus(testBus);
        testTrip.setDepartureTime(Instant.now().plusSeconds(3600));
        testTrip.setArrivalTime(Instant.now().plusSeconds(7200));
        testTrip.setStatus(TripStatus.SCHEDULED);
        testTrip.setTripStops(new ArrayList<>());
        testTrip.setTripPricings(new ArrayList<>());
    }

    @Test
    void searchTrips_shouldReturnTrips() {
        // Arrange
        SearchTripRequest request = new SearchTripRequest();
        request.setOrigin("Hanoi");
        request.setDestination("Saigon");

        // Mock Trip Entity
        Trip trip = new Trip();
        trip.setId(UUID.randomUUID());
        trip.setDepartureTime(Instant.now());
        trip.setArrivalTime(Instant.now().plusSeconds(3600));

        Station origin = new Station();
        origin.setCity("Hanoi");

        Station dest = new Station();
        dest.setCity("Saigon");

        Route route = new Route();
        route.setOriginStation(origin);
        route.setDestinationStation(dest);
        route.setDurationMinutes(60);
        trip.setRoute(route);

        Operator operator = new Operator();
        operator.setName("Test Operator");

        Bus bus = new Bus();
        BusLayout layout = new BusLayout();
        layout.setId(UUID.randomUUID());
        layout.setTotalSeats(40);
        bus.setBusLayout(layout);
        bus.setOperator(operator);
        bus.setPlateNumber("29A-12345");
        bus.setAmenities(Collections.singletonList("wifi"));
        trip.setBus(bus);

        Page<Trip> page = new PageImpl<>(Collections.singletonList(trip));
        when(tripRepository.findAll(ArgumentMatchers.<Specification<Trip>>any(), any(Pageable.class))).thenReturn(page);

        // Act
        Page<TripResponse> result = tripService.searchTrips(request);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Hanoi", result.getContent().get(0).getRoute().getOriginStation().getCity());

        verify(tripRepository).findAll(ArgumentMatchers.<Specification<Trip>>any(), any(Pageable.class));
    }

    @Test
    void getTripById_shouldReturnTrip() {
        // Arrange
        UUID tripId = UUID.randomUUID();
        Trip trip = new Trip();
        trip.setId(tripId);
        trip.setDepartureTime(Instant.now());
        trip.setArrivalTime(Instant.now().plusSeconds(3600));

        Station origin = new Station();
        origin.setCity("Hanoi");

        Station dest = new Station();
        dest.setCity("Saigon");

        Route route = new Route();
        route.setOriginStation(origin);
        route.setDestinationStation(dest);
        route.setDurationMinutes(60);
        trip.setRoute(route);

        Operator operator = new Operator();
        operator.setName("Test Operator");

        Bus bus = new Bus();
        BusLayout layout = new BusLayout();
        layout.setId(UUID.randomUUID());
        layout.setTotalSeats(40);
        bus.setBusLayout(layout);
        bus.setOperator(operator);
        bus.setPlateNumber("29A-12345");
        bus.setAmenities(Collections.singletonList("wifi"));
        trip.setBus(bus);

        when(tripRepository.findById(tripId)).thenReturn(java.util.Optional.of(trip));

        // Act
        TripResponse result = tripService.getTripById(tripId);

        // Assert
        assertNotNull(result);
        assertEquals(tripId, result.getId());
        assertEquals("Hanoi", result.getRoute().getOriginStation().getCity());

        verify(tripRepository).findById(tripId);
    }

    @Test
    void createTrip_success() {
        // Arrange
        CreateTripRequest request = new CreateTripRequest();
        request.setRouteId(testRoute.getId());
        request.setBusId(testBus.getId());
        request.setDepartureTime(Instant.now().plusSeconds(3600));
        request.setArrivalTime(Instant.now().plusSeconds(7200));
        request.setTripType("ONE_TIME");

        when(routeRepository.findById(testRoute.getId())).thenReturn(Optional.of(testRoute));
        when(busRepository.findById(testBus.getId())).thenReturn(Optional.of(testBus));
        when(tripRepository.existsByBusIdAndDepartureTimeLessThanAndArrivalTimeGreaterThan(
                any(), any(), any())).thenReturn(false);
        when(tripRepository.save(any(Trip.class))).thenAnswer(invocation -> {
            Trip t = invocation.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        // Act
        TripResponse result = tripService.createTrip(request);

        // Assert
        assertNotNull(result);
        verify(tripRepository).save(any(Trip.class));
    }

    @Test
    void createTrip_routeNotFound_throwsException() {
        // Arrange
        CreateTripRequest request = new CreateTripRequest();
        request.setRouteId(UUID.randomUUID());
        when(routeRepository.findById(request.getRouteId())).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> tripService.createTrip(request));
        assertTrue(exception.getMessage().contains("Route not found"));
    }

    @Test
    void createTrip_busConflict_throwsException() {
        // Arrange
        CreateTripRequest request = new CreateTripRequest();
        request.setRouteId(testRoute.getId());
        request.setBusId(testBus.getId());
        request.setDepartureTime(Instant.now().plusSeconds(3600));
        request.setArrivalTime(Instant.now().plusSeconds(7200));

        when(routeRepository.findById(testRoute.getId())).thenReturn(Optional.of(testRoute));
        when(busRepository.findById(testBus.getId())).thenReturn(Optional.of(testBus));
        when(tripRepository.existsByBusIdAndDepartureTimeLessThanAndArrivalTimeGreaterThan(
                any(), any(), any())).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> tripService.createTrip(request));
        assertTrue(exception.getMessage().contains("already assigned"));
    }

    @Test
    void updateTrip_success() {
        // Arrange
        CreateTripRequest request = new CreateTripRequest();
        request.setRouteId(testRoute.getId());
        request.setBusId(testBus.getId());
        request.setDepartureTime(Instant.now().plusSeconds(3600));
        request.setArrivalTime(Instant.now().plusSeconds(7200));

        when(tripRepository.findById(testTrip.getId())).thenReturn(Optional.of(testTrip));
        when(bookingRepository.existsByTripId(testTrip.getId())).thenReturn(false);
        when(busRepository.findById(testBus.getId())).thenReturn(Optional.of(testBus));
        when(routeRepository.findById(testRoute.getId())).thenReturn(Optional.of(testRoute));
        when(tripRepository.existsByBusIdAndDepartureTimeLessThanAndArrivalTimeGreaterThanAndIdNot(
                any(), any(), any(), any())).thenReturn(false);
        when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

        // Act
        TripResponse result = tripService.updateTrip(testTrip.getId(), request);

        // Assert
        assertNotNull(result);
        verify(tripRepository).save(any(Trip.class));
    }

    @Test
    void updateTrip_hasBookings_throwsException() {
        // Arrange
        CreateTripRequest request = new CreateTripRequest();
        when(tripRepository.findById(testTrip.getId())).thenReturn(Optional.of(testTrip));
        when(bookingRepository.existsByTripId(testTrip.getId())).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> tripService.updateTrip(testTrip.getId(), request));
        assertTrue(exception.getMessage().contains("existing bookings"));
    }

    @Test
    void deleteTrip_withoutForce_noActiveBookings() {
        // Arrange
        when(tripRepository.findById(testTrip.getId())).thenReturn(Optional.of(testTrip));
        when(bookingRepository.findByTripId(testTrip.getId())).thenReturn(Collections.emptyList());
        when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

        // Act
        assertDoesNotThrow(() -> tripService.deleteTrip(testTrip.getId(), false));

        // Assert
        verify(tripRepository).save(any(Trip.class));
        assertEquals(TripStatus.CANCELLED, testTrip.getStatus());
    }

    @Test
    void deleteTrip_withoutForce_hasActiveBookings_throwsException() {
        // Arrange
        Booking booking = new Booking();
        booking.setStatus(BookingStatus.CONFIRMED);
        when(tripRepository.findById(testTrip.getId())).thenReturn(Optional.of(testTrip));
        when(bookingRepository.findByTripId(testTrip.getId())).thenReturn(Collections.singletonList(booking));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> tripService.deleteTrip(testTrip.getId(), false));
        assertTrue(exception.getMessage().contains("active bookings"));
    }

    @Test
    void deleteTrip_withForce_refundsConfirmedBookings() {
        // Arrange
        Booking confirmedBooking = new Booking();
        confirmedBooking.setId(UUID.randomUUID());
        confirmedBooking.setStatus(BookingStatus.CONFIRMED);
        confirmedBooking.setTrip(testTrip);

        Booking pendingBooking = new Booking();
        pendingBooking.setId(UUID.randomUUID());
        pendingBooking.setStatus(BookingStatus.PENDING);
        pendingBooking.setTrip(testTrip);

        when(tripRepository.findById(testTrip.getId())).thenReturn(Optional.of(testTrip));
        when(bookingRepository.findByTripId(testTrip.getId())).thenReturn(List.of(confirmedBooking, pendingBooking));
        when(bookingService.refundBooking(confirmedBooking.getId())).thenReturn(null);
        when(bookingService.cancelBooking(pendingBooking.getId())).thenReturn(null);
        when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

        // Act
        assertDoesNotThrow(() -> tripService.deleteTrip(testTrip.getId(), true));

        // Assert
        verify(bookingService).refundBooking(confirmedBooking.getId());
        verify(bookingService).cancelBooking(pendingBooking.getId());
    }

    @Test
    void updateTripStops_success() {
        // Arrange
        UpdateTripStopsRequest request = new UpdateTripStopsRequest();
        TripStopDto stopDto = new TripStopDto();
        stopDto.setStationId(originStation.getId());
        stopDto.setStopOrder(1);
        stopDto.setDurationMinutesFromOrigin(60);
        stopDto.setStopType(StopType.BOTH);
        request.setStops(Collections.singletonList(stopDto));

        when(tripRepository.findById(testTrip.getId())).thenReturn(Optional.of(testTrip));
        when(stationRepository.existsById(originStation.getId())).thenReturn(true);
        when(stationRepository.getReferenceById(originStation.getId())).thenReturn(originStation);
        when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

        // Act
        TripResponse result = tripService.updateTripStops(testTrip.getId(), request);

        // Assert
        assertNotNull(result);
        verify(tripRepository).save(any(Trip.class));
    }

    @Test
    void updateTripStops_invalidStop_throwsException() {
        // Arrange
        UpdateTripStopsRequest request = new UpdateTripStopsRequest();
        TripStopDto stopDto = new TripStopDto();
        // Missing both stationId and customAddress
        request.setStops(Collections.singletonList(stopDto));

        when(tripRepository.findById(testTrip.getId())).thenReturn(Optional.of(testTrip));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> tripService.updateTripStops(testTrip.getId(), request));
        assertTrue(exception.getMessage().contains("must have either"));
    }

    @Test
    void getAllTrips_success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Trip> page = new PageImpl<>(Collections.singletonList(testTrip));
        when(tripRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<TripResponse> result = tripService.getAllTrips(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void getTripById_notFound_throwsException() {
        // Arrange
        UUID tripId = UUID.randomUUID();
        when(tripRepository.findById(tripId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> tripService.getTripById(tripId));
        assertEquals("Trip not found", exception.getMessage());
    }

    @Test
    void updateTripStatus_success() {
        // Arrange
        when(tripRepository.findById(testTrip.getId())).thenReturn(Optional.of(testTrip));
        when(bookingRepository.findByTripIdAndStatus(any(), any())).thenReturn(Collections.emptyList());
        when(tripRepository.save(any(Trip.class))).thenReturn(testTrip);

        // Act
        TripResponse result = tripService.updateTripStatus(testTrip.getId(), TripStatus.DELAYED);

        // Assert
        assertNotNull(result);
        verify(tripRepository).save(any(Trip.class));
    }

    @Test
    void validateRecurrenceDateRange_valid() {
        // Act
        int days = tripService.validateRecurrenceDateRange(
                LocalDate.now().plusDays(1),
                LocalDate.now().plusDays(10));

        // Assert
        assertEquals(9, days);
    }

    @Test
    void validateRecurrenceDateRange_exceedsMax_throwsException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> tripService.validateRecurrenceDateRange(
                        LocalDate.now().plusDays(1),
                        LocalDate.now().plusDays(100)));
        assertTrue(exception.getMessage().contains("tối đa"));
    }

    @Test
    void validateRecurrenceDateRange_startInPast_throwsException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> tripService.validateRecurrenceDateRange(
                        LocalDate.now().minusDays(1),
                        LocalDate.now().plusDays(10)));
        assertTrue(exception.getMessage().contains("quá khứ"));
    }

    @Test
    void validateRecurrenceDateRange_endBeforeStart_throwsException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> tripService.validateRecurrenceDateRange(
                        LocalDate.now().plusDays(10),
                        LocalDate.now().plusDays(5)));
        assertTrue(exception.getMessage().contains("sau ngày bắt đầu"));
    }

    @Test
    void checkCanUpdateRecurrence_success() {
        // Arrange
        when(tripRepository.existsById(testTrip.getId())).thenReturn(true);
        when(bookingRepository.countFutureBookingsByTripId(eq(testTrip.getId()), any())).thenReturn(0L);

        // Act
        TripService.RecurrenceUpdateCheck result = tripService.checkCanUpdateRecurrence(testTrip.getId());

        // Assert
        assertNotNull(result);
        assertTrue(result.canUpdate());
        assertEquals(0, result.futureBookingsCount());
    }

    @Test
    void checkCanUpdateRecurrence_tripNotFound_throwsException() {
        // Arrange
        UUID tripId = UUID.randomUUID();
        when(tripRepository.existsById(tripId)).thenReturn(false);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> tripService.checkCanUpdateRecurrence(tripId));
        assertTrue(exception.getMessage().contains("Trip not found"));
    }

    @Test
    void getTripPassengers_success() {
        // Arrange
        com.awad.ticketbooking.modules.booking.entity.Ticket ticket = new com.awad.ticketbooking.modules.booking.entity.Ticket();
        ticket.setId(UUID.randomUUID());
        ticket.setSeatCode("A1");
        ticket.setPassengerName("Test Passenger");
        ticket.setPassengerPhone("0123456789");
        ticket.setBoarded(false);
        
        Booking booking = new Booking();
        booking.setCode("BK-123");
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setPickupStation(originStation);
        booking.setDropoffStation(destinationStation);
        ticket.setBooking(booking);

        when(ticketRepository.findAllByBookingTripId(testTrip.getId())).thenReturn(Collections.singletonList(ticket));

        // Act
        List<com.awad.ticketbooking.modules.trip.dto.TripPassengerResponse> result = tripService.getTripPassengers(testTrip.getId());

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("A1", result.get(0).getSeatCode());
        assertEquals("Test Passenger", result.get(0).getPassengerName());
        assertEquals("BK-123", result.get(0).getBookingCode());
    }

    @Test
    void getTripPassengers_emptyList() {
        // Arrange
        when(ticketRepository.findAllByBookingTripId(testTrip.getId())).thenReturn(Collections.emptyList());

        // Act
        List<com.awad.ticketbooking.modules.trip.dto.TripPassengerResponse> result = tripService.getTripPassengers(testTrip.getId());

        // Assert
        assertNotNull(result);
        assertEquals(0, result.size());
    }

    @Test
    void getTripPassengers_nullStations_handlesGracefully() {
        // Arrange
        com.awad.ticketbooking.modules.booking.entity.Ticket ticket = new com.awad.ticketbooking.modules.booking.entity.Ticket();
        ticket.setId(UUID.randomUUID());
        ticket.setSeatCode("A1");
        ticket.setPassengerName("Test Passenger");
        ticket.setPassengerPhone("0123456789");
        ticket.setBoarded(false);
        
        Booking booking = new Booking();
        booking.setCode("BK-123");
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setPickupStation(null);
        booking.setDropoffStation(null);
        ticket.setBooking(booking);

        when(ticketRepository.findAllByBookingTripId(testTrip.getId())).thenReturn(Collections.singletonList(ticket));

        // Act
        List<com.awad.ticketbooking.modules.trip.dto.TripPassengerResponse> result = tripService.getTripPassengers(testTrip.getId());

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("", result.get(0).getPickupStation());
        assertEquals("", result.get(0).getDropoffStation());
    }
}
