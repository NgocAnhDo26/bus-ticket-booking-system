-- Add updated_at column to feedbacks table to match BaseEntity
ALTER TABLE feedbacks
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Set existing rows' updated_at to created_at
UPDATE feedbacks
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Make updated_at NOT NULL
ALTER TABLE feedbacks
ALTER COLUMN updated_at SET NOT NULL;
