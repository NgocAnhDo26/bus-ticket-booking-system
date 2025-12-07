package com.awad.ticketbooking.modules.catalog.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.util.UUID;

@Entity
@Table(name = "layout_seats", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "layout_id", "seat_code" }),
        @UniqueConstraint(columnNames = { "layout_id", "floor_number", "row_index", "col_index" })
})
@Getter
@Setter
public class LayoutSeat {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "layout_id", nullable = false)
    private BusLayout busLayout;

    @Column(name = "seat_code", nullable = false)
    private String seatCode;

    @Column(name = "seat_type", nullable = false)
    private String seatType = "NORMAL";

    @Column(name = "floor_number")
    private Integer floorNumber = 1;

    @Column(name = "row_index", nullable = false)
    private Integer rowIndex;

    @Column(name = "col_index", nullable = false)
    private Integer colIndex;

    @Column(name = "is_active")
    private Boolean isActive = true;
}
