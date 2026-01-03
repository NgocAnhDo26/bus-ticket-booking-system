package com.awad.ticketbooking.modules.dashboard.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.dashboard.dto.*;
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
class AdminDashboardServiceTest {

    @InjectMocks
    private AdminDashboardService adminDashboardService;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    private Route testRoute;
    private Operator testOperator;
    private Booking testBooking;

    @BeforeEach
    void setUp() {
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
        testRoute = new Route();
        testRoute.setId(UUID.randomUUID());
        testRoute.setOriginStation(originStation);
        testRoute.setDestinationStation(destStation);

        // Setup operator
        testOperator = new Operator();
        testOperator.setId(UUID.randomUUID());
        testOperator.setName("VietBus");

        // Setup trip
        Trip trip = new Trip();
        trip.setId(UUID.randomUUID());
        trip.setRoute(testRoute);

        // Setup booking
        testBooking = new Booking();
        testBooking.setId(UUID.randomUUID());
        testBooking.setTrip(trip);
        testBooking.setPassengerName("Test Passenger");
        testBooking.setTotalPrice(new BigDecimal("200000"));
        testBooking.setStatus(BookingStatus.CONFIRMED);
        testBooking.setCreatedAt(Instant.now());
    }

    @Test
    void getMetrics_success() {
        // Arrange
        when(bookingRepository.sumTotalPriceByCreatedAtBetweenAndStatus(any(), any(), eq(BookingStatus.CONFIRMED)))
                .thenReturn(new BigDecimal("1000000"));
        when(bookingRepository.countByCreatedAtBetweenAndStatus(any(), any(), eq(BookingStatus.CONFIRMED)))
                .thenReturn(50L);
        when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(10L);
        when(bookingRepository.countDistinctOperators(any(), any(), eq(BookingStatus.CONFIRMED))).thenReturn(5L);

        // Act
        MetricsResponse response = adminDashboardService.getMetrics();

        // Assert
        assertNotNull(response);
        assertEquals(new BigDecimal("1000000"), response.getTodayRevenue());
        assertEquals(50L, response.getTodayTicketsSold());
        assertEquals(10L, response.getTodayNewUsers());
        assertEquals(5L, response.getTodayActiveOperators());
    }

    @Test
    void getMetrics_nullRevenue_returnsZero() {
        // Arrange
        when(bookingRepository.sumTotalPriceByCreatedAtBetweenAndStatus(any(), any(), eq(BookingStatus.CONFIRMED)))
                .thenReturn(null);
        when(bookingRepository.countByCreatedAtBetweenAndStatus(any(), any(), eq(BookingStatus.CONFIRMED)))
                .thenReturn(0L);
        when(userRepository.countByCreatedAtBetween(any(), any())).thenReturn(0L);
        when(bookingRepository.countDistinctOperators(any(), any(), eq(BookingStatus.CONFIRMED))).thenReturn(0L);

        // Act
        MetricsResponse response = adminDashboardService.getMetrics();

        // Assert
        assertNotNull(response);
        assertEquals(BigDecimal.ZERO, response.getTodayRevenue());
    }

    @Test
    void getRevenueChart_success() {
        // Arrange
        Instant start = Instant.now().minusSeconds(86400 * 7);
        Instant end = Instant.now();

        Object[] row = new Object[]{"2025-01-01", new BigDecimal("500000")};
        List<Object[]> data = Collections.singletonList(row);

        when(bookingRepository.getRevenueChartData(start, end)).thenReturn(data);

        // Act
        List<RevenueChartResponse> response = adminDashboardService.getRevenueChart(start, end);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("2025-01-01", response.get(0).getDate());
        assertEquals(new BigDecimal("500000"), response.get(0).getRevenue());
    }

    @Test
    void getTopRoutes_success() {
        // Arrange
        Object[] row = new Object[]{testRoute, 100L};
        List<Object[]> data = Collections.singletonList(row);

        when(bookingRepository.findTopRoutes(any(PageRequest.class))).thenReturn(data);

        // Act
        List<TopRouteResponse> response = adminDashboardService.getTopRoutes(5);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("Hanoi", response.get(0).getOrigin());
        assertEquals("Saigon", response.get(0).getDestination());
        assertEquals(100L, response.get(0).getTicketsSold());
    }

    @Test
    void getTopRoutes_withDateRange_success() {
        // Arrange
        Instant start = Instant.now().minusSeconds(86400 * 7);
        Instant end = Instant.now();

        Object[] row = new Object[]{testRoute, 50L};
        List<Object[]> data = Collections.singletonList(row);

        when(bookingRepository.findTopRoutesInRange(eq(start), eq(end), any(PageRequest.class))).thenReturn(data);

        // Act
        List<TopRouteResponse> response = adminDashboardService.getTopRoutes(start, end, 5);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals(50L, response.get(0).getTicketsSold());
    }

