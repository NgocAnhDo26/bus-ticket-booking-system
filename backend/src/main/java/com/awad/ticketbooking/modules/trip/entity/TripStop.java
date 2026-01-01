package com.awad.ticketbooking.modules.trip.entity;

import com.awad.ticketbooking.common.enums.StopType;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "trip_stops")
@Getter
@Setter
public class TripStop implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id", nullable = true) // Now nullable - can use custom address instead
    private Station station;

    // Custom stop fields - used when station is null
    @Column(name = "custom_name")
    private String customName;

    @Column(name = "custom_address")
    private String customAddress;

    @Column(name = "stop_order", nullable = false)
    private Integer stopOrder;

    @Column(name = "duration_minutes_from_origin", nullable = false)
    private Integer durationMinutesFromOrigin;

    @Enumerated(EnumType.STRING)
    @Column(name = "stop_type", nullable = false)
    private StopType stopType = StopType.BOTH;

    @Column(name = "estimated_arrival_time")
    private Instant estimatedArrivalTime;

    @Column(name = "normal_price")
    private BigDecimal normalPrice;

    @Column(name = "vip_price")
    private BigDecimal vipPrice;

    /**
     * Returns the display name for this stop.
     * Uses station name if linked to a station, otherwise uses customName.
     */
    public String getDisplayName() {
        if (station != null) {
            return station.getName();
        }
        return customName;
    }

    /**
     * Returns the display address for this stop.
     * Uses station address if linked to a station, otherwise uses customAddress.
     */
    public String getDisplayAddress() {
        if (station != null) {
            return station.getAddress();
        }
        return customAddress;
    }
}
