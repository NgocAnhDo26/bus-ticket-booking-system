-- Add new trip status values to the enum
-- PostgreSQL requires explicit ALTER TYPE to add enum values

ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'DELAYED' AFTER 'SCHEDULED';
ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'BOARDING' AFTER 'DELAYED';
ALTER TYPE trip_status ADD VALUE IF NOT EXISTS 'DEPARTED' AFTER 'BOARDING';
