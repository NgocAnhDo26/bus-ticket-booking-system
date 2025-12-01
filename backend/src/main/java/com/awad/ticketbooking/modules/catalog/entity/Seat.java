package com.awad.ticketbooking.modules.catalog.entity;

import com.awad.ticketbooking.common.enums.SeatType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "seats")
@Getter
@Setter
public class Seat {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id", nullable = false)
    private Bus bus;

    @Column(name = "seat_code", nullable = false)
    private String seatCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeatType type = SeatType.NORMAL;

    @Column(name = "is_active")
    private Boolean isActive = true;
}
