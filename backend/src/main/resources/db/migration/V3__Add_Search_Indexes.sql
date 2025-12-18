-- V3__Add_Search_Indexes.sql

-- Index for searching trips by price
CREATE INDEX idx_trip_pricing_price ON trip_pricing(price);

-- GIN Index for searching buses by amenities (JSONB)
CREATE INDEX idx_buses_amenities ON buses USING GIN (amenities jsonb_ops);

-- Index for searching stations by city (for origin/destination search)
CREATE INDEX idx_stations_city ON stations(city);

-- Index for trip status
CREATE INDEX idx_trips_status ON trips(status);
