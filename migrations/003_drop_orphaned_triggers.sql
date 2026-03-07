-- migrations/003_drop_orphaned_triggers.sql
-- Run this in your Supabase SQL Editor to fix the approval error

-- 1. Drop the trigger that attempts to sync with the deleted 'flags' table
DROP TRIGGER IF EXISTS trigger_update_flags ON reports;

-- 2. Drop the orphaned function that was called by the trigger
DROP FUNCTION IF EXISTS update_flags();
