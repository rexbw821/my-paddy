-- migrations/008_rls_policies.sql
-- Run this in your Supabase SQL Editor AFTER enabling RLS on the reports table

-- 1. Enable RLS on the reports table (if not already done via the UI)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 2. Allow PUBLIC (ANONYMOUS) to insert new reports
-- This allows anyone to submit a report through your app
CREATE POLICY "Allow public submission" 
ON reports 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- 3. Allow PUBLIC (ANONYMOUS) to view ALL approved reports
-- This allows the search function to work via public select
CREATE POLICY "Allow public select on approved reports" 
ON reports 
FOR SELECT 
TO anon 
USING (status = 'approved');

-- 4. Ensure the search_reports RPC maintains security
-- (The RPC was created with SECURITY DEFINER, so it already bypasses RLS using the owner's privileges)
-- This is correct because we handle the 'approved' filtering inside the function logic.

-- 5. Optional: Allow public to see counts in the report_summaries view
-- Since it's a view, it depends on the underlying table policies.
