package com.awad.ticketbooking.modules.trip.repository;

import com.awad.ticketbooking.modules.trip.entity.TripPricing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface TripPricingRepository extends JpaRepository<TripPricing, UUID> {
}
