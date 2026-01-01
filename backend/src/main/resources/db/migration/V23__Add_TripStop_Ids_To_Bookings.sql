ALTER TABLE bookings
ADD COLUMN pickup_trip_stop_id UUID,
ADD COLUMN dropoff_trip_stop_id UUID;

ALTER TABLE bookings
ADD CONSTRAINT fk_bookings_pickup_trip_stop
FOREIGN KEY (pickup_trip_stop_id)
REFERENCES trip_stops (id);

ALTER TABLE bookings
ADD CONSTRAINT fk_bookings_dropoff_trip_stop
FOREIGN KEY (dropoff_trip_stop_id)
REFERENCES trip_stops (id);
