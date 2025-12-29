CREATE TABLE trip_stops (
    id UUID PRIMARY KEY,
    trip_id UUID NOT NULL,
    station_id UUID NOT NULL,
    stop_order INTEGER NOT NULL,
    duration_minutes_from_origin INTEGER NOT NULL,
    stop_type VARCHAR(20) NOT NULL,
    CONSTRAINT fk_trip_stops_trip FOREIGN KEY (trip_id) REFERENCES trips(id),
    CONSTRAINT fk_trip_stops_station FOREIGN KEY (station_id) REFERENCES stations(id)
);
