package com.awad.ticketbooking.modules.review.repository;

import com.awad.ticketbooking.modules.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    Optional<Review> findByBookingId(UUID bookingId);

    @Query("SELECT r FROM Review r " +
           "JOIN FETCH r.booking b " +
           "JOIN FETCH b.trip t " +
           "JOIN FETCH t.bus bus " +
           "JOIN FETCH bus.operator " +
           "JOIN FETCH t.route route " +
           "JOIN FETCH route.originStation " +
           "JOIN FETCH route.destinationStation " +
           "JOIN FETCH b.user " +
           "WHERE bus.operator.id = :operatorId " +
           "ORDER BY r.createdAt DESC")
    Page<Review> findByOperatorIdWithRouteInfo(@Param("operatorId") UUID operatorId, Pageable pageable);
}
