-- Make station_id nullable
ALTER TABLE route_stops
ALTER COLUMN station_id DROP NOT NULL;

-- Add custom_name and custom_address columns
ALTER TABLE route_stops
ADD COLUMN custom_name VARCHAR(255),
ADD COLUMN custom_address VARCHAR(255);

-- Ensure either station_id is present OR custom_name is present (can't be both null)
-- This might be hard to enforce strictly with just a check constraint if we want flexibility, 
-- but logically one should exist. Let's add a check constraint for data integrity.
ALTER TABLE route_stops
ADD CONSTRAINT check_station_or_custom_stop 
CHECK (station_id IS NOT NULL OR custom_name IS NOT NULL);
