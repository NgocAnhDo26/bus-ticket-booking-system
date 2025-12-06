package com.awad.ticketbooking.modules.booking.repository;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, java.util.UUID> {

        @Query("SELECT SUM(b.totalPrice) FROM Booking b WHERE b.createdAt BETWEEN :start AND :end AND b.status = :status")
        BigDecimal sumTotalPriceByCreatedAtBetweenAndStatus(@Param("start") Instant start, @Param("end") Instant end,
                        @Param("status") BookingStatus status);

        long countByCreatedAtBetweenAndStatus(Instant start, Instant end, BookingStatus status);

        @Query("SELECT COUNT(DISTINCT b.trip.bus.operator) FROM Booking b WHERE b.createdAt BETWEEN :start AND :end AND b.status = :status")
        long countDistinctOperators(@Param("start") Instant start, @Param("end") Instant end,
                        @Param("status") BookingStatus status);

        @Query("SELECT b.trip.route, COUNT(b) as ticketCount FROM Booking b WHERE b.status = 'CONFIRMED' GROUP BY b.trip.route ORDER BY ticketCount DESC")
        List<Object[]> findTopRoutes(Pageable pageable);

        @Query("SELECT b FROM Booking b ORDER BY b.createdAt DESC")
        List<Booking> findRecentBookings(Pageable pageable);

        @Query("SELECT new map(function('date_trunc', 'day', b.createdAt) as date, SUM(b.totalPrice) as revenue) FROM Booking b WHERE b.createdAt BETWEEN :start AND :end AND b.status = 'CONFIRMED' GROUP BY function('date_trunc', 'day', b.createdAt) ORDER BY date")
        List<Object[]> getRevenueChartData(@Param("start") Instant start, @Param("end") Instant end);

        @Query("SELECT b.trip.bus.operator, COUNT(b) as ticketCount, SUM(b.totalPrice) as totalRevenue FROM Booking b WHERE b.status = 'CONFIRMED' GROUP BY b.trip.bus.operator ORDER BY ticketCount DESC")
        List<Object[]> findTopOperators(Pageable pageable);

        // User Dashboard Methods
        long countByUserEmail(String email);

        @Query("SELECT COUNT(b) FROM Booking b WHERE b.user.email = :email AND b.trip.departureTime > CURRENT_TIMESTAMP AND b.status = 'CONFIRMED'")
        long countUpcomingTripsByUser(@Param("email") String email);

        @Query("SELECT SUM(b.totalPrice) FROM Booking b WHERE b.user.email = :email AND b.status = 'CONFIRMED'")
        BigDecimal sumTotalSpentByUser(@Param("email") String email);

        @Query("SELECT b FROM Booking b WHERE b.user.email = :email ORDER BY b.trip.departureTime DESC")
        List<Booking> findRecentBookingsByUser(@Param("email") String email, Pageable pageable);

        void deleteByTripId(java.util.UUID tripId);

        boolean existsByTripId(java.util.UUID tripId);
}
