/*
  # Ensure users table has the correct foreign key reference to auth.users

  1. Changes
    - Check and update the foreign key constraint for the users table to reference auth.users properly
*/

DO $$
BEGIN
  -- Check if the foreign key constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_id_fkey'
  ) THEN
    -- Add foreign key reference if it doesn't exist
    ALTER TABLE users 
    ADD CONSTRAINT users_id_fkey
    FOREIGN KEY (id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;