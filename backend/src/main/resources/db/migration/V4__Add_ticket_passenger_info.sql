-- Add per-ticket passenger details so each ticket can belong to a specific traveler
ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS passenger_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS passenger_phone VARCHAR(20);

-- Backfill existing rows (if any) to avoid null constraint issues
UPDATE tickets
SET passenger_name = COALESCE(passenger_name, 'UNKNOWN'),
    passenger_phone = COALESCE(passenger_phone, 'UNKNOWN');

ALTER TABLE tickets
    ALTER COLUMN passenger_name SET NOT NULL,
    ALTER COLUMN passenger_phone SET NOT NULL;

