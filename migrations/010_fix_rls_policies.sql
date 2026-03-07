-- migrations/010_fix_rls_policies.sql
-- Run this in your Supabase SQL Editor to fix the submission error

-- 1. Drop the restrictive policy
DROP POLICY IF EXISTS "Allow public submission" ON reports;

-- 2. Create a broader policy that allows both Anonymous and Authenticated users to submit
-- Using 'public' covers everyone using your app (anon or logged in)
CREATE POLICY "Allow anyone to submit reports" 
ON reports 
FOR INSERT 
TO public 
WITH CHECK (true);

-- 3. Also broaden the select policy just in case
DROP POLICY IF EXISTS "Allow public select on approved reports" ON reports;

CREATE POLICY "Allow anyone to view approved reports" 
ON reports 
FOR SELECT 
TO public 
USING (status = 'approved');
