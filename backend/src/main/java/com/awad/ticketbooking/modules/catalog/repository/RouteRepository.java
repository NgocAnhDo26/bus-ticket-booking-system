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

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Route r JOIN r.originStation os JOIN r.destinationStation ds WHERE lower(os.name) LIKE lower(concat('%', :query, '%')) OR lower(os.city) LIKE lower(concat('%', :query, '%')) OR lower(ds.name) LIKE lower(concat('%', :query, '%')) OR lower(ds.city) LIKE lower(concat('%', :query, '%'))")
    org.springframework.data.domain.Page<Route> search(
            @org.springframework.data.repository.query.Param("query") String query,
            org.springframework.data.domain.Pageable pageable);
}
