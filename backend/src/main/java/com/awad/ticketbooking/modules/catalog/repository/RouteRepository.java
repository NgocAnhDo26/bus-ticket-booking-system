package com.awad.ticketbooking.modules.catalog.repository;

import com.awad.ticketbooking.modules.catalog.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RouteRepository extends JpaRepository<Route, UUID> {
    void deleteByOriginStationId(UUID originStationId);

    void deleteByDestinationStationId(UUID destinationStationId);

    java.util.List<Route> findByOriginStationId(UUID originStationId);

    java.util.List<Route> findByDestinationStationId(UUID destinationStationId);
}
