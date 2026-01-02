package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.catalog.dto.CreateBusRequest;
import com.awad.ticketbooking.modules.catalog.entity.Bus;
import com.awad.ticketbooking.modules.catalog.entity.BusPhoto;
import com.awad.ticketbooking.modules.catalog.entity.Operator;
import com.awad.ticketbooking.modules.catalog.repository.BusLayoutRepository;
import com.awad.ticketbooking.modules.catalog.repository.BusPhotoRepository;
import com.awad.ticketbooking.modules.catalog.repository.BusRepository;
import com.awad.ticketbooking.modules.catalog.repository.OperatorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BusService {

    private final BusRepository busRepository;
    private final OperatorRepository operatorRepository;
    private final BusLayoutRepository busLayoutRepository;
    private final BusPhotoRepository busPhotoRepository;
    private final com.awad.ticketbooking.modules.trip.repository.TripRepository tripRepository;
    private final com.awad.ticketbooking.modules.booking.repository.BookingRepository bookingRepository;

    @Transactional
    public Bus createBus(CreateBusRequest request) {
        Operator operator = operatorRepository.findById(request.getOperatorId())
                .orElseThrow(() -> new RuntimeException("Operator not found"));
        com.awad.ticketbooking.modules.catalog.entity.BusLayout busLayout = busLayoutRepository
                .findById(request.getBusLayoutId())
                .orElseThrow(() -> new RuntimeException("Bus layout not found"));

        Bus bus = new Bus();
        bus.setOperator(operator);
        bus.setBusLayout(busLayout);
        bus.setPlateNumber(request.getPlateNumber());
        bus.setAmenities(request.getAmenities());

        bus = busRepository.save(bus);

        // Handle photos if provided
        if (request.getPhotos() != null && !request.getPhotos().isEmpty()) {
            List<BusPhoto> photos = new ArrayList<>();
            for (int i = 0; i < request.getPhotos().size(); i++) {
                BusPhoto photo = new BusPhoto();
                photo.setBus(bus);
                photo.setPublicId(request.getPhotos().get(i));
                photo.setDisplayOrder(i);
                photo.setIsPrimary(i == 0); // First photo is primary
                photos.add(photo);
            }
            busPhotoRepository.saveAll(photos);
            bus.setPhotos(photos);
        }

        return bus;
    }

    @Transactional
    public Bus updateBus(java.util.UUID id, CreateBusRequest request) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus not found"));

        Operator operator = operatorRepository.findById(request.getOperatorId())
                .orElseThrow(() -> new RuntimeException("Operator not found"));
        com.awad.ticketbooking.modules.catalog.entity.BusLayout busLayout = busLayoutRepository
                .findById(request.getBusLayoutId())
                .orElseThrow(() -> new RuntimeException("Bus layout not found"));

        bus.setOperator(operator);
        bus.setBusLayout(busLayout);
        bus.setPlateNumber(request.getPlateNumber());
        bus.setAmenities(request.getAmenities());

        // Handle photos: clear existing and add new ones (don't replace the collection
        // reference!)
        bus.getPhotos().clear();

        if (request.getPhotos() != null && !request.getPhotos().isEmpty()) {
            for (int i = 0; i < request.getPhotos().size(); i++) {
                BusPhoto photo = new BusPhoto();
                photo.setBus(bus);
                photo.setPublicId(request.getPhotos().get(i));
                photo.setDisplayOrder(i);
                photo.setIsPrimary(i == 0); // First photo is primary
                bus.getPhotos().add(photo);
            }
        }

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
    public Bus getBusById(java.util.UUID id) {
        Bus bus = busRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Bus not found"));
        // Initialize lazy-loaded collections for API response
        org.hibernate.Hibernate.initialize(bus.getPhotos());
        org.hibernate.Hibernate.initialize(bus.getOperator());
        org.hibernate.Hibernate.initialize(bus.getBusLayout());
        return bus;
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<Bus> getAllBuses(org.springframework.data.domain.Pageable pageable) {
        return busRepository.findAll(pageable);
    }
}
