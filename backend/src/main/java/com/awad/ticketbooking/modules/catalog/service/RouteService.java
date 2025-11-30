package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.repository.RouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RouteService {

    private final RouteRepository routeRepository;
    private final com.awad.ticketbooking.modules.catalog.repository.StationRepository stationRepository;

    private final com.awad.ticketbooking.modules.booking.repository.BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "topRoutes")
    public List<Route> getTopRoutes() {
        // Fetch top 5 routes based on booking count
        List<Object[]> results = bookingRepository.findTopRoutes(org.springframework.data.domain.PageRequest.of(0, 5));
        return results.stream()
                .map(result -> (Route) result[0])
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public Route createRoute(com.awad.ticketbooking.modules.catalog.dto.CreateRouteRequest request) {
        com.awad.ticketbooking.modules.catalog.entity.Station origin = stationRepository
                .findById(request.getOriginStationId())
                .orElseThrow(() -> new RuntimeException("Origin station not found"));

        com.awad.ticketbooking.modules.catalog.entity.Station destination = stationRepository
                .findById(request.getDestinationStationId())
                .orElseThrow(() -> new RuntimeException("Destination station not found"));

        Route route = new Route();
        route.setOriginStation(origin);
        route.setDestinationStation(destination);
        route.setDurationMinutes(request.getDurationMinutes());
        route.setDistanceKm(request.getDistanceKm());

        return routeRepository.save(route);
    }
}