    @Test
    void getTopRoutes_invalidDateRange_throwsException() {
        // Arrange
        Instant start = Instant.now();
        Instant end = Instant.now().minusSeconds(86400); // end before start

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> adminDashboardService.getTopRoutes(start, end, 5));
    }

    @Test
    void getRecentTransactions_success() {
        // Arrange
        when(bookingRepository.findRecentBookings(any(PageRequest.class)))
                .thenReturn(Collections.singletonList(testBooking));

        // Act
        List<TransactionResponse> response = adminDashboardService.getRecentTransactions(10);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("Test Passenger", response.get(0).getPassengerName());
        assertEquals(new BigDecimal("200000"), response.get(0).getTotalPrice());
        assertEquals(BookingStatus.CONFIRMED, response.get(0).getStatus());
    }

    @Test
    void getTopOperators_success() {
        // Arrange
        Object[] row = new Object[]{testOperator, 100L, new BigDecimal("5000000")};
        List<Object[]> data = Collections.singletonList(row);

        when(bookingRepository.findTopOperators(any(PageRequest.class))).thenReturn(data);

        // Act
        List<TopOperatorResponse> response = adminDashboardService.getTopOperators(5);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("VietBus", response.get(0).getOperatorName());
        assertEquals(100L, response.get(0).getTicketsSold());
        assertEquals(new BigDecimal("5000000"), response.get(0).getTotalRevenue());
    }

    @Test
    void getTopOperators_withDateRange_success() {
        // Arrange
        Instant start = Instant.now().minusSeconds(86400 * 7);
        Instant end = Instant.now();

        Object[] row = new Object[]{testOperator, 50L, new BigDecimal("2500000")};
        List<Object[]> data = Collections.singletonList(row);

        when(bookingRepository.findTopOperatorsInRange(eq(start), eq(end), any(PageRequest.class))).thenReturn(data);

        // Act
        List<TopOperatorResponse> response = adminDashboardService.getTopOperators(start, end, 5);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals(50L, response.get(0).getTicketsSold());
    }

    @Test
    void getBookingTrends_daily_success() {
        // Arrange
        Instant start = Instant.now().minusSeconds(86400 * 7);
        Instant end = Instant.now();

        Object[] totalRow = new Object[]{"2025-01-01", 100L};
        Object[] confirmedRow = new Object[]{"2025-01-01", 80L};

        when(bookingRepository.getBookingTrendsDaily(start, end))
                .thenReturn(Collections.singletonList(totalRow));
        when(bookingRepository.getConfirmedBookingTrendsDaily(start, end))
                .thenReturn(Collections.singletonList(confirmedRow));

        // Act
        List<BookingTrendResponse> response = adminDashboardService.getBookingTrends(start, end, "day");

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("2025-01-01", response.get(0).getBucket());
        assertEquals(100L, response.get(0).getTotalBookings());
        assertEquals(80L, response.get(0).getConfirmedBookings());
    }

    @Test
    void getBookingTrends_weekly_success() {
        // Arrange
        Instant start = Instant.now().minusSeconds(86400 * 30);
        Instant end = Instant.now();

        Object[] totalRow = new Object[]{"2025-W01", 500L};
        Object[] confirmedRow = new Object[]{"2025-W01", 400L};

        when(bookingRepository.getBookingTrendsWeekly(start, end))
                .thenReturn(Collections.singletonList(totalRow));
        when(bookingRepository.getConfirmedBookingTrendsWeekly(start, end))
                .thenReturn(Collections.singletonList(confirmedRow));

        // Act
        List<BookingTrendResponse> response = adminDashboardService.getBookingTrends(start, end, "week");

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals("2025-W01", response.get(0).getBucket());
    }

    @Test
    void getBookingTrends_invalidGroupBy_throwsException() {
        // Arrange
        Instant start = Instant.now().minusSeconds(86400);
        Instant end = Instant.now();

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> adminDashboardService.getBookingTrends(start, end, "invalid"));
    }

    @Test
    void getBookingTrends_nullDates_throwsException() {
        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> adminDashboardService.getBookingTrends(null, null, "day"));
    }

    @Test
    void getBookingConversion_success() {
        // Arrange
        Instant start = Instant.now().minusSeconds(86400 * 7);
        Instant end = Instant.now();

        when(bookingRepository.countByCreatedAtBetween(start, end)).thenReturn(100L);
        when(bookingRepository.countByCreatedAtBetweenAndStatus(start, end, BookingStatus.CONFIRMED)).thenReturn(80L);

        // Act
        BookingConversionResponse response = adminDashboardService.getBookingConversion(start, end);

        // Assert
        assertNotNull(response);
        assertEquals(100L, response.getTotal());
        assertEquals(80L, response.getConfirmed());
        assertEquals(0.8, response.getConversionRate(), 0.001);
    }

    @Test
    void getBookingConversion_zeroTotal_returnsZeroRate() {
        // Arrange
        Instant start = Instant.now().minusSeconds(86400);
        Instant end = Instant.now();

        when(bookingRepository.countByCreatedAtBetween(start, end)).thenReturn(0L);
        when(bookingRepository.countByCreatedAtBetweenAndStatus(start, end, BookingStatus.CONFIRMED)).thenReturn(0L);

        // Act
        BookingConversionResponse response = adminDashboardService.getBookingConversion(start, end);

        // Assert
        assertNotNull(response);
        assertEquals(0L, response.getTotal());
        assertEquals(0.0, response.getConversionRate());
    }

    @Test
    void getBookingConversion_invalidDateRange_throwsException() {
        // Arrange
        Instant start = Instant.now();
        Instant end = Instant.now().minusSeconds(86400);

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> adminDashboardService.getBookingConversion(start, end));
    }

    @Test
    void getTopRoutes_nullDates_usesDefault() {
        // Arrange
        Object[] row = new Object[]{testRoute, 100L};
        List<Object[]> data = Collections.singletonList(row);

        when(bookingRepository.findTopRoutes(any(PageRequest.class))).thenReturn(data);

        // Act
        List<TopRouteResponse> response = adminDashboardService.getTopRoutes(null, null, 5);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
    }

    @Test
    void getTopOperators_nullDates_usesDefault() {
        // Arrange
        Object[] row = new Object[]{testOperator, 100L, new BigDecimal("5000000")};
        List<Object[]> data = Collections.singletonList(row);

        when(bookingRepository.findTopOperators(any(PageRequest.class))).thenReturn(data);

        // Act
        List<TopOperatorResponse> response = adminDashboardService.getTopOperators(null, null, 5);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
    }

    @Test
    void getTopOperators_invalidDateRange_throwsException() {
        // Arrange
        Instant start = Instant.now();
        Instant end = Instant.now().minusSeconds(86400);

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> adminDashboardService.getTopOperators(start, end, 5));
    }

    @Test
    void getRevenueChart_nullData_handlesGracefully() {
        // Arrange
        Instant start = Instant.now().minusSeconds(86400 * 7);
        Instant end = Instant.now();

        when(bookingRepository.getRevenueChartData(start, end)).thenReturn(Collections.emptyList());

        // Act
        List<RevenueChartResponse> response = adminDashboardService.getRevenueChart(start, end);

        // Assert
        assertNotNull(response);
        assertEquals(0, response.size());
    }

    @Test
    void getRevenueChart_nullRevenue_handlesGracefully() {
        // Arrange
        Instant start = Instant.now().minusSeconds(86400 * 7);
        Instant end = Instant.now();

        Object[] row = new Object[]{"2025-01-01", null};
        List<Object[]> data = Collections.singletonList(row);

        when(bookingRepository.getRevenueChartData(start, end)).thenReturn(data);

        // Act
        List<RevenueChartResponse> response = adminDashboardService.getRevenueChart(start, end);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
        assertEquals(BigDecimal.ZERO, response.get(0).getRevenue());
    }

    @Test
    void getBookingTrends_invalidDateRange_throwsException() {
        // Arrange
        Instant start = Instant.now();
        Instant end = Instant.now().minusSeconds(86400);

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> adminDashboardService.getBookingTrends(start, end, "day"));
    }

    @Test
    void getBookingTrends_defaultGroupBy() {
        // Arrange
        Instant start = Instant.now().minusSeconds(86400 * 7);
        Instant end = Instant.now();

        Object[] totalRow = new Object[]{"2025-01-01", 100L};
        Object[] confirmedRow = new Object[]{"2025-01-01", 80L};

        when(bookingRepository.getBookingTrendsDaily(start, end))
                .thenReturn(Collections.singletonList(totalRow));
        when(bookingRepository.getConfirmedBookingTrendsDaily(start, end))
                .thenReturn(Collections.singletonList(confirmedRow));

        // Act
        List<BookingTrendResponse> response = adminDashboardService.getBookingTrends(start, end, null);

        // Assert
        assertNotNull(response);
        assertEquals(1, response.size());
    }
}
