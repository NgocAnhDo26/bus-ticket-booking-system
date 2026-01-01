package com.awad.ticketbooking.modules.booking.repository;

import com.awad.ticketbooking.modules.booking.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TicketRepository extends JpaRepository<Ticket, UUID> {

    @Query("SELECT t.seatCode FROM Ticket t WHERE t.booking.trip.id = :tripId AND t.booking.status IN ('PENDING', 'CONFIRMED')")
    List<String> findBookedSeatCodesByTripId(@Param("tripId") UUID tripId);

    List<Ticket> findByBookingTripIdAndSeatCodeIn(UUID tripId, List<String> seatCodes);

    List<Ticket> findAllByBookingTripId(UUID tripId);
}
