-- Add passenger_email column for guest bookings
ALTER TABLE bookings ADD COLUMN passenger_email VARCHAR(255);

-- Make user_id nullable to support guest bookings
ALTER TABLE bookings ALTER COLUMN user_id DROP NOT NULL;
