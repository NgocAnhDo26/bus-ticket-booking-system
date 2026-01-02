package com.awad.ticketbooking.modules.catalog.repository;

import com.awad.ticketbooking.modules.catalog.entity.BusPhoto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BusPhotoRepository extends JpaRepository<BusPhoto, UUID> {
    List<BusPhoto> findByBusIdOrderByDisplayOrderAsc(UUID busId);
    
    void deleteByBusId(UUID busId);
}
