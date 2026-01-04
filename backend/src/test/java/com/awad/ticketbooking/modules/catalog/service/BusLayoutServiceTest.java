package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.common.enums.SeatType;
import com.awad.ticketbooking.modules.catalog.dto.BusLayoutPayload;
import com.awad.ticketbooking.modules.catalog.entity.BusLayout;
import com.awad.ticketbooking.modules.catalog.entity.LayoutSeat;
import com.awad.ticketbooking.modules.catalog.repository.BusLayoutRepository;
import com.awad.ticketbooking.modules.catalog.repository.LayoutSeatRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BusLayoutServiceTest {

    @InjectMocks
    private BusLayoutService busLayoutService;

    @Mock
    private BusLayoutRepository busLayoutRepository;

    @Mock
    private LayoutSeatRepository layoutSeatRepository;

    @Mock
    private EntityManager entityManager;

    private BusLayout testBusLayout;
    private BusLayoutPayload.BusLayoutRequest createRequest;

    @BeforeEach
    void setUp() {
        testBusLayout = new BusLayout();
        testBusLayout.setId(UUID.randomUUID());
        testBusLayout.setName("Standard 40 Seats");
        testBusLayout.setBusType("Standard");
        testBusLayout.setTotalFloors(1);
        testBusLayout.setTotalRows(10);
        testBusLayout.setTotalCols(4);
        testBusLayout.setTotalSeats(40);
        testBusLayout.setDescription("Standard bus layout with 40 seats");

        createRequest = new BusLayoutPayload.BusLayoutRequest();
        createRequest.setName("Standard 40 Seats");
        createRequest.setBusType("Standard");
        createRequest.setTotalFloors(1);
        createRequest.setTotalRows(10);
        createRequest.setTotalCols(4);
        createRequest.setDescription("Standard bus layout with 40 seats");
    }

    @Test
    void createLayout_success() {
        // Arrange
        when(busLayoutRepository.save(any(BusLayout.class))).thenReturn(testBusLayout);

        // Act
        BusLayout result = busLayoutService.createLayout(createRequest);

        // Assert
        assertNotNull(result);
        assertEquals("Standard 40 Seats", result.getName());
        assertEquals("Standard", result.getBusType());
        verify(busLayoutRepository).save(any(BusLayout.class));
    }

    @Test
    void updateLayoutMetadata_success() {
        // Arrange
        BusLayoutPayload.BusLayoutRequest updateRequest = new BusLayoutPayload.BusLayoutRequest();
        updateRequest.setName("Updated Layout");
        updateRequest.setBusType("Sleeper");
        updateRequest.setTotalFloors(2);
        updateRequest.setTotalRows(8);
        updateRequest.setTotalCols(3);
        updateRequest.setDescription("Updated description");

        when(busLayoutRepository.findById(testBusLayout.getId())).thenReturn(Optional.of(testBusLayout));
        when(busLayoutRepository.save(any(BusLayout.class))).thenReturn(testBusLayout);

        // Act
        BusLayout result = busLayoutService.updateLayoutMetadata(testBusLayout.getId(), updateRequest);

        // Assert
        assertNotNull(result);
        verify(busLayoutRepository).save(any(BusLayout.class));
    }

    @Test
    void updateLayoutMetadata_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(busLayoutRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> busLayoutService.updateLayoutMetadata(nonExistentId, createRequest));
        assertEquals("Layout not found", exception.getMessage());
    }

    @Test
    void updateLayoutSeats_success() {
        // Arrange
        BusLayoutPayload.SeatUpdatePayload payload = new BusLayoutPayload.SeatUpdatePayload();
        BusLayoutPayload.LayoutSeatDto seatDto = new BusLayoutPayload.LayoutSeatDto();
        seatDto.setSeatCode("A1");
        seatDto.setType(SeatType.NORMAL.name());
        seatDto.setFloor(1);
        seatDto.setRow(0);
        seatDto.setCol(0);
        payload.setSeats(List.of(seatDto));

        when(busLayoutRepository.findById(testBusLayout.getId())).thenReturn(Optional.of(testBusLayout));
        when(busLayoutRepository.save(any(BusLayout.class))).thenReturn(testBusLayout);

        // Act
        busLayoutService.updateLayoutSeats(testBusLayout.getId(), payload);

        // Assert
        verify(layoutSeatRepository).deleteByBusLayoutId(testBusLayout.getId());
        verify(entityManager).flush();
        verify(layoutSeatRepository).saveAll(anyList());
        verify(busLayoutRepository).save(any(BusLayout.class));
    }

    @Test
    void updateLayoutSeats_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        BusLayoutPayload.SeatUpdatePayload payload = new BusLayoutPayload.SeatUpdatePayload();
        payload.setSeats(Collections.emptyList());

        when(busLayoutRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> busLayoutService.updateLayoutSeats(nonExistentId, payload));
        assertEquals("Layout not found", exception.getMessage());
    }

    @Test
    void deleteLayout_success() {
        // Arrange
        doNothing().when(layoutSeatRepository).deleteByBusLayoutId(testBusLayout.getId());
        doNothing().when(busLayoutRepository).deleteById(testBusLayout.getId());

        // Act
        busLayoutService.deleteLayout(testBusLayout.getId());

        // Assert
        verify(layoutSeatRepository).deleteByBusLayoutId(testBusLayout.getId());
        verify(busLayoutRepository).deleteById(testBusLayout.getId());
    }

    @Test
    void getLayout_success() {
        // Arrange
        LayoutSeat seat = new LayoutSeat();
        seat.setId(UUID.randomUUID());
        seat.setBusLayout(testBusLayout);
        seat.setSeatCode("A1");
        seat.setSeatType(SeatType.NORMAL.name());
        seat.setFloorNumber(1);
        seat.setRowIndex(0);
        seat.setColIndex(0);

        when(busLayoutRepository.findById(testBusLayout.getId())).thenReturn(Optional.of(testBusLayout));
        when(layoutSeatRepository.findByBusLayoutId(testBusLayout.getId()))
                .thenReturn(Collections.singletonList(seat));

        // Act
        BusLayoutPayload.BusLayoutResponse result = busLayoutService.getLayout(testBusLayout.getId());

        // Assert
        assertNotNull(result);
        assertEquals("Standard 40 Seats", result.getName());
        assertEquals(1, result.getSeats().size());
        assertEquals("A1", result.getSeats().get(0).getSeatCode());
    }

    @Test
    void getLayout_notFound_throwsException() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(busLayoutRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class,
                () -> busLayoutService.getLayout(nonExistentId));
        assertEquals("Layout not found", exception.getMessage());
    }

    @Test
    void getAllLayouts_success() {
        // Arrange
        when(busLayoutRepository.findAll()).thenReturn(Collections.singletonList(testBusLayout));

        // Act
        List<BusLayoutPayload.BusLayoutResponse> result = busLayoutService.getAllLayouts();

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Standard 40 Seats", result.get(0).getName());
        assertTrue(result.get(0).getSeats().isEmpty()); // getAllLayouts returns empty seats
    }
}
