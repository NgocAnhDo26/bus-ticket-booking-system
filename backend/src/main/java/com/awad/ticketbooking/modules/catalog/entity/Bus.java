package com.awad.ticketbooking.modules.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import com.awad.ticketbooking.common.converter.StringListConverter;
import java.util.List;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "buses")
@Getter
@Setter
public class Bus {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operator_id", nullable = false)
    private Operator operator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_layout_id", nullable = false)
    private BusLayout busLayout;

    @Column(name = "plate_number", nullable = false, unique = true)
    private String plateNumber;

    @Column(columnDefinition = "JSONB")
    @Convert(converter = StringListConverter.class)
    private List<String> amenities;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = Instant.now();
    }
}
