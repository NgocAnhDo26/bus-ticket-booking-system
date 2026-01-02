package com.awad.ticketbooking.modules.booking.repository;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.modules.booking.entity.Booking;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, java.util.UUID>,
                org.springframework.data.jpa.repository.JpaSpecificationExecutor<Booking> {

        org.springframework.data.domain.Page<Booking> findByUserIdOrderByCreatedAtDesc(java.util.UUID userId,
                        org.springframework.data.domain.Pageable pageable);

        Optional<Booking> findByCode(String code);

        @Query("SELECT SUM(b.totalPrice) FROM Booking b WHERE b.createdAt BETWEEN :start AND :end AND b.status = :status")
        BigDecimal sumTotalPriceByCreatedAtBetweenAndStatus(@Param("start") Instant start, @Param("end") Instant end,
                        @Param("status") BookingStatus status);

        long countByCreatedAtBetween(Instant start, Instant end);

        long countByCreatedAtBetweenAndStatus(Instant start, Instant end, BookingStatus status);

        @Query("SELECT COUNT(DISTINCT b.trip.bus.operator) FROM Booking b WHERE b.createdAt BETWEEN :start AND :end AND b.status = :status")
        long countDistinctOperators(@Param("start") Instant start, @Param("end") Instant end,
                        @Param("status") BookingStatus status);

        @Query("SELECT b.trip.route, COUNT(b) as ticketCount FROM Booking b WHERE b.status = 'CONFIRMED' GROUP BY b.trip.route ORDER BY ticketCount DESC")
        List<Object[]> findTopRoutes(Pageable pageable);

        @Query("SELECT b.trip.route, COUNT(b) as ticketCount " +
                        "FROM Booking b " +
                        "WHERE b.status = 'CONFIRMED' AND b.createdAt BETWEEN :start AND :end " +
                        "GROUP BY b.trip.route " +
                        "ORDER BY ticketCount DESC")
        List<Object[]> findTopRoutesInRange(@Param("start") Instant start, @Param("end") Instant end,
                        Pageable pageable);

        @Query("SELECT b FROM Booking b ORDER BY b.createdAt DESC")
        List<Booking> findRecentBookings(Pageable pageable);

        @Query("SELECT function('date_trunc', 'day', b.createdAt) as date, SUM(b.totalPrice) as revenue " +
                        "FROM Booking b " +
                        "WHERE b.createdAt BETWEEN :start AND :end AND b.status = 'CONFIRMED' " +
                        "GROUP BY function('date_trunc', 'day', b.createdAt) " +
                        "ORDER BY date")
        List<Object[]> getRevenueChartData(@Param("start") Instant start, @Param("end") Instant end);

        @Query("SELECT b.trip.bus.operator, COUNT(b) as ticketCount, SUM(b.totalPrice) as totalRevenue FROM Booking b WHERE b.status = 'CONFIRMED' GROUP BY b.trip.bus.operator ORDER BY ticketCount DESC")
        List<Object[]> findTopOperators(Pageable pageable);

        @Query("SELECT b.trip.bus.operator, COUNT(b) as ticketCount, SUM(b.totalPrice) as totalRevenue " +
                        "FROM Booking b " +
                        "WHERE b.status = 'CONFIRMED' AND b.createdAt BETWEEN :start AND :end " +
                        "GROUP BY b.trip.bus.operator " +
                        "ORDER BY ticketCount DESC")
        List<Object[]> findTopOperatorsInRange(@Param("start") Instant start, @Param("end") Instant end,
                        Pageable pageable);

        @Query("SELECT function('date_trunc', 'day', b.createdAt) as bucket, COUNT(b) as bookingCount " +
                        "FROM Booking b " +
                        "WHERE b.createdAt BETWEEN :start AND :end " +
                        "GROUP BY function('date_trunc', 'day', b.createdAt) " +
                        "ORDER BY bucket")
        List<Object[]> getBookingTrendsDaily(@Param("start") Instant start, @Param("end") Instant end);

        @Query("SELECT function('date_trunc', 'day', b.createdAt) as bucket, COUNT(b) as bookingCount " +
                        "FROM Booking b " +
                        "WHERE b.createdAt BETWEEN :start AND :end AND b.status = 'CONFIRMED' " +
                        "GROUP BY function('date_trunc', 'day', b.createdAt) " +
                        "ORDER BY bucket")
        List<Object[]> getConfirmedBookingTrendsDaily(@Param("start") Instant start, @Param("end") Instant end);

        @Query("SELECT function('date_trunc', 'week', b.createdAt) as bucket, COUNT(b) as bookingCount " +
                        "FROM Booking b " +
                        "WHERE b.createdAt BETWEEN :start AND :end " +
                        "GROUP BY function('date_trunc', 'week', b.createdAt) " +
                        "ORDER BY bucket")
        List<Object[]> getBookingTrendsWeekly(@Param("start") Instant start, @Param("end") Instant end);

        @Query("SELECT function('date_trunc', 'week', b.createdAt) as bucket, COUNT(b) as bookingCount " +
                        "FROM Booking b " +
                        "WHERE b.createdAt BETWEEN :start AND :end AND b.status = 'CONFIRMED' " +
                        "GROUP BY function('date_trunc', 'week', b.createdAt) " +
                        "ORDER BY bucket")
        List<Object[]> getConfirmedBookingTrendsWeekly(@Param("start") Instant start, @Param("end") Instant end);

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

        // Count future bookings for trips generated from a schedule
        @Query("SELECT COUNT(b) FROM Booking b WHERE b.trip.tripSchedule.id = :scheduleId AND b.trip.departureTime > :now")
        long countFutureBookingsByScheduleId(@Param("scheduleId") java.util.UUID scheduleId, @Param("now") Instant now);

        // Count future bookings for a specific trip
        @Query("SELECT COUNT(b) FROM Booking b WHERE b.trip.id = :tripId AND b.trip.departureTime > :now")
        long countFutureBookingsByTripId(@Param("tripId") java.util.UUID tripId, @Param("now") Instant now);

        boolean existsByTripIdAndTicketsSeatCodeAndStatusNot(java.util.UUID tripId, String seatCode,
                        BookingStatus status);

        List<Booking> findAllByTripIdAndStatusNot(java.util.UUID tripId, BookingStatus status);

        // For Scheduler
        @Query("SELECT b FROM Booking b WHERE b.status = 'PENDING' AND b.createdAt < :cutoffTime")
        List<Booking> findExpiredPendingBookings(@Param("cutoffTime") Instant cutoffTime);

        @Query("SELECT b FROM Booking b " +
                        "JOIN FETCH b.trip t " +
                        "JOIN FETCH t.route r " +
                        "JOIN FETCH r.originStation " +
                        "JOIN FETCH r.destinationStation " +
                        "JOIN FETCH t.bus bus " +
                        "JOIN FETCH bus.operator " +
                        "LEFT JOIN FETCH b.tickets " +
                        "WHERE b.id = :bookingId")
        Optional<Booking> findByIdWithFullDetails(@Param("bookingId") java.util.UUID bookingId);

        List<Booking> findByTripId(java.util.UUID tripId);

        List<Booking> findByTripIdAndStatus(java.util.UUID tripId, BookingStatus status);

        @Query("SELECT b FROM Booking b " +
                        "JOIN FETCH b.trip t " +
                        "JOIN FETCH t.route r " +
                        "JOIN FETCH r.originStation " +
                        "JOIN FETCH r.destinationStation " +
                        "JOIN FETCH t.bus bus " +
                        "JOIN FETCH bus.operator " +
                        "WHERE b.status = :status AND b.reminderSent = false AND t.departureTime BETWEEN :start AND :end")
        List<Booking> findByStatusAndReminderSentFalseAndTripDepartureTimeBetween(
                        @Param("status") BookingStatus status,
                        @Param("start") Instant start,
                        @Param("end") Instant end);
}
