package com.awad.ticketbooking.modules.catalog.repository;

import com.awad.ticketbooking.modules.catalog.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StationRepository extends JpaRepository<Station, UUID> {
    @org.springframework.data.jpa.repository.Query("SELECT s FROM Station s WHERE lower(s.name) LIKE lower(concat('%', :query, '%')) OR lower(s.city) LIKE lower(concat('%', :query, '%'))")
    org.springframework.data.domain.Page<Station> search(
            @org.springframework.data.repository.query.Param("query") String query,
            org.springframework.data.domain.Pageable pageable);
}
