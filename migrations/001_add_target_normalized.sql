-- 001_add_target_normalized.sql
-- Run this in Supabase SQL Editor to add `target_normalized` column

BEGIN;

ALTER TABLE IF EXISTS scam_reports
  ADD COLUMN IF NOT EXISTS target_normalized TEXT;

-- Populate normalized values: lowercase, remove non-alphanumeric characters
UPDATE scam_reports
SET target_normalized = lower(regexp_replace(target, '[^a-z0-9]+', '', 'gi'))
WHERE target_normalized IS NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_target_normalized ON scam_reports(target_normalized);

COMMIT;

-- Notes:
-- After running this migration, update your application to set `target_normalized`
-- on insert/update. Example normalization in SQL above.
