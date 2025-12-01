package com.awad.ticketbooking.modules.catalog.service;

import com.awad.ticketbooking.modules.catalog.dto.CreateStationRequest;
import com.awad.ticketbooking.modules.catalog.entity.Station;
import com.awad.ticketbooking.modules.catalog.repository.StationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StationService {

    private final StationRepository stationRepository;

    @Transactional
    public Station createStation(CreateStationRequest request) {
        Station station = new Station();
        station.setName(request.getName());
        station.setCity(request.getCity());
        station.setAddress(request.getAddress());
        return stationRepository.save(station);
    }

    public List<Station> getAllStations() {
        return stationRepository.findAll();
    }
}
