-- Add estimated arrival time and per-stop pricing to trip_stops
ALTER TABLE trip_stops ADD COLUMN estimated_arrival_time TIMESTAMP;
ALTER TABLE trip_stops ADD COLUMN normal_price DECIMAL(15, 2);
ALTER TABLE trip_stops ADD COLUMN vip_price DECIMAL(15, 2);

-- Add recurrence fields to trip_schedules
ALTER TABLE trip_schedules ADD COLUMN recurrence_type VARCHAR(20) DEFAULT 'NONE';
ALTER TABLE trip_schedules ADD COLUMN weekly_days VARCHAR(50);
