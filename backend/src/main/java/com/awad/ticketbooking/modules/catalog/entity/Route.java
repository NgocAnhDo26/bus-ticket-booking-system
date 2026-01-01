package com.awad.ticketbooking.modules.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "routes")
@Getter
@Setter
public class Route implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "origin_station_id", nullable = false)
    private Station originStation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_station_id", nullable = false)
    private Station destinationStation;

    @Column(name = "name")
    private String name;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "distance_km")
    private BigDecimal distanceKm;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "route", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("stopOrder ASC")
    private java.util.List<RouteStop> stops = new java.util.ArrayList<>();

    @PrePersist
    public void onCreate() {
        this.createdAt = Instant.now();
    }
}
