package com.awad.ticketbooking.modules.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "bus_layouts")
@Getter
@Setter
public class BusLayout {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "bus_type", nullable = false)
    private String busType; // Keeping as String to match V1 SQL "web-style" enum, or could use real Enum if
                            // defined

    @Column(name = "total_seats", nullable = false)
    private Integer totalSeats;

    @Column(name = "total_floors")
    private Integer totalFloors = 1;

    @Column
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = Instant.now();
    }
}
