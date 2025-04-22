/*
  # Add users insert policy

  1. Security
    - Add policy allowing users to insert their own profile 
    - This fixes the RLS policy error on registration
*/

DO $$
BEGIN
  -- Check if the policy exists before creating it
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can create their own profile'
  ) THEN
    CREATE POLICY "Users can create their own profile"
      ON users
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;