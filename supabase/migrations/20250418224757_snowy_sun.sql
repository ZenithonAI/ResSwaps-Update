/*
  # Update users table to add profile fields

  1. Changes
    - Add profile fields to users table:
      - `phone`: Store user's phone number
      - `address`: Store user's address
      - `city`: Store user's city
      - `country`: Store user's country
      - `postal_code`: Store user's postal code
  
  2. Security
    - No changes to RLS policies
*/

-- Add profile fields to users table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'address'
  ) THEN
    ALTER TABLE users ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'city'
  ) THEN
    ALTER TABLE users ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'country'
  ) THEN
    ALTER TABLE users ADD COLUMN country text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE users ADD COLUMN postal_code text;
  END IF;
END $$;