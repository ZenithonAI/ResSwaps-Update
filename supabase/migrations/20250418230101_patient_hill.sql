/*
  # User profile schema

  1. Tables
    - Ensure `users` table exists with all necessary fields
  2. Security
    - Enable RLS on `users` table
    - Safely create policies for user data access
*/

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies safely by checking if they exist first
DO $$
BEGIN
  -- Check if "Users can read their own data" policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can read their own data'
  ) THEN
    CREATE POLICY "Users can read their own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
  
  -- Check if "Users can update their own data" policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can update their own data'
  ) THEN
    CREATE POLICY "Users can update their own data"
      ON users
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id);
  END IF;
  
  -- Check if "Users can read other users' basic data" policy exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can read other users'' basic data'
  ) THEN
    CREATE POLICY "Users can read other users' basic data"
      ON users
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;