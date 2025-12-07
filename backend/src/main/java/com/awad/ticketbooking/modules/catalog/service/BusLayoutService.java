package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.catalog.dto.BusLayoutPayload;
import com.awad.ticketbooking.modules.catalog.entity.BusLayout;
import com.awad.ticketbooking.modules.catalog.entity.LayoutSeat;
import com.awad.ticketbooking.modules.catalog.repository.BusLayoutRepository;
import com.awad.ticketbooking.modules.catalog.repository.LayoutSeatRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BusLayoutService {

    private final BusLayoutRepository busLayoutRepository;
    private final LayoutSeatRepository layoutSeatRepository;
    private final EntityManager entityManager;

    @Transactional
    public BusLayout createLayout(BusLayoutPayload.BusLayoutRequest request) {
        BusLayout layout = new BusLayout();
        layout.setName(request.getName());
        layout.setBusType(request.getBusType());
        layout.setTotalFloors(request.getTotalFloors());
        layout.setTotalRows(request.getTotalRows());
        layout.setTotalCols(request.getTotalCols());
        layout.setDescription(request.getDescription());
        layout.setTotalSeats(0); // Initialize with 0

        return busLayoutRepository.save(layout);
    }

    @Transactional
    public void updateLayoutSeats(UUID layoutId, BusLayoutPayload.SeatUpdatePayload payload) {
        BusLayout layout = busLayoutRepository.findById(layoutId)
                .orElseThrow(() -> new RuntimeException("Layout not found")); // In real app use custom exception

        // 1. Wipe existing seats
        layoutSeatRepository.deleteByBusLayoutId(layoutId);
        // Flush to ensure deletion is committed before insert to avoid unique constraint violation
        entityManager.flush();

        // 2. Insert new seats
        List<LayoutSeat> newSeats = new ArrayList<>();
        for (BusLayoutPayload.LayoutSeatDto dto : payload.getSeats()) {
            LayoutSeat seat = new LayoutSeat();
            seat.setBusLayout(layout);
            seat.setSeatCode(dto.getSeatCode());
            seat.setSeatType(dto.getType());
            seat.setFloorNumber(dto.getFloor());
            seat.setRowIndex(dto.getRow());
            seat.setColIndex(dto.getCol());
            newSeats.add(seat);
        }
        layoutSeatRepository.saveAll(newSeats);

        // 3. Update total seats
        layout.setTotalSeats(newSeats.size());
        busLayoutRepository.save(layout);
    }

    @Transactional
    public BusLayout updateLayoutMetadata(UUID id, BusLayoutPayload.BusLayoutRequest request) {
        BusLayout layout = busLayoutRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Layout not found"));
        
        layout.setName(request.getName());
        layout.setBusType(request.getBusType());
        layout.setTotalFloors(request.getTotalFloors());
        layout.setTotalRows(request.getTotalRows());
        layout.setTotalCols(request.getTotalCols());
        layout.setDescription(request.getDescription());
        
        return busLayoutRepository.save(layout);
    }

    @Transactional
    public void deleteLayout(UUID id) {
        layoutSeatRepository.deleteByBusLayoutId(id);
        busLayoutRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public BusLayoutPayload.BusLayoutResponse getLayout(UUID layoutId) {
        BusLayout layout = busLayoutRepository.findById(layoutId)
                .orElseThrow(() -> new RuntimeException("Layout not found"));

        List<LayoutSeat> seats = layoutSeatRepository.findByBusLayoutId(layoutId);

        BusLayoutPayload.BusLayoutResponse response = new BusLayoutPayload.BusLayoutResponse();
        response.setId(layout.getId());
        response.setName(layout.getName());
        response.setBusType(layout.getBusType());
        response.setTotalSeats(layout.getTotalSeats());
        response.setTotalFloors(layout.getTotalFloors());
        response.setTotalRows(layout.getTotalRows());
        response.setTotalCols(layout.getTotalCols());
        response.setDescription(layout.getDescription());

        List<BusLayoutPayload.LayoutSeatDto> seatDtos = seats.stream().map(s -> {
            BusLayoutPayload.LayoutSeatDto dto = new BusLayoutPayload.LayoutSeatDto();
            dto.setSeatCode(s.getSeatCode());
            dto.setType(s.getSeatType());
            dto.setFloor(s.getFloorNumber());
            dto.setRow(s.getRowIndex());
            dto.setCol(s.getColIndex());
            return dto;
        }).collect(Collectors.toList());

        response.setSeats(seatDtos);
        return response;
    }

    @Transactional(readOnly = true)
    public List<BusLayoutPayload.BusLayoutResponse> getAllLayouts() {
        return busLayoutRepository.findAll().stream().map(layout -> {
            BusLayoutPayload.BusLayoutResponse response = new BusLayoutPayload.BusLayoutResponse();
            response.setId(layout.getId());
            response.setName(layout.getName());
            response.setBusType(layout.getBusType());
            response.setTotalSeats(layout.getTotalSeats());
            response.setTotalFloors(layout.getTotalFloors());
            response.setTotalRows(layout.getTotalRows());
            response.setTotalCols(layout.getTotalCols());
            response.setDescription(layout.getDescription());
            response.setSeats(List.of()); 
            return response;
        }).collect(Collectors.toList());
    }
}
