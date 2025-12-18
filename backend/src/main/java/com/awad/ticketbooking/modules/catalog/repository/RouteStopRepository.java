package com.awad.ticketbooking.modules.catalog.repository;

import com.awad.ticketbooking.modules.catalog.entity.RouteStop;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RouteStopRepository extends JpaRepository<RouteStop, UUID> {
}
