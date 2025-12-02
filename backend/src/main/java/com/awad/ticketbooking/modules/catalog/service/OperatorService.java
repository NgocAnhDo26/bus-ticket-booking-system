package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.catalog.dto.CreateOperatorRequest;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.repository.OperatorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OperatorService {

    private final OperatorRepository operatorRepository;
    private final com.awad.ticketbooking.modules.catalog.repository.BusRepository busRepository;
    private final com.awad.ticketbooking.modules.trip.repository.TripRepository tripRepository;
    private final com.awad.ticketbooking.modules.booking.repository.BookingRepository bookingRepository;

    @Transactional
    public Operator createOperator(CreateOperatorRequest request) {
        Operator operator = new Operator();
        operator.setName(request.getName());
        operator.setContactInfo(request.getContactInfo());
        return operatorRepository.save(operator);
    }

    @Transactional(readOnly = true)
    public List<Operator> getAllOperators() {
        return operatorRepository.findAll();
    }

    @Transactional
    public Operator updateOperator(java.util.UUID id, CreateOperatorRequest request) {
        Operator operator = operatorRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Operator not found"));
        operator.setName(request.getName());
        operator.setContactInfo(request.getContactInfo());
        return operatorRepository.save(operator);
    }

    @Transactional
    public void deleteOperator(java.util.UUID id, boolean force) {
        if (force) {
            List<com.awad.ticketbooking.modules.catalog.entity.Bus> buses = busRepository.findByOperatorId(id);
            for (com.awad.ticketbooking.modules.catalog.entity.Bus bus : buses) {
                List<com.awad.ticketbooking.modules.trip.entity.Trip> trips = tripRepository.findByBusId(bus.getId());
                for (com.awad.ticketbooking.modules.trip.entity.Trip trip : trips) {
                    bookingRepository.deleteByTripId(trip.getId());
                }
                tripRepository.deleteByBusId(bus.getId());
            }
            busRepository.deleteByOperatorId(id);
        }
        operatorRepository.deleteById(id);
    }
}
