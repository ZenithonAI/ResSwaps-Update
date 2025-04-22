/*
  # Create storage buckets for user avatars

  1. New Storage
    - Create a storage bucket for user avatars with public access
    - Set up proper security policies for the bucket
*/

-- Check if the bucket exists
DO $$
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'user-avatars'
  ) THEN
    -- Create a new bucket for user avatars
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('user-avatars', 'User Avatars', true);
    
    -- Create policy to allow authenticated users to upload their own avatars
    CREATE POLICY "Users can upload their own avatars"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'user-avatars' AND
      (auth.uid())::text = (storage.foldername(name))[1]
    );
    
    -- Create policy to allow users to update their own avatars
    CREATE POLICY "Users can update their own avatars"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'user-avatars' AND
      (auth.uid())::text = (storage.foldername(name))[1]
    );
    
    -- Create policy to allow public access to avatars
    CREATE POLICY "Public can read avatars"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'user-avatars');
    
    -- Create policy to allow users to delete their own avatars
    CREATE POLICY "Users can delete their own avatars"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'user-avatars' AND
      (auth.uid())::text = (storage.foldername(name))[1]
    );
  END IF;
END $$;