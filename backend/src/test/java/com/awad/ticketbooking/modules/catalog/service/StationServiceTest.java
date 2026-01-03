package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.catalog.dto.CreateStationRequest;
import com.awad.ticketbooking.modules.catalog.entity.Route;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.catalog.repository.RouteRepository;
import com.awad.ticketbooking.modules.catalog.repository.StationRepository;
import com.awad.ticketbooking.modules.trip.entity.Trip;
import com.awad.ticketbooking.modules.trip.repository.TripRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StationServiceTest {

    @InjectMocks
    private StationService stationService;

    @Mock
    private StationRepository stationRepository;

    @Mock
    private RouteRepository routeRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private BookingRepository bookingRepository;

    private Station testStation;
    private CreateStationRequest createRequest;

    @BeforeEach
    void setUp() {
        testStation = new Station();
        testStation.setId(UUID.randomUUID());
        testStation.setName("Hanoi Station");
        testStation.setCity("Hanoi");
        testStation.setAddress("123 Main St, Hanoi");

        createRequest = new CreateStationRequest();
        createRequest.setName("Hanoi Station");
        createRequest.setCity("Hanoi");
        createRequest.setAddress("123 Main St, Hanoi");
    }

    @Test
    void createStation_success() {
        // Arrange
        when(stationRepository.save(any(Station.class))).thenReturn(testStation);

        // Act
        Station result = stationService.createStation(createRequest);

        // Assert
        assertNotNull(result);
        assertEquals("Hanoi Station", result.getName());
        assertEquals("Hanoi", result.getCity());
        verify(stationRepository).save(any(Station.class));
    }

    @Test
    void getAllStations_success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Station> page = new PageImpl<>(Collections.singletonList(testStation));
        when(stationRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<Station> result = stationService.getAllStations(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Hanoi Station", result.getContent().get(0).getName());
    }

    @Test
    void searchStations_success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Station> page = new PageImpl<>(Collections.singletonList(testStation));
        when(stationRepository.search("Hanoi", pageable)).thenReturn(page);

        // Act
        Page<Station> result = stationService.searchStations("Hanoi", pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }

    @Test
    void updateStation_success() {
        // Arrange
        CreateStationRequest updateRequest = new CreateStationRequest();
        updateRequest.setName("Updated Station");
        updateRequest.setCity("Ho Chi Minh");
        updateRequest.setAddress("456 New St");

        when(stationRepository.findById(testStation.getId())).thenReturn(Optional.of(testStation));
        when(stationRepository.save(any(Station.class))).thenReturn(testStation);

        // Act
        Station result = stationService.updateStation(testStation.getId(), updateRequest);

        // Assert
        assertNotNull(result);
        verify(stationRepository).save(any(Station.class));
    }

    @Test
    void updateStation_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(stationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> stationService.updateStation(nonExistentId, createRequest));
    }

    @Test
    void deleteStation_success() {
        // Arrange
        doNothing().when(stationRepository).deleteById(testStation.getId());

        // Act
        stationService.deleteStation(testStation.getId(), false);

        // Assert
        verify(stationRepository).deleteById(testStation.getId());
    }

    @Test
    void deleteStation_force_cascadesDeletes() {
        // Arrange
        Route route = new Route();
        route.setId(UUID.randomUUID());

        Trip trip = new Trip();
        trip.setId(UUID.randomUUID());

        when(routeRepository.findByOriginStationId(testStation.getId()))
                .thenReturn(Collections.singletonList(route));
        when(routeRepository.findByDestinationStationId(testStation.getId()))
                .thenReturn(Collections.emptyList());
        when(tripRepository.findByRouteId(route.getId()))
                .thenReturn(Collections.singletonList(trip));

        // Act
        stationService.deleteStation(testStation.getId(), true);

        // Assert
        verify(bookingRepository).deleteByTripId(trip.getId());
        verify(tripRepository).deleteByRouteId(route.getId());
        verify(routeRepository).deleteByOriginStationId(testStation.getId());
        verify(stationRepository).deleteById(testStation.getId());
    }
}
