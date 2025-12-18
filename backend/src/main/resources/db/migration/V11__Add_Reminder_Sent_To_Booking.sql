-- Add is_reminder_sent column to bookings table
ALTER TABLE bookings ADD COLUMN is_reminder_sent BOOLEAN DEFAULT FALSE;
