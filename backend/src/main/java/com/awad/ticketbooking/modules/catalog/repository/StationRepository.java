package com.awad.ticketbooking.modules.catalog.repository;

import com.awad.ticketbooking.modules.catalog.entity.Station;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StationRepository extends JpaRepository<Station, UUID> {
    @org.springframework.data.jpa.repository.Query("SELECT s FROM Station s WHERE lower(s.name) LIKE lower(concat('%', :query, '%')) OR lower(s.city) LIKE lower(concat('%', :query, '%'))")
    org.springframework.data.domain.Page<Station> search(
            @org.springframework.data.repository.query.Param("query") String query,
            org.springframework.data.domain.Pageable pageable);

    /**
     * Fulltext search using PostgreSQL tsvector.
     * Falls back to LIKE if search_vector is NULL.
     * Results are ranked by relevance with fulltext matches first.
     */
    @org.springframework.data.jpa.repository.Query(
        value = """
            SELECT * FROM stations s
            WHERE s.search_vector @@ plainto_tsquery('simple', :query)
               OR lower(s.name) LIKE lower(concat('%', :query, '%'))
               OR lower(s.city) LIKE lower(concat('%', :query, '%'))
            ORDER BY 
              CASE 
                WHEN s.search_vector @@ plainto_tsquery('simple', :query) 
                THEN ts_rank(s.search_vector, plainto_tsquery('simple', :query))
                ELSE 0.1
              END DESC
            """,
        countQuery = """
            SELECT COUNT(*) FROM stations s
            WHERE s.search_vector @@ plainto_tsquery('simple', :query)
               OR lower(s.name) LIKE lower(concat('%', :query, '%'))
               OR lower(s.city) LIKE lower(concat('%', :query, '%'))
            """,
        nativeQuery = true)
    org.springframework.data.domain.Page<Station> searchFulltext(
            @org.springframework.data.repository.query.Param("query") String query,
            org.springframework.data.domain.Pageable pageable);
}
