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
    private final com.awad.ticketbooking.modules.trip.repository.TripRepository tripRepository;
    private final com.awad.ticketbooking.modules.booking.repository.BookingRepository bookingRepository;

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

    @Transactional
    public Bus updateBus(java.util.UUID id, CreateBusRequest request) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus not found"));

        Operator operator = operatorRepository.findById(request.getOperatorId())
                .orElseThrow(() -> new RuntimeException("Operator not found"));

        bus.setOperator(operator);
        bus.setPlateNumber(request.getPlateNumber());
        bus.setCapacity(request.getCapacity());
        bus.setAmenities(request.getAmenities());

        return busRepository.save(bus);
    }

    @Transactional
    public void deleteBus(java.util.UUID id, boolean force) {
        if (!busRepository.existsById(id)) {
            throw new RuntimeException("Bus not found");
        }
        if (force) {
            List<com.awad.ticketbooking.modules.trip.entity.Trip> trips = tripRepository.findByBusId(id);
            for (com.awad.ticketbooking.modules.trip.entity.Trip trip : trips) {
                bookingRepository.deleteByTripId(trip.getId());
            }
            tripRepository.deleteByBusId(id);
        }
        busRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<Bus> getAllBuses() {
        return busRepository.findAll();
    }
}
