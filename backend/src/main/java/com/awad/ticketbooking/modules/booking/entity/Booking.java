package com.awad.ticketbooking.modules.booking.entity;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.common.model.BaseEntity;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "bookings")
@Getter
@Setter
public class Booking extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "seat_number", nullable = false)
    private String seatNumber;

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "passenger_name", nullable = false)
    private String passengerName;

    @Column(name = "passenger_phone", nullable = false)
    private String passengerPhone;
}
