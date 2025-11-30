package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.catalog.dto.CreateBusRequest;
import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.repository.BusRepository;
import com.awad.ticketbooking.modules.catalog.repository.OperatorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BusService {

    private final BusRepository busRepository;
    private final OperatorRepository operatorRepository;

    @Transactional
    public Bus createBus(CreateBusRequest request) {
        Operator operator = operatorRepository.findById(request.getOperatorId())
                .orElseThrow(() -> new RuntimeException("Operator not found"));

        Bus bus = new Bus();
        bus.setOperator(operator);
        bus.setPlateNumber(request.getPlateNumber());
        bus.setCapacity(request.getCapacity());
        bus.setAmenities(request.getAmenities());

        return busRepository.save(bus);
    }

    @Transactional(readOnly = true)
    public List<Bus> getAllBuses() {
        return busRepository.findAll();
    }
}
