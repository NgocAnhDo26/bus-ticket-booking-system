package com.awad.ticketbooking.modules.trip.repository;

import com.awad.ticketbooking.modules.trip.entity.Trip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface TripRepository extends JpaRepository<Trip, UUID>, JpaSpecificationExecutor<Trip> {
    boolean existsByBusIdAndDepartureTimeLessThanAndArrivalTimeGreaterThan(UUID busId, Instant arrivalTime,
            Instant departureTime);
}
