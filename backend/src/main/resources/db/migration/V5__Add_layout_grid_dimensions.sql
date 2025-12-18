-- Add grid dimensions to bus_layouts table
-- These dimensions define the matrix size for rendering the seat map
-- Empty positions in the matrix are considered unavailable
ALTER TABLE bus_layouts
    ADD COLUMN IF NOT EXISTS total_rows INT,
    ADD COLUMN IF NOT EXISTS total_cols INT;

