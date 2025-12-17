package com.awad.ticketbooking.modules.trip.service;

import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.entity.BusLayout;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.trip.dto.SearchTripRequest;
import com.awad.ticketbooking.modules.trip.dto.TripResponse;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.awad.ticketbooking.modules.trip.repository.TripPricingRepository;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.Collections;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TripServiceTest {

    @Mock
    private TripRepository tripRepository;

    @Mock
    private TripPricingRepository tripPricingRepository;

    @InjectMocks
    private TripService tripService;

    @Test
    void searchTrips_shouldReturnTrips() {
        // Arrange
        SearchTripRequest request = new SearchTripRequest();
        request.setOrigin("Hanoi");
        request.setDestination("Saigon");

        // Mock Trip Entity
        Trip trip = new Trip();
        trip.setId(UUID.randomUUID());
        trip.setDepartureTime(Instant.now());
        trip.setArrivalTime(Instant.now().plusSeconds(3600));

        Station origin = new Station();
        origin.setCity("Hanoi");

        Station dest = new Station();
        dest.setCity("Saigon");

        Route route = new Route();
        route.setOriginStation(origin);
        route.setDestinationStation(dest);
        route.setDurationMinutes(60);
        trip.setRoute(route);

        Operator operator = new Operator();
        operator.setName("Test Operator");

        Bus bus = new Bus();
        BusLayout layout = new BusLayout();
        layout.setId(UUID.randomUUID());
        layout.setTotalSeats(40);
        bus.setBusLayout(layout);
        bus.setOperator(operator);
        bus.setPlateNumber("29A-12345");
        bus.setAmenities(Collections.singletonList("wifi"));
        trip.setBus(bus);

        Page<Trip> page = new PageImpl<>(Collections.singletonList(trip));
        when(tripRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        // Act
        Page<TripResponse> result = tripService.searchTrips(request);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Hanoi", result.getContent().get(0).getRoute().getOriginStation().getCity());

        verify(tripRepository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getTripById_shouldReturnTrip() {
        // Arrange
        UUID tripId = UUID.randomUUID();
        Trip trip = new Trip();
        trip.setId(tripId);
        trip.setDepartureTime(Instant.now());
        trip.setArrivalTime(Instant.now().plusSeconds(3600));

        Station origin = new Station();
        origin.setCity("Hanoi");

        Station dest = new Station();
        dest.setCity("Saigon");

        Route route = new Route();
        route.setOriginStation(origin);
        route.setDestinationStation(dest);
        route.setDurationMinutes(60);
        trip.setRoute(route);

        Operator operator = new Operator();
        operator.setName("Test Operator");

        Bus bus = new Bus();
        BusLayout layout = new BusLayout();
        layout.setId(UUID.randomUUID());
        layout.setTotalSeats(40);
        bus.setBusLayout(layout);
        bus.setOperator(operator);
        bus.setPlateNumber("29A-12345");
        bus.setAmenities(Collections.singletonList("wifi"));
        trip.setBus(bus);

        when(tripRepository.findById(tripId)).thenReturn(java.util.Optional.of(trip));

        // Act
        TripResponse result = tripService.getTripById(tripId);

        // Assert
        assertNotNull(result);
        assertEquals(tripId, result.getId());
        assertEquals("Hanoi", result.getRoute().getOriginStation().getCity());

        verify(tripRepository).findById(tripId);
    }
}
