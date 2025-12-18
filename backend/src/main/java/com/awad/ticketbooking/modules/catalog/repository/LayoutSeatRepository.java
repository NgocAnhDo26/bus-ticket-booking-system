package com.awad.ticketbooking.modules.catalog.repository;

import com.awad.ticketbooking.modules.catalog.entity.LayoutSeat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LayoutSeatRepository extends JpaRepository<LayoutSeat, UUID> {
    void deleteByBusLayoutId(UUID layoutId);
    List<LayoutSeat> findByBusLayoutId(UUID layoutId);


}
