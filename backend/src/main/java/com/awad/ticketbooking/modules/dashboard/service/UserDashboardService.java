package com.awad.ticketbooking.modules.dashboard.service;

import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.dashboard.dto.UserDashboardSummaryResponse;
import com.awad.ticketbooking.modules.dashboard.dto.UserRecentTripResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserDashboardService {

    private final BookingRepository bookingRepository;

    public UserDashboardSummaryResponse getUserDashboardSummary(String email) {
        long totalTrips = bookingRepository.countByUserEmail(email);
        long upcomingTrips = bookingRepository.countUpcomingTripsByUser(email);
        BigDecimal totalSpent = bookingRepository.sumTotalSpentByUser(email);

        return UserDashboardSummaryResponse.builder()
                .totalTrips(totalTrips)
                .upcomingTrips(upcomingTrips)
                .totalSpent(totalSpent != null ? totalSpent : BigDecimal.ZERO)
                .build();
    }

    public List<UserRecentTripResponse> getUserRecentTrips(String email, int limit) {
        List<Booking> bookings = bookingRepository.findRecentBookingsByUser(email, PageRequest.of(0, limit));

        return bookings.stream()
                .map(booking -> UserRecentTripResponse.builder()
                        .origin(booking.getTrip().getRoute().getOriginStation().getCity())
                        .destination(booking.getTrip().getRoute().getDestinationStation().getCity())
                        .departureTime(booking.getTrip().getDepartureTime())
                        .distance(booking.getTrip().getRoute().getDistanceKm().doubleValue())
                        .status(booking.getStatus().name())
                        .build())
                .collect(Collectors.toList());
    }
}
