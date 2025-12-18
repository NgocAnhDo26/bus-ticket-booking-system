package com.awad.ticketbooking.modules.trip.repository;

import com.awad.ticketbooking.modules.trip.entity.TripPricing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TripPricingRepository extends JpaRepository<TripPricing, UUID> {

    @Modifying
    @Query("DELETE FROM TripPricing tp WHERE tp.trip.id = :tripId")
    void deleteAllByTripId(@Param("tripId") UUID tripId);
}
