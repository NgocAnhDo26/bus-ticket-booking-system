package com.awad.ticketbooking.modules.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.io.Serializable;
import java.util.UUID;

import com.awad.ticketbooking.common.enums.StopType;

@Entity
@Table(name = "route_stops")
@Getter
@Setter
public class RouteStop implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Route route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = true)
    private Station station;

    @Column(name = "custom_name")
    private String customName;

    @Column(name = "custom_address")
    private String customAddress;

    @Column(name = "stop_order", nullable = false)
    private Integer stopOrder;

    @Column(name = "duration_minutes_from_origin", nullable = false)
    private Integer durationMinutesFromOrigin;

    @Column(name = "default_surcharge", precision = 15, scale = 2)
    private java.math.BigDecimal defaultSurcharge = java.math.BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "stop_type", nullable = false)
    private StopType stopType = StopType.BOTH;
}
