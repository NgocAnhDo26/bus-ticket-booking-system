package com.awad.ticketbooking.modules.booking.repository;

import com.awad.ticketbooking.modules.booking.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {
}

