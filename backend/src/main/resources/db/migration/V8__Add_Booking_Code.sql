-- Add code column
ALTER TABLE bookings ADD COLUMN code VARCHAR(20);

-- Update existing bookings with a random code (using part of ID for uniqueness in this migration context)
-- In postgres, SUBSTRING(CAST(id AS TEXT), 1, 8) gives the first 8 chars of UUID.
UPDATE bookings SET code = UPPER(SUBSTRING(CAST(id AS TEXT), 1, 8)) WHERE code IS NULL;

-- Make it not null and unique
ALTER TABLE bookings ALTER COLUMN code SET NOT NULL;
ALTER TABLE bookings ADD CONSTRAINT uq_bookings_code UNIQUE (code);

-- Create index for fast lookup
CREATE INDEX idx_bookings_code ON bookings(code);
