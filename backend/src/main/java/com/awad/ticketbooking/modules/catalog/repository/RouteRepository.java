package com.awad.ticketbooking.modules.catalog.repository;

import com.awad.ticketbooking.modules.catalog.entity.Route;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface RouteRepository extends JpaRepository<Route, UUID> {
    void deleteByOriginStationId(UUID originStationId);

    void deleteByDestinationStationId(UUID destinationStationId);

    java.util.List<Route> findByOriginStationId(UUID originStationId);

    java.util.List<Route> findByDestinationStationId(UUID destinationStationId);

    @org.springframework.data.jpa.repository.Query("SELECT r FROM Route r JOIN r.originStation os JOIN r.destinationStation ds WHERE lower(os.name) LIKE lower(concat('%', :query, '%')) OR lower(os.city) LIKE lower(concat('%', :query, '%')) OR lower(ds.name) LIKE lower(concat('%', :query, '%')) OR lower(ds.city) LIKE lower(concat('%', :query, '%'))")
    org.springframework.data.domain.Page<Route> search(
            @org.springframework.data.repository.query.Param("query") String query,
            org.springframework.data.domain.Pageable pageable);

    /**
     * Fulltext search using PostgreSQL tsvector.
     * Searches in route's search_vector and related station search_vectors.
     * Falls back to LIKE if search_vector is NULL.
     * Results are ranked by relevance.
     */
    @org.springframework.data.jpa.repository.Query(
        value = """
            SELECT r.* FROM routes r
            JOIN stations os ON r.origin_station_id = os.id
            JOIN stations ds ON r.destination_station_id = ds.id
            WHERE r.search_vector @@ plainto_tsquery('simple', :query)
               OR os.search_vector @@ plainto_tsquery('simple', :query)
               OR ds.search_vector @@ plainto_tsquery('simple', :query)
               OR lower(os.name) LIKE lower(concat('%', :query, '%'))
               OR lower(os.city) LIKE lower(concat('%', :query, '%'))
               OR lower(ds.name) LIKE lower(concat('%', :query, '%'))
               OR lower(ds.city) LIKE lower(concat('%', :query, '%'))
            ORDER BY 
              GREATEST(
                CASE WHEN r.search_vector @@ plainto_tsquery('simple', :query) 
                     THEN ts_rank(r.search_vector, plainto_tsquery('simple', :query)) ELSE 0 END,
                CASE WHEN os.search_vector @@ plainto_tsquery('simple', :query) 
                     THEN ts_rank(os.search_vector, plainto_tsquery('simple', :query)) ELSE 0 END,
                CASE WHEN ds.search_vector @@ plainto_tsquery('simple', :query) 
                     THEN ts_rank(ds.search_vector, plainto_tsquery('simple', :query)) ELSE 0 END
              ) DESC
            """,
        countQuery = """
            SELECT COUNT(*) FROM routes r
            JOIN stations os ON r.origin_station_id = os.id
            JOIN stations ds ON r.destination_station_id = ds.id
            WHERE r.search_vector @@ plainto_tsquery('simple', :query)
               OR os.search_vector @@ plainto_tsquery('simple', :query)
               OR ds.search_vector @@ plainto_tsquery('simple', :query)
               OR lower(os.name) LIKE lower(concat('%', :query, '%'))
               OR lower(os.city) LIKE lower(concat('%', :query, '%'))
               OR lower(ds.name) LIKE lower(concat('%', :query, '%'))
               OR lower(ds.city) LIKE lower(concat('%', :query, '%'))
            """,
        nativeQuery = true)
    org.springframework.data.domain.Page<Route> searchFulltext(
            @org.springframework.data.repository.query.Param("query") String query,
            org.springframework.data.domain.Pageable pageable);
}
