package com.awad.ticketbooking.modules.booking.entity;

import com.awad.ticketbooking.common.enums.BookingStatus;
import com.awad.ticketbooking.common.model.BaseEntity;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bookings")
@Getter
@Setter
public class Booking extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Ticket> tickets = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_station_id")
    private com.awad.ticketbooking.modules.catalog.entity.Station pickupStation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dropoff_station_id")
    private com.awad.ticketbooking.modules.catalog.entity.Station dropoffStation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pickup_trip_point_id")
    private com.awad.ticketbooking.modules.trip.entity.TripPoint pickupTripPoint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dropoff_trip_point_id")
    private com.awad.ticketbooking.modules.trip.entity.TripPoint dropoffTripPoint;

    @Column(name = "total_price", nullable = false)
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "passenger_name", nullable = false)
    private String passengerName;

    @Column(name = "passenger_phone", nullable = false)
    private String passengerPhone;

    @Column(name = "passenger_id_number")
    private String passengerIdNumber;

    @Column(name = "passenger_email")
    private String passengerEmail;

    @Column(name = "code", unique = true, nullable = false)
    private String code;

    @Column(name = "is_reminder_sent")
    private Boolean reminderSent = false;
}
