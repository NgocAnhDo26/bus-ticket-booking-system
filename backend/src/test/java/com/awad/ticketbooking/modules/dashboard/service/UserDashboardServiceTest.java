package com.awad.ticketbooking.modules.dashboard.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.dashboard.dto.UserDashboardSummaryResponse;
import com.awad.ticketbooking.modules.dashboard.dto.UserRecentTripResponse;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserDashboardServiceTest {

    @InjectMocks
    private UserDashboardService userDashboardService;

    @Mock
    private BookingRepository bookingRepository;

    private String testEmail;
    private Booking testBooking;

    @BeforeEach
    void setUp() {
        testEmail = "test@example.com";

        // Setup stations
        Station originStation = new Station();
        originStation.setId(UUID.randomUUID());
        originStation.setName("Hanoi");
        originStation.setCity("Hanoi");

        Station destStation = new Station();
        destStation.setId(UUID.randomUUID());
        destStation.setName("Saigon");
        destStation.setCity("Saigon");

        // Setup route
        Route route = new Route();
        route.setId(UUID.randomUUID());
        route.setOriginStation(originStation);
        route.setDestinationStation(destStation);
        route.setDistanceKm(new BigDecimal("1800"));

        // Setup trip
        Trip trip = new Trip();
        trip.setId(UUID.randomUUID());
        trip.setRoute(route);
        trip.setDepartureTime(Instant.now().plusSeconds(86400));

        // Setup booking
        testBooking = new Booking();
        testBooking.setId(UUID.randomUUID());
        testBooking.setTrip(trip);
        testBooking.setPassengerName("Test Passenger");
        testBooking.setTotalPrice(new BigDecimal("200000"));
        testBooking.setStatus(BookingStatus.CONFIRMED);
    }

    @Test
    void getUserDashboardSummary_success() {
        // Arrange
        when(bookingRepository.countByUserEmail(testEmail)).thenReturn(10L);
        when(bookingRepository.countUpcomingTripsByUser(testEmail)).thenReturn(3L);
        when(bookingRepository.sumTotalSpentByUser(testEmail)).thenReturn(new BigDecimal("2000000"));

        // Act
        UserDashboardSummaryResponse response = userDashboardService.getUserDashboardSummary(testEmail);

        // Assert
        assertNotNull(response);
        assertEquals(10L, response.getTotalTrips());
        assertEquals(3L, response.getUpcomingTrips());
        assertEquals(new BigDecimal("2000000"), response.getTotalSpent());
    }

    @Test
    void getUserDashboardSummary_noBookings_returnsZeros() {
        // Arrange
        when(bookingRepository.countByUserEmail(testEmail)).thenReturn(0L);
        when(bookingRepository.countUpcomingTripsByUser(testEmail)).thenReturn(0L);
        when(bookingRepository.sumTotalSpentByUser(testEmail)).thenReturn(null);

        // Act
        UserDashboardSummaryResponse response = userDashboardService.getUserDashboardSummary(testEmail);

        // Assert
        assertNotNull(response);
        assertEquals(0L, response.getTotalTrips());
        assertEquals(0L, response.getUpcomingTrips());
        assertEquals(BigDecimal.ZERO, response.getTotalSpent());
    }

    @Test
    void getUserRecentTrips_success() {
        // Arrange
        when(bookingRepository.findRecentBookingsByUser(eq(testEmail), any(PageRequest.class)))
                .thenReturn(Collections.singletonList(testBooking));

        // Act
        List<UserRecentTripResponse> response = userDashboardService.getUserRecentTrips(testEmail, 5);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("Hanoi", response.get(0).getOrigin());
        assertEquals("Saigon", response.get(0).getDestination());
        assertEquals(1800.0, response.get(0).getDistance());
        assertEquals("CONFIRMED", response.get(0).getStatus());
    }

    @Test
    void getUserRecentTrips_noBookings_returnsEmptyList() {
        // Arrange
        when(bookingRepository.findRecentBookingsByUser(eq(testEmail), any(PageRequest.class)))
                .thenReturn(Collections.emptyList());

        // Act
        List<UserRecentTripResponse> response = userDashboardService.getUserRecentTrips(testEmail, 5);

        // Assert
        assertNotNull(response);
        assertTrue(response.isEmpty());
    }

    @Test
    void getUserRecentTrips_multipleBookings_success() {
        // Arrange
        Booking booking2 = new Booking();
        booking2.setId(UUID.randomUUID());
        booking2.setTrip(testBooking.getTrip());
        booking2.setStatus(BookingStatus.PENDING);

        when(bookingRepository.findRecentBookingsByUser(eq(testEmail), any(PageRequest.class)))
                .thenReturn(List.of(testBooking, booking2));

        // Act
        List<UserRecentTripResponse> response = userDashboardService.getUserRecentTrips(testEmail, 5);

        // Assert
        assertNotNull(response);
        assertEquals(2, response.size());
    }
}
