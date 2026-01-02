package com.awad.ticketbooking.modules.catalog.repository;

import com.awad.ticketbooking.modules.catalog.entity.Bus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusRepository extends JpaRepository<Bus, UUID> {
    void deleteByOperatorId(UUID operatorId);

    java.util.List<Bus> findByOperatorId(UUID operatorId);

    @Query("SELECT b FROM Bus b LEFT JOIN FETCH b.photos WHERE b.id = :id")
    Optional<Bus> findByIdWithPhotos(@Param("id") UUID id);
}
