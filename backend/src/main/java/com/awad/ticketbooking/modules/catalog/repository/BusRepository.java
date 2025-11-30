package com.awad.ticketbooking.modules.catalog.repository;

import com.awad.ticketbooking.modules.catalog.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BusRepository extends JpaRepository<Bus, UUID> {
}
