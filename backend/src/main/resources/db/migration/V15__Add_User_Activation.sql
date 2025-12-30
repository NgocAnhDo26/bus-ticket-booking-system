-- Add activation fields to users table
ALTER TABLE users 
ADD COLUMN enabled BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN activation_token VARCHAR(255),
ADD COLUMN activation_token_expiry TIMESTAMP WITH TIME ZONE;

-- Set existing users to enabled
UPDATE users SET enabled = TRUE;
