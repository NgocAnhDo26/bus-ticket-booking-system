package com.awad.ticketbooking.modules.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import com.awad.ticketbooking.common.converter.MapConverter;
import java.util.Map;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "operators")
@Getter
@Setter
public class Operator {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "contact_info", columnDefinition = "JSONB")
    @Convert(converter = MapConverter.class)
    private Map<String, Object> contactInfo;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = Instant.now();
    }

}

    