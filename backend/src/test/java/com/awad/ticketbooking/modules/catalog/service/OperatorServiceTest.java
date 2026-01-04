package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.booking.repository.BookingRepository;
import com.awad.ticketbooking.modules.catalog.dto.CreateOperatorRequest;
import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
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

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class OperatorServiceTest {

    @InjectMocks
    private OperatorService operatorService;

    @Mock
    private OperatorRepository operatorRepository;

    @Mock
    private BusRepository busRepository;

    @Mock
    private TripRepository tripRepository;

    @Mock
    private BookingRepository bookingRepository;

    private Operator testOperator;
    private CreateOperatorRequest createRequest;

    @BeforeEach
    void setUp() {
        testOperator = new Operator();
        testOperator.setId(UUID.randomUUID());
        testOperator.setName("VietBus");
        Map<String, Object> contactInfo = new HashMap<>();
        contactInfo.put("email", "contact@vietbus.com");
        testOperator.setContactInfo(contactInfo);

        createRequest = new CreateOperatorRequest();
        createRequest.setName("VietBus");
        createRequest.setContactInfo(contactInfo);
    }

    @Test
    void createOperator_success() {
        // Arrange
        when(operatorRepository.save(any(Operator.class))).thenReturn(testOperator);

        // Act
        Operator result = operatorService.createOperator(createRequest);

        // Assert
        assertNotNull(result);
        assertEquals("VietBus", result.getName());
        assertNotNull(result.getContactInfo());
        assertEquals("contact@vietbus.com", result.getContactInfo().get("email"));
        verify(operatorRepository).save(any(Operator.class));
    }

    @Test
    void getAllOperators_success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Operator> page = new PageImpl<>(Collections.singletonList(testOperator));
        when(operatorRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<Operator> result = operatorService.getAllOperators(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("VietBus", result.getContent().get(0).getName());
    }

    @Test
    void updateOperator_success() {
        // Arrange
        CreateOperatorRequest updateRequest = new CreateOperatorRequest();
        updateRequest.setName("Updated Operator");
        Map<String, Object> newContactInfo = new HashMap<>();
        newContactInfo.put("email", "new@contact.com");
        updateRequest.setContactInfo(newContactInfo);

        when(operatorRepository.findById(testOperator.getId())).thenReturn(Optional.of(testOperator));
        when(operatorRepository.save(any(Operator.class))).thenReturn(testOperator);

        // Act
        Operator result = operatorService.updateOperator(testOperator.getId(), updateRequest);

        // Assert
        assertNotNull(result);
        verify(operatorRepository).save(any(Operator.class));
    }

    @Test
    void updateOperator_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(operatorRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class,
                () -> operatorService.updateOperator(nonExistentId, createRequest));
    }

    @Test
    void deleteOperator_success() {
        // Arrange
        doNothing().when(operatorRepository).deleteById(testOperator.getId());

        // Act
        operatorService.deleteOperator(testOperator.getId(), false);

        // Assert
        verify(operatorRepository).deleteById(testOperator.getId());
    }

    @Test
    void deleteOperator_force_cascadesDeletes() {
        // Arrange
        Bus bus = new Bus();
        bus.setId(UUID.randomUUID());

        Trip trip = new Trip();
        trip.setId(UUID.randomUUID());

        when(busRepository.findByOperatorId(testOperator.getId()))
                .thenReturn(Collections.singletonList(bus));
        when(tripRepository.findByBusId(bus.getId()))
                .thenReturn(Collections.singletonList(trip));

        // Act
        operatorService.deleteOperator(testOperator.getId(), true);

        // Assert
        verify(bookingRepository).deleteByTripId(trip.getId());
        verify(tripRepository).deleteByBusId(bus.getId());
        verify(busRepository).deleteByOperatorId(testOperator.getId());
        verify(operatorRepository).deleteById(testOperator.getId());
    }
}
