package com.awad.ticketbooking.modules.trip.entity;

import com.awad.ticketbooking.common.enums.StopType;
import com.awad.ticketbooking.modules.catalog.entity.RouteStop;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "trip_points")
@Getter
@Setter
public class TripPoint {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = false)
    private Station station;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_stop_id")
    private RouteStop routeStop;

    @Column(name = "point_order", nullable = false)
    private Integer pointOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "point_type", nullable = false)
    private StopType pointType;

    @Column(name = "scheduled_time", nullable = false)
    private Instant scheduledTime;

    @Column(name = "actual_time")
    private Instant actualTime;

    @Column(name = "surcharge")
    private BigDecimal surcharge = BigDecimal.ZERO;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();
}
