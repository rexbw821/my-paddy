-- migrations/011_repair_evidence_schema.sql
-- Run this in your Supabase SQL Editor to fix the "uploader_id does not exist" error

-- 1. Check and add uploader_id if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='evidence' AND column_name='uploader_id') THEN
        ALTER TABLE evidence ADD COLUMN uploader_id UUID REFERENCES profiles(id);
    END IF;
END $$;

-- 2. Drop and recreate the policy to ensure it uses the correct column
DROP POLICY IF EXISTS "Authenticated users can upload evidence" ON evidence;

CREATE POLICY "Authenticated users can upload evidence" ON evidence
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = uploader_id);
