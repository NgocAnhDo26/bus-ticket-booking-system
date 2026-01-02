package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.catalog.dto.CreateStationRequest;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.catalog.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StationService {

    private final StationRepository stationRepository;
    private final com.awad.ticketbooking.modules.catalog.repository.RouteRepository routeRepository;
    private final com.awad.ticketbooking.modules.trip.repository.TripRepository tripRepository;
    private final com.awad.ticketbooking.modules.booking.repository.BookingRepository bookingRepository;

    @Transactional
    public Station createStation(CreateStationRequest request) {
        Station station = new Station();
        station.setName(request.getName());
        station.setCity(request.getCity());
        station.setAddress(request.getAddress());
        return stationRepository.save(station);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<Station> getAllStations(
            org.springframework.data.domain.Pageable pageable) {
        return stationRepository.findAll(pageable);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<Station> searchStations(String query,
            org.springframework.data.domain.Pageable pageable) {
        // Try fulltext search first, fallback to LIKE if it fails
        try {
            return stationRepository.searchFulltext(query, pageable);
        } catch (Exception e) {
            log.warn("Fulltext search failed, falling back to LIKE: {}", e.getMessage());
            return stationRepository.search(query, pageable);
        }
    }

    @Transactional
    public Station updateStation(java.util.UUID id, CreateStationRequest request) {
        Station station = stationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Station not found"));
        station.setName(request.getName());
        station.setCity(request.getCity());
        station.setAddress(request.getAddress());
        return stationRepository.save(station);
    }

    @Transactional
    public void deleteStation(java.util.UUID id, boolean force) {
        if (force) {
            // 1. Handle Routes where this station is Origin
            List<com.awad.ticketbooking.modules.catalog.entity.Route> originRoutes = routeRepository
                    .findByOriginStationId(id);
            for (com.awad.ticketbooking.modules.catalog.entity.Route route : originRoutes) {
                // Delete trips for this route
                List<com.awad.ticketbooking.modules.trip.entity.Trip> trips = tripRepository
                        .findByRouteId(route.getId());
                for (com.awad.ticketbooking.modules.trip.entity.Trip trip : trips) {
                    bookingRepository.deleteByTripId(trip.getId());
                }
                tripRepository.deleteByRouteId(route.getId());
            }
            routeRepository.deleteByOriginStationId(id);

            // 2. Handle Routes where this station is Destination
            List<com.awad.ticketbooking.modules.catalog.entity.Route> destRoutes = routeRepository
                    .findByDestinationStationId(id);
            for (com.awad.ticketbooking.modules.catalog.entity.Route route : destRoutes) {
                // Delete trips for this route
                List<com.awad.ticketbooking.modules.trip.entity.Trip> trips = tripRepository
                        .findByRouteId(route.getId());
                for (com.awad.ticketbooking.modules.trip.entity.Trip trip : trips) {
                    bookingRepository.deleteByTripId(trip.getId());
                }
                tripRepository.deleteByRouteId(route.getId());
            }
            routeRepository.deleteByDestinationStationId(id);
        }
        stationRepository.deleteById(id);
    }
}
