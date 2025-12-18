package com.awad.ticketbooking.modules.dashboard.service;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.dashboard.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = com.awad.ticketbooking.common.config.RedisConfig.CACHE_ADMIN_METRICS, key = "T(java.time.LocalDate).now().toString()")
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
    @Cacheable(
            value = com.awad.ticketbooking.common.config.RedisConfig.CACHE_ADMIN_REVENUE,
            key = "T(String).valueOf(#start) + ':' + T(String).valueOf(#end)"
    )
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
    @Cacheable(value = com.awad.ticketbooking.common.config.RedisConfig.CACHE_ADMIN_TOP_ROUTES, key = "'all:' + #limit")
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
    @Cacheable(
            value = com.awad.ticketbooking.common.config.RedisConfig.CACHE_ADMIN_TOP_ROUTES,
            key = "T(String).valueOf(#start) + ':' + T(String).valueOf(#end) + ':' + #limit"
    )
    public List<TopRouteResponse> getTopRoutes(Instant start, Instant end, int limit) {
        if (start == null || end == null) {
            return getTopRoutes(limit);
        }
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("from must be <= to");
        }

        List<Object[]> data = bookingRepository.findTopRoutesInRange(start, end, PageRequest.of(0, limit));
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
    @Cacheable(value = com.awad.ticketbooking.common.config.RedisConfig.CACHE_ADMIN_RECENT_TRANSACTIONS, key = "'limit:' + #limit")
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
    @Cacheable(value = com.awad.ticketbooking.common.config.RedisConfig.CACHE_ADMIN_TOP_OPERATORS, key = "'all:' + #limit")
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

    @Transactional(readOnly = true)
    @Cacheable(
            value = com.awad.ticketbooking.common.config.RedisConfig.CACHE_ADMIN_TOP_OPERATORS,
            key = "T(String).valueOf(#start) + ':' + T(String).valueOf(#end) + ':' + #limit"
    )
    public List<TopOperatorResponse> getTopOperators(Instant start, Instant end, int limit) {
        if (start == null || end == null) {
            return getTopOperators(limit);
        }
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("from must be <= to");
        }

        List<Object[]> data = bookingRepository.findTopOperatorsInRange(start, end, PageRequest.of(0, limit));
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

    @Transactional(readOnly = true)
    @Cacheable(
            value = com.awad.ticketbooking.common.config.RedisConfig.CACHE_ADMIN_BOOKING_TRENDS,
            key = "T(String).valueOf(#start) + ':' + T(String).valueOf(#end) + ':' + (#groupBy == null ? 'day' : #groupBy)"
    )
    public List<BookingTrendResponse> getBookingTrends(Instant start, Instant end, String groupBy) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("from/to must not be null");
        }
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("from must be <= to");
        }

        List<Object[]> totalData;
        List<Object[]> confirmedData;

        String normalized = groupBy == null ? "day" : groupBy.trim().toLowerCase();
        switch (normalized) {
            case "week" -> {
                totalData = bookingRepository.getBookingTrendsWeekly(start, end);
                confirmedData = bookingRepository.getConfirmedBookingTrendsWeekly(start, end);
            }
            case "day" -> {
                totalData = bookingRepository.getBookingTrendsDaily(start, end);
                confirmedData = bookingRepository.getConfirmedBookingTrendsDaily(start, end);
            }
            default -> throw new IllegalArgumentException("groupBy must be one of: day, week");
        }

        Map<String, long[]> byBucket = new HashMap<>();

        for (Object[] row : totalData) {
            String bucket = row[0].toString();
            long count = ((Number) row[1]).longValue();
            byBucket.computeIfAbsent(bucket, k -> new long[2])[0] = count;
        }
        for (Object[] row : confirmedData) {
            String bucket = row[0].toString();
            long count = ((Number) row[1]).longValue();
            byBucket.computeIfAbsent(bucket, k -> new long[2])[1] = count;
        }

        return byBucket.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> BookingTrendResponse.builder()
                        .bucket(e.getKey())
                        .totalBookings(e.getValue()[0])
                        .confirmedBookings(e.getValue()[1])
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    @Cacheable(
            value = com.awad.ticketbooking.common.config.RedisConfig.CACHE_ADMIN_BOOKING_CONVERSION,
            key = "T(String).valueOf(#start) + ':' + T(String).valueOf(#end)"
    )
    public BookingConversionResponse getBookingConversion(Instant start, Instant end) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("from/to must not be null");
        }
        if (start.isAfter(end)) {
            throw new IllegalArgumentException("from must be <= to");
        }

        long total = bookingRepository.countByCreatedAtBetween(start, end);
        long confirmed = bookingRepository.countByCreatedAtBetweenAndStatus(start, end, BookingStatus.CONFIRMED);

        double conversionRate = total == 0 ? 0.0 : ((double) confirmed) / ((double) total);

        return BookingConversionResponse.builder()
                .total(total)
                .confirmed(confirmed)
                .conversionRate(conversionRate)
                .build();
    }
}
