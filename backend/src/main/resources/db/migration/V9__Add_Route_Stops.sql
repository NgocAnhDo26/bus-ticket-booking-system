-- Create route_stops table
CREATE TABLE route_stops (
    id UUID PRIMARY KEY,
    route_id UUID NOT NULL,
    station_id UUID NOT NULL,
    stop_order INTEGER NOT NULL,
    duration_minutes_from_origin INTEGER NOT NULL,
    stop_type VARCHAR(20) NOT NULL DEFAULT 'BOTH',
    CONSTRAINT fk_route_stops_route FOREIGN KEY (route_id) REFERENCES routes(id),
    CONSTRAINT fk_route_stops_station FOREIGN KEY (station_id) REFERENCES stations(id)
);

-- Add pickup and dropoff columns to bookings
ALTER TABLE bookings
ADD COLUMN pickup_station_id UUID,
ADD COLUMN dropoff_station_id UUID;

ALTER TABLE bookings
ADD CONSTRAINT fk_bookings_pickup_station FOREIGN KEY (pickup_station_id) REFERENCES stations(id);

ALTER TABLE bookings
ADD CONSTRAINT fk_bookings_dropoff_station FOREIGN KEY (dropoff_station_id) REFERENCES stations(id);
