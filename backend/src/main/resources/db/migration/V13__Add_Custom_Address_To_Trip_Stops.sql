-- Add custom_name and custom_address columns to trip_stops for free address stops
-- Also make station_id nullable since stops can now have custom address instead of station reference

ALTER TABLE trip_stops 
    ALTER COLUMN station_id DROP NOT NULL;

ALTER TABLE trip_stops 
    ADD COLUMN custom_name VARCHAR(255);

ALTER TABLE trip_stops 
    ADD COLUMN custom_address VARCHAR(500);

-- Add check constraint: either station_id or custom_address must be provided
ALTER TABLE trip_stops 
    ADD CONSTRAINT chk_trip_stops_has_location 
    CHECK (station_id IS NOT NULL OR custom_address IS NOT NULL);
