package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.catalog.dto.CreateBusRequest;
import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.entity.BusLayout;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.repository.BusLayoutRepository;
import com.awad.ticketbooking.modules.catalog.repository.BusPhotoRepository;
import com.awad.ticketbooking.modules.catalog.repository.BusRepository;
import com.awad.ticketbooking.modules.catalog.repository.OperatorRepository;
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

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BusServiceTest {

    @InjectMocks
    private BusService busService;

    @Mock
    private BusRepository busRepository;

    @Mock
    private OperatorRepository operatorRepository;

    @Mock
    private BusLayoutRepository busLayoutRepository;

    @Mock
    private BusPhotoRepository busPhotoRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private BookingRepository bookingRepository;

    private Bus testBus;
    private Operator testOperator;
    private BusLayout testBusLayout;
    private CreateBusRequest createRequest;

    @BeforeEach
    void setUp() {
        testOperator = new Operator();
        testOperator.setId(UUID.randomUUID());
        testOperator.setName("VietBus");

        testBusLayout = new BusLayout();
        testBusLayout.setId(UUID.randomUUID());
        testBusLayout.setName("Standard 40");
        testBusLayout.setTotalSeats(40);

        testBus = new Bus();
        testBus.setId(UUID.randomUUID());
        testBus.setPlateNumber("29A-12345");
        testBus.setOperator(testOperator);
        testBus.setBusLayout(testBusLayout);
        testBus.setAmenities(List.of("wifi", "ac"));
        testBus.setPhotos(new ArrayList<>());

        createRequest = new CreateBusRequest();
        createRequest.setOperatorId(testOperator.getId());
        createRequest.setBusLayoutId(testBusLayout.getId());
        createRequest.setPlateNumber("29A-12345");
        createRequest.setAmenities(List.of("wifi", "ac"));
    }

    @Test
    void createBus_success() {
        // Arrange
        when(operatorRepository.findById(testOperator.getId())).thenReturn(Optional.of(testOperator));
        when(busLayoutRepository.findById(testBusLayout.getId())).thenReturn(Optional.of(testBusLayout));
        when(busRepository.save(any(Bus.class))).thenReturn(testBus);

        // Act
        Bus result = busService.createBus(createRequest);

        // Assert
        assertNotNull(result);
        assertEquals("29A-12345", result.getPlateNumber());
        assertEquals("VietBus", result.getOperator().getName());
        verify(busRepository).save(any(Bus.class));
    }

    @Test
    void createBus_withPhotos_success() {
        // Arrange
        createRequest.setPhotos(List.of("photo1.jpg", "photo2.jpg"));
        when(operatorRepository.findById(testOperator.getId())).thenReturn(Optional.of(testOperator));
        when(busLayoutRepository.findById(testBusLayout.getId())).thenReturn(Optional.of(testBusLayout));
        when(busRepository.save(any(Bus.class))).thenReturn(testBus);

        // Act
        Bus result = busService.createBus(createRequest);

        // Assert
        assertNotNull(result);
        verify(busPhotoRepository).saveAll(anyList());
    }

    @Test
    void createBus_operatorNotFound_throwsException() {
        // Arrange
        when(operatorRepository.findById(testOperator.getId())).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> busService.createBus(createRequest));
        assertEquals("Operator not found", exception.getMessage());
    }

    @Test
    void createBus_busLayoutNotFound_throwsException() {
        // Arrange
        when(operatorRepository.findById(testOperator.getId())).thenReturn(Optional.of(testOperator));
        when(busLayoutRepository.findById(testBusLayout.getId())).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> busService.createBus(createRequest));
        assertEquals("Bus layout not found", exception.getMessage());
    }

    @Test
    void updateBus_success() {
        // Arrange
        CreateBusRequest updateRequest = new CreateBusRequest();
        updateRequest.setOperatorId(testOperator.getId());
        updateRequest.setBusLayoutId(testBusLayout.getId());
        updateRequest.setPlateNumber("30B-54321");
        updateRequest.setAmenities(List.of("wifi"));

        when(busRepository.findById(testBus.getId())).thenReturn(Optional.of(testBus));
        when(operatorRepository.findById(testOperator.getId())).thenReturn(Optional.of(testOperator));
        when(busLayoutRepository.findById(testBusLayout.getId())).thenReturn(Optional.of(testBusLayout));
        when(busRepository.save(any(Bus.class))).thenReturn(testBus);

        // Act
        Bus result = busService.updateBus(testBus.getId(), updateRequest);

        // Assert
        assertNotNull(result);
        verify(busRepository).save(any(Bus.class));
    }

    @Test
    void updateBus_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(busRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> busService.updateBus(nonExistentId, createRequest));
        assertEquals("Bus not found", exception.getMessage());
    }

    @Test
    void deleteBus_success() {
        // Arrange
        when(busRepository.existsById(testBus.getId())).thenReturn(true);
        doNothing().when(busRepository).deleteById(testBus.getId());

        // Act
        busService.deleteBus(testBus.getId(), false);

        // Assert
        verify(busRepository).deleteById(testBus.getId());
    }

    @Test
    void deleteBus_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(busRepository.existsById(nonExistentId)).thenReturn(false);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> busService.deleteBus(nonExistentId, false));
        assertEquals("Bus not found", exception.getMessage());
    }

    @Test
    void deleteBus_force_cascadesDeletes() {
        // Arrange
        Trip trip = new Trip();
        trip.setId(UUID.randomUUID());

        when(busRepository.existsById(testBus.getId())).thenReturn(true);
        when(tripRepository.findByBusId(testBus.getId())).thenReturn(Collections.singletonList(trip));

        // Act
        busService.deleteBus(testBus.getId(), true);

        // Assert
        verify(bookingRepository).deleteByTripId(trip.getId());
        verify(tripRepository).deleteByBusId(testBus.getId());
        verify(busRepository).deleteById(testBus.getId());
    }

    @Test
    void getBusById_success() {
        // Arrange
        when(busRepository.findById(testBus.getId())).thenReturn(Optional.of(testBus));

        // Act
        Bus result = busService.getBusById(testBus.getId());

        // Assert
        assertNotNull(result);
        assertEquals("29A-12345", result.getPlateNumber());
    }

    @Test
    void getBusById_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(busRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> busService.getBusById(nonExistentId));
        assertEquals("Bus not found", exception.getMessage());
    }

    @Test
    void getAllBuses_success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Bus> page = new PageImpl<>(Collections.singletonList(testBus));
        when(busRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<Bus> result = busService.getAllBuses(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
    }
}
