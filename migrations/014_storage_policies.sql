-- migrations/014_storage_policies.sql
-- Run this in Supabase SQL Editor

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidence', 'evidence', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read files (so everyone can see proof)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'evidence' );

-- 3. Allow authenticated users to upload files
-- They can only upload to their own folder: "evidence/<user_id>/filename"
CREATE POLICY "Authenticated users can upload evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'evidence' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow users to delete their own evidence
CREATE POLICY "Users can delete their own evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'evidence' AND
    (storage.foldername(name))[1] = auth.uid()::text
);
