package com.awad.ticketbooking.modules.dashboard.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.dashboard.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public MetricsResponse getMetrics() {
        Instant now = Instant.now();
        Instant startOfDay = LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant();

        BigDecimal todayRevenue = bookingRepository.sumTotalPriceByCreatedAtBetweenAndStatus(startOfDay, now,
                BookingStatus.CONFIRMED);
        if (todayRevenue == null) {
            todayRevenue = BigDecimal.ZERO;
        }

        long todayTicketsSold = bookingRepository.countByCreatedAtBetweenAndStatus(startOfDay, now,
                BookingStatus.CONFIRMED);
        long todayNewUsers = userRepository.countByCreatedAtBetween(startOfDay, now);
        long todayActiveOperators = bookingRepository.countDistinctOperators(startOfDay, now, BookingStatus.CONFIRMED);

        return MetricsResponse.builder()
                .todayRevenue(todayRevenue)
                .todayTicketsSold(todayTicketsSold)
                .todayNewUsers(todayNewUsers)
                .todayActiveOperators(todayActiveOperators)
                .build();
    }

    @Transactional(readOnly = true)
    public List<RevenueChartResponse> getRevenueChart(Instant start, Instant end) {
        List<Object[]> data = bookingRepository.getRevenueChartData(start, end);
        return data.stream().map(row -> {
            // Assuming row[0] is Date/Timestamp and row[1] is BigDecimal
            // Need to handle type conversion carefully depending on DB
            // For now assuming row[0] is java.sql.Date or java.sql.Timestamp
            String dateStr = row[0].toString();
            BigDecimal revenue = (BigDecimal) row[1];
            return RevenueChartResponse.builder()
                    .date(dateStr)
                    .revenue(revenue)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TopRouteResponse> getTopRoutes(int limit) {
        List<Object[]> data = bookingRepository.findTopRoutes(PageRequest.of(0, limit));
        return data.stream().map(row -> {
            Route route = (Route) row[0];
            long ticketsSold = (long) row[1];
            return TopRouteResponse.builder()
                    .routeId(route.getId())
                    .origin(route.getOriginStation().getCity())
                    .destination(route.getDestinationStation().getCity())
                    .ticketsSold(ticketsSold)
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getRecentTransactions(int limit) {
        List<Booking> bookings = bookingRepository.findRecentBookings(PageRequest.of(0, limit));
        return bookings.stream().map(booking -> TransactionResponse.builder()
                .id(booking.getId())
                .passengerName(booking.getPassengerName())
                .route(booking.getTrip().getRoute().getOriginStation().getCity() + " -> "
                        + booking.getTrip().getRoute().getDestinationStation().getCity())
                .totalPrice(booking.getTotalPrice())
                .status(booking.getStatus())
                .bookingTime(booking.getCreatedAt())
                .build()).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TopOperatorResponse> getTopOperators(int limit) {
        List<Object[]> data = bookingRepository.findTopOperators(PageRequest.of(0, limit));
        return data.stream().map(row -> {
            com.awad.ticketbooking.modules.catalog.entity.Operator operator = (com.awad.ticketbooking.modules.catalog.entity.Operator) row[0];
            long ticketsSold = (long) row[1];
            BigDecimal totalRevenue = (BigDecimal) row[2];
            return TopOperatorResponse.builder()
                    .operatorId(operator.getId())
                    .operatorName(operator.getName())
                    .ticketsSold(ticketsSold)
                    .totalRevenue(totalRevenue)
                    .build();
        }).collect(Collectors.toList());
    }
}
