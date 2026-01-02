-- Add tsvector columns for fulltext search
ALTER TABLE stations ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Function to update station search_vector
-- Using 'simple' config as Vietnamese may not be installed
CREATE OR REPLACE FUNCTION stations_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('simple', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.city, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for stations
DROP TRIGGER IF EXISTS stations_search_vector_trigger ON stations;
CREATE TRIGGER stations_search_vector_trigger
BEFORE INSERT OR UPDATE ON stations
FOR EACH ROW EXECUTE FUNCTION stations_search_vector_update();

-- Function to update route search_vector
CREATE OR REPLACE FUNCTION routes_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('simple', coalesce((SELECT name FROM stations WHERE id = NEW.origin_station_id), '')), 'A') ||
    setweight(to_tsvector('simple', coalesce((SELECT city FROM stations WHERE id = NEW.origin_station_id), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce((SELECT name FROM stations WHERE id = NEW.destination_station_id), '')), 'A') ||
    setweight(to_tsvector('simple', coalesce((SELECT city FROM stations WHERE id = NEW.destination_station_id), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for routes
DROP TRIGGER IF EXISTS routes_search_vector_trigger ON routes;
CREATE TRIGGER routes_search_vector_trigger
BEFORE INSERT OR UPDATE ON routes
FOR EACH ROW EXECUTE FUNCTION routes_search_vector_update();

-- Update existing rows
UPDATE stations SET search_vector = 
  setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(city, '')), 'B');

UPDATE routes SET search_vector = 
  setweight(to_tsvector('simple', coalesce((SELECT name FROM stations WHERE id = origin_station_id), '')), 'A') ||
  setweight(to_tsvector('simple', coalesce((SELECT city FROM stations WHERE id = origin_station_id), '')), 'B') ||
  setweight(to_tsvector('simple', coalesce((SELECT name FROM stations WHERE id = destination_station_id), '')), 'A') ||
  setweight(to_tsvector('simple', coalesce((SELECT city FROM stations WHERE id = destination_station_id), '')), 'B');

-- Create GIN indexes for fast fulltext search
CREATE INDEX IF NOT EXISTS idx_stations_search_vector ON stations USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_routes_search_vector ON routes USING GIN(search_vector);
