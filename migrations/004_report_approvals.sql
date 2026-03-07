-- migrations/004_report_approvals.sql
-- Use these snippets for common manual tasks

-- 1. View all PENDING reports
SELECT id, business_name, phone_number, incident_type, created_at, status 
FROM reports 
WHERE status = 'pending' 
ORDER BY created_at DESC;

-- 2. Approve a single report by ID
-- (Replace 'UUID_HERE' with the actual ID from the query above)
UPDATE reports 
SET status = 'approved' 
WHERE id = 'ab457ca5-88b6-43f1-b9b1-10189118f804';

-- 3. Approve ALL reports for a specific target (e.g., 'rex')
UPDATE reports 
SET status = 'approved' 
WHERE business_normalized = 'rex' OR target_normalized = 'rex';

-- 4. Reject/Delete a spam report
DELETE FROM reports 
WHERE id = 'UUID_HERE';
